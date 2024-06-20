//src/utils/submitUserScoreAndError.js

const supabase = require('./supabaseClient');

const submitUserScoreAndError = async ({ user_uuid, question_id, score, session_id }) => {
    const { data, error } = await supabase
        .rpc('insert_practice_history', {
            user_uuid,
            question_id,
            user_score: score,
            session_id
        });

    if (error) {
        console.error('Error inserting practice history:', error);
        throw error;
    }

    return "Score successfully recorded.";
};

module.exports = submitUserScoreAndError;
