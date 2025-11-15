const FITBIT_AUTH_URL = 'https://www.fitbit.com/oauth2/authorize';
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';
const FITBIT_API_URL = 'https://api.fitbit.com/1/user/-';

const CLIENT_ID = "23TQ8L";
const CLIENT_SECRET = "3778ecfc1a304ff9f8fabf4293647373";
const REDIRECT_URL = chrome.identity.redirect


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "connectFitbit") {
        console.log("service-worker sees connect button clicked")
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
            response_type: "code",
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
            console.error("Fitbit Auth Failed");
            sendResponse({ success: false, message: "Authentication failed." })
        }



    } catch(error) {
        console.error(error)
    }
}