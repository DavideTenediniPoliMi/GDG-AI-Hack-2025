import os
from typing import Literal, TypedDict

from dotenv import load_dotenv
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferWindowMemory
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph
from IPython.display import display, Image

load_dotenv()


# --- Shared state
class AgentState(TypedDict):
    user_input: str
    selected_agent: Literal["math_teacher", "history_teacher"]
    exit: bool


llm_meth = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash", google_api_key=os.environ["API_KEY"]
)
llm_hest = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash", google_api_key=os.environ["API_KEY"]
)


# --- Start node to choose teacher
def start_node(state: AgentState) -> AgentState:
    print("Choose a teacher (math or history):")
    choice = input().strip().lower()
    state["selected_agent"] = (
        "math_teacher" if "math" in choice else "history_teacher"
    )
    state["exit"] = False
    return state


def teacher_node_factory(chain, role_description):
    def teacher_node(state: AgentState) -> AgentState:
        print(f"\nAsk a {role_description} question (type 'exit' to stop):")
        user_q = input()
        if user_q.lower().strip() in ["exit", "quit", "done"]:
            state["exit"] = True
            return state
        state["user_input"] = user_q
        response = chain.predict(input=user_q)
        print(f"{role_description.title()}:", response)
        state["exit"] = False
        return state

    return teacher_node


# One memory per agent (optional: share one if you want shared memory)
math_memory = ConversationBufferWindowMemory(k=3)
history_memory = ConversationBufferWindowMemory(k=3)

math_teacher_chain = ConversationChain(llm=llm_meth, memory=math_memory)
history_teacher_chain = ConversationChain(llm=llm_hest, memory=history_memory)

math_teacher_node = teacher_node_factory(
    math_teacher_chain, "angry math teacher"
)
history_teacher_node = teacher_node_factory(
    history_teacher_chain, "very scared history teacher"
)


def agent_to_agent_interaction(math_agent, history_agent) -> None:
    print(
        "\n--- Agent-to-Agent Mode: Math Teacher talks to History Teacher ---"
    )
    initial_msg = (
        "Talk about your imaginary dog. Keep it short, max 2 sentences."
    )
    math_response = math_agent.predict(input=initial_msg)
    print("Math Teacher:", math_response)

    history_response = history_agent.predict(input=math_response)
    print("History Teacher:", history_response)


# --- LangGraph nodes
def start_node(state: AgentState) -> AgentState:
    print("\nChoose: (math / history / agents):")
    choice = input().strip().lower()
    if choice == "agents":
        agent_to_agent_interaction(math_teacher_chain, history_teacher_chain)
        state["exit"] = True
        return state
    elif "math" in choice:
        state["selected_agent"] = "math_teacher"
    else:
        state["selected_agent"] = "history_teacher"
    state["exit"] = False
    return state


# --- LangGraph construction
graph = StateGraph(AgentState)
graph.set_entry_point("start")
graph.add_node("start", start_node)
graph.add_node("math_teacher", math_teacher_node)
graph.add_node("history_teacher", history_teacher_node)

graph.add_conditional_edges(
    "start",
    lambda s: s["selected_agent"],
    {"math_teacher": "math_teacher", "history_teacher": "history_teacher"},
)

# Loops back unless exit
for agent in ["math_teacher", "history_teacher"]:
    graph.add_conditional_edges(
        agent,
        lambda s: "start" if s["exit"] else agent,
        {"start": "start", agent: agent},
    )

app = graph.compile()
# Visualize the graph
app.get_graph().draw_mermaid_png(output_file_path="graph.png")