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
  let markers = []; // Array of MarkerObj instances

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
    const val = parseInt(markerIdInput.value, 10);
    if (val > currentDictionary.codeList.length - 1) {
      markerIdInput.value = currentDictionary.codeList.length - 1;
    }
  }

  function addMarker() {
    const markerID = parseInt(markerIdInput.value, 10);
    if (isNaN(markerID)) return;
    if (!currentDictionary) return;

    // Create a new MarkerObj instance
    const marker = new MarkerObj(
      currentDictionaryName, 
      markerID, 
      50,   // default x
      50,   // default y
      1.0,  // default scale
      () => {
        // onUpdate callback: redraw the scene whenever marker changes
        drawScene();
      }
    );
    markers.push(marker);

    // Add its UI panel to the markerList
    markerList.appendChild(marker.uiElement);

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
    // Convert SVG data to an Image and draw at marker.x, marker.y with scaling
    const svgBlob = new Blob([marker.svgData], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const size = 100 * marker.scale; 
      ctx.drawImage(img, marker.x, marker.y, size, size);
      URL.revokeObjectURL(url);
    };
    img.src = url;
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
});
