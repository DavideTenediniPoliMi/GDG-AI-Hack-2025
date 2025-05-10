import React, { createContext, useState, useContext } from 'react';

// --- Hardcoded Data (placeholders for backend integration) ---
const PROFESSORS_DATA = [
    { id: 'prof1', name: 'Dr. Ada Lovelace', subject: 'Computer Science', avatar: 'https://placehold.co/200x200/E0F2FE/0EA5E9?text=Ada', topics: ['Introduction to Algorithms', 'Data Structures', 'Machine Learning Basics'] },
    { id: 'prof2', name: 'Prof. Marie Curie', subject: 'Physics & Chemistry', avatar: 'https://placehold.co/200x200/E0F2FE/0EA5E9?text=Marie', topics: ['Radioactivity', 'Quantum Mechanics Intro', 'Chemical Bonds'] },
    { id: 'prof3', name: 'Dr. Alan Turing', subject: 'Mathematics & AI', avatar: 'https://placehold.co/200x200/E0F2FE/0EA5E9?text=Alan', topics: ['Computability Theory', 'Cryptography', 'Early AI Concepts'] },
    { id: 'prof4', name: 'Prof. Rosalind Franklin', subject: 'Biophysics', avatar: 'https://placehold.co/200x200/E0F2FE/0EA5E9?text=Rosalind', topics: ['DNA Structure', 'X-ray Crystallography', 'Virus Structures'] },
];

const USER_PROGRESS_DATA = [
    { professorId: 'prof1', professorName: 'Dr. Ada Lovelace', score: 85 },
    { professorId: 'prof2', professorName: 'Prof. Marie Curie', score: 72 },
    { professorId: 'prof3', professorName: 'Dr. Alan Turing', score: 90 },
    { professorId: 'prof4', professorName: 'Prof. Rosalind Franklin', score: 60 },
];

// --- Suggestions Data (placeholder) ---
const SUGGESTIONS_DATA = [
    { type: 'debate', prof1Id: 'prof1', prof2Id: 'prof3', topic: 'The Future of AI', id: 'sug1' },
    { type: 'lecture', profId: 'prof2', topic: 'Quantum Entanglement Explained', id: 'sug2' },
    { type: 'inverse', profId: 'prof4', topic: 'Modern Gene Editing Techniques', id: 'sug3' },
];


const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [currentPage, setCurrentPage] = useState('INDEX'); // INDEX, PROFESSOR, DEBATE, LECTURE, INVERSE
    const [selectedProfessor, setSelectedProfessor] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState('');

    // --- Navigation Functions ---
    const navigateToHome = () => {
        setCurrentPage('INDEX');
        setSelectedProfessor(null);
        setSelectedTopic('');
    };

    const navigateToProfessor = (professor) => {
        setSelectedProfessor(professor);
        setCurrentPage('PROFESSOR');
        setSelectedTopic('');
    };

    const navigateToDebate = (prof1Id, prof2Id, topic) => {
        // Placeholder: In a real app, you'd set state for the debate page
        console.log(`Navigating to DEBATE: ${prof1Id} vs ${prof2Id} on ${topic}`);
        alert(`Initiating Debate: ${PROFESSORS_DATA.find(p=>p.id === prof1Id)?.name} vs ${PROFESSORS_DATA.find(p=>p.id === prof2Id)?.name} on "${topic}" (DEBATE page not implemented yet)`);
        // setCurrentPage('DEBATE');
    };

    const navigateToLecture = (professor, topic) => {
         // Placeholder
        console.log(`Navigating to LECTURE with ${professor.name} on ${topic}`);
        alert(`Starting Lecture with ${professor.name} on "${topic}" (LECTURE page not implemented yet)`);
        // setSelectedProfessor(professor);
        // setSelectedTopic(topic);
        // setCurrentPage('LECTURE');
    };

    const navigateToInverseLecture = (professor, topic) => {
        // Placeholder
        console.log(`Navigating to INVERSE LECTURE with ${professor.name} on ${topic}`);
        alert(`Starting Inverse Lecture with ${professor.name} on "${topic}" (INVERSE page not implemented yet)`);
        // setSelectedProfessor(professor);
        // setSelectedTopic(topic);
        // setCurrentPage('INVERSE');
    };


    const value = {
        currentPage,
        setCurrentPage,
        selectedProfessor,
        setSelectedProfessor,
        selectedTopic,
        setSelectedTopic,
        professors: PROFESSORS_DATA,
        userProgress: USER_PROGRESS_DATA.sort((a, b) => b.score - a.score), // Sorted leaderboard
        suggestions: SUGGESTIONS_DATA, // Provide one suggestion for now
        navigateToHome,
        navigateToProfessor,
        navigateToDebate,
        navigateToLecture,
        navigateToInverseLecture,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);