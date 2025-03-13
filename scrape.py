#!/usr/bin/env python3
"""
Subway Outlet Scraper - Scrapes Subway outlet information and saves it to a database
"""
import logging
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from typing import Tuple, List, Dict, Any, Optional

# Import local modules
from db_manager import DatabaseManager
from geocoding import geocode_address_google
from process_operating_hours import process_operating_hours
from config import DB_CONFIG, SCRAPER_CONFIG

# Configure logging
def setup_logging(log_to_file: bool = False):
    """Set up logging configuration"""
    handlers = [logging.StreamHandler(sys.stdout)]
    
    if log_to_file:
        handlers.append(logging.FileHandler('subway_scraper.log'))
        
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=handlers
    )

# Initialize logger
logger = logging.getLogger(__name__)

class SubwayScraper:
    """Scraper for Subway outlet information"""
    
    def __init__(self, url: str, search_term: str):
        """Initialize the scraper with URL and search term"""
        self.url = url
        self.search_term = search_term
        self.driver = None
        
    def __enter__(self):
        """Setup webdriver when entering context"""
        self.driver = webdriver.Chrome()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Ensure driver is closed when exiting context"""
        if self.driver:
            self.driver.quit()
            logger.info("WebDriver closed")
            
    def scrape(self) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Scrape Subway outlets and return structured data
        
        Returns:
            Tuple containing (outlets_data, operating_hours_data)
        """
        logger.info("Starting the scraping process")
        self.driver.get(self.url)
        logger.info(f"Opened URL: {self.url}")
        
        try:
            # Search for outlets
            search_input = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "fp_searchAddress"))
            )
            search_input.send_keys(self.search_term)
            logger.info(f"Entered search term: {self.search_term}")
            
            search_button = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.ID, "fp_searchAddressBtn"))
            )
            search_button.click()
            logger.info("Clicked search button")
            
            # Wait for results to load
            time.sleep(5)
            logger.info("Waiting for results to load")
            
            # Find all outlets
            outlets = self.driver.find_elements(By.XPATH, 
                "//div[contains(@class, 'fp_listitem') and not(contains(@style, 'display: none'))]")
            logger.info(f"Found {len(outlets)} outlets")
            
            if not outlets:
                logger.warning("No outlets found. Check the search term or website structure.")
                return [], []
                
            return self._process_outlets(outlets)
            
        except TimeoutException:
            logger.error("Timeout waiting for page elements")
            return [], []
        except NoSuchElementException as e:
            logger.error(f"Element not found: {e}")
            return [], []
        except Exception as e:
            logger.error(f"Unexpected error during scraping: {e}")
            return [], []
            
    def _process_outlets(self, outlets) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Process outlet elements and extract data"""
        outlets_data = []
        operating_hours_data = []
        
        for index, outlet in enumerate(outlets, 1):
            try:
                name = outlet.find_element(By.XPATH, ".//h4").text.strip()
                
                # Get all <p> elements inside the infoboxcontent
                paragraphs = outlet.find_elements(By.XPATH, ".//div[@class='infoboxcontent']/p")
                
                address = None
                hours = []
                is_reading_hours = False
                
                for p in paragraphs:
                    text = p.text.strip()
                    
                    if not text:
                        if hours:
                            is_reading_hours = False
                        else:
                            is_reading_hours = True
                        continue
                    
                    if is_reading_hours:
                        hours.append(text)
                    elif address is None:
                        address = text
                
                operating_hours = "\n".join(hours) if hours else None
                
                # Get Waze link if available
                waze_links = outlet.find_elements(By.XPATH, ".//div[contains(@class, 'directionButton')]//a")
                waze_link = waze_links[1].get_attribute("href") if len(waze_links) > 1 else None
                
                # Geocode the address
                latitude, longitude = None, None
                if address:
                    try:
                        latitude, longitude = geocode_address_google(address)
                    except Exception as e:
                        logger.warning(f"Geocoding failed for {name}: {e}")
                
                # Append outlet data
                outlets_data.append({
                    'name': name,
                    'address': address,
                    'raw_operating_hours': operating_hours,
                    'waze_link': waze_link,
                    'latitude': latitude,
                    'longitude': longitude
                })
                
                # Process operating hours
                if operating_hours:
                    try:
                        processed_hours = process_operating_hours(name, operating_hours)
                        operating_hours_data.extend(processed_hours)
                    except Exception as e:
                        logger.warning(f"Error processing hours for {name}: {e}")
                
                logger.info(f"Scraped outlet {index}: {name}")
                
            except Exception as e:
                logger.error(f"Error processing outlet {index}: {e}")
                continue
                
        return outlets_data, operating_hours_data

def save_to_database(outlets_data, operating_hours_data):
    """Save the scraped data to PostgreSQL database"""
    logger.info("Saving data to PostgreSQL database")
    
    try:
        with DatabaseManager(**DB_CONFIG) as db_manager:
            # Insert outlets and get mapping of outlet names to IDs
            outlet_id_map = db_manager.insert_outlets(outlets_data)
            
            # Insert operating hours
            num_records = db_manager.insert_operating_hours(operating_hours_data, outlet_id_map)
            
            logger.info(f"Successfully saved {len(outlets_data)} outlets and {num_records} operating hours")
            return True
    except Exception as e:
        logger.error(f"Error saving data to database: {e}")
        return False

def main():
    """Main function to run the scraper"""
    setup_logging(log_to_file=True)
    logger.info("Starting Subway outlet scraper")
    
    try:
        with SubwayScraper(SCRAPER_CONFIG["url"], SCRAPER_CONFIG["search_term"]) as scraper:
            outlets_data, operating_hours_data = scraper.scrape()
            
            if outlets_data:
                logger.info(f"Successfully scraped {len(outlets_data)} outlets")
                
                if operating_hours_data:
                    logger.info(f"Successfully processed {len(operating_hours_data)} operating hours")
                    
                # Save data to database
                success = save_to_database(outlets_data, operating_hours_data)
                
                if success:
                    logger.info("Data successfully saved to database")
                else:
                    logger.error("Failed to save data to database")
            else:
                logger.warning("No outlets were scraped")
                
    except Exception as e:
        logger.error(f"An error occurred during script execution: {e}")
        return 1
        
    return 0

if __name__ == "__main__":
    sys.exit(main())