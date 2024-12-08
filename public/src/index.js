// editor.js

document.addEventListener('DOMContentLoaded', () => {
    const dictionarySelect = document.getElementById('dictionarySelect');
    const markerIdInput = document.getElementById('markerIdInput');
    const markerMaxInfo = document.getElementById('markerMaxInfo');
    const addMarkerBtn = document.getElementById('addMarkerBtn');
    const markerList = document.getElementById('markerList');
    const imageUpload = document.getElementById('imageUpload');
    const editorCanvas = document.getElementById('editorCanvas');
    const saveImageBtn = document.getElementById('saveImageBtn');
  
    const ctx = editorCanvas.getContext('2d');
  
    let currentImage = null;
    let currentDictionaryName = null;
    let currentDictionary = null;
    let markers = []; // Array of {id: number, dictionary: string, x: number, y: number, svgData: string}
  
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
  
    saveImageBtn.addEventListener('click', () => {
      saveCompositeImage();
    });
  
    function updateDictionary(dicName) {
      currentDictionaryName = dicName;
      currentDictionary = new AR.Dictionary(dicName);
      markerIdInput.max = currentDictionary.codeList.length - 1;
      markerMaxInfo.textContent = `Max ID: ${currentDictionary.codeList.length - 1}`;
    }
  
    function updateMarkerIDInfo() {
      // Just ensures marker ID is within range
      const val = parseInt(markerIdInput.value, 10);
      if (val > currentDictionary.codeList.length - 1) {
        markerIdInput.value = currentDictionary.codeList.length - 1;
      }
    }
  
    function addMarker() {
      const markerID = parseInt(markerIdInput.value, 10);
      if (isNaN(markerID)) return;
      if (!currentDictionary) return;
  
      const svgData = currentDictionary.generateSVG(markerID);
  
      // For now, place the marker at a default position, say (50, 50).
      // Later, we can implement dragging to reposition.
      const markerObj = {
        id: markerID,
        dictionary: currentDictionaryName,
        x: 50,
        y: 50,
        svgData: svgData
      };
      markers.push(markerObj);
  
      const li = document.createElement('li');
      li.textContent = `${currentDictionaryName} ID:${markerID}`;
      markerList.appendChild(li);
  
      drawScene();
    }
  
    function loadImageFromFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          currentImage = img;
          editorCanvas.width = img.width;
          editorCanvas.height = img.height;
          drawScene();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  
    function drawScene() {
      // Clear canvas
      ctx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
  
      // Draw image if loaded
      if (currentImage) {
        ctx.drawImage(currentImage, 0, 0);
      }
  
      // Draw markers
      markers.forEach(marker => {
        drawMarker(marker);
      });
    }
  
    function drawMarker(marker) {
      // We have SVG data from `marker.svgData`. We need it as an image to draw on canvas.
      // One approach: create an offscreen Image object from the SVG data URL.
      const svgBlob = new Blob([marker.svgData], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
  
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, marker.x, marker.y, 100, 100); // Just assume 100x100 for now.
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  
    function saveCompositeImage() {
      // The canvas already has our final composition.
      // Just download it as a PNG.
      const dataURL = editorCanvas.toDataURL('image/png');
  
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = 'composite.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  });
  