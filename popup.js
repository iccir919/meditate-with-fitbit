
const FITBIT_TOKEN_KEY = "fitbitAccessToken";

// UI Elements
const signIn = document.getElementById("sign-in");
const connectBtn = document.getElementById("connectBtn");
const logoutBtn = document.getElementById("logoutBtn");
const dashboard = document.getElementById("dashboard");

// Session Elements
const statusDiv = document.getElementById("status");


// --- UI State Management ---

async function checkFitbitConnection() {
    const response = await chrome.runtime.sendMessage({ action: "checkState" });

    const isAuthenticated = response.isAuthenticated;

    statusDiv.textContent = response.message;

    if (isAuthenticated) {
        signIn.style.display = "none";
        dashboard.style.display = "flex";
    } else {
        dashboard.style.display = "none";
        signIn.style.display = "flex";
    }
}

// --- Event Handlers ---
connectBtn.addEventListener("click", () => {
    statusDiv.textContent = "Initiating Fitbit connection...";
    chrome.runtime.sendMessage({ action: "connectFitbit"}, response => {
        if (response && response.success) {
            checkFitbitConnection();
        } else if (response) {
            statusDiv.textContent = response.message || "Connection failed."
        }
    })
})

logoutBtn.addEventListener("click", () => {
    statusDiv.textContent = "Logging out...";
    chrome.runtime.sendMessage({ action: "logout"}, response => {
        if (response && response.success) {
            checkFitbitConnection();
        }
    })
})


checkFitbitConnection()