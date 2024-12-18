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

  // Populate dictionary dropdown from AR.DICTIONARIES first
  // ARUCO dictionaries first
  for (const dicName in AR.DICTIONARIES) {
    const option = document.createElement('option');
    option.value = dicName;
    option.textContent = dicName;
    dictionarySelect.appendChild(option);
  }

  // Add QR_CODE at the bottom
  {
    const qrOption = document.createElement('option');
    qrOption.value = 'QR_CODE';
    qrOption.textContent = 'QR Code';
    dictionarySelect.appendChild(qrOption);
  }

  // Set default dictionary
  dictionarySelect.value = 'ARUCO_MIP_36h12';
  updateDictionary(dictionarySelect.value);

  // Event Listeners
  dictionarySelect.addEventListener('change', () => {
    updateDictionary(dictionarySelect.value);
  });

  markerIdInput.addEventListener('change', updateMarkerIDInfo);
  addMarkerBtn.addEventListener('click', () => { addMarker(); });

  imageUpload.addEventListener('change', (e) => {
    loadMultipleImagesFromFiles(e.target.files);
    e.target.value = ''; // Reset the input
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
  saveImageBtn.addEventListener('click', saveCompositeImage);
  exportMarkersBtn.addEventListener('click', exportMarkers);

  bgColorPicker.addEventListener('input', drawScene);

  [canvasWidthInput, canvasHeightInput].forEach(el => {
    el.addEventListener('input', applyCanvasResize);
    el.addEventListener('blur', applyCanvasResize);
    el.addEventListener('keydown', (ev) => { 
      if (ev.key === 'Enter') applyCanvasResize(); 
    });
  });

  function initializeCanvasSize() {
    const initialWidth = parseInt(canvasWidthInput.value, 10) || 1920;
    const initialHeight = parseInt(canvasHeightInput.value, 10) || 1080;
    editorCanvas.width = initialWidth;
    editorCanvas.height = initialHeight;
    editorCanvas.style.width = `${initialWidth}px`;
    editorCanvas.style.height = `${initialHeight}px`;
    drawScene();
  }

  function updateDictionary(dicName) {
    currentDictionaryName = dicName;
    if (dicName === 'QR_CODE') {
      currentDictionary = null;
      markerMaxInfo.textContent = 'Type text/URL for QR Code';
    } else {
      currentDictionary = new AR.Dictionary(dicName);
      markerIdInput.max = currentDictionary.codeList.length - 1;
      markerMaxInfo.textContent = `Max ID: ${currentDictionary.codeList.length - 1}`;
    }
  }

  function updateMarkerIDInfo() {
    if (currentDictionary && currentDictionary.codeList) {
      const val = parseInt(markerIdInput.value, 10);
      if (val > currentDictionary.codeList.length - 1) {
        markerIdInput.value = currentDictionary.codeList.length - 1;
      }
    }
  }

  function addMarker(dictionaryName = currentDictionaryName, markerID = markerIdInput.value, x = 50, y = 50, size = 100) {
    if (dictionaryName !== 'QR_CODE') {
      // ARUCO marker requires numeric ID
      const numID = parseInt(markerID, 10);
      if (isNaN(numID)) return;
      if (!currentDictionary) return;
      markerID = numID;
    }
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

  function loadMultipleImagesFromFiles(files) {
    [...files].forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
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

  function drawScene() {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);

    ctx.fillStyle = bgColorPicker.value;
    ctx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);

    images.forEach(io => {
      ctx.drawImage(io.image, io.x, io.y, io.width, io.height);
    });

    markers.forEach(marker => {
      if (marker.cachedImage) {
        ctx.drawImage(marker.cachedImage, marker.x, marker.y);
      }
    });
  }

  function saveCompositeImage() {
    const formatSelect = document.getElementById('formatSelect');
    const format = formatSelect.value;
    let filename = 'composite';
    const extension = format === 'jpg' ? 'jpg' : format;
    if (!filename.endsWith(`.${extension}`)) {
      filename += `.${extension}`;
    }

    const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
    const quality = format === 'jpg' ? 0.92 : 1.0;
    const dataURL = editorCanvas.toDataURL(mimeType, quality);

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
      backgroundColor: bgColorPicker.value,
      markers: markers.map(m => m.toJSON())
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

        markers.forEach(m => {
          if (m.uiElement && m.uiElement.parentNode) {
            m.uiElement.parentNode.removeChild(m.uiElement);
          }
        });
        markers = [];

        if (typeof data.canvasWidth === 'number' && typeof data.canvasHeight === 'number') {
          editorCanvas.width = data.canvasWidth;
          editorCanvas.height = data.canvasHeight;
          editorCanvas.style.width = `${data.canvasWidth}px`;
          editorCanvas.style.height = `${data.canvasHeight}px`;
          canvasWidthInput.value = data.canvasWidth;
          canvasHeightInput.value = data.canvasHeight;
        }

        if (data.backgroundColor) {
          bgColorPicker.value = data.backgroundColor;
        }

        if (Array.isArray(data.markers)) {
          data.markers.forEach(d => {
            if (
              d.dictionaryName &&
              (typeof d.arucoId === 'number' || typeof d.arucoId === 'string') &&
              typeof d.x === 'number' &&
              typeof d.y === 'number' &&
              typeof d.scale === 'number'
            ) {
              const marker = new MarkerObj(
                d.dictionaryName,
                d.dictionaryName === 'QR_CODE' ? String(d.arucoId) : d.arucoId,
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

  function onCanvasMouseDown(e) {
    const rect = editorCanvas.getBoundingClientRect();
    const scaleX = editorCanvas.width / rect.width;
    const scaleY = editorCanvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    draggedMarker = null;
    draggedImage = null;

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
        return;
      }
    }

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
  }

  function onCanvasMouseMove(e) {
    if (!draggedMarker && !draggedImage) return;

    const rect = editorCanvas.getBoundingClientRect();
    const scaleX = editorCanvas.width / rect.width;
    const scaleY = editorCanvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (draggedMarker) {
      draggedMarker.x = mouseX - dragOffsetX;
      draggedMarker.y = mouseY - dragOffsetY;
    }

    if (draggedImage) {
      draggedImage.x = mouseX - dragOffsetX;
      draggedImage.y = mouseY - dragOffsetY;
    }

    drawScene();
  }

  function onCanvasMouseUp() {
    if (draggedMarker) {
      draggedMarker.x = Math.round(draggedMarker.x);
      draggedMarker.y = Math.round(draggedMarker.y);
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

  function applyCanvasResize() {
    const newWidth = parseInt(canvasWidthInput.value, 10);
    const newHeight = parseInt(canvasHeightInput.value, 10);

    if (!isNaN(newWidth) && !isNaN(newHeight)) {
      editorCanvas.width = newWidth;
      editorCanvas.height = newHeight;
      editorCanvas.style.width = `${newWidth}px`;
      editorCanvas.style.height = `${newHeight}px`;
      drawScene();
    }
  }

  initializeCanvasSize();
});
