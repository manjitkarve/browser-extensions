;var STREAK_EXT=(function(my){
  // init only once
  if (my.inited) {
    return my;
  }
  my.inited = true;

  // Don't render values below this limit, just a - will be shown
  const lowerLimit = 10000000;

  // Stores {lower, upper, color} for each range. 
  // Subsequently used to determine the color of the box shown next to the value
  const ranges = [];

  // formats the number into crores. If the number is less than the lowerLimit (currently 1,00,00,000), returns '-'
  const formatNumber = function(num) {
    if (num >= lowerLimit) {
      return `₹ ${(num / lowerLimit).toFixed(2)} Cr`;
    } else {
      return '-';
    }
  };

  // checks if the current page is a scanner page
  const scannerPageRegex = /streak.tech\/scanner\/[\w\d-]/;
  my.isScannerPage = function() {
    return scannerPageRegex.test(window.location.href);
  }

  // prepares the ranges based on the values. The ranges are used to determine the color of the box shown next to the value
  // each range is equally spaced on a log scale. So there will be fewer values in lower ranges and more in higher ranges
  const prepareRanges = function(values) {
    const colors = [
      '--color-scale-10',
      '--color-scale-20',
      '--color-scale-30',
      '--color-scale-40',
      '--color-scale-50',
      '--color-scale-60',
      '--color-scale-70',
    ];
    ranges.length = 0;
    const min = values.reduce((min, value) => min < value ? min : value, values[0]);
    const max = values.reduce((max, value) => max > value ? max : value, values[0]);
    const logMin = Math.log10(min);
    const logMax = Math.log10(max);
    const logRange = logMax - logMin;
    const logStep = logRange / 7;
    for (let i = 0; i < 7; i++) {
      const lower = i===0?min:Math.pow(10,logMin + logStep * i);
      const upper = i===6?max:Math.pow(10,logMin + logStep * (i + 1));
      ranges.push({lower, upper, color: colors[i]});
    }
  };

  // returns the color for the value based on the which range it is. 
  const getColor = function(num) {
    if (ranges.length === 0) { return '--color-scale-40'; }
    if (num < lowerLimit) { return 'white'; }
    if (num < ranges[0].lower) { return ranges[0].color; }
    if (num >= ranges[ranges.length - 1].upper) { return ranges[ranges.length - 1].color; }
    return ranges.find((range) => num >= range.lower && num <= range.upper).color;
  };

  // inserts the column into the table
  // the value of the column is calculated as LTP * Volume
  insertColumn = function() {
    if (!my.isScannerPage()) {
      return;
    }

    // There is only one result table. stop iterating over tables once the first one is found
    let found = false;
    
    document.querySelectorAll('table').forEach((table) => {
      if (found) return;

      // check if this is the correct table. Doing this by checking the column header text for the words "Symbol", "LTP", and "Volume"
      const checkNames = ['Symbol', 'LTP', 'Volume'];
      const headerRow = table.querySelector('thead tr');
      if (!headerRow) return;
      const headerTexts = Array.from(headerRow.children).map((cell) => cell.innerText.trim());
      if (!checkNames.every((name) => headerTexts.includes(name))) return;

      // yay found it. stop looking for more tables once this one is
      found = true;

      // remove the existing value column if it is already present
      table.querySelectorAll('.value-column,.value-column-header').forEach((element) => element.remove());

      // all the table body rows
      const rows = table.querySelectorAll('tbody tr');
      
      // create a new header by copying the Volume header, remove the info icon and help text related to the Volume column
      const newHeader = headerRow.children[2].cloneNode(true);
      newHeader.classList.add('value-column-header');
      newHeader.querySelector('p').innerText = 'Value';
      newHeader.querySelector('p+div').remove();

      // add click listener to the header for sorting
      newHeader.addEventListener('click', (ev) => {
        const header = ev.target;
        const sortOrder = header.classList.contains('sorted')?header.classList.contains('asc') ? 'desc' : 'asc' : 'desc';
        const sortedRows = Array.from(rows).sort((a, b) => {
          const aValue = parseFloat(a.children[3].dataset.value);
          const bValue = parseFloat(b.children[3].dataset.value);
          return sortOrder==='desc'?bValue - aValue:aValue - bValue;
        });
        const tbody = table.querySelector('tbody');
        sortedRows.forEach((row) => tbody.appendChild(row));
        header.classList.remove('asc', 'desc');
        header.classList.add(sortOrder);
        header.classList.add('sorted');

      });

      // insert the new header after the Volume header
      headerRow.insertBefore(newHeader, headerRow.children[3]);
  
      // the values array is used to calculate the ranges. 
      // It is also used to determine the color of the box next to each value
      const values = [];

      rows.forEach((row, index) => {
        const ltp = {text: row.querySelector('td:nth-child(2) p').innerText};
        const volume = {text: row.querySelector('td:nth-child(3) p').innerText};
        
        // extract the number as text from the ltp text. It looks like this: "₹ 1842.80 +4.13%". We only need 1842.80
        // store the ltp value, default to 0 
        let extractedNumbers = /[+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*)(?:[eE][+-]?\d+)?/g.exec(ltp.text);
        if (extractedNumbers[0].length > 0) {
          try {
            ltp.value = parseFloat(extractedNumbers[0]);
          } catch (e) {
            ltp.value = 0;
          }
        }
        // do the same for the volume
        extractedNumbers = /[+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*)(?:[eE][+-]?\d+)?/g.exec(volume.text);
        if (extractedNumbers[0].length > 0) {
          try {
            volume.value = parseFloat(extractedNumbers[0]);
          } catch (e) {
            volume.value = 0;
          }
        }

        // the ranges are only calculated for values above the lowerLimit
        if (ltp.value*volume.value > lowerLimit) {
          values.push(ltp.value*volume.value);
        }
  
        // create a new table cell with the value of LTP * Volume, again copying over from the Volume column
        const td = row.children[2].cloneNode(true);
        td.classList.add('value-column');
        td.dataset.value = ltp.value*volume.value;
        const para = td.querySelector('p');
        para.classList.add('value-text');
        para.innerText = formatNumber(ltp.value*volume.value);
        if (para.innerText === '-') {
          td.classList.add('empty');
        } 
        
        // inject the new cell after the Volume cell
        row.insertBefore(td, row.children[3]);
      });
      
      // calculate the ranges and color the boxes
      prepareRanges(values);
      
      // color the boxes
      rows.forEach((row) => {
        const td = row.children[3];
        td.style.setProperty('--calcValueColor', `var(${getColor(td.dataset.value)})` );
      });
    });
    if (!found) {
      console.log('Table not found');
      my.stopPolling();
    }
  };

  // poll every 10 seconds to check if the page is still the scanner page. If not, stop polling
  // every 10 seconds, refresh the value column. insertColumn() will remove the old values column and then insert the new one
  // we're removing and adding because the ranges need to be recalculated based on the new values
  let intervalID = 0;
  const poll = function() {
    if (!my.isScannerPage()) {
      clearInterval(intervalID);
      intervalID = 0;
      return;
    }
    insertColumn();
  }
  my.restartPolling = function() {
    clearInterval(intervalID);
    insertColumn();
    intervalID = setInterval(poll, 10000);
  }
  my.stopPolling = function() {
    clearInterval(intervalID);
    intervalID = 0;
  }

  return my;
  
}(STREAK_EXT||{}));

// polling is started when the extension icon is clicked
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (!STREAK_EXT.isScannerPage()) {
    return;
  }
  if (request.action === "insertColumn") {
    STREAK_EXT.restartPolling();
  }
});
