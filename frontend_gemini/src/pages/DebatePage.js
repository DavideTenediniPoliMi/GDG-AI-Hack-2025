// DebatePage.js

import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Button from '../components/Button';

const DebatePage = () => {
    const {
        professors, // Full list of professors
        debateParticipants, toggleDebateParticipant,
        debateMessages, debateInputValue, setDebateInputValue,
        isDebateActive, isDebateOverByBackend, debateTopic, setDebateTopic,
        startDebate, // This is now startDebateAction from context
        sendDebateMessage, // This is now sendDebateUserMessage from context
        resetDebate, // This is now resetDebateAction from context
        isDebateLoading, // Get loading state from context
        navigateToHome,
        // getProfessorById is now potentially in context, or keep local if only used here
        getProfessorById, // Get the helper from context
    } = useAppContext();

    const messagesEndRef = useRef(null);
    // Use context debateTopic directly for the input field value
    // or manage a local state that syncs with context on start
    // Let's manage a local state and sync it when debate starts/resets
    const [localDebateTopic, setLocalDebateTopic] = useState(debateTopic);

    // Sync local topic state with context topic state
    useEffect(() => {
        setLocalDebateTopic(debateTopic);
    }, [debateTopic]);


    useEffect(() => {
        // If navigating to page with 2 participants already selected (e.g. from suggestion)
        // and debate is not active, try to start it.
        // Also ensure we are not already loading or over
        if (debateParticipants.length === 2 && !isDebateActive && !isDebateOverByBackend && !isDebateLoading) {
            console.log("DebatePage mounted with 2 participants, attempting to start debate.");
            // Call the action function from context
            startDebate();
        }
        // Dependencies: debateParticipants change, debate state flags change, startDebate action changes
    }, [debateParticipants, isDebateActive, isDebateOverByBackend, isDebateLoading, startDebate]);


    useEffect(() => {
        // Scroll to bottom when messages update or loading state changes (to show loading indicator)
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [debateMessages, isDebateLoading]); // Include loading state


    const handleSendMessage = (e) => {
        e.preventDefault();
        // Only send if active, not over, not loading, and input is not empty
        if (debateInputValue.trim() && isDebateActive && !isDebateOverByBackend && !isDebateLoading) {
            // Call the action function from context
            sendDebateMessage(debateInputValue.trim());
            // Input value is now cleared in the context function
            // setDebateInputValue('');
        }
    };

    // Ensure getProfessorById is available, assuming it's provided by context
    // const getProfessorById = (id) => professors.find(p => p.id === id);

    const handleStartDebateClick = () => {
        // Sync the custom topic back to the context before starting
        setDebateTopic(localDebateTopic.trim());
        // startDebateAction will be called by the useEffect trigger or could be called directly here
        // Calling directly here might be slightly faster than waiting for the effect
         if (debateParticipants.length === 2 && !isDebateActive && !isDebateOverByBackend && !isDebateLoading && localDebateTopic.trim()) {
             startDebate();
         } else {
             console.warn("Cannot start debate: conditions not met.");
         }
    }

    const handleResetClick = () => {
        // Call the action function from context
        resetDebate();
        // Reset local topic state when resetting
        setLocalDebateTopic("A new engaging discussion");
    }


    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-slate-200 p-4 md:p-6 gap-6">
            {/* Left Column: Professor Selection & Controls */}
            <div className="w-full lg:w-1/3 xl:w-1/4 bg-white p-4 rounded-lg shadow-lg flex flex-col space-y-4 self-start">
                <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Let's Debate!</h2>

                {!isDebateActive && !isDebateOverByBackend && ( // Topic input only visible before debate starts
                    <div>
                        <label htmlFor="debateTopicInput" className="block text-sm font-medium text-slate-600 mb-1">Debate Topic:</label>
                        <input
                            id="debateTopicInput"
                            type="text"
                            value={localDebateTopic} // Use local state for input control
                            onChange={(e) => setLocalDebateTopic(e.target.value)}
                            placeholder="Enter debate topic"
                            className="w-full p-2 border border-slate-300 rounded-md text-sm"
                            disabled={isDebateLoading} // Disable input while starting/loading
                        />
                    </div>
                )}


                <div className="space-y-2">
                    <p className="text-sm text-slate-600">Select two professors:</p>
                    {professors.map(prof => (
                        <div key={prof.id} className={`flex items-center justify-between p-2 rounded-md border ${debateParticipants.includes(prof.id) ? 'bg-sky-100 border-sky-300' : 'bg-slate-50 border-slate-200'} ${isDebateActive || isDebateOverByBackend || isDebateLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-slate-100'}`} // Disable selection while active, over, or loading
                             onClick={() => !(isDebateActive || isDebateOverByBackend || isDebateLoading) && toggleDebateParticipant(prof.id)}>
                            <div className="flex items-center space-x-2">
                                <img src={prof.avatar} alt={prof.name} className="w-8 h-8 rounded-full object-cover" />
                                <span className="text-sm font-medium text-slate-700">{prof.name}</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={debateParticipants.includes(prof.id)}
                                onChange={() => !(isDebateActive || isDebateOverByBackend || isDebateLoading) && toggleDebateParticipant(prof.id)} // Disable checkbox while active, over, or loading
                                className="form-checkbox h-4 w-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer"
                                disabled={isDebateActive || isDebateOverByBackend || isDebateLoading} // Disable checkbox while active, over, or loading
                            />
                        </div>
                    ))}
                </div>

                {/* Buttons */}
                 <Button
                    onClick={handleStartDebateClick} // Use local handler
                    variant="success"
                    className="w-full"
                    // Disabled if not 2 participants, or already active/over/loading, or topic is empty
                    disabled={debateParticipants.length !== 2 || isDebateActive || isDebateOverByBackend || isDebateLoading || !localDebateTopic.trim()}
                >
                    {isDebateLoading && debateMessages.length === 0 ? 'Starting...' : 'Start Debate'}
                </Button>
                <Button
                    onClick={handleResetClick} // Use local handler
                    variant="danger"
                    className="w-full"
                    // Enable if active, or if participants are selected but debate hasn't started/is over
                    disabled={isDebateLoading || (!isDebateActive && debateParticipants.length === 0 && !isDebateOverByBackend)}
                >
                    {isDebateLoading && debateParticipants.length > 0 ? 'Resetting...' : 'Reset'}
                </Button>
                <Button
                    onClick={navigateToHome}
                    variant="secondary"
                    className="w-full"
                    disabled={isDebateActive || isDebateLoading} // Disabled if debate is ongoing or loading
                >
                    Back to Homepage
                </Button>
            </div>

            {/* Right Column: Chat Area */}
            {/* Add a fixed height and make it scrollable */}
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
                      {/* Optional: Show loading indicator in header */}
                      {isDebateLoading && (
                          <p className="text-sm text-slate-500 italic">Waiting for response...</p>
                      )}
                 </header>

                 <div className="flex-grow p-4 overflow-y-auto space-y-4 h-[calc(100vh-250px)] lg:h-[calc(100vh-180px)]"> {/* Adjusted height */}
                     {debateMessages.length === 0 && !isDebateLoading && !isDebateActive && (
                          <div className="text-center text-slate-500">Select professors and enter a topic to start the debate.</div>
                     )}
                      {/* Show initial loading message if no messages and loading */}
                      {debateMessages.length === 0 && isDebateLoading && (
                           <div className="text-center text-slate-500">Starting debate...</div>
                      )}
                     {debateMessages.map((msg, index) => {
                         const prof = msg.sender === 'professor' ? getProfessorById(msg.professorId) : null;
                         const isUser = msg.sender === 'user';
                         const isSystem = msg.sender === 'system';
                         let alignment = 'justify-start';
                         let bgColor = 'bg-slate-100 text-slate-800';
                         let avatarSrc = prof?.avatar;

                         // Align user messages to the right, system messages centered
                         if (isUser) {
                             alignment = 'justify-end';
                             bgColor = 'bg-sky-500 text-white';
                             // avatarSrc = userProfile?.avatar; // If you want user avatar
                         } else if (isSystem) {
                             alignment = 'justify-center text-center';
                             bgColor = 'bg-yellow-100 text-yellow-700 italic text-xs py-1 px-2';
                         } else if (prof) { // Professor message
                              // Decide if you want one professor on the left and one on the right
                              // For simplicity, keeping all professor messages aligned left here
                              // If you want them on opposite sides based on prof_id, you'd add logic like:
                              // if (debateParticipants.length === 2 && prof.id === debateParticipants[1]) {
                              //     alignment = 'justify-end';
                              //     bgColor = 'bg-emerald-100 text-emerald-800'; // Example different color
                              // }
                              alignment = 'justify-start'; // Default professor alignment
                              bgColor = 'bg-slate-100 text-slate-800'; // Default professor color
                         }


                         return (
                             <div key={index} className={`flex ${alignment}`}>
                                  {/* Conditionally render avatar based on alignment */}
                                 <div className={`flex items-end gap-2 max-w-md md:max-w-lg ${alignment === 'justify-end' ? 'flex-row-reverse' : 'flex-row'}`}> {/* Reverse row for right-aligned messages */}
                                     {prof && alignment === 'justify-start' && (
                                         <img src={avatarSrc} alt={prof.name} className="w-8 h-8 rounded-full self-start object-cover"
                                              onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/32x32/E0F2FE/0EA5E9?text=${prof.name.substring(0,1)}`; }} // Fallback
                                          />
                                     )}
                                      {/* Add user avatar if desired */}
                                      {/* {isUser && (
                                         <img src={userProfile.avatar} alt={userProfile.name} className="w-8 h-8 rounded-full self-start object-cover" />
                                      )} */}
                                     <div className={`p-3 rounded-lg shadow-sm ${bgColor} ${isSystem ? 'max-w-full' : ''}`}>
                                         {prof && <p className="text-xs font-semibold mb-1">{prof.name}</p>}
                                         <p className={`text-sm whitespace-pre-wrap`}>{msg.text}</p>
                                     </div>
                                      {/* Render professor avatar on the right if alignment is justify-end */}
                                     {prof && alignment === 'justify-end' && (
                                         <img src={avatarSrc} alt={prof.name} className="w-8 h-8 rounded-full self-start object-cover"
                                              onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/32x32/E0F2FE/0EA5E9?text=${prof.name.substring(0,1)}`; }} // Fallback
                                         />
                                     )}
                                 </div>
                             </div>
                         );
                     })}
                     <div ref={messagesEndRef} />
                 </div>

                 {/* Input Area or Debate Over Message */}
                 {isDebateActive && !isDebateOverByBackend && (
                     <form onSubmit={handleSendMessage} className="p-4 border-t bg-slate-50 flex items-center gap-3">
                         <input
                             type="text"
                             value={debateInputValue}
                             onChange={(e) => setDebateInputValue(e.target.value)}
                             placeholder={isDebateLoading ? "Waiting for response..." : "Join the conversation..."}
                             className="flex-grow p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none text-sm"
                             disabled={!isDebateActive || isDebateOverByBackend} // Disable if not active, over, or loading
                         />
                         <Button
                             type="submit"
                             variant="primary"
                             disabled={!isDebateActive || isDebateOverByBackend || isDebateLoading || !debateInputValue.trim()} // Disable if not active, over, loading, or input empty
                         >
                              {isDebateLoading ? 'Sending...' : 'Send'}
                         </Button>
                     </form>
                 )}

                 {isDebateOverByBackend && (
                     <div className="p-6 text-center border-t bg-slate-50">
                          <p className="text-slate-600 mb-4 text-lg">
                              {debateMessages.findLast(msg => msg.sender === 'system' && (msg.text.includes("concluded") || msg.text.includes("ended")))?.text || "This debate has concluded."} {/* Find the last relevant system message */}
                          </p>
                         <Button onClick={handleResetClick} variant="secondary" className="mr-2">Start New Debate</Button> {/* Use local handler */}
                         <Button onClick={navigateToHome} variant="primary">Return to Homepage</Button>
                     </div>
                 )}
             </div>
        </div>
    );
};

export default DebatePage;