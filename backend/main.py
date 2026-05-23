from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client
from langchain_groq import ChatGroq
from pydantic import BaseModel
import os

# Load the .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Create the FastAPI app
app = FastAPI()

# Allow frontend to talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to supabase
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Connect to GROQ API
llm = ChatGroq(
    api_key = os.getenv("GROQ_API_KEY"),
    model = "llama-3.3-70b-versatile"
)

class ChatRequest(BaseModel):
    conversation_id: str
    message: str

@app.get("/")
def read_root():
    return {"message": "AI Chatbot API is running!"}

@app.post("/conversations")
def create_conversation():

    # Step 1: Insert first new conversation
    response = supabase.schema("project2").table("conversations").insert({
        "title": "New Conversation",
    }).execute()

    # Step 2: Get auto generated id from the response
    conversation_id = response.data[0]["id"]

    # Step 3: Return it
    return {
        "conversation_id": conversation_id
    }