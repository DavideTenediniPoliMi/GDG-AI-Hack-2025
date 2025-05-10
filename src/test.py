import os
from typing import List, TypedDict

from dotenv import load_dotenv
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph

# Ensure you have your Google AI Studio API key configured as an environment variable
# (e.g., export GOOGLE_API_KEY="YOUR_API_KEY")

load_dotenv()


# 1. Define the state
class AgentState(TypedDict):
    messages: List[BaseMessage]
    user_choice: str


# 2. Initialize the language model
try:
    llm = ChatGoogleGenerativeAI(
        model="gemini-pro", google_api_key=os.getenv("API_KEY")
    )
except Exception as e:
    print(f"Error initializing ChatGoogleGenerativeAI: {e}")
    print("Make sure you have a valid Google AI Studio API key configured.")
    exit()


# 3. Define the teacher agents
def maths_teacher(state):
    print("Maths Teacher Agent interacting...")
    prompt = PromptTemplate.from_template(
        "You are a helpful maths teacher. The user's last message was: {last_message}"
    )
    response = llm.invoke(
        prompt.format(last_message=state["messages"][-1].content)
    )
    return {"messages": state["messages"] + [response]}


def history_teacher(state):
    print("History Teacher Agent interacting...")
    prompt = PromptTemplate.from_template(
        "You are a knowledgeable history teacher. The user's last message was: {last_message}"
    )
    response = llm.invoke(
        prompt.format(last_message=state["messages"][-1].content)
    )
    return {"messages": state["messages"] + [response]}


# 4. Define the initial choice node
def make_choice(state):
    print("Presenting teacher choices...")
    return {
        "messages": [
            AIMessage(
                content="Welcome! Type 'maths' to talk to the Maths Teacher or 'history' for the History Teacher."
            )
        ]
    }


# 5. Create the StateGraph
workflow = StateGraph(AgentState)

# 6. Add nodes
workflow.add_node("choice", make_choice)
workflow.add_node("maths", maths_teacher)
workflow.add_node("history", history_teacher)

# 7. Add edges
workflow.set_entry_point("choice")
workflow.add_conditional_edges(
    "choice",
    {
        "maths": lambda state: "maths"
        in state["messages"][-1].content.lower(),
        "history": lambda state: "history"
        in state["messages"][-1].content.lower(),
    },
    lambda state: state["messages"][-1].content.lower(),
)
workflow.add_edge("maths", END)
workflow.add_edge("history", END)

# 8. Compile the graph
app = workflow.compile()

# 9. Run the example
inputs = {"messages": [HumanMessage(content="maths")]}
result = app.invoke(inputs)
print(result)

inputs = {"messages": [HumanMessage(content="Tell me about algebra.")]}
result = app.invoke(
    inputs, config={"configurable": {"runnable": app}}
)  # Continue with the chosen agent
print(result)

inputs = {"messages": [HumanMessage(content="history")]}
result = app.invoke(
    inputs, config={"configurable": {"runnable": app}}
)  # Start with the other agent
print(result)

inputs = {
    "messages": [HumanMessage(content="Tell me about the Roman Empire.")]
}
result = app.invoke(
    inputs, config={"configurable": {"runnable": app}}
)  # Continue with the chosen agent
print(result)
