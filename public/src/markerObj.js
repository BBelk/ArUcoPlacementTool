class MarkerObj {
  constructor(arucoDictionary, arucoId, x, y, size, onUpdate, onDelete) {
    this.dictionaryName = arucoDictionary;
    this.arucoId = arucoId|0;
    this.x = x|0;
    this.y = y|0;
    this.size = size|0;
    this.onUpdate = onUpdate;
    this.onDelete = onDelete;

    this.cachedImage = null;
    this.uiElement = this.createUI();
    this.currentMarkSize = null;
    this.regenerateMarker();
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

    // X and Y on the same row
    const xyRow = document.createElement('div');
    xyRow.className = 'marker-row';
    xyRow.style.gap = '5px';

    const xContainer = document.createElement('div');
    xContainer.style.flex = '1';
    const xLabel = document.createElement('label');
    xLabel.textContent = 'X:';
    const xInput = document.createElement('input');
    xInput.type = 'number';
    xInput.value = this.x;
    xContainer.appendChild(xLabel);
    xContainer.appendChild(xInput);

    const yContainer = document.createElement('div');
    yContainer.style.flex = '1';
    const yLabel = document.createElement('label');
    yLabel.textContent = 'Y:';
    const yInput = document.createElement('input');
    yInput.type = 'number';
    yInput.value = this.y;
    yContainer.appendChild(yLabel);
    yContainer.appendChild(yInput);

    xyRow.appendChild(xContainer);
    xyRow.appendChild(yContainer);
    container.appendChild(xyRow);

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

    const imgContainer = document.createElement('div');
    imgContainer.className = 'marker-image';
    const imgEl = document.createElement('img');
    imgContainer.appendChild(imgEl);
    container.appendChild(imgContainer);

    dictSelect.addEventListener('change', () => {
      this.dictionaryName = dictSelect.value;
      this.regenerateMarker();
    });

    idInput.addEventListener('change', () => {
      const val = parseInt(idInput.value, 10);
      if (!isNaN(val)) {
        this.arucoId = val|0;
        this.regenerateMarker();
      }
    });

    xInput.addEventListener('change', () => {
      const val = parseInt(xInput.value, 10);
      if (!isNaN(val)) {
        this.x = val|0;
        this.notifyUpdate();
      }
    });

    yInput.addEventListener('change', () => {
      const val = parseInt(yInput.value, 10);
      if (!isNaN(val)) {
        this.y = val|0;
        this.notifyUpdate();
      }
    });

    scaleInput.addEventListener('keydown', (e) => {
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && this.currentMarkSize) {
        const val = parseInt(scaleInput.value, 10);
        if (!isNaN(val)) {
          const snapped = this.snapToMultiple(val, this.currentMarkSize);
          if (snapped !== val) {
            scaleInput.value = snapped;
          }
          this.size = snapped;
          this.regenerateMarker();
        }
      }
    });
    
    // Handle blur or enter key (change event) for typed values
    scaleInput.addEventListener('change', () => {
      if (this.currentMarkSize) {
        const val = parseInt(scaleInput.value, 10);
        if (!isNaN(val)) {
          const snapped = this.snapToMultiple(val, this.currentMarkSize);
          if (snapped !== val) {
            scaleInput.value = snapped;
          }
          this.size = snapped;
          this.regenerateMarker();
        }
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

  snapToMultiple(value, multipleOf) {
    const ratio = value / multipleOf;
    const nearest = Math.round(ratio)*multipleOf;
    return nearest < 1 ? multipleOf : nearest; // ensure at least one cell
  }

  regenerateMarker() {
    try {
      const dic = new AR.Dictionary(this.dictionaryName);
      if (this.arucoId > dic.codeList.length - 1) {
        this.arucoId = dic.codeList.length - 1;
        this.idInput.value = this.arucoId;
      }

      const markSize = dic.markSize;
      this.currentMarkSize = markSize;
      this.scaleInput.step = markSize;

      const snapped = this.snapToMultiple(this.size, markSize);
      if (snapped !== this.size) {
        this.size = snapped;
        this.scaleInput.value = this.size;
      }

      const code = dic.codeList[this.arucoId];

      const cellSize = this.size / markSize;
      const offCanvas = document.createElement('canvas');
      offCanvas.width = this.size|0;
      offCanvas.height = this.size|0;
      const offCtx = offCanvas.getContext('2d');
      offCtx.imageSmoothingEnabled = false;
      offCtx.fillStyle = 'white';
      offCtx.fillRect(0,0,offCanvas.width,offCanvas.height);

      // borders black
      offCtx.fillStyle = 'black';
      // top border
      offCtx.fillRect(0,0,this.size, cellSize);
      // bottom border
      offCtx.fillRect(0,(markSize-1)*cellSize,this.size, cellSize);
      // left border
      offCtx.fillRect(0,0,cellSize,this.size);
      // right border
      offCtx.fillRect((markSize-1)*cellSize,0,cellSize,this.size);

      const innerSize = markSize - 2;
      for (let iy = 0; iy < innerSize; iy++) {
        for (let ix = 0; ix < innerSize; ix++) {
          const bit = code[iy*innerSize + ix];
          if (bit === '0') {
            offCtx.fillStyle = 'black';
            offCtx.fillRect((ix+1)*cellSize,(iy+1)*cellSize,cellSize,cellSize);
          }
        }
      }

      const dataURL = offCanvas.toDataURL('image/png');
      const img = new Image();
      img.onload = () => {
        this.cachedImage = img;
        if (this.imgEl) {
          this.imgEl.src = dataURL;
        }
        this.notifyUpdate();
      };
      img.src = dataURL;

    } catch (e) {
      alert(e);
    }
  }

  notifyUpdate() {
    this.x = this.x|0;
    this.y = this.y|0;
    this.size = this.size|0;
    this.arucoId = this.arucoId|0;

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
      arucoId: this.arucoId|0,
      x: this.x|0,
      y: this.y|0,
      scale: this.size|0
    };
  }
}
