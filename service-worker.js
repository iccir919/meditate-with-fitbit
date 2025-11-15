const FITBIT_AUTH_URL = 'https://www.fitbit.com/oauth2/authorize';
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';
const FITBIT_API_URL = 'https://api.fitbit.com/1/user/-';

const CLIENT_ID = "23TQ8L";
const CLIENT_SECRET = "3778ecfc1a304ff9f8fabf4293647373";
const REDIRECT_URL = chrome.identity.redirect
const FITBIT_TOKEN_KEY = "fitbitAccessToken";


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "connectFitbit") {
        connectToFitbit()
            .then(result => sendResponse(result))
            .catch(error => sendResponse({success: false, error: error.message }));
        return true;
    }

})

async function connectToFitbit() {
    try {
        const redirectURL = chrome.identity.getRedirectURL();
        const authURL = `${FITBIT_AUTH_URL}?` + new URLSearchParams({
            response_type: "token",
            client_id: CLIENT_ID,
            redirect_uri: redirectURL,
            scope: "activity heartrate",
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
            chrome.storage.local.set({[FITBIT_TOKEN_KEY]: accessToken}, () => {
                console.log("Fitbit access token saved.");
                return { succcess: true, message: "Connected to Fitbit!" };
            })
        } else {
            throw new Error("Token not found in redirect URL.")
        }
    } catch(error) {
        console.error("Error with Fitbit authentication:", error);
        return { success: false, message: error}
    }
}