import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import csv
from geocoding import geocode_address_google
from process_operating_hours import process_operating_hours  # Import the processing function

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

URL = "https://subway.com.my/find-a-subway"
SEARCH_TERM = "Kuala Lumpur"
OUTLETS_CSV_FILENAME = 'outlets.csv'
OPERATING_HOURS_CSV_FILENAME = 'operating_hours.csv'

def scrape_subway_outlets():
    logger.info("Starting the scraping process")
    driver = webdriver.Chrome()
    driver.get(URL)
    logger.info(f"Opened URL: {URL}")
    
    try:
        search_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "fp_searchAddress"))
        )
        search_input.send_keys(SEARCH_TERM)
        logger.info(f"Entered search term: {SEARCH_TERM}")
        
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

def save_to_csv(data, filename, fieldnames):
    logger.info(f"Saving data to {filename}")
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    logger.info(f"Saved data to {filename}")

if __name__ == "__main__":
    outlets_data, operating_hours_data = scrape_subway_outlets()
    if outlets_data:
        logger.info(f"Successfully scraped {len(outlets_data)} outlets")
        save_to_csv(outlets_data, OUTLETS_CSV_FILENAME, fieldnames=['name', 'raw_operating_hours', 'address', 'waze_link', 'latitude', 'longitude'])
    else:
        logger.warning("No outlets were scraped")
    if operating_hours_data:
        logger.info(f"Successfully processed {len(operating_hours_data)} operating hours")
        save_to_csv(operating_hours_data, OPERATING_HOURS_CSV_FILENAME, fieldnames=['outlet_name', 'day_of_week', 'opening_time', 'closing_time', 'is_closed'])
    else:
        logger.warning("No outlets or operating hours were scraped")