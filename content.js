/**
 * content.js - AI Smart Replies Content Script
 * Injects UI elements, extracts message data, and handles interactions.
 */

// Wait until the page is fully loaded before executing
(function () {
    console.log("AI Smart Replies: Content script loaded");

    /**
     * Utility function to check if the current site is supported
     * @returns {boolean} True if the site is supported, otherwise false
     */
    function isSupportedSite() {
        const supportedSites = [
            "mail.google.com",  // Gmail
            "www.linkedin.com",  // LinkedIn
            "twitter.com",  // Twitter (X)
            "www.facebook.com",  // Facebook
            "www.reddit.com",  // Reddit
            "www.youtube.com" // YouTube comments
        ];
        return supportedSites.some((site) => window.location.hostname.includes(site));
    }

    if (!isSupportedSite()) {
        console.warn("AI Smart Replies: This site is not supported.");
        return;
    }

    /**
     * Injects the AI reply button into message input fields
     */
    function injectReplyButtons() {
        let inputSelectors = {
            "mail.google.com": "div[aria-label='Message Body']",  // Gmail
            "www.linkedin.com": "div.msg-form__contenteditable",  // LinkedIn Messages
            "twitter.com": "div[data-testid='tweetTextarea_0']",  // Twitter Tweets
            "www.facebook.com": "div[role='textbox']",  // Facebook Comments & Messenger
            "www.reddit.com": "textarea",  // Reddit Comments
            "www.youtube.com": "yt-formatted-string[contenteditable='true']" // YouTube Comments
        };

        let inputSelector = Object.keys(inputSelectors).find((key) => window.location.hostname.includes(key));
        if (!inputSelector) return;

        let inputElements = document.querySelectorAll(inputSelectors[inputSelector]);
        inputElements.forEach((inputElement) => {
            if (!inputElement || inputElement.dataset.aiReplyInjected) return;

            let replyButton = document.createElement("button");
            replyButton.innerText = "✨ AI Reply";
            replyButton.style.cssText = "margin-left: 8px; background: #4CAF50; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;";
            replyButton.onclick = () => generateAIReply(inputElement);

            let parent = inputElement.parentElement;
            if (parent) parent.appendChild(replyButton);
            inputElement.dataset.aiReplyInjected = "true";
        });
    }

    /**
     * Generates an AI-powered reply suggestion
     * @param {HTMLElement} inputElement - The input field to populate with the AI reply
     */
    async function generateAIReply(inputElement) {
        if (!inputElement) return;
        let userMessage = inputElement.innerText || inputElement.value;
        if (!userMessage.trim()) {
            alert("Please type a message before generating a reply.");
            return;
        }

        console.log("AI Smart Replies: Generating reply for message:", userMessage);

        try {
            let response = await fetch("https://your-backend-api.com/generate-reply", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: userMessage, site: window.location.hostname })
            });

            let data = await response.json();
            if (data.reply) {
                inputElement.innerText = data.reply;
                inputElement.value = data.reply;
            } else {
                alert("AI Reply generation failed. Please try again.");
            }
        } catch (error) {
            console.error("AI Smart Replies: Error generating reply", error);
            alert("An error occurred while generating the AI reply.");
        }
    }

    // Observe DOM for dynamic input fields
    const observer = new MutationObserver(() => {
        injectReplyButtons();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial button injection
    injectReplyButtons();
})();

/**
 * Enhancing AI Smart Replies - Advanced Features
 * - Improves UI interaction
 * - Adds loading animations and improved error handling
 * - Enables keyboard shortcuts for quick AI reply generation
 */

/**
 * Adds a loading animation to the AI Reply button when fetching a response
 * @param {HTMLElement} button - The AI Reply button
 * @param {boolean} isLoading - True to show loading, false to restore
 */
function toggleButtonLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
        button.innerText = "⏳ Generating...";
        button.disabled = true;
        button.style.opacity = "0.6";
    } else {
        button.innerText = "✨ AI Reply";
        button.disabled = false;
        button.style.opacity = "1";
    }
}

