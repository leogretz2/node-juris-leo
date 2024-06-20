//src/utils/takeNoteOnUser.js
const supabase = require('./supabaseClient');

const takeNoteOnUser = async ({ session_id, note }) => {
    const { data, error } = await supabase
        .rpc('update_session_notes', {
            p_session_id: session_id,
            p_note: note
        });

    if (error) {
        console.error('Error updating session notes:', error);
        throw error;
    }

    return data;
};

module.exports = takeNoteOnUser;
