# Test Layouts for LRUD Spatial Navigation

This directory contains test layouts designed to validate the new LRUD spatial navigation implementation.

## Test Layout Files

### 1. `basic-grid.html`
- **Purpose**: Tests basic 2x2 grid navigation
- **Tests**: 
  - Default focus on first element
  - Arrow key navigation (up, down, left, right)
  - Boundary behavior (staying in place at edges)

### 2. `autofocus-container.html`
- **Purpose**: Tests `.lrud-container` with `data-autofocus="true"`
- **Key Features**:
  - Container remembers last focused child via `data-focus` attribute
  - Re-entering container returns to last focused element
- **Tests**:
  - Entering container focuses first child
  - Last focused child is remembered
  - `data-focus` attribute is updated correctly

### 3. `destinations-container.html`
- **Purpose**: Tests `data-destinations` attribute on containers
- **Key Features**:
  - `data-destinations="id1 id2 id3"` overrides default autofocus behavior
  - Always navigates to first valid destination when entering container
- **Tests**:
  - Entering container goes to destination element
  - Destinations take priority over `data-focus`

### 4. `block-exit-container.html`
- **Purpose**: Tests `data-block-exit` attribute (focus trapping)
- **Key Features**:
  - `data-block-exit="up down"` prevents exiting container in specified directions
  - Like `trapFocusUp`, `trapFocusDown` from React Native Web TV
- **Tests**:
  - Focus trapped in blocked directions
  - Focus allowed in non-blocked directions

### 5. `ignore-elements.html`
- **Purpose**: Tests `.lrud-ignore` class and `disabled` attribute
- **Tests**:
  - Elements with `.lrud-ignore` are skipped
  - Disabled elements are skipped
  - Children of ignored containers are skipped

### 6. `nested-autofocus.html`
- **Purpose**: Tests nested autofocus containers
- **Key Features**:
  - Multiple levels of `.lrud-container` with `data-autofocus="true"`
  - Each level maintains its own `data-focus`
- **Tests**:
  - Navigation through nested containers
  - `data-focus` tracked at each container level
  - Re-entering maintains correct focus at each level

### 7. `tv-focus.html`
- **Purpose**: Tests complex TV-like layout with nested containers, destinations, and block-exit
- **Key Features**:
  - Nested containers (outer without autofocus, inner with autofocus)
  - Inner container with empty `data-destinations=""` (focuses first child)
  - Block exit left on inner container
  - Destination guide container pointing to another button
- **Tests**:
  - Navigation into nested structure
  - Block exit behavior
  - Navigation within container
  - Destination navigation from guide container
  - Data-focus updates

## Key Implementation Features Tested

### 1. **Autofocus Containers** (`data-autofocus="true"`)
- When navigating from outside → container becomes a candidate itself
- When entering → focus goes to:
  1. `data-destinations` element (if set)
  2. `data-focus` element (if previously focused)
  3. First focusable child (by spatial logic)

### 2. **Destinations** (`data-destinations="id1 id2"`)
- Overrides `data-focus` behavior
- Always focuses first valid destination when entering container
- Space-separated list of element IDs

### 3. **Block Exit** (`data-block-exit="up down left right"`)
- Prevents focus from exiting container in specified directions
- Maps to React Native Web TV's `trapFocus*` props
- Space-separated list of directions

### 4. **Focus Memory** (`data-focus`)
- Automatically updated by `updateAncestorsAutoFocus()`
- Stores ID of last focused child in autofocus containers
- Used when re-entering container

### 5. **Ignore Logic**
- `.lrud-ignore` class: element and children ignored
- `disabled` attribute: element ignored
- `tabindex="-1"`: ignored unless `.lrud-container`

## Running the Tests

```bash
# Run core directional navigation tests (tests isValidCandidate logic)
yarn test:core

# Run layout-based tests (tests container behavior and focus memory)
yarn test:layouts

# Run both test suites together
yarn test:all

# Run all tests (default, includes both suites)
yarn test

# Start dev server to manually test layouts
yarn server
# Then visit http://localhost:3005/ to see both layout directories
```

## Test Organization

