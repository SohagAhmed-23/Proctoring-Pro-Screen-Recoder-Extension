// Listener for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "windowStatus") {
    handleWindowStatus(message.isWindowOpen);
  }
});

// Function to handle window status
function handleWindowStatus(isWindowOpen) {
  // Update the UI or perform actions based on the window status
  const existingPara = document.getElementById('windowStatus');
  
  if (isWindowOpen) {
    if (!existingPara) {  // Only create the paragraph if it doesn't exist
      const para = document.createElement('p');
      para.id = 'windowStatus';
      para.innerHTML = "Window is open";
      document.body.appendChild(para);
    }
    console.log("Popup window is open"); 
  } else {
    if (existingPara) {  // Remove the paragraph if it exists
      existingPara.remove();
    }
    console.log("Popup window is closed");
  }
}


if (window.location.href.includes("/mod/quiz/") && !window.location.href.includes("/mod/quiz/review.php") && 
!window.location.href.includes("/mod/quiz/view.php")) {
  
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
    
    // Call the function to create the camera overlay
    createCameraOverlay();
  }
  