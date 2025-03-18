from fastapi import FastAPI
from server.api.endpoints import outlet, chatbot
from fastapi.middleware.cors import CORSMiddleware
import os
import subprocess
import sys
import traceback

app = FastAPI()

# Include routers
app.include_router(outlet.router)
app.include_router(chatbot.router)

default_origins = "http://localhost:3000,https://subway-outlets-frontend.onrender.com"
origins_str = os.getenv("CORS_ORIGINS", default_origins)
origins = [origin.strip() for origin in origins_str.split(",")]

print(f"Allowing CORS for origins: {origins}")  # Debug message

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Create tables and populate data if needed
    try:
        # Skip Alembic migrations for now since you don't have it configured
        # and directly use SQLAlchemy to create tables
        
        from server.db.db_manager import DatabaseManager
        from server.db.models import Outlet, Base
        from server.config import DB_CONFIG
        
        print("Starting database initialization...")
        db_manager = DatabaseManager(**DB_CONFIG)
        
        # Create tables if they don't exist
        print("Creating tables if they don't exist...")
        Base.metadata.create_all(db_manager.engine)
        print("Tables created or already exist")
        
        with db_manager:
            outlet_count = db_manager.session.query(Outlet).count()
            print(f"Found {outlet_count} outlets in database")
            
            if outlet_count == 0:
                print("No data found, running scraper...")
                # Import and run scraper
                from server.scrape.main_scraper import run_scraper
                run_scraper()
                print("Data population completed")
            else:
                print("Database already has data, skipping scraper")
    except Exception as e:
        print(f"Error during startup: {e}")
        print("Detailed traceback:")
        traceback.print_exc()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Subway Outlet API"}