from fastapi import APIRouter, Query, BackgroundTasks
from typing import List, Dict, Any, Optional
import os

from server.chatbot.db_loader import DatabaseLoader
from server.chatbot.fast_rag_system import FastSubwayRAG  # Changed to FastSubwayRAG
from config import DB_CONFIG

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

# Global RAG system instance
rag_system = None

def initialize_rag():
    """Initialize the RAG system with the latest database data."""
    global rag_system
    
    print("Starting RAG system initialization...")
    
    # Create DB connection string from config
    db_url = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}"
    
    # Load data from DB
    loader = DatabaseLoader(db_url)
    json_path = loader.save_to_json()
    print(f"JSON data saved to {json_path}")
    
    # Initialize RAG system - Use FastSubwayRAG for better performance
    rag_system = FastSubwayRAG(data_path=json_path)
    print("RAG system initialized successfully")
    
    return "RAG system initialized successfully"

@router.get("/initialize")
def init_rag_endpoint(background_tasks: BackgroundTasks):
    """Initialize the RAG system (can take time, so run in background)."""
    background_tasks.add_task(initialize_rag)
    return {"message": "Initializing RAG system in the background. This may take a few minutes."}

@router.get("/query")
def query_chatbot(
    q: str = Query(..., description="Question for the chatbot"),
    session_id: Optional[str] = Query(None, description="Session ID for conversation tracking")
):
    """Query the chatbot with a question."""
    global rag_system
    
    # Check if RAG system is initialized
    if rag_system is None:
        initialize_rag()
        
    # Query the RAG system
    result = rag_system.query(q, session_id)
    
    return result

@router.delete("/session/{session_id}")
def delete_session(session_id: str):
    """Delete a specific chat session."""
    global rag_system
    
    if rag_system is None:
        return {"message": "RAG system not initialized"}
    
    if session_id in rag_system.sessions:
        del rag_system.sessions[session_id]
        return {"message": f"Session {session_id} deleted successfully"}
    
    return {"message": f"Session {session_id} not found"}