/**
 * AI Smart Replies - Content Script
 * - Handles AI-generated replies
 * - Manages Pro vs Free users
 * - Injects UI elements dynamically
 */

// ✅ Define backend URL for API requests
const BACKEND_URL = "https://stripe-backend.onrender.com"; // Ensure this is correct

// ✅ Free user settings (limit to 10 replies/day)
const FREE_USER_LIMIT = 10;

// ✅ Default user settings
const defaultUserData = {
    dailyRepliesUsed: 0,
    lastReset: Date.now(),
    isProUser: false
};

// ✅ Retrieve user data from Chrome Storage
async function getUserData() {
    return new Promise((resolve) => {
        chrome.storage.local.get("aiSmartRepliesUser", (data) => {
            resolve(data.aiSmartRepliesUser || defaultUserData);
        });
    });
}

// ✅ Save user data
function saveUserData(userData) {
    chrome.storage.local.set({ aiSmartRepliesUser: userData });
}

// ✅ Reset daily usage if it's a new day
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

// ✅ Check if the user is allowed to generate an AI reply
async function canGenerateReply() {
    let userData = await getUserData();
    await resetDailyUsageIfNeeded();

    if (userData.isProUser) return true; // Pro users have unlimited access

    if (userData.dailyRepliesUsed < FREE_USER_LIMIT) {
        userData.dailyRepliesUsed++;
        saveUserData(userData);
        return true;
    }

    showUpgradePrompt(); // Show Pro upgrade UI
    return false;
}

/**
 * 🚀 Inject AI Reply Buttons into supported websites
 * - Prevents duplicate button injections
 */
function injectReplyButtons() {
    let supportedSites = {
        "mail.google.com": "div[aria-label='Message Body']", // Gmail
        "www.linkedin.com": "div.msg-form__contenteditable", // LinkedIn Messages
        "twitter.com": "div[data-testid='tweetTextarea_0']", // Twitter Tweets
        "www.facebook.com": "div[role='textbox']", // Facebook Comments & Messenger
        "www.reddit.com": "textarea", // Reddit Comments
        "www.youtube.com": "yt-formatted-string[contenteditable='true']" // YouTube Comments
    };

    let siteKey = Object.keys(supportedSites).find((key) => window.location.hostname.includes(key));
    if (!siteKey) return;

    let inputSelector = supportedSites[siteKey];
    let inputElements = document.querySelectorAll(inputSelector);

    inputElements.forEach((inputElement) => {
        if (!inputElement || inputElement.dataset.aiReplyInjected) return;

        // ✅ Create AI Reply button
        let replyButton = document.createElement("button");
        replyButton.innerText = "✨ AI Reply";
        replyButton.className = "ai-reply-btn";
        replyButton.style.cssText = `
            margin-left: 8px;
            background: #4CAF50;
            color: white;
            border: none;
            padding: 5px 10px;
            cursor: pointer;
            border-radius: 4px;
        `;
        replyButton.onclick = () => generateAIReplyWithAccessCheck(inputElement);

        // ✅ Inject button and prevent duplicates
        let parent = inputElement.parentElement;
        if (parent) parent.appendChild(replyButton);
        inputElement.dataset.aiReplyInjected = "true";
    });
}

/**
 * 🚀 Floating UI for Pro Feature Access
 * - Displays upgrade button for free users
 */
