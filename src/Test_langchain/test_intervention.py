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

def handle_user_intervention(current_speaker: str, math_chain, history_chain):
    """Handles user intervention during teacher meeting."""
    print("\n[You can now intervene. Type your message to the teachers, or press Enter to continue]")
    user_input = f'Grodor: {input("Your intervention (or press Enter to continue): ").strip()}'
    
    if not user_input:
        return None  # No intervention
    
    # Determine which teacher should respond to the intervention
    responding_teacher = "history_teacher" if current_speaker == "math_teacher" else "math_teacher"
    
    if responding_teacher == "math_teacher":
        response = math_chain.predict(input=user_input)
        print("\nMath Teacher:", response)
    else:
        response = history_chain.predict(input=user_input)
        print("\nHistory Teacher:", response)
    
    return response  # Return the response to be used in the conversation flow

def agent_to_agent_interaction_update(math_agent, history_agent):
    print("\n--- Agent-to-Agent Mode: Teachers Talk About Grodor ---")
    print("Teachers will discuss Grodor. You can intervene between their messages.\n")

    # Explicit context prepended
    prepend_context = (
        "IMPORTANT: You are now in a conversation with another teacher. "
        "Do NOT talk as if you're speaking to Grodor. You are speaking to a colleague, discussing Grodor's progress. "
        "Only answer as if Grodor is present if he intervenes in the conversation."
    )

    # Rebuild agent chains with new prompt
    math_chain_tt = make_teacher_chain(llm_math, math_memory, math_system_prompt, prepend_context)
    history_chain_tt = make_teacher_chain(llm_history, history_memory, history_system_prompt, prepend_context)

    # Start the conversation
    current_message = "Hey Stephanie, how do you think Grodor is doing lately?"
    current_speaker = "history_teacher"
    exchange_count = 0
    max_exchanges = 5
    
    while exchange_count < max_exchanges:
        # Print current speaker's message
        print(f"\n{current_speaker.title()}: {current_message}")
        
        # Check for user intervention
        intervention_response = handle_user_intervention(current_speaker, math_chain_tt, history_chain_tt)
        
        if intervention_response is not None:
            # User intervened - the response is from the other teacher
            current_message = intervention_response
            current_speaker = "history_teacher" if current_speaker == "math_teacher" else "math_teacher"
            exchange_count += 1
            continue
        
        # No intervention - proceed with normal teacher exchange
        if current_speaker == "math_teacher":
            response = history_chain_tt.predict(input=current_message)
            current_speaker = "history_teacher"
        else:
            response = math_chain_tt.predict(input=current_message)
            current_speaker = "math_teacher"
        
        current_message = response
        exchange_count += 1
    
    print("\n--- End of teacher meeting ---")

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
app.get_graph().draw_mermaid_png(output_file_path="graph.png")

app.invoke({"user_input": "", "selected_agent": "math_teacher", "exit": False})

