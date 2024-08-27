let mediaRecorder;
let recordedChunks = [];
let stream;
const screenAllowed = 2; // Max allowed screens

document.addEventListener("DOMContentLoaded", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    if (currentTab.url.includes("mod/quiz/review.php")) {
      alert("You are not allowed to access this URL using the extension.");
      chrome.runtime.sendMessage({
        action: "executeFunction",
        functionName: "createNotification",
        args: "Thank you for Quiz Participation !!!",
      });
      window.close(); // Close the popup
    }
  });

  // Event listener for screen sharing
  document.getElementById("shareScreen").addEventListener("click", function () {
    chrome.system.display.getInfo(function (displays) {
      if (displays.length > screenAllowed) {
        chrome.runtime.sendMessage({
          action: "executeFunction",
          functionName: "createNotification",
          args: "Please use only one screen!",
        });
      } else {
        shareScreen();
      }
    });
  });

  // Monitor the number of screens at regular intervals
  const checkInterval = setInterval(function () {
    chrome.system.display.getInfo(function (displays) {
      if (displays.length > screenAllowed) {
        clearInterval(checkInterval);

        chrome.runtime.sendMessage({
          action: "executeFunction",
          functionName: "createNotification",
          args: "Please use only one screen!",
        });

        setTimeout(function () {
          window.close(); // Close the popup
          chrome.runtime.reload(); // Disable the extension
        }, 2000); // 2 seconds delay
      }
    });
  }, 1000); // Check every second

  // Automatically save recording when the popup window is closed
  window.addEventListener('beforeunload', function (event) {
    console.log("Popup window is closing");
    stopRecordingAndSave();
  });

  // Check screen sharing status every second and update the UI
  setInterval(() => {
    updateScreenSharingStatus();
  }, 1000);
});

// Function to initiate screen sharing
function shareScreen() {
  chrome.desktopCapture.chooseDesktopMedia(["screen"], onAccessApproved);
}

// Callback function after screen sharing approval
function onAccessApproved(desktopMediaRequestId) {
  if (!desktopMediaRequestId) {
    chrome.runtime.sendMessage({
      action: "executeFunction",
      functionName: "createNotification",
      args: "Screen Sharing rejected!",
    });
    console.log("Desktop Capture access rejected.");
    return;
  }

  const shareScreenButton = document.getElementById("shareScreen");
  shareScreenButton.style.display = "none";

  navigator.mediaDevices.getUserMedia({
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: desktopMediaRequestId
      }
    }
  }).then((capturedStream) => {
    console.log("Stream is on");

    stream = capturedStream;
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function(event) {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = function() {
     // shareScreenButton.style.display = "block";
      saveRecording();
      resetRecordingState(); // Reset state after recording stops
    };

    mediaRecorder.start();
  }).catch((err) => {
    console.error('Error capturing screen:', err);
  });
}

// Function to check if screen sharing is active
function isScreenSharingActive() {
  const isActive = stream && stream.getVideoTracks().some(track => track.readyState === 'live');
  return isActive;
}

// Function to update the screen sharing status in the popup UI
function updateScreenSharingStatus() {
  const statusElement = document.getElementById("screenSharingStatus");
  const isActive = isScreenSharingActive();
  
  if (isActive) {
    statusElement.textContent = "Screen sharing is active";
  } else {
    statusElement.textContent = "Screen sharing is not active";
  }
  
  chrome.tabs.query({}, (tabs) => {
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].url.includes("/mod/quiz/")) {
        chrome.tabs.sendMessage(tabs[i].id, { action: "isScreenSharingActive", isActive: isActive });
      }
    }
  });
  
}

// Function to stop recording and save the file
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  chrome.storage.local.set({ isRecording: false });

  resetRecordingState(); // Ensure state is reset after stopping recording
}

function stopRecordingAndSave() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop(); // This will trigger mediaRecorder.onstop and save the recording
  } else {
    saveRecording(); // Ensure the recording is saved even if it's already stopped
  }
}

function saveRecording() {
  if (recordedChunks.length > 0) {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({
      url: url,
      filename: 'screen-recording.webm',
      saveAs: true
    }, function() {
      URL.revokeObjectURL(url); // Clean up URL to avoid memory leaks
    });
  }
}

function resetRecordingState() {
  mediaRecorder = null;
  stream = null;
  recordedChunks = [];
}


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url.includes("mod/quiz/review.php")) {
    chrome.runtime.sendMessage({
      action: "executeFunction",
      functionName: "createNotification",
      args: "Thank you for Quiz Participation !!!",
    });

    setTimeout(function () {
      window.close(); // Close the popup
    }, 1500); // 1.5 seconds delay
  }
});
