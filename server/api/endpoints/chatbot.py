# from fastapi import APIRouter, Query, BackgroundTasks, Depends, HTTPException
# from typing import List, Dict, Any, Optional
# import os
# from pydantic import BaseModel
# import json

# from server.chatbot.db_loader import DatabaseLoader
# from server.chatbot.llm_first_rag import LLMFirstRAG  # Import the LLMFirstRAG class
# from config import DB_CONFIG, HF_API_TOKEN

# router = APIRouter(prefix="/chatbot", tags=["chatbot"])

# # Global RAG system instance
# rag_system = None

# def initialize_rag():
#     """Initialize the RAG system with the latest database data."""
#     global rag_system
    
#     print("Starting LLM-First RAG system initialization...")
    
#     # Create DB connection string from config
#     db_url = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}"
    
#     # Load data from DB
#     loader = DatabaseLoader(db_url)
#     json_path = loader.save_to_json()
#     print(f"JSON data saved to {json_path}")
    
#     # Initialize the LLM-First RAG system with HF token
#     rag_system = LLMFirstRAG(data_path=json_path, hf_api_token=HF_API_TOKEN)
#     print("LLM-First RAG system initialized successfully")
    
#     return "LLM-First RAG system initialized successfully"

# # Pydantic model for more structured API responses
# class ChatbotResponse(BaseModel):
#     answer: str
#     relevant_outlets: List[Dict[str, Any]]
#     session_id: str

# # Dependency to ensure rag system is initialized
# async def get_rag_system():
#     global rag_system
#     if rag_system is None:
#         initialize_rag()
#     return rag_system

# @router.get("/initialize")
# def init_rag_endpoint(background_tasks: BackgroundTasks):
#     """Initialize the RAG system (can take time, so run in background)."""
#     background_tasks.add_task(initialize_rag)
#     return {"message": "Initializing LLM-First RAG system in the background. This may take a few minutes."}

# @router.get("/query", response_model=ChatbotResponse)
# def query_chatbot(
#     q: str = Query(..., description="Question for the chatbot"),
#     session_id: Optional[str] = Query(None, description="Session ID for conversation tracking"),
#     rag: LLMFirstRAG = Depends(get_rag_system)  # Changed to LLMFirstRAG
# ):
#     """Query the chatbot with a question."""
#     # Query the RAG system
#     result = rag.query(q, session_id)
    
#     return ChatbotResponse(**result)

# @router.get("/history/{session_id}")
# def get_chat_history(
#     session_id: str,
#     rag: LLMFirstRAG = Depends(get_rag_system)  # Changed to LLMFirstRAG
# ):
#     """Get the chat history for a session."""
#     history = rag.get_history(session_id)
#     return {"session_id": session_id, "history": history}

# @router.delete("/session/{session_id}")
# def delete_session(
#     session_id: str,
#     rag: LLMFirstRAG = Depends(get_rag_system)  # Changed to LLMFirstRAG
# ):
#     """Delete a specific chat session."""
#     if session_id in rag.sessions:
#         del rag.sessions[session_id]
#         return {"message": f"Session {session_id} deleted successfully"}
    
#     raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

# @router.get("/outlets/nearby")
# def get_nearby_outlets(
#     latitude: float = Query(..., description="Current latitude"),
#     longitude: float = Query(..., description="Current longitude"),
#     radius: float = Query(5.0, description="Search radius in kilometers"),
#     rag: LLMFirstRAG = Depends(get_rag_system)  # Changed to LLMFirstRAG
# ):
#     """Find outlets near a given location."""
#     # This endpoint would use the haversine formula to calculate distances
    
#     nearby_outlets = []
#     for outlet in rag.outlets_data:
#         outlet_lat = outlet.get("latitude")
#         outlet_lng = outlet.get("longitude")
        
#         if outlet_lat and outlet_lng:
#             # Calculate distance using haversine formula
#             import math
            
#             # Earth radius in kilometers
#             R = 6371.0
            
#             # Convert latitude and longitude from degrees to radians
#             lat1 = math.radians(latitude)
#             lon1 = math.radians(longitude)
#             lat2 = math.radians(float(outlet_lat))
#             lon2 = math.radians(float(outlet_lng))
            
#             # Haversine formula
#             dlon = lon2 - lon1
#             dlat = lat2 - lat1
#             a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
#             c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
#             distance = R * c
            
