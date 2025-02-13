;var KITE_EXT=(function(my){
  if (my.inited) {
    return my;
  }
  my.inited = true;

  const panelHTML = `
  <div id="kite-ext-panel">
    <div class='input-group-container bg-blue'>
      <h3 class="secondary-title"><span class="icon icon-briefcase"></span><span>Quantity</span></h3>
      <div class="input-group">
        <div class="input-group-item">
          <label for="funds">Funds <span class="keys">[Alt]</span></label>
          <input type="number" id="funds" />
        </div>
        <div class="operator">/</div>
        <div class="input-group-item">
          <label for="price">Price <span class="keys">[Shift]</span></label>
          <input type="number" id="price" />
        </div>
        <div class="operator">=</div>
        <div class="input-group-item">
          <label for="quantity">Qty</label>
          <input type="number" id="quantity" disabled />
        </div>
      </div>
    </div>

    <div class='input-group-container bg-green'>
      <h3 class="secondary-title"><span class="icon icon-trending-up"></span><span>Buy price</span></h3>
      <div id="buy-price-container">
        <table id="buy-price-table" class="price-table">
          <colgroup>
            <col style="width: 35%"/>
            <col style="width: 21%"/>
            <col style="width: 21%"/>
            <col style="width: 21%"/>
          </colgroup>
          <thead>
            <tr>
              <th>Buy price <span class="keys">[Ctrl]</span></th>
              <th>SP1</th>
              <th>SP2</th>
              <th>SP3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class='price'><input type='number' id="buy-price"/></td>
              <td class='par'></td>
              <td class='x-16'></td>
              <td class='x-26'></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class='input-group-container bg-red hidden' id="sell-price-input-group-container">
      <h3 class="secondary-title"><span class="icon icon-pie-chart"></span><span>Sell price</span></h3>
      <div id="sell-price-container">
        <table id="sell-price-table" class="price-table">
          <colgroup>
            <col style="width: 35%"/>
            <col style="width: 21%"/>
            <col style="width: 21%"/>
            <col style="width: 21%"/>
          </colgroup>
          <thead>
            <tr>
              <th>Sell price <span class="keys">[Ctrl+Alt]</span></th>
              <th>SP1</th>
              <th>SP2</th>
              <th>SP3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class='price'><input type='number' id="sell-price"/></td>
              <td class='par'></td>
              <td class='x-16'></td>
              <td class='x-26'></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `;
  const rowTemplate = `
    <tr>
      <td class='price'><input type='number'/></td>
      <td class='par'></td>
      <td class='x-16'></td>
      <td class='x-26'></td>
    </tr>
  `;

  const nodes = {
    panel: null
  }

  /**
   * Add the extension UI to the Kite UI. The insertAdjacentHTML method call will
   * throw an error if the Kite UI is not loaded yet, 
   * .i.e. document.querySelector('#app .container-left') is undefined. 
   * This function will be called every 500ms until the Kite UI is loaded, i.e. 
   * no error is thrown.
   */
  my.initUI = function() {
    if (!nodes.panel) {
      nodes.containerLeft = document.querySelector('#app .container-left');
      nodes.containerLeft.insertAdjacentHTML('beforeend', panelHTML);
      nodes.panel = document.getElementById('kite-ext-panel');
      document.body.addEventListener('click', globalListener);
      document.body.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 'a') {
          togglePanel();
        }
      });
      togglePanel();
      nodes.panel.addEventListener('input', function(e) {
        const key = kebab2Camel(e.target.id);
        saveValue(key, e.target.value);
      });
      document.body.classList.add('kite-ext-show-2-panels'); // third panel hidden
      loadStoredValues();
    }
  }

  /**
   * Load the stored values from the chrome storage and set them in the input fields.
   * If the values are not found, the input fields will be empty.
   */
  function loadStoredValues() {
    chrome.storage.sync.get(['funds', 'price', 'buyPrice', 'sellPrice'], function(items) {
      if (items.funds !== undefined) {
        nodes.panel.querySelector('#funds').value = items.funds;
      }
      if (items.price !== undefined) {
        nodes.panel.querySelector('#price').value = items.price;
      }
      if (items.buyPrice !== undefined) {
        nodes.panel.querySelector('#buy-price').value = items.buyPrice;
      }
      if (items.sellPrice !== undefined) {
        nodes.panel.querySelector('#sell-price').value = items.sellPrice;
      }
      recalculate();
    });
  }

  /**
   * Convert a kebab-case string to camelCase. Used for converting kebab-case input ids to camelCase keys for storage
   * @param {String} kebab
   */
  function kebab2Camel(kebab) {
    return kebab.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
  }

  /**
   * Save a value in the chrome storage
   * @param {String} key
   * @param {String} value
   * @returns void
   */
  function saveValue(key, value) {
    let obj = {};
    obj[key] = value;
    chrome.storage.sync.set(obj);
  }

  /**
   * Global listener for the document. It listens for Ctrl+Alt, Ctrl, Alt, and Shift key with a click.
   * @param {Event} e 
   */
  function globalListener(e) {
    console.log(e);
    if (!e.ctrlKey && e.altKey && !e.shiftKey) {
      captureAndSet(e.target, 'funds');
    }
    if (!e.ctrlKey && !e.altKey && e.shiftKey) {
      captureAndSet(e.target, 'price');
    }
    if (e.ctrlKey && !e.altKey && !e.shiftKey) {
      captureAndSet(e.target, 'buyPrice');
    }
    if (e.ctrlKey && e.altKey && !e.shiftKey) {
      captureAndSet(e.target, 'sellPrice');
    }
  }

  /**
   * Remove all spaces and commas from the string and extract the first number from it.
   * Returns 0 if no number is found.
   * @param {String} str 
   * @returns 
   */
  function extractNumber(str) {
    let src = str.replaceAll(',', '').replaceAll(' ', '');
    const match = src.match(/[+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*)(?:[eE][+-]?\d+)?/g);
    return match ? parseFloat(match[0]) : 0;
  }

  /**
   * Recalculate and reset the target values based on the values in the input fields.
   */
  function recalculate() {
    const funds = extractNumber(nodes.panel.querySelector('#funds').value);
    const price = extractNumber(nodes.panel.querySelector('#price').value);
    let quantity = '';
    if (price !== 0) {
      quantity = (funds / price).toFixed(2);
    }
    nodes.panel.querySelector('#quantity').value = quantity;
    const buyPrice = extractNumber(nodes.panel.querySelector('#buy-price').value);
    const sellPrice = extractNumber(nodes.panel.querySelector('#sell-price').value);
    nodes.panel.querySelector('#buy-price-table .par').innerText = (buyPrice*1.0006).toFixed(2);  
    nodes.panel.querySelector('#buy-price-table .x-16').innerText = (buyPrice*1.0016).toFixed(2);
    nodes.panel.querySelector('#buy-price-table .x-26').innerText = (buyPrice*1.0026).toFixed(2);
    nodes.panel.querySelector('#sell-price-table .par').innerText = (sellPrice/1.0006).toFixed(2);
    nodes.panel.querySelector('#sell-price-table .x-16').innerText = (sellPrice/1.0016).toFixed(2);
    nodes.panel.querySelector('#sell-price-table .x-26').innerText = (sellPrice/1.0026).toFixed(2);
  }

  /**
   * Utility function to get the closest ancestor of an element (including itself) that matches the selector
   * @param {Element} el 
   * @param {String} selector 
   * @returns 
   */
  function getClosestAncestor(el, selector) {
    while (el) {
      if (el.matches(selector)) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  /**
   * Once a click is captured, try to pick a number from the element and return it. Throw an error
   * if no number is found.
   * @param {Element} el 
   * @returns 
   */
  function pickNumber(el) {
    let text = '';
    if (el.matches('.symbol-wrapper') || getClosestAncestor(el, '.symbol-wrapper') || el.matches('.info-wrapper')) {
      ancestor = getClosestAncestor(el, '.info-wrapper');
      if (ancestor) {
        text = ancestor.querySelector('.last-price').innerText;
      }
    } else if (el.matches('.last-price')) {
      text = el.innerText;
    } else if (el.matches('input[type=number],input[type=text]')) {
      text = el.value;
    } else if (el.matches('h1,h2,h3,h4,h5,h6,div,span,p,td,label')) {
      text = el.innerText;
    } 
    text=text.replaceAll(',', '').replaceAll(' ', '');
    const match = text.match(/[+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*)(?:[eE][+-]?\d+)?/g);
    if (match) {
      return parseFloat(match[0]).toFixed(2);
    }
    else {
      throw new Error('No number found');
    }
  }

  /**
   * Capture a number from the source element (something clicked on the page) and set it in chromeStorage.
   * @param {Element} sourceEl 
   * @param {String} key 
   * @returns void
   */
  function captureAndSet(sourceEl, key) {
    if (!sourceEl) {
      return;
    }
    let value = 0, found = true;
    try {
      value = pickNumber(sourceEl);
    } catch (e) {
      console.error("Error: No number in source element: ", sourceEl);
      found = false;
    }
    if (found) {
      saveValue(key, value);
    }
  }

  function togglePanel() {
    if (nodes.panel) {
      nodes.containerLeft.classList.toggle('ext-panel-on');
    }
  }

  my.toggleSellPricePanel = function() {
    if (nodes.panel) {
      const sellPriceInputGroup = nodes.panel.querySelector('#sell-price-input-group-container');
      if (sellPriceInputGroup) {
        if (sellPriceInputGroup.classList.contains('hidden')) {
          sellPriceInputGroup.classList.remove('hidden');
          document.body.classList.remove('kite-ext-show-2-panels');
          document.body.classList.add('kite-ext-show-3-panels');
        } else {
          sellPriceInputGroup.classList.add('hidden');
          document.body.classList.add('kite-ext-show-2-panels');
          document.body.classList.remove('kite-ext-show-3-panels');
        }
      }
    }
  }

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (namespace === 'sync') {
        if (key === 'funds') {
          nodes.panel.querySelector('#funds').value = newValue;
        } else if (key === 'price') {
          nodes.panel.querySelector('#price').value = newValue;
        } else if (key === 'buyPrice') {
          nodes.panel.querySelector('#buy-price').value = newValue;
        } else if (key === 'sellPrice') {
          nodes.panel.querySelector('#sell-price').value = newValue;
        }
        recalculate();
      }
    }
  });

  return my;
  
}(KITE_EXT||{}));

// try loading the Extension UI every 500ms until it is loaded. InitUI tries to 
// add some html to the side panel of the Kite UI. If the Kite UI is not loaded
// yet, it will throw an error. If an error is thrown try again after 500ms.
var intervalID = setInterval(function() {
  console.log('Checking for Kite UI');
  try {
    KITE_EXT.initUI();
  } catch (e) {
    console.log("Kite not initialized yet");
    return;
  }
  clearInterval(intervalID);
}, 500);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "toggleSellPricePanel") {
    KITE_EXT.toggleSellPricePanel();
  }
});