const FITBIT_TOKEN_KEY = "fitbitAccessToken";
const START_TIME_KEY = "meditationStartTime";

const FITBIT_AUTH_URL = 'https://www.fitbit.com/oauth2/authorize';
const SCOPES = "activity heartrate";

const CLIENT_ID = "23TQ8L";
const REDIRECT_URL = chrome.identity.getRedirectURL();

// --- API Function: Log Activity ---
async function logActivity(accessToken, startTime, durationMinutes) {
    console.log("End")
    return {}
}


// --- Service Worker API Call: Authorization ---

async function connectToFitbit() {
    try {
        const authURL = `${FITBIT_AUTH_URL}?` + new URLSearchParams({
            response_type: "token",
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URL,
            scope: SCOPES,
            expires_in: "31536000" // 1 year
        });

        const redirectUrl = await chrome.identity.launchWebAuthFlow({
            url: authURL,
            interactive: true
        });

        // After redirect back to extension, extract authorization code
        if (!redirectUrl) {
            throw new Error("Fitbit authentication failed")
        }

        // Parse access token from the URL fragment
        const fragment = redirectUrl.split("#")[1];
        const params = new URLSearchParams(fragment);
        const accessToken = params.get("access_token");

        if (accessToken) {
            await chrome.storage.local.set({[FITBIT_TOKEN_KEY]: accessToken});
            console.log("Fitbit access token saved.");
            return { success: true, message: "Connected to Fitbit" }
        } else {
            throw new Error("Token not found in redirect URL.")
        }
    } catch(error) {
        console.error("Error with Fitbit authentication:", error);
        return { success: false, message: error.message || "Authentication failed" }
    }
}

// --- Message Listener (Router) ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // 1. STATE CHECK
    if (request.action === "checkState") {
        chrome.storage.local.get([FITBIT_TOKEN_KEY, START_TIME_KEY], (data) => {
            const isAuthenticated = data[FITBIT_TOKEN_KEY] !== undefined;
            const isSessionActive = data[START_TIME_KEY] !== undefined;
            sendResponse({
                isAuthenticated: isAuthenticated,
                isSessionActive: isSessionActive,
                message: isAuthenticated ? (isSessionActive ? "Session in progress..." : "Connected. Ready to start.") : "Please connect to Fitbit."
            })
        });
        return true;
    }

    // 2. CONNECT/AUTHORIZE
    if (request.action === "connectFitbit") {
        connectToFitbit()
            .then(result => sendResponse(result))
            .catch(error => sendResponse({success: false, message: error.message }));
        return true;
    }


    // 3. LOGOUT
    if (request.action === "logout") {
        chrome.storage.local.remove([FITBIT_TOKEN_KEY], () => {
            console.log("Fitbit access token cleared");
            sendResponse({ success: true, message: "Logged out successfully." })
        });
        return true;
    }

    // 4. START SESSION
    if (request.action === "startSession") {
        const startTime = Date.now();
        chrome.storage.local.set({ [START_TIME_KEY]: startTime }, () => {
            console.log(`Meditation started at: ${startTime}`);
            sendResponse({});
        });
        return true;
    }

    // 5. END SESSION
    if (request.action === "endSession") {
        chrome.storage.local.get([START_TIME_KEY, FITBIT_TOKEN_KEY], async data => {
            const sessionStartTime = data[START_TIME_KEY];
            const accessToken = data[FITBIT_TOKEN_KEY];
            const endTime = Date.now();

            if (sessionStartTime && accessToken) {
                const durationMillis = endTime - sessionStartTime;
                const durationMinutes = Math.max(1, Math.round(durationMillis / 60000));

                const logResult = await logActivity(accessToken, sessionStartTime, durationMinutes);

                // Clear the session state
                chrome.storage.local.remove(START_TIME_KEY, () => {
                    sendResponse(logResult)
                });
            }
        });
    }

})