function showUpgradePrompt() {
    let existingBanner = document.querySelector("#aiUpgradeBanner");
    if (existingBanner) return; // Prevent duplicates

    let upgradeBanner = document.createElement("div");
    upgradeBanner.id = "aiUpgradeBanner";
    upgradeBanner.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: red;
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 10000;
        font-size: 14px;
    `;
    upgradeBanner.innerHTML = `
        <p style="margin: 0;">🚀 Upgrade to AI Smart Replies Pro for Unlimited Replies!</p>
        <button id="upgradeButton" style="
            margin-top: 5px;
            background: white;
            color: red;
            padding: 5px 10px;
            border: none;
            cursor: pointer;
            border-radius: 4px;">
            Upgrade Now
        </button>
    `;

    document.body.appendChild(upgradeBanner);

    document.querySelector("#upgradeButton").onclick = redirectToStripeCheckout;
    
    setTimeout(() => {
        upgradeBanner.remove();
    }, 10000);
}

// ✅ MutationObserver for Dynamic Elements (Ensures Buttons Appear on Load)
const observer = new MutationObserver(() => {
    injectReplyButtons();
});
observer.observe(document.body, { childList: true, subtree: true });

// ✅ Initial injection on script load
injectReplyButtons();

/**
 * 🚀 AI Reply Generation - Calls Backend API and Injects AI Replies
 */

// ✅ Default user preferences
const defaultPreferences = {
    tone: "neutral", // Options: neutral, professional, casual, funny, empathetic
    replyLength: "medium", // Options: short, medium, long
    enableKeyboardShortcut: true, // Enables Ctrl+Enter trigger
};

// ✅ Retrieve user preferences from Chrome Storage
async function getUserPreferences() {
    return new Promise((resolve) => {
        chrome.storage.local.get("aiSmartRepliesPrefs", (data) => {
            resolve(data.aiSmartRepliesPrefs || defaultPreferences);
        });
    });
}

// ✅ Save user preferences
function saveUserPreferences(prefs) {
    chrome.storage.local.set({ aiSmartRepliesPrefs: prefs });
}

// ✅ Generate AI reply with access check (Free vs. Pro)
async function generateAIReplyWithAccessCheck(inputElement) {
    if (!(await canGenerateReply())) return;
    generateAIReply(inputElement);
}

/**
 * 🚀 Generates an AI-powered reply suggestion
 * @param {HTMLElement} inputElement - The input field where AI reply will be inserted
 */
async function generateAIReply(inputElement) {
    if (!inputElement) return;

    let userMessage = inputElement.innerText || inputElement.value;
    if (!userMessage.trim()) {
        showNotification("Please type a message before generating a reply.");
        return;
    }

    let cachedReply = getCachedReply(userMessage);
    if (cachedReply) {
        insertAIReply(inputElement, cachedReply);
        return;
    }

    let userPrefs = await getUserPreferences();
    console.log("🚀 AI Smart Replies: Generating with preferences", userPrefs);

    try {
        toggleButtonLoading(inputElement, true);

        let response = await fetch(`${BACKEND_URL}/generate-reply`, {
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
            insertAIReply(inputElement, data.reply);
        } else {
            showNotification("AI could not generate a reply. Try again later.");
        }
    } catch (error) {
        console.error("🚀 AI Smart Replies: Error generating reply", error);
        showNotification("An error occurred while generating the AI reply.");
    } finally {
        toggleButtonLoading(inputElement, false);
    }
}

/**
 * 🚀 Inserts AI-generated reply into the message input field
 * @param {HTMLElement} inputElement - The message input field
 * @param {string} aiReply - The AI-generated reply
 */
function insertAIReply(inputElement, aiReply) {
    inputElement.innerText = aiReply;
    inputElement.value = aiReply;
}

/**
 * 🚀 Adds a loading animation to the AI Reply button while fetching a response
 * @param {HTMLElement} inputElement - The input field associated with the AI button
 * @param {boolean} isLoading - True to show loading, false to restore
 */
function toggleButtonLoading(inputElement, isLoading) {
    let replyButton = inputElement.parentElement?.querySelector(".ai-reply-btn");
    if (!replyButton) return;
    replyButton.innerText = isLoading ? "⏳ Generating..." : "✨ AI Reply";
    replyButton.disabled = isLoading;
    replyButton.style.opacity = isLoading ? "0.6" : "1";
}

/**
 * 🚀 Caches AI-generated replies to reduce API calls
 * @param {string} message - The user input message
 * @param {string} reply - The generated AI reply
 */
function cacheReply(message, reply) {
    let cache = JSON.parse(localStorage.getItem("aiReplyCache")) || {};
    cache[message] = { reply, timestamp: Date.now() };
    localStorage.setItem("aiReplyCache", JSON.stringify(cache));
}

/**
 * 🚀 Retrieves cached AI replies if available
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
 * 🚀 Enables keyboard shortcut (Ctrl + Enter) for generating AI replies
 */
document.addEventListener("keydown", async (event) => {
    if (event.ctrlKey && event.key === "Enter") {
        let activeInput = document.activeElement;
        if (activeInput && activeInput.dataset.aiReplyInjected) {
            generateAIReplyWithAccessCheck(activeInput);
        }
    }
});

/**
 * 🚀 Non-intrusive UI notification for errors & messages
 * @param {string} message - The message to display
 */
function showNotification(message) {
    let notification = document.createElement("div");
    notification.innerText = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: #fff;
        padding: 10px;
        border-radius: 5px;
        z-index: 10000;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

/**
 * 🚀 Stripe Pro System - Handles Subscription Checkout & Pro Status
 */

// ✅ Redirects the user to Stripe checkout session
async function redirectToStripeCheckout() {
    try {
        let response = await fetch(`${BACKEND_URL}/create-checkout-session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: "guest" }) // User ID handling can be improved later
        });

        let data = await response.json();
        if (data.sessionId) {
            let stripe = Stripe("pk_test_51QxNhqCBh2MQglAzzrfn0K1hEMpJ0fCiKZ0WWBtjTL7YnRMUPlJNFhQbO5mnI9YJDA2oAZlZF7Rr10LVdOZ5Tdu300No40KRXA");
            stripe.redirectToCheckout({ sessionId: data.sessionId });
        } else {
            showNotification("Failed to start checkout. Please try again.");
        }
    } catch (error) {
        console.error("🚀 Stripe Checkout Error:", error);
        showNotification("An error occurred. Please try again.");
    }
}

