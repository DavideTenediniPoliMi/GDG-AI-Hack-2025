// AppContext.js

import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

// --- Hardcoded Data --- (PROFESSORS_DATA, RANKING_DATA, USER_PROFILE_DATA, SUGGESTIONS_DATA remain same)
const PROFESSORS_DATA = [
    { id: 'prof1', name: 'Mark Carman', subject: 'ENGLISH', avatar: '/avatars/Mark_Carman.png', topics: ['Grammar Fundamentals', 'Literature Analysis', 'Essay Writing'], debateOpeningLine: "In the realm of language, clarity and precision are paramount. I believe English offers the most robust framework for expressing complex ideas." },
    { id: 'prof2', name: 'Silvia Pasini', subject: 'HISTORY', avatar: '/avatars/Silvia_Pasini.png', topics: ['Ancient Civilizations', 'World Wars', 'Modern History'], debateOpeningLine: "History, however, provides the context and narrative that shapes our understanding. Without history, words are just symbols without meaning." },
    { id: 'prof3', name: 'Leonardo Brusini', subject: 'SCIENCE', avatar: '/avatars/Leonardo_Brusini.png', topics: ['Physics Basics', 'Chemistry 101', 'Biology Introduction'], debateOpeningLine: "Science seeks to uncover objective truths through empirical evidence. The scientific method is our most reliable path to knowledge." },
    { id: 'prof4', name: 'Luca Bianchi', subject: 'MATHS', avatar: '/avatars/Luca_Bianchi.png', topics: ['Algebra', 'Geometry', 'Calculus Concepts'], debateOpeningLine: "Mathematics is the language of the universe, underpinning all scientific endeavor with its logical consistency." },
];

const RANKING_DATA = [
    { id: 'prof1', name: 'ENGLISH', score: 10, avatar: '/avatars/Mark_Carman.png' },
    { id: 'prof2', name: 'HISTORY', score: 9, avatar: '/avatars/Silvia_Pasini.png' },
    { id: 'prof4', name: 'MATHS', score: 8, avatar: '/avatars/Luca_Bianchi.png' },
    { id: 'prof3', name: 'SCIENCE', score: 8, avatar: '/avatars/Leonardo_Brusini.png' },
].sort((a, b) => b.score - a.score);


const USER_PROFILE_DATA = {
    name: 'Silvia',
    points: 30,
    avatar: '/avatars/User_Silvia.png'
};

const SUGGESTIONS_DATA = [
    { type: 'debate', prof1Id: 'prof1', prof2Id: 'prof2', topic: 'English vs History: The Foundation of Knowledge', id: 'sug1', text: 'You should start a debate between English and History on what forms the true foundation of knowledge.' },
];

