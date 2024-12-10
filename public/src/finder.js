document.addEventListener('DOMContentLoaded', () => {
    const dictionarySelect = document.getElementById('dictionarySelect');
    const generateBlackGridBtn = document.getElementById('generateBlackGridBtn');
    const generateWhiteGridBtn = document.getElementById('generateWhiteGridBtn');
    const gridContainer = document.getElementById('gridContainer');
    const resultEl = document.getElementById('result');
  
    let currentDictionaryName = null;
    let currentDictionary = null;
    let markSize = 0;
    let cells = [];
  
    // Group dictionaries by grid size
    const dictionariesBySize = {
      '4x4': [],
      '5x5': [],
      '6x6': [],
      '7x7': [],
      '8x8': []
    };
  
    // Populate the dropdown with "Any" options first
    const anySizes = ['4x4', '5x5', '6x6', '7x7', '8x8'];
    anySizes.forEach(size => {
      const opt = document.createElement('option');
      opt.value = 'ANY_' + size;
      opt.textContent = 'Any ' + size;
      dictionarySelect.appendChild(opt);
    });
  
    // Populate actual dictionaries and group them by size
    for (const dicName in AR.DICTIONARIES) {
      const dic = new AR.Dictionary(dicName);
      const size = `${dic.markSize - 2}x${dic.markSize - 2}`; // Get inner grid size (subtract border)
  
      const opt = document.createElement('option');
      opt.value = dicName;
      opt.textContent = dicName;
      dictionarySelect.appendChild(opt);
  
      if (dictionariesBySize[size]) {
        dictionariesBySize[size].push(dicName);
      }
    }
  
    console.log('Dictionaries by Size:', dictionariesBySize);
  
    // Default to "Any 4x4"
    dictionarySelect.value = 'ANY_4x4';
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
      if (dicName.startsWith('ANY_')) {
        const size = dicName.split('_')[1];
        markSize = parseInt(size.split('x')[0], 10) + 2; // Inner size + 2 for borders
        currentDictionaryName = dicName;
        currentDictionary = null;
        console.log(`Selected: ${dicName}, Mark Size: ${markSize}`);
      } else {
        currentDictionaryName = dicName;
        currentDictionary = new AR.Dictionary(dicName);
        markSize = currentDictionary.markSize;
        console.log(`Selected Dictionary: ${dicName}, Mark Size: ${markSize}`);
      }
      generateGrid(true);
    }
  
    function generateGrid(startWithBlack) {
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
      if (cell.isBorder) return;
      cell.isBlack = !cell.isBlack;
      cell.el.classList.toggle('black-cell', cell.isBlack);
      cell.el.classList.toggle('white-cell', !cell.isBlack);
    }
  
    function checkMarker() {
      const innerSize = markSize - 2;
      let bits = [];
  
      for (let i = 0; i < innerSize; i++) {
        bits[i] = [];
        for (let j = 0; j < innerSize; j++) {
          const cell = cells[i + 1][j + 1];
          bits[i][j] = cell.isBlack ? '0' : '1';
        }
      }
  
      if (currentDictionaryName.startsWith('ANY_')) {
        const size = currentDictionaryName.split('_')[1];
        const dictList = dictionariesBySize[size] || [];
        console.log(`Checking dictionaries for ${currentDictionaryName}:`, dictList);
  
        let matches = [];
  
        dictList.forEach(dicName => {
          const dic = new AR.Dictionary(dicName);
          const found = dic.find(bits);
          if (found && found.distance === 0) {
            matches.push({ dictionary: dicName, id: found.id });
          }
        });
  
        if (matches.length === 0) {
          resultEl.textContent = 'No match';
        } else {
          let resultStr = 'Match detected: ' + matches.map(m => `${m.dictionary} ID: ${m.id}`).join(' and ');
          resultEl.textContent = resultStr;
        }
      } else {
        if (!currentDictionary) return;
        const found = currentDictionary.find(bits);
        if (found && found.distance === 0) {
          resultEl.textContent = `Match detected, ID: ${found.id}`;
        } else {
          resultEl.textContent = 'No match';
        }
      }
    }
  
    // Initially generate a black grid
    generateGrid(true);
  });
  