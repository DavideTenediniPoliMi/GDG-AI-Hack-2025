// LecturePage.js

import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import Button from '../components/Button';

const LecturePage = () => {
    const {
        lectureMessages,
        lectureInputValue,
        setLectureInputValue,
        sendLectureMessageToBackend, // Now calls the API
        endLectureByUser,
        isLectureOverByBackend,
        lectureTargetProfessor,
        currentLectureTopic,
        isLectureLoading, // Use the loading state
        navigateToHome,
    } = useAppContext();

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Scroll to bottom whenever messages update
    useEffect(scrollToBottom, [lectureMessages]);

    if (!lectureTargetProfessor) {
        // Should not happen if navigation is correct
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-200 p-4">
                <p className="text-red-500 text-xl mb-4">Error: No lecture session found.</p>
                <Button onClick={navigateToHome} variant="secondary">Go to Homepage</Button>
            </div>
        );
    }

    const handleSendMessage = (e) => {
        e.preventDefault();
        // Use isLectureLoading here as well to prevent sending while waiting for another response
        if (lectureInputValue.trim() && !isLectureOverByBackend && !isLectureLoading) {
            sendLectureMessageToBackend(lectureInputValue.trim(), lectureTargetProfessor.id, false); // Pass false for isInitial
        }
    };

    const handleEndLectureClick = () => {
        // Only allow ending if not currently loading
        if (!isLectureLoading) {
           endLectureByUser();
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-200 p-4 md:p-6 lg:p-8">
            {/* Header Section */}
            <header className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <img
                            src={lectureTargetProfessor.avatar}
                            alt={lectureTargetProfessor.name}
                            className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-slate-400 object-cover"
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/64x64/E0F2FE/0EA5E9?text=${lectureTargetProfessor.name.substring(0,1)}`; }}
                        />
                        <div>
                            <h1 className="text-xl md:text-2xl font-semibold text-slate-800">{lectureTargetProfessor.name}</h1>
                            <p className="text-sm md:text-base text-slate-600">Topic: {currentLectureTopic}</p>
                        </div>
                    </div>
                    {/* Only show End Lecture button if lecture is active and not loading */}
                    {!isLectureOverByBackend && !isLectureLoading && (
                        <Button onClick={handleEndLectureClick} variant="danger" className="text-sm px-3 py-1 md:px-4 md:py-2">
                            End Lecture
                        </Button>
                    )}
                     {/* Optionally show a loading indicator */}
                     {isLectureLoading && (
                         <span className="text-slate-600 text-sm">Loading...</span>
                     )}
                </div>
            </header>

            {/* Chat Messages Area */}
            {/* Add a fixed height and make it scrollable */}
            <div className="flex-grow bg-white shadow-lg rounded-xl p-4 md:p-6 mb-4 overflow-y-auto h-[calc(100vh-250px)]"> {/* Adjusted height */}
                 {lectureMessages.length === 0 && isLectureLoading && (
                     <div className="text-center text-slate-500">Waiting for professor...</div>
                 )}
                 {lectureMessages.map((msg, index) => (
                     <div key={index} className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : msg.sender === 'system' ? 'justify-center' : 'justify-start'}`}>
                         <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg shadow ${
                             msg.sender === 'user' ? 'bg-sky-500 text-white' :
                             msg.sender === 'professor' ? 'bg-slate-100 text-slate-800' :
                             'bg-yellow-100 text-yellow-800 italic' // System messages
                         }`}>
                             {/* Only show professor avatar for professor messages */}
                             {msg.sender === 'professor' && lectureTargetProfessor && (
                                 <img
                                     src={lectureTargetProfessor.avatar}
                                     alt="prof"
                                     className="w-6 h-6 rounded-full mr-2 float-left"
                                     onError={(e) => { e.target.style.display = 'none'; }}
                                 />
                             )}
                             {/* User avatar can be added here if desired */}
                             <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                         </div>
                     </div>
                 ))}
                 <div ref={messagesEndRef} />
            </div>

            {/* Input Area or Lecture Over Message */}
            {isLectureOverByBackend ? (
                <div className="bg-white shadow-lg rounded-xl p-6 text-center">
                    <h2 className="text-xl font-semibold text-slate-700 mb-3">Lecture Concluded</h2>
                    <p className="text-slate-600 mb-4">
                         {/* Find the last system message which is likely the end message */}
                        {lectureMessages.filter(msg => msg.sender === 'system').pop()?.text || "This lecture session has ended."}
                    </p>
                    <Button onClick={navigateToHome} variant="primary">Return to Homepage</Button>
                </div>
            ) : (
                <form onSubmit={handleSendMessage} className="bg-white shadow-lg rounded-xl p-3 md:p-4 flex items-center gap-2 md:gap-3">
                    <input
                        type="text"
                        value={lectureInputValue}
                        onChange={(e) => setLectureInputValue(e.target.value)}
                        placeholder={isLectureLoading ? "Waiting for response..." : "Type your message..."} // Change placeholder when loading
                        className="flex-grow p-2 md:p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none text-sm"
                        disabled={isLectureOverByBackend || isLectureLoading} // Disable when loading too
                    />
                    <Button
                         type="submit"
                         variant="primary"
                         disabled={isLectureOverByBackend || isLectureLoading || !lectureInputValue.trim()} // Disable send if loading or input empty
                         className="px-3 py-2 md:px-5"
                    >
                        {isLectureLoading ? 'Sending...' : 'Send'} {/* Change button text when loading */}
                    </Button>
                </form>
            )}
        </div>
    );
};

export default LecturePage;