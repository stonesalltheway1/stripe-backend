require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5000; // Fallback to 5000 if .env is missing

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Root route to verify server is running
app.get("/", (req, res) => {
    res.send(`<h2>🚀 AI Smart Replies Backend is Running!</h2>`);
});

// AI Reply Generation Route
app.post("/generate-reply", (req, res) => {
    try {
        const { message, tone, length, site } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Simulate AI-generated reply (Replace this with actual AI logic)
        const responseText = `Here is a ${tone || "neutral"} reply for "${site || "general"}": "${message}"`;

        res.json({ reply: responseText });
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Ensure all routes are defined above this!
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
