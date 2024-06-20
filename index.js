// index.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config(); // Load environment variables

const userRoutes = require("./src/routes/userRoutes");
const chatRoutes = require("./src/routes/chatRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const domain = `http://localhost:${PORT}`;

// NODE_ENV variable set to local or production
const frontendUrl =
  process.env.NODE_ENV === "production"
    ? "https://juris-frontend-eyhm.vercel.app"
    : "http://localhost:3000";

console.log("enve", PORT, process.env.NODE_ENV);

app.use(
  cors({
    // Test with dynamic origin (then replit frontend URL/anything)
    // origin: 'http://localhost:3000', // Replace with your frontend URL
    // origin:
    //   "https://685349df-a66e-4a01-a4f0-cea38ca3ceb6-00-srph11q1miyp.picard.replit.dev",
    // origin: "https://juris-frontend-eyhm.vercel.app", // Replace with your frontend URL
    origin: "*", //frontendUrl,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use(bodyParser.json());

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on ${domain}`);
});
