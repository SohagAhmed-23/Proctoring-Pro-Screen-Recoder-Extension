// This is the service worker script, which executes in its own context
// when the extension is installed or refreshed (or when you access its console).
// It would correspond to the background script in chrome extensions v2.

// Import the notification utilities
importScripts("js/notificationUtils.js");

let popupWindowId = null;

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
        // If you need to execute any content script, do it here
        // chrome.scripting.executeScript({...});
      }
    );
  });
}

// Listener for when any window is created and send the windowid to the local
chrome.windows.onCreated.addListener((window) => {
  console.log(`Window with ID ${window.id} has been created.`);
  chrome.tabs.query({  }, (tabs) => {
    let targetTabId = null;
     for(let i = 0;i < tabs.length;i++) {
      if(tabs[i].url.includes("/mod/quiz/view.php")) {
        //console.log("found it",tabs[i].url);
        targetTabId = tabs[i]
        break;
      }
     }
     if(targetTabId) {
       console.log(targetTabId,targetTabId.url); 
      chrome.tabs.sendMessage(targetTabId.id, { windowID : window.id});
     }
  });
});

// Listener for when any window is closed
chrome.windows.onRemoved.addListener((windowId) => {
  if (popupWindowId === windowId) {
    popupWindowId = null; // Reset popupWindowId when the popup is closed
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
