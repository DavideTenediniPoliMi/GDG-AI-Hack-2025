from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import Agent, Professor

# Initialize the agent instance
professors = {
    "prof1": Professor(
        "Mark Carman",
        "You are an english professor.",
        "../english_professor.txt",
    ),
    "prof2": Professor("Silvia Pasini", "history teacher", "../data.txt"),
    "prof3": Professor(
        "Leonardo Brusini",
        "You are a science professor.",
        "../science_professor.txt",
    ),
    "prof4": Professor("Luca Bianchi", "angry history teacher", "../data.txt"),
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


class DebateRequest(BaseModel):
    session_id: str = None
    user_input: str
    prof_id1: str
    prof_id2: str
    session_closed: bool = False
    is_initial: bool = False
    topic: str = None


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
    end_response = end_detection.process_query(response, session_id)
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


debate_state = {
    "last_message": None,
    "last_sender": None,  # Possible senders: 0, 1, 2 # 0: user, 1: prof1, 2: prof2
}


@app.post("/debate")
def debate(request: DebateRequest):
    """Handle debate requests between two professors."""
    print(f"Received debate request: {request}")
    p1 = professors.get(request.prof_id1)
    p2 = professors.get(request.prof_id2)
    if not p1 or not p2:
        return {"error": "Invalid professor IDs."}
    # Create a conversation chain for the debate
    conversation_chain1, session_id1 = p1.get_or_create_chain(
        request.session_id
    )
    conversation_chain2, session_id2 = p2.get_or_create_chain(
        request.session_id
    )

    if request.session_closed:
        p1.add_context(
            session_id1,
            "The student left the debate. You should stop explaining and wait for a new activity to start.",
        )
        p2.add_context(
            session_id2,
            "The student left the debate. You should stop explaining and wait for a new activity to start.",
        )
        return {"session_id": session_id1, "session_closed": True}

    if request.is_initial:
        # Add the initial instruction to the conversation chain
        response = p1.process_query(
            "You are starting a new  discussion with another professor. Introduce yourself in a natural and brief way. There are only you, the other professor, and the user, so keep it brief and casual. The user is also listening and might intervene. Keep your interactions relatively short. The topic about the ethics of using AI as an innovation tool."
            "Each message you see will either start with PROF. Prof Name, or STUDENT. This indicates who is speaking to you. DO NOT write your own name in the response and do not use quotation marks in your response.",
            session_id1,
        )
        debate_state["last_speaker"] = 1
        debate_state["last_message"] = f"PROF. {p1.name}: " + response
        p2.add_context(
            session_id2,
            "You are starting a new  discussion with another professor. Introduce yourself in a natural and brief way. There are only you, the other professor, and the user, so keep it brief and casual. The user is also listening and might intervene. Keep your interactions relatively short. The topic about the ethics of using AI as an innovation tool."
            "Each message you see will either start with PROF. Prof Name, or STUDENT. This indicates who is speaking to you. DO NOT write your own name in the response and do not use quotation marks in your response.")
    elif request.user_input != "":
        # Process the user's query
        p = p1 if debate_state["last_speaker"] == 2 else p2
        response = p.process_query(
            debate_state["last_message"]
            + "\n\nSTUDENT: "
            + request.user_input,
            session_id1,
        )
        debate_state["last_speaker"] = (
            2 if debate_state["last_speaker"] == 1 else 1
        )
        debate_state["last_message"] = (
            "STUDENT: "
            + request.user_input
            + "\n\nPROF. {p.name}: "
            + response
        )
    else:
        # Process the user's query
        p = p1 if debate_state["last_speaker"] == 2  else p2
        response = p.process_query(debate_state["last_message"], session_id1)
        debate_state["last_speaker"] = (
            2 if debate_state["last_speaker"] == 1 else 1
        )
        debate_state["last_message"] = f"PROF. {p.name}: " + response

    _, _ = end_detection.get_or_create_chain(session_id1)
    end_response = end_detection.process_query(response, session_id1)
    print("This is the end response", end_response)
    if end_response == "1":
        return {
            "session_id": session_id1,
            "session_closed": True,
            "response": response,
            "from": request.prof_id1
            if debate_state["last_speaker"] == 1
            else request.prof_id2,
        }

    return {
        "session_id": session_id1,
        "session_closed": False,
        "response": response,
        "from": request.prof_id1
        if debate_state["last_speaker"] == 1
        else request.prof_id2,
    }
