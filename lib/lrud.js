/**
 * LRUD: Spatial Edition
 *
 *  @@@@@@@@@@@@@@@@@@@@@@   @@@@@@@@@@@@@@@@@@@@@@   @@@@@@@@@@@@@@@@@@@@@@
 *  @@@@@@      '@@@@@@@@@   @@@@@@      '@@@@@@@@@   @@@@@@@@      '@@@@@@@
 *  @@@@@@  @@.   @@@@@@@@   @@@@@@  @@.    @@@@@@@   @@@@@     @@@@.   @@@@
 *  @@@@@@  @@@@  @@@@@@@@   @@@@@@  @@@@   @@@@@@@   @@@@   @@@@@@@@@@@@@@@
 *  @@@@@@        @@@@@@@@   @@@@@@        @@@@@@@@   @@@   @@@@@@@@@@@@@@@@
 *  @@@@@@  @@@@@.  @@@@@@   @@@@@@  @@@@@.  @@@@@@   @@@   @@@@@@@@@@@@@@@@
 *  @@@@@@  @@@@@   @@@@@@   @@@@@@  @@@@@   @@@@@@   @@@@    @@@@@@@@/ @@@@
 *  @@@@@@        /@@@@@@@   @@@@@@        /@@@@@@@   @@@@@@\,         @@@@@
 *  @@@@@@@@@@@@@@@@@@@@@@   @@@@@@@@@@@@@@@@@@@@@@   @@@@@@@@@@@@@@@@@@@@@@
 *
 * Copyright (C) 2023 BBC.
 */

// Any "interactive content" https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Interactive_content
const focusableSelector = '[tabindex], a, input, button';
const LRUD_CONTAINER = 'lrud-container';
const ignoreSelector = '.lrud-ignore, [disabled]';
const DESTINATIONS_ATTRIBUTE = 'data-destinations';
const DATA_BLOCK_EXIT_ATTRIBUTE = 'data-block-exit';
const DATA_AUTOFOCUS_ATTRIBUTE = 'data-autofocus';
const DATA_FOCUS_ATTRIBUTE = 'data-focus';
// const PRIORITISE_CHILDREN_ATTRIBUTE = 'data-lrud-prioritise-children'; // Only set when data-block-exit are set

/**
 * This is how the React Native Web TV props are mapped here:
 *
 * 1. TVFocusGuideView.tvFocusable={true} OR container={true} -> .lrud-container (tabindex=-1)
 *    (at the moment when TVFocusGuideView is used, looks like the directional navigation prioritises it's children irrespective of
 *    the value of tvFocusable prop. So we are mapping container={true} to .lrud-container as well)
 *    Rest of the attributes and logic for TVFocusGuideView is only valid if .lrud-container is present.
 * 2. TVFocusGuideView.focusable={false} -> sets .lrud-ignore : Ignores .lrud-container and it's children for LRUD logic
 * 3. TVFocusGuideView.autoFocus={true} -> data-autofocus attribute is 'true'/'false'. The attribute controls whether
 *    data-focus in parent containers should be applied or not. And stores last focused child in data-focus attribute.
 * 4. TVFocusGuideView.destinations=["id1", "id2"] -> data-destinations="id1 id2": These ids are from
 *    id assigned to each of the destination elements. This overrides data-focus logic (whether present or not).
 * 5. TVFocusGuideView.trapFocusUp={true} -> data-block-exit="up"
 * 6. TVFocusGuideView.trapFocusDown={true} -> data-block-exit="down"
 * 7. TVFocusGuideView.trapFocusLeft={true} -> data-block-exit="left"
 * 8. TVFocusGuideView.trapFocusRight={true} -> data-block-exit="right"
 *
 * Rules:
 * - For the first time focus:
 *  1. Default rule is to focus the first focusable element in the DOM tree order.
 *  2. If that element is in a .lrud-container and that container has data-autofocus="true", then:
 *   a. If that container has data-destinations, first valid element from that list is focused.
 *   b. Else if that container has data-focus set to a valid element id, that element is focused.
 *   c. Else first focusable element as per LRUD logic is focused: On Android TV this seems to be the one closest to top-left corner of the container/window.
 *
 * - Candidates selection on directional navigation:
 *  1. The selection is influenced by the direction of the navigation (up, down, left, right).
 *  2. Candidates are selected based on their proximity to the currently focused element.
 *  3. All elements with tabindex>=0 are considered as candidates by default (with some exceptions as described below).
 *  4. The candidate search is container within the scope first (if provided).
 *  3. All elements with tabindex="-1" are ignored unless they are .lrud-container elements (which requires special logic as described below).
 *  4. All elements with .lrud-ignore class or disabled attribute are ignored along with their children.
 *  5. If an element is a .lrud-container with data-autofocus="true"
 *     - AND the current focus is NOT inside that container
 *       - the container itself becomes a candidate and it's children are ignored.
 *  6. If an element is a .lrud-container with data-autofocus="true"
 *     - AND the current focus is outside that container
 *       - the container's children as considered as candidates and container itself is ignored.
 *
 * - Focus selection from candidates:
 * 1. From the list of candidates, the one that is closest to the current focus in the requested direction is selected.
 * 2. If the selected candidate is a .lrud-container with data-autofocus="true", the following logic is applied to determine the actual focus:
 *   a. If the container has data-destinations, the first valid element from that list is focused.
 *   b. Else if the container has data-focus set to a valid element id, that element is focused.
 *   c. Else the first focusable element inside the container is focused.
 * 3. If the selected candidate is not a .lrud-container, and does not have data-autofocus="true", the container is returned.
 * 4. If no valid candidate is found, null is returned.
 *
 * This module does not have a state of it's own. It relies on the DOM structure and attributes
 * to determine the next focusable element. It does not manage focus itself. If it successfully finds a new focus element,
 * it returns that element and details if that element is a container with data-autofocus="true".
 * The calling code is responsible for actually setting the focus to that element.
 */