#             if distance <= radius:
#                 outlet_copy = dict(outlet)
#                 outlet_copy["distance"] = round(distance, 2)
#                 nearby_outlets.append(outlet_copy)
    
#     # Sort by distance
#     nearby_outlets.sort(key=lambda x: x.get("distance", float("inf")))
    
#     return {"outlets": nearby_outlets, "count": len(nearby_outlets)}



from fastapi import APIRouter, Query, BackgroundTasks, Depends, HTTPException
from typing import List, Dict, Any, Optional
import os
from pydantic import BaseModel
import json

from server.chatbot.db_loader import DatabaseLoader
from server.chatbot.gemini_sql_chatbot import GeminiSQLChatbot
from config import DB_CONFIG, GEMINI_API_KEY

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

# Global chatbot instance
chatbot_system = None

def initialize_chatbot():
    """Initialize the Gemini SQL Chatbot system."""
    global chatbot_system
    
    print("Starting Gemini SQL Chatbot system initialization...")
    
    # Create DB connection string from config
    db_url = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}"
    
    # Initialize the chatbot system
    chatbot_system = GeminiSQLChatbot(db_url=db_url, gemini_api_key=GEMINI_API_KEY)
    print("Gemini SQL Chatbot system initialized successfully")
    
    return "Gemini SQL Chatbot system initialized successfully"

# Pydantic model for chatbot responses
class ChatbotResponse(BaseModel):
    answer: str
    relevant_outlets: List[Dict[str, Any]]
    session_id: str

# Dependency to ensure chatbot system is initialized
async def get_chatbot_system():
    global chatbot_system
    if chatbot_system is None:
        initialize_chatbot()
    return chatbot_system

@router.get("/initialize")
def init_chatbot_endpoint(background_tasks: BackgroundTasks):
    """Initialize the chatbot system (can take time, so run in background)."""
    background_tasks.add_task(initialize_chatbot)
    return {"message": "Initializing Gemini SQL Chatbot system in the background. This may take a few moments."}

@router.get("/query", response_model=ChatbotResponse)
def query_chatbot(
    q: str = Query(..., description="Question for the chatbot"),
    session_id: Optional[str] = Query(None, description="Session ID for conversation tracking"),
    chatbot: GeminiSQLChatbot = Depends(get_chatbot_system)
):
    """Query the chatbot with a question."""
    # Query the chatbot system
    result = chatbot.query(q, session_id)
    
    # Sometimes relevant_outlets might contain SQLAlchemy objects or other non-serializable items
    # This ensures we have clean, serializable data
    if "relevant_outlets" in result and result["relevant_outlets"]:
        clean_outlets = []
        for outlet in result["relevant_outlets"]:
            clean_outlet = {}
            for key, value in outlet.items():
                if key not in ("created_at", "updated_at"):  # Skip datetime objects
                    # Handle potential non-JSON serializable types
                    if isinstance(value, (int, float, str, bool, type(None))):
                        clean_outlet[key] = value
                    else:
                        clean_outlet[key] = str(value)
            clean_outlets.append(clean_outlet)
        result["relevant_outlets"] = clean_outlets
    
    return ChatbotResponse(**result)

@router.get("/history/{session_id}")
def get_chat_history(
    session_id: str,
    chatbot: GeminiSQLChatbot = Depends(get_chatbot_system)
):
    """Get the chat history for a session."""
    history = chatbot.get_history(session_id)
    return {"session_id": session_id, "history": history}

@router.delete("/session/{session_id}")
def delete_session(
    session_id: str,
    chatbot: GeminiSQLChatbot = Depends(get_chatbot_system)
):
    """Delete a specific chat session."""
    if session_id in chatbot.sessions:
        del chatbot.sessions[session_id]
        return {"message": f"Session {session_id} deleted successfully"}
    
    raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

@router.get("/maintenance/cleanup")
def cleanup_sessions(
    max_age_hours: int = Query(2, description="Max age in hours for inactive sessions"),
    chatbot: GeminiSQLChatbot = Depends(get_chatbot_system)
):
    """Clean up old sessions to free memory."""
    removed = chatbot.cleanup_old_sessions(max_age_hours=max_age_hours)
    return {"message": f"Removed {removed} old sessions"}

@router.get("/status")
def get_chatbot_status():
    """Get the status of the chatbot system."""
    global chatbot_system
    
    if not chatbot_system:
        return {"initialized": False}
        
    return {
        "initialized": True,
        "gemini_available": chatbot_system.model is not None,
        "outlet_count": chatbot_system.outlet_count
    }