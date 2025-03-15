# server/chatbot/db_loader.py
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import pandas as pd
import json
from typing import Dict, List

class DatabaseLoader:
    def __init__(self, db_url):
        self.engine = create_engine(db_url)
        self.Session = sessionmaker(bind=self.engine)
        
    def load_outlets(self) -> List[Dict]:
        """Load all outlets with their operating hours."""
        session = self.Session()
        try:
            query = text("""
                SELECT 
                    o.id, 
                    o.name, 
                    o.address, 
                    o.waze_link, 
                    o.latitude, 
                    o.longitude,
                    oh.day_of_week,
                    oh.opening_time,
                    oh.closing_time,
                    oh.is_closed
                FROM outlets o
                LEFT JOIN operating_hours oh ON o.id = oh.outlet_id
            """)
            
            result = session.execute(query)
            
            # Process into a list of outlets with nested operating hours
            outlets_dict = {}
            for row in result:
                outlet_id = row[0]
                if outlet_id not in outlets_dict:
                    outlets_dict[outlet_id] = {
                        "id": row[0],
                        "name": row[1],
                        "address": row[2],
                        "waze_link": row[3],
                        "latitude": float(row[4]) if row[4] else None,
                        "longitude": float(row[5]) if row[5] else None,
                        "operating_hours": []
                    }
                
                # Add operating hours
                if row[6]:  # If day_of_week exists
                    outlets_dict[outlet_id]["operating_hours"].append({
                        "day_of_week": row[6],
                        "opening_time": str(row[7]) if row[7] else None,
                        "closing_time": str(row[8]) if row[8] else None,
                        "is_closed": row[9]
                    })
            
            return list(outlets_dict.values())
        finally:
            session.close()
            
    def save_to_json(self, filename="outlets_data.json"):
        """Save the database contents to a JSON file for RAG."""
        outlets = self.load_outlets()
        
        with open(filename, 'w') as f:
            json.dump(outlets, f, indent=2)
            
        return filename