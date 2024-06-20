//src/controllers/userController.js
const { v4: uuidv4 } = require('uuid');
const supabase = require('../utils/supabaseClient');
const getQuestion = require('../utils/getQuestion');
const createSession = require('../models/session').createSession;
const getUserProfile = require('../utils/getUserProfile'); // Ensure this utility is also correctly implemented and imported
const generateSystemPrompt = require('../utils/generateSystemPrompt');

const startSession = async (req, res) => {
    const user_uuid = req.body.user_uuid;
    try {
        // Create a new session in the database
        const sessionData = await createSession(user_uuid, null, null, null);

        console.log("Session created:", sessionData);

        const userProfile = await getUserProfile(user_uuid);
        console.log("User profile fetched:", userProfile);

        const firstQuestion = await getQuestion({
            user_uuid,
            question_type: 'MBE',
            difficulty: null,
            category: null
        });

        console.log("First question fetched:", firstQuestion);

        const systemPrompt = generateSystemPrompt(userProfile, firstQuestion);

        const initialConversationHistory = [
            { role: 'system', content: systemPrompt },
        ];

        await supabase
            .from('sessions')
            .update({ conversation_history: initialConversationHistory })
            .eq('session_id', sessionData.session_id);

        res.status(200).json({ sessionId: sessionData.session_id, userProfile, firstQuestion });
    } catch (e) {
        console.error("Error starting session:", e);
        res.status(500).json({ error: e.message });
    }
};

module.exports = { startSession };
