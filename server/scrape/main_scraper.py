import sys
from pathlib import Path

# Add the root directory to sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root_dir))

import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from server.scrape.geocoding import geocode_address_google
from server.scrape.process_operating_hours import process_operating_hours
from server.db.db_manager import DatabaseManager
from config import DB_CONFIG, SCRAPER_CONFIG

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def scrape_subway_outlets():
    logger.info("Starting the scraping process")
    driver = webdriver.Chrome()
    driver.get(SCRAPER_CONFIG['url'])
    logger.info(f"Opened URL: {SCRAPER_CONFIG['url']}")
    
    try:
        search_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "fp_searchAddress"))
        )
        search_input.send_keys(SCRAPER_CONFIG['search_term'])
        logger.info(f"Entered search term: {SCRAPER_CONFIG['search_term']}")
        
        search_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "fp_searchAddressBtn"))
        )
        search_button.click()
        logger.info("Clicked search button")
        
        time.sleep(5)  # Wait for results to load
        logger.info("Waiting for results to load")
        
        outlets_data = []
        operating_hours_data = []
        outlets = driver.find_elements(By.XPATH, "//div[contains(@class, 'fp_listitem') and not(contains(@style, 'display: none'))]")
        logger.info(f"Found {len(outlets)} outlets")
        
        for index, outlet in enumerate(outlets, 1):
            name = outlet.find_element(By.XPATH, ".//h4").text.strip()

            # Get all <p> elements inside the infoboxcontent
            paragraphs = outlet.find_elements(By.XPATH, ".//div[@class='infoboxcontent']/p")

            address = None
            hours = []
            is_reading_hours = False  # Flag to track when to collect operating hours

            for p in paragraphs:
                text = p.text.strip()

                if not text:
                    if hours:  # Closing an existing operating hours block
                        is_reading_hours = False
                    else:  # Empty <p> before operating hours
                        is_reading_hours = True
                    continue

                if is_reading_hours:
                    hours.append(text)  # Collect operating hours
                elif address is None:
                    address = text  # First non-empty <p> is address

            operating_hours = "\n".join(hours) if hours else None  # Join multi-line hours

            waze_link = outlet.find_elements(By.XPATH, ".//div[contains(@class, 'directionButton')]//a")[1].get_attribute("href") if len(outlet.find_elements(By.XPATH, ".//div[contains(@class, 'directionButton')]//a")) > 1 else None

            # Geocode the address
            latitude, longitude = geocode_address_google(address) if address else (None, None)

            # Append outlet data
            outlets_data.append({
                'name': name,
                'address': address,
                'raw_operating_hours': operating_hours,
                'waze_link': waze_link,
                'latitude': latitude,
                'longitude': longitude
            })

            # Process operating hours and append to operating_hours_data
            if operating_hours:
                processed_hours = process_operating_hours(name, operating_hours)
                operating_hours_data.extend(processed_hours)

            logger.info(f"Scraped outlet {index}: {name}")

        logger.info("Finished scraping all outlets")
        return outlets_data, operating_hours_data
    finally:
        driver.quit()
        logger.info("Closed the web driver")

def save_to_database(outlets_data, operating_hours_data):
    """Save the scraped data to PostgreSQL database using SQLAlchemy"""
    logger.info("Saving data to PostgreSQL database using SQLAlchemy")
    
    db_manager = DatabaseManager(**DB_CONFIG)
    
    try:
        # Connect to the database
        db_manager.connect()
        
        # Ensure tables exist
        db_manager.create_tables()
        
        # Insert outlets and get mapping of outlet names to IDs
        outlet_id_map = db_manager.insert_outlets(outlets_data)
        
        # Insert operating hours
        if operating_hours_data:
            db_manager.insert_operating_hours(operating_hours_data, outlet_id_map)
        
        logger.info("Successfully saved all data to the database")
    except Exception as e:
        logger.error(f"Error saving data to database: {e}")
        raise
    finally:
        db_manager.close()

if __name__ == "__main__":
    try:
        outlets_data, operating_hours_data = scrape_subway_outlets()
        
        if outlets_data:
            logger.info(f"Successfully scraped {len(outlets_data)} outlets")
            
            if operating_hours_data:
                logger.info(f"Successfully processed {len(operating_hours_data)} operating hours")
                
            # Save data to database
            save_to_database(outlets_data, operating_hours_data)
        else:
            logger.warning("No outlets were scraped")
    except Exception as e:
        logger.error(f"An error occurred during script execution: {e}")