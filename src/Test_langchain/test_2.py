from langgraph.graph import StateGraph
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.memory import ConversationSummaryMemory
from langchain.chains import ConversationChain
from typing import TypedDict, Literal
from dotenv import load_dotenv
import os
from langchain.prompts import PromptTemplate

math_system_prompt = """
You are Brandon, a math teacher.
You teach Grodor.
Speak in a natural, realistic, spoken tone — like a real teacher. Formal but friendly with your students, informal with your colleagues.
Avoid narrating your own actions or emotions. Do not use parentheses or describe physical gestures.
Do not write like a story or a play. Just talk, clearly and directly.

Example of the tone to use:
"Hey Stephanie, Grodor seemed a bit off in class today. Did he say anything to you?"
"""

history_system_prompt = """You are Stephanie, a very scared history teacher.
You teach Grodor.
Speak in a natural, realistic, spoken tone — like a real teacher. Formal but friendly with your students, informal with your colleagues.
Avoid narrating your own actions or emotions. Do not use parentheses or describe physical gestures.
Do not write like a story or a play. Just talk, clearly and directly.

Example of the tone to use:
"Hey Brandon, Grodor seemed a bit off in class today. Did he say anything to you?"""

from langchain.chains import ConversationChain
from langchain.prompts import PromptTemplate
from langchain.schema import SystemMessage

def make_teacher_chain(llm, memory, system_prompt, prepend_context=""):
    full_prompt = f"{prepend_context}\nSystem: {system_prompt}\n\nHuman: {{input}}"
    return ConversationChain(
        llm=llm,
        memory=memory,
        verbose=False,
        prompt=PromptTemplate.from_template("{history}\n" + full_prompt)
    )

# --- Load environment variables
load_dotenv()

# --- Shared state
class AgentState(TypedDict):
    user_input: str
    selected_agent: Literal["math_teacher", "history_teacher"]
    exit: bool

# --- LLM Instances
llm_math = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=os.environ["API_KEY"])
llm_history = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=os.environ["API_KEY"])

# --- Memory with summarization
math_memory = ConversationSummaryMemory(llm=llm_math, memory_key="history")
history_memory = ConversationSummaryMemory(llm=llm_history, memory_key="history")

math_memory.chat_memory.add_user_message("You are Brandon. You are a math teacher. Your colleague is Stephanie, the history teacher.")
math_memory.chat_memory.add_ai_message("Understood.")
math_memory.chat_memory.add_user_message("Your only student is Grodor. You must monitor his mathematical progress.")
math_memory.chat_memory.add_ai_message("Understood.")

history_memory.chat_memory.add_user_message("You are Stephanie. You are a history teacher. Your colleague is Brandon, the maths teacher.")
history_memory.chat_memory.add_ai_message("Understood.")
history_memory.chat_memory.add_user_message("Your only student is Grodor. He seems a bit anxious during history.")
history_memory.chat_memory.add_ai_message("Understood.")

# --- Conversation chains
math_teacher_chain = make_teacher_chain(llm_math, math_memory, math_system_prompt)
history_teacher_chain = make_teacher_chain(llm_history, history_memory, history_system_prompt)

# --- Factory for teacher interaction nodes
def teacher_node_factory(chain, role_description):
    def teacher_node(state: AgentState) -> AgentState:
        print(f"\nAsk a {role_description} question (type 'exit' to stop):")
        user_q = input()
        if user_q.lower().strip() in ['exit', 'quit', 'done']:
            state['exit'] = True
            return state
        state['user_input'] = user_q
        response = chain.predict(input=user_q)
        print(f"{role_description.title()}:", response)
        state['exit'] = False
        return state
    return teacher_node

math_teacher_node = teacher_node_factory(math_teacher_chain, "angry math teacher")
history_teacher_node = teacher_node_factory(history_teacher_chain, "very scared history teacher")

# --- Summarize memory content
def summarize_agent_memory(agent_chain, subject):
    summary_prompt = (
        f"You are a {subject} teacher attending a meeting. Summarize the student's recent progress, including behavior, emotions, or anything noteworthy. "
        f"If there's nothing significant to report, say 'No updates.'"
        f"Do not role-play, be a professional teacher with your personal character traits."
    )
    return agent_chain.predict(input=summary_prompt)

# --- Agent-to-agent update interaction

def agent_to_agent_interaction_update(math_agent, history_agent):
    print("\n--- Agent-to-Agent Mode: Teachers Talk About Grodor ---")

    # Explicit context prepended
    prepend_context = (
        "IMPORTANT: You are now in a private conversation with another teacher. "
        "Do NOT talk as if you're speaking to Grodor. You are speaking to a colleague, discussing Grodor's progress. "
        "Do not ask or answer as if Grodor is present."
    )

    # Rebuild agent chains with new prompt
    math_chain_tt = make_teacher_chain(llm_math, math_memory, math_system_prompt, prepend_context)
    history_chain_tt = make_teacher_chain(llm_history, history_memory, history_system_prompt, prepend_context)

    start_msg = "Hey Stephanie, how do you think Grodor is doing lately?"

    math_response = math_chain_tt.predict(input=start_msg)
    print("\nMath Teacher:", math_response)

    history_response = history_chain_tt.predict(input=math_response)
    print("\nHistory Teacher:", history_response)

    follow_up = math_chain_tt.predict(input=history_response)
    print("\nMath Teacher (reply):", follow_up)

# --- Start node

def start_node(state: AgentState) -> AgentState:
    print("\nChoose: (math / history / agents):")
    choice = input().strip().lower()
    if choice == "agents":
        agent_to_agent_interaction_update(math_teacher_chain, history_teacher_chain)
        state['exit'] = True
    elif "math" in choice:
        state['selected_agent'] = 'math_teacher'
        state['exit'] = False
    else:
        state['selected_agent'] = 'history_teacher'
        state['exit'] = False
    return state

# --- LangGraph setup
graph = StateGraph(AgentState)
graph.set_entry_point("start")
graph.add_node("start", start_node)
graph.add_node("math_teacher", math_teacher_node)
graph.add_node("history_teacher", history_teacher_node)

graph.add_conditional_edges("start", lambda s: s["selected_agent"], {
    "math_teacher": "math_teacher",
    "history_teacher": "history_teacher"
})

for agent in ["math_teacher", "history_teacher"]:
    graph.add_conditional_edges(agent, lambda s: "start" if s["exit"] else s["selected_agent"], {
        "start": "start",
        "math_teacher": "math_teacher",
        "history_teacher": "history_teacher"
    })

# --- Run application
app = graph.compile()

app.invoke({"user_input": "", "selected_agent": "math_teacher", "exit": False})
