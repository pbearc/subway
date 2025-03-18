from fastapi import FastAPI
from server.api.endpoints import outlet, chatbot
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# Include routers
app.include_router(outlet.router)
app.include_router(chatbot.router)

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Subway Outlet API"}