const _left = 'left', _right = 'right', _up = 'up', _down = 'down';
let _keyMap = {
  4: _left,
  21: _left,
  37: _left,
  214: _left,
  205: _left,
  218: _left,
  5: _right,
  22: _right,
  39: _right,
  213: _right,
  206: _right,
  217: _right,
  29460: _up,
  19: _up,
  38: _up,
  211: _up,
  203: _up,
  215: _up,
  29461: _down,
  20: _down,
  40: _down,
  212: _down,
  204: _down,
  216: _down,
  'ArrowLeft': _left,
  'ArrowRight': _right,
  'ArrowUp': _up,
  'ArrowDown': _down
};

export const setConfig = (config) => {
  _keyMap = config.keyMap || _keyMap;
};

// const hasDOM = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof Element !== 'undefined';

// // Element.matches() with fallbacks for older browsers
// const matchesFunction = hasDOM && (window.Element.prototype.matches ||
//   window.Element.prototype.matchesSelector ||
//   window.Element.prototype.mozMatchesSelector ||
//   window.Element.prototype.msMatchesSelector ||
//   window.Element.prototype.oMatchesSelector) ||
//   function(s) {
//     var matches = (this.document || this.ownerDocument).querySelectorAll(s),
//       i = matches.length;
//     // eslint-disable-next-line no-empty
//     while (--i >= 0 && matches.item(i) !== this) {}
//     return i > -1;
//   };

// /**
//  * Element API .matches() with fallbacks
//  */
// const matches = (element, selectors) => {
//   if (!element) {
//     console.warn('matches() passed with a null element');
//     return false;
//   }

//   return matchesFunction.call(element, selectors);
// };

const isContainer = (node) => node?.classList?.contains(LRUD_CONTAINER);

const isContainerWithAutofocus = (node) =>
  node?.classList?.contains(LRUD_CONTAINER) &&
  node?.getAttribute(DATA_AUTOFOCUS_ATTRIBUTE) === 'true';

// const isContainerWithDestinations = (node) =>
//   node?.classList?.contains(LRUD_CONTAINER) &&
//   node?.getAttribute(DESTINATIONS_ATTRIBUTE)?.length > 0;

const isContainerTVFocusable = (node) =>
  // A tvFocusable is a container with either data-autofocus or data-destinations set
  node?.classList?.contains(LRUD_CONTAINER) &&
  (node?.getAttribute(DATA_AUTOFOCUS_ATTRIBUTE) === 'true' ||
    node?.getAttribute(DESTINATIONS_ATTRIBUTE)?.length > 0);

/**
 * Convert a NodeList to a regular Array
 *
 * @param {NodeList} nodeList The NodeList representation
 * @return {Array|null} The Array representation
 */
