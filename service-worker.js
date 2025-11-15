const FITBIT_TOKEN_KEY = "fitbitAccessToken";

const FITBIT_AUTH_URL = 'https://www.fitbit.com/oauth2/authorize';
const SCOPES = "activity heartrate";

const CLIENT_ID = "23TQ8L";
const REDIRECT_URL = chrome.identity.getRedirectURL();


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "connectFitbit") {
        connectToFitbit()
            .then(result => sendResponse(result))
            .catch(error => sendResponse({success: false, error: error.message }));
        return true;
    }

    if (request.action === "logout") {
        chrome.storage.local.remove(FITBIT_TOKEN_KEY, () => {
            console.log("Fitbit access token cleared");
            sendResponse({ success: true, message: "Logged out successfully."})
        })
        return true;
    }
})

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
        chrome.storage.local.get([FITBIT_TOKEN_KEY], (data) => {
            const isAuthenticated = data[FITBIT_TOKEN_KEY];

            sendResponse({
                isAuthenticated: isAuthenticated,
                message: isAuthenticated ? "Connected to Fitbit." : "Please connect to Fitbit"
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

})