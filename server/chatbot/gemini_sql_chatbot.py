from datetime import datetime
import uuid
import traceback
from typing import List, Dict, Any, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Import Gemini API
import google.generativeai as genai

class GeminiSQLChatbot:
    def __init__(self, db_url, gemini_api_key):
        """Initialize the Gemini-powered SQL Chatbot system"""
        print("Initializing Gemini SQL Chatbot System...")
        
        # Set up database connection
        self.db_engine = create_engine(db_url)
        self.test_db_connection()
        
        # Store sessions for conversation memory
        self.sessions = {}
        
        # Configure Gemini API
        self.gemini_api_key = gemini_api_key
        if not self.gemini_api_key:
            print("WARNING: No Gemini API key provided. Chatbot will be non-functional.")
        else:
            self._setup_gemini()
            
        # Cache common query results
        self.query_cache = {}
        
        # Pre-load some common data
        self.outlet_count = self._get_total_outlet_count()
        
        print("Gemini SQL Chatbot system initialized successfully")
    
    def test_db_connection(self):
        """Test the database connection"""
        try:
            with self.db_engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                row = result.fetchone()
                if row and row[0] == 1:
                    print("Database connection successful")
                else:
                    raise Exception("Database connection test failed")
        except SQLAlchemyError as e:
            print(f"Database connection error: {str(e)}")
            raise
    
    def _setup_gemini(self):
        """Set up Gemini model"""
        try:
            # Configure the Gemini API
            genai.configure(api_key=self.gemini_api_key)
            
            # Create a client for the generative model
            self.model = genai.GenerativeModel('gemini-1.5-pro')
            
            # Test the model with a simple query
            response = self.model.generate_content("Hello")
            print("Gemini API setup successful")
        except Exception as e:
            print(f"Error setting up Gemini API: {str(e)}")
            print(traceback.format_exc())
            self.model = None
    
    def _get_total_outlet_count(self):
        """Get the total number of outlets"""
        try:
            with self.db_engine.connect() as conn:
                result = conn.execute(text("SELECT COUNT(*) FROM outlets"))
                return result.scalar()
        except SQLAlchemyError as e:
            print(f"Error getting outlet count: {str(e)}")
            return 0
    
    def _get_db_schema(self):
        """Get database schema information for context"""
        schema = """
Database Schema:

Table: outlets
- id (integer, primary key)
- name (varchar(100), unique, not null)
- address (text)
- waze_link (text)
- latitude (numeric(10,8))
- longitude (numeric(11,8))
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
- raw_operating_hours (text)

Table: operating_hours
- id (integer, primary key)
- outlet_id (integer, foreign key to outlets.id with ON DELETE CASCADE)
- day_of_week (varchar(20), not null) - Contains values like 'Monday', 'Tuesday', etc.
- opening_time (time without time zone)
- closing_time (time without time zone)
- is_closed (boolean, default false)

Relationship: operating_hours.outlet_id references outlets.id (with CASCADE delete)

Example Query Patterns:
- When querying by time, use NOW()::time for comparison with opening_time and closing_time
- For day of week comparison, use trim(to_char(NOW(), 'Day')) to match day_of_week values
"""
        return schema
    
    def _generate_sql_with_gemini(self, question):
        """Generate SQL using Gemini model"""
        if not self.model:
            raise ValueError("Gemini model not initialized")
        
        # Create a complete prompt with schema and question
        schema = self._get_db_schema()
        
        prompt = f"""You are a SQL expert. Generate a PostgreSQL query to answer this question about Subway restaurant outlets.

    {schema}

    IMPORTANT GUIDELINES:
    1. Generate ONLY the SQL query without any explanation or comments.
    2. Use ILIKE for case-insensitive text matching with '%term%' patterns.
    3. Always use column aliases for clarity (e.g., COUNT(*) AS outlet_count).
    4. Format dates and times appropriately.
    5. When joining tables, use appropriate JOIN conditions.
    6. For filtering on words like 'Subway', 'Bangsar', etc., use pattern matching with ILIKE.
    7. Return only essential columns needed to answer the question.
    8. Limit large result sets to a reasonable number (10-20 rows).
    9. Include ordering where appropriate (ORDER BY).
    10. In the SELECT statement, select all the columns that might be useful from the user's question, include more is better than include less.
    11. Take note of the column data type when comparing values.
    12. Only generate valid PostgreSQL SQL - do not include any explanation, markdown formatting, or backticks. Return ONLY the raw SQL query.

    USER QUESTION: {question}

    SQL Query:"""
        
        try:
            # Generate SQL with Gemini
            response = self.model.generate_content(prompt)
            
            # Extract SQL from response and clean it
            sql_query = response.text.strip()
            
            # Remove markdown code blocks if present
            if sql_query.startswith("```") and sql_query.endswith("```"):
                # Extract content between the backticks
                lines = sql_query.split("\n")
                if len(lines) > 2:  # At least opening, content, and closing backticks
                    # Skip first line (opening backticks) and last line (closing backticks)
                    sql_query = "\n".join(lines[1:-1])
                
            # Also handle case where only sql tag and backticks are on the first line
            if sql_query.startswith("```sql"):
                sql_query = sql_query.replace("```sql", "", 1)
                if sql_query.endswith("```"):
                    sql_query = sql_query[:-3]
            
            sql_query = sql_query.strip()
            
            # Basic validation
            if not sql_query.upper().startswith("SELECT"):
                raise ValueError(f"Generated query doesn't start with SELECT: {sql_query}")
                
            return sql_query
        except Exception as e:
            print(f"Error generating SQL with Gemini: {str(e)}")
            raise
    
    def _is_sql_safe(self, sql_query):
        """Check if SQL query is safe to execute"""
        sql_query = sql_query.strip()
        
        # Ensure it starts with SELECT
        if not sql_query.upper().startswith('SELECT'):
            print("Rejected non-SELECT query")
            return False
        
        # Check for dangerous operations (more comprehensive)
        dangerous_patterns = [
            "DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", 
            "GRANT", "REVOKE", "EXEC", "EXECUTE",
            "UNION", "INTO OUTFILE", "LOAD_FILE"
        ]
        
        for pattern in dangerous_patterns:
            if pattern in sql_query.upper():
                print(f"Rejected query containing dangerous pattern: {pattern}")
                return False
        
        # Check for multiple statements
        if ";" in sql_query[:-1]:  # Allow semicolon at the end
            print("Rejected multiple SQL statements")
            return False
                
        # Ensure query only accesses our tables
        allowed_tables = ["outlets", "operating_hours"]
        matches_allowed = False
        
        for table in allowed_tables:
            if table in sql_query.lower():
                matches_allowed = True
                break
                
        if not matches_allowed:
            print("Rejected query not referencing allowed tables")
            return False
            
        return True
    
    def _execute_sql(self, sql_query):
        """Execute SQL query and return results"""
        try:
            with self.db_engine.connect() as conn:
                result = conn.execute(text(sql_query))
                if result.returns_rows:
                    # Convert to list of dicts
                    columns = result.keys()
                    data = [dict(zip(columns, row)) for row in result.fetchall()]
                    return data
                return []
        except SQLAlchemyError as e:
            print(f"Error executing SQL: {str(e)}")
            print(f"Query was: {sql_query}")
            print(traceback.format_exc())
            return []
    
    def _format_query_results(self, results):
        """Format query results as a string for LLM consumption"""
        if not results:
            return "No results found."
            
        # Format as a string table
        output = ""
        
        # Get all keys from results
        keys = results[0].keys()
        
        # Add header
        output += " | ".join(str(k) for k in keys) + "\n"
        output += "-" * (sum(len(str(k)) for k in keys) + (len(keys) - 1) * 3) + "\n"
        
        # Add rows
        for row in results:
            output += " | ".join(str(row[k] if row[k] is not None else "NULL") for k in keys) + "\n"
            
        return output

    def _generate_response_with_gemini(self, question, query_results, chat_history):
        """Generate a natural language response from query results using Gemini"""
        if not self.model:
            raise ValueError("Gemini model not initialized")
        
        # Format query results
        formatted_results = self._format_query_results(query_results)
        
        # Format chat history
        formatted_history = ""
        if chat_history:
            for i, message in enumerate(chat_history[-3:]):  # Only last 3 messages
                formatted_history += f"{message['role'].upper()}: {message['content']}\n"
        
        # Create prompt - simplified to request plain text instead of HTML
        prompt = f"""You are a helpful assistant for Subway restaurants in Kuala Lumpur.

User Question: {question}

Database Query Results:
{formatted_results}

Previous Conversation:
{formatted_history}

Please provide a helpful, conversational answer based on the database results. If the results include outlet names, mention them specifically. If the results include counts, provide the exact number. If the results include times, format them nicely. If the results are empty, say you couldn't find information matching the query. Keep your answer concise but complete.

Use markdown format to return the answer.

Your response:"""
        
        try:
            # Generate response with Gemini
            response = self.model.generate_content(prompt)
            
            # Return the text response
            return response.text.strip()
        except Exception as e:
            print(f"Error generating response with Gemini: {str(e)}")
            
            # Fallback to a simple response based on results
            return self._get_fallback_response(question, query_results)
    
    def _get_fallback_response(self, question, query_results):
        """Generate a fallback response when Gemini fails"""
        if not query_results:
            return "I'm sorry, I couldn't find any information matching your query."
        
        # Simple response based on result count
        result_count = len(query_results)
        
        if result_count == 1:
            # Single result - probably an outlet
            if "name" in query_results[0]:
                outlet_name = query_results[0]["name"]
                if "address" in query_results[0]:
                    outlet_address = query_results[0]["address"]
                    return f"I found {outlet_name} located at {outlet_address}."
                return f"I found {outlet_name} in our database."
            
            # Single result - probably a count
            if "count" in query_results[0]:
                count_value = query_results[0]["count"]
                return f"I found {count_value} matching outlet(s)."
        else:
            # Multiple results - probably a list of outlets
            if "name" in query_results[0]:
                outlet_names = [r["name"] for r in query_results[:5]]
                outlets_text = ", ".join(outlet_names)
                if len(query_results) > 5:
                    outlets_text += f", and {len(query_results) - 5} more"
                return f"I found {len(query_results)} outlets: {outlets_text}."
        
        # Generic fallback
        return f"I found {len(query_results)} results matching your query."
    
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
    
    def _get_relevant_outlets(self, sql_results, question):
        """Extract relevant outlets from SQL results to return to frontend"""
        outlets = []
        seen_ids = set()
        
        try:
            # Extract outlet names from SQL results
            outlet_names = set()
            for row in sql_results:
                if "name" in row:
                    outlet_names.add(row["name"])
            
            # If we found names, get full outlet data
            if outlet_names:
                names_list = "', '".join(outlet_names)
                query = f"SELECT * FROM outlets WHERE name IN ('{names_list}')"
                with self.db_engine.connect() as conn:
                    result = conn.execute(text(query))
                    columns = result.keys()
                    for row in result:
                        outlet = dict(zip(columns, row))
                        if outlet["id"] not in seen_ids:
                            outlets.append(outlet)
                            seen_ids.add(outlet["id"])
            
            # Limit to 5 outlets max
            return outlets[:5]
        except SQLAlchemyError as e:
            print(f"Error getting relevant outlets: {str(e)}")
            return []
    
    def cleanup_old_sessions(self, max_age_hours=2):
        """Clean up old sessions to free memory"""
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
        """Process a user query using SQL and Gemini"""
        # Generate a new session ID if not provided
        if not session_id:
            session_id = str(uuid.uuid4())
            
        try:
            # Add question to history
            self.add_to_history(session_id, "user", question)
            
            # Check cache for identical question
            cache_key = f"{session_id}:{question.lower()}"
            if cache_key in self.query_cache:
                cached_response = self.query_cache[cache_key]
                print(f"Cache hit for query: {question}")
                return cached_response
            
            # Generate SQL query from question
            try:
                sql_query = self._generate_sql_with_gemini(question)
                
                # Validate SQL for safety
                if not self._is_sql_safe(sql_query):
                    raise ValueError("Generated SQL query failed safety validation")
                    
            except Exception as e:
                print(f"Error generating SQL: {str(e)}")
                return {
                    "answer": "I'm sorry, I encountered an error generating a database query for your question. Please try to rephrase or ask a different question.",
                    "relevant_outlets": [],
                    "session_id": session_id,
                    "error": str(e)
                }
            
            print(f"Generated SQL: {sql_query}")
            
            # Execute SQL query
            query_results = self._execute_sql(sql_query)
            print(f"Query returned {len(query_results)} results")
            
            # Get chat history for context
            chat_history = self.get_history(session_id)
            
            # Generate natural language response
            try:
                response = self._generate_response_with_gemini(question, query_results, chat_history)
            except Exception as e:
                print(f"Error generating response: {str(e)}")
                response = self._get_fallback_response(question, query_results)
            
            # Find relevant outlets to display on map
            relevant_outlets = self._get_relevant_outlets(query_results, question)
            
            # Create result
            result = {
                "answer": response,
                "relevant_outlets": relevant_outlets,
                "session_id": session_id
            }
            
            # Cache the result
            self.query_cache[cache_key] = result
            
            # Add response to history
            self.add_to_history(session_id, "assistant", response)
            
            return result
            
        except Exception as e:
            error_msg = f"Error processing query: {str(e)}"
            print(error_msg)
            print(traceback.format_exc())
            
            error_response = "I'm sorry, I encountered an error processing your question. Please try again with a different question."
            self.add_to_history(session_id, "assistant", error_response)
            
            return {
                "answer": error_response,
                "relevant_outlets": [],
                "session_id": session_id,
                "error": str(e)
            }