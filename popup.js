
const FITBIT_TOKEN_KEY = "fitbitAccessToken";
const signIn = document.getElementById("sign-in");
const connectBtn = document.getElementById("connect-btn");
const dashboard = document.getElementById("dashboard")

async function checkFitbitConnection() {
    const result = await chrome.storage.local.get([FITBIT_TOKEN_KEY]);
    if(result.fitbitAccessToken) {
        signIn.style.display = "none";
    } else {
        dashboard.style.display = "none";
    }
}

async function connectToFitbit() {
    console.log("connect button clicked!")
    const response = await chrome.runtime.sendMessage({ action: 'connectFitbit' });
}

connectBtn.addEventListener("click", connectToFitbit);

checkFitbitConnection()