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

# Route for conversations
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

# Route for chat
@app.post("/chat")
async def chat(request: ChatRequest):

    # Step 1: Get past messages from Supabase from memory
    past_messages = supabase.schema("project2").table("messages").select("*").eq("conversation_id", request.conversation_id).execute()

    history = [{
        "role": "system",
        "content" : "You are a helpful assistant. If the user asks about refunds, complaints, billing issues, or urgent problems — respond with ESCALATE: followed by ONE short sentence explaining why. Do not try to help with the issue. Just escalate immediately"
    }]

    # Step 2: Format pass messages for Groq
    for messages in past_messages.data:
        history.append({
           "role": messages["role"],
           "content": messages["content"]
        })

    # Step 3: add new message to the history
    history.append({
        "role": "user",
        "content": request.message
    })

    # Step 4: Send to ai and save to supabase
    response = llm.invoke(history)
    ai_message = response.content

    # Step 5: Save user message to supabase
    supabase.schema("project2").table("messages").insert({
        "conversation_id": request.conversation_id,
        "role": "user",
        "content": request.message
    }).execute()

    # Step 6: Check escalation and return
    if ai_message.startswith("ESCALATE"):   
        return {
            "escalated": True,
            "reason": ai_message.replace("ESCALATE:", "").strip()
        }
    else:
        return {
            "escalated": False,
            "ai_message": ai_message
        }

    # Step 7: Save AI response to Supabase
    supabase.schema("project2").table("messages").insert({
        "conversation_id": request.conversation_id,
        "role": "assistant",
        "content": ai_message
    }).execute()

    # return
    return {
        "ai_message": ai_message
    }

# Get chat history route
@app.get("/conversations/{id}")
def get_conversation(id: str):
     
     # Step 1:  Get id from conversation
     past_messages = supabase.schema("project2").table("messages").select("*").eq("conversation_id", id).execute()

    # Step 2: Return past history data
     return{
         "messages": past_messages.data
     }