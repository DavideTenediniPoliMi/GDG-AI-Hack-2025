import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Button from '../components/Button';

const DebatePage = () => {
    const {
        professors, // Full list of professors
        debateParticipants, toggleDebateParticipant,
        debateMessages, debateInputValue, setDebateInputValue,
        isDebateActive, isDebateOverByBackend, debateTopic, setDebateTopic,
        startDebate, sendDebateMessage, resetDebate,
        navigateToHome, PROFESSORS_DATA // Ensure PROFESSORS_DATA is in context value
    } = useAppContext();

    const messagesEndRef = useRef(null);
    const [customDebateTopic, setCustomDebateTopic] = useState(debateTopic || "A stimulating debate");

    useEffect(() => {
        // If navigating to page with 2 participants already selected (e.g. from suggestion)
        // and debate is not active, try to start it.
        if (debateParticipants.length === 2 && !isDebateActive && !isDebateOverByBackend) {
            console.log("DebatePage mounted with 2 participants, attempting to start debate.");
            startDebate();
        }
    }, [debateParticipants, isDebateActive, isDebateOverByBackend, startDebate]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [debateMessages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (debateInputValue.trim() && isDebateActive && !isDebateOverByBackend) {
            sendDebateMessage(debateInputValue.trim(), 'user');
        }
    };

    const getProfessorById = (id) => PROFESSORS_DATA.find(p => p.id === id);

    const handleStartDebateClick = () => {
        if (customDebateTopic.trim() !== debateTopic) {
            setDebateTopic(customDebateTopic.trim()); // Update context if local topic changed
        }
        // StartDebate will be called using the topic from context
        startDebate();
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-slate-200 p-4 md:p-6 gap-6">
            {/* Left Column: Professor Selection & Controls */}
            <div className="w-full lg:w-1/3 xl:w-1/4 bg-white p-4 rounded-lg shadow-lg flex flex-col space-y-4 self-start">
                <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Let's Debate!</h2>

                {!isDebateActive && !isDebateOverByBackend && (
                    <div>
                        <label htmlFor="debateTopicInput" className="block text-sm font-medium text-slate-600 mb-1">Debate Topic:</label>
                        <input
                            id="debateTopicInput"
                            type="text"
                            value={customDebateTopic}
                            onChange={(e) => setCustomDebateTopic(e.target.value)}
                            placeholder="Enter debate topic"
                            className="w-full p-2 border border-slate-300 rounded-md text-sm"
                        />
                    </div>
                )}


                <div className="space-y-2">
                    <p className="text-sm text-slate-600">Select two professors:</p>
                    {professors.map(prof => (
                        <div key={prof.id} className={`flex items-center justify-between p-2 rounded-md border ${debateParticipants.includes(prof.id) ? 'bg-sky-100 border-sky-300' : 'bg-slate-50 border-slate-200'} ${isDebateActive ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-slate-100'}`}
                             onClick={() => !isDebateActive && toggleDebateParticipant(prof.id)}>
                            <div className="flex items-center space-x-2">
                                <img src={prof.avatar} alt={prof.name} className="w-8 h-8 rounded-full object-cover" />
                                <span className="text-sm font-medium text-slate-700">{prof.name}</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={debateParticipants.includes(prof.id)}
                                onChange={() => !isDebateActive && toggleDebateParticipant(prof.id)}
                                className="form-checkbox h-4 w-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer"
                                disabled={isDebateActive}
                            />
                        </div>
                    ))}
                </div>

                <Button
                    onClick={handleStartDebateClick}
                    variant="success"
                    className="w-full"
                    disabled={debateParticipants.length !== 2 || isDebateActive || !customDebateTopic.trim()}
                >
                    Start Debate
                </Button>
                <Button
                    onClick={resetDebate}
                    variant="danger"
                    className="w-full"
                    disabled={!isDebateActive && debateParticipants.length === 0} // Enable if active OR if participants selected but not active
                >
                    Reset
                </Button>
                <Button
                    onClick={navigateToHome}
                    variant="secondary"
                    className="w-full"
                    disabled={isDebateActive} // Disabled if a debate is ongoing
                >
                    Back to Homepage
                </Button>
            </div>

            {/* Right Column: Chat Area */}
            <div className="flex-grow flex flex-col bg-white shadow-lg rounded-lg overflow-hidden">
                <header className="p-4 border-b bg-slate-50">
                    <h3 className="text-lg font-semibold text-slate-700">
                        Debate Topic: <span className="font-normal">{ isDebateActive || isDebateOverByBackend ? debateTopic : "Select professors and topic"}</span>
                    </h3>
                    {isDebateActive && debateParticipants.length === 2 && (
                        <p className="text-sm text-slate-500">
                            {getProfessorById(debateParticipants[0])?.name} vs {getProfessorById(debateParticipants[1])?.name}
                        </p>
                    )}
                </header>

                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {debateMessages.map((msg, index) => {
                        const prof = msg.sender === 'professor' ? getProfessorById(msg.professorId) : null;
                        const isUser = msg.sender === 'user';
                        const isSystem = msg.sender === 'system';
                        let alignment = 'justify-start';
                        let bgColor = 'bg-slate-100 text-slate-800';
                        let avatarSrc = prof?.avatar;

                        if (isUser) {
                            alignment = 'justify-end';
                            bgColor = 'bg-sky-500 text-white';
                            // avatarSrc = userProfile?.avatar; // If you want user avatar
                        } else if (isSystem) {
                            alignment = 'justify-center text-center';
                            bgColor = 'bg-yellow-100 text-yellow-700 italic text-xs py-1 px-2';
                        } else if (prof) { // Professor message
                            // Alternate professor message alignment slightly if desired, or based on who is speaking
                            // For simplicity, all professor messages start left, but we use their specific avatar
                            if (prof.id === debateParticipants[1] && debateParticipants.length > 1) { // Example: second professor on the right
                                // alignment = 'justify-end';
                                // bgColor = 'bg-emerald-100 text-emerald-800'; // Different color for second professor
                            }
                        }


                        return (
                            <div key={index} className={`flex ${alignment}`}>
                                <div className={`flex items-end gap-2 max-w-md md:max-w-lg`}>
                                    {prof && alignment === 'justify-start' && (
                                        <img src={avatarSrc} alt={prof.name} className="w-8 h-8 rounded-full self-start object-cover"
                                             onError={(e) => { e.target.style.display = 'none'; }} />
                                    )}
                                    <div className={`p-3 rounded-lg shadow-sm ${bgColor} ${isSystem ? 'max-w-full' : ''}`}>
                                        {prof && <p className="text-xs font-semibold mb-1">{prof.name}</p>}
                                        <p className={`text-sm whitespace-pre-wrap`}>{msg.text}</p>
                                    </div>
                                    {/* {isUser && UserAvatarComponent} */}
                                    {prof && alignment === 'justify-end' && ( // If we decide to align one prof to right
                                        <img src={avatarSrc} alt={prof.name} className="w-8 h-8 rounded-full self-start object-cover"
                                             onError={(e) => { e.target.style.display = 'none'; }} />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {isDebateActive && !isDebateOverByBackend && (
                    <form onSubmit={handleSendMessage} className="p-4 border-t bg-slate-50 flex items-center gap-3">
                        <input
                            type="text"
                            value={debateInputValue}
                            onChange={(e) => setDebateInputValue(e.target.value)}
                            placeholder="Join the conversation..."
                            className="flex-grow p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none text-sm"
                        />
                        <Button type="submit" variant="primary" disabled={!debateInputValue.trim()}>
                            Send
                        </Button>
                    </form>
                )}

                {isDebateOverByBackend && (
                    <div className="p-6 text-center border-t bg-slate-50">
                         <p className="text-slate-600 mb-4 text-lg">
                            {debateMessages.find(msg => msg.sender === 'system' && msg.text.includes("concluded"))?.text || "This debate has concluded."}
                        </p>
                        <Button onClick={resetDebate} variant="secondary" className="mr-2">Start New Debate</Button>
                        <Button onClick={navigateToHome} variant="primary">Return to Homepage</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DebatePage;