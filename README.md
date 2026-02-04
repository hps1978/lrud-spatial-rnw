<p align="center">
  <img src=".github/lrud.svg" alt="LRUD Spatial - React Native Web TV"/>
</p>

# LRUD Spatial - React Native Web TV Edition

**Spatial Navigation for React Native Web TV Platforms**

This is a modified version of [@bbc/lrud-spatial](https://github.com/bbc/lrud-spatial) adapted to provide alignment-prioritized spatial navigation tailored for React Native Web TV. It aspires to implements the core principles of Android TV's directional navigation system and the requirements of TVFocusGuideView component in React Native TVOS.

## Overview

This library works in conjunction with [React Native Web TV](https://github.com/hps1978/react-native-web-tv) to provide seamless spatial navigation. It uses directional keys (Left, Right, Up, Down) to navigate focus around HTML documents, with a focus on alignment-first candidate selection that aspires to mirror Android TV behavior.

**Status**: Both this library and React Native Web TV are experimental implementations designed to support **Spatial Navigation out of the box** in React Native Web TV applications.

### Key Enhancements from BBC LRUD

- **Alignment Prioritization**: Candidates aligned on the movement axis are prioritized before distant candidates
- **Performance Optimizations**: Replaced `Element.matches()` calls with direct DOM API methods in hot paths
- **Focus Memory**: Containers automatically track the last focused child via `data-focus` attribute required for TVFocusGuideView
- **Destination Fallback**: Supports dynamic destination overrides with graceful fallback to directional navigation (destinations feature of TVFocusGuideView)
- **Block Exit Support**: Prevent focus from leaving containers in specified directions (focus trapping of React Native TVOS)
- **Autofocus Containers**: Containers can automatically determine focus based on user preference and focus memory (autoFocus feature of TVFocusGuideView)

## React Native Web TV Integration

This library is designed to work seamlessly with React Native Web TV's `TVFocusGuideView` component. The following attributes map React Native Web TV props to LRUD spatial navigation:

### TVFocusGuideView Property Mapping

| React Native Web TV Prop | HTML Attribute | Purpose |
|--------------------------|----------------|---------|
| `tvFocusable={true}` or `container={true}` | `.lrud-container` | Marks element as a spatial navigation container with `tabindex="-1"` |
| `focusable={false}` | `.lrud-ignore` | Prevents element and its children from participating in spatial navigation |
| `autoFocus={true}` | `data-autofocus="true"` | Enables focus memory via `data-focus` attribute; tracks last focused child |
| `destinations={component1Ref, component2Ref]}` | `data-destinations="id1 id2"` | Override focus to specific destinations (space-separated IDs) |
| `trapFocusUp={true}` | `data-block-exit="up"` | Block focus from exiting container upward |
| `trapFocusDown={true}` | `data-block-exit="down"` | Block focus from exiting container downward |
| `trapFocusLeft={true}` | `data-block-exit="left"` | Block focus from exiting container leftward |
| `trapFocusRight={true}` | `data-block-exit="right"` | Block focus from exiting container rightward |

> **Note**: Multiple block-exit directions can be combined as a space-separated list: `data-block-exit="up down"`

### Focus Resolution Rules

#### Initial Focus (First Time in Container)

When focus first enters a container with `data-autofocus="true"`, the focus resolution follows this priority:

1. **Destinations Override** (Highest Priority)
   - If `data-destinations` attribute exists with valid element IDs, focus the first valid element
   - Falls back to directional navigation if destination elements are removed from DOM

2. **Focus Memory** (Second Priority)
   - If `data-focus` attribute contains a valid element ID, focus that previously-focused child
   - Useful for maintaining UI state across container exits/entries

3. **Spatial Algorithm** (Default)
   - Uses alignment-prioritized directional candidate selection to find the best initial focus candidate
   - Prioritizes candidates aligned on the primary axis before distance
   - Falls back to first focusable child if no better candidate is found

#### Directional Navigation

When navigating with arrow keys inside a container:

1. **Axis-Band Priority**: Candidates overlapping the starting element's perpendicular axis are preferred
   - For horizontal movement (left/right): Vertical overlap (30% default)
   - For vertical movement (up/down): Horizontal overlap (30% default)

2. **Within Axis Band**: Distance-first sorting
   - Choose closest candidate by Euclidean distance
   - Then by alignment delta if distance is equal
   - Then by DOM order

3. **Out-of-Axis Fallback**: Traditional alignment-first for sparse layouts
   - Alignment delta (perpendicular axis alignment) matters most
   - Then by distance for candidates with similar alignment
   - Then by DOM order

4. **DOM Order**: Final tiebreaker when distance and alignment are equal

#### Exit Strategy

When attempting to exit a container:

- If `data-block-exit` contains the exit direction, focus remains trapped in container
- If exit is allowed, the spatial algorithm finds the best candidate outside the container
- If the outside candidate is another container, its autofocus logic applies

## API

<pre>
getNextFocus(<i>currentFocus</i>, <i>keyOrKeyCode</i>, <i>[scope]</i>)
</pre>

### Parameters

- `currentFocus` should be an
  [`HTMLElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)
  that you want LRUD spatial to consider as the element you are navigating _from_.
  In simple applications, this can just be a reference to `document.activeElement`.
- `keyOrKeyCode` should be a
  [`key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) string or
  a [`keyCode`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode)
  decimal representing the directional key pressed.
- `scope` is an optional `HTMLElement` that you only want to look for focusable candidates inside of. Defaults to the whole page if not provided.

### Returns

```javascript
{
  elem: HTMLElement | null,           // The element that should receive focus
  parentHasAutofocus: boolean         // Whether parent container has autofocus enabled
}
```

Returns an object containing:
- `elem`: The next focusable element, or `null` if no valid candidate exists
- `parentHasAutofocus`: Boolean indicating if the focused element's parent container has `data-autofocus="true"` (useful for tracking focus state)

### Helper Function

<pre>
updateAncestorsAutoFocus(<i>elem</i>, <i>scope</i>)
</pre>

Updates the `data-focus` attribute on all ancestor containers with `data-autofocus="true"`, storing the currently focused element's ID. This maintains focus memory across container exits and re-entries.

- `elem`: The currently focused element (should have a unique `id` attribute)
- `scope`: The scope element (typically the root container or document body)

### Configuration

<pre>
setConfig(<i>config</i>)
</pre>

Configures the key mapping for directional navigation. This allows customization of which key codes are mapped to navigation directions.

**Parameters**:
- `config` - An object with the following structure:

```javascript
{
  keyMap: {
    // Key code to direction mapping
    37: 'left',      // ArrowLeft key code
    39: 'right',     // ArrowRight key code
    38: 'up',        // ArrowUp key code
    40: 'down',      // ArrowDown key code
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    // ... additional mappings for remote control key codes
  }
}
```

**Default Key Mappings**:
The library includes built-in mappings for:
- **Standard keyboard**: `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`
- **Numeric key codes**: 37 (left), 39 (right), 38 (up), 40 (down)
- **Android TV remote**: Various proprietary key codes (214, 205, 218 for left; 213, 206, 217 for right; 211, 203, 215 for up; 212, 204, 216 for down)
- **Legacy keyCodes**: 4, 5, 19, 20, 21, 22, 29460, 29461

**Example**:
```javascript
import { setConfig } from '@bbc/tv-lrud-spatial';

// Add custom remote control key codes
setConfig({
  keyMap: {
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    // Custom remote control mappings
    1001: 'left',    // Custom remote left button
    1002: 'right',   // Custom remote right button
    1003: 'up',      // Custom remote up button
    1004: 'down'     // Custom remote down button
  }
});
```

This is particularly useful for TV remotes that use non-standard key codes or when integrating with custom input handling systems.

## Focusable Elements

LRUD spatial defines focusable elements as those which match any of the following CSS selectors:

- `[tabindex]` (for `tabindex >= 0`)
- `a`
- `button`
- `input`

**Note**: All selector except tabindex need to be reviewed if they are needed.

### Ignoring Focusables

Any potential candidate with the `.lrud-ignore` class, or inside any parent with the `.lrud-ignore` class, will not be considered focusable and will be skipped over. By default LRUD will not ignore candidates that have `opacity: 0` or have a parent with `opacity: 0`, so this class can be used for that.

Focusables with a `tabindex="-1"` attribute will be skipped over, **however** any focusable inside any parent with `tabindex="-1"` will still be considered focusable (important for `.lrud-container` elements which use `tabindex="-1"`).

Potential candidates with `disabled` or `aria-disabled="true"` attributes will not be considered focusable.

### Focusable Overlap Threshold

By default, LRUD measures to all candidates that are in the direction to move. It also includes candidates that overlap the current focus by up to **30%**, allowing directional movements to include elements that are slightly off-axis.

For example:
- Moving **right** can focus on something **above** the current focus if 30% of the target's width extends to the right
- Moving **down** can focus on something **left** of the current focus if 30% of the target's height extends downward

This threshold can be adjusted on a per-element basis using the `data-lrud-overlap-threshold` attribute, as a float from 0.0 to 1.0:

```html
<!-- Strict directional alignment: only candidates entirely in the direction -->
<button data-lrud-overlap-threshold="0.0">Strict</button>

<!-- Relaxed alignment: up to 70% off-axis allowed -->
<button data-lrud-overlap-threshold="0.7">Relaxed</button>
```

An overlap of `0.0` makes a candidate only be considered if it is located _entirely_ in the direction of movement.

**Note**: LRUD does not consider the Z-axis, which can cause surprising results with overlapping elements. Use this attribute to help alleviate issues with full-screen overlays or complex UIs.

## Containers

Containers are navigation scopes that can manage focus state and enforce navigation rules. They are defined by the `.lrud-container` class and `tabindex="-1"` attribute.

### Focus Memory with `data-focus`

Containers with `data-autofocus="true"` automatically track the last focused child element using the `data-focus` attribute:

```html
<!-- Focus memory enabled -->
<div class="lrud-container" data-autofocus="true">
  <button id="btn1">Button 1</button>
  <button id="btn2">Button 2</button>
  <button id="btn3">Button 3</button>
</div>
```

When a user focuses `btn2` and then exits the container, the container stores `data-focus="btn2"`. Upon re-entering the container, focus automatically returns to `btn2` instead of the first child.

**Requirements**: 
- Focusable children must have unique `id` attributes
- Container must have `data-autofocus="true"` enabled
- Use `updateAncestorsAutoFocus(elem, scope)` to update focus memory when focus changes

### Destinations Override

The `data-destinations` attribute allows specifying preferred focus targets as a space-separated list of element IDs:

```html
<div class="lrud-container" data-autofocus="true" data-destinations="priority-btn secondary-btn fallback-btn">
  <button id="priority-btn">High Priority</button>
  <button id="secondary-btn">Secondary</button>
  <button id="fallback-btn">Fallback</button>
  <button id="other">Not in destinations</button>
</div>
```

Focus resolution:
1. First, the library attempts to focus the first valid element in the `data-destinations` list
2. If that element is removed from the DOM, it tries the next one
3. If all destination elements are removed or invalid:
   - **With `data-autofocus="true"`**: Falls back to focus memory (`data-focus`) or first focusable child
   - **Without `data-autofocus`**: Falls back to spatial navigation algorithm (best candidate by alignment/distance)

### Block Exit - Focus Trapping

Prevent focus from leaving a container in specific directions using `data-block-exit`:

```html
<!-- Block upward and downward exits (e.g., modal dialog) -->
<div class="lrud-container" data-block-exit="up down" data-autofocus="true">
  <button id="btn1">Option 1</button>
  <button id="btn2">Option 2</button>
  <button id="close">Close</button>
</div>
```

When `data-block-exit` contains a direction:
- Attempting to navigate in that direction keeps focus within the container
- The spatial algorithm finds the best candidate within the container itself
- This is useful for modal dialogs, popups, or constrained focus regions

**Valid directions**: `up`, `down`, `left`, `right` (space-separated combinations allowed)

### Nested Containers

Containers can be nested, and the library respects the hierarchy:

```html
<div class="lrud-container" id="outer">
  <button id="outer-btn1">Outer Button 1</button>
  
  <div class="lrud-container" data-autofocus="true" id="inner">
    <button id="inner-btn1">Inner Button 1</button>
    <button id="inner-btn2">Inner Button 2</button>
  </div>
  
  <button id="outer-btn2">Outer Button 2</button>
</div>
```

- Moving focus into the inner container automatically applies its autofocus logic
- Focus memory is maintained independently for each container
- Block exits are applied at the appropriate container level


## How It Works

LRUD Spatial's algorithm is inspired by Android TV navigation and implements alignment-prioritized candidate selection.

### Navigation Algorithm

To determine the next element that should be focused:

1. **Direction Mapping**: Converts the key/keyCode to a direction (`left`, `right`, `up`, `down`)
2. **Candidate Collection**: Finds all focusable elements within the navigation scope
3. **Direction Filtering**: Removes candidates that are not in the requested direction
4. **Alignment Sorting**: Orders candidates into two tiers
   - **First tier**: Candidates overlapping the starting element's axis band (30% threshold)
   - Within first tier: Sort by distance (closest first), then alignment, then DOM order
   - **Second tier**: Remaining out-of-axis candidates
   - Within second tier: Sort by alignment (best first), then distance, then DOM order
5. **Distance Sorting**: Applied within each tier appropriately (distance-first for axis-overlap, secondary for out-of-axis)
6. **Container Resolution**: If the candidate is a container with `data-autofocus`, apply focus logic
7. **Block Exit Validation**: Check if exit is blocked in the chosen direction

### Alignment Priority Strategy with Axis-Overlap Priority

This is the key enhancement that makes navigation feel natural on TV platforms:

**New Behavior: Axis-Band Distance-First**

The algorithm now uses a **two-tier prioritization**:

1. **Tier 1: Axis-Band Overlap** (Highest Priority)
   - Candidates whose bounds overlap the starting element's axis band (perpendicular axis) are prioritized
   - For horizontal movement (left/right): Vertical overlap matters (at least 30% by default)
   - For vertical movement (up/down): Horizontal overlap matters (at least 30% by default)
   - **Within axis-overlapping candidates: Distance wins** — closer candidates beat farther aligned ones

2. **Tier 2: Out-of-Axis Candidates** (Lower Priority)
   - Candidates outside the axis band fall back to alignment-first behavior
   - Perfect alignment trumps distance for these candidates
   - **Alignment → Distance → DOM Order**

**Example: Navigating Right**

```
Current Focus:    ┌──────────┐
                  │ Button   │  (Y: 50-100)
                  └──────────┘

Axis Band (30% vertical overlap):  Y: 64-86

Candidates:
- Candidate A:  ┌────────┐        ← BEST (70px away, overlaps axis band by 40%)
                │ Button │  (Y: 70-95)
                └────────┘

- Candidate B:      ┌──────┐      ← SECOND (130px away, perfectly aligned Y:50-100)
                    │Button│  (Y: 50-100)
                    └──────┘

- Candidate C:   ┌─────────┐      ← THIRD (150px away, far off-axis Y:10-35)
                 │ Button  │  (Y: 10-35)
                 └─────────┘
```

**Rationale**: 
- **Candidate A wins** because it overlaps the origin's axis band and is closer (distance-first within axis)
- **Candidate B loses** even though perfectly aligned, because it's farther and outside the axis band
- **Candidate C loses** due to both poor alignment and distance

This matches Android TV behavior for more predictable navigation: focus moves to nearby candidates that share your axis before considering distant perfectly-aligned ones.

**Fallback Behavior**:
When no axis-overlapping candidates exist, alignment-first prioritization resumes for out-of-axis candidates, ensuring alignment-based navigation still works in sparse layouts.


### Performance Optimizations

This version includes several performance enhancements:
- **Eliminated `Element.matches()` calls** in hot paths, using direct DOM API methods instead
- **Optimized candidate filtering** with Set data structures for ignored elements
- **Memoized container checks** avoiding repeated selector matching
- **Direct attribute access** instead of computed style lookups

These optimizations are critical for TV platforms where CPU resources are limited and navigation must be responsive.

## Developing

Requirements: Node.js 18

To get started, run `npm ci`.

### Building

`npm run build` will emit a transpiled and minified version of the library. This is run during CI to prepare the artifact published to NPM. It can also be useful for integrating against another local project with `npm link`.

### Testing

The test suite is organized into two separate test runners:

#### Layout Tests - Container Behavior (`test/lrud.test.js`)
Tests core container functionality including:
- Focus memory and `data-focus` attribute tracking
- Destinations override behavior and fallback scenarios
- Block exit focus trapping
- Autofocus container logic
- Nested container navigation
- Edge cases (zero-dimension elements, removed DOM elements)

Run with: `npm run test:layouts`

#### Directional Tests - Spatial Navigation (`test/lrud-directional.test.js`)
Tests directional navigation algorithm including:
- Alignment prioritization (axis-aligned candidates first)
- Overlap weighting with `data-lrud-overlap-threshold`
- Complex diagonal movements
- Edge case candidate selection
- Candidate ordering by distance and alignment

Run with: `npm run test:core`

#### All Tests
Run complete test suite with: `npm run test:all` or `npm test`

**Test Layout Files**: The `test/layouts/` directory contains HTML files designed to mirror real-world use cases:
- Basic navigation grids and lists
- Nested container hierarchies
- Block exit scenarios
- Autofocus and focus memory validation
- Destinations fallback cases
- TV-specific layouts (tiled items, etc.)

Significant new features should come with corresponding layout files and test cases.

#### Debugging

The tests use [puppeteer](https://github.com/puppeteer/puppeteer) to spin up a headless browser. The browser loads layouts and runs test scenarios against the unminified code from `lib/`.

To investigate test failures or debug navigation behavior:

1. Start the development server: `npm run server`
2. Open [http://localhost:3005](http://localhost:3005) in a browser
3. Select a layout file to interact with
4. Use arrow keys to navigate and observe focus behavior
5. Open browser DevTools to inspect DOM attributes and focus state

This allows you to verify spatial navigation behavior in a real browser environment.

## Architecture Overview

### Core Modules

**`lib/lrud.js`** (701 lines)
- Main spatial navigation engine
- Key exports:
  - `getNextFocus(elem, keyOrKeyCode, scope)` - Main navigation API
  - `updateAncestorsAutoFocus(elem, scope)` - Updates focus memory
  - `getParentContainer(elem)` - Traverses to parent container
  - `setConfig(config)` - Configuration for TV Navigation

**Key Internal Functions**:
- `sortValidCandidates()` - Implements alignment-first sorting
- `isValidCandidate()` - Directional filtering with overlap tolerance
- `findDestinationOrAutofocus()` - Applies focus resolution logic
- `getNextFromCandidates()` - Selects next focus from sorted candidates
- `getFocusables()` - Gathers focusable elements respecting ignore rules

### Data Attributes Reference

| Attribute | Type | Values | Purpose |
|-----------|------|--------|---------|
| `class="lrud-container"` | CSS Class | Fixed | Marks element as navigation container |
| `tabindex="-1"` | HTML Attr | Fixed | Makes container non-focusable, only children |
| `data-autofocus` | Custom Attr | `"true"` / `"false"` | Enables focus memory tracking |
| `data-focus` | Custom Attr | Element ID | Stores last focused child (auto-managed) |
| `data-destinations` | Custom Attr | Space-separated IDs | Priority focus targets |
| `data-block-exit` | Custom Attr | Directions | Trap focus in container |
| `data-lrud-overlap-threshold` | Custom Attr | 0.0 - 1.0 | Directional alignment tolerance |

## Related Projects

- **[React Native Web TV](https://github.com/hps1978/react-native-web-tv)** - React Native Web port with built-in spatial navigation support
- **[@bbc/lrud-spatial](https://github.com/bbc/lrud-spatial)** - Original BBC implementation

## Contributing

This is an experimental project. Contributions are welcome, particularly for:
- Performance optimizations for constrained TV environments
- Additional test coverage for edge cases
- Documentation and examples
- Integration with other React Native Web TV components

## License

Apache-2.0 (inherited from BBC LRUD Spatial)

## Acknowledgments

Built on the excellent foundation of [@bbc/lrud-spatial](https://github.com/bbc/lrud-spatial), with significant enhancements for TV platform compatibility and React Native Web integration.

---

**Status**: Experimental | **Target**: TV Platforms | **Framework**: React Native Web
