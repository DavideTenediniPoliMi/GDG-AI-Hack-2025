from langgraph.graph import StateGraph
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import TypedDict, Literal
import os

# --- Shared state
class AgentState(TypedDict):
    user_input: str
    selected_agent: Literal["math_teacher", "history_teacher"]

# --- LLM
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key="asdjibisudf")

# --- Nodes
def start_node(state: AgentState) -> AgentState:
    print("Choose a teacher (math or history):")
    choice = input().strip().lower()
    state['selected_agent'] = 'math_teacher' if 'math' in choice else 'history_teacher'
    return state

def math_teacher_node(state: AgentState) -> AgentState:
    print("Ask a math question:")
    state['user_input'] = input()
    response = llm.invoke(f"You are a math teacher. Answer this question: {state['user_input']}")
    print("Math Teacher:", response.content)
    return state

def history_teacher_node(state: AgentState) -> AgentState:
    print("Ask a history question:")
    state['user_input'] = input()
    response = llm.invoke(f"You are a history teacher. Answer this question: {state['user_input']}")
    print("History Teacher:", response.content)
    return state

# --- Build the graph
graph = StateGraph(AgentState)
graph.add_node("start", start_node)
graph.add_node("math_teacher", math_teacher_node)
graph.add_node("history_teacher", history_teacher_node)

# Conditional branching
graph.set_entry_point("start")
graph.add_conditional_edges("start", lambda state: state['selected_agent'], {
    "math_teacher": "math_teacher",
    "history_teacher": "history_teacher"
})

# Finalize and run
app = graph.compile()

# Example run
app.invoke({"user_input": "", "selected_agent": "math_teacher"})
