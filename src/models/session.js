//src/models/session.js
const supabase = require('../utils/supabaseClient');

const createSession = async (user_uuid, question_type_focus, question_category_focus, current_session_notes) => {
    const { data, error } = await supabase.rpc('create_new_session', {
        p_user_uuid: user_uuid,
        p_question_type_focus: question_type_focus || null,
        p_question_category_focus: question_category_focus || null,
        p_current_session_notes: current_session_notes ? JSON.parse(current_session_notes) : []
    });

    if (error) {
        throw new Error(error.message);
    }

    return data[0];
};

const updateConversationHistory = async (session_id, conversation_history) => {
    const { data, error } = await supabase
        .from('sessions')
        .update({ conversation_history })
        .eq('session_id', session_id);

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

const getSession = async (session_id) => {
    const { data, error } = await supabase
        .from('sessions')
        .select('conversation_history')
        .eq('session_id', session_id)
        .single();

    if (error || !data) {
        throw new Error('Session not found');
    }

    return data.conversation_history;
};

module.exports = {
    createSession,
    updateConversationHistory,
    getSession
};
