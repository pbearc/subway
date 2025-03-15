import json
import numpy as np
from datetime import datetime
import uuid
import random
import re
from sentence_transformers import SentenceTransformer

class FastSubwayRAG:
    def __init__(self, data_path="outlets_data.json"):
        print("Initializing Fast Subway RAG System...")
        
        # Load data
        with open(data_path, 'r') as f:
            self.outlets_data = json.load(f)
            
        print(f"Loaded {len(self.outlets_data)} outlets")
        
        # Initialize response cache
        self.response_cache = {}
        
        # Store sessions for conversation memory
        self.sessions = {}
        
        # Initialize sentence transformer model
        print("Loading embedding model...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Precompute embeddings for outlets
        print("Computing embeddings for all outlets...")
        self.outlet_texts = []
        self.outlet_data_map = {}
        
        for outlet in self.outlets_data:
            # Create text representation of outlet
            outlet_name = outlet.get('name', '')
            outlet_address = outlet.get('address', '')
            outlet_text = f"{outlet_name} {outlet_address}"
            
            # Store for embedding
            self.outlet_texts.append((outlet_text, outlet))
            
            # Create lookup by ID
            self.outlet_data_map[outlet.get('id')] = outlet
            
        # Compute embeddings in a batch (much faster)
        texts_only = [text for text, _ in self.outlet_texts]
        self.outlet_embeddings = self.model.encode(texts_only)
        
        print("Embedding computation complete")
        
        # Define day mapping for fast matching
        self.day_mapping = {
            "sunday": "Sunday", "sun": "Sunday", 
            "monday": "Monday", "mon": "Monday",
            "tuesday": "Tuesday", "tue": "Tuesday", 
            "wednesday": "Wednesday", "wed": "Wednesday", 
            "thursday": "Thursday", "thu": "Thursday", 
            "friday": "Friday", "fri": "Friday", 
            "saturday": "Saturday", "sat": "Saturday"
        }
        
        print("Fast RAG system initialized successfully")
        
    def find_relevant_outlets(self, question, top_k=3):
        """Find outlets relevant to the question using vector similarity"""
        try:
            # Convert to embedding
            query_embedding = self.model.encode(question)
            
            # Calculate similarity
            similarities = np.dot(self.outlet_embeddings, query_embedding)
            
            # Get top matches
            top_indices = np.argsort(similarities)[-top_k:][::-1]
            return [self.outlet_texts[i][1] for i in top_indices]
        except Exception as e:
            print(f"Error finding relevant outlets: {str(e)}")
            # Fallback to a few random outlets
            if self.outlets_data:
                return random.sample(self.outlets_data, min(3, len(self.outlets_data)))
            return []
    
    def find_outlet_by_name(self, name_fragment):
        """Find outlets containing the name fragment"""
        name_fragment = name_fragment.lower()
        matches = []
        
        for outlet in self.outlets_data:
            outlet_name = outlet.get('name', '').lower()
            if name_fragment in outlet_name:
                matches.append(outlet)
                
        return matches
    
    def extract_entities(self, question):
        """Extract relevant entities from question"""
        q_lower = question.lower()
        
        # Extract day
        day = None
        for day_key, day_value in self.day_mapping.items():
            if day_key in q_lower:
                day = day_value
                break
                
        # Extract outlet name or location
        outlet_name = None
        location = None
        
        # Common location keywords
        location_keywords = [
            "monash", "sunway", "klcc", "pavilion", "mid valley", "midvalley",
            "gardens", "nu sentral", "terminal", "skypark", "bangsar", "subang",
            "damansara", "puchong", "cheras", "ampang", "wangsa maju", "setapak"
        ]
        
        # Check for location keywords
        for keyword in location_keywords:
            if keyword in q_lower:
                location = keyword
                break
                
        # Look for outlet name patterns
        subway_pattern = r"subway\s+([a-z0-9\s]+)"
        matches = re.findall(subway_pattern, q_lower)
        if matches:
            outlet_name = matches[0].strip()
        
        return {
            "day": day,
            "outlet_name": outlet_name,
            "location": location
        }
    
    def get_operating_hours(self, outlet, day):
        """Get operating hours for an outlet on a specific day"""
        if not outlet or not day:
            return None
            
        for hour in outlet.get("operating_hours", []):
            if hour.get("day_of_week") == day:
                if hour.get("is_closed", False):
                    return {"status": "closed", "day": day}
                else:
                    opening = hour.get("opening_time", "")
                    closing = hour.get("closing_time", "")
                    return {
                        "status": "open",
                        "day": day,
                        "opening": opening,
                        "closing": closing
                    }
        
        return None
    
    def get_fast_answer(self, question, session_id=None):
        """Generate answers using template matching rather than LLM"""
        question = question.strip()
        q_lower = question.lower()
        
        # Add question to session history
        self.add_to_history(session_id, "user", question)
        
        # Check cache first
        cache_key = f"{session_id}:{q_lower}" if session_id else q_lower
        if cache_key in self.response_cache:
            cached_response = self.response_cache[cache_key]
            self.add_to_history(session_id, "assistant", cached_response["answer"])
            return cached_response
            
        # Extract entities from question
        entities = self.extract_entities(question)
        day = entities["day"]
        outlet_name = entities["outlet_name"]
        location = entities["location"]
        
        # Find relevant outlets
        relevant_outlets = []
        
        # First try name match if available
        if outlet_name:
            relevant_outlets = self.find_outlet_by_name(outlet_name)
        
        # Then try location match
        if not relevant_outlets and location:
            for outlet in self.outlets_data:
                outlet_text = f"{outlet.get('name', '')} {outlet.get('address', '')}".lower()
                if location in outlet_text:
                    relevant_outlets.append(outlet)
        
        # If still no matches, use embedding search
        if not relevant_outlets:
            relevant_outlets = self.find_relevant_outlets(question)
            
        # If no relevant outlets found, return a generic response
        if not relevant_outlets:
            answer = "I couldn't find any specific Subway outlets matching your query. Could you provide more details about which outlet you're interested in?"
            result = {
                "answer": answer,
                "relevant_outlets": [],
                "session_id": session_id
            }
            self.response_cache[cache_key] = result
            self.add_to_history(session_id, "assistant", answer)
            return result
            
        # Handle specific question types
        outlet = relevant_outlets[0]
        outlet_name = outlet.get("name", "")
        
        # Check for previous context in session history
        if session_id in self.sessions:
            history = self.sessions[session_id]["history"]
            if len(history) >= 2 and history[-2]["role"] == "assistant":
                assistant_msg = history[-2]["content"]
                if outlet_name not in assistant_msg and "which outlet" in assistant_msg.lower():
                    # User is responding to which outlet question
                    for o in self.outlets_data:
                        if o.get("name", "").lower() in q_lower:
                            outlet = o
                            relevant_outlets = [o]
                            outlet_name = o.get("name", "")
                            break
        
        # 1. Hours/opening time question
        if ("open" in q_lower or "hour" in q_lower or "time" in q_lower or "close" in q_lower) and day:
            hours = self.get_operating_hours(outlet, day)
            if hours:
                if hours["status"] == "closed":
                    answer = f"{outlet_name} is closed on {day}."
                else:
                    answer = f"{outlet_name} is open on {day} from {hours['opening']} to {hours['closing']}."
            else:
                answer = f"I don't have operating hours information for {outlet_name} on {day}."
        
        # 2. General location question
        elif "where" in q_lower or "location" in q_lower or "address" in q_lower:
            address = outlet.get("address", "")
            if address:
                answer = f"{outlet_name} is located at {address}."
            else:
                answer = f"I found {outlet_name}, but I don't have its address information."
        
        # 3. Question about a specific day without mentioning hours directly
        elif day and not ("hour" in q_lower or "time" in q_lower):
            hours = self.get_operating_hours(outlet, day)
            if hours:
                if hours["status"] == "closed":
                    answer = f"{outlet_name} is closed on {day}."
                else:
                    answer = f"{outlet_name} is open on {day} from {hours['opening']} to {hours['closing']}."
            else:
                answer = f"I don't have information about {outlet_name} for {day}."
        
        # 4. Which outlet question
        elif "which" in q_lower and not outlet_name and len(relevant_outlets) > 1:
            outlet_names = [o.get("name", "") for o in relevant_outlets[:3]]
            answer = f"There are several outlets that might match your query: {', '.join(outlet_names)}. Which outlet are you interested in?"
        
        # 5. Fallback generic response
        else:
            address = outlet.get("address", "")
            answer = f"I found information about {outlet_name} located at {address}. How can I help you with this outlet?"
        
        # Create response
        result = {
            "answer": answer,
            "relevant_outlets": relevant_outlets,
            "session_id": session_id
        }
        
        # Cache the result
        self.response_cache[cache_key] = result
        
        # Add to history
        self.add_to_history(session_id, "assistant", answer)
        
        return result
    
    def add_to_history(self, session_id, role, content):
        """Add message to conversation history"""
        if not session_id:
            return
            
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "history": [],
                "last_access": datetime.now()
            }
            
        self.sessions[session_id]["history"].append({
            "role": role,
            "content": content
        })
        self.sessions[session_id]["last_access"] = datetime.now()
    
    def get_history(self, session_id):
        """Get conversation history for a session"""
        if not session_id or session_id not in self.sessions:
            return []
            
        return self.sessions[session_id]["history"]
    
    def cleanup_old_sessions(self, max_age_hours=12):
        """Remove old sessions to free memory"""
        current_time = datetime.now()
        sessions_to_remove = []
        
        for session_id, session_data in self.sessions.items():
            age = current_time - session_data["last_access"]
            if age.total_seconds() > max_age_hours * 3600:
                sessions_to_remove.append(session_id)
        
        for session_id in sessions_to_remove:
            del self.sessions[session_id]
            
        return len(sessions_to_remove)
    
    def query(self, question, session_id=None):
        """Main query entry point - wrapper for get_fast_answer"""
        # Clean up sessions occasionally
        if random.random() < 0.05:
            self.cleanup_old_sessions()
            
        try:
            return self.get_fast_answer(question, session_id)
        except Exception as e:
            import traceback
            print(f"Error processing query: {str(e)}")
            print(traceback.format_exc())
            
            # Create a basic fallback response
            return {
                "answer": "I'm sorry, I encountered an error while processing your question. Please try again.",
                "relevant_outlets": [],
                "session_id": session_id
            }