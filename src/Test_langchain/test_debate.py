from langgraph.graph import StateGraph
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.memory import ConversationSummaryMemory
from langchain.chains import ConversationChain
from typing import TypedDict, Literal
from dotenv import load_dotenv
import os
from langchain.prompts import PromptTemplate

# --- Prompts
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
"Hey Brandon, Grodor seemed a bit off in class today. Did he say anything to you?" """

# --- Load environment variables
load_dotenv()

# --- Shared state
class AgentState(TypedDict):
    user_input: str
    current_state: Literal["math_teacher", "history_teacher"]
    speaker_state: Literal["waiting", "math_teacher", "history_teacher"]
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
def make_teacher_chain(llm, memory, system_prompt, prepend_context=""):
    full_prompt = f"{prepend_context}\nSystem: {system_prompt}\n\nHuman: {{input}}"
    return ConversationChain(
        llm=llm,
        memory=memory,
        verbose=False,
        prompt=PromptTemplate.from_template("{history}\n" + full_prompt)
    )

math_chain = make_teacher_chain(llm_math, math_memory, math_system_prompt)
history_chain = make_teacher_chain(llm_history, history_memory, history_system_prompt)

# --- LangGraph nodes
def math_teacher_node(state: AgentState) -> AgentState:
    response = math_chain.predict(input=state['user_input'])
    print("\nMath Teacher:", response)
    return {**state, 'user_input': response, 'speaker_state': 'waiting', 'current_state': 'math_teacher'}

def history_teacher_node(state: AgentState) -> AgentState:
    response = history_chain.predict(input=state['user_input'])
    print("\nHistory Teacher:", response)
    return {**state, 'user_input': response, 'speaker_state': 'waiting', 'current_state': 'history_teacher'}

def waiting_node(state: AgentState) -> AgentState:
    print("\n[WAITING] Press Enter to continue or type a user intervention:")
    user_inp = input().strip()

    if user_inp.lower() in ['exit', 'quit']:
        return {**state, 'exit': True}
    
    if user_inp:
        print("You (as Grodor):", user_inp)
        # When user intervenes, alternate from last speaker
        next_speaker = 'history_teacher' if state['current_state'] == 'math_teacher' else 'math_teacher'
        return {
            **state, 
            'user_input': f"Grodor: {user_inp}", 
            'speaker_state': next_speaker
        }
    else:
        # When continuing naturally, alternate based on last speaker
        next_speaker = 'history_teacher' if state['current_state'] == 'math_teacher' else 'math_teacher'
        # Carry forward the last message as input
        return {
            **state,
            'user_input': state['user_input'],  # Use the last message as input
            'speaker_state': next_speaker
        }

# --- Graph definition
graph = StateGraph(AgentState)
graph.set_entry_point("waiting")
graph.add_node("math_teacher", math_teacher_node)
graph.add_node("history_teacher", history_teacher_node)
graph.add_node("waiting", waiting_node)

# --- Edges
graph.add_conditional_edges("waiting", lambda s: "exit" if s["exit"] else s["speaker_state"], {
    "math_teacher": "math_teacher",
    "history_teacher": "history_teacher"
})

graph.add_edge("math_teacher", "waiting")
graph.add_edge("history_teacher", "waiting")

# --- Run
app = graph.compile()

initial_state = {
    'user_input': "Hey Stephanie, how do you think Grodor is doing lately?",
    'speaker_state': 'waiting',  # Changed to math_teacher since they're initiating
    'current_state': 'math_teacher',
    'exit': False
}

print("\nMath Teacher: Hey Stephanie, how do you think Grodor is doing lately?")

app.invoke(initial_state)
