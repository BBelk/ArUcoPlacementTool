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

  const ctx = editorCanvas.getContext('2d');

  let currentImage = null;
  let currentDictionaryName = null;
  let currentDictionary = null;
  let markers = []; // Array of MarkerObj instances

  // For dragging
  let draggedMarker = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  // Populate dictionary dropdown
  for (const dicName in AR.DICTIONARIES) {
    const option = document.createElement('option');
    option.value = dicName;
    option.textContent = dicName;
    dictionarySelect.appendChild(option);
  }

  // Select a default dictionary
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

  // Add mouse events for dragging
  editorCanvas.addEventListener('mousedown', onCanvasMouseDown);
  editorCanvas.addEventListener('mousemove', onCanvasMouseMove);
  editorCanvas.addEventListener('mouseup', onCanvasMouseUp);
  editorCanvas.addEventListener('mouseleave', onCanvasMouseUp);

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
        editorCanvas.width = img.width;
        editorCanvas.height = img.height;
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
    // Reset canvas to a default size if you want, e.g. 800x600:
    editorCanvas.width = 800;
    editorCanvas.height = 600;
    drawScene();
  }

  function drawScene() {
    // Clear canvas
    ctx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);

    if (currentImage) {
      ctx.drawImage(currentImage, 0, 0);
    } else {
      // white background if no image
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,editorCanvas.width, editorCanvas.height);
    }

    // Draw markers
    markers.forEach(marker => {
      drawMarker(marker);
    });
  }

  function drawMarker(marker) {
    // Use cachedImage to avoid flickering
    if (marker.cachedImage) {
      ctx.drawImage(marker.cachedImage, marker.x, marker.y, marker.size, marker.size);
    }
  }

  function saveCompositeImage() {
    const dataURL = editorCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'composite.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function exportMarkers() {
    if (markers.length === 0) {
      alert("No markers to export!");
      return;
    }
  
    const data = JSON.stringify(markers, null, 2); // Pretty print the JSON
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement('a');
    a.href = url;
    a.download = 'markers.json'; // Default file name
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
        if (Array.isArray(data)) {
          // Clear existing markers
          markers.forEach(m => {
            if (m.uiElement && m.uiElement.parentNode) {
              m.uiElement.parentNode.removeChild(m.uiElement);
            }
          });
          markers = [];

          // Create markers from JSON
          data.forEach(d => {
            if (d.dictionaryName && typeof d.arucoId === 'number' && typeof d.x === 'number' && typeof d.y === 'number' && typeof d.scale === 'number') {
              addMarker(d.dictionaryName, d.arucoId, d.x, d.y, d.scale);
            }
          });
        }
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  }

  // Dragging functions
  function onCanvasMouseDown(e) {
    const rect = editorCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if we clicked on a marker
    for (let i = markers.length - 1; i >= 0; i--) {
      const marker = markers[i];
      if (mouseX >= marker.x && mouseX <= marker.x + marker.size &&
          mouseY >= marker.y && mouseY <= marker.y + marker.size) {
        draggedMarker = marker;
        dragOffsetX = mouseX - marker.x;
        dragOffsetY = mouseY - marker.y;
        break;
      }
    }
  }

  function onCanvasMouseMove(e) {
    if (draggedMarker) {
      const rect = editorCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      draggedMarker.x = mouseX - dragOffsetX;
      draggedMarker.y = mouseY - dragOffsetY;
      drawScene();
    }
  }

  function onCanvasMouseUp() {
    if (draggedMarker) {
      // Update UI after drag
      draggedMarker.notifyUpdate();
      draggedMarker = null;
    }
  }

});
