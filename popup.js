document.addEventListener("DOMContentLoaded", async function () {
    let toneSelect = document.getElementById("toneSelect");
    let lengthSelect = document.getElementById("lengthSelect");
    let saveButton = document.getElementById("saveSettings");

    // Load saved preferences
    chrome.storage.local.get("aiSmartRepliesPrefs", (data) => {
        let prefs = data.aiSmartRepliesPrefs || { tone: "neutral", replyLength: "medium" };
        toneSelect.value = prefs.tone;
        lengthSelect.value = prefs.replyLength;
    });

    // Save preferences
    saveButton.onclick = function () {
        let prefs = {
            tone: toneSelect.value,
            replyLength: lengthSelect.value
        };
        chrome.storage.local.set({ aiSmartRepliesPrefs: prefs }, () => {
            alert("Settings saved!");
        });
    };
});
