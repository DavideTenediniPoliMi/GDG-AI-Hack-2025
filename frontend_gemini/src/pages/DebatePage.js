import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Button from '../components/Button';
import DebateWinnerScreen from '../components/DebateWinnerScreen'; // Import the new component

const DebatePage = () => {
  const {
    professors,
    debateParticipants,
    toggleDebateParticipant,
    debateMessages,
    debateInputValue,
    setDebateInputValue,
    isDebateActive,
    isDebateOverByBackend,
    debateTopic,
    setDebateTopic,
    startDebate,
    sendDebateMessage,
    resetDebate,
    isDebateLoading,
    navigateToHome,
    getProfessorById,
  } = useAppContext();

  const messagesEndRef = useRef(null);
  const [localDebateTopic, setLocalDebateTopic] = useState(debateTopic);
  const [isDebateOverByUser, setIsDebateOverByUser] = useState(false); // New state
  const [showWinnerScreen, setShowWinnerScreen] = useState(false); // New state

  useEffect(() => {
    setLocalDebateTopic(debateTopic);
  }, [debateTopic]);

  useEffect(() => {
    if (debateParticipants.length === 2 && !isDebateActive && !isDebateOverByBackend && !isDebateLoading) {
      console.log("DebatePage mounted with 2 participants, attempting to start debate.");
      startDebate();
    }
  }, [debateParticipants, isDebateActive, isDebateOverByBackend, isDebateLoading, startDebate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [debateMessages, isDebateLoading]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (debateInputValue.trim() && isDebateActive && !isDebateOverByBackend && !isDebateLoading) {
      sendDebateMessage(debateInputValue.trim());
    } else if (debateInputValue.trim().toLowerCase() === 'end debate') { // Add this condition
      setIsDebateOverByUser(true);
      setShowWinnerScreen(true);
      setDebateInputValue('');
    }
  };

  const handleStartDebateClick = () => {
    setDebateTopic(localDebateTopic.trim());
    if (debateParticipants.length === 2 && !isDebateActive && !isDebateOverByBackend && !isDebateLoading && localDebateTopic.trim()) {
      startDebate();
    } else {
      console.warn("Cannot start debate: conditions not met.");
    }
  };

  const handleResetClick = () => {
    resetDebate();
    setLocalDebateTopic("A new engaging discussion");
    setIsDebateOverByUser(false);
    setShowWinnerScreen(false);
  };

  const handleVote = (winner) => {
    // Implement logic to update professor scores based on 'winner'
    // You'll need to access and modify the RANKING_DATA or have a similar data structure
    console.log(`Winner: ${winner}`);
    setShowWinnerScreen(false); // Hide the winner screen after voting
  };

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
              value={localDebateTopic}
              onChange={(e) => setLocalDebateTopic(e.target.value)}
              placeholder="Enter debate topic"
              className="w-full p-2 border border-slate-300 rounded-md text-sm"
              disabled={isDebateLoading}
            />
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm text-slate-600">Select two professors:</p>
          {professors.map(prof => (
            <div key={prof.id} className={`flex items-center justify-between p-2 rounded-md border ${debateParticipants.includes(prof.id) ? 'bg-sky-100 border-sky-300' : 'bg-slate-50 border-slate-200'} ${isDebateActive || isDebateOverByBackend || isDebateLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-slate-100'}`}
              onClick={() => !(isDebateActive || isDebateOverByBackend || isDebateLoading) && toggleDebateParticipant(prof.id)}>
              <div className="flex items-center space-x-2">
                <img src={prof.avatar} alt={prof.name} className="w-8 h-8 rounded-full object-cover" />
                <span className="text-sm font-medium text-slate-700">{prof.name}</span>
              </div>
              <input
                type="checkbox"
                checked={debateParticipants.includes(prof.id)}
                onChange={() => !(isDebateActive || isDebateOverByBackend || isDebateLoading) && toggleDebateParticipant(prof.id)}
                className="form-checkbox h-4 w-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer"
                disabled={isDebateActive || isDebateOverByBackend || isDebateLoading}
              />
            </div>
          ))}
        </div>

        {/* Buttons */}
        <Button
          onClick={handleStartDebateClick}
          variant="success"
          className="w-full"
          disabled={debateParticipants.length !== 2 || isDebateActive || isDebateOverByBackend || isDebateLoading || !localDebateTopic.trim()}
        >
          {isDebateLoading && debateMessages.length === 0 ? 'Starting...' : 'Start Debate'}
        </Button>
        <Button
          onClick={handleResetClick}
          variant="danger"
          className="w-full"
          disabled={isDebateLoading || (!isDebateActive && debateParticipants.length === 0 && !isDebateOverByBackend)}
        >
          {isDebateLoading && debateParticipants.length > 0 ? 'Resetting...' : 'Reset'}
        </Button>
        <Button
          onClick={navigateToHome}
          variant="secondary"
          className="w-full"
          disabled={isDebateActive || isDebateLoading}
        >
          Back to Homepage
        </Button>
      </div>

      {/* Right Column: Chat Area */}
      <div className="flex-grow flex flex-col bg-white shadow-lg rounded-lg overflow-hidden">
        <header className="p-4 border-b bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-700">
            Debate Topic: <span className="font-normal">{isDebateActive || isDebateOverByBackend ? debateTopic : "Select professors and topic"}</span>
          </h3>
          {isDebateActive && debateParticipants.length === 2 && (
            <p className="text-sm text-slate-500">
              {getProfessorById(debateParticipants[0])?.name} vs {getProfessorById(debateParticipants[1])?.name}
            </p>
          )}
          {isDebateLoading && (
            <p className="text-sm text-slate-500 italic">Waiting for response...</p>
          )}
        </header>

        <div className="flex-grow p-4 overflow-y-auto space-y-4 h-[calc(100vh-250px)] lg:h-[calc(100vh-180px)]">
          {debateMessages.length === 0 && !isDebateLoading && !isDebateActive && (
            <div className="text-center text-slate-500">Select professors and enter a topic to start the debate.</div>
          )}
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

            if (isUser) {
              alignment = 'justify-end';
              bgColor = 'bg-sky-500 text-white';
            } else if (isSystem) {
              alignment = 'justify-center text-center';
              bgColor = 'bg-yellow-100 text-yellow-700 italic text-xs py-1 px-2';
            } else if (prof) {
              alignment = 'justify-start';
              bgColor = 'bg-slate-100 text-slate-800';
            }

            return (
              <div key={index} className={`flex ${alignment}`}>
                <div className={`flex items-end gap-2 max-w-md md:max-w-lg ${alignment === 'justify-end' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {prof && alignment === 'justify-start' && (
                    <img src={avatarSrc} alt={prof.name} className="w-8 h-8 rounded-full self-start object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/32x32/E0F2FE/0EA5E9?text=${prof.name.substring(0,1)}`; }}
                    />
                  )}
                  <div className={`p-3 rounded-lg shadow-sm ${bgColor} ${isSystem ? 'max-w-full' : ''}`}>
                    {prof && <p className="text-xs font-semibold mb-1">{prof.name}</p>}
                    <p className={`text-sm whitespace-pre-wrap`}>{msg.text}</p>
                  </div>
                  {prof && alignment === 'justify-end' && (
                    <img src={avatarSrc} alt={prof.name} className="w-8 h-8 rounded-full self-start object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/32x32/E0F2FE/0EA5E9?text=${prof.name.substring(0,1)}`; }}
                    />
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area or Debate Over Message */}
        {isDebateActive && !isDebateOverByBackend && !isDebateOverByUser && (
          <form onSubmit={handleSendMessage} className="p-4 border-t bg-slate-50 flex items-center gap-3">
            <input
              type="text"
              value={debateInputValue}
              onChange={(e) => setDebateInputValue(e.target.value)}
              placeholder={isDebateLoading ? "Waiting for response..." : "Join the conversation..."}
              className="flex-grow p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none text-sm"
              disabled={!isDebateActive || isDebateOverByBackend || isDebateLoading}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!isDebateActive || isDebateOverByBackend || isDebateLoading || !debateInputValue.trim()}
            >
              {isDebateLoading ? 'Sending...' : 'Send'}
            </Button>
          </form>
        )}

        {(isDebateOverByBackend || isDebateOverByUser) && (
          <div className="p-6 text-center border-t bg-slate-50">
            <p className="text-slate-600 mb-4 text-lg">
              {isDebateOverByUser
                ? "The debate has ended by user command. Please vote for the winner."
                : debateMessages.findLast(msg => msg.sender === 'system' && (msg.text.includes("concluded") || msg.text.includes("ended")))?.text || "This debate has concluded."
              }
            </p>
            {!isDebateOverByUser && (
              <Button onClick={() => setShowWinnerScreen(true)} variant="primary" className="mr-2">
                Vote for Winner
              </Button>
            )}
            <Button onClick={handleResetClick} variant="secondary" className="mr-2">Start New Debate</Button>
            <Button onClick={navigateToHome} variant="primary">Return to Homepage</Button>
          </div>
        )}
      </div>

      {showWinnerScreen && debateParticipants.length === 2 && (
        <DebateWinnerScreen
          prof1={getProfessorById(debateParticipants[0])}
          prof2={getProfessorById(debateParticipants[1])}
          onVote={handleVote}
          onReset={handleResetClick}
        />
      )}
    </div>
  );
};

export default DebatePage;