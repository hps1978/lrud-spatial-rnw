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
npm run test:core

# Run layout-based tests (tests container behavior and focus memory)
npm run test:layouts

# Run both test suites together
npm run test:all

# Run all tests (default, includes both suites)
npm test

# Start dev server to manually test layouts
npm run server
# Then visit http://localhost:3005/ to see both layout directories
```

## Test Organization

### Core Directional Navigation Tests (`test/lrud-directional.test.js`)
Located in `test/directional-layouts/`:
- **directional-validation.html** - Tests directional candidate filtering (right/left/up/down)
- **overlap-weighting.html** - Tests `data-lrud-overlap-threshold` attribute
- **alignment-priority.html** - Tests alignment prioritization in candidate selection
- **complex-direction.html** - Tests complex diagonal and multi-directional scenarios
- **edge-cases.html** - Tests boundary conditions (zero-dimension, tiny, huge buttons)

**Focus**: Validates the core `isValidCandidate()` algorithm and `sortValidCandidates()` sorting logic
**Test Count**: 22 tests

### Layout-Based Tests (`test/lrud.test.js`)
Located in `test/layouts/`:
- **basic-grid.html** - Basic 2x2 grid navigation
- **autofocus-container.html** - Container with `data-autofocus="true"` and focus memory
- **destinations-container.html** - Container with `data-destinations` attribute
- **destinations-only-container.html** - Container with destinations but no autofocus
- **block-exit-container.html** - Container with `data-block-exit` (focus trapping)
- **ignore-elements.html** - Elements with `.lrud-ignore` class and `disabled` attribute
- **nested-autofocus.html** - Nested autofocus containers with multi-level focus tracking
- **tv-focus.html** - Complex TV layout combining all features
- **unreachable.html** - Tests unreachable elements and edge cases
- **hidden.html** - Tests hidden and visibility scenarios
- **disabled.html** - Tests disabled attribute behavior
- **focusable-container-with-empty-space.html** - Tests containers with gaps
- **container-with-empty-space.html** - Tests navigation with empty space
- **tiled-items.html** - Tests tiled grid layout navigation

**Focus**: Validates container behavior, focus memory, destinations, and block-exit logic
**Test Count**: 29 tests

## Test Structure

### Core Directional Navigation Tests
These tests focus on the **`isValidCandidate()` algorithm** which determines if a candidate element is in the correct direction and valid for focus:

1. **Directional Validation** (2 tests)
   - Ensures only candidates in the correct direction (right/left/up/down) are selected
   - Validates that opposite-direction candidates are rejected

2. **Overlap Weighting** (3 tests)
   - Tests `data-lrud-overlap-threshold` attribute
   - Validates default (0.3), high (0.8), and low (0.1) overlap values
   - Ensures weighted entry point calculation works correctly

3. **Alignment Priority** (3 tests)
   - Tests that perfectly aligned candidates are prioritized
   - Validates multi-level sorting: alignment → distance → DOM order
   - Confirms alignment takes priority even if farther away

4. **Complex Directions** (3 tests)
   - Tests diagonal candidates and multi-directional scenarios
   - Validates exact alignment detection (e.g., exact-down, exact-right)
   - Ensures complex geometry is handled correctly

5. **Edge Cases** (4 tests)
   - Tests boundary conditions: very small buttons, very large buttons
   - Validates zero-dimension button exclusion
   - Tests candidates at exact boundaries
   - Ensures off-boundary candidates are rejected

6. **WeightedEntryPoint Calculation** (3 tests)
   - Tests how overlap weighting affects candidate validity
   - Validates different overlap thresholds change what's selectable
   - Ensures weighting is applied correctly for all directions

### Layout-Based Tests
These tests focus on **container behavior** and **focus management**:

1. **Basic Navigation** (5 tests)
   - 2x2 grid navigation
   - Arrow key response
   - Boundary handling

2. **Container Features** (12 tests)
   - Autofocus containers with focus memory (`data-focus`)
   - Destinations (`data-destinations`)
   - Focus trapping (`data-block-exit`)
   - Nested container structures

3. **Ignore Logic** (3 tests)
   - `.lrud-ignore` class behavior
   - `disabled` attribute handling
   - Children of ignored containers

4. **Advanced Scenarios** (9 tests)
   - TV-like complex layouts
   - Unreachable elements
   - Hidden elements
   - Tiled grids
   - Empty space navigation

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
3. Add test cases in `/test/lrud-new.test.js`
4. Document the layout purpose in this README

## Debugging Tips

1. **Visual Testing**: Use `npm run server` and navigate manually
2. **Inspect Attributes**: Check `data-focus`, `data-autofocus`, `data-destinations` in DevTools
3. **Focus Tracking**: Red outline shows currently focused element
4. **Container Borders**: 
   - Green solid border = `data-autofocus="true"`
   - Dotted border = `data-destinations` set
   - Dashed border = `data-block-exit` directions
