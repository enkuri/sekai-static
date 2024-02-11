const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const image = document.getElementById('image');
const imageContainer = document.getElementById('image-container');
const brushSlider = document.getElementById('brush-slider');
const previewCanvas = document.createElement('canvas');
const previewContext = previewCanvas.getContext('2d');

let isDrawing = false;
let isPreviewing = false;
let lastX = 0;
let lastY = 0;
let brushSize = 5;
let previewSize = 5;

previewCanvas.id = 'previewCanvas';
canvas.id = 'mainCanvas';

imageContainer.appendChild(canvas);

resizeCanvas();

function resizeCanvas() {
    canvas.width = image.offsetWidth;
    canvas.height = image.offsetHeight;
}

window.addEventListener('resize', () => {
    resizeCanvas();
    if (!isPreviewing) {
        redrawPreview();
    }
});

function draw(e) {
    if (!isDrawing) return;
    const x = e.offsetX;
    const y = e.offsetY;
    context.lineWidth = brushSize;
    context.lineCap = 'round';
    context.strokeStyle = 'rgb(255, 255, 255)';
    context.beginPath();
    context.moveTo(lastX, lastY);
    context.lineTo(x, y);
    context.stroke();
    lastX = x;
    lastY = y;
}

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function redrawPreview() {
    previewCanvas.width = brushSize * 2;
    previewCanvas.height = brushSize * 2;
    previewContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewContext.beginPath();
    previewContext.arc(brushSize, brushSize, brushSize, 0, Math.PI * 2);
    previewContext.strokeStyle = 'rgb(255, 0, 0)';
    previewContext.stroke();
}

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
});

canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseout', () => isDrawing = false);

brushSlider.addEventListener('mousedown', () => {
    isPreviewing = true;
    imageContainer.appendChild(previewCanvas);
});

brushSlider.addEventListener('mouseup', () => {
    isPreviewing = false;
    imageContainer.removeChild(previewCanvas);
});

brushSlider.addEventListener('input', () => {
    brushSize = brushSlider.value;
    if (isPreviewing) {
        redrawPreview();
    }
});


canvas.addEventListener('touchstart', (e) => {
    isDrawing = true;
    const touch = e.touches[0];
    lastX = touch.clientX - canvas.getBoundingClientRect().left;
    lastY = touch.clientY - canvas.getBoundingClientRect().top;
});

canvas.addEventListener('touchmove', (e) => {
    if (!isDrawing) return;
    const touch = e.touches[0];
    const x = touch.clientX - canvas.getBoundingClientRect().left;
    const y = touch.clientY - canvas.getBoundingClientRect().top;
    draw({ offsetX: x, offsetY: y });
});

canvas.addEventListener('touchend', () => {
    isDrawing = false;
});


canvas.addEventListener('touchstart', (e) => e.preventDefault());
canvas.addEventListener('touchmove', (e) => e.preventDefault());


function submitMask() {
    // Create a new canvas to match the size of the original image
    const resizedCanvas = document.createElement('canvas');
    const resizedContext = resizedCanvas.getContext('2d');
    resizedCanvas.width = image.naturalWidth;
    resizedCanvas.height = image.naturalHeight;

    // Draw the original canvas image onto the resized canvas
    resizedContext.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);

    // Convert the resized canvas to a JPEG image
    const imageData = resizedCanvas.toDataURL('image/jpeg');

    // Send the masked image data to the server
    fetch('/save_mask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image_data: imageData,
            uid: uId,
            rid: rId,
            hash: rHash,
            created: created,
            life_time: lifeTime,
            session_id: sessionId
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to submit mask');
        }
        return response.json();
    })
    .then(data => {
        console.log('Mask submitted successfully:', data);
        window.location.replace(data['redirect']);
    })
    .catch(error => {
        console.error('Error submitting mask:', error);
    });
}

image.addEventListener('load', resizeCanvas);
document.addEventListener('DOMContentLoaded', resizeCanvas);
