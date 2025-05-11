import os

from dotenv import load_dotenv
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()


def base_prompt(content):
    return f"""You are a helpful assistant. Base your answers on the following file content
    
    --- FILE CONTENT START ---
    {content}
    --- FILE CONTENT END ---"""


def create_new_chain(init_message) -> ConversationChain:
    """Creates a new conversation chain with memory."""
    memory = ConversationBufferMemory(
        memory_key="history", return_messages=True
    )
    memory.chat_memory.add_ai_message(init_message)
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash", google_api_key=os.environ["API_KEY"]
    )
    return ConversationChain(llm=llm, memory=memory, verbose=True)


class Agent:
    def __init__(self, name: str, personality_prompt: str):
        """Initialize the agent with a name and personality."""
        self.name = name
        self.personality_prompt = personality_prompt
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash", google_api_key=os.environ["API_KEY"]
        )
        self.session_store = {}
        self.initial_instruction = self.personality_prompt

    def get_or_create_chain(self, session_id: str) -> ConversationChain:
        """Returns the existing conversation chain or creates a new one."""
        if session_id not in self.session_store:
            self.session_store[session_id] = create_new_chain(
                self.initial_instruction
            )
        return self.session_store[session_id], session_id

    def process_query(self, query: str, session_id: str) -> str:
        """Process a user query using the correct conversation chain."""
        conversation_chain = self.session_store.get(session_id)
        if conversation_chain:
            return conversation_chain.run(query)
        return "Session not found."

    def add_context(self, session_id: str, context: str) -> None:
        """Add context to the conversation chain."""
        conversation_chain = self.session_store.get(session_id)
        if conversation_chain:
            conversation_chain.memory.chat_memory.add_ai_message(context)


class Professor(Agent):
    def __init__(self, name: str, personality_prompt: str, content_path: str):
        """Initialize the Professor class, which includes loading the content."""
        super().__init__(name, personality_prompt)
        content = self.load_file(content_path)
        self.initial_instruction = (
            base_prompt(content)
            + f"\n Your name is {self.name}. "
            + personality_prompt
        )

    def load_file(self, path: str) -> str:
        """Load content from the specified file."""
        with open(path, "r", encoding="utf-8") as f:
            file_contents = f.read()
        return file_contents
