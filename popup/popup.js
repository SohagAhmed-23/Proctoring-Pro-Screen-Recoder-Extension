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

  // Listener to close popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "closePopup") {
      window.close(); // Close the popup
    }
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
    console.log(" popup window is closed clicked")
    
    stopRecordingAndSave();
  });
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
shareScreenButton.style.display="none";

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
      shareScreenButton.style.display="block";
      saveRecording();
      resetRecordingState(); // Reset state after recording stops
    };

    mediaRecorder.start();
  }).catch((err) => {
    console.error('Error capturing screen:', err);
  });
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  chrome.storage.local.set({ isRecording: false });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: removeCameraOverlay
    });
  });

  resetRecordingState(); // Ensure state is reset after stopping recording
}

function stopRecordingAndSave() {
  console.log("stopRecording and save click");
  
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

// Function to remove the camera overlay
function removeCameraOverlay() {
  const cameraOverlay = document.getElementById('cameraOverlay');
  if (cameraOverlay) {
    cameraOverlay.remove();
  }
}

// Function to create the camera overlay
function createCameraOverlay() {
  if (!document.getElementById('cameraOverlay')) {
    const cameraOverlay = document.createElement('div');
    cameraOverlay.id = 'cameraOverlay';

    const video = document.createElement('video');
    video.id = 'cameraStream';
    video.autoplay = true;

    cameraOverlay.appendChild(video);
    document.body.appendChild(cameraOverlay);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      video.srcObject = stream;
    }).catch((error) => {
      console.error('Error accessing camera:', error);
    });
  }
}

// Handle tab activation and update events
chrome.tabs.onActivated.addListener(function () {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    setTimeout(function () {
      if (stream) {
        //sendCapturedFrame(stream); // Implement sendCapturedFrame as needed
      }
    }, 3000); // 3 seconds delay
  });
});

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
