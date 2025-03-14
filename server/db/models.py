from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class Outlet(Base):
    __tablename__ = 'outlets'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), unique=True, nullable=False)
    address = Column(Text)
    raw_operating_hours = Column(Text)
    waze_link = Column(String(500))
    latitude = Column(Float)
    longitude = Column(Float)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Outlet(name='{self.name}', address='{self.address}')>"

class OperatingHours(Base):
    __tablename__ = 'operating_hours'
    
    id = Column(Integer, primary_key=True)
    outlet_id = Column(Integer, ForeignKey('outlets.id'), nullable=False)
    day_of_week = Column(String(10), nullable=False)
    opening_time = Column(String(10))
    closing_time = Column(String(10))
    is_closed = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        if self.is_closed:
            return f"<OperatingHours(day='{self.day_of_week}', closed=True)>"
        return f"<OperatingHours(day='{self.day_of_week}', hours='{self.opening_time}-{self.closing_time}')>"