/**
 * Attach keyboard shortcut for triggering AI replies
 */
document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "Enter") {
        let activeInput = document.activeElement;
        if (activeInput && activeInput.dataset.aiReplyInjected) {
            generateAIReply(activeInput);
        }
    }
});

/**
 * Improved AI Reply Generation with Retry Mechanism
 * @param {HTMLElement} inputElement - The input field to populate with the AI reply
 */
async function generateAIReply(inputElement) {
    if (!inputElement) return;
    let userMessage = inputElement.innerText || inputElement.value;
    if (!userMessage.trim()) {
        alert("Please type a message before generating a reply.");
        return;
    }

    console.log("AI Smart Replies: Generating reply for message:", userMessage);
    let replyButton = inputElement.parentElement?.querySelector("button");

    try {
        toggleButtonLoading(replyButton, true);
        
        let response = await fetch("https://your-backend-api.com/generate-reply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMessage, site: window.location.hostname })
        });

        let data = await response.json();
        if (data.reply) {
            inputElement.innerText = data.reply;
            inputElement.value = data.reply;
        } else {
            console.warn("AI Smart Replies: No reply received, retrying...");
            await retryAIReply(inputElement, replyButton);
        }
    } catch (error) {
        console.error("AI Smart Replies: Error generating reply", error);
        alert("An error occurred while generating the AI reply.");
    } finally {
        toggleButtonLoading(replyButton, false);
    }
}

/**
 * Retry AI reply request in case of failure
 * @param {HTMLElement} inputElement - The input field
 * @param {HTMLElement} button - The AI Reply button
 */
async function retryAIReply(inputElement, button) {
    for (let attempt = 1; attempt <= 2; attempt++) {
        console.log(`Retry attempt ${attempt}...`);
        try {
            let response = await fetch("https://your-backend-api.com/generate-reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: inputElement.innerText, site: window.location.hostname })
            });

            let data = await response.json();
            if (data.reply) {
                inputElement.innerText = data.reply;
                inputElement.value = data.reply;
                return;
            }
        } catch (error) {
            console.error("AI Smart Replies: Retry attempt failed", error);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait before retrying
    }
    alert("AI could not generate a reply. Please try again later.");
}

/**
 * Adds real-time UI enhancements (hover effects, styling improvements)
 */
function enhanceUIElements() {
    let aiButtons = document.querySelectorAll("button[data-ai-reply]");
    aiButtons.forEach((button) => {
        button.addEventListener("mouseover", () => {
            button.style.background = "#3E8E41";
        });
        button.addEventListener("mouseout", () => {
            button.style.background = "#4CAF50";
        });
    });
}

// Run UI enhancements on load
setTimeout(() => enhanceUIElements(), 2000);

/**
 * Smart Context Extraction for Better AI Replies
 * Analyzes nearby conversation history before sending to AI
 * @param {HTMLElement} inputElement - The message input field
 * @returns {string} Extracted context for AI processing
 */
function extractContext(inputElement) {
    let context = [];
    let maxMessages = 3;
    let sibling = inputElement.previousElementSibling;
    
    while (sibling && maxMessages > 0) {
        if (sibling.innerText && sibling.innerText.trim() !== "") {
            context.push(sibling.innerText);
            maxMessages--;
        }
        sibling = sibling.previousElementSibling;
    }

    return context.reverse().join(" ");
}

/**
 * Enhanced AI Reply with Context Awareness
 * @param {HTMLElement} inputElement - The input field
 */
async function generateContextAwareReply(inputElement) {
    if (!inputElement) return;
    let userMessage = inputElement.innerText || inputElement.value;
    if (!userMessage.trim()) {
        alert("Please type a message before generating a reply.");
        return;
    }

    let conversationContext = extractContext(inputElement);
    console.log("AI Smart Replies: Sending context-aware request", { userMessage, conversationContext });

    try {
        let response = await fetch("https://your-backend-api.com/generate-reply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMessage, context: conversationContext, site: window.location.hostname })
        });

        let data = await response.json();
        if (data.reply) {
            inputElement.innerText = data.reply;
            inputElement.value = data.reply;
        } else {
            console.warn("AI Smart Replies: No reply generated.");
            alert("AI could not generate a reply based on context.");
        }
    } catch (error) {
        console.error("AI Smart Replies: Error generating context-aware reply", error);
        alert("An error occurred while generating the AI reply.");
    }
}

