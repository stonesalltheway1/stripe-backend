/**
 * Stripe Payment Backend - server.js
 * Handles Stripe checkout sessions & webhook for subscription management
 */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const bodyParser = require("body-parser");
const app = express();

dotenv.config(); // Load environment variables

app.use(cors());
app.use(express.json());
app.use(bodyParser.raw({ type: "application/json" })); // Needed for Stripe webhooks

const FRONTEND_URL = "https://your-frontend.com"; // Replace with actual frontend
const SUCCESS_URL = `${FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`;
const CANCEL_URL = `${FRONTEND_URL}/cancel`;

/**
 * Creates a Stripe Checkout session for upgrading to Pro
 */
app.post("/create-checkout-session", async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            line_items: [
                {
                    price: "price_1QxNy2CBh2MQglAzrAOxvXnr", // Stripe Price ID for Pro Plan
                    quantity: 1,
                },
            ],
            success_url: SUCCESS_URL,
            cancel_url: CANCEL_URL,
        });
        res.json({ sessionId: session.id });
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ error: "Failed to create checkout session." });
    }
});

/**
 * Webhook to handle Stripe events (e.g., successful payments)
 */
app.post("/webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("Webhook signature verification failed.", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle subscription success
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        console.log("Payment successful for session: ", session.id);
        // TODO: Save subscription status to database or notify frontend
    }

    res.json({ received: true });
});

/**
 * Start Express server
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