const toArray = (nodeList) => Array.prototype.slice.call(nodeList);

/**
 * Traverse DOM ancestors until we find a focus container
 *
 * @param {HTMLElement} elem The element representing the search origin
 * @return {HTMLElement|null} The parent focus container or null
 */
export const getParentContainer = (elem) => {
  if (!elem?.parentElement || elem?.parentElement.tagName === 'BODY') {
    return null;
  } else if (isContainer(elem.parentElement)) {
    return elem.parentElement;
  }

  return getParentContainer(elem.parentElement);
};

/**
 * Get first focusable (non container) inside a container,
 * or null if none exists
 *
 * @param {HTMLElement} container The container element to search inside
 * @return {HTMLElement|null} The first focusable element or null
 */
const getFirstFocusable = (container) => {
  if (!container) return null;

  const focusables = toArray(container.querySelectorAll(focusableSelector));

  return focusables.length > 0 ? focusables[0] : null;
};

/**
 * Get all focusable elements inside `scope`,
 * discounting any that are ignored or inside an ignored container
 *
 * @param {HTMLElement|null} elem The element representing the search origin (currently focused element)
 * @param {HTMLElement} scope The element to search inside of
 * @return {HTMLElement[]} Array of valid focusables inside the scope
 */
const getFocusables = (elem, scope) => {
  if (!scope) return [];
  /**
   * Get all elements (within scope) that:
   *  have a tabindex -> remove .lrud-ignore and children ->
   *  filter all with tabindex=-1 unless .lrud-container (with data-autofocus="true") ->
   *  filter all .lrud-container with focus inside (could be nested containers) ->
   *  filter all children of .lrud-container with data-autofocus="true" OR data-destinations=[...]
   */

  const ignoredElements = toArray(scope.querySelectorAll(ignoreSelector));

  let focusables = toArray(scope.querySelectorAll(focusableSelector))
    .filter(node => !ignoredElements.some(ignored => ignored == node || ignored.contains(node)))
    .filter(node => isContainerTVFocusable(node) || parseInt(node.getAttribute('tabindex') || '-1', 10) > -1);

  if (elem) {
    // To remove containers that have focus inside them
    focusables = focusables?.filter(node => (isContainer(node) && node.contains(elem)) ? false : true);
  }

  // Create a set of children to ignore from containers with data-autofocus="true" or data-destinations
  let childrenToIgnore = new Set();
  focusables?.forEach(node => {
    if (isContainerTVFocusable(node)) {
      // add all focusable children to ignore set
      const allChildren = toArray(node.querySelectorAll(focusableSelector));
      allChildren.forEach(child => childrenToIgnore.add(child));
    }
  });

  // Finally filter out all children that are in the ignore set
  if (childrenToIgnore.size > 0) {
    focusables = focusables?.filter(node => !childrenToIgnore.has(node));
  }
  return focusables;
};

/**
 * Get first focusable element as a default focus inside a 'scope'
 *
 * @param {HTMLElement} scope The element to search inside of
 * @param {String} exitDir The direction we exited from the starting element
 * @return {{elem: HTMLElement|null, parentHasAutofocus: boolean}} First focusable HTML Element
 */
const getDefaultFocus = (scope, exitDir) => {
  let nextFocus = {elem: null, parentHasAutofocus: false};
  const candidates = getAllFocusables(null, scope);
  if (candidates.length > 0) {
    let candidate = candidates[0];
    // First candiate may be a container with autofocus or destinations
    const candidateIsContainer = isContainer(candidate);
    if (candidateIsContainer) {
       nextFocus = findDestinationOrAutofocus(null, exitDir, candidate, false);
    } else {
      nextFocus = { elem: candidate, parentHasAutofocus: false };
    }
  }
  return nextFocus;
};

/**
 * Get all the focusable candidates inside `scope`,
 * including focusable containers
 *
 * @param {HTMLElement|null} elem The element representing the search origin (currently focused element)
 * @param {HTMLElement} scope The element to search inside of
 * @return {HTMLElement[]} Array of valid focusables inside the scope
 */
