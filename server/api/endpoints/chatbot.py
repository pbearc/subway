from fastapi import APIRouter, Query, BackgroundTasks, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from server.chatbot.gemini_sql_chatbot import GeminiSQLChatbot
from server.config import DB_CONFIG, GEMINI_API_KEY

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

# Global chatbot instance
chatbot_system = None

def initialize_chatbot():
    """Initialize the Gemini SQL Chatbot system."""
    global chatbot_system
    
    # Skip if already initialized
    if chatbot_system is not None:
        print("Chatbot system already initialized")
        return "Chatbot system already initialized"
    
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

# Dependency to get the initialized chatbot system
def get_chatbot_system():
    global chatbot_system
    if chatbot_system is None:
        raise HTTPException(
            status_code=503, 
            detail="Chatbot system not initialized. Please wait a moment and try again."
        )
    return chatbot_system

@router.get("/initialize")
def init_chatbot_endpoint():
    """Initialize the chatbot system (now runs synchronously since it's likely already initialized)."""
    result = initialize_chatbot()
    return {"message": result}

@router.get("/query", response_model=ChatbotResponse)
def query_chatbot(
    q: str = Query(..., description="Question for the chatbot"),
    session_id: Optional[str] = Query(None, description="Session ID for conversation tracking"),
    chatbot: GeminiSQLChatbot = Depends(get_chatbot_system)
):
    """Query the chatbot with a question."""
    # Query the chatbot system
    result = chatbot.query(q, session_id)
    
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