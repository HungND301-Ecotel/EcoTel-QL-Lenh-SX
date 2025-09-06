// sendNotification.js
const admin = require("../config/firebase");

async function sendPushNotification(token, title, body) {
    const message = {
        token: token, // device token nhận từ mobile app
        notification: {
            title: title,
            body: body,
        },
    };

    try {
        const response = await admin.messaging().send(message);
        console.log("✅ Successfully sent:", response);
    } catch (error) {
        console.error("❌ Error sending:", error);
    }
}

module.exports = sendPushNotification;