// ✅ Checks Pro status from Chrome Storage
async function isUserPro() {
    let userData = await getUserData();
    return userData.isProUser;
}

// ✅ Sets user as Pro after successful payment (for now, manually triggered)
async function setUserAsPro() {
    let userData = await getUserData();
    userData.isProUser = true;
    saveUserData(userData);
    showNotification("🎉 You are now an AI Smart Replies Pro user!");
    updateUIForProUser();
}

// ✅ Updates UI elements for Pro users
async function updateUIForProUser() {
    let isPro = await isUserPro();
    let upgradeButton = document.querySelector("#aiUpgradeToPro");
    if (upgradeButton) {
        upgradeButton.style.display = isPro ? "none" : "block";
    }
}

// ✅ Injects floating UI panel for Pro feature management
function injectFloatingUI() {
    let existingPanel = document.querySelector("#aiFloatingPanel");
    if (existingPanel) return;

    let panel = document.createElement("div");
    panel.id = "aiFloatingPanel";
    panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: #222;
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 10000;
        font-size: 14px;
        width: 220px;
    `;

    panel.innerHTML = `
        <p style="margin: 0; font-weight: bold;">✨ AI Smart Replies</p>
        <p id="aiProStatus" style="margin: 5px 0;">Checking Pro status...</p>
        <button id="aiUpgradeToPro" style="
            margin-top: 5px;
            background: #ff6600;
            color: white;
            padding: 5px 10px;
            border: none;
            cursor: pointer;
            border-radius: 4px;">
            Upgrade to Pro
        </button>
    `;

    document.body.appendChild(panel);

    document.querySelector("#aiUpgradeToPro").onclick = redirectToStripeCheckout;

    // Update Pro status in the UI
    isUserPro().then((isPro) => {
        document.querySelector("#aiProStatus").innerText = isPro ? "✅ Pro User" : "🔓 Free User";
        document.querySelector("#aiUpgradeToPro").style.display = isPro ? "none" : "block";
    });
}

// ✅ Run floating UI panel injection on page load
injectFloatingUI();

/**
 * 🚀 AI Smart Replies - Final Enhancements & Performance Fixes
 */

// ✅ Advanced AI Settings UI
function injectAdvancedSettingsUI() {
    let existingSettings = document.querySelector("#aiSettingsPanel");
    if (existingSettings) return;

    let settingsPanel = document.createElement("div");
    settingsPanel.id = "aiSettingsPanel";
    settingsPanel.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 20px;
        background: #333;
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 10000;
        font-size: 14px;
        width: 220px;
    `;

    settingsPanel.innerHTML = `
        <p style="margin: 0; font-weight: bold;">⚙️ AI Settings</p>
        <label style="display:block; margin-top: 5px;">Tone:</label>
        <select id="aiToneSelect">
            <option value="neutral">Neutral</option>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="funny">Funny</option>
            <option value="empathetic">Empathetic</option>
        </select>

        <label style="display:block; margin-top: 5px;">Reply Length:</label>
        <select id="aiLengthSelect">
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
        </select>

        <button id="saveAISettings" style="
            margin-top: 8px;
            background: #4CAF50;
            color: white;
            padding: 5px 10px;
            border: none;
            cursor: pointer;
            border-radius: 4px;">
            Save Settings
        </button>
    `;

    document.body.appendChild(settingsPanel);

    // Load saved preferences
    getUserPreferences().then((prefs) => {
        document.querySelector("#aiToneSelect").value = prefs.tone;
        document.querySelector("#aiLengthSelect").value = prefs.replyLength;
    });

    // Save preferences
    document.querySelector("#saveAISettings").onclick = () => {
        let newPrefs = {
            tone: document.querySelector("#aiToneSelect").value,
            replyLength: document.querySelector("#aiLengthSelect").value
        };
        saveUserPreferences(newPrefs);
        showNotification("✅ AI settings saved!");
    };
}

// ✅ Ensure Pro Status Persists & Updates UI
async function ensureProStatusPersists() {
    let userData = await getUserData();
    let isPro = userData.isProUser;
    
    if (isPro) {
        document.querySelector("#aiProStatus").innerText = "✅ Pro User";
        let upgradeButton = document.querySelector("#aiUpgradeToPro");
        if (upgradeButton) upgradeButton.style.display = "none";
    }
}

// ✅ Reset usage if it's a new day (Run on Extension Load)
resetDailyUsageIfNeeded().then(() => {
    ensureProStatusPersists();
});

// ✅ Inject AI Settings & Floating UI on Load
setTimeout(() => {
    injectFloatingUI();
    injectAdvancedSettingsUI();
}, 1000);