// Attach enhanced AI reply function to buttons
document.addEventListener("click", (event) => {
    if (event.target.matches("button[data-ai-reply]")) {
        let inputField = event.target.parentElement.querySelector("div[role='textbox'], textarea");
        if (inputField) {
            generateContextAwareReply(inputField);
        }
    }
});

// Observe DOM for dynamically loaded message inputs and buttons
const enhancedObserver = new MutationObserver(() => {
    injectReplyButtons();
    enhanceUIElements();
});

enhancedObserver.observe(document.body, { childList: true, subtree: true });

// Re-inject buttons and enhance UI on page load
injectReplyButtons();
enhanceUIElements();

/**
 * AI Smart Replies - Continued Enhancements
 * - Implements user preferences (tone selection, reply length)
 * - Caches AI responses for improved efficiency
 * - Enhances UI responsiveness and styling
 */

// User preferences stored in local storage
const defaultPreferences = {
    tone: "neutral", // Options: neutral, professional, casual, funny, empathetic
    replyLength: "medium", // Options: short, medium, long
    enableKeyboardShortcut: true, // Enables Ctrl+Enter trigger
};

// Load user preferences from local storage
async function getUserPreferences() {
    return new Promise((resolve) => {
        chrome.storage.sync.get("aiSmartRepliesPrefs", (data) => {
            resolve(data.aiSmartRepliesPrefs || defaultPreferences);
        });
    });
}

// Save user preferences
function saveUserPreferences(prefs) {
    chrome.storage.sync.set({ aiSmartRepliesPrefs: prefs });
}

/**
 * Caches AI-generated replies to reduce API calls
 * @param {string} message - The user input message
 * @param {string} reply - The generated AI reply
 */
function cacheReply(message, reply) {
    let cache = JSON.parse(localStorage.getItem("aiReplyCache")) || {};
    cache[message] = { reply, timestamp: Date.now() };
    localStorage.setItem("aiReplyCache", JSON.stringify(cache));
}

/**
 * Retrieves cached AI replies if available
 * @param {string} message - The user input message
 * @returns {string|null} Cached AI response or null
 */
function getCachedReply(message) {
    let cache = JSON.parse(localStorage.getItem("aiReplyCache")) || {};
    let cached = cache[message];
    if (cached && Date.now() - cached.timestamp < 60000) {
        return cached.reply; // Cache is valid for 60 seconds
    }
    return null;
}

/**
 * Generates an AI reply with user preferences applied
 * @param {HTMLElement} inputElement - The input field
 */
async function generatePersonalizedAIReply(inputElement) {
    if (!inputElement) return;
    let userMessage = inputElement.innerText || inputElement.value;
    if (!userMessage.trim()) {
        alert("Please type a message before generating a reply.");
        return;
    }

    let cachedReply = getCachedReply(userMessage);
    if (cachedReply) {
        inputElement.innerText = cachedReply;
        inputElement.value = cachedReply;
        return;
    }

    let userPrefs = await getUserPreferences();
    console.log("AI Smart Replies: Generating with preferences", userPrefs);

    try {
        let response = await fetch("https://your-backend-api.com/generate-reply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: userMessage,
                tone: userPrefs.tone,
                length: userPrefs.replyLength,
                site: window.location.hostname,
            }),
        });

        let data = await response.json();
        if (data.reply) {
            cacheReply(userMessage, data.reply);
            inputElement.innerText = data.reply;
            inputElement.value = data.reply;
        } else {
            alert("AI could not generate a response. Try again later.");
        }
    } catch (error) {
        console.error("AI Smart Replies: Error generating personalized reply", error);
        alert("An error occurred while generating the AI reply.");
    }
}

