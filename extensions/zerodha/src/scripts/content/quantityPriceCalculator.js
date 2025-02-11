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
          <label for="funds">Funds <span class="keys">[Ctrl+Alt]</span></label>
          <input type="number" id="funds" />
        </div>
        <div class="operator">/</div>
        <div class="input-group-item">
          <label for="price">Price <span class="keys">[Ctrl]</span></label>
          <input type="number" id="price" />
        </div>
        <div class="operator">=</div>
        <div class="input-group-item">
          <label for="quantity">Quantity</label>
          <input type="number" id="quantity" disabled />
        </div>
      </div>
    </div>

    <div class='input-group-container bg-green'>
      <h3 class="secondary-title"><span class="icon icon-trending-up"></span><span>Target Price</span></h3>
      <div id="target-price-container">
        <table id="target-price-table" class="price-table">
          <colgroup>
            <col style="width: 35%"/>
            <col style="width: 21%"/>
            <col style="width: 21%"/>
            <col style="width: 21%"/>
          </colgroup>
          <thead>
            <tr>
              <th>Price <span class="keys">[Alt]</span></th>
              <th>x 0.06%</th>
              <th>x 0.16%</th>
              <th>x 0.26%</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class='price'><input type='number' id="target-price"/></td>
              <td class='par'></td>
              <td class='x-16'></td>
              <td class='x-26'></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class='input-group-container bg-red'>
      <h3 class="secondary-title"><span class="icon icon-pie-chart"></span><span>Buying Price</span></h3>
      <div id="buying-price-container">
        <table id="buying-price-table" class="price-table">
          <colgroup>
            <col style="width: 35%"/>
            <col style="width: 21%"/>
            <col style="width: 21%"/>
            <col style="width: 21%"/>
          </colgroup>
          <thead>
            <tr>
              <th>Price <span class="keys">[Shift]</span></th>
              <th>/ 0.06%</th>
              <th>/ 0.16%</th>
              <th>/ 0.26%</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class='price'><input type='number' id="buying-price"/></td>
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
        if (e.altKey && e.key === 'q') {
          togglePanel();
        }
      });
      togglePanel();
      nodes.panel.addEventListener('input', function(e) {
        recalculate();
      });

    }
  }

  /**
   * Global listener for the document. It listens for Ctrl+Alt, Ctrl, Alt, and Shift key with a click.
   * @param {Event} e 
   */
  function globalListener(e) {
    console.log(e);
    let captured = false;
    if (e.ctrlKey && e.altKey && !e.shiftKey) {
      captureAndSet(e.target, '#funds');
      captured = true;
    }
    if (e.ctrlKey && !e.altKey && !e.shiftKey) {
      captureAndSet(e.target, '#price');
      captured = true;
    }
    if (!e.ctrlKey && e.altKey && !e.shiftKey) {
      captureAndSet(e.target, '#target-price');
      captured = true;
    }
    if (!e.ctrlKey && !e.altKey && e.shiftKey) {
      captureAndSet(e.target, '#buying-price');
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
    const targetPrice = extractNumber(nodes.panel.querySelector('#target-price').value);
    const buyingPrice = extractNumber(nodes.panel.querySelector('#buying-price').value);
    nodes.panel.querySelector('#target-price-table .par').innerText = (targetPrice*1.0006).toFixed(2);  
    nodes.panel.querySelector('#target-price-table .x-16').innerText = (targetPrice*1.0016).toFixed(2);
    nodes.panel.querySelector('#target-price-table .x-26').innerText = (targetPrice*1.0026).toFixed(2);
    nodes.panel.querySelector('#buying-price-table .par').innerText = (buyingPrice/1.0006).toFixed(2);
    nodes.panel.querySelector('#buying-price-table .x-16').innerText = (buyingPrice/1.0016).toFixed(2);
    nodes.panel.querySelector('#buying-price-table .x-26').innerText = (buyingPrice/1.0026).toFixed(2);
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
    if (el.matches('.symbol-wrapper') || getClosestAncestor(el, '.symbol-wrapper')) {
      ancestor = getClosestAncestor(el, '.info');
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
