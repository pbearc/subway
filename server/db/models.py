from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey, DateTime, Text, Time
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class Outlet(Base):
    __tablename__ = 'outlets'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)  # Changed from String(255) to String(100)
    address = Column(Text)
    raw_operating_hours = Column(Text)
    waze_link = Column(Text)  # Changed from String(500) to Text
    latitude = Column(Numeric(10, 8))  # Changed from Float to Numeric(10, 8)
    longitude = Column(Numeric(11, 8))  # Changed from Float to Numeric(11, 8)
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # Added timezone
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())  # Added timezone
    
    def __repr__(self):
        return f"<Outlet(name='{self.name}', address='{self.address}')>"

class OperatingHours(Base):
    __tablename__ = 'operating_hours'
    
    id = Column(Integer, primary_key=True)
    outlet_id = Column(Integer, ForeignKey('outlets.id', ondelete='CASCADE'), nullable=False)  # Added ondelete='CASCADE'
    day_of_week = Column(String(20), nullable=False)
    opening_time = Column(Time)  # Changed from String(10) to Time
    closing_time = Column(Time)  # Changed from String(10) to Time
    is_closed = Column(Boolean, default=False)
    # Removed created_at and updated_at columns since they're not in your database
    
    def __repr__(self):
        if self.is_closed:
            return f"<OperatingHours(day='{self.day_of_week}', closed=True)>"
        return f"<OperatingHours(day='{self.day_of_week}', hours='{self.opening_time}-{self.closing_time}')>"