/**
 * UI Enhancements - Dropdown for selecting reply tone & length
 */
function injectUserPreferencesUI() {
    let existingMenu = document.querySelector("#aiReplySettingsMenu");
    if (existingMenu) return; // Avoid duplicate injection

    let settingsContainer = document.createElement("div");
    settingsContainer.id = "aiReplySettingsMenu";
    settingsContainer.style.cssText =
        "position: fixed; bottom: 20px; right: 20px; background: white; padding: 10px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); z-index: 10000; font-size: 14px;";

    let toneSelect = document.createElement("select");
    ["neutral", "professional", "casual", "funny", "empathetic"].forEach((tone) => {
        let option = document.createElement("option");
        option.value = tone;
        option.innerText = `Tone: ${tone.charAt(0).toUpperCase() + tone.slice(1)}`;
        toneSelect.appendChild(option);
    });

    let lengthSelect = document.createElement("select");
    ["short", "medium", "long"].forEach((length) => {
        let option = document.createElement("option");
        option.value = length;
        option.innerText = `Length: ${length.charAt(0).toUpperCase() + length.slice(1)}`;
        lengthSelect.appendChild(option);
    });

    let saveButton = document.createElement("button");
    saveButton.innerText = "Save";
    saveButton.style.cssText =
        "margin-left: 5px; background: #007bff; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;";
    saveButton.onclick = () => {
        let prefs = {
            tone: toneSelect.value,
            replyLength: lengthSelect.value,
        };
        saveUserPreferences(prefs);
        alert("Preferences saved!");
    };

    settingsContainer.appendChild(toneSelect);
    settingsContainer.appendChild(lengthSelect);
    settingsContainer.appendChild(saveButton);
    document.body.appendChild(settingsContainer);
}

// Inject user preferences UI after a delay to ensure page is loaded
setTimeout(injectUserPreferencesUI, 2000);

/**
 * Enables right-click AI reply generation
 */
document.addEventListener("contextmenu", (event) => {
    let target = event.target;
    if (target.matches("textarea, div[contenteditable='true']")) {
        event.preventDefault();
        let confirmAI = confirm("Generate AI reply for this message?");
        if (confirmAI) {
            generatePersonalizedAIReply(target);
        }
    }
});

// Finalize observer setup for dynamic elements
const finalObserver = new MutationObserver(() => {
    injectReplyButtons();
    injectUserPreferencesUI();
});

finalObserver.observe(document.body, { childList: true, subtree: true });

// Ensure all UI enhancements and caching mechanisms are in place
injectReplyButtons();
injectUserPreferencesUI();

/**
 * AI Smart Replies - Free vs. Pro User System
 * - Tracks usage for free users (10 replies/day)
 * - Unlocks unlimited replies for Pro users
 * - Displays upgrade prompt for non-Pro users
 */

// Default user data
const defaultUserData = {
    dailyRepliesUsed: 0,
    lastReset: Date.now(),
    isProUser: false,
};

// Load user data from storage
async function getUserData() {
    return new Promise((resolve) => {
        chrome.storage.sync.get("aiSmartRepliesUser", (data) => {
            resolve(data.aiSmartRepliesUser || defaultUserData);
        });
    });
}

// Save user data to storage
function saveUserData(userData) {
    chrome.storage.sync.set({ aiSmartRepliesUser: userData });
}

// Resets daily usage if a new day starts
async function resetDailyUsageIfNeeded() {
    let userData = await getUserData();
    let lastReset = new Date(userData.lastReset);
    let today = new Date();

    if (lastReset.getDate() !== today.getDate()) {
        userData.dailyRepliesUsed = 0;
        userData.lastReset = Date.now();
        saveUserData(userData);
    }
}

/**
 * Checks if the user is eligible to generate an AI reply
 * @returns {boolean} True if the user can generate a reply, false otherwise
 */
