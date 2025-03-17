import sys
import os
from pathlib import Path

# Determine the correct paths
current_dir = Path(__file__).resolve().parent  # server/scrape
server_dir = current_dir.parent  # server
project_root = server_dir.parent  # project root

# Add needed directories to path
sys.path.append(str(project_root))
sys.path.append(str(server_dir))

import logging
from db.db_manager import DatabaseManager
from db.models import Outlet, OperatingHours
from process_operating_hours import process_operating_hours

# Import config from project root
sys.path.insert(0, str(project_root))
from config import DB_CONFIG

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def update_operating_hours():
    """
    Update operating hours based on raw_operating_hours data in outlets table
    without scraping again
    """
    logger.info("Starting the operating hours update process")
    
    # Connect to database
    db_manager = DatabaseManager(**DB_CONFIG)
    
    try:
        db_manager.connect()
        outlets = db_manager.session.query(Outlet).filter(Outlet.raw_operating_hours != None).all()
        logger.info(f"Found {len(outlets)} outlets with operating hours data")
        
        outlet_id_map = {}
        operating_hours_data = []
        
        for outlet in outlets:
            outlet_id = outlet.id
            outlet_name = outlet.name
            raw_hours = outlet.raw_operating_hours
            
            if not raw_hours or raw_hours.strip() == '':
                logger.warning(f"Outlet '{outlet_name}' has empty operating hours, skipping")
                continue
                
            logger.info(f"Processing hours for outlet: {outlet_name}")
            
            processed_hours = process_operating_hours(outlet_name, raw_hours)
            outlet_id_map[outlet_name] = outlet_id
            operating_hours_data.extend(processed_hours)
            
            logger.info(f"Processed {len(processed_hours)} hour records for {outlet_name}")
            
        # Delete existing operating hours
        db_manager.session.query(OperatingHours).delete()
        logger.info("Deleted existing operating hours records")
            
        # Insert operating hours
        total_records = db_manager.insert_operating_hours(operating_hours_data, outlet_id_map)
        
        # Commit the changes
        db_manager.session.commit()
        
        logger.info(f"Successfully inserted {total_records} operating hours records")
        
    except Exception as e:
        logger.error(f"Error updating operating hours: {e}")
        db_manager.session.rollback()
        raise
    finally:
        db_manager.close()
        logger.info("Database connection closed")

if __name__ == "__main__":
    try:
        update_operating_hours()
        logger.info("Operating hours update completed successfully")
    except Exception as e:
        logger.error(f"Failed to update operating hours: {e}")
        sys.exit(1)