const getAllFocusables = (elem, scope) =>
  // const ignoredElements = toArray(scope.querySelectorAll(ignoreSelector));

    [
    // ...toArray(scope.querySelectorAll(focusableContainerSelector))
      // .filter(node => !ignoredElements.some(ignored => ignored == node || ignored.contains(node)))
      // .filter(container => getFocusables(container)?.length > 0),
    ...getFocusables(elem, scope)
  ];

// /**
//  * Build an array of ancestor containers
//  *
//  * @param {HTMLElement} initialContainer The container to start from
//  * @return {HTMLElement[]} An array of ancestor containers
//  */
// const collectContainers = (initialContainer) => {
//   if (!initialContainer) return [];
//   const acc = [ initialContainer ];
//   let cur = initialContainer;
//   while (cur) {
//     cur = getParentContainer(cur);
//     if (cur) acc.push(cur);
//   }
//   return acc;
// };

/**
 * Get the middle point of a given edge
 *
 * @param {Object} rect An object representing the rectangle
 * @param {String} dir The direction of the edge (left, right, up, down)
 * @return {Point} An object with the X and Y coordinates of the point
 */
const getMidpointForEdge = (rect, dir) => {
  switch (dir) {
    case 'left':
      return { x: rect.left, y: (rect.top + rect.bottom) / 2 };
    case 'right':
      return { x: rect.right, y: (rect.top + rect.bottom) / 2 };
    case 'up':
      return { x: (rect.left + rect.right) / 2, y: rect.top };
    case 'down':
      return { x: (rect.left + rect.right) / 2, y: rect.bottom };
  }
};

/**
 * Gets the nearest point on `rect` that a line in direction `dir` from `point` would hit
 * If the rect is exactly in direction `dir` then the point will be in a straight line from `point`.
 * Otherwise it will be the nearest corner of the target rect.
 *
 * @param {Point} point The point to start from
 * @param {String} dir The direction to draw the line in
 * @param {Object} rect An object representing the rectangle of the item we're going to
 * @return {Point} An object with the X/Y coordinates of the nearest point
 */
const getNearestPoint = (point, dir, rect) => {
  if (dir === 'left' || dir === 'right') {
    // When moving horizontally...
    // The nearest X is always the nearest edge, left or right
    const x = dir === 'left' ? rect.right : rect.left;

    // If the start point is higher than the rect, nearest Y is the top corner
    if (point.y < rect.top) return { x, y: rect.top };
    // If the start point is lower than the rect, nearest Y is the bottom corner
    if (point.y > rect.bottom) return { x, y: rect.bottom };
    // Else the nearest Y is aligned with where we started
    return { x, y: point.y };
  } else if (dir === 'up' || dir === 'down') {
    // When moving vertically...
    // The nearest Y is always the nearest edge, top or bottom
    const y = dir === 'up' ? rect.bottom : rect.top;

    // If the start point is left-er than the rect, nearest X is the left corner
    if (point.x < rect.left) return { x: rect.left, y };
    // If the start point is right-er than the rect, nearest X is the right corner
    if (point.x > rect.right) return { x: rect.right, y };
    // Else the nearest X is aligned with where we started
    return { x: point.x, y };
  }
};

/**
 * Get the Pythagorean distance between two points
 *
 * @param {Point} a An object containing the X and Y coordinates of the point
 * @param {Point} b Point to compare
 * @return {number} Distance from A to B
 */
const getDistanceBetweenPoints = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

/**
 * Check if point A is below point B
 *
 * @param {Point} a An object containing the X and Y coordinates of the point
 * @param {Point} b Point to compare
 * @return {boolean} True if a is below b, false otherwise
 */
const isBelow = (a, b) => a.y > b.y;

/**
 * Check if point A is to the right of point B
 *
 * @param {Point} a An object containing the X and Y coordinates of the point
 * @param {Point} b Point to compare
 * @return {boolean} True if a is to the right of b, false otherwise
 */
const isRight = (a, b) => a.x > b.x;

// /**
//  * Get blocked exit directions for current node
//  *
//  * @param {HTMLElement} originContainer Current focus container
//  * @param {HTMLElement} candidateContainer Candidate focus container
//  * @return {string[]} Array of strings representing blocked directions
//  */
// const getBlockedExitDirs = (originContainer, candidateContainer) => {
//   if (!originContainer) {
//     return [];
//   }

//   const currentAncestorContainers = collectContainers(originContainer);
//   const candidateAncestorContainers = collectContainers(candidateContainer);

