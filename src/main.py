from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import Professor

# Initialize the agent instance
agent = Professor("Carman", "math teacher", "../data.txt")

# FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods, including OPTIONS
    allow_headers=["*"],  # Allows all headers
)


# Request model
class ChatRequest(BaseModel):
    session_id: str = None
    user_input: str


@app.post("/chat")
def chat(request: ChatRequest):
    """Handle chat requests from the user."""
    # Get or create the conversation chain based on the session ID
    conversation_chain, session_id = agent.get_or_create_chain(
        request.session_id
    )

    # Process the user's query
    response = agent.process_query(request.user_input, session_id)

    return {"session_id": session_id, "response": response}
