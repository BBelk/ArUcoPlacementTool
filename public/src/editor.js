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

  const scaleInput = document.getElementById('scaleInput');
  const widthInput = document.getElementById('widthInput');
  const heightInput = document.getElementById('heightInput');
  const bgColorPicker = document.getElementById('bgColorPicker');

  const canvasWidthInput = document.getElementById('canvasWidthInput');
  const canvasHeightInput = document.getElementById('canvasHeightInput');
  const updateCanvasSizeBtn = document.getElementById('updateCanvasSizeBtn');

  const ctx = editorCanvas.getContext('2d');

  let currentImage = null;
  let currentDictionaryName = null;
  let currentDictionary = null;
  let markers = [];

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

  markerIdInput.addEventListener('change', () => {
    updateMarkerIDInfo();
  });

  addMarkerBtn.addEventListener('click', () => {
    addMarker();
  });

  imageUpload.addEventListener('change', (e) => {
    loadImageFromFile(e.target.files[0]);
  });

  clearImageBtn.addEventListener('click', () => {
    clearImage();
  });

  saveImageBtn.addEventListener('click', () => {
    saveCompositeImage();
  });

  exportMarkersBtn.addEventListener('click', () => {
    exportMarkers();
  });

  importMarkersBtn.addEventListener('click', () => {
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

  scaleInput.addEventListener('input', resizeImage);
  widthInput.addEventListener('input', resizeImage);
  heightInput.addEventListener('input', resizeImage);
  bgColorPicker.addEventListener('input', drawScene);

  updateCanvasSizeBtn.addEventListener('click', updateCanvasSize);

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
        currentImage = img;
        imageInfo.textContent = `Image Size: ${img.width} x ${img.height}`;
        drawScene();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    currentImage = null;
    imageInfo.textContent = '';
    drawScene();
  }

  function updateCanvasSize() {
    const newWidth = parseInt(canvasWidthInput.value, 10);
    const newHeight = parseInt(canvasHeightInput.value, 10);

    if (!isNaN(newWidth) && !isNaN(newHeight)) {
      editorCanvas.width = newWidth;
      editorCanvas.height = newHeight;
      drawScene();
    }
  }

  function drawScene() {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);

    // Set the background color
    ctx.fillStyle = bgColorPicker.value;
    ctx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);

    if (currentImage) {
      // Center the image
      const imageX = (editorCanvas.width - currentImage.width) / 2;
      const imageY = (editorCanvas.height - currentImage.height) / 2;
      ctx.drawImage(currentImage, imageX, imageY);
    }

    markers.forEach(marker => {
      drawMarker(marker);
    });
  }

  function drawMarker(marker) {
    if (marker.cachedImage) {
      const drawX = Math.round(marker.x);
      const drawY = Math.round(marker.y);
      ctx.drawImage(marker.cachedImage, drawX, drawY);
    }
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
    // Include canvas size in the exported data
    const data = {
      canvasWidth: editorCanvas.width,
      canvasHeight: editorCanvas.height,
      markers: markers.map(m => ({
        dictionaryName: m.dictionaryName,
        arucoId: m.arucoId,
        x: m.x,
        y: m.y,
        scale: m.size
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

        if (Array.isArray(data.markers)) {
          data.markers.forEach(d => {
            if (d.dictionaryName && typeof d.arucoId === 'number' && typeof d.x === 'number' && typeof d.y === 'number' && typeof d.scale === 'number') {
              addMarker(d.dictionaryName, d.arucoId, Math.round(d.x), Math.round(d.y), Math.round(d.scale));
            }
          });
        }

        drawScene();
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  }

  function onCanvasMouseDown(e) {
    const rect = editorCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let i = markers.length - 1; i >= 0; i--) {
      const marker = markers[i];
      const mx = Math.round(marker.x);
      const my = Math.round(marker.y);
      const ms = Math.round(marker.size);

      if (mouseX >= mx && mouseX <= mx + ms &&
          mouseY >= my && mouseY <= my + ms) {
        draggedMarker = marker;
        dragOffsetX = mouseX - mx;
        dragOffsetY = mouseY - my;
        break;
      }
    }
  }

  function onCanvasMouseMove(e) {
    if (draggedMarker) {
      const rect = editorCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      draggedMarker.x = Math.round(mouseX - dragOffsetX);
      draggedMarker.y = Math.round(mouseY - dragOffsetY);
      drawScene();
    }
  }

  function onCanvasMouseUp() {
    if (draggedMarker) {
      draggedMarker.x = Math.round(draggedMarker.x);
      draggedMarker.y = Math.round(draggedMarker.y);
      draggedMarker.notifyUpdate();
      draggedMarker = null;
    }
  }

  function resizeImage() {
    if (!currentImage) return;

    const scale = parseFloat(scaleInput.value) / 100;
    const newWidth = parseInt(widthInput.value, 10);
    const newHeight = parseInt(heightInput.value, 10);

    let finalWidth = currentImage.width;
    let finalHeight = currentImage.height;

    if (!isNaN(newWidth) && !isNaN(newHeight)) {
      finalWidth = newWidth;
      finalHeight = newHeight;
    } else if (!isNaN(newWidth)) {
      finalWidth = newWidth;
      finalHeight = Math.round((currentImage.height / currentImage.width) * newWidth);
    } else if (!isNaN(newHeight)) {
      finalHeight = newHeight;
      finalWidth = Math.round((currentImage.width / currentImage.height) * newHeight);
    } else {
      finalWidth = Math.round(currentImage.width * scale);
      finalHeight = Math.round(currentImage.height * scale);
    }

    // Create a temporary canvas to resize the image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = finalWidth;
    tempCanvas.height = finalHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.imageSmoothingEnabled = false;
    tempCtx.drawImage(currentImage, 0, 0, finalWidth, finalHeight);

    const resizedImage = new Image();
    resizedImage.onload = () => {
      currentImage = resizedImage;
      drawScene();
    };
    resizedImage.src = tempCanvas.toDataURL();

    imageInfo.textContent = `Image Size: ${finalWidth} x ${finalHeight}`;
  }

});
