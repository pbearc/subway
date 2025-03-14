from fastapi import FastAPI
from server.api.endpoints import outlet
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Include routers
app.include_router(outlet.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Subway Outlet API"}
