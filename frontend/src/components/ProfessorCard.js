import React from 'react';
// import { useAppContext } from '../context/AppContext'; // Not needed if onClick is passed

const ProfessorCard = ({ professor, onClick }) => {
    // Sizes are removed as the new design is more fixed per the image
    // const cardSizeClasses = {
    // medium: 'w-48 h-64 md:w-56 md:h-72',
    // large: 'w-64 h-80 md:w-80 md:h-96',
    // };
    // const imageSizeClasses = {
    // medium: 'w-32 h-32 md:w-40 md:h-40',
    // large: 'w-48 h-48 md:w-60 md:h-60',
    // };
    // const textSizeClasses = {
    // medium: 'text-sm md:text-base',
    // large: 'text-base md:text-lg',
    // }

    return (
        <div
            className="bg-slate-700 rounded-lg shadow-md flex flex-col items-center text-center cursor-pointer hover:shadow-xl transition-shadow duration-300 w-full max-w-xs mx-auto overflow-hidden"
            // Removed transform hover:-translate-y-1 for a flatter design
            onClick={onClick ? () => onClick(professor) : null}
        >
            <div className="w-full h-56 sm:h-64 md:h-72 bg-slate-800 flex items-center justify-center"> {/* Added a container for the image to control its background */}
                <img
                    src={professor.avatar}
                    alt={professor.name}
                    className="object-contain object-center w-full h-full p-2" // Changed to object-contain and object-center
                    // Removed rounded-full, border classes
                    onError={(e) => {
                        e.target.onerror = null;
                        // Simple text placeholder if avatar fails, matching card bg
                        e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white text-xl">${professor.name.substring(0,1)}</div>`;
                    }}
                />
            </div>
            <div className="py-4 px-2">
                <h3 className="font-semibold text-white text-lg">{professor.name}</h3>
                <p className="text-slate-300 text-sm">{professor.subject}</p>
            </div>
        </div>
    );
};

export default ProfessorCard; // Ensure this is exported if you plan to separate files later