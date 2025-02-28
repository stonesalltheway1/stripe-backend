// ✅ Import required dependencies
const express = require("express");
const cors = require("cors");

const app = express();

// ✅ Enable CORS to allow requests from your extension
app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// ✅ Test Route - Confirms Backend is Running
app.get("/", (req, res) => {
    res.send("🚀 AI Smart Replies Backend is Running!");
});

// ✅ AI Reply Generation API Endpoint
app.post("/generate-reply", async (req, res) => {
    try {
        const { message, tone = "neutral", length = "medium", site = "default" } = req.body;

        if (!message) {
            return res.status(400).json({ error: "❌ Message is required." });
        }

        // Placeholder AI Response (Replace this with real AI processing logic)
        const aiResponse = `🤖 AI-generated reply to "${message}" with ${tone} tone & ${length} length.`;

        return res.json({ reply: aiResponse });
    } catch (error) {
        console.error("❌ Error in /generate-reply:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
