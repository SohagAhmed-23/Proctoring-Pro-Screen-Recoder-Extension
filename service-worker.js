let popupWindowId = null;
let checkIntervalId = null; // To store the ID of the interval

// Listen for when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes("/mod/quiz/view.php")) {
    const popupWidth = 650;
    const popupHeight = 500;

    // If the popup window exists and is still open, focus it; otherwise, open a new one
    if (popupWindowId !== null) {
      chrome.windows.get(popupWindowId, (popupWindow) => {
        if (chrome.runtime.lastError || !popupWindow) {
          // The popup window is closed, so we'll create a new one
          openPopupWindow(tab, popupWidth, popupHeight);
        } else {
          // The popup window is still open, focus on it
          chrome.windows.update(popupWindowId, { focused: true });
        }
      });
    } else {
      // No popup window exists, so we'll create a new one
      openPopupWindow(tab, popupWidth, popupHeight);
    }
  } else {
    // Notify the user that this extension is intended for the quiz module
    createNotification(
      "This extension is only intended for use with the quiz module. The popup will not open."
    );
    return;
  }
});

// Function to open the popup window
function openPopupWindow(tab, popupWidth, popupHeight) {
  chrome.windows.getCurrent({ populate: true }, function (currentWindow) {
    if (!currentWindow) return;
    const left = currentWindow.left + currentWindow.width - popupWidth;
    const top = currentWindow.top;

    chrome.windows.create(
      {
        url: chrome.runtime.getURL("popup/popup_window.html"),
        type: "popup",
        top: top,
        left: left,
        width: popupWidth,
        height: popupHeight,
      },
      (popupWindow) => {
        popupWindowId = popupWindow.id;
        startCheckingPopupWindowStatus(); // Start checking the popup window status
      }
    );
  });
}

// Function to start checking the popup window status
function startCheckingPopupWindowStatus() {
  checkIntervalId = setInterval(() => {
    if (popupWindowId !== null) {
      chrome.windows.get(popupWindowId, (popupWindow) => {
        if (chrome.runtime.lastError || !popupWindow) {
          console.log("Popup window is closed");
          popupWindowId = null; // Reset popupWindowId
          sendPopupStatusToContent(false);
          stopCheckingPopupWindowStatus(); // Stop checking if the popup is closed
        } else {
          console.log("Popup window is open");
          sendPopupStatusToContent(true);
        }
      });
    } else {
      sendPopupStatusToContent(false);
    }
  }, 1000); // Check every 1 seconds
}

// Function to stop checking the popup window status
function stopCheckingPopupWindowStatus() {
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
  }
}

// Function to send popup status to content script
function sendPopupStatusToContent(isWindowOpen) {
  chrome.tabs.query({}, (tabs) => {
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].url.includes("/mod/quiz/")) {
        chrome.tabs.sendMessage(tabs[i].id, { action: "windowStatus", isWindowOpen: isWindowOpen });
      }
    }
  });
}

// Listener for when any window is closed
chrome.windows.onRemoved.addListener((windowId) => {
  if (popupWindowId === windowId) {
    popupWindowId = null; // Reset popupWindowId when the popup is closed
    stopCheckingPopupWindowStatus(); // Stop checking when popup is closed
  }
  console.log(`Window with ID ${windowId} has been closed.`);
});

// Listener for incoming messages to execute specific functions
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "executeFunction") {
    if (message.functionName === "createNotification") {
      createNotification(message.args);
    }
  }
});

// Optional function to get the current tab's URL (if needed elsewhere)
function getActiveTabUrl(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let currentTab = tabs[0];
    callback(currentTab.url);
  });
}
