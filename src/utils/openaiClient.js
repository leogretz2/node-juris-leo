//src/utils/openaiClient.js
const OpenAI = require('openai');
const { openaiApiKey } = require('../config');

const openai = new OpenAI({
    apiKey: openaiApiKey,
});

module.exports = openai;
