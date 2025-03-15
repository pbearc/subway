import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.llms import HuggingFaceHub
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
import json
from datetime import datetime
import uuid
import random
from config import HF_API_TOKEN

class SubwayRAG:
    def __init__(self, data_path="outlets_data.json"):
        # Load data
        with open(data_path, 'r') as f:
            self.outlets_data = json.load(f)
            
        # Create text documents for each outlet
        self.documents = []
        for outlet in self.outlets_data:
            # Format operating hours as a string
            hours_text = ""
            for hour in outlet.get("operating_hours", []):
                day = hour.get("day_of_week", "")
                if hour.get("is_closed", False):
                    hours_text += f"{day}: Closed\n"
                else:
                    opening = hour.get("opening_time", "")
                    closing = hour.get("closing_time", "")
                    hours_text += f"{day}: {opening} - {closing}\n"
            
            # Create a comprehensive text representation
            text = f"""
            Outlet Name: {outlet.get('name', '')}
            Address: {outlet.get('address', '')}
            Waze Link: {outlet.get('waze_link', '')}
            Coordinates: {outlet.get('latitude', '')}, {outlet.get('longitude', '')}
            Operating Hours:
            {hours_text}
            """
            
            self.documents.append({"text": text, "metadata": {"id": outlet.get("id"), "name": outlet.get("name")}})
        
        # Define the prompt template - moved outside of methods for accessibility
        self.prompt_template = """You are a helpful assistant for Subway restaurants in Kuala Lumpur.
        Use the following pieces of context to answer the question about Subway restaurants.
        
        Your answers should:
        1. Be detailed and comprehensive
        2. Include specific information like opening/closing times when asked
        3. Always mention the specific outlet name when answering about a particular outlet
        4. Be conversational but informative
        
        If you don't know the answer, just say that you don't know, don't try to make up an answer.

        CONTEXT:
        {context}

        CHAT HISTORY:
        {chat_history}
        
        QUESTION: {question}
        
        ANSWER:"""
        
        self.PROMPT = PromptTemplate(
            template=self.prompt_template, 
            input_variables=["context", "chat_history", "question"]
        )
        
        # Create embeddings and vectorstore
        self.setup_vectorstore()
        
        # Storage for per-session memory
        self.sessions = {}
        
        # Setup the default LLM (will be used for new sessions)
        self.setup_llm()
        
    def setup_vectorstore(self):
        # Use HuggingFace embeddings (free and local)
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        
        # Extract just the text for splitting
        texts = [doc["text"] for doc in self.documents]
        metadatas = [doc["metadata"] for doc in self.documents]
        
        # Split documents
        split_texts = text_splitter.create_documents(texts, metadatas=metadatas)
        
        # Create vector database
        self.vectorstore = Chroma.from_documents(documents=split_texts, embedding=self.embeddings)
        
    def setup_llm(self):
        self.llm = HuggingFaceHub(
            repo_id="microsoft/phi-2",
            huggingfacehub_api_token=HF_API_TOKEN,
            model_kwargs={"temperature": 0.7, "max_length": 512}
        )
        
    
    def get_qa_chain(self, session_id=None):
        """Get or create a conversational chain with memory for the given session"""
        if not session_id:
            session_id = str(uuid.uuid4())
            
        # Create or update session
        if session_id not in self.sessions:
            # Create new memory for this session
            memory = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True
            )
            
            # Create chain with this memory
            qa_chain = ConversationalRetrievalChain.from_llm(
                llm=self.llm,
                retriever=self.vectorstore.as_retriever(search_kwargs={"k": 5}),  # Get more context
                memory=memory,
                combine_docs_chain_kwargs={"prompt": self.PROMPT}
            )
            
            self.sessions[session_id] = {
                "memory": memory,
                "qa_chain": qa_chain,
                "last_access": datetime.now()
            }
        else:
            # Update last access time
            self.sessions[session_id]["last_access"] = datetime.now()
        
        return self.sessions[session_id]["qa_chain"], session_id
        
    def cleanup_old_sessions(self, max_age_hours=12):
        """Remove memory for sessions that haven't been accessed recently"""
        current_time = datetime.now()
        sessions_to_remove = []
        
        for session_id, session_data in self.sessions.items():
            age = current_time - session_data["last_access"]
            if age.total_seconds() > max_age_hours * 3600:
                sessions_to_remove.append(session_id)
        
        for session_id in sessions_to_remove:
            del self.sessions[session_id]
            
        return len(sessions_to_remove)
    
    def find_relevant_outlets(self, question, source_docs):
        """Find outlets relevant to the question, even if not explicitly mentioned in source docs"""
        # First get outlets from source docs
        from_docs = []
        for doc in source_docs:
            outlet_id = doc.metadata.get("id")
            if outlet_id and outlet_id not in [o["id"] for o in from_docs]:
                # Find the full outlet data
                for outlet in self.outlets_data:
                    if outlet["id"] == outlet_id:
                        from_docs.append(outlet)
                        break
        
        # If no outlets found in docs, try keyword matching
        if not from_docs:
            q_lower = question.lower()
            keyword_matches = []
            
            # Extract location keywords
            possible_locations = ["monash", "sunway", "klcc", "skypark", "terminal", "kl", 
                                 "kuala lumpur", "bangsar", "pavilion", "subang", "damansara",
                                 "puchong", "midvalley", "nu sentral", "sentral", "pyramid"]
            
            matching_locations = [loc for loc in possible_locations if loc in q_lower]
            
            # If locations found in query, find matching outlets
            if matching_locations:
                for outlet in self.outlets_data:
                    outlet_text = f"{outlet.get('name', '')} {outlet.get('address', '')}".lower()
                    for loc in matching_locations:
                        if loc in outlet_text:
                            keyword_matches.append(outlet)
                            break
            
            # If no location matches but asking about a day, return several outlets as examples
            if not keyword_matches and any(day in q_lower for day in ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]):
                # Return a sample of outlets (up to 3)
                keyword_matches = self.outlets_data[:3] if len(self.outlets_data) > 0 else []
            
            return keyword_matches or from_docs
        
        return from_docs
    
    def query(self, question, session_id=None):
        """Query the RAG system with a question"""
        try:
            print(f"Processing query with session ID: {session_id}")
            
            # Get the appropriate QA chain
            qa_chain, session_id = self.get_qa_chain(session_id)
            
            # Execute the query
            result = qa_chain.invoke({"question": question})
            
            # Extract source documents
            source_docs = result.get("source_documents", [])
            
            # Find relevant outlets - improved method
            relevant_outlets = self.find_relevant_outlets(question, source_docs)
            print(f"Found {len(relevant_outlets)} relevant outlets")
            
            # Clean up old sessions occasionally (5% chance per query)
            if random.random() < 0.05:
                removed = self.cleanup_old_sessions()
                if removed > 0:
                    print(f"Cleaned up {removed} old sessions")
            
            return {
                "answer": result["answer"],
                "relevant_outlets": relevant_outlets,
                "session_id": session_id
            }
        except Exception as e:
            import traceback
            print(f"Error in RAG query: {str(e)}")
            print(traceback.format_exc())
            
            # Try to recover by finding relevant outlets directly
            try:
                relevant_outlets = []
                q_lower = question.lower()
                
                # Check for location mentions
                possible_locations = ["monash", "sunway", "klcc", "skypark", "terminal", "kl", 
                                    "kuala lumpur", "bangsar", "pavilion", "subang", "damansara",
                                    "puchong", "midvalley", "nu sentral", "sentral", "pyramid"]
                
                matching_locations = [loc for loc in possible_locations if loc in q_lower]
                
                if matching_locations:
                    for outlet in self.outlets_data:
                        outlet_text = f"{outlet.get('name', '')} {outlet.get('address', '')}".lower()
                        for loc in matching_locations:
                            if loc in outlet_text:
                                relevant_outlets.append(outlet)
                                break
                
                # Get at least one outlet if possible
                if not relevant_outlets and len(self.outlets_data) > 0:
                    relevant_outlets = [self.outlets_data[0]]
                
                return {
                    "answer": "I'm having trouble generating a detailed answer, but I found some outlets that might be relevant to your question.",
                    "relevant_outlets": relevant_outlets,
                    "session_id": session_id
                }
            except:
                # Last resort fallback
                return {
                    "answer": "I'm sorry, I encountered an error while processing your question. Please try again with a simpler question.",
                    "relevant_outlets": [],
                    "session_id": session_id
                }