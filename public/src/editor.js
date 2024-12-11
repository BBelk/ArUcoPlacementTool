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
  let markers = [];

  let draggedMarker = null;
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
        editorCanvas.width = Math.round(img.width);
        editorCanvas.height = Math.round(img.height);
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
    editorCanvas.width = 800;
    editorCanvas.height = 600;
    drawScene();
  }

  function drawScene() {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);

    if (currentImage) {
      ctx.drawImage(currentImage, 0, 0);
    } else {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,editorCanvas.width, editorCanvas.height);
    }

    markers.forEach(marker => {
      drawMarker(marker);
    });
  }

  function drawMarker(marker) {
    const drawX = marker.x|0;
    const drawY = marker.y|0;
    if (marker.cachedImage) {
      ctx.drawImage(marker.cachedImage, drawX, drawY);
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
  
    const data = JSON.stringify(markers, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
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
        if (Array.isArray(data)) {
          markers.forEach(m => {
            if (m.uiElement && m.uiElement.parentNode) {
              m.uiElement.parentNode.removeChild(m.uiElement);
            }
          });
          markers = [];

          data.forEach(d => {
            if (d.dictionaryName && typeof d.arucoId === 'number' && typeof d.x === 'number' && typeof d.y === 'number' && typeof d.scale === 'number') {
              addMarker(d.dictionaryName, d.arucoId, Math.round(d.x), Math.round(d.y), Math.round(d.scale));
            }
          });
        }
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
      const mx = marker.x|0;
      const my = marker.y|0;
      const ms = marker.size|0;

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

});
