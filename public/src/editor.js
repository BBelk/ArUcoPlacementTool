document.addEventListener('DOMContentLoaded', () => {
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
  const clearImageBtn = document.getElementById('clearImageBtn');
  const imageInfo = document.getElementById('imageInfo');

  const widthInput = document.getElementById('widthInput');
  const heightInput = document.getElementById('heightInput');
  const bgColorPicker = document.getElementById('bgColorPicker');

  const canvasWidthInput = document.getElementById('canvasWidthInput');
  const canvasHeightInput = document.getElementById('canvasHeightInput');

  const ctx = editorCanvas.getContext('2d');

  let currentDictionaryName = null;
  let currentDictionary = null;
  let markers = [];

  let originalImage = null; // Unaltered original image
  let currentImage = null;  // Displayed (scaled) image

  let draggedMarker = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  // Populate dictionary options
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
  imageUpload.addEventListener('change', (e) => loadImageFromFile(e.target.files[0]));
  clearImageBtn.addEventListener('click', clearImage);
  saveImageBtn.addEventListener('click', saveCompositeImage);
  exportMarkersBtn.addEventListener('click', exportMarkers);
  importMarkersBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      importMarkers(e.target.files[0]);
    }
  });

  editorCanvas.addEventListener('mousedown', onCanvasMouseDown);
  editorCanvas.addEventListener('mousemove', onCanvasMouseMove);
  editorCanvas.addEventListener('mouseup', onCanvasMouseUp);
  editorCanvas.addEventListener('mouseleave', onCanvasMouseUp);

  bgColorPicker.addEventListener('input', drawScene);

  // Apply image resizing when user finishes editing (blur or Enter)
  [widthInput, heightInput].forEach(el => {
    el.addEventListener('blur', applyImageResize);
    el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') applyImageResize(); });
  });

  // Apply canvas resizing when user finishes editing (blur or Enter)
  [canvasWidthInput, canvasHeightInput].forEach(el => {
    el.addEventListener('blur', applyCanvasResize);
    el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') applyCanvasResize(); });
  });

  function updateDictionary(dicName) {
    currentDictionaryName = dicName;
    currentDictionary = new AR.Dictionary(dicName);
    markerIdInput.max = currentDictionary.codeList.length - 1;
    markerMaxInfo.textContent = `Max ID: ${currentDictionary.codeList.length - 1}`;
  }

  function updateMarkerIDInfo() {
    const val = parseInt(markerIdInput.value, 10);
    if (val > currentDictionary.codeList.length - 1) {
      markerIdInput.value = currentDictionary.codeList.length - 1;
    }
  }

  function addMarker(dictionaryName = currentDictionaryName, markerID = parseInt(markerIdInput.value, 10), x = 50, y = 50, size = 100) {
    if (isNaN(markerID)) return;
    if (!currentDictionary) return;

    // Markers now stored in canvas coordinates directly
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

  function loadImageFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        originalImage = img;
        currentImage = img;

        widthInput.value = img.width;
        heightInput.value = img.height;

        imageInfo.textContent = `Original Image Size: ${img.width} x ${img.height}`;
        drawScene();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    originalImage = null;
    currentImage = null;
    imageInfo.textContent = '';
    drawScene();
  }

  function drawScene() {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);

    // Set the background color
    ctx.fillStyle = bgColorPicker.value;
    ctx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);

    if (currentImage) {
      // Draw the image centered
      const imageX = (editorCanvas.width - currentImage.width) / 2;
      const imageY = (editorCanvas.height - currentImage.height) / 2;
      ctx.drawImage(currentImage, imageX, imageY);
    }

    // Markers are drawn at their absolute canvas coordinates
    markers.forEach(marker => {
      if (marker.cachedImage) {
        ctx.drawImage(marker.cachedImage, marker.x, marker.y);
      }
    });
  }

  function saveCompositeImage() {
    const formatSelect = document.getElementById('formatSelect');
  
    // Get the selected format and filename
    const format = formatSelect.value;
    let filename = 'composite';
  
    const extension = format === 'jpg' ? 'jpg' : format;
    if (!filename.endsWith(`.${extension}`)) {
      filename += `.${extension}`;
    }
  
    const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
    const dataURL = editorCanvas.toDataURL(mimeType, format === 'jpg' ? 0.92 : 1.0);
  
    // Create a download link and trigger the download
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function exportMarkers() {
    const data = {
      canvasWidth: editorCanvas.width,
      canvasHeight: editorCanvas.height,
      backgroundColor: bgColorPicker.value, // Save the background color
      markers: markers.map(m => ({
        dictionaryName: m.dictionaryName,
        arucoId: m.arucoId,
        x: m.x,
        y: m.y,
        scale: m.size,
        anchorX: m.anchorX, // Include anchorX
        anchorY: m.anchorY  // Include anchorY
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
  
        // If canvas size info is present, update canvas size
        if (typeof data.canvasWidth === 'number' && typeof data.canvasHeight === 'number') {
          editorCanvas.width = data.canvasWidth;
          editorCanvas.height = data.canvasHeight;
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
              // Create a new marker with anchorX and anchorY if present, otherwise default to 0
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
  
              // Append the marker's UI element to the marker list
              markerList.appendChild(marker.uiElement);
  
              // Restore anchor selection to ensure the grid cells are highlighted
              marker.restoreAnchorSelection();
  
              // Add the marker to the markers array
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
  
  
  
  function onCanvasMouseDown(e) {
    const rect = editorCanvas.getBoundingClientRect();
    const scaleX = editorCanvas.width / rect.width;
    const scaleY = editorCanvas.height / rect.height;

    // Mouse coordinates in canvas space
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    let selectedMarker = null;
    for (let i = markers.length - 1; i >= 0; i--) {
      const marker = markers[i];
      const mx = marker.x;
      const my = marker.y;
      const ms = marker.size;

      if (mouseX >= mx && mouseX <= mx + ms &&
          mouseY >= my && mouseY <= my + ms) {
        selectedMarker = marker;
        draggedMarker = marker;
        dragOffsetX = mouseX - mx;
        dragOffsetY = mouseY - my;
        break;
      }
    }

    // For debugging:
    console.log('MouseDown:', { mouseX, mouseY }, 'Selected Marker:', selectedMarker, 'dragOffsetX:', dragOffsetX, 'dragOffsetY:', dragOffsetY);
  }

  function onCanvasMouseMove(e) {
    if (!draggedMarker) return;

    const rect = editorCanvas.getBoundingClientRect();
    const scaleX = editorCanvas.width / rect.width;
    const scaleY = editorCanvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    draggedMarker.x = mouseX - dragOffsetX;
    draggedMarker.y = mouseY - dragOffsetY;

    // // this took a minute
    // console.log('MouseMove:', {
    //   mouseX, mouseY,
    //   markerX: draggedMarker.x,
    //   markerY: draggedMarker.y
    // });

    drawScene();
  }

  function onCanvasMouseUp() {
    if (draggedMarker) {
      draggedMarker.x = Math.round(draggedMarker.x);
      draggedMarker.y = Math.round(draggedMarker.y);
      console.log('MouseUp Final Marker Pos:', { x: draggedMarker.x, y: draggedMarker.y });
      draggedMarker.notifyUpdate();
      draggedMarker = null;
    }
  }

  function applyImageResize() {
    if (!originalImage) return;

    const newWidth = parseInt(widthInput.value, 10);
    const newHeight = parseInt(heightInput.value, 10);

    let finalWidth, finalHeight;

    if (!isNaN(newWidth) && !isNaN(newHeight)) {
      finalWidth = newWidth;
      finalHeight = newHeight;
    } else if (!isNaN(newWidth)) {
      finalWidth = newWidth;
      finalHeight = Math.round((originalImage.height / originalImage.width) * newWidth);
    } else if (!isNaN(newHeight)) {
      finalHeight = newHeight;
      finalWidth = Math.round((originalImage.width / originalImage.height) * newHeight);
    } else {
      finalWidth = Math.round(originalImage.width * scale);
      finalHeight = Math.round(originalImage.height * scale);
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = finalWidth;
    tempCanvas.height = finalHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.imageSmoothingEnabled = false;
    tempCtx.drawImage(originalImage, 0, 0, finalWidth, finalHeight);

    const resizedImage = new Image();
    resizedImage.onload = () => {
      currentImage = resizedImage;
      drawScene();
    };
    resizedImage.src = tempCanvas.toDataURL();
  }

  function applyCanvasResize() {
    const newWidth = parseInt(canvasWidthInput.value, 10);
    const newHeight = parseInt(canvasHeightInput.value, 10);

    if (!isNaN(newWidth) && !isNaN(newHeight)) {
      editorCanvas.width = newWidth;
      editorCanvas.height = newHeight;
      drawScene();
    }
  }

});
