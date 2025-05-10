import os
import uuid

from dotenv import load_dotenv
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

# Load file once
with open("../data.txt", "r", encoding="utf-8") as f:
    file_contents = f.read()

# Initial system instruction
initial_instruction = f"""You are a helpful assistant. Base your answers on the following file content."

--- FILE CONTENT START ---
{file_contents}
--- FILE CONTENT END ---
"""

# LLM setup
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash", google_api_key=os.environ["API_KEY"]
)


def should_stop_conversation(query: str) -> bool:
    """Detects stop commands in user input."""
    stop_keywords = [
        "exit",
        "quit",
        "stop",
        "end",
        "close",
        "goodbye",
        "bye",
        "take care",
    ]
    return any(k in query.lower() for k in stop_keywords)


def create_new_chain() -> ConversationChain:
    """Creates a new conversation chain with memory."""
    memory = ConversationBufferMemory(
        memory_key="history", return_messages=True
    )
    memory.chat_memory.add_ai_message(initial_instruction)

    return ConversationChain(llm=llm, memory=memory, verbose=True)


class Agent:
    def __init__(self):
        # Session store
        self.session_store = {}

    def get_or_create_chain(self, session_id: str = None) -> ConversationChain:
        """Returns the existing conversation chain or creates a new one."""
        if not session_id or session_id not in self.session_store:
            print("Creating a new session... session_id:", session_id)
            session_id = str(
                uuid.uuid4()
            )  # Generate a new session ID if not provided
            self.session_store[session_id] = create_new_chain()
            print(f"Created new session: {session_id}")
        else:
            print(f"Using existing session: {session_id}")

        return self.session_store[session_id], session_id

    def process_query(self, query: str, session_id: str) -> str:
        """Process a user query using the correct conversation chain."""
        conversation_chain = self.session_store.get(session_id)

        if should_stop_conversation(query):
            return "Goodbye! It was nice chatting with you."

        # Log current memory (for debugging purposes)
        print(f"Session {session_id} - Current memory:")
        print(conversation_chain.memory.buffer)

        # Get the agent's response
        return conversation_chain.run(query)
