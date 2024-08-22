// notificationUtils.js
function createNotification(message) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "logo/logo-128.png", // Your extension's icon
      title: "Notification",
      message: message,
    });
  }
  