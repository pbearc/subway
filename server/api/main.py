from fastapi import FastAPI
from server.api.endpoints import outlet

app = FastAPI()

# Include routers
app.include_router(outlet.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Subway Outlet API"}
