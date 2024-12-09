class MarkerObj {
    constructor(arucoDictionary, arucoId, x, y, size, onUpdate, onDelete) {
      this.dictionaryName = arucoDictionary;
      this.arucoId = arucoId;
      this.x = x;
      this.y = y;
      this.size = size; // Actual pixel size
      this.onUpdate = onUpdate;
      this.onDelete = onDelete;
  
      this.svgData = this.generateSVG();
      this.cachedImage = null;
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
  
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-button';
      deleteBtn.textContent = 'X';
      deleteBtn.addEventListener('click', () => {
        if (typeof this.onDelete === 'function') {
          this.onDelete(this);
        }
      });
      container.appendChild(deleteBtn);
  
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
  
      // Size (px)
      const scaleRow = document.createElement('div');
      scaleRow.className = 'marker-row';
      const scaleLabel = document.createElement('label');
      scaleLabel.textContent = 'Size (px):';
      const scaleInput = document.createElement('input');
      scaleInput.type = 'number';
      scaleInput.value = this.size;
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
          this.size = val;
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
      const svgBlob = new Blob([this.svgData], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        this.cachedImage = img;
        if (this.imgEl) {
          this.imgEl.src = url;
        }
        // Once the image is ready, notify update to trigger a redraw
        this.notifyUpdate();
      };
      img.src = url;
    }
  
    regenerateMarker() {
      try {
        const dic = new AR.Dictionary(this.dictionaryName);
        if (this.arucoId > dic.codeList.length - 1) {
          this.arucoId = dic.codeList.length - 1;
          this.idInput.value = this.arucoId;
        }
        this.svgData = dic.generateSVG(this.arucoId);
        this.updateImage();
        // do not call notifyUpdate() here, updateImage() will call it after image load
      } catch (e) {
        alert(e);
      }
    }
  
    notifyUpdate() {
      // Update UI fields to reflect actual marker state
      this.xInput.value = this.x;
      this.yInput.value = this.y;
      this.scaleInput.value = this.size;
      this.idInput.value = this.arucoId;
      this.dictSelect.value = this.dictionaryName;
  
      if (typeof this.onUpdate === 'function') {
        this.onUpdate();
      }
    }
  
    toJSON() {
      return {
        dictionaryName: this.dictionaryName,
        arucoId: this.arucoId,
        x: this.x,
        y: this.y,
        scale: this.size
      };
    }
  }
  