//src/routes/userRoutes.js
const express = require('express');
const { startSession } = require('../controllers/userController');

const router = express.Router();

router.post('/startSession', startSession);

module.exports = router;
