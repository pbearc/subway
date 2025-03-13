from sqlalchemy import (
    Column,
    Integer,
    String,
    Time,
    DECIMAL,
    TIMESTAMP,
    ForeignKey,
    CheckConstraint,
    func,
)
from sqlalchemy.orm import relationship
from db import Base  # Assuming you have a Base class for SQLAlchemy models

# Constants for days of the week
DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

class Outlet(Base):
    __tablename__ = "outlets"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    address = Column(String, nullable=False)
    waze_link = Column(String)
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Define the relationship to OperatingHour
    operating_hours = relationship("OperatingHour", back_populates="outlet", cascade="all, delete-orphan")

    def __repr__(self):
        return f"Outlet(id={self.id}, name='{self.name}', address='{self.address}')"

class OperatingHour(Base):
    __tablename__ = "operating_hours"

    id = Column(Integer, primary_key=True)
    outlet_id = Column(Integer, ForeignKey("outlets.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 1=Tuesday, ..., 6=Sunday
    start_time = Column(Time)
    end_time = Column(Time)
    is_closed = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Define the relationship to Outlet
    outlet = relationship("Outlet", back_populates="operating_hours")

    def __repr__(self):
        return f"OperatingHour(id={self.id}, outlet_id={self.outlet_id}, day_of_week={DAYS_OF_WEEK[self.day_of_week]}, start_time='{self.start_time}', end_time='{self.end_time}')"

    # Add a check constraint for day_of_week
    __table_args__ = (CheckConstraint("day_of_week >= 0 AND day_of_week <= 6"),)