import React from 'react';
import { useAppContext } from '../context/AppContext'; // Make sure this is uncommented
import ProfessorCard from '../components/ProfessorCard'; // Make sure this is uncommented
import RightSidebar from '../components/RightSidebar'; // Make sure this is uncommented
import Button from '../components/Button'; // Make sure this is uncommented

const IndexPage = () => {
    // Correct: Hook called at the top level
    // Destructure all needed context values here
    const { professors, navigateToProfessor, navigateToDebate, navigateToHome } = useAppContext();

    // For the debate button, we can pick two random professors and a generic topic for now
    const handleDebateButtonClick = () => {
        if (professors.length >= 2) {
            navigateToDebate(professors[0].id, professors[1].id, "a surprise topic");
        } else {
            alert("Not enough professors for a debate!");
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    {/* CORRECTED LINE: Use the navigateToHome function obtained from the hook */}
                    <h1 className="text-3xl font-bold text-sky-600 cursor-pointer" onClick={navigateToHome}>
                        YOUR VIRTUAL PROFESSORS
                    </h1>
                    <Button onClick={handleDebateButtonClick}>
                        Start a Debate
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Professors Grid */}
                    <div className="flex-grow">
                        <h2 className="text-2xl font-semibold text-slate-700 mb-6">Meet Your Professors</h2>
                        {professors.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {professors.map(prof => (
                                    // Correct: navigateToProfessor is also obtained from the hook at the top
                                    <ProfessorCard key={prof.id} professor={prof} onClick={() => navigateToProfessor(prof)} size="medium" />
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-10">No professors available at the moment.</p>
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0">
                         <RightSidebar />
                    </aside>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-800 text-slate-300 py-6 text-center">
                <p>&copy; {new Date().getFullYear()} Virtual Professors. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default IndexPage; // Make sure this is uncommented