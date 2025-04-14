// testNotify.js
const sendNotification = require("./notify");

const token = "DEVICE_FCM_TOKEN_HERE";
sendNotification(token, "Thông báo từ server", "Xin chào từ Firebase!");
