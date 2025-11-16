
const FITBIT_TOKEN_KEY = "fitbitAccessToken";

// UI Elements
const signIn = document.getElementById("sign-in");
const connectBtn = document.getElementById("connect-btn");
const logoutBtn = document.getElementById("logout-btn");
const dashboard = document.getElementById("dashboard");
const statusDiv = document.getElementById("status");

// Session Elements
const startBtn = document.getElementById("start-btn");
const endBtn = document.getElementById("end-btn");

// --- UI State Management ---

async function checkFitbitConnection() {
    const response = await chrome.runtime.sendMessage({ action: "checkState" });

    const isAuthenticated = response.isAuthenticated;
    const isSessionActive = response.isSessionActive;
    statusDiv.textContent = response.message;

    if (isAuthenticated) {
        signIn.style.display = "none";
        dashboard.style.display = "flex";

        if (startBtn && endBtn) {
            startBtn.disabled = isSessionActive;
            endBtn.disabled = !isSessionActive;
        }
    } else {
        dashboard.style.display = "none";
        signIn.style.display = "flex";
    }
}

// --- Event Handlers ---

// 1. Connect Button (sends message to service worker to start auth flow)
connectBtn.addEventListener("click", () => {
    statusDiv.textContent = "Initiating Fitbit connection...";
    chrome.runtime.sendMessage({ action: "connectFitbit"}, response => {
        if (response && response.success) {
            checkFitbitConnection();
        } else if (response) {
            statusDiv.textContent = response.message || "Connection failed."
        }
    });
});


// 2. Logout Button (sends message to service worker to clear token)
logoutBtn.addEventListener("click", () => {
    statusDiv.textContent = "Logging out...";
    chrome.runtime.sendMessage({ action: "logout"}, response => {
        if (response && response.success) {
            checkFitbitConnection();
        }
    });
});

// 3. Start Session
startBtn.addEventListener("click", () => {
    statusDiv.textContent = "Session started. Keep meditating...";
    chrome.runtime.sendMessage({ action: "startSession" }, () => {
        checkFitbitConnection();
    });
});

// 4. End Session
endBtn.addEventListener("click", () => {
    statusDiv.textContent = "Ending session, logging activity to Fitbit...";
    chrome.runtime.sendMessage({ action: "endSession" }, response => {
        if (response && response.success) {
            statusDiv.textContent = "Session logged successfully!" 
        } else {
            statusDiv.textContent = response.message || "Logging failed. Check console."
        }
        checkFitbitConnection();
    });
})

checkFitbitConnection()