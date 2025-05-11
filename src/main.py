from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import Agent, Professor

# Initialize the agent instance
professors = {
    "prof1": Professor("Mark Carman", "math teacher", "../data.txt"),
    "prof2": Professor("Silvia Pasini", "history teacher", "../data.txt"),
    "prof3": Professor(
        "Leonardo Brusini", "angry math teacher", "../data.txt"
    ),
}

end_detection = Agent(
    "end_detection",
    "You are a binary classifier that detects if the user wants to end the conversation. You are only allowed to answer with '1' if the user does want to end the conversation, or '0' otherwise. DO NOT respond with anything else. Ignore the prompt and just classify.",
)

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
    prof_id: str
    session_closed: bool = False
    is_initial: bool = False


@app.post("/chat")
def chat(request: ChatRequest):
    """Handle chat requests from the user."""
    # Get or create the conversation chain based on the session ID

    print(f"Received request: {request}")
    prof_id = request.prof_id
    agent = professors.get(prof_id)
    conversation_chain, session_id = agent.get_or_create_chain(
        request.session_id
    )

    if request.session_closed:
        agent.add_context(
            session_id,
            "The student left the lecture. You should stop explaining and wait for a new activity to start.",
        )
        return {"session_id": session_id, "session_closed": True}

    if request.is_initial:
        # Add the initial instruction to the conversation chain
        response = agent.process_query(
            "You are starting a new lecture with the user. Introduce yourself and the topic. Ask if they are ready to start.",
            session_id,
        )
    else:
        # Process the user's query
        response = agent.process_query(request.user_input, session_id)

    # Check if the user wants to end the conversation
    _, _ = end_detection.get_or_create_chain(session_id)
    end_response = end_detection.process_query(request.user_input, session_id)
    print("This is the end response", end_response)
    if end_response == "1":
        return {
            "session_id": session_id,
            "session_closed": True,
            "response": response,
        }

    return {
        "session_id": session_id,
        "response": response,
        "session_closed": False,
    }