//   // Find common container for current container and candidate container and
//   // remove everything above it
//   for (let i = 0; i < candidateAncestorContainers.length; i++) {
//     let commonCandidate = candidateAncestorContainers[i];

//     const spliceIndex = currentAncestorContainers.indexOf(commonCandidate);

//     if (spliceIndex > -1) {
//       currentAncestorContainers.splice(spliceIndex);
//       break;
//     }
//   }

//   return currentAncestorContainers.reduce((acc, cur) => {
//     const dirs = (cur?.getAttribute(DATA_BLOCK_EXIT_ATTRIBUTE) || '').split(' ');

//     return acc.concat(dirs);
//   }, []);
// };

/**
 * Check if the candidate is in the `exitDir` direction from the rect we're leaving,
 * with an overlap allowance of entryWeighting as a percentage of the candidate's width.
 *
 * @param {Object} entryRect An object representing the rectangle of the item we're moving to
 * @param {String} exitDir The direction we're moving in
 * @param {Object} exitPoint The midpoint of the edge we're leaving
 * @param {Float} entryWeighting Percentage of the candidate that is allowed to be behind the target
 * @return {Booelan} true if candidate is in the correct dir, false if not
 */
const isValidCandidate = (entryRect, exitDir, exitPoint, entryWeighting) => {
  if (entryRect.width === 0 && entryRect.height === 0) return false;
  if (!entryWeighting && entryWeighting != 0) entryWeighting = 0.3;

  const weightedEntryPoint = {
    x: entryRect.left + (entryRect.width * (exitDir === 'left' ? 1 - entryWeighting : exitDir === 'right' ? entryWeighting : 0.5)),
    y: entryRect.top + (entryRect.height * (exitDir === 'up' ? 1 - entryWeighting : exitDir === 'down' ? entryWeighting : 0.5))
  };

  if (
    exitDir === 'left' && isRight(exitPoint, weightedEntryPoint) ||
    exitDir === 'right' && isRight(weightedEntryPoint, exitPoint) ||
    exitDir === 'up' && isBelow(exitPoint, weightedEntryPoint) ||
    exitDir === 'down' && isBelow(weightedEntryPoint, exitPoint)
  ) return true;

  return false;
};

/**
 * Sort the candidates ordered by distance to the elem,
 * and filter out invalid candidates.
 * Prioritizes candidates that are aligned on the movement axis.
 *
 * @param {HTMLElement[]} candidates A set of candidate elements to sort
 * @param {HTMLElement} elem The search origin
 * @param {string} exitDir The direction in which we exited the elem (left, right, up, down)
 * @return {HTMLElement[]} The valid candidates, in order by distance
 */
const sortValidCandidates = (candidates, elem, exitDir) => {
  const exitRect = elem?.getBoundingClientRect() || { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 }; // For default case
  const exitPoint = getMidpointForEdge(exitRect, exitDir);
  const EPSILON = 1e-6;

  return candidates.filter(candidate => {
    // Filter out candidates that are in the opposite direction or have no dimensions
    const entryRect = candidate.getBoundingClientRect();
    const allowedOverlap = parseFloat(candidate.getAttribute('data-lrud-overlap-threshold'));
    return isValidCandidate(entryRect, exitDir, exitPoint, allowedOverlap);
  }).map((candidate, idx) => {
    const entryRect = candidate.getBoundingClientRect();
    const nearestPoint = getNearestPoint(exitPoint, exitDir, entryRect);
    const distance = getDistanceBetweenPoints(exitPoint, nearestPoint);

    // Calculate alignment score: 0 = perfectly aligned, higher = less aligned
    const alignmentDelta = (exitDir === 'left' || exitDir === 'right')
      ? Math.abs(exitPoint.y - nearestPoint.y) // Vertical alignment for horizontal movement
      : Math.abs(exitPoint.x - nearestPoint.x); // Horizontal alignment for vertical movement

    return {
      candidate,
      distance,
      alignmentDelta,
      idx
    };
  }).sort((a, b) => {
    // Primary: Sort by alignment (perfectly aligned candidates first)
    const alignmentDiff = a.alignmentDelta - b.alignmentDelta;
    if (Math.abs(alignmentDiff) > EPSILON) return alignmentDiff;

    // Secondary: Sort by distance (closest candidates first)
    const distanceDiff = a.distance - b.distance;
    if (Math.abs(distanceDiff) > EPSILON) return distanceDiff;

    // Tertiary: Preserve DOM order
    return a.idx - b.idx;
  }).map(({ candidate }) => candidate);
};

