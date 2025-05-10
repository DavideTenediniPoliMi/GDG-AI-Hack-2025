import React from 'react';
import { useAppContext } from '../context/AppContext'; // Already imported in App.js
import Button from './Button'; // Already imported in App.js

const RightSidebar = () => {
    const { userProgress, suggestions, navigateToDebate, navigateToLecture, navigateToInverseLecture, professors } = useAppContext();

    const getProfessorName = (profId) => professors.find(p => p.id === profId)?.name || 'Unknown Professor';

    return (
        <div className="w-full lg:w-1/4 p-4 space-y-6 bg-slate-50 rounded-lg shadow-md h-full overflow-y-auto">
            {/* User Progress Section */}s
            <div>
                <h2 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">Your Progress</h2>
                {userProgress.length > 0 ? (
                    <ul className="space-y-2">
                        {userProgress.map((progress) => (
                            <li key={progress.professorId} className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm hover:bg-sky-50 transition-colors">
                                <span className="text-slate-600 font-medium">{progress.professorName}</span>
                                <span className="text-sky-600 font-bold">{progress.score} pts</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500">No progress yet. Start learning!</p>
                )}
            </div>

            {/* Suggestions Section */}
            <div>
                <h2 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">Suggestions</h2>
                {suggestions.length > 0 ? (
                    <div className="space-y-3">
                        {suggestions.map((suggestion) => (
                            <div key={suggestion.id} className="p-3 bg-white rounded-md shadow-sm">
                                {suggestion.type === 'debate' && (
                                    <>
                                        <p className="text-slate-700 mb-2">
                                            <span className="font-semibold">Debate:</span> {getProfessorName(suggestion.prof1Id)} vs {getProfessorName(suggestion.prof2Id)} on "{suggestion.topic}"
                                        </p>
                                        <Button onClick={() => navigateToDebate(suggestion.prof1Id, suggestion.prof2Id, suggestion.topic)} className="w-full text-sm">
                                            Start Debate
                                        </Button>
                                    </>
                                )}
                                {suggestion.type === 'lecture' && (
                                    <>
                                        <p className="text-slate-700 mb-2">
                                            <span className="font-semibold">Lecture:</span> {getProfessorName(suggestion.profId)} on "{suggestion.topic}"
                                        </p>
                                        <Button onClick={() => navigateToLecture(professors.find(p => p.id === suggestion.profId), suggestion.topic)} className="w-full text-sm">
                                            Start Lecture
                                        </Button>
                                    </>
                                )}
                                {suggestion.type === 'inverse' && (
                                    <>
                                        <p className="text-slate-700 mb-2">
                                            <span className="font-semibold">Inverse Lecture:</span> You teach {getProfessorName(suggestion.profId)} on "{suggestion.topic}"
                                        </p>
                                        <Button onClick={() => navigateToInverseLecture(professors.find(p => p.id === suggestion.profId), suggestion.topic)} className="w-full text-sm">
                                            Start Inverse Lecture
                                        </Button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500">No suggestions available right now.</p>
                )}
            </div>
        </div>
    );
};
export default RightSidebar; // This will be part of the main App.js bundle