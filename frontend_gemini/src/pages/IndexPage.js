import React from 'react';
import { useAppContext } from '../context/AppContext'; // Make sure this is uncommented
import ProfessorCard from '../components/ProfessorCard'; // Make sure this is uncommented
import RightSidebar from '../components/RightSidebar'; // Make sure this is uncommented
import Button from '../components/Button'; // Make sure this is uncommented

const IndexPage = () => {
    // Correct: Hook called at the top level
    // Destructure all needed context values here
    const { professors, navigateToProfessor, navigateToDebate, navigateToHome } = useAppContext();

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            {/* Header */}
            {/*<header className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                <h1 className="text-3xl font-bold cursor-pointer" onClick={navigateToHome}>
                    YOUR VIRTUAL PROFESSORS
                </h1>
            </div>*/}
            {/*</header>*/}

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Professors Grid */}
                    <div className="flex-grow">
                        <h1 className="text-3xl font-semibold text-slate-700 mb-6">Meet Your Professors</h1>
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

        </div>
    );
};

export default IndexPage; // Make sure this is uncommented