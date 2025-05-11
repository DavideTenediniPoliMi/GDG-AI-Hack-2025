import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import IndexPage from './pages/IndexPage';
import ProfessorPage from './pages/ProfessorPage';
import LecturePage from './pages/LecturePage';
import DebatePage from './pages/DebatePage'; // Import the new page

const AppContent = () => {
    const { currentPage } = useAppContext();

    switch (currentPage) {
        case 'INDEX':
            return <IndexPage />;
        case 'PROFESSOR':
            return <ProfessorPage />;
        case 'LECTURE':
            return <LecturePage />;
        case 'DEBATE': // Add this case
            return <DebatePage />;
        // Add case for INVERSE when built
        default:
            return <IndexPage />;
    }
};

const App = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;