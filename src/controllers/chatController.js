//src/controllers/chatController.js
const supabase = require("../utils/supabaseClient");
const openai = require("../utils/openaiClient");
const getQuestion = require("../utils/getQuestion");
const getUserProfile = require("../utils/getUserProfile");
const generateSystemPrompt = require("../utils/generateSystemPrompt");
const updateConversationHistory =
    require("../models/session").updateConversationHistory;
const submitUserScoreAndError = require("../utils/submitUserScoreAndError");
const takeNoteOnUser = require("../utils/takeNoteOnUser");

const processMessage = async (req, res) => {
    const { sessionId, message = "", user_uuid } = req.body;

    console.log("Retrieving session with ID:", sessionId);

    const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("conversation_history")
        .eq("session_id", sessionId)
        .single();

    if (sessionError || !sessionData) {
        console.log("Session not found for ID:", sessionId);
        return res.status(404).json({ error: "Session not found" });
    }

    console.log("Session found with ID:", sessionId, "Content:", sessionData);

    let conversationHistory = sessionData.conversation_history || [];

    if (message) {
        // Add the user's message to the conversation history
        conversationHistory.push({ role: "user", content: message });
    }

    console.log(
        "Constructed conversation for OpenAI API:",
        conversationHistory,
    );

    const tools = [
        {
            type: "function",
            function: {
                name: "take_note_on_user",
                description: "Add a note to the user profile.",
                parameters: {
                    type: "object",
                    properties: {
                        question_id: { type: "string" },
                        note: { type: "string" },
                    },
                    required: ["question_id", "note"],
                },
            },
        },
        {
            type: "function",
            function: {
                name: "submit_user_score_and_error",
                description: "Submit the user score and error.",
                parameters: {
                    type: "object",
                    properties: {
                        user_uuid: { type: "string" },
                        question_id: { type: "string" },
                        score: { type: "integer" },
                        error: { type: "string" },
                    },
                    required: ["user_uuid", "question_id", "score"],
                },
            },
        },
        {
            type: "function",
            function: {
                name: "get_question",
                description: "Go to the next question.",
                parameters: {
                    type: "object",
                    properties: {
                        user_uuid: { type: "string" },
                        question_type: { type: "string" },
                        difficulty: { type: "integer" },
                        category: { type: "string" },
                    },
                    required: ["user_uuid", "question_type"],
                },
            },
        },
    ];

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: conversationHistory,
            tools: tools,
            tool_choice: "auto",
            temperature: 0,
            max_tokens: 4095,
        });

        console.log("OpenAI API response:", response);

        const aiResponse = response.choices[0].message;
        const tutorMessage = response.choices[0].message.content;
        const toolCalls = response.choices[0].message.tool_calls;

        console.log("API Message:", aiResponse);
        // console.log("Tutor Message:", tutorMessage);
        // console.log("Tool Calls:", toolCalls);

        // Add the response to the conversation history
        conversationHistory.push(aiResponse);

        let newSystemPrompt = null;
        let getQuestionCalled = false;
        let toolResponseAdded = false;
        let toolResponses = [];
        let nextQuestion = {};

        // Process tool calls
        if (toolCalls) {
            for (const toolCall of toolCalls) {
                console.log("Processing tool call:", toolCall);
                const toolFunctionName = toolCall.function.name;
                const toolArguments = JSON.parse(toolCall.function.arguments);
                const toolResponses = [];

                if (toolFunctionName === "get_question") {
                    getQuestionCalled = true;
                    nextQuestion = await getQuestion({
                        user_uuid: toolArguments.user_uuid,
                        question_type: toolArguments.question_type,
                        difficulty: toolArguments.difficulty || null,
                        category: toolArguments.category || null,
                    });

                    conversationHistory.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: toolFunctionName,
                        content:
                            "New question will be in the next system prompt message.",
                    });

                     console.log(nextQuestion);

                    const userProfile = await getUserProfile(user_uuid);
                    newSystemPrompt = generateSystemPrompt(
                        userProfile,
                        nextQuestion,
                    );
                    toolResponses.push({
                        name: toolFunctionName,
                        response: nextQuestion,
                    });
                   
                } else if (toolFunctionName === "take_note_on_user") {
                    toolResponseAdded = true;
                    const noteResult = await takeNoteOnUser({
                        session_id: sessionId, // Use sessionId which has associated user_uuid
                        note: toolArguments.note,
                    });

                    conversationHistory.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: toolFunctionName,
                        content: JSON.stringify(noteResult),
                    });
                    toolResponses.push({
                        name: toolFunctionName,
                        response: noteResult,
                    });
                } else if (toolFunctionName === "submit_user_score_and_error") {
                    toolResponseAdded = true;
                    const scoreResult = await submitUserScoreAndError({
                        user_uuid: toolArguments.user_uuid,
                        question_id: toolArguments.question_id,
                        score: toolArguments.score,
                        session_id: sessionId, // Use sessionId from processMessage
                        error: toolArguments.error || null,
                    });
                    conversationHistory.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: toolFunctionName,
                        content: scoreResult,
                    });
                    toolResponses.push({
                        name: toolFunctionName,
                        response: scoreResult,
                    });
                }
            }

            // After all the tools have finished
            // If we generated a new system prompt (aka get_question called), add it to the conversation history
            if (newSystemPrompt) {
                conversationHistory.push({
                    role: "system",
                    content: newSystemPrompt,
                });
            }

            // Always update the conversation history
            await updateConversationHistory(sessionId, conversationHistory);
            console.log("updated conversation history in supabase");

            // After conversation history updated, doubleResponse if no tutor message
            if (!getQuestionCalled && !tutorMessage) {
                console.log("Double call triggered");
                const req = {
                body: {
                    sessionId,
                    user_uuid,
                    },
                };
                const doubleResponse = await processMessage(req, res);
            }

            const responsePayload = {
                response: tutorMessage || "", // Return the tutor message if available
                nextQuestion: getQuestionCalled ? nextQuestion : null, // Include nextQuestion if getQuestion was called
            };
            console.log('Sending to frontend:', responsePayload);
            return res.status(200).json(responsePayload);
            
        } else {
            // If there are no tool calls openai again
            return res.status(200).json({ response: tutorMessage });
        }
    } catch (error) {
        console.error("Error processing message:", error);
        return res.status(500).json({ error: error.message });
    }
};

module.exports = { processMessage };
