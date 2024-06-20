//src/models/user.js
const supabase = require('../utils/supabaseClient');

const getUserProfile = async (user_uuid) => {
    try {
        const { data, error } = await supabase.rpc('get_user_profile', { p_user_uuid: user_uuid });
        if (error) {
            throw new Error(error.message);
        }
        if (data && data.length > 0) {
            return {
                user_uuid: data[0].user_uuid,
                name: data[0].name,
                overall_mbe_score: data[0].overall_score || 0,
                previous_notes: data[0].tutor_notes || 'N/A',
            };
        }
        throw new Error('User not found');
    } catch (e) {
        throw new Error(e.message);
    }
};

module.exports = { getUserProfile };
