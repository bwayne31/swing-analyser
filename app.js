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
        liveVideo.addEventListener('loadedmetadata', () => {
            swingCanvas.width = liveVideo.videoWidth;
            swingCanvas.height = liveVideo.videoHeight;
        });
    } catch (err) {
        console.error("Error accessing the camera: ", err);
        alert("Could not access the camera. Please check your permissions.");
    }
}

// Step 2: Handle recording with a fixed duration
recordButton.addEventListener('click', () => {
    // If we are already recording, pressing the button will stop it
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        recordButton.textContent = "Processing...";
        recordButton.disabled = true;
        discardButton.style.display = 'inline-block';
        return;
    }

    // Start recording for a fixed duration (e.g., 5 seconds)
    videoChunks = []; // Clear previous chunks
    const stream = liveVideo.srcObject;
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = event => {
        videoChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
        // Create a video blob from the chunks in memory
        const videoBlob = new Blob(videoChunks, { 'type': 'video/webm' });

        // Revoke the previous URL to free up memory
        if (liveVideo.src) {
            URL.revokeObjectURL(liveVideo.src);
        }

        // Display the captured video for analysis
        const videoURL = URL.createObjectURL(videoBlob);
        liveVideo.srcObject = null; // Detach from live camera
        liveVideo.src = videoURL;
        liveVideo.loop = true;
        liveVideo.play();

        // Enable drawing tools and analysis on the canvas
        swingCanvas.style.pointerEvents = 'auto';
        swingCanvas.addEventListener('mousedown', startDrawing);
        swingCanvas.addEventListener('mousemove', draw);
        swingCanvas.addEventListener('mouseup', stopDrawing);

        // Reset button state
        recordButton.textContent = "Start Recording";
        recordButton.disabled = false;
    };

    mediaRecorder.start(5000); // Record for 5 seconds
    recordButton.textContent = "Recording...";
});

// Discard and reset
discardButton.addEventListener('click', () => {
    // Clear video data from memory
    videoChunks = [];
    if (liveVideo.src) {
        URL.revokeObjectURL(liveVideo.src);
    }
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
    const rect = swingCanvas.getBoundingClientRect();
    [lastX, lastY] = [e.clientX - rect.left, e.clientY - rect.top];
}

function draw(e) {
    if (!isDrawing) return;
    const rect = swingCanvas.getBoundingClientRect();
    const [currentX, currentY] = [e.clientX - rect.left, e.clientY - rect.top];
    
    canvasContext.beginPath();
    canvasContext.moveTo(lastX, lastY);
    canvasContext.lineTo(currentX, currentY);
    canvasContext.strokeStyle = 'red';
    canvasContext.lineWidth = 3;
    canvasContext.stroke();
    
    [lastX, lastY] = [currentX, currentY];
}

function stopDrawing() {
    isDrawing = false;
}

// Start the app when the page loads
setupCamera();