// --- API Constants ---
const CHAT_API_URL = 'http://localhost:8000/chat'; // Lecture API URL
const DEBATE_API_URL = 'http://localhost:8000/debate'; // Debate API URL
const SESSION_ID = 'abc123-abc123-abc123-abc123'; // Hardcoded session ID (Consider generating unique IDs in a real app)
const DEBATE_POLLING_INTERVAL = 10000    ; // Poll backend every 2 seconds for new debate messages

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [currentPage, setCurrentPage] = useState('INDEX');
    const [selectedProfessor, setSelectedProfessor] = useState(null); // For ProfessorPage
    const [selectedTopic, setSelectedTopic] = useState(''); // For ProfessorPage

    // --- Lecture State ---
    const [lectureMessages, setLectureMessages] = useState([]);
    const [lectureInputValue, setLectureInputValue] = useState('');
    const [isLectureOverByBackend, setIsLectureOverByBackend] = useState(false);
    const [lectureTargetProfessor, setLectureTargetProfessor] = useState(null);
    const [currentLectureTopic, setCurrentLectureTopic] = useState('');
    const [isLectureLoading, setIsLectureLoading] = useState(false); // State to indicate API call is in progress

    // --- Debate State ---
    const [debateParticipants, setDebateParticipants] = useState([]); // Stores up to 2 professor IDs
    const [debateMessages, setDebateMessages] = useState([]);
    const [debateInputValue, setDebateInputValue] = useState('');
    const [isDebateActive, setIsDebateActive] = useState(false); // Frontend state: is debate setup and running?
    const [isDebateOverByBackend, setIsDebateOverByBackend] = useState(false); // Backend state: has the backend finished the debate?
    const [debateTopic, setDebateTopic] = useState("an engaging discussion");
    const [isDebateLoading, setIsDebateLoading] = useState(false); // State to indicate API call is in progress
    // Changed from IntervalRef to TimeoutRef for setTimeout polling
    const debatePollingTimeoutRef = useRef(null); // Ref to store the timeout ID

    // Helper to find professor details
    const getProfessorById = (id) => PROFESSORS_DATA.find(p => p.id === id);


    // --- Common Navigation & State Reset ---
    const navigateToHome = () => {
        // Clear any active debate polling timeout
        if (debatePollingTimeoutRef.current) {
            clearTimeout(debatePollingTimeoutRef.current);
            debatePollingTimeoutRef.current = null;
        }

        setCurrentPage('INDEX');
        // Reset lecture state
        setLectureMessages([]); setLectureInputValue(''); setIsLectureOverByBackend(false); setLectureTargetProfessor(null); setCurrentLectureTopic(''); setIsLectureLoading(false);
        // Reset debate state fully
        setDebateParticipants([]); setDebateMessages([]); setDebateInputValue(''); setIsDebateActive(false); setIsDebateOverByBackend(false); setDebateTopic("an engaging discussion"); setIsDebateLoading(false);
    };

    const navigateToProfessorPage = (professor) => {
        setSelectedProfessor(professor);
        setCurrentPage('PROFESSOR');
    };

    // --- LECTURE Functions (Modified only API URL and removed express import) ---
    const navigateToLecture = async (professor, topic) => {
        // Reset lecture state before starting a new one
        setLectureMessages([]);
        setLectureInputValue('');
        setIsLectureOverByBackend(false);
        setIsLectureLoading(true); // Start loading state
        setLectureTargetProfessor(professor);
        setCurrentLectureTopic(topic);
        setCurrentPage('LECTURE');

        // Prepare the initial message input for the backend
        const initialInput = ``; // As per your latest code, user_input is empty for init
        const prof_id = professor.id;

        // Send the initial message to the backend
        // The sendLectureMessageToBackend logic needs to correctly form the body for initial call
        await sendLectureMessageToBackend(initialInput, prof_id, true); // Pass true for isInitial

        // setIsLectureLoading(false); // This will be set to false in the finally block of sendLectureMessageToBackend
    };

    const navigateToInverseLecture = (professor, topic) => alert(`Inverse Lecture with ${professor.name} on "${topic}" (Not Implemented)`);


    // --- LECTURE API Call (using /chat) ---
    const sendLectureMessageToBackend = async (messageText, prof_id, isInitial = false, session_closed = false) => {
        // Use lectureTargetProfessor?.id if prof_id is not explicitly passed (for user messages)
        const actualProfId = prof_id || lectureTargetProfessor?.id;

        if (!actualProfId) {
            console.error("Cannot send message: No professor ID available.");
            setLectureMessages(prev => [...prev, { sender: 'system', text: 'Error: Professor information missing. Lecture ended.' }]);
            setIsLectureOverByBackend(true);
            setIsLectureLoading(false);
            return;
        }

        if (isLectureOverByBackend || (isLectureLoading && !session_closed)) { // Prevent sending if lecture is over or already loading another request (unless closing)
            console.log("Lecture API busy or over, skipping request.");
            return;
        }


        // Add user's message to the chat immediately (if it's not the initial internal call)
        if (!isInitial && !session_closed) {
            setLectureMessages(prev => [...prev, { sender: 'user', text: messageText}]);
            setLectureInputValue(''); // Clear input field
            // Optional: Add a '...' message while waiting for response
            // setLectureMessages(prev => [...prev, { sender: 'system', text: '...' }]);
        } else if (isInitial) {
            // Optional: Add a '...' message while waiting for initial response
            setLectureMessages(prev => [...prev, { sender: 'system', text: `Connecting to ${lectureTargetProfessor?.name} for lecture...` }]);
        }


        setIsLectureLoading(true); // Set loading state for API call

        try {
            const response = await fetch(CHAT_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "session_id": SESSION_ID,
                    "user_input": messageText, // Send user's text (or empty string for initial)
                    "prof_id": actualProfId, // Send the professor ID
                    "is_initial": isInitial, // Indicate if it's the initial message
                    "session_closed": session_closed, // Indicate if session is closed (e.g., by user)
                }),
            });

            if (!response.ok) {
                // Handle non-200 responses
                const errorText = await response.text();
                throw new Error(`Backend error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();

            // --- Backend Response Structure Assumption for /chat ---
            // Based on your previous backend code, it returned {"session_id": ..., "response": ...}
            // And you added "session_closed" to the frontend request, let's assume backend might return it too?
            // Let's stick to the backend you provided first which only returns "response".
            const professorResponse = data.response;
            // If backend was updated to return session_closed, you'd get it here:
            // const sessionClosedByBackend = data.session_closed;


             setLectureMessages(prev => prev.filter(msg => msg.sender !== 'system' || !msg.text.startsWith('Connecting'))); // Remove placeholder message if it exists


            if (professorResponse) {
                setLectureMessages(prev => [...prev, { sender: 'professor', text: professorResponse, professorId: actualProfId }]);
            } else {
                 // Handle cases where backend responds OK but no message is returned
                 setLectureMessages(prev => [...prev, { sender: 'system', text: 'Received empty response from professor.' }]);
                 setIsLectureOverByBackend(true); // Consider ending lecture on unexpected empty response
            }

            // If backend explicitly signaled end (not in your provided chat backend, but good practice)
            // if (sessionClosedByBackend) {
            //     setLectureMessages(prev => [...prev, { sender: 'system', text: 'The lecture has ended by the professor.' }]);
            //     setIsLectureOverByBackend(true);
            // }


        } catch (error) {
            console.error("Error sending message to lecture backend:", error);
            // Remove placeholder message if it exists before adding error message
             setLectureMessages(prev => prev.filter(msg => msg.sender !== 'system' || !msg.text.startsWith('Connecting')));
            setLectureMessages(prev => [...prev, { sender: 'system', text: `Communication error with lecture backend: ${error.message || 'Could not connect to the server.'} The lecture has ended.` }]);
            setIsLectureOverByBackend(true); // End lecture on error
        } finally {
            setIsLectureLoading(false); // End loading state
        }
    };

    const endLectureByUser = () => {
        if (isLectureLoading) return; // Prevent ending while waiting for a response

        // Optionally send a final message to the backend indicating the end
        // Await is tricky here as the component might unmount, so fire and forget is safer
        sendLectureMessageToBackend('<end>', lectureTargetProfessor?.id, false, true).catch(console.error);

        setIsLectureOverByBackend(true);
        setLectureMessages(prev => [...prev, { sender: 'system', text: 'You have ended the lecture.' }]);
    };


    // --- DEBATE Functions (New API Logic) ---
    const navigateToDebatePage = (prof1Id = null, prof2Id = null, topic = "a stimulating debate topic") => {
        // Clear any active debate polling timeout
        if (debatePollingTimeoutRef.current) {
            clearTimeout(debatePollingTimeoutRef.current);
            debatePollingTimeoutRef.current = null;
        }

        // Reset previous debate state fully
        setDebateMessages([]); // <--- This line clears messages on initial navigation to debate
        setDebateInputValue('');
        setIsDebateActive(false); // Not active until startDebateInternal is called
        console.log("SET DEBATE ACTIVE TO FALSE (NAVIGATE)");
        setIsDebateOverByBackend(false);
        setIsDebateLoading(false); // Ensure loading is false on navigation

        let initialParticipants = [];
        if (prof1Id) initialParticipants.push(prof1Id);
        if (prof2Id && prof1Id !== prof2Id) initialParticipants.push(prof2Id);
        setDebateParticipants(initialParticipants);

        // Use provided topic or set a default, DebatePage component manages custom topic state
        setDebateTopic(topic || "a stimulating debate topic");

        setCurrentPage('DEBATE');

        // startDebateAction will be called by DebatePage's useEffect if participants are selected
        // console.log("Debate page navigated to. Auto-start logic will be in DebatePage.");
    };

    const toggleDebateParticipant = (profId) => {
        if (isDebateActive || isDebateOverByBackend || isDebateLoading) return; // Prevent changes if active, over, or loading
        setDebateParticipants(prev => {
            if (prev.includes(profId)) {
                return prev.filter(id => id !== profId);
            }
            if (prev.length < 2) {
                return [...prev, profId];
            }
            return prev; // Max 2 participants
        });
    };

    // Function to schedule the next debate poll
    const scheduleNextDebatePoll = () => {
        console.log("Scheduling next debate poll... (OUTSIDE): ", isDebateActive, isDebateOverByBackend);
         //if (isDebateActive && !isDebateOverByBackend) {
             console.log("Scheduling next debate poll... (INSIDE)");
              debatePollingTimeoutRef.current = setTimeout(() => {
                  console.log("Polling for debate messages...");
                  // Call sendDebateMessageToBackend with polling parameters
                  sendDebateMessageToBackend({
                      prof_id1: debateParticipants[0],
                      prof_id2: debateParticipants[1],
                      topic: debateTopic,
                      user_input: '', // Polls have empty user_input
                      is_initial: false,
                      session_closed: false,
                  }, true); // Pass true to indicate this call should schedule the next poll
              }, DEBATE_POLLING_INTERVAL);
         //} else {
         //   console.log("Not scheduling next poll: Debate not active or already over.");
         //}
    };

    // Internal function to send message/command to debate backend
    // Added a parameter `scheduleNextPollAfter` to control recursive polling
    const sendDebateMessageToBackend = async ({ prof_id1, prof_id2, topic, user_input, is_initial = false, session_closed = false}, scheduleNextPollAfter = false) => {
        if (isDebateLoading && !session_closed) {
             // Avoid sending new requests while one is pending, unless it's a session_closed signal
             console.log("Debate API is busy, skipping request.");
             // If this was a poll request, schedule the next poll attempt after a delay even if this one is skipped
             if (scheduleNextPollAfter) {
                  scheduleNextDebatePoll();
             }
             return;
        }
        if (isDebateOverByBackend && !is_initial) {
             // Prevent sending requests if debate is already marked over, unless it's an initial setup attempt
             console.log("Debate is already over, skipping request.");
             return;
        }

        // Clear any pending timeout before sending a new request, as the response will schedule the *next* one
         if (debatePollingTimeoutRef.current) {
             clearTimeout(debatePollingTimeoutRef.current);
             //debatePollingTimeoutRef.current = null;
         }


        // Add user message optimistically if it's a user input
         if (user_input !== '' && !is_initial && !session_closed) {
             setDebateMessages(prev => [...prev, { sender: 'user', text: user_input }]);
             setDebateInputValue(''); // Clear input immediately
         } else if (is_initial) {
             // Add a placeholder for the initial backend response
             setDebateMessages(prev => [...prev, { sender: 'system', text: 'Starting debate... waiting for professors.', isPlaceholder: true }]);
         } else if (session_closed) {
             // Add a system message for reset if not already added
             // setDebateMessages(prev => [...prev, { sender: 'system', text: 'Debate ending...' }]); // Add on reset click instead in DebatePage
         }


        setIsDebateLoading(true); // Set loading state

        try {
            const response = await fetch(DEBATE_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "session_id": SESSION_ID, // Using fixed ID for simplicity as requested
                    prof_id1,
                    prof_id2,
                    topic,
                    is_initial,
                    session_closed,
                    user_input,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Backend error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();

            // --- Backend Response Structure for /debate: { from: "profId", response: "message", session_closed: boolean } ---
            const professorMessage = data.response;
            const messageSenderId = data.from; // The ID of the professor speaking
            const sessionClosedByBackend = data.session_closed;


             setDebateMessages(prev => prev.filter(msg => !msg.isPlaceholder)); // Remove placeholder messages

            console.log("Debate response received, checking what to do...");

            if (professorMessage && messageSenderId) {
                // Add the professor's message
                setDebateMessages(prev => [...prev, { sender: 'professor', professorId: messageSenderId, text: professorMessage }]);
                console.log("scheduling next poll...");
                scheduleNextDebatePoll(); // Schedule next poll after receiving a message
            } else if (!sessionClosedByBackend && !is_initial && user_input === '') {
                // If not closed, not initial, no user input (i.e., a poll response) but no message returned
                // This might indicate no new messages are available, no need to add anything
                console.log("Debate poll received, no new messages.");
                 scheduleNextDebatePoll(); // Schedule next poll even if no new messages, as long as debate is active
            } else if (!sessionClosedByBackend) {
                 // Handle cases where backend responds OK but no message/sender returned unexpectedly
                 setDebateMessages(prev => [...prev, { sender: 'system', text: 'Received unexpected empty response from backend.' }]);
                 setIsDebateOverByBackend(true); // Consider ending on unexpected response
                 setIsDebateActive(false);
                 console.log("SET DEBATE ACTIVE TO FALSE (UNEXPECTED RESPONSE)");
                 // Clear timeout if ending unexpectedly
                  if (debatePollingTimeoutRef.current) {
                      clearTimeout(debatePollingTimeoutRef.current);
                      debatePollingTimeoutRef.current = null;
                  }
            }


            if (sessionClosedByBackend) {
                 // Add a system message about the end if not already added by reset action
                 setDebateMessages(prev => {
                     if (!prev.some(msg => msg.sender === 'system' && (msg.text.includes("Debate concluded") || msg.text.includes("ended by backend")))) {
                           // Only add if not already present from a user-initiated reset message
                           if (!prev.some(msg => msg.sender === 'system' && msg.text.includes("reset by the user"))) {
                                return [...prev, { sender: 'system', text: 'Debate concluded by the backend.' }];
                           }
                     }
                     return prev;
                 });
                 setIsDebateOverByBackend(true); // End the debate if backend indicates so
                 setIsDebateActive(false);
                 console.log("SET DEBATE ACTIVE TO FALSE (BACKEND ENDED)");
                 // Clear timeout if backend signals end
                  if (debatePollingTimeoutRef.current) {
                      clearTimeout(debatePollingTimeoutRef.current);
                      debatePollingTimeoutRef.current = null;
                  }
                 console.log("Debate session closed by backend.");
            }


        } catch (error) {
            console.error("Error sending message to debate backend:", error);
            // Remove placeholder messages
             setDebateMessages(prev => prev.filter(msg => !msg.isPlaceholder));
            setDebateMessages(prev => [...prev, { sender: 'system', text: `Communication error with debate backend: ${error.message || 'Could not connect to the server.'} The debate has ended.` }]);
            setIsDebateOverByBackend(true); // End debate on error
            setIsDebateActive(false);
            console.log("SET DEBATE ACTIVE TO FALSE (ERROR)");
            // Clear timeout on error
             if (debatePollingTimeoutRef.current) {
                 clearTimeout(debatePollingTimeoutRef.current);
                 debatePollingTimeoutRef.current = null;
             }

        } finally {
            setIsDebateLoading(false); // End loading state

            // // Schedule the next poll if requested and debate is still active/not over
            // if (scheduleNextPollAfter && !isDebateOverByBackend && isDebateActive) {
            //      scheduleNextDebatePoll(); // Moved scheduling logic into the try/catch blocks based on response
            // }
        }
    };


    // Function called by DebatePage to start the debate
    const startDebateAction = () => {
        if (debateParticipants.length !== 2 || isDebateActive || isDebateLoading) return;

        const prof1Id = debateParticipants[0];
        const prof2Id = debateParticipants[1];

        setIsDebateActive(true);
        console.log("SET DEBATE ACTIVE TO TRUE");
        setIsDebateOverByBackend(false); // Ensure backend flag is false at the start

        // Clear previous messages for a fresh start (already done in navigate, but double-check)
        // REMOVED: setDebateMessages([]); // <--- This line was already commented out or should be removed if you want to keep messages on start too

        // Send the initial message to the backend
        // Pass true as the second argument to scheduleNextPollAfter for the initial call
        sendDebateMessageToBackend({
             prof_id1: prof1Id,
             prof_id2: prof2Id,
             topic: debateTopic,
             user_input: '', // Initial call has empty user_input
             is_initial: true,
             session_closed: false,
        }, true); // <= Set scheduleNextPollAfter to true for the initial call


        console.log("Debate start requested with:", prof1Id, "vs", prof2Id, "on", debateTopic);
    };


    // Function called by DebatePage when user sends a message
    const sendDebateUserMessage = (messageText) => {
         if (!isDebateActive || isDebateOverByBackend || !messageText.trim() || isDebateLoading) {
             console.log("Cannot send user message: Debate not active, over, empty, or loading.");
             return;
         }


         // Send user message to backend. Backend will process and send back professor response(s)
         // which will be picked up by the ongoing polling mechanism scheduled by sendDebateMessageToBackend.
         // We do NOT schedule the *next* poll from a user message send directly here.
         sendDebateMessageToBackend({
              prof_id1: debateParticipants[0],
              prof_id2: debateParticipants[1],
              topic: debateTopic, // Send topic on user message too? Backend might need it.
              user_input: messageText.trim(), // User's input
              is_initial: false,
              session_closed: false,
         }, false); // <= Set scheduleNextPollAfter to false for user messages


         // User message is added optimistically in sendDebateMessageToBackend
         // setDebateMessages(prev => [...prev, { sender: 'user', text: messageText.trim() }]);
         // setDebateInputValue(''); // Cleared optimistically in sendDebateMessageToBackend
    };


    // Function called by DebatePage to reset the debate
    const resetDebateAction = () => {
         // Clear the polling timeout immediately
         if (debatePollingTimeoutRef.current) {
             clearTimeout(debatePollingTimeoutRef.current);
             debatePollingTimeoutRef.current = null;
         }

         // Add a system message indicating reset
         setDebateMessages(prev => {
             if (!prev.some(msg => msg.sender === 'system' && msg.text.includes("reset"))) {
                 console.log("FACCTIO QUESTO"); // Log messages for debugging
                 return [...prev, { sender: 'system', text: 'Debate has been reset by the user.' }];
             }
             console.log("FACCIO QUELLO"); // Log messages for debugging
             return prev;
         });

         // Signal backend to close the session (fire and forget)
         if (debateParticipants.length === 2) { // Only send if participants were selected
             sendDebateMessageToBackend({
                  prof_id1: debateParticipants[0],
                  prof_id2: debateParticipants[1],
                  topic: debateTopic,
                  user_input: '', // Reset has no user input
                  is_initial: false,
                  session_closed: true,
             }, false).catch(console.error); // Log error but don't block reset UI. Don't schedule next poll.
         }


         // Reset frontend state after a short delay or immediately
         // Resetting immediately provides faster UI feedback
         setDebateParticipants([]);
         // setDebateMessages([]); // <--- COMMENTED OUT OR REMOVED THIS LINE
         setDebateInputValue('');
         setIsDebateActive(false);
         console.log("SET DEBATE ACTIVE TO FALSE (RESET)");
         setIsDebateOverByBackend(false); // Allow starting a new debate
         setIsDebateLoading(false); // Ensure loading is false
         setDebateTopic("a new engaging discussion"); // Reset topic state if needed

         console.log("Debate reset initiated.");
    };

    // Cleanup effect for the polling timeout
    useEffect(() => {
        // This effect runs on mount, update, and unmount
        // We already clear on navigateToHome and resetDebateAction
        // But this is a failsafe if component unmounts unexpectedly
        return () => {
            if (debatePollingTimeoutRef.current) {
                console.log("Clearing debate polling timeout on unmount.");
                clearTimeout(debatePollingTimeoutRef.current);
                debatePollingTimeoutRef.current = null;
            }
        };
    }, []); // Empty dependency array means this runs only on mount and unmount


    const value = {
        currentPage, setCurrentPage,
        selectedProfessor, setSelectedProfessor, selectedTopic, setSelectedTopic,
        professors: PROFESSORS_DATA, userProfile: USER_PROFILE_DATA, ranking: RANKING_DATA, suggestions: SUGGESTIONS_DATA,
        navigateToHome, navigateToProfessor: navigateToProfessorPage, navigateToLecture, navigateToInverseLecture, navigateToDebate: navigateToDebatePage,

        // Lecture context
        lectureMessages, lectureInputValue, setLectureInputValue,
        sendLectureMessageToBackend, // This now talks to the API
        endLectureByUser,
        isLectureOverByBackend,
        lectureTargetProfessor, currentLectureTopic,
        isLectureLoading, // Expose loading state

        // Debate context (Updated)
        debateParticipants, toggleDebateParticipant, debateMessages, debateInputValue, setDebateInputValue,
        isDebateActive, isDebateOverByBackend, debateTopic, setDebateTopic,
        startDebate: startDebateAction, // Expose the action function
        sendDebateMessage: sendDebateUserMessage, // Expose the user message action
        resetDebate: resetDebateAction, // Expose the reset action
        isDebateLoading, // Expose loading state
        PROFESSORS_DATA, // Still needed for getProfessorById in component

        // Expose getProfessorById if DebatePage needs it directly
         getProfessorById,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);