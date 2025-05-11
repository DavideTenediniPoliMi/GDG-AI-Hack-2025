import React from 'react';

const Button = ({ onClick, children, className = '', type = 'button', variant = 'primary', disabled }) => {
    let baseStyle = 'font-semibold py-2 px-4 rounded-lg shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75';

    if (disabled) {
        baseStyle += ' cursor-not-allowed opacity-50';
    }

    if (variant === 'secondary') {
        baseStyle += ` bg-white text-slate-700 border border-slate-400 ${!disabled && 'hover:bg-slate-100'} focus:ring-slate-300`;
    } else if (variant === 'danger') {
        baseStyle += ` bg-red-500 text-white ${!disabled && 'hover:bg-red-600'} focus:ring-red-400`;
    } else if (variant === 'success') { // New variant for green buttons
        baseStyle += ` bg-green-500 text-white ${!disabled && 'hover:bg-green-600'} focus:ring-green-400`;
    }
     else if (variant === 'primary') { // Default blue button
        baseStyle += ` bg-sky-500 text-white ${!disabled && 'hover:bg-sky-600'} focus:ring-sky-400`;
    } else if (variant === 'link') {
        baseStyle = `text-sky-600 ${!disabled && 'hover:text-sky-700'} underline ${baseStyle}`;
    }


    return (
        <button
            type={type}
            onClick={onClick}
            className={`${baseStyle} ${className}`}
            disabled={disabled}
        >
            {children}
        </button>
    );
};
export default Button;