async function canGenerateReply() {
    let userData = await getUserData();
    await resetDailyUsageIfNeeded();

    if (userData.isProUser) {
        return true; // Pro users have unlimited access
    }

    if (userData.dailyRepliesUsed < 10) {
        userData.dailyRepliesUsed++;
        saveUserData(userData);
        return true;
    }

    showUpgradePrompt();
    return false;
}

/**
 * Displays an upgrade prompt when a free user exceeds the limit
 */
function showUpgradePrompt() {
    let upgradeBanner = document.createElement("div");
    upgradeBanner.id = "aiUpgradeBanner";
    upgradeBanner.style.cssText =
        "position: fixed; top: 20px; right: 20px; background: red; color: white; padding: 10px; border-radius: 5px; z-index: 10000; font-size: 14px;";

    upgradeBanner.innerHTML = `
        <p style="margin: 0;">🚀 Upgrade to AI Smart Replies Pro for Unlimited Replies!</p>
        <button id="upgradeButton" style="margin-top: 5px; background: white; color: red; padding: 5px 10px; border: none; cursor: pointer; border-radius: 4px;">Upgrade Now</button>
    `;

    document.body.appendChild(upgradeBanner);

    document.querySelector("#upgradeButton").onclick = () => {
        window.open("https://your-upgrade-url.com", "_blank");
    };

    setTimeout(() => {
        upgradeBanner.remove();
    }, 10000);
}

/**
 * Wrap AI reply generation with free/pro check
 */
async function generateAIReplyWithAccessCheck(inputElement) {
    if (!(await canGenerateReply())) return;
    generatePersonalizedAIReply(inputElement);
}

// Replace previous function calls with access check
document.addEventListener("click", (event) => {
    if (event.target.matches("button[data-ai-reply]")) {
        let inputField = event.target.parentElement.querySelector("div[role='textbox'], textarea");
        if (inputField) {
            generateAIReplyWithAccessCheck(inputField);
        }
    }
});

// Ensure daily usage resets when extension loads
resetDailyUsageIfNeeded();

/**
 * Stripe Integration - Handles Pro Subscription Payments
 * - Uses Stripe Checkout to upgrade users
 * - Redirects to a secure Stripe payment page
 * - Stores subscription status in Chrome Storage
 */

// Stripe Publishable Key (Test Mode)
const STRIPE_PUBLIC_KEY = "pk_test_51QxNhqCBh2MQglAzzrfn0K1hEMpJ0fCiKZ0WWBtjTL7YnRMUPlJNFhQbO5mnI9YJDA2oAZlZF7Rr10LVdOZ5Tdu300No40KRXA";

// Your backend server (to handle checkout session creation)
const BACKEND_URL = "https://your-backend.com"; // Replace with your actual backend URL

/**
 * Creates a Stripe checkout session and redirects the user
 */
async function redirectToStripeCheckout() {
    try {
        let response = await fetch(`${BACKEND_URL}/create-checkout-session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: "test-user-123" }) // Replace with actual user ID if needed
        });

        let data = await response.json();
        if (data.sessionId) {
            let stripe = Stripe(STRIPE_PUBLIC_KEY);
            stripe.redirectToCheckout({ sessionId: data.sessionId });
        } else {
            alert("Failed to start checkout. Please try again.");
        }
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        alert("An error occurred. Please try again.");
    }
}

/**
 * Injects an 'Upgrade to Pro' button in the UI
 */
function injectUpgradeButton() {
    let existingButton = document.querySelector("#aiUpgradeToPro");
    if (existingButton) return; // Prevent duplicates

    let upgradeButton = document.createElement("button");
    upgradeButton.id = "aiUpgradeToPro";
    upgradeButton.innerText = "🚀 Upgrade to Pro";
    upgradeButton.style.cssText =
        "position: fixed; top: 20px; right: 20px; background: #ff6600; color: white; padding: 10px; border-radius: 5px; z-index: 10000; cursor: pointer;";

    upgradeButton.onclick = redirectToStripeCheckout;
    document.body.appendChild(upgradeButton);
}

// Show upgrade button for free users
(async () => {
    let userData = await getUserData();
    if (!userData.isProUser) {
        injectUpgradeButton();
    }
})();

