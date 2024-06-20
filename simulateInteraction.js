const axios = require('axios');
const readline = require('readline');

const user_uuid = '4caf6478-592b-4970-a45d-0c530920f341';
const baseURL = 'http://localhost:3000/api';

// Initialize readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to start a session
const startSession = async () => {
    try {
        const response = await axios.post(`${baseURL}/user/startSession`, { user_uuid });
        console.log('Session started:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error starting session:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
};

// Helper function to process a message
const processMessage = async (sessionId, message) => {
    try {
        const response = await axios.post(`${baseURL}/chat/processMessage`, { sessionId, message, user_uuid });
        console.log('Message processed:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error processing message:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
};

// Function to prompt user for input and process the message
const promptUser = (sessionId) => {
    rl.question('You: ', async (message) => {
        const response = await processMessage(sessionId, message);
        console.log('Bot:', response.response);

        // Prompt the user again
        promptUser(sessionId);
    });
};

// Main function to simulate interaction
const simulateInteraction = async () => {
    const { sessionId, userProfile, firstQuestion } = await startSession();

    console.log('\n--- Initial Question ---');
    console.log('Bot:', firstQuestion);

    // Start interactive prompt
    promptUser(sessionId);
};

simulateInteraction();
