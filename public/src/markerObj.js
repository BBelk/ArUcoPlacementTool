class MarkerObj {
    constructor(arucoDictionary, arucoId, x, y, scale, onUpdate) {
      this.dictionaryName = arucoDictionary;
      this.arucoId = arucoId;
      this.x = x;
      this.y = y;
      this.scale = scale;
      this.onUpdate = onUpdate; // callback to notify editor when something changes
  
      this.svgData = this.generateSVG();
      this.uiElement = this.createUI();
      this.updateImage();
    }
  
    generateSVG() {
      const dic = new AR.Dictionary(this.dictionaryName);
      return dic.generateSVG(this.arucoId);
    }
  
    createUI() {
      const container = document.createElement('div');
      container.className = 'marker-panel';
  
      const title = document.createElement('h4');
      title.textContent = 'Marker';
      container.appendChild(title);
  
      // Dictionary select
      const dictionaryRow = document.createElement('div');
      dictionaryRow.className = 'marker-row';
      const dictLabel = document.createElement('label');
      dictLabel.textContent = 'Dict:';
      const dictSelect = document.createElement('select');
      for (const dicName in AR.DICTIONARIES) {
        const opt = document.createElement('option');
        opt.value = dicName;
        opt.textContent = dicName;
        if (dicName === this.dictionaryName) {
          opt.selected = true;
        }
        dictSelect.appendChild(opt);
      }
      dictionaryRow.appendChild(dictLabel);
      dictionaryRow.appendChild(dictSelect);
      container.appendChild(dictionaryRow);
  
      // ID input
      const idRow = document.createElement('div');
      idRow.className = 'marker-row';
      const idLabel = document.createElement('label');
      idLabel.textContent = 'ID:';
      const idInput = document.createElement('input');
      idInput.type = 'number';
      idInput.value = this.arucoId;
      idRow.appendChild(idLabel);
      idRow.appendChild(idInput);
      container.appendChild(idRow);
  
      // Position X
      const xRow = document.createElement('div');
      xRow.className = 'marker-row';
      const xLabel = document.createElement('label');
      xLabel.textContent = 'X:';
      const xInput = document.createElement('input');
      xInput.type = 'number';
      xInput.value = this.x;
      xRow.appendChild(xLabel);
      xRow.appendChild(xInput);
      container.appendChild(xRow);
  
      // Position Y
      const yRow = document.createElement('div');
      yRow.className = 'marker-row';
      const yLabel = document.createElement('label');
      yLabel.textContent = 'Y:';
      const yInput = document.createElement('input');
      yInput.type = 'number';
      yInput.value = this.y;
      yRow.appendChild(yLabel);
      yRow.appendChild(yInput);
      container.appendChild(yRow);
  
      // Scale
      const scaleRow = document.createElement('div');
      scaleRow.className = 'marker-row';
      const scaleLabel = document.createElement('label');
      scaleLabel.textContent = 'Scale:';
      const scaleInput = document.createElement('input');
      scaleInput.type = 'number';
      scaleInput.step = '0.1';
      scaleInput.value = this.scale;
      scaleRow.appendChild(scaleLabel);
      scaleRow.appendChild(scaleInput);
      container.appendChild(scaleRow);
  
      // Marker image preview
      const imgContainer = document.createElement('div');
      imgContainer.className = 'marker-image';
      const imgEl = document.createElement('img');
      imgContainer.appendChild(imgEl);
      container.appendChild(imgContainer);
  
      // Event listeners
      dictSelect.addEventListener('change', () => {
        this.dictionaryName = dictSelect.value;
        this.regenerateMarker();
      });
  
      idInput.addEventListener('change', () => {
        const val = parseInt(idInput.value, 10);
        if (!isNaN(val)) {
          this.arucoId = val;
          this.regenerateMarker();
        }
      });
  
      xInput.addEventListener('change', () => {
        const val = parseFloat(xInput.value);
        if (!isNaN(val)) {
          this.x = val;
          this.notifyUpdate();
        }
      });
  
      yInput.addEventListener('change', () => {
        const val = parseFloat(yInput.value);
        if (!isNaN(val)) {
          this.y = val;
          this.notifyUpdate();
        }
      });
  
      scaleInput.addEventListener('change', () => {
        const val = parseFloat(scaleInput.value);
        if (!isNaN(val)) {
          this.scale = val;
          this.notifyUpdate();
        }
      });
  
      this.imgEl = imgEl;
      this.dictSelect = dictSelect;
      this.idInput = idInput;
      this.xInput = xInput;
      this.yInput = yInput;
      this.scaleInput = scaleInput;
  
      return container;
    }
  
    updateImage() {
      // Update the preview image from this.svgData
      const svgBlob = new Blob([this.svgData], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        if (this.imgEl) {
          this.imgEl.src = url;
        }
        // We won't revoke the URL immediately since we want to keep the image visible
        // In a production scenario, we might store a dataURL or handle it differently.
      };
      img.src = url;
    }
  
    regenerateMarker() {
      try {
        const dic = new AR.Dictionary(this.dictionaryName);
        if (this.arucoId > dic.codeList.length - 1) {
          // If the ID is out of range, clamp it
          this.arucoId = dic.codeList.length - 1;
          this.idInput.value = this.arucoId;
        }
        this.svgData = dic.generateSVG(this.arucoId);
        this.updateImage();
        this.notifyUpdate();
      } catch (e) {
        alert(e);
      }
    }
  
    notifyUpdate() {
      if (typeof this.onUpdate === 'function') {
        this.onUpdate();
      }
    }
  }
  