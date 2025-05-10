import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import Button from '../components/Button';

const LecturePage = () => {
    const {
        lectureMessages,
        lectureInputValue,
        setLectureInputValue,
        sendLectureMessageToBackend,
        endLectureByUser,
        isLectureOverByBackend,
        lectureTargetProfessor,
        currentLectureTopic,
        navigateToHome,
    } = useAppContext();

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

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
        if (lectureInputValue.trim() && !isLectureOverByBackend) {
            sendLectureMessageToBackend(lectureInputValue.trim());
        }
    };

    const handleEndLectureClick = () => {
        endLectureByUser(); // This will set isLectureOverByBackend to true via context logic
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
                    {!isLectureOverByBackend && (
                        <Button onClick={handleEndLectureClick} variant="danger" className="text-sm px-3 py-1 md:px-4 md:py-2">
                            End Lecture
                        </Button>
                    )}
                </div>
            </header>

            {/* Chat Messages Area */}
            <div className="flex-grow bg-white shadow-lg rounded-xl p-4 md:p-6 mb-4 overflow-y-auto">
                {lectureMessages.map((msg, index) => (
                    <div key={index} className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg shadow ${
                            msg.sender === 'user' ? 'bg-sky-500 text-white' : 
                            msg.sender === 'professor' ? 'bg-slate-100 text-slate-800' :
                            'bg-yellow-100 text-yellow-800 italic' // System messages
                        }`}>
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
                        {lectureMessages.find(msg => msg.sender === 'system')?.text || "This lecture session has ended."}
                    </p>
                    <Button onClick={navigateToHome} variant="primary">Return to Homepage</Button>
                </div>
            ) : (
                <form onSubmit={handleSendMessage} className="bg-white shadow-lg rounded-xl p-3 md:p-4 flex items-center gap-2 md:gap-3">
                    <input
                        type="text"
                        value={lectureInputValue}
                        onChange={(e) => setLectureInputValue(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow p-2 md:p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none text-sm"
                        disabled={isLectureOverByBackend}
                    />
                    <Button type="submit" variant="primary" disabled={isLectureOverByBackend || !lectureInputValue.trim()} className="px-3 py-2 md:px-5">
                        Send
                    </Button>
                </form>
            )}
        </div>
    );
};

export default LecturePage;