// Get HTML elements
const liveVideo = document.getElementById('liveVideo');
const swingCanvas = document.getElementById('swingCanvas');
const recordButton = document.getElementById('recordButton');
const discardButton = document.getElementById('discardButton');
const canvasContext = swingCanvas.getContext('2d');

let mediaRecorder;
let videoChunks = [];

// Step 1: Request camera access and display the feed
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        liveVideo.srcObject = stream;
        liveVideo.play();
        // Adjust canvas size to match video after it loads
        liveVideo.addEventListener('loadedmetadata', () => {
            swingCanvas.width = liveVideo.videoWidth;
            swingCanvas.height = liveVideo.videoHeight;
        });
    } catch (err) {
        console.error("Error accessing the camera: ", err);
        alert("Could not access the camera. Please check your permissions.");
    }
}

// Step 2: Handle recording
recordButton.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        recordButton.textContent = "Start Recording";
        discardButton.style.display = 'inline-block';
        return;
    }

    // Start recording
    videoChunks = []; // Clear previous chunks
    const stream = liveVideo.srcObject;
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = event => {
        videoChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
        // This is where we would get the final video data
        // For this prototype, we'll just log it.
        const videoBlob = new Blob(videoChunks, { 'type': 'video/webm' });
        console.log("Video captured and ready for in-browser processing!");

        // Display the captured video on the canvas for analysis
        const videoURL = URL.createObjectURL(videoBlob);
        liveVideo.srcObject = null; // Detach from live camera
        liveVideo.src = videoURL;
        liveVideo.loop = true;
        liveVideo.play();
        liveVideo.addEventListener('timeupdate', () => {
            canvasContext.drawImage(liveVideo, 0, 0, swingCanvas.width, swingCanvas.height);
        });

        // Enable drawing tools here
        // For now, we'll just have a simple drawing demo
        swingCanvas.style.pointerEvents = 'auto';
        swingCanvas.addEventListener('mousedown', startDrawing);
        swingCanvas.addEventListener('mousemove', draw);
        swingCanvas.addEventListener('mouseup', stopDrawing);
    };

    mediaRecorder.start();
    recordButton.textContent = "Stop Recording";
});

// Discard and reset
discardButton.addEventListener('click', () => {
    // Clear video data from memory
    videoChunks = [];
    liveVideo.src = null;
    discardButton.style.display = 'none';
    recordButton.textContent = "Start Recording";
    setupCamera(); // Restart the live camera feed
});

// Simple Drawing Tools (for the canvas)
let isDrawing = false;
let lastX = 0;
let lastY = 0;

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
    if (!isDrawing) return;
    canvasContext.beginPath();
    canvasContext.moveTo(lastX, lastY);
    canvasContext.lineTo(e.offsetX, e.offsetY);
    canvasContext.strokeStyle = 'red';
    canvasContext.lineWidth = 3;
    canvasContext.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
    isDrawing = false;
}

// Start the app when the page loads
setupCamera();