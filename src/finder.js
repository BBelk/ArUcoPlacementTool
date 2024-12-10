document.addEventListener('DOMContentLoaded', () => {
    const dictionarySelect = document.getElementById('dictionarySelect');
    const generateBlackGridBtn = document.getElementById('generateBlackGridBtn');
    const generateWhiteGridBtn = document.getElementById('generateWhiteGridBtn');
    const gridContainer = document.getElementById('gridContainer');
    const resultEl = document.getElementById('result');
  
    let currentDictionaryName = null;
    let currentDictionary = null;
    let markSize = 0;
    let cells = []; // 2D array of cells (each cell: {el: HTMLElement, isBlack: boolean, isBorder: boolean})
  
    // Populate dictionary dropdown
    for (const dicName in AR.DICTIONARIES) {
      const option = document.createElement('option');
      option.value = dicName;
      option.textContent = dicName;
      dictionarySelect.appendChild(option);
    }
  
    dictionarySelect.value = 'ARUCO_MIP_36h12'; // Default if exists
    updateDictionary(dictionarySelect.value);
  
    dictionarySelect.addEventListener('change', () => {
      updateDictionary(dictionarySelect.value);
    });
  
    generateBlackGridBtn.addEventListener('click', () => {
      generateGrid(true);
    });
  
    generateWhiteGridBtn.addEventListener('click', () => {
      generateGrid(false);
    });  
  
    function updateDictionary(dicName) {
      currentDictionaryName = dicName;
      currentDictionary = new AR.Dictionary(dicName);
      markSize = currentDictionary.markSize;
      generateGrid(true);
    }
  
    function generateGrid(startWithBlack) {
      // Clear previous grid
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
            rowCells.push({ el: cellEl, isBlack: true, isBorder: true });
          } else {
            if (startWithBlack) {
              cellEl.classList.add('black-cell');
            } else {
              cellEl.classList.add('white-cell');
            }
  
            rowCells.push({ el: cellEl, isBlack: startWithBlack, isBorder: false });
  
            // Add click event to toggle cell color and check for a match
            cellEl.addEventListener('click', () => {
              toggleCell(r, c);
              checkMarker();
            });
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
      if (cell.isBorder) return; // Do not toggle border cells
      cell.isBlack = !cell.isBlack;
      cell.el.classList.toggle('black-cell', cell.isBlack);
      cell.el.classList.toggle('white-cell', !cell.isBlack);
    }
  
    function checkMarker() {
      if (!currentDictionary) return;
  
      const innerSize = markSize - 2;
      let bits = [];
  
      for (let i = 0; i < innerSize; i++) {
        bits[i] = [];
        for (let j = 0; j < innerSize; j++) {
          const cell = cells[i + 1][j + 1]; // Offset by 1 for inner area
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
  
    // Initially generate a black grid for convenience
    generateGrid(true);
  });
  