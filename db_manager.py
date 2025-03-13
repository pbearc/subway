import psycopg2
from psycopg2.extras import execute_values
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Manages database operations for Subway outlets and operating hours."""
    
    def __init__(self, **connection_params):
        """Initialize database connection parameters."""
        self.connection_params = connection_params
        self.conn = None
        self.cursor = None
    
    def __enter__(self):
        """Context manager entry point - connect to the database."""
        self.connect()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit point - ensure connection is closed."""
        self.close()
        if exc_type is not None:
            logger.error(f"An error occurred: {exc_val}")
            return False  # Re-raise the exception
    
    def connect(self):
        """Establish connection to the database."""
        try:
            self.conn = psycopg2.connect(**self.connection_params)
            self.cursor = self.conn.cursor()
            logger.info("Successfully connected to the database")
        except Exception as e:
            logger.error(f"Error connecting to the database: {e}")
            raise
    
    def close(self):
        """Close database connection."""
        if self.cursor:
            self.cursor.close()
            self.cursor = None
        if self.conn:
            self.conn.close()
            self.conn = None
            logger.info("Database connection closed")
    
    def insert_outlets(self, outlets_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Insert outlets data into the outlets table.
        
        Args:
            outlets_data: List of outlet dictionaries
            
        Returns:
            Dictionary mapping outlet names to their IDs in the database
        """
        if not self.conn or not self.cursor:
            self.connect()
            
        outlet_ids = {}
        
        try:
            insert_query = """
                INSERT INTO outlets (name, address, raw_operating_hours, waze_link, latitude, longitude)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (name) DO UPDATE 
                SET 
                    address = EXCLUDED.address,
                    raw_operating_hours = EXCLUDED.raw_operating_hours,
                    waze_link = EXCLUDED.waze_link,
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id, name
            """
            
            for outlet in outlets_data:
                name = outlet['name']
                
                self.cursor.execute(insert_query, (
                    name,
                    outlet.get('address', ''),  # Default to empty string if None
                    outlet.get('raw_operating_hours'),
                    outlet.get('waze_link'),
                    outlet.get('latitude'),
                    outlet.get('longitude')
                ))
                outlet_id, outlet_name = self.cursor.fetchone()
                outlet_ids[outlet_name] = outlet_id
                
            self.conn.commit()
            logger.info(f"Successfully inserted/updated {len(outlets_data)} outlets")
            
            return outlet_ids
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Error inserting outlets data: {e}")
            raise
    
    def insert_operating_hours(self, operating_hours_data: List[Dict[str, Any]], outlet_id_map: Dict[str, int]) -> int:
        """
        Insert operating hours data into the operating_hours table.
        
        Args:
            operating_hours_data: List of operating hours dictionaries
            outlet_id_map: Dictionary mapping outlet names to their IDs
            
        Returns:
            Number of inserted records
        """
        if not self.conn or not self.cursor:
            self.connect()
            
        try:
            # Clear existing operating hours before inserting new ones
            for outlet_name, outlet_id in outlet_id_map.items():
                self.cursor.execute("DELETE FROM operating_hours WHERE outlet_id = %s", (outlet_id,))
            
            # Prepare batch insertion data
            values = []
            for record in operating_hours_data:
                outlet_name = record['outlet_name']
                if outlet_name in outlet_id_map:
                    values.append((
                        outlet_id_map[outlet_name],
                        record['day_of_week'],
                        record.get('opening_time'),
                        record.get('closing_time'),
                        record.get('is_closed', False)
                    ))
            
            # Using execute_values for better performance
            insert_query = """
                INSERT INTO operating_hours (outlet_id, day_of_week, opening_time, closing_time, is_closed)
                VALUES %s
            """
            
            execute_values(self.cursor, insert_query, values)
            self.conn.commit()
            logger.info(f"Successfully inserted {len(values)} operating hours records")
            return len(values)
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Error inserting operating hours data: {e}")
            raise