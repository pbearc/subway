import logging
from typing import List, Dict, Any, Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from server.db.models import Base, Outlet, OperatingHours

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Manages database operations for Subway outlets and operating hours using SQLAlchemy."""
    
    def __init__(self, **connection_params):
        """Initialize database connection parameters."""
        db_url = f"postgresql://{connection_params.get('user')}:{connection_params.get('password')}@{connection_params.get('host')}:{connection_params.get('port')}/{connection_params.get('dbname')}"
        self.engine = create_engine(db_url)
        self.SessionFactory = sessionmaker(bind=self.engine)
        self.session = None
    
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
    
    def create_tables(self):
        """Create all tables defined in the models."""
        Base.metadata.create_all(self.engine)
        logger.info("Created database tables")
    
    def connect(self):
        """Establish connection to the database."""
        try:
            self.session = self.SessionFactory()
            logger.info("Successfully connected to the database")
        except SQLAlchemyError as e:
            logger.error(f"Error connecting to the database: {e}")
            raise
    
    def close(self):
        """Close database connection."""
        if self.session:
            self.session.close()
            self.session = None
            logger.info("Database connection closed")
    
    def insert_outlets(self, outlets_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Insert outlets data into the outlets table.
        
        Args:
            outlets_data: List of outlet dictionaries
            
        Returns:
            Dictionary mapping outlet names to their IDs in the database
        """
        if not self.session:
            self.connect()
            
        outlet_ids = {}
        
        try:
            for outlet_data in outlets_data:
                name = outlet_data['name']
                
                # Check if outlet already exists
                existing_outlet = self.session.query(Outlet).filter(Outlet.name == name).first()
                
                if existing_outlet:
                    # Update existing outlet
                    existing_outlet.address = outlet_data.get('address', '')
                    existing_outlet.raw_operating_hours = outlet_data.get('raw_operating_hours')
                    existing_outlet.waze_link = outlet_data.get('waze_link')
                    existing_outlet.latitude = outlet_data.get('latitude')
                    existing_outlet.longitude = outlet_data.get('longitude')
                    outlet_ids[name] = existing_outlet.id
                else:
                    # Create new outlet
                    new_outlet = Outlet(
                        name=name,
                        address=outlet_data.get('address', ''),
                        raw_operating_hours=outlet_data.get('raw_operating_hours'),
                        waze_link=outlet_data.get('waze_link'),
                        latitude=outlet_data.get('latitude'),
                        longitude=outlet_data.get('longitude')
                    )
                    self.session.add(new_outlet)
                    # Flush to get the ID without committing
                    self.session.flush()
                    outlet_ids[name] = new_outlet.id
            
            self.session.commit()
            logger.info(f"Successfully inserted/updated {len(outlets_data)} outlets")
            
            return outlet_ids
        except SQLAlchemyError as e:
            self.session.rollback()
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
        if not self.session:
            self.connect()
            
        try:
            # Group operating hours by outlet name for more efficient processing
            outlet_hours = {}
            for record in operating_hours_data:
                outlet_name = record['outlet_name']
                if outlet_name not in outlet_hours:
                    outlet_hours[outlet_name] = []
                outlet_hours[outlet_name].append(record)
            
            total_records = 0
            
            # Process each outlet separately
            for outlet_name, records in outlet_hours.items():
                if outlet_name not in outlet_id_map:
                    logger.warning(f"Outlet {outlet_name} not found in outlet_id_map, skipping hours")
                    continue
                    
                outlet_id = outlet_id_map[outlet_name]
                
                # Delete existing operating hours for this outlet
                self.session.query(OperatingHours).filter(OperatingHours.outlet_id == outlet_id).delete()
                
                # Insert new operating hours
                for record in records:
                    op_hour = OperatingHours(
                        outlet_id=outlet_id,
                        day_of_week=record['day_of_week'],
                        opening_time=record.get('opening_time'),
                        closing_time=record.get('closing_time'),
                        is_closed=record.get('is_closed', False)
                    )
                    self.session.add(op_hour)
                    total_records += 1
            
            self.session.commit()
            logger.info(f"Successfully inserted {total_records} operating hours records in total")
            return total_records
        except SQLAlchemyError as e:
            self.session.rollback()
            logger.error(f"Error inserting operating hours data: {e}")
            raise