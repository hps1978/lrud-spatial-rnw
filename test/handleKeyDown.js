import { getNextFocus, setConfig, updateAncestorsAutoFocus } from '../../lib/lrud.js';

let scope = window.document.body;

/**
 * setup element id's when requeted by lrud
 */
const ID_LIMIT = 100000; // big enough to wrap around!
let nextId = 0;
function setupNodeId(node) {
  let id = node.id?.length > 0 ? node.id : null;
  if (!id) {
    // Use a simple incremented number as id
    id = `lrud-${nextId > ID_LIMIT ? 1 : ++nextId}`;
    node.id = id;
  }
  return id;
}

let currentFocus = null;
/**
 * Trigger focus on the element and update ancestors' autoFocus attributes
 *
 * @param {Object} nextFocus The next focus object
 * @returns {boolean} true if focus was set, false otherwise
 */
function triggerFocus(nextFocus) {
  if (nextFocus && nextFocus.elem) {
    currentFocus = nextFocus;
    // set id first
    setupNodeId(nextFocus.elem);
    updateAncestorsAutoFocus(nextFocus.elem, scope);
    nextFocus.elem.focus();
    return true;
  }
  return false;
}

/**
 * Perform directional navigation
 *
 * @param {Event} event The key event
 */
const handleKeyDown = (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    const nextFocus = getNextFocus(currentFocus?.elem, event.keyCode, scope);

    if (nextFocus?.elem) {
      triggerFocus(nextFocus);
    }
  }
};

window.setScope = (newScope) => scope = newScope;

window.addEventListener('click', (e) => {
  if (e.target.nodeName !== 'INPUT' && e.target.nodeName !== 'LABEL') {
    e.preventDefault();
  }
});

const keyMap = {
  'ArrowLeft': 'left',
  'ArrowRight': 'right',
  'ArrowUp': 'up',
  'ArrowDown': 'down'
};

// Configure LRUD
setConfig({
  key: keyMap
});

window.addEventListener('keydown', handleKeyDown);