/**
 * Get the first parent container that matches the focusable candidate selector
 * @param {HTMLElement} startingCandidate The starting candidate to get the parent container of
 * @return {HTMLElement} The container that matches or null
 */
// const getParentFocusableContainer = (startingCandidate) => {
//   if (!startingCandidate) return null;
//   do {
//     startingCandidate = getParentContainer(startingCandidate);
//   } while (startingCandidate && !matches(startingCandidate, focusableContainerSelector));

//   return startingCandidate;
// };

/**
 * Get a possible destination (if set) for a container
 * @param {HTMLElement} parentContainer The parent container
 * @return {HTMLElement | null | -1} The element that should get the focus next, (null if nothing to focus, undefined if no destinations available)
 */
const getPreferredDestination = (parentContainer) => {
  // Use destinations if available to find new focus
  const destinations = parentContainer?.getAttribute(DESTINATIONS_ATTRIBUTE);
  if (destinations?.length) {
    // Find the first valid element and set that as newFocus
    const candidateIDs = destinations.split(' ');
    let newFocus = null;
    for (let candidateID of candidateIDs) {
      newFocus = document.getElementById(candidateID);
      if (newFocus) {
        break;
      }
    }
    return newFocus;
  } else {
    return undefined;
  }
};

/**
 * Run autofocus logic to find next focus
 *
 * @param {HTMLElement} elem The starting element
 * @param {string} exitDir The direction exited from the starting element
 * @param {HTMLElement} candidateContainer Container on which autofocus logic needs run
 * @param {boolean} domOrderAsDefault How to get default focus if no destinations or data-focus found
 * (true: first focusable in DOM order, false: first focusable as per LRUD logic)
 * @return {{elem: HTMLElement|null, parentHasAutofocus: boolean}  } Next focus element in container
 */
const findDestinationOrAutofocus = (elem, exitDir, candidateContainer, domOrderAsDefault) => {
  const hasAutoFocus = candidateContainer?.getAttribute(DATA_AUTOFOCUS_ATTRIBUTE) === 'true';
  let newFocus = { elem: null, parentHasAutofocus: hasAutoFocus };

  // 1. Use destinations (if available) to find new focus
  newFocus.elem = getPreferredDestination(candidateContainer);
  if (newFocus.elem !== undefined && newFocus.elem !== null) {
      return newFocus;
  }
  if (newFocus.elem === null && !hasAutoFocus) {
    // We are here because the element does not exist anymore
    // Strangely, on RNTVOS for Android TV
    // it keeps focussing on the first element of the container
    // This may be a bug...
    // So, we fallback to default focus logic (unless autofocus is set)
    const candidateContainerFocusables = getFocusables(null, candidateContainer);
    const candidates = sortValidCandidates(candidateContainerFocusables, elem, exitDir);
    newFocus = getNextFromCandidates(candidates, elem, exitDir);
    return newFocus;
  }

  if (hasAutoFocus) {
    newFocus.elem = document.getElementById(candidateContainer?.getAttribute(DATA_FOCUS_ATTRIBUTE));
    if (newFocus.elem) {
      return newFocus;
    }
    // Get default inside the container
    if (domOrderAsDefault) {
      // First focusable in DOM order
      newFocus.elem = getFirstFocusable(candidateContainer);
    } else {
      // Based on experiments on Android TV
      // the first focusable child as per LRUD logic
      const candidateContainerFocusables = getFocusables(null, candidateContainer);
      const candidates = sortValidCandidates(candidateContainerFocusables, elem, exitDir);
      newFocus = getNextFromCandidates(candidates, elem, exitDir);
    }
    // Container may be empty or another Container. No further processing into child containers required
    return newFocus;
  }

  return { elem: null, parentHasAutofocus: hasAutoFocus };
};

/**
 * Get one from the possible focusable candidates
 *
 * @param {HTMLElement[]} focusableCandidates Possible candidates list to choose from
 * @param {HTMLElement} elem The search origin (currently focused element)
 * @param {string} exitDir Direction requested
 * @return {{elem: HTMLElement|null, parentHasAutofocus: boolean}} candidate that gets the next focus or null if nothing valid found
 */

