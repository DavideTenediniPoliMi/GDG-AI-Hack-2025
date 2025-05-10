import React from 'react';
// All component imports are now implicitly handled by being in the same file for this single-file structure.
// If these were separate files, you'd need:
import { AppProvider, useAppContext } from './context/AppContext';
import IndexPage from './pages/IndexPage';
import ProfessorPage from './pages/ProfessorPage';
// ... and so on for other components.

// Since all components are defined above in this single file,
// we can directly use them.

const AppContent = () => {
    const { currentPage } = useAppContext();

    // Simple router
    switch (currentPage) {
        case 'INDEX':
            return <IndexPage />;
        case 'PROFESSOR':
            return <ProfessorPage />;
        // Add cases for DEBATE, LECTURE, INVERSE when they are built
        // case 'DEBATE':
        //     return <DebatePage />;
        // case 'LECTURE':
        //     return <LecturePage />;
        // case 'INVERSE':
        //     return <InversePage />;
        default:
            return <IndexPage />;
    }
};

// Main App component
// This is what you would typically export as default from App.js
const App = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App; // This is the main export for your React application