from fastapi import FastAPI
from pydantic import BaseModel

from agent import Agent

# Initialize the agent instance
agent = Agent()

# FastAPI app
app = FastAPI()


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
    print(f"Session ID: {session_id}")

    # Process the user's query
    response = agent.process_query(request.user_input, session_id)

    return {"session_id": session_id, "response": response}
