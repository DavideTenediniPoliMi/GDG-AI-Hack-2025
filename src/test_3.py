import os
from typing import Optional, TypedDict

from dotenv import load_dotenv
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph

load_dotenv()

# Load the file once
# Load file contents
with open("data.txt", "r", encoding="utf-8") as f:
    file_contents = f.read()

# Setup LLM (free-tier)
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash", google_api_key=os.environ["API_KEY"]
)

memory = ConversationBufferMemory(memory_key="history", return_messages=True)

# Inject system message ONCE
initial_instruction = f"""You are a helpful assistant. Only answer questions that can be answered from the following file content.
If the user asks something outside this data, respond with: "I'm only allowed to answer questions based on the provided file."

--- FILE CONTENT START ---
{file_contents}
--- FILE CONTENT END ---
"""
# Add this instruction as an AI message so it’s part of chat context
memory.chat_memory.add_ai_message(initial_instruction)

# Conversation chain
conversation_chain = ConversationChain(llm=llm, memory=memory, verbose=True)


# Agent state
class AgentState(TypedDict):
    user_input: str
    response: Optional[str]


# Stop detection
def should_stop_conversation(query: str) -> bool:
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


# Agent node
def agent_node(state: AgentState) -> AgentState:
    query = state["user_input"]

    if should_stop_conversation(query):
        return {
            "user_input": query,
            "response": "Goodbye! It was nice chatting with you.",
        }

    response = conversation_chain.run(query)
    return {"user_input": query, "response": response}


# LangGraph config
graph_builder = StateGraph(AgentState)
graph_builder.add_node("agent", agent_node)
graph_builder.set_entry_point("agent")
graph = graph_builder.compile()

# Chat loop
print("Chat with the agent. Type 'exit' or similar to quit.")
while True:
    user_input = input("You: ")
    if should_stop_conversation(user_input):
        print("Bot: Goodbye! It was nice chatting with you.")
        break

    state = {"user_input": user_input, "response": None}
    state = graph.invoke(state)
    print("Bot:", state["response"])
