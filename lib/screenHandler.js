const LRUD_SCREEN_ID_PREFIX = 'lrud-screen-';
const SCREEN = 0;
const HEADER = 1;

export const closestScreenElem = (elem) => elem?.closest(`[id^="${LRUD_SCREEN_ID_PREFIX}"]`);

/**
 * Parses a screen or header element to extract its type and screen name.
 *
 * @param {HTMLElement} elem The element to parse for Screen or Header information
 * @returns {{type: number, screen: string, header: string|null}|null}, The type (SCREEN or HEADER) and full screen name and header name (if available)
 */
const parseScreenElement = (elem) => {
  const id = elem?.id ?? '';
  if (!id.startsWith(LRUD_SCREEN_ID_PREFIX)) return null;
  const suffix = id.slice(LRUD_SCREEN_ID_PREFIX.length); // e.g. "home" or "home-header"
  if (suffix.length === 0) {
    console.warn(`Warning: "${id}" in invalid if used as screen element for ${elem}. Must have a screen name suffix after "${LRUD_SCREEN_ID_PREFIX}".`);
    return null; // Invalid if no screen name
  }

  // check if it's a header (contains a dash) or a screen (no dash)
  const dashIdx = suffix.indexOf('-');
  if (dashIdx === -1) {
    return { type: SCREEN, screen: LRUD_SCREEN_ID_PREFIX+suffix, header: null };
  }
  return { type: HEADER, screen: LRUD_SCREEN_ID_PREFIX+suffix.slice(0, dashIdx), header: LRUD_SCREEN_ID_PREFIX+suffix };
};

/**
 * Finds all header elements for a given screen element.
 *
 * @param {string} screenPrefix The name of the screen to find headers for
 * @param {HTMLElement} scope The scope to limit the search
 * @returns {NodeListOf<HTMLElement>} NodeList of header elements for the given screen
 */
const findHeadersForScreen = (screenPrefix, scope) => {
  const searchRoot = scope ?? document.body;
  return searchRoot.querySelectorAll(`[id^="${screenPrefix}"]`);
};

/**
 * Resolves the screen scope for a given element.
 *
 * @param {HTMLElement} closestScreenElem The closest screen element to resolve the screen scope for
 * @param {string} exitDir The direction of exit (e.g. "ArrowLeft") for potential scope adjustments
 * @param {HTMLElement} scope The scope to limit the search
 * @returns {HTMLElement[]|null} | null} The screen element and its headers, or null if not in any screen
 */
export const resolveScreenScope = (closestScreenElem, exitDir, scope) => {
  let resolvedScope = [];
  if (!closestScreenElem) return resolvedScope;

  const parsed = parseScreenElement(closestScreenElem);
  if (!parsed) return resolvedScope;

  if (parsed.type === SCREEN) {
    // Use exit dir to adjust scope if we're in a screen and not exiting towards the header
    const restrictScope = exitDir !== 'up';
    if (restrictScope) {
        resolvedScope = [closestScreenElem];
    } else {
        // We are possibly exiting towards the headers, so we need to find them to know if we are actually exiting towards them or just a sibling screen
        const headers = findHeadersForScreen(parsed.screen+'-', scope);
        resolvedScope = [closestScreenElem];
        for (const el of headers) {
            resolvedScope.push(el);
        }
    }
    return resolvedScope;
  } else {
    // Use exit dir to adjust scope if we're in a header not exiting towards the screen
    const restrictScope = exitDir !== 'down' ? true : false;
    // Still need to get all the headers as the closest might just be left/right sibling header
    const headers = findHeadersForScreen(parsed.screen+'-', scope);

    if (!restrictScope) {
        // We are possibly exiting towards the screen, so we need to find it to know if we are actually exiting towards it or just a sibling header
        const screenElem = document.getElementById(parsed.screen);
        if (screenElem) {
            resolvedScope = [screenElem];
        }
    }
    for (const el of headers) {
        resolvedScope.push(el);
    }
    return resolvedScope;
  }
};