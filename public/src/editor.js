document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const dictionarySelect = document.getElementById('dictionarySelect');
  const markerIdInput = document.getElementById('markerIdInput');
  const markerMaxInfo = document.getElementById('markerMaxInfo');
  const addMarkerBtn = document.getElementById('addMarkerBtn');
  const markerList = document.getElementById('markerList');
  const imageUpload = document.getElementById('imageUpload');
  const editorCanvas = document.getElementById('editorCanvas');
  const saveImageBtn = document.getElementById('saveImageBtn');
  const exportMarkersBtn = document.getElementById('exportMarkersBtn');
  const importMarkersBtn = document.getElementById('importMarkersBtn');
  const importFileInput = document.getElementById('importFileInput');
  const imageList = document.getElementById('imageList'); // Container for ImageObj panels

  const bgColorPicker = document.getElementById('bgColorPicker');

  const canvasWidthInput = document.getElementById('canvasWidthInput');
  const canvasHeightInput = document.getElementById('canvasHeightInput');

  const ctx = editorCanvas.getContext('2d');

  let currentDictionaryName = null;
  let currentDictionary = null;
  let markers = [];

  let images = [];

  let draggedMarker = null;
  let draggedImage = null; 
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  for (const dicName in AR.DICTIONARIES) {
    const option = document.createElement('option');
    option.value = dicName;
    option.textContent = dicName;
    dictionarySelect.appendChild(option);
  }

  dictionarySelect.value = 'ARUCO_MIP_36h12';
  updateDictionary(dictionarySelect.value);

  dictionarySelect.addEventListener('change', () => {
    updateDictionary(dictionarySelect.value);
  });

  markerIdInput.addEventListener('change', updateMarkerIDInfo);
  addMarkerBtn.addEventListener('click', () => { addMarker(); });

  imageUpload.addEventListener('change', (e) => {
    loadMultipleImagesFromFiles(e.target.files);
    e.target.value = '';
  });

  importMarkersBtn.addEventListener('click', () => {
    console.log('Import Markers button clicked.');
    importFileInput.click();
  });

  importFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      importMarkers(e.target.files[0]);
    }
  });

  editorCanvas.addEventListener('mousedown', onCanvasMouseDown);
  editorCanvas.addEventListener('mousemove', onCanvasMouseMove);
  editorCanvas.addEventListener('mouseup', onCanvasMouseUp);
  editorCanvas.addEventListener('mouseleave', onCanvasMouseUp);
  saveImageBtn.addEventListener('click', saveCompositeImage);
  exportMarkersBtn.addEventListener('click', exportMarkers);

  bgColorPicker.addEventListener('input', drawScene);

  // Add 'input' event listeners for immediate resizing via arrow buttons
  [canvasWidthInput, canvasHeightInput].forEach(el => {
    el.addEventListener('input', applyCanvasResize);
    el.addEventListener('blur', applyCanvasResize);
    el.addEventListener('keydown', (ev) => { 
      if (ev.key === 'Enter') applyCanvasResize(); 
    });
  });

  /**
   * Initializes the canvas size based on input values.
   * Sets the canvas to 1920x1080 by default.
   */
  function initializeCanvasSize() {
    const initialWidth = parseInt(canvasWidthInput.value, 10) || 1920;
    const initialHeight = parseInt(canvasHeightInput.value, 10) || 1080;
    editorCanvas.width = initialWidth;
    editorCanvas.height = initialHeight;
    // Update CSS to reflect the size
    editorCanvas.style.width = `${initialWidth}px`;
    editorCanvas.style.height = `${initialHeight}px`;
    drawScene();
  }

  /**
   * Updates the current dictionary based on selection.
   * @param {string} dicName - The name of the selected dictionary.
   */
  function updateDictionary(dicName) {
    currentDictionaryName = dicName;
    currentDictionary = new AR.Dictionary(dicName);
    markerIdInput.max = currentDictionary.codeList.length - 1;
    markerMaxInfo.textContent = `Max ID: ${currentDictionary.codeList.length - 1}`;
  }

  /**
   * Ensures the Marker ID does not exceed the maximum allowed.
   */
  function updateMarkerIDInfo() {
    const val = parseInt(markerIdInput.value, 10);
    if (val > currentDictionary.codeList.length - 1) {
      markerIdInput.value = currentDictionary.codeList.length - 1;
    }
  }

  /**
   * Adds a new marker to the canvas and sidebar.
   * @param {string} dictionaryName - The dictionary name for the marker.
   * @param {number} markerID - The ID of the marker.
   * @param {number} x - The X position of the marker.
   * @param {number} y - The Y position of the marker.
   * @param {number} size - The size of the marker.
   */
  function addMarker(dictionaryName = currentDictionaryName, markerID = parseInt(markerIdInput.value, 10), x = 50, y = 50, size = 100) {
    if (isNaN(markerID)) return;
    if (!currentDictionary) return;

    x = Math.round(x);
    y = Math.round(y);
    size = Math.round(size);

    const marker = new MarkerObj(
      dictionaryName,
      markerID,
      x,
      y,
      size,
      () => {
        drawScene();
      },
      (m) => {
        removeMarker(m);
      }
    );
    markers.push(marker);
    markerList.appendChild(marker.uiElement);
    drawScene();
  }

  /**
   * Removes a marker from the canvas and sidebar.
   * @param {MarkerObj} markerObj - The marker object to remove.
   */
  function removeMarker(markerObj) {
    const index = markers.indexOf(markerObj);
    if (index !== -1) {
      markers.splice(index, 1);
      if (markerObj.uiElement && markerObj.uiElement.parentNode) {
        markerObj.uiElement.parentNode.removeChild(markerObj.uiElement);
      }
      drawScene();
    }
  }

  /**
   * Loads multiple images from file inputs.
   * @param {FileList} files - The list of files to load.
   */
  function loadMultipleImagesFromFiles(files) {
    // Support multiple image uploads
    [...files].forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Center image on canvas
          const x = (editorCanvas.width - img.width) / 2;
          const y = (editorCanvas.height - img.height) / 2;

          const imgObj = new ImageObj(
            img,
            x,
            y,
            img.width,
            img.height,
            () => {
              drawScene();
            },
            (io) => {
              removeImageObj(io);
            }
          );
          images.push(imgObj);
          imageList.appendChild(imgObj.uiElement);
          drawScene();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Removes an ImageObj from the canvas and sidebar.
   * @param {ImageObj} io - The ImageObj to remove.
   */
  function removeImageObj(io) {
    const index = images.indexOf(io);
    if (index !== -1) {
      images.splice(index, 1);
      if (io.uiElement && io.uiElement.parentNode) {
        io.uiElement.parentNode.removeChild(io.uiElement);
      }
      drawScene();
    }
  }

  /**
   * Draws the entire scene, including background, images, and markers.
   */
  function drawScene() {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);

    // Set background color
    ctx.fillStyle = bgColorPicker.value;
    ctx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);

    // Draw images first (beneath markers)
    images.forEach(io => {
      ctx.drawImage(io.image, io.x, io.y, io.width, io.height);
    });

    // Draw markers on top
    markers.forEach(marker => {
      if (marker.cachedImage) {
        ctx.drawImage(marker.cachedImage, marker.x, marker.y);
      }
    });
  }

  /**
   * Saves the current canvas as an image file.
   */
  function saveCompositeImage() {
    const formatSelect = document.getElementById('formatSelect');

    const format = formatSelect.value;
    let filename = 'composite';

    const extension = format === 'jpg' ? 'jpg' : format;
    if (!filename.endsWith(`.${extension}`)) {
      filename += `.${extension}`;
    }

    const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
    const quality = format === 'jpg' ? 0.92 : 1.0; // JPEG quality

    const dataURL = editorCanvas.toDataURL(mimeType, quality);

    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Exports markers to a JSON file.
   */
  function exportMarkers() {
    const data = {
      canvasWidth: editorCanvas.width,
      canvasHeight: editorCanvas.height,
      backgroundColor: bgColorPicker.value,
      markers: markers.map(m => ({
        dictionaryName: m.dictionaryName,
        arucoId: m.arucoId,
        x: m.x,
        y: m.y,
        scale: m.size,
        anchorX: m.anchorX,
        anchorY: m.anchorY
      }))
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'markers.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Imports markers from a JSON file.
   * @param {File} file - The JSON file to import.
   */
  function importMarkers(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Clear existing markers
        markers.forEach(m => {
          if (m.uiElement && m.uiElement.parentNode) {
            m.uiElement.parentNode.removeChild(m.uiElement);
          }
        });
        markers = [];

        // We do not clear images here since they are not saved/loaded from JSON (as per requirement)

        // If canvas size info is present, update canvas size
        if (typeof data.canvasWidth === 'number' && typeof data.canvasHeight === 'number') {
          editorCanvas.width = data.canvasWidth;
          editorCanvas.height = data.canvasHeight;
          // Update CSS to reflect new canvas size
          editorCanvas.style.width = `${data.canvasWidth}px`;
          editorCanvas.style.height = `${data.canvasHeight}px`;
          canvasWidthInput.value = data.canvasWidth;
          canvasHeightInput.value = data.canvasHeight;
        }

        // If background color info is present, update the background color
        if (data.backgroundColor) {
          bgColorPicker.value = data.backgroundColor;
        }

        // Import markers
        if (Array.isArray(data.markers)) {
          data.markers.forEach(d => {
            if (
              d.dictionaryName &&
              typeof d.arucoId === 'number' &&
              typeof d.x === 'number' &&
              typeof d.y === 'number' &&
              typeof d.scale === 'number'
            ) {
              const marker = new MarkerObj(
                d.dictionaryName,
                d.arucoId,
                Math.round(d.x),
                Math.round(d.y),
                Math.round(d.scale),
                () => drawScene(),
                (m) => removeMarker(m),
                d.anchorX !== undefined ? d.anchorX : 0,
                d.anchorY !== undefined ? d.anchorY : 0
              );
              markerList.appendChild(marker.uiElement);
              marker.restoreAnchorSelection();
              markers.push(marker);
            }
          });
        }

        drawScene();
      } catch (err) {
        alert('Invalid JSON file');
        console.error(err);
      }
    };
    reader.readAsText(file);
  }

  /**
   * Handles mouse down events on the canvas for dragging markers or images.
   * @param {MouseEvent} e - The mouse event.
   */
  function onCanvasMouseDown(e) {
    const rect = editorCanvas.getBoundingClientRect();
    const scaleX = editorCanvas.width / rect.width;
    const scaleY = editorCanvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    draggedMarker = null;
    draggedImage = null;

    // **Check Markers First (Topmost)**
    for (let i = markers.length - 1; i >= 0; i--) {
      const marker = markers[i];
      const mx = marker.x;
      const my = marker.y;
      const ms = marker.size;

      if (mouseX >= mx && mouseX <= mx + ms &&
          mouseY >= my && mouseY <= my + ms) {
        draggedMarker = marker;
        dragOffsetX = mouseX - mx;
        dragOffsetY = mouseY - my;
        return; // If marker is selected, do not check images
      }
    }

    // **Check Images Second**
    for (let i = images.length - 1; i >= 0; i--) {
      const io = images[i];
      if (mouseX >= io.x && mouseX <= io.x + io.width &&
          mouseY >= io.y && mouseY <= io.y + io.height) {
        draggedImage = io;
        dragOffsetX = mouseX - io.x;
        dragOffsetY = mouseY - io.y;
        break;
      }
    }

    // Debugging Log
    console.log('MouseDown:', { mouseX, mouseY }, 'Selected Marker:', draggedMarker, 'Selected Image:', draggedImage, 'dragOffsetX:', dragOffsetX, 'dragOffsetY:', dragOffsetY);
  }

  /**
   * Handles mouse move events on the canvas for dragging markers or images.
   * @param {MouseEvent} e - The mouse event.
   */
  function onCanvasMouseMove(e) {
    if (!draggedMarker && !draggedImage) return;

    const rect = editorCanvas.getBoundingClientRect();
    const scaleX = editorCanvas.width / rect.width;
    const scaleY = editorCanvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (draggedMarker) {
      // Optional: Add boundary checks here
      draggedMarker.x = mouseX - dragOffsetX;
      draggedMarker.y = mouseY - dragOffsetY;
    }

    if (draggedImage) {
      // Optional: Add boundary checks here
      draggedImage.x = mouseX - dragOffsetX;
      draggedImage.y = mouseY - dragOffsetY;
    }

    drawScene();
  }

  /**
   * Handles mouse up events on the canvas to stop dragging.
   */
  function onCanvasMouseUp() {
    if (draggedMarker) {
      draggedMarker.x = Math.round(draggedMarker.x);
      draggedMarker.y = Math.round(draggedMarker.y);
      console.log('MouseUp Final Marker Pos:', { x: draggedMarker.x, y: draggedMarker.y });
      draggedMarker.notifyUpdate();
      draggedMarker = null;
    }

    if (draggedImage) {
      draggedImage.x = Math.round(draggedImage.x);
      draggedImage.y = Math.round(draggedImage.y);
      draggedImage.notifyUpdate();
      draggedImage = null;
    }
  }

  /**
   * Applies resizing to the canvas based on user input.
   * Resizes immediately when the user changes the value via arrow buttons.
   */
  function applyCanvasResize() {
    const newWidth = parseInt(canvasWidthInput.value, 10);
    const newHeight = parseInt(canvasHeightInput.value, 10);

    console.log(`Attempting to resize canvas to ${newWidth}x${newHeight}`);

    if (!isNaN(newWidth) && !isNaN(newHeight)) {
      editorCanvas.width = newWidth;
      editorCanvas.height = newHeight;
      // Update CSS to reflect new canvas size
      editorCanvas.style.width = `${newWidth}px`;
      editorCanvas.style.height = `${newHeight}px`;
      console.log(`Canvas resized to ${editorCanvas.width}x${editorCanvas.height}`);
      drawScene();
    } else {
      console.warn('Invalid canvas size inputs.');
    }
  }

  // Initialize the canvas size on page load
  initializeCanvasSize();
});
