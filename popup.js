
const signIn = document.getElementById("sign-in");
const dashboard = document.getElementById("dashboard")

async function checkFitbitConnection() {
    const result = await chrome.storage.local.get(["fitbitToken"]);

    if(result.fitbitToken) {
        signIn.style.display = "none";
    } else {
        dashboard.style.display = "none";
    }
}

checkFitbitConnection()