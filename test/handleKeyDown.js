import { getNextFocus, setConfig } from '../../lib/lrud.js';

let scope = null;

/**
 * setup element id's when requeted by lrud
 */
const ID_LIMIT = 100000; // big enough to wrap around!
let id = 0;
function setupId(node) {
  let newId = null;
  if (node) {
    // Use a simple incremented number as id
    newId = `lrud-${id > ID_LIMIT ? 0 : ++id}`;
    node.id = newId;

    return newId;
  }

  return newId;
}

/**
 * Perform directional navigation
 *
 * @param {Event} event The key event
 */
const handleKeyDown = (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    const nextFocus = getNextFocus(event.target, event.keyCode, scope);

    if (nextFocus) {
      nextFocus.focus();
    }
  }
};

window.setScope = (newScope) => scope = newScope;

window.addEventListener('click', (e) => {
  if (e.target.nodeName !== 'INPUT' && e.target.nodeName !== 'LABEL') {
    e.preventDefault();
  }
});

// Configure LRUD
setConfig({
  createMissingId: setupId
});

window.addEventListener('keydown', handleKeyDown);
getNextFocus().focus();
