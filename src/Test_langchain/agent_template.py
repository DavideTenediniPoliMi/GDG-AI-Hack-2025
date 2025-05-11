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


class Professor:
    def __init__(self, name: str, personality_prompt: str, content_path: str):
        # Session store
        self.name = name
        self.personality_prompt = personality_prompt
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash", google_api_key=os.environ["API_KEY"]
        )
        self.session_store = {}
        content = self.load_file(content_path)
        self.initial_instruction = (
            base_prompt(content) + "\n" + personality_prompt
        )

    def load_file(self, path: str) -> str:
        with open(path, "r", encoding="utf-8") as f:
            file_contents = f.read()
        return file_contents

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

        return conversation_chain.run(query)
    
    def add_context(self, session_id: str, context: str) -> None:
        """Add context to the conversation chain."""
        conversation_chain = self.session_store.get(session_id)
        if conversation_chain:
            conversation_chain.memory.chat_memory.add_ai_message(context)
        