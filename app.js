// Wait for the DOM to be fully loaded before running the script
window.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM Element Selection ---
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('display');
    const ctx = canvas.getContext('2d');
    const filterList = document.getElementById('filter-list');
    const randomBtn = document.getElementById('random-filter-btn');
    const screenshotBtn = document.getElementById('screenshot-btn');
    const recordBtn = document.getElementById('record-btn');
    const descriptionBox = document.getElementById('description-box');

    // --- 2. Archetype Data ---
    const archetypes = [
        {
            id: 'self',
            name: 'The Self',
            symbol: 'fa-solid fa-circle-dot', // Represents wholeness
            description: 'The unified whole of the conscious and unconscious. Wholeness, integration, and the center of the total personality.'
        },
        {
            id: 'persona',
            name: 'The Persona',
            symbol: 'fa-solid fa-theater-masks', // The social mask
            description: 'The social mask or facade you present to the world. It conceals your true self.'
        },
        {
            id: 'shadow',
            name: 'The Shadow',
            symbol: 'fa-solid fa-square-full', // Represents the dense, unknown
            description: 'The unknown, dark side of the personality. The repressed, instinctive, and inferior parts of the psyche.'
        },
        {
            id: 'anima',
            name: 'The Anima/Animus',
            symbol: 'fa-solid fa-moon', // The inner, intuitive, 'feminine'
            description: 'The inner, unconscious feminine side in men (Anima) or masculine side in women (Animus). Represents intuition and soul.'
        },
        {
            id: 'trickster',
            name: 'The Trickster',
            symbol: 'fa-solid fa-wand-magic-sparkles', // Chaos and disruption
            description: 'The archetype of chaos, disruption, and challenging norms. It exposes hypocrisy and creates new possibilities.'
        }
    ];

    // --- 3. State Variables ---
    let currentFilter = archetypes[0]; // Default to 'The Self'
    let videoReady = false;

    // --- New Recording State Variables ---
    let mediaRecorder;
    let recordedChunks = [];
    let isRecording = false;

    // --- 4. Core Functions ---

    /**
     * Initializes the application:
     * 1. Starts the webcam
     * 2. Populates the filter buttons
     * 3. Sets up event listeners
     */
    async function init() {
        try {
            await startCamera();
            initFilterButtons();
            initEventListeners();
            applyFilter(currentFilter.id); // Apply the default filter
            renderLoop(); // Start the main render loop
        } catch (err) {
            console.error("Error initializing app:", err);
            // We alert in startCamera now, so this is a fallback.
        }
    }

    /**
     * Accesses the user's webcam and sets up the video element
     */
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 }, // Request HD if possible
                audio: false
            });
            video.srcObject = stream;
            
            // Wait for the video to load its metadata (dimensions)
            return new Promise((resolve, reject) => {
                video.onloadedmetadata = () => {
                    // Set canvas dimensions to match the video feed
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    videoReady = true;

                    // --- CRITICAL FIX ---
                    // Manually start playback as autoplay can be unreliable
                    video.play().then(() => {
                        console.log("Video playback started successfully.");
                        resolve(); // Resolve the promise *after* play starts
                    }).catch(e => {
                        console.error("Video play failed:", e);
                        alert("Video playback failed. Please check console.");
                        reject(e); // Reject the promise if play fails
                    });
                };
                video.onerror = (e) => {
                     console.error("Video element error:", e);
                     alert("Video element error. Cannot play stream.");
                     reject(e);
                };
            });
        } catch (err) {
             console.error("Camera access denied or failed:", err);
             if (err.name === "NotAllowedError") {
                alert("Camera permission was denied. Please allow camera access in your browser settings and refresh.");
             } else {
                alert("Could not access webcam. Is it being used by another app? Error: " + err.message);
             }
             throw err; // Re-throw error to stop init()
        }
    }

    /**
     * The main render loop, called for every frame
     */
    function renderLoop() {
        if (!videoReady) {
            requestAnimationFrame(renderLoop); // Wait until video is ready
            return;
        }

        // Save the default canvas state
        ctx.save();

        // --- Core Drawing ---
        // 1. Mirror the canvas (to match the CSS flip)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        
        // 2. Clear previous frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 3. Apply dynamic (per-frame) filter effects
        applyDynamicFilter(currentFilter.id);

        // 4. Draw the current video frame onto the canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 5. Apply static overlay effects (after drawing the video)
        applyOverlayFilter(currentFilter.id);

        // Restore the canvas state to remove transformations
        ctx.restore();

        // Request the next frame
        requestAnimationFrame(renderLoop);
    }

    // --- 5. Filter Logic ---

    /**
     * Applies the selected filter by updating state, CSS class, and description
     */
    function applyFilter(filterId) {
        // Find the archetype object from our data
        currentFilter = archetypes.find(a => a.id === filterId);

        // 1. Update CSS class for base color grading
        canvas.className = currentFilter.id;
        
        // 2. Update description box
        descriptionBox.innerHTML = `<h3>${currentFilter.name}</h3><p>${currentFilter.description}</p>`;
        descriptionBox.classList.add('visible');

        // 3. Update active button state
        document.querySelectorAll('.filter-list button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filterId);
        });
    }

    /**
     * Applies DYNAMIC (per-frame) canvas effects BEFORE drawing the video
     */
    function applyDynamicFilter(filterId) {
        // Reset filter to ensure a clean draw for pixel manipulation
        ctx.filter = 'none';
    }

    /**
     * Applies STATIC (overlay) canvas effects AFTER drawing the video
     */
    function applyOverlayFilter(filterId) {
        switch (filterId) {
            case 'shadow':
                applyShadowEffect();
                break;
            case 'anima':
                applyAnimaEffect(); // White Outline Filter
                break;
            case 'self':
                applySelfEffect();
                break;
            case 'persona':
                applyPersonaEffect();
                break;
            case 'trickster':
                applyTricksterEffect(); // Simplified Red-Black Filter
                break;
        }
    }

    // --- Specific Canvas Effect Functions ---

    function applyShadowEffect() {
        const width = canvas.width;
        const height = canvas.height;

        // 1. Dark Vignette (already darkened)
        const gradient = ctx.createRadialGradient(width / 2, height / 2, width / 3, width / 2, height / 2, width / 1.5);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 2. Slice Glitch (now more frequent and slightly larger)
        if (Math.random() > 0.85) { // <-- Increased frequency from 0.92
            for (let i = 0; i < 2; i++) { // Run it a couple of times
                const y = Math.random() * height;
                const h = Math.random() * 30 + 10; // Slightly larger
                const xOffset = (Math.random() - 0.5) * 40;
                ctx.drawImage(canvas, xOffset, y, width, h, 0, y, width, h);
            }
        }

        // 3. NEW: Subtle RGB Split Glitch
        if (Math.random() > 0.95) { // Happens rarely, like a flicker
            ctx.globalCompositeOperation = 'lighter'; // Additive blending
            const offset = (Math.random() - 0.5) * 10;
            
            // Draw red-ish channel offset
            ctx.drawImage(canvas, offset, 0);
            
            // Draw blue-ish channel offset
            ctx.drawImage(canvas, -offset, 0);
            
            ctx.globalCompositeOperation = 'source-over'; // Reset blending
        }
    }

    /**
     * Anima/Animus Filter: White Outline
     * Applies an edge-detection kernel to create a white outline on a dark background.
     */
    function applyAnimaEffect() {
        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Create a new pixel array for the output
        const outputData = ctx.createImageData(width, height);
        const out = outputData.data;

        // --- Grayscale pass ---
        const gray = new Uint8ClampedArray(width * height);
        for (let i = 0; i < data.length; i += 4) {
            const luma = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
            gray[i / 4] = luma;
        }

        // --- Edge Detection (Laplacian Kernel) ---
        const threshold = 20; // How sensitive the edge detection is
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const i = y * width + x; // Current pixel index in grayscale
                const outI = i * 4;      // Current pixel index in output RGBA

                // Apply kernel
                const val = 4 * gray[i] 
                            - gray[i - 1]           // Left
                            - gray[i + 1]           // Right
                            - gray[i - width]       // Top
                            - gray[i + width];      // Bottom
                
                if (Math.abs(val) > threshold) {
                    // This is an edge, color it WHITE
                    out[outI] = 255;
                    out[outI + 1] = 255;
                    out[outI + 2] = 255;
                    out[outI + 3] = 255;
                } else {
                    // Not an edge, color it DARK GREY
                    out[outI] = 20;
                    out[outI + 1] = 20;
                    out[outI + 2] = 20;
                    out[outI + 3] = 255;
                }
            }
        }
        
        // Put the modified image data back onto the canvas
        ctx.putImageData(outputData, 0, 0);
    }
    
    function applySelfEffect() {
        // A subtle, centering golden glow
        const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.width * 0.7, canvas.width / 2, canvas.height / 2, canvas.width * 0.3);
        gradient.addColorStop(0, 'rgba(255, 220, 150, 0.0)');
        gradient.addColorStop(1, 'rgba(255, 220, 150, 0.15)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function applyPersonaEffect() {
        // --- Negative Inversion Effect ---
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data; 
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];     // Invert Red
            data[i + 1] = 255 - data[i + 1]; // Invert Green
            data[i + 2] = 255 - data[i + 2]; // Invert Blue
        }
        ctx.putImageData(imageData, 0, 0);

        // --- "Smoothing" vignette (for a mask-like feel) ---
        const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.width * 0.4, canvas.width / 2, canvas.height / 2, canvas.width * 0.6);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)'); 
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    /**
     * Trickster Filter: Red-Black Cinematic (Simplified for Performance)
     * Applies a high-contrast, duotone "redscale" image.
     */
    function applyTricksterEffect() {
        const width = canvas.width;
        const height = canvas.height;

        // --- Red-Black Cinematic Base ---
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const shadowThreshold = 55;
        const passionFactor = 1.8; 

        for (let i = 0; i < data.length; i += 4) {
            // Get the luminance (perceived brightness) of the pixel
            const luminance = (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114);

            if (luminance <= shadowThreshold) {
                // --- The Shadow/Control ---
                // If brightness is below the threshold, crush it to black
                data[i] = 0;     // Red
                data[i+1] = 0; // Green
                data[i+2] = 0; // Blue
            } else {
                // --- The Passion/Emotion ---
                // Otherwise, map that brightness to an intense red
                data[i] = luminance * passionFactor; // Red channel
                data[i+1] = 0;                     // Green channel
                data[i+2] = 0;                     // Blue channel
            }
            // data[i+3] (alpha channel) remains unchanged
        }
        
        // Put the modified image data back onto the canvas
        ctx.putImageData(imageData, 0, 0);
    }


    // --- 6. UI & Event Listeners ---

    /**
     * Creates the filter buttons dynamically from the archetype data
     */
    function initFilterButtons() {
        archetypes.forEach(arch => {
            const btn = document.createElement('button');
            btn.title = arch.name;
            btn.dataset.filter = arch.id;
            btn.innerHTML = `<i class="${arch.symbol}"></i>`;
            btn.addEventListener('click', () => applyFilter(arch.id));
            filterList.appendChild(btn);
        });
    }

    /**
     * Sets up click listeners for all control buttons
     */
    function initEventListeners() {
        randomBtn.addEventListener('click', randomFilterSlotMachine);
        screenshotBtn.addEventListener('click', takeScreenshot);
        recordBtn.addEventListener('click', startRecording); // New
    }

    /**
     * Implements the "slot machine" randomizer
     */
    function randomFilterSlotMachine() {
        let loops = 15; // Number of "ticks"
        const intervalTime = 80; // Speed of the ticks
        
        // Disable buttons during animation
        randomBtn.disabled = true;
        filterList.style.pointerEvents = 'none';

        const interval = setInterval(() => {
            loops--;

            // Pick a random filter just for the visual "spin"
            const randomArch = archetypes[Math.floor(Math.random() * archetypes.length)];
            
            // Apply the CSS class for the fast "tick" effect
            canvas.className = randomArch.id;
            // Update active button visuals
            document.querySelectorAll('.filter-list button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === randomArch.id);
            });

            if (loops <= 0) {
                // Animation finished
                clearInterval(interval);
                
                // Pick the FINAL random filter (and ensure it's not the current one)
                let finalArch;
                do {
                    finalArch = archetypes[Math.floor(Math.random() * archetypes.length)];
                } while (finalArch.id === currentFilter.id);

                // Apply the final filter properly
                applyFilter(finalArch.id);

                // Re-enable buttons
                randomBtn.disabled = false;
                filterList.style.pointerEvents = 'auto';
            }
        }, intervalTime);
    }

    /**
     * Saves a screenshot of the current canvas
     */
    function takeScreenshot() {
        const link = document.createElement('a');
        link.download = `jungian_mirror_${currentFilter.id}.png`;
        
        // Save/restore logic to draw non-mirrored frame for screenshot
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        applyDynamicFilter(currentFilter.id);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        applyOverlayFilter(currentFilter.id);
        
        link.href = canvas.toDataURL('image/png');
        ctx.restore(); // Restore mirrored context for live feed
        link.click();
    }


    // --- 7. NEW Video Recording Functions ---

    /**
     * Starts the 5-second video recording
     */
    function startRecording() {
        if (isRecording) return; // Prevent double-recording
        
        isRecording = true;
        recordedChunks = [];
        
        // --- Give UI Feedback & Disable Controls ---
        recordBtn.classList.add('recording');
        recordBtn.disabled = true;
        screenshotBtn.disabled = true;
        randomBtn.disabled = true;
        filterList.style.pointerEvents = 'none';

        // --- Start Capture ---
        const stream = canvas.captureStream(30); // 30fps

        // --- NEW: Prioritize MP4 for compatibility ---
        const mimeTypes = [
            'video/mp4; codecs="avc1.42E01E"', // H.264 MP4 (best for phones/safari)
            'video/webm; codecs=vp9',          // VP9 WebM (high quality)
            'video/webm; codecs=vp8',          // VP8 WebM (fallback)
            'video/webm'                       // Generic WebM
        ];

        // Find the first supported MIME type
        const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

        if (!supportedMimeType) {
            console.error("No supported MIME type found for MediaRecorder");
            alert("Video recording is not supported on this browser.");
            stopRecording(); // Reset UI
            return;
        }

        console.log("Using MIME type:", supportedMimeType);

        // Create the recorder with the best supported format
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: supportedMimeType
        });
        // ------------------------------------------

        // Add data chunks as they become available
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        // When recording stops, process the video
        mediaRecorder.onstop = handleRecordingStop;

        // Start recording
        mediaRecorder.start();

        // Set timer to stop after 5 seconds
        setTimeout(stopRecording, 5000);
    }

    /**
     * Stops the MediaRecorder
     */
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
             mediaRecorder.stop();
        }
        
        // --- Reset UI ---
        isRecording = false;
        recordBtn.classList.remove('recording');
        recordBtn.disabled = false;
        screenshotBtn.disabled = false;
        randomBtn.disabled = false;
        filterList.style.pointerEvents = 'auto';
    }

    /**
     * Called when recording stops; creates and downloads the video file
     */
    function handleRecordingStop() {
        // --- NEW: Determine file extension dynamically ---
        const fileExtension = mediaRecorder.mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
        
        // Combine all recorded chunks into a single Blob
        const blob = new Blob(recordedChunks, {
            type: mediaRecorder.mimeType 
        });

        // Create a URL for the Blob
        const url = URL.createObjectURL(blob);

        // Create a temporary link to trigger the download
        const link = document.createElement('a');
        link.href = url;
        // Use the correct extension
        link.download = `jungian_mirror_${currentFilter.id}_${Date.now()}.${fileExtension}`;
        link.click();

        // Clean up the object URL
        URL.revokeObjectURL(url);
    }


    // --- 8. Start the App ---
    init();

});
