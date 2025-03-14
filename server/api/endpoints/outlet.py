from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from server.db.db_manager import DatabaseManager
from server.db.models import Outlet, OperatingHours
from server.api.models import outlet as outlet_models # Import Pydantic models
from config import DB_CONFIG
from sqlalchemy.orm import Session

router = APIRouter(prefix="/outlets", tags=["outlets"])

# Dependency to get the database session
def get_db():
    db_manager = DatabaseManager(**DB_CONFIG)
    try:
        db_manager.connect()
        yield db_manager
    finally:
        db_manager.close()

@router.get("/search", response_model=List[outlet_models.OutletResponse])
def search_outlets(query: str = Query(..., description="Search by outlet name or address"), db_manager: DatabaseManager = Depends(get_db)):
    """Search outlets by name or address."""
    with db_manager:
        outlets = db_manager.session.query(Outlet).filter(
            (Outlet.name.ilike(f"%{query}%")) | (Outlet.address.ilike(f"%{query}%"))
        ).all()
        return [
            outlet_models.OutletResponse(
                id=outlet.id,
                name=outlet.name,
                address=outlet.address,
                waze_link=outlet.waze_link,
                latitude=outlet.latitude,
                longitude=outlet.longitude,
                operating_hours=[
                    outlet_models.OperatingHoursResponse(
                        day_of_week=oh.day_of_week,
                        opening_time=oh.opening_time,
                        closing_time=oh.closing_time,
                        is_closed=oh.is_closed,
                    )
                    for oh in db_manager.session.query(OperatingHours).filter(OperatingHours.outlet_id == outlet.id).all()
                ]
            )
            for outlet in outlets
        ]

@router.get("/nearby", response_model=List[outlet_models.OutletResponse])
def get_nearby_outlets(latitude: float, longitude: float, radius: float = 5.0, db_manager: DatabaseManager = Depends(get_db)):
    """Find outlets within a certain radius (in kilometers) of a given location."""
    with db_manager:
        # Haversine formula to calculate distance
        query = """
            SELECT id, name, address, waze_link, latitude, longitude,
                (6371 * acos(cos(radians(:lat)) * cos(radians(latitude)) *
                cos(radians(longitude) - radians(:lng)) + sin(radians(:lat)) *
                sin(radians(latitude)))) AS distance
            FROM outlets
            WHERE (6371 * acos(cos(radians(:lat)) * cos(radians(latitude)) *
                cos(radians(longitude) - radians(:lng)) + sin(radians(:lat)) *
                sin(radians(latitude)))) <= :radius
            ORDER BY distance;
        """
        outlets = db_manager.session.execute(query, {
            "lat": latitude,
            "lng": longitude,
            "radius": radius,
        }).fetchall()

        return [
            outlet_models.OutletResponse(
                id=outlet.id,
                name=outlet.name,
                address=outlet.address,
                waze_link=outlet.waze_link,
                latitude=outlet.latitude,
                longitude=outlet.longitude,
                operating_hours=[
                    outlet_models.OperatingHoursResponse(
                        day_of_week=oh.day_of_week,
                        opening_time=oh.opening_time,
                        closing_time=oh.closing_time,
                        is_closed=oh.is_closed,
                    )
                    for oh in db_manager.session.query(OperatingHours).filter(OperatingHours.outlet_id == outlet.id).all()
                ]
            )
            for outlet in outlets
        ]

@router.get("/", response_model=List[outlet_models.OutletResponse])
def get_all_outlets(db_manager: DatabaseManager = Depends(get_db)):
    """Retrieve all outlets with their operating hours."""
    with db_manager:
        outlets = db_manager.session.query(Outlet).all()
        # Use list comprehension to construct OutletResponse objects
        return [
            outlet_models.OutletResponse(
                id=outlet.id,
                name=outlet.name,
                address=outlet.address,
                waze_link=outlet.waze_link,
                latitude=outlet.latitude,
                longitude=outlet.longitude,
                operating_hours=[
                    outlet_models.OperatingHoursResponse(
                        day_of_week=oh.day_of_week,
                        opening_time=oh.opening_time,
                        closing_time=oh.closing_time,
                        is_closed=oh.is_closed,
                    )
                    for oh in db_manager.session.query(OperatingHours).filter(OperatingHours.outlet_id == outlet.id).all()
                ]
            )
            for outlet in outlets
        ]

@router.get("/{outlet_id}", response_model=outlet_models.OutletResponse)
def get_outlet(outlet_id: int, db_manager: DatabaseManager = Depends(get_db)):
    """Retrieve details of a specific outlet by ID."""
    with db_manager:
        outlet = db_manager.session.query(Outlet).filter(Outlet.id == outlet_id).first()
        if not outlet:
            raise HTTPException(status_code=404, detail="Outlet not found")
        # Construct OutletResponse object
        return outlet_models.OutletResponse(
            id=outlet.id,
            name=outlet.name,
            address=outlet.address,
            waze_link=outlet.waze_link,
            latitude=outlet.latitude,
            longitude=outlet.longitude,
            operating_hours=[
                outlet_models.OperatingHoursResponse(
                    day_of_week=oh.day_of_week,
                    opening_time=oh.opening_time,
                    closing_time=oh.closing_time,
                    is_closed=oh.is_closed,
                )
                for oh in db_manager.session.query(OperatingHours).filter(OperatingHours.outlet_id == outlet.id).all()
            ]
        )

@router.get("/{outlet_id}/operating-hours", response_model=List[outlet_models.OperatingHoursResponse])
def get_outlet_operating_hours(outlet_id: int, db_manager: DatabaseManager = Depends(get_db)):
    """Retrieve operating hours for a specific outlet."""
    with db_manager:
        # First check if the outlet exists
        outlet = db_manager.session.query(Outlet).filter(Outlet.id == outlet_id).first()
        if not outlet:
            raise HTTPException(status_code=404, detail="Outlet not found")
            
        # Get all operating hours for this outlet
        operating_hours = db_manager.session.query(OperatingHours).filter(
            OperatingHours.outlet_id == outlet_id
        ).all()
        
        # Transform to response model
        return [
            outlet_models.OperatingHoursResponse(
                day_of_week=oh.day_of_week,
                opening_time=oh.opening_time,
                closing_time=oh.closing_time,
                is_closed=oh.is_closed,
            )
            for oh in operating_hours
        ]