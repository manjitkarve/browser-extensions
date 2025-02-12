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
        recalculate();
      });
      document.body.classList.add('kite-ext-show-2-panels'); // third panel hidden
    }
  }

  /**
   * Global listener for the document. It listens for Ctrl+Alt, Ctrl, Alt, and Shift key with a click.
   * @param {Event} e 
   */
  function globalListener(e) {
    console.log(e);
    let captured = false;
    if (!e.ctrlKey && e.altKey && !e.shiftKey) {
      captureAndSet(e.target, '#funds');
      captured = true;
    }
    if (!e.ctrlKey && !e.altKey && e.shiftKey) {
      captureAndSet(e.target, '#price');
      captured = true;
    }
    if (e.ctrlKey && !e.altKey && !e.shiftKey) {
      captureAndSet(e.target, '#buy-price');
      captured = true;
    }
    if (e.ctrlKey && e.altKey && !e.shiftKey) {
      captureAndSet(e.target, '#sell-price');
      captured = true;
    }
    if (captured) {
      recalculate();
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
    const targetPrice = extractNumber(nodes.panel.querySelector('#buy-price').value);
    const buyingPrice = extractNumber(nodes.panel.querySelector('#sell-price').value);
    nodes.panel.querySelector('#buy-price-table .par').innerText = (targetPrice*1.0006).toFixed(2);  
    nodes.panel.querySelector('#buy-price-table .x-16').innerText = (targetPrice*1.0016).toFixed(2);
    nodes.panel.querySelector('#buy-price-table .x-26').innerText = (targetPrice*1.0026).toFixed(2);
    nodes.panel.querySelector('#sell-price-table .par').innerText = (buyingPrice/1.0006).toFixed(2);
    nodes.panel.querySelector('#sell-price-table .x-16').innerText = (buyingPrice/1.0016).toFixed(2);
    nodes.panel.querySelector('#sell-price-table .x-26').innerText = (buyingPrice/1.0026).toFixed(2);
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
   * Capture a number from the source element and set it in the target element
   * @param {Element} sourceEl 
   * @param {String} targetSelector 
   * @returns void
   */
  function captureAndSet(sourceEl, targetSelector) {
    if (!sourceEl) {
      return;
    }
    const targetEl = nodes.panel.querySelector(targetSelector)
    if (!targetEl) {
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
      if (targetEl.matches('input[type=number],input[type=text]')) {
        targetEl.value = value;
      } else {
        targetEl.innerText = value;
      }
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