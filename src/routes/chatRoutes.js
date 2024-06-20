// src/routes/chatRoutes.js
const express = require('express');
const { processMessage } = require('../controllers/chatController');

const router = express.Router();

// POST /api/chat/processMessage
router.post('/processMessage', processMessage);

module.exports = router;