### Core Directional Navigation Tests (`test/lrud-directional.test.js`)
Located in `test/directional-layouts/`:
- **directional-validation.html** - Tests directional candidate filtering (right/left/up/down)
- **overlap-weighting.html** - Tests `data-lrud-overlap-threshold` attribute
- **alignment-priority.html** - Tests alignment prioritization in candidate selection
- **axis-overlap-priority.html** - Tests axis-band overlap prioritization vs far perfect alignment
- **complex-direction.html** - Tests complex diagonal and multi-directional scenarios
- **edge-cases.html** - Tests boundary conditions (zero-dimension, tiny, huge buttons)
- **screen-scope-header-single.html** - Tests single-header screen scope behavior
- **screen-scope-header-multiple.html** - Tests same-screen sibling header scope behavior
- **visibility.html** - Visibility fixture (currently not enabled in the Jest suite)

**Focus**: Validates the core `isValidCandidate()` algorithm and `sortValidCandidates()` sorting logic
**Test Count**: 29 tests

### Layout-Based Tests (`test/lrud.test.js`)
Located in `test/layouts/`:
- **basic-grid.html** - Basic 2x2 grid navigation
- **autofocus-container.html** - Container with `data-autofocus="true"` and focus memory
- **destinations-container.html** - Container with `data-destinations` attribute
- **destinations-fallback-no-autofocus.html** - Destinations fallback behavior without autofocus
- **destinations-fallback-with-autofocus.html** - Destinations fallback behavior with autofocus
- **destinations-only-container.html** - Container with destinations but no autofocus
- **block-exit-container.html** - Container with `data-block-exit` (focus trapping)
- **block-exit-container-focusable.html** - Focusable blocking container behavior
- **block-exit-no-autofocus.html** - Block-exit behavior without autofocus
- **ignore-elements.html** - Elements with `.lrud-ignore` class and `disabled` attribute
- **nested-autofocus.html** - Nested autofocus containers with multi-level focus tracking
- **nested-parent-blocks-right.html** - Parent block-exit precedence in nested containers
- **screen-scope.html** - Screen-level scope boundaries
- **screen-block-exit-right.html** - Block-exit behavior within a screen scope
- **tv-focus.html** - Complex TV layout combining all features
- **unreachable.html** - Tests unreachable elements and edge cases

**Focus**: Validates container behavior, focus memory, destinations, and block-exit logic
**Test Count**: 42 tests

## Test Structure

### Core Directional Navigation Tests
These tests focus on the **`isValidCandidate()` algorithm** which determines if a candidate element is in the correct direction and valid for focus:

1. **Directional validity and rejection rules**
  - Ensures only forward candidates in the requested direction are considered.

2. **Overlap and weighting behavior**
  - Validates `data-lrud-overlap-threshold` and weighted entry-point handling.

3. **Alignment and sorting priority**
  - Validates axis-band overlap and alignment/distance ordering.

4. **Complex geometry and edge conditions**
  - Covers diagonal movement, tiny/large targets, and boundary scenarios.

5. **Screen/header directional scoping**
  - Verifies same-screen header scoping and prevents cross-scope jumps.

### Layout-Based Tests
These tests focus on **container behavior** and **focus management**:

1. **Basic navigation and boundaries**
  - 2x2 grids and edge-of-layout behavior.

2. **Container semantics**
  - `data-autofocus`, `data-focus`, `data-destinations`, and `data-block-exit`.

3. **Fallback and precedence behavior**
  - Destination fallback, nested containers, and parent block-exit precedence.

4. **Screen-level scoping behavior**
  - `lrud-screen-*` boundaries and scoped block-exit behavior.

5. **TV-like mixed scenarios**
  - Complex compositions and unreachable target handling.

Each test follows this pattern:

1. **Load layout** - Navigate to test HTML file
2. **Wait for focus** - Ensure initial focus is set
3. **Simulate navigation** - Send arrow key events
4. **Assert state** - Check focused element ID or container attributes

## Adding New Tests

When adding new test layouts:

1. Create HTML file in `/test/layouts/`
2. Use consistent structure:
   - Include `styles.css` for styling
   - Include `handleKeyDown.js` for navigation
   - Use semantic IDs (e.g., `btn-1`, `container-1`)
3. Add test cases in `/test/lrud.test.js` (layout behavior) or `/test/lrud-directional.test.js` (directional/candidate behavior)
4. Document the layout purpose in this README

## Debugging Tips

1. **Visual Testing**: Use `yarn server` and navigate manually
2. **Inspect Attributes**: Check `data-focus`, `data-autofocus`, `data-destinations` in DevTools
3. **Focus Tracking**: Red outline shows currently focused element
4. **Container Borders**: 
   - Green solid border = `data-autofocus="true"`
   - Dotted border = `data-destinations` set
   - Dashed border = `data-block-exit` directions
