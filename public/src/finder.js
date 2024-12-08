document.addEventListener('DOMContentLoaded', () => {
    const dictionarySelect = document.getElementById('dictionarySelect');
    const generateGridBtn = document.getElementById('generateGridBtn');
    const gridContainer = document.getElementById('gridContainer');
    const checkMarkerBtn = document.getElementById('checkMarkerBtn');
    const resultEl = document.getElementById('result');
  
    let currentDictionaryName = null;
    let currentDictionary = null;
    let markSize = 0;
    let cells = []; // 2D array of cells (each cell: {el:HTMLElement, isBlack:boolean, isBorder:boolean})
  
    // Populate dictionary dropdown
    for (const dicName in AR.DICTIONARIES) {
      const option = document.createElement('option');
      option.value = dicName;
      option.textContent = dicName;
      dictionarySelect.appendChild(option);
    }
  
    dictionarySelect.value = 'ARUCO_MIP_36h12'; // Default if exists
  
    dictionarySelect.addEventListener('change', () => {
      currentDictionaryName = dictionarySelect.value;
      currentDictionary = new AR.Dictionary(currentDictionaryName);
      markSize = currentDictionary.markSize;
    });
  
    // Initialize selection
    currentDictionaryName = dictionarySelect.value;
    currentDictionary = new AR.Dictionary(currentDictionaryName);
    markSize = currentDictionary.markSize;
  
    generateGridBtn.addEventListener('click', () => {
      generateGrid();
    });
  
    checkMarkerBtn.addEventListener('click', () => {
      checkMarker();
    });
  
    function generateGrid() {
      // Clear previous
      gridContainer.innerHTML = '';
      cells = [];
  
      for (let r = 0; r < markSize; r++) {
        const rowEl = document.createElement('div');
        rowEl.className = 'marker-row';
        const rowCells = [];
        for (let c = 0; c < markSize; c++) {
          const cellEl = document.createElement('div');
          cellEl.className = 'marker-cell';
  
          const isBorder = (r === 0 || r === markSize - 1 || c === 0 || c === markSize - 1);
          if (isBorder) {
            cellEl.classList.add('border-cell');
            rowCells.push({el: cellEl, isBlack: true, isBorder: true});
          } else {
            // Start all inside cells as black
            cellEl.classList.add('black-cell');
            cellEl.addEventListener('click', () => {
              toggleCell(r,c);
              checkMarker(); // Auto check after toggling
            });
            rowCells.push({el: cellEl, isBlack: true, isBorder: false});
          }
  
          rowEl.appendChild(cellEl);
        }
        cells.push(rowCells);
        gridContainer.appendChild(rowEl);
      }
  
      resultEl.textContent = '';
    }
  
    function toggleCell(r, c) {
      const cell = cells[r][c];
      if (cell.isBorder) return; // no toggle for borders
      cell.isBlack = !cell.isBlack;
      if (cell.isBlack) {
        cell.el.classList.remove('white-cell');
        cell.el.classList.add('black-cell');
      } else {
        cell.el.classList.remove('black-cell');
        cell.el.classList.add('white-cell');
      }
    }
  
    function checkMarker() {
      if (!currentDictionary) return;
  
      const innerSize = markSize - 2;
      let bits = [];
      for (let i = 0; i < innerSize; i++) {
        bits[i] = [];
        for (let j = 0; j < innerSize; j++) {
          const cell = cells[i+1][j+1]; // offset by 1 for inner area
          // If cell.isBlack => 0, else => 1
          bits[i][j] = cell.isBlack ? '0' : '1';
        }
      }
  
      const found = currentDictionary.find(bits);
      if (found && found.distance === 0) {
        resultEl.textContent = `Match detected, ID: ${found.id}`;
      } else {
        resultEl.textContent = `No match`;
      }
    }
  
    // Initially generate a grid just for convenience
    generateGrid();
  });
  