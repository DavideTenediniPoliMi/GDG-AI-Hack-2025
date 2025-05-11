// AppContext.js

//import { init } from 'express/lib/application';
import React, { createContext, useState, useContext, useEffect } from 'react';

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
const CHAT_API_URL = 'http://localhost:8000/chat'; // Or 'http://localhost:YOUR_PORT/chat' if not on default port 80
const SESSION_ID = 'abc123-abc123-abc123-abc123'; // Hardcoded session ID

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
    const [isDebateActive, setIsDebateActive] = useState(false);
    const [isDebateOverByBackend, setIsDebateOverByBackend] = useState(false);
    const [debateTopic, setDebateTopic] = useState("an engaging discussion");
    const [currentDebateTurn, setCurrentDebateTurn] = useState(0); // 0 for prof1, 1 for prof2


    const navigateToHome = () => {
        setCurrentPage('INDEX');
        // Reset lecture state
        setLectureMessages([]); setLectureInputValue(''); setIsLectureOverByBackend(false); setLectureTargetProfessor(null); setCurrentLectureTopic(''); setIsLectureLoading(false);
        // Reset debate state
        setDebateParticipants([]); setDebateMessages([]); setDebateInputValue(''); setIsDebateActive(false); setIsDebateOverByBackend(false); setDebateTopic("an engaging discussion"); setCurrentDebateTurn(0);
    };

    const navigateToProfessorPage = (professor) => {
        setSelectedProfessor(professor);
        setCurrentPage('PROFESSOR');
    };

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
        const initialInput = ``;
        const prof_id = professor.id;

        // Send the initial message to the backend
        await sendLectureMessageToBackend(initialInput, prof_id, true); // Pass true for isInitial

        setIsLectureLoading(false); // End loading state after initial message attempt
    };

    const navigateToInverseLecture = (professor, topic) => alert(`Inverse Lecture with ${professor.name} on "${topic}" (Not Implemented)`);


    // --- LECTURE Functions ---
    const sendLectureMessageToBackend = async (messageText, prof_id, isInitial = false) => {
        if (isLectureOverByBackend || isLectureLoading) return; // Prevent sending if lecture is over or already loading

        let userInputToSend = messageText;

        // Add user's message to the chat immediately (if it's not the initial internal call)
        if (!isInitial) {
             setLectureMessages(prev => [...prev, { sender: 'user', text: messageText}]);
             setLectureInputValue(''); // Clear input field
        } else {
             // Optional: Add a '...' message while waiting for initial response
             //setLectureMessages(prev => [...prev, { sender: 'user', text: 'Connecting to professor...'}]);
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
                    "user_input": userInputToSend,
                    "prof_id": prof_id,
                    "is_initial": isInitial,
                }),
            });

            if (!response.ok) {
                // Handle non-200 responses
                const errorText = await response.text();
                throw new Error(`Backend error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();

            // --- ASSUMPTION ---
            // We assume the backend response is a JSON object like { "professor_response": "..." }
            // Adjust this part if your backend returns a different format.
            const professorResponse = data.response;

            if (professorResponse) {
                setLectureMessages(prev => [...prev, { sender: 'professor', text: professorResponse, professorId: lectureTargetProfessor?.id }]);
            } else {
                 // Handle cases where backend responds OK but no message is returned
                 setLectureMessages(prev => [...prev, { sender: 'system', text: 'Received empty response from professor.' }]);
                 setIsLectureOverByBackend(true); // Consider ending lecture on unexpected empty response
            }

        } catch (error) {
            console.error("Error sending message to backend:", error);
            setLectureMessages(prev => [...prev, { sender: 'system', text: `Communication error: ${error.message || 'Could not connect to the server.'} The lecture has ended.` }]);
            setIsLectureOverByBackend(true); // End lecture on error
        } finally {
            setIsLectureLoading(false); // End loading state
        }
    };

    const endLectureByUser = () => {
         setIsLectureOverByBackend(true);
         setLectureMessages(prev => [...prev, { sender: 'system', text: 'You have ended the lecture.' }]);
         // Optionally, send a final message to the backend indicating the end
         // sendLectureMessageToBackend('<end>', true); // Example end signal
    };


    // --- DEBATE Functions --- (Remain the same as provided)
    const navigateToDebatePage = (prof1Id = null, prof2Id = null, topic = "a stimulating debate topic") => {
        // Reset previous debate state first
        setDebateMessages([]); setDebateInputValue(''); setIsDebateActive(false); setIsDebateOverByBackend(false); setCurrentDebateTurn(0);

        let initialParticipants = [];
        if (prof1Id) initialParticipants.push(prof1Id);
        if (prof2Id && prof1Id !== prof2Id) initialParticipants.push(prof2Id);
        setDebateParticipants(initialParticipants);
        setDebateTopic(topic);
        setCurrentPage('DEBATE');

        if (initialParticipants.length === 2) {
            // If participants are pre-filled (e.g., from suggestion), auto-start debate
            // This needs to be called after context state has updated, so use useEffect in DebatePage or a slight delay.
            // For now, we'll let DebatePage handle the auto-start if participants are full on load.
            console.log("Debate page loading with pre-selected participants. Auto-start will be triggered.");
        }
    };

    const toggleDebateParticipant = (profId) => {
        if (isDebateActive) return; // Don't change participants if debate is active
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

    const startDebateInternal = () => { // Renamed to avoid conflict with component's startDebate
        if (debateParticipants.length !== 2 || isDebateActive) return;

        setIsDebateActive(true);
        setIsDebateOverByBackend(false);
        const prof1 = PROFESSORS_DATA.find(p => p.id === debateParticipants[0]);
        const prof2 = PROFESSORS_DATA.find(p => p.id === debateParticipants[1]);

        setDebateMessages([
            { sender: 'system', text: `Debate starting on: "${debateTopic}" between ${prof1.name} and ${prof2.name}!` },
            { sender: 'professor', professorId: prof1.id, text: prof1.debateOpeningLine || "Let's begin this debate." }
        ]);
        setCurrentDebateTurn(1); // Next turn is prof2
        console.log("Debate started with:", prof1.name, "vs", prof2.name);
    };


    const sendDebateMessage = (messageText, senderType = 'user') => {
        if (!isDebateActive || isDebateOverByBackend) return;

        const newMessage = { sender: senderType, text: messageText };
        if (senderType === 'user') {
            // User message
            setDebateMessages(prev => [...prev, newMessage]);
            setDebateInputValue('');
            // Mock: Professor acknowledges user's point then continues debate.
            setTimeout(() => {
                const aProfId = debateParticipants[currentDebateTurn];
                const aProf = PROFESSORS_DATA.find(p => p.id === aProfId);
                setDebateMessages(prev => [...prev, { sender: 'professor', professorId: aProfId, text: `Interesting point, user. However, consider this... (responding to user then continuing)` }]);
                // Then trigger next professor's turn if needed
                mockProfessorTurn();
            }, 1000);

        } else if (senderType === 'professor') {
            // This would typically be a direct response from backend
            setDebateMessages(prev => [...prev, { ...newMessage, professorId: debateParticipants[currentDebateTurn] }]);
            setCurrentDebateTurn(prev => (prev + 1) % 2); // Switch turn
            // After this professor message, schedule the next one
            if (debateMessages.filter(m => m.sender === 'professor').length < 10) { // Limit debate length for demo
                setTimeout(mockProfessorTurn, 1500 + Math.random() * 1500);
            } else {
                endDebateInternal("The debate has reached its time limit. A thought-provoking exchange!");
            }
        }
    };

    const mockProfessorTurn = () => {
        if (!isDebateActive || isDebateOverByBackend || debateParticipants.length < 2) return;

        const currentProfId = debateParticipants[currentDebateTurn];
        const currentProf = PROFESSORS_DATA.find(p => p.id === currentProfId);
        const otherProfId = debateParticipants[(currentDebateTurn + 1) % 2];
        const otherProf = PROFESSORS_DATA.find(p => p.id === otherProfId);


        let responseText = `Responding to ${otherProf.name}... I believe my colleague overlooks a crucial aspect. My argument is stronger because... [${currentProf.subject} perspective]`;
        if (Math.random() > 0.7) {
            responseText = `I concede that ${otherProf.name} has a valid point regarding X, but on the broader issue of Y, my stance from ${currentProf.subject} holds.`;
        }


        // Simulate sending this as if it came from backend
        setDebateMessages(prev => [...prev, { sender: 'professor', professorId: currentProfId, text: responseText }]);
        setCurrentDebateTurn(prev => (prev + 1) % 2);

        if (debateMessages.filter(m => m.sender === 'professor').length > 8) { // End after a few turns
            endDebateInternal("This has been a spirited discussion! Let's conclude the debate for now.");
        }
    };


    const endDebateInternal = (systemMessage = "The debate has concluded.") => {
        setIsDebateActive(false);
        setIsDebateOverByBackend(true);
        setDebateMessages(prev => [...prev, { sender: 'system', text: systemMessage }]);
        console.log("Debate ended.");
    };

    const resetDebateAction = () => {
        // This signals to the backend (mocked here) and clears UI for a new setup
        if (isDebateActive) {
             endDebateInternal("Debate has been reset by the user.");
        }
        // Clear selections for a new debate setup on the same page
        setDebateParticipants([]);
        setDebateMessages([]);
        setDebateInputValue('');
        setIsDebateActive(false);
        setIsDebateOverByBackend(false); // Allow for a new debate to start
        setDebateTopic("a new engaging discussion");
        setCurrentDebateTurn(0);
        console.log("Debate reset.");
    };


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

        // Debate context
        debateParticipants, toggleDebateParticipant, debateMessages, debateInputValue, setDebateInputValue,
        isDebateActive, isDebateOverByBackend, debateTopic, setDebateTopic,
        startDebate: startDebateInternal,
        sendDebateMessage,
        resetDebate: resetDebateAction,
        PROFESSORS_DATA,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);