const getNextFromCandidates = (focusableCandidates, elem, exitDir) => {
  /**
   * The Candidates are already sorted by distance and filtered for valid direction
   * Now we need to check each candidate for:
   *  - if blockExits are available for current container and match the exitDir
   *    - if candidate is a not a container
   *      - if parent container of candidate and current container are same -> return candidate
   *      - else return null as exit is blocked
   *    - if candidate is a container
   *      - we've hit a block exit as we are trying to exit current container
   *      - return null as exit is blocked
   *  - if block exit is false
   *    - if candidate is a container
   *      - run autofocus logic on container to find next focus
   *    - if candidate is not a container
   *     - return candidate as is
   */
  let nextFocus = { elem: null, parentHasAutofocus: false };
  const originContainer = getParentContainer(elem);
  const blockExits = originContainer?.getAttribute(DATA_BLOCK_EXIT_ATTRIBUTE);
  const allowBlockExits = !(blockExits && blockExits.length > 0 && blockExits.split(' ').includes(exitDir));

  for (const candidate of focusableCandidates) {
    const candidateIsContainer = isContainer(candidate);
    if (!allowBlockExits) {
      if (!candidateIsContainer) {
        const candidatesContainer = getParentContainer(candidate);
        if (candidatesContainer === originContainer) {
          // Candidate is in the same container as current focus
          const parentHasAutofocus = candidatesContainer?.getAttribute(DATA_AUTOFOCUS_ATTRIBUTE) === 'true';
          return { elem: candidate, parentHasAutofocus };
        }
      }
      // Trying to enter a different container, exit is blocked, return null
      return { elem: null, parentHasAutofocus: false };
    }

    if (candidateIsContainer) {
      // Found a tvFocusable container, run the autofocus logic
      nextFocus = findDestinationOrAutofocus(elem, exitDir, candidate, true);
      return nextFocus;
    } else {
      // If the candidate is not a container, we can return it as is
      const parentHasAutofocus = getParentContainer(candidate)?.getAttribute(DATA_AUTOFOCUS_ATTRIBUTE) === 'true';
      nextFocus = { elem: candidate, parentHasAutofocus };
      return nextFocus;
    }
  }
  // If here, nothing could be found
  return nextFocus;
};

/**
 * Update auto focus information for all ancestors (.lrud-container which have auto-focus=true)
 * by setting their data-focus attribute to provided child's id
 *
 * @param {HTMLElement} elem The element representing the search origin (currently focused element)
 * @param {HTMLElement} scope The element LRUD spatial is scoped to operate within
 */
export const updateAncestorsAutoFocus = (elem, scope) => {
  // Traverse up the DOM tree and update all ancestor .lrud-container with data-autofocus="true"
  let current = elem.parentElement;
  while (current && current !== scope && current.tagName !== 'BODY') {
    if (isContainerWithAutofocus(current)) {
      current.setAttribute(DATA_FOCUS_ATTRIBUTE, elem.id);
    }
    current = current.parentElement;
  }
};

/**
 * Get the next focus candidate
 *
 * @param {HTMLElement} elem The search origin (currently focused element)
 * @param {string|number} keyOrKeyCode The key or keyCode value (from KeyboardEvent) of the pressed key
 * @param {HTMLElement} scope The element LRUD spatial is scoped to operate within
 * @return {{elem: HTMLElement, parentHasAutofocus: boolean}} The element that should receive focus next
 */
export const getNextFocus = (elem, keyOrKeyCode, scope) => {
  /**
   * If no scope provided, use document body
   * If no elem provided, find a default focus inside scope
   *
   * Get all candidates inside scope (focusable and with container collapse/expand logic)
   * Sort and filter candidates based on direction and distance
   * Find next focus from candidates
   * If still not found, return null
   */
  const exitDir = _keyMap[keyOrKeyCode];
  if (!scope || !scope.querySelector) scope = document.body;
  if (!elem) return getDefaultFocus(scope, exitDir);

  let nextFocus = null;

  let candidates = [];
  const focusables = getAllFocusables(elem, scope);
  candidates = sortValidCandidates(focusables, elem, exitDir);
  nextFocus = getNextFromCandidates(candidates, elem, exitDir);
  return nextFocus;
};