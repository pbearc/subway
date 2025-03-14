from pydantic import BaseModel
from typing import Optional, List
from datetime import time

class OperatingHoursResponse(BaseModel):
    day_of_week: str
    opening_time: Optional[time]
    closing_time: Optional[time]
    is_closed: bool

class OutletBase(BaseModel):
    name: str
    address: Optional[str]  # Changed to Optional[str]
    waze_link: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]

class OutletCreate(OutletBase):
    pass

class OutletResponse(OutletBase):
    id: int
    operating_hours: List[OperatingHoursResponse]

    class Config:
        from_attributes = True
