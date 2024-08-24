// Check the current URL and create the camera overlay if conditions are met
// content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
 console.log(message.windowID);

});



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
  