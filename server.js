require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5000; // Default to 5000 for Render

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Root route to verify server is running
app.get("/", (req, res) => {
    res.send(`<h2>🚀 AI Smart Replies Backend is Running!</h2>`);
});

// Debugging middleware to log all incoming requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.url}`);
    next();
});

// AI Reply Generation Route
app.post("/generate-reply", (req, res) => {
    console.log("✅ Received POST request to /generate-reply");

    try {
        const { message, tone, length, site } = req.body;
        
        if (!message) {
            console.log("❌ Missing 'message' field in request body");
            return res.status(400).json({ error: "Message is required" });
        }

        // Simulate AI-generated reply
        const responseText = `Here is a ${tone || "neutral"} reply for "${site || "general"}": "${message}"`;
        console.log(`✅ Generated response: ${responseText}`);

        res.json({ reply: responseText });
    } catch (error) {
        console.error("❌ Error processing request:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Catch-all 404 handler
app.use((req, res) => {
    console.log(`❌ 404 - Route Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: "Not Found" });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
