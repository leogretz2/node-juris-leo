//src/utils/getQuestion.js
const supabase = require('./supabaseClient');

const getQuestion = async ({ user_uuid, question_type, difficulty, category }) => {
    try {
        const params = {
            p_user_uuid: user_uuid,
            p_question_type: question_type,
            p_difficulty: difficulty,
            p_category: category
        };
        console.log("Calling Supabase function 'get_question' with params:", params);
        const { data, error } = await supabase.rpc('get_question', params);
        if (error) {
            throw new Error(error.message);
        }
        console.log("Supabase 'get_question' function returned data:", JSON.stringify(data, null, 2));
        if (data && data.length > 0) {
            const questionData = data[0];
            return {
                question_id: questionData.question_id,
                question_text: questionData.question_text,
                possible_answers: questionData.possible_answers,
                correct_answer: questionData.correct_answer,
                explanation: questionData.explanation,
                isNewQuestion: true // Add this flag
            };
        }
        throw new Error('Question not found');
    } catch (e) {
        console.error("Error in getQuestion:", e);
        throw new Error(e.message);
    }
};

module.exports = getQuestion;
