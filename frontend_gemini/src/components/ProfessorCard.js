import React from 'react';
import { useAppContext } from '../context/AppContext'; // Already imported in App.js

const ProfessorCard = ({ professor, size = 'medium', onClick }) => {
    // const { navigateToProfessor } = useAppContext(); // Not needed if onClick is passed

    const cardSizeClasses = {
        medium: 'w-48 h-64 md:w-56 md:h-72', // For index page
        large: 'w-64 h-80 md:w-80 md:h-96',  // For professor page
    };

    const imageSizeClasses = {
        medium: 'w-32 h-32 md:w-40 md:h-40',
        large: 'w-48 h-48 md:w-60 md:h-60',
    };

    const textSizeClasses = {
        medium: 'text-sm md:text-base',
        large: 'text-base md:text-lg',
    }

    return (
        <div
            className={`bg-white rounded-xl shadow-lg p-4 flex flex-col items-center justify-between text-center cursor-pointer hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1 ${cardSizeClasses[size]}`}
            onClick={onClick ? () => onClick(professor) : null}
        >
            <img
                src={professor.avatar}
                alt={professor.name}
                className={`rounded-full object-cover border-4 border-sky-200 mb-3 ${imageSizeClasses[size]}`}
                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/200x200/E0F2FE/0EA5E9?text=${professor.name.substring(0,1)}`; }}
            />
            <div>
                <h3 className={`font-bold text-slate-800 ${textSizeClasses[size]}`}>{professor.name}</h3>
                <p className={`text-sky-600 ${textSizeClasses[size]}`}>{professor.subject}</p>
            </div>
        </div>
    );
};
export default ProfessorCard; // This will be part of the main App.js bundle