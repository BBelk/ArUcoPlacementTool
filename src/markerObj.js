class MarkerObj {
  constructor(arucoDictionary, arucoId, x, y, size, onUpdate, onDelete, anchorX = 0, anchorY = 0) {
    this.dictionaryName = arucoDictionary;
    this.arucoId = arucoId | 0;

    // Internal storage: always top-left corner
    this.x = x | 0;
    this.y = y | 0;
    this.size = size | 0;
    this.onUpdate = onUpdate;
    this.onDelete = onDelete;

    this.anchorX = typeof anchorX === 'number' ? anchorX : 0;
    this.anchorY = typeof anchorY === 'number' ? anchorY : 0;

    this.cachedImage = null;
    this.uiElement = this.createUI();
    this.currentMarkSize = null;
    this.regenerateMarker();
    this.updateUIFields();
  }

  createUI() {
    const container = document.createElement('div');
    container.className = 'marker-panel';

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-button';
    deleteBtn.textContent = 'X';
    deleteBtn.addEventListener('click', () => {
      if (typeof this.onDelete === 'function') {
        this.onDelete(this);
      }
    });
    container.appendChild(deleteBtn);

    // Title
    const title = document.createElement('h4');
    title.textContent = 'Marker';
    container.appendChild(title);

    // Dictionary row
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

    // ID row
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

    // X, Y row
    const xyRow = document.createElement('div');
    xyRow.className = 'marker-row';
    xyRow.style.gap = '5px';

    const xContainer = document.createElement('div');
    xContainer.style.flex = '1';
    const xLabel = document.createElement('label');
    xLabel.textContent = 'X:';
    const xInput = document.createElement('input');
    xInput.type = 'number';
    xInput.value = this.x + this.anchorX * this.size; // Displayed X based on anchor
    xContainer.appendChild(xLabel);
    xContainer.appendChild(xInput);

    const yContainer = document.createElement('div');
    yContainer.style.flex = '1';
    const yLabel = document.createElement('label');
    yLabel.textContent = 'Y:';
    const yInput = document.createElement('input');
    yInput.type = 'number';
    yInput.value = this.y + this.anchorY * this.size; // Displayed Y based on anchor
    yContainer.appendChild(yLabel);
    yContainer.appendChild(yInput);

    xyRow.appendChild(xContainer);
    xyRow.appendChild(yContainer);
    container.appendChild(xyRow);

    // Scale row
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

    // Anchor row
    const anchorRow = document.createElement('div');
    anchorRow.className = 'marker-row';
    const anchorLabel = document.createElement('label');
    anchorLabel.textContent = 'Anchor:';
    anchorRow.appendChild(anchorLabel);

    // Container for the anchor grid and image preview to display them side by side
    const anchorContainer = document.createElement('div');
    anchorContainer.style.display = 'flex';
    anchorContainer.style.alignItems = 'center';
    anchorContainer.style.gap = '10px'; // 10-pixel gap between grid and image

    const anchorGrid = document.createElement('div');
    anchorGrid.style.display = 'grid';
    anchorGrid.style.gridTemplateColumns = 'repeat(3, 15px)';
    anchorGrid.style.gridTemplateRows = 'repeat(3, 15px)';
    anchorGrid.style.gap = '2px';
    anchorGrid.style.cursor = 'pointer';

    const anchorPoints = [
      { ax: 0, ay: 0 },
      { ax: 0.5, ay: 0 },
      { ax: 1, ay: 0 },
      { ax: 0, ay: 0.5 },
      { ax: 0.5, ay: 0.5 },
      { ax: 1, ay: 0.5 },
      { ax: 0, ay: 1 },
      { ax: 0.5, ay: 1 },
      { ax: 1, ay: 1 },
    ];

    const anchorCells = [];
    anchorPoints.forEach(pt => {
      const cell = document.createElement('div');
      cell.style.width = '15px';
      cell.style.height = '15px';
      cell.style.border = '1px solid #333';
      cell.style.background = (pt.ax === this.anchorX && pt.ay === this.anchorY) ? '#ddd' : '#fff';

      cell.addEventListener('click', () => {
        const oldAnchorX = this.anchorX;
        const oldAnchorY = this.anchorY;
        this.anchorX = pt.ax;
        this.anchorY = pt.ay;
        this.highlightAnchorCell(anchorCells, pt.ax, pt.ay);
        // this.adjustPositionForAnchorChange(oldAnchorX, oldAnchorY, this.anchorX, this.anchorY);
        this.updateUIFields();
        this.regenerateMarker();
      });
      

      anchorCells.push({ cell: cell, ax: pt.ax, ay: pt.ay });
      anchorGrid.appendChild(cell);
    });

    // Image preview
    const imgContainer = document.createElement('div');
    imgContainer.className = 'marker-image';
    const imgEl = document.createElement('img');
    imgContainer.appendChild(imgEl);

    // Append the grid and image to the container
    anchorContainer.appendChild(anchorGrid);
    anchorContainer.appendChild(imgContainer);

    // Add the container to the anchor row
    anchorRow.appendChild(anchorContainer);
    container.appendChild(anchorRow);

    // Image preview
    const imageContainer = document.createElement('div');
    imageContainer.className = 'marker-image';
    const imageEl = document.createElement('img');
    imageContainer.appendChild(imageEl);
    container.appendChild(imageContainer);

    // Event listeners
    dictSelect.addEventListener('change', () => {
      this.dictionaryName = dictSelect.value;
      this.regenerateMarker();
    });

    idInput.addEventListener('change', () => {
      const val = parseInt(idInput.value, 10);
      if (!isNaN(val)) {
        this.arucoId = val | 0;
        this.regenerateMarker();
      }
    });

    xInput.addEventListener('change', () => {
      const val = parseInt(xInput.value, 10);
      if (!isNaN(val)) {
        const displayedX = val;
        this.x = displayedX - this.anchorX * this.size;
        this.notifyUpdate();
      }
    });

    yInput.addEventListener('change', () => {
      const val = parseInt(yInput.value, 10);
      if (!isNaN(val)) {
        const displayedY = val;
        this.y = displayedY - this.anchorY * this.size;
        this.notifyUpdate();
      }
    });

    // Restore snapping logic
    scaleInput.addEventListener('keydown', (e) => {
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && this.currentMarkSize) {
        const val = parseInt(scaleInput.value, 10);
        if (!isNaN(val)) {
          const snapped = this.snapToMultiple(val, this.currentMarkSize);
          if (snapped !== val) {
            scaleInput.value = snapped;
          }
          const oldSize = this.size;
          this.size = snapped;
          this.adjustPositionForScale(oldSize, this.size);
          this.regenerateMarker();
        }
      }
    });

    scaleInput.addEventListener('change', () => {
      if (this.currentMarkSize) {
        const val = parseInt(scaleInput.value, 10);
        if (!isNaN(val)) {
          const snapped = this.snapToMultiple(val, this.currentMarkSize);
          if (snapped !== val) {
            scaleInput.value = snapped;
          }
          const oldSize = this.size;
          this.size = snapped;
          this.adjustPositionForScale(oldSize, this.size);
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
    this.anchorCells = anchorCells;

    return container;
  }

  snapToMultiple(value, multipleOf) {
    const ratio = value / multipleOf;
    const nearest = Math.round(ratio) * multipleOf;
    return nearest < multipleOf ? multipleOf : nearest; // ensure at least one cell
  }

  adjustPositionForAnchorChange(oldAnchorX, oldAnchorY, newAnchorX, newAnchorY) {
    // Calculate the shift needed to keep the anchor point fixed
    const deltaX = (oldAnchorX - newAnchorX) * this.size;
    const deltaY = (oldAnchorY - newAnchorY) * this.size;
    this.x += deltaX;
    this.y += deltaY;
  }

  adjustPositionForScale(oldSize, newSize) {
    // Adjust position based on the change in size and current anchor
    const deltaSize = newSize - oldSize;
    this.x -= this.anchorX * deltaSize;
    this.y -= this.anchorY * deltaSize;
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

      // Set step to markSize like old version
      this.scaleInput.step = markSize;

      const snapped = this.snapToMultiple(this.size, markSize);
      if (snapped !== this.size) {
        const oldSize = this.size;
        this.size = snapped;
        this.scaleInput.value = this.size;
        this.adjustPositionForScale(oldSize, this.size);
      }

      const code = dic.codeList[this.arucoId];
      const cellSize = this.size / markSize;
      const offCanvas = document.createElement('canvas');
      offCanvas.width = this.size | 0;
      offCanvas.height = this.size | 0;
      const offCtx = offCanvas.getContext('2d');
      offCtx.imageSmoothingEnabled = false;
      offCtx.fillStyle = 'white';
      offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

      // Borders black
      offCtx.fillStyle = 'black';
      offCtx.fillRect(0, 0, this.size, cellSize);
      offCtx.fillRect(0, (markSize - 1) * cellSize, this.size, cellSize);
      offCtx.fillRect(0, 0, cellSize, this.size);
      offCtx.fillRect((markSize - 1) * cellSize, 0, cellSize, this.size);

      const innerSize = markSize - 2;
      for (let iy = 0; iy < innerSize; iy++) {
        for (let ix = 0; ix < innerSize; ix++) {
          const bit = code[iy * innerSize + ix];
          if (bit === '0') {
            offCtx.fillStyle = 'black';
            offCtx.fillRect((ix + 1) * cellSize, (iy + 1) * cellSize, cellSize, cellSize);
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
        // After regenerating, update fields and notify
        this.updateUIFields();
        this.notifyUpdate();
      };
      img.src = dataURL;
    } catch (e) {
      alert(e);
    }
  }

  updateUIFields() {
    const displayedX = this.x + this.anchorX * this.size;
    const displayedY = this.y + this.anchorY * this.size;
    this.xInput.value = Math.round(displayedX);
    this.yInput.value = Math.round(displayedY);
    this.scaleInput.value = this.size;
    this.idInput.value = this.arucoId;
    this.dictSelect.value = this.dictionaryName;
  }

  highlightAnchorCell(cells, ax, ay) {
    cells.forEach(c => {
      c.cell.style.background = (c.ax === ax && c.ay === ay) ? '#ddd' : '#fff';
    });
  }

  notifyUpdate() {
    // Ensure integers for position and size
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    this.size = Math.round(this.size);
    this.arucoId = this.arucoId | 0;

    // Update the UI fields based on the current anchor and position
    this.updateUIFields();

    if (typeof this.onUpdate === 'function') {
      this.onUpdate();
    }
  }

  toJSON() {
    return {
      dictionaryName: this.dictionaryName,
      arucoId: this.arucoId | 0,
      x: this.x | 0,
      y: this.y | 0,
      scale: this.size | 0,
      anchorX: this.anchorX,
      anchorY: this.anchorY
    };
  }

  restoreAnchorSelection() {
    if (this.anchorCells) {
      this.highlightAnchorCell(this.anchorCells, this.anchorX, this.anchorY);
    }
    this.updateUIFields();
  }
}
