import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext'; // Already imported in App.js
import ProfessorCard from '../components/ProfessorCard'; // Already imported in App.js
import Button from '../components/Button'; // Already imported in App.js

const ProfessorPage = () => {
    const { selectedProfessor, navigateToHome, navigateToLecture, navigateToInverseLecture } = useAppContext();
    const [showNormalTopics, setShowNormalTopics] = useState(false);
    const [showInverseTopics, setShowInverseTopics] = useState(false);
    const [newTopic, setNewTopic] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadTopic, setUploadTopic] = useState('');


    if (!selectedProfessor) {
        // Should not happen if navigation is correct, but good for safety
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
                <p className="text-red-500 text-xl mb-4">Professor not found.</p>
                <Button onClick={navigateToHome}>Go to Homepage</Button>
            </div>
        );
    }

    const handleAddTopic = (e) => {
        e.preventDefault();
        if (newTopic.trim() === '') {
            alert('Please enter a topic name.');
            return;
        }
        // Placeholder for backend integration
        console.log(`Adding topic: "${newTopic}" for professor ${selectedProfessor.name}`);
        alert(`Topic "${newTopic}" submitted for ${selectedProfessor.name}. (Backend integration needed)`);
        // In a real app, you'd update the professor's topics list, possibly refetching data
        selectedProfessor.topics.push(newTopic); // Simulate adding locally for now
        setNewTopic('');
    };

    const handleFileChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleFileUpload = (e) => {
        e.preventDefault();
        if (!selectedFile) {
            alert('Please select a file to upload.');
            return;
        }
        if (uploadTopic.trim() === '') {
            alert('Please specify the topic for this document.');
            return;
        }
        // Placeholder for backend integration
        console.log(`Uploading file: ${selectedFile.name} for topic "${uploadTopic}" with professor ${selectedProfessor.name}`);
        alert(`File "${selectedFile.name}" for topic "${uploadTopic}" submitted. (Backend integration needed)`);
        setSelectedFile(null);
        setUploadTopic('');
        // Clear the file input
        document.getElementById('fileUploadInput').value = null;
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 p-4 md:p-8">
            <header className="mb-8">
                 <Button onClick={navigateToHome} className="mb-4">&larr; Back to Professors</Button>
                 <h1 className="text-3xl font-bold text-sky-600 text-center">Professor Details</h1>
            </header>

            <div className="container mx-auto bg-white p-6 rounded-xl shadow-xl">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Professor Card (Large) */}
                    <div className="w-full md:w-auto md:flex-shrink-0 md:self-center">
                        <ProfessorCard professor={selectedProfessor} size="large" />
                    </div>

                    {/* Interaction Options */}
                    <div className="flex-grow space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-700 mb-1">{selectedProfessor.name}</h2>
                            <p className="text-lg text-sky-600 mb-4">{selectedProfessor.subject}</p>

                            {/* Normal Lecture */}
                            <div className="mb-4 p-4 border border-slate-200 rounded-lg">
                                <Button onClick={() => { setShowNormalTopics(!showNormalTopics); setShowInverseTopics(false); }} className="w-full text-left justify-start">
                                    1. Normal Lecture {showNormalTopics ? '▼' : '►'}
                                </Button>
                                {showNormalTopics && (
                                    <div className="mt-3 pl-4 space-y-2">
                                        {selectedProfessor.topics && selectedProfessor.topics.length > 0 ? (
                                            selectedProfessor.topics.map(topic => (
                                                <button
                                                    key={topic}
                                                    onClick={() => navigateToLecture(selectedProfessor, topic)}
                                                    className="block w-full text-left p-2 rounded-md hover:bg-sky-100 text-slate-700 transition-colors"
                                                >
                                                    {topic}
                                                </button>
                                            ))
                                        ) : <p className="text-slate-500">No topics available for normal lecture.</p>}
                                    </div>
                                )}
                            </div>

                            {/* Inverse Lecture */}
                            <div className="mb-4 p-4 border border-slate-200 rounded-lg">
                                <Button onClick={() => { setShowInverseTopics(!showInverseTopics); setShowNormalTopics(false); }} className="w-full text-left justify-start">
                                    2. Inverse Lecture {showInverseTopics ? '▼' : '►'}
                                </Button>
                                {showInverseTopics && (
                                    <div className="mt-3 pl-4 space-y-2">
                                        {selectedProfessor.topics && selectedProfessor.topics.length > 0 ? (
                                            selectedProfessor.topics.map(topic => (
                                                <button
                                                    key={topic}
                                                    onClick={() => navigateToInverseLecture(selectedProfessor, topic)}
                                                    className="block w-full text-left p-2 rounded-md hover:bg-sky-100 text-slate-700 transition-colors"
                                                >
                                                    {topic}
                                                </button>
                                            ))
                                        ) : <p className="text-slate-500">No topics available for inverse lecture.</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Topic Management Section */}
                <div className="mt-10 pt-6 border-t border-slate-300">
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Manage Topics & Materials</h3>
                    {/* Add New Topic */}
                    <form onSubmit={handleAddTopic} className="mb-6 p-4 bg-slate-50 rounded-lg shadow">
                        <label htmlFor="newTopic" className="block text-sm font-medium text-slate-700 mb-1">Add a new topic for {selectedProfessor.name}:</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                id="newTopic"
                                value={newTopic}
                                onChange={(e) => setNewTopic(e.target.value)}
                                placeholder="Enter topic name"
                                className="flex-grow p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                            />
                            <Button type="submit">Add Topic</Button>
                        </div>
                    </form>

                    {/* Upload Document for a Topic */}
                    <form onSubmit={handleFileUpload} className="p-4 bg-slate-50 rounded-lg shadow">
                        <label htmlFor="uploadTopic" className="block text-sm font-medium text-slate-700 mb-1">Upload a document for a topic:</label>
                        <select
                            id="uploadTopic"
                            value={uploadTopic}
                            onChange={(e) => setUploadTopic(e.target.value)}
                            className="w-full p-2 mb-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                            required
                        >
                            <option value="" disabled>Select a topic</option>
                            {selectedProfessor.topics && selectedProfessor.topics.map(topic => (
                                <option key={topic} value={topic}>{topic}</option>
                            ))}
                            {selectedProfessor.topics.length === 0 && <option disabled>No topics available. Add one first.</option>}
                        </select>
                        <input
                            type="file"
                            id="fileUploadInput"
                            onChange={handleFileChange}
                            className="w-full p-2 mb-3 border border-slate-300 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200"
                        />
                        <Button type="submit" className="w-full" disabled={!selectedFile || !uploadTopic}>
                            Upload Document
                        </Button>
                        {selectedFile && <p className="text-xs text-slate-500 mt-1">Selected: {selectedFile.name}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
};
export default ProfessorPage; // This will be part of the main App.js bundle