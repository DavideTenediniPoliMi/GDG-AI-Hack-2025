// DebateWinnerScreen.js

import React, { useState } from 'react';
import Button from '../components/Button'; // Assuming you have a Button component

const DebateWinnerScreen = ({ prof1, prof2, onVote, onReset }) => {
  const [winner, setWinner] = useState(null);

  const handleVote = (selectedWinner) => {
    setWinner(selectedWinner);
    onVote(selectedWinner); // Callback to handle score update in parent component
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-slate-200 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Who Won the Debate?</h2>
        <div className="space-y-4">
          <Button
            onClick={() => handleVote(prof1)}
            variant={winner === prof1.id ? 'success' : 'primary'}
            className="w-full"
            disabled={winner !== null}
          >
            {prof1.name}
          </Button>
          <Button
            onClick={() => handleVote(prof2)}
            variant={winner === prof2 ? 'success' : 'primary'}
            className="w-full"
            disabled={winner !== null}
          >
            {prof2.name}
          </Button>
          {winner && (
            <div className="mt-4 text-center">
              <p className="text-slate-600">
                You voted for {winner === 'tie' ? 'a tie' : winner.name}.
              </p>
              <Button onClick={onReset} variant="secondary" className="mt-2">
                Start New Debate
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebateWinnerScreen;