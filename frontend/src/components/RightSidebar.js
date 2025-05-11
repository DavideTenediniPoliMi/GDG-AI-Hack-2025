import React from 'react';
import { useAppContext } from '../context/AppContext';
import Button from './Button';

const RightSidebar = () => {
    const { userProfile, ranking, suggestions, navigateToDebate, professors, PROFESSORS_DATA } = useAppContext(); // Added PROFESSORS_DATA for names

    const getProfessorById = (profId) => PROFESSORS_DATA.find(p => p.id === profId);

    const handleSuggestionDebate = () => {
        if (suggestions.length > 0 && suggestions[0].type === 'debate') {
            const sug = suggestions[0];
            // Pass professor IDs and the specific suggested topic to navigateToDebate
            navigateToDebate(sug.prof1Id, sug.prof2Id, sug.topic);
        }
    };

    // For the debate button, we can pick two random professors and a generic topic for now
    const handleDebateButtonClick = () => {
        if (professors.length >= 2) {
            navigateToDebate(null, null, "");
        } else {
            alert("Not enough professors for a debate!");
        }
    };
    
    // Removed handleRankingDebate as the button is moved.

    return (
        <div className="w-full lg:w-80 xl:w-96 p-0 md:p-4 space-y-6 h-full">
            {/* MY PROFILE Section */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">MY PROFILE</h2>
                <div className="flex items-center space-x-4">
                    <img src={userProfile.avatar} alt={userProfile.name} className="w-14 h-14 rounded-full object-cover border-2 border-slate-300" 
                         onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/56x56/E0F2FE/0EA5E9?text=U'; }}/>
                    <div>
                        <p className="text-slate-700 font-medium">{userProfile.name}</p>
                        <p className="text-sky-600 text-sm">Points: {userProfile.points}</p>
                    </div>
                </div>
            </div>

            {/* Suggestions Section */}
            {suggestions.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-slate-800 mb-2 border-b pb-2">Suggestion</h2>
                    <div className="space-y-3">
                        {suggestions.map((suggestion) => (
                            <div key={suggestion.id} className="">
                                {suggestion.type === 'debate' && (
                                    <>
                                        <p className="text-slate-600 mb-3 text-sm">
                                            {suggestion.text || `Start a debate on "${suggestion.topic}"`}
                                        </p>
                                        {/* Button moved here for suggested debate */}
                                        <Button onClick={handleSuggestionDebate} variant="secondary" className="w-full text-sm">
                                            Start Suggested Debate
                                        </Button>
                                    </>
                                )}
                                {/* Add other suggestion types if necessary */}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Ranking Section */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">RANKING</h2>
                {ranking.length > 0 ? (
                    <ul className="space-y-3">
                        {ranking.map((item) => (
                            <li key={item.id || item.name} className="flex justify-between items-center p-2 rounded-md hover:bg-slate-50 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <img src={item.avatar} alt={item.name} className="w-8 h-8 rounded-full object-cover"
                                         onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/32x32/E0F2FE/0EA5E9?text=${item.name.substring(0,1)}`; }}/>
                                    <span className="text-slate-600 font-medium text-sm">{item.name}</span>
                                </div>
                                <span className="text-slate-700 font-bold text-sm">{item.score}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500 text-sm">No ranking data available.</p>
                )}
                {/* Removed Start Debate button from here */}
                <Button onClick={handleDebateButtonClick} variant="secondary" className="w-full mt-4 text-sm">
                    Start Debate                 
                </Button>
            </div>
        </div>
    );
};
export default RightSidebar;