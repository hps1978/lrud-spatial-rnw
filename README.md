<!--
  This is a community-maintained fork of @bbc/tv-lrud-spatial.
  Copyright (C) 2026 Harpreet Singh. Portions copyright BBC.
  Licensed under the Apache License, Version 2.0. See LICENSE for details.
-->

# LRUD Spatial - React Native Web TV Edition (Community Fork)

**Thank you to the original BBC maintainers and contributors for providing a great foundation for this work.**

**This is a fork of the BBC's [@bbc/tv-lrud-spatial](https://github.com/bbc/lrud-spatial) project, maintained by Harpreet Singh.**

- Original author: BBC
- Fork maintainer: Harpreet Singh <hps1978@users.noreply.github.com>
- License: Apache-2.0 (see LICENSE)

This fork documents and implements spatial navigation behavior aligned with React Native Web TV focus semantics. 

It is implemented with the sole purpose of being used with the RNW TV branch. If anyone finds it useful for other purposes, that is great too.

## Status

Experimental.

## RNW TV Mapping

### TVFocusGuideView to DOM/LRUD mapping

| RNW TV concept | LRUD marker in this fork | Notes |
|---|---|---|
| `container={true}` / tv-focusable container | `.lrud-container` + `tabindex="0"` | Participates as a focusable container candidate |
| `focusable={false}` | `.lrud-ignore` | Excludes node and descendants from candidate search. |
| `autoFocus={true}` | `data-autofocus="true"` | Enables focus memory behavior via `data-focus` |
| `destinations={[ref1, ref2, ...]}` | `data-destinations="id1 id2 ..."` | First valid id has priority on container entry |
| `trapFocusUp` | `data-block-exit="up"` | Blocks leaving container upward |
| `trapFocusDown` | `data-block-exit="down"` | Blocks leaving container downward |
| `trapFocusLeft` | `data-block-exit="left"` | Blocks leaving container to the left |
| `trapFocusRight` | `data-block-exit="right"` | Blocks leaving container to the right |

`data-block-exit` supports multiple directions as a space-separated list.

## Fork-Specific Definitions

### Container types

- Focusable container: `.lrud-container` with `tabindex="0"`.
- Non-focusable container: `.lrud-container` without focusable semantics, still usable for block-exit scoping.

### Screen-level scoping with `lrud-screen-<name>`

- If the currently focused element is inside an element whose id starts with `lrud-screen-`, LRUD applies screen/header-aware scope resolution.
- This is intended for app-driven screen boundaries (for example React Navigation style screen containers).
- This convention must be applied by the App layer by assigning ids such as `lrud-screen-home`, `lrud-screen-settings`, and their relative headers if defined separately such as `lrud-screen-home-header-left`.
- Smaller scope means fewer focus candidates to evaluate, which improves next-focus computation performance.

#### ID conventions used by the resolver

- Screen root: `id="lrud-screen-<screenName>"`
  - Examples: `lrud-screen-home`, `lrud-screen-details`.
- Header root: `id="lrud-screen-<screenName>-<headerName>"`
  - Examples: `lrud-screen-home-header`, `lrud-screen-home-header-left`.
- Parsing rule in the resolver:
  - First `-` after the `lrud-screen-` prefix separates screen vs header.
  - No `-` after prefix => treated as a screen id.
  - With `-` => treated as a header id that belongs to the parsed screen.

#### Direction-aware scoping behavior

When origin is inside a screen (`SCREEN` type):

- `up`: include screen + headers for that screen.
  - Internally, headers are queried by prefix `"${screen}-"`.
- `left`, `right`, `down`: restrict to the screen only.

When origin is inside a header (`HEADER` type):

- `down`: include owning screen (if found) + sibling headers matching the current header prefix query.
- `left`, `right`, `up`: keep navigation in header scope (closest header + matching header siblings).

This enables header <-> screen transitions only on vertical intent (`up` from screen, `down` from header), while reducing accidental cross-scope jumps for horizontal moves.

### Virtualized list container marker with `tabindex="-999"`

- `tabindex="-999"` is used to mark special TVFocusGuideView containers created for FlatList/virtualized-list behavior.
- During parent-container resolution, these internal containers are skipped by default so app-level containers remain the effective scoping boundary.
- This avoids incorrectly scoping navigation to internal list wrappers.

### Test coverage for these scoping conventions

- `test/lrud.test.js` includes container scoping cases using `lrud-screen-*` ids:
  - `should scope navigation to the current screen container` (`test/layouts/screen-scope.html`)
  - `should scope navigation to blocked container within a screen` (`test/layouts/screen-block-exit-right.html`)
  - `should block right exit when parent container blocks it even if child allows it` (`test/layouts/nested-parent-blocks-right.html`)
- `test/lrud-directional.test.js` includes directional screen/header scoping fixtures:
  - `should keep left navigation scoped to a single header and not enter screen content` (`test/directional-layouts/screen-scope-header-single.html`)
  - `should move between same-screen left/right headers and not jump into screen content` (`test/directional-layouts/screen-scope-header-multiple.html`)
- There is still no dedicated fixture in this repo that explicitly asserts `tabindex="-999"` (virtualized-list marker) behavior in isolation.

### Other TV-specific test coverage in this repo

- `test/lrud.test.js` covers TVFocusGuideView-style container behavior:
  - Autofocus and focus memory (`test/layouts/autofocus-container.html`, `test/layouts/nested-autofocus.html`)
  - Destinations priority and fallback (`test/layouts/destinations-container.html`, `test/layouts/destinations-only-container.html`)
  - Trap focus/block exit behavior (`test/layouts/block-exit-container.html`, `test/layouts/block-exit-container-focusable.html`, `test/layouts/block-exit-no-autofocus.html`)
  - Ignore and disabled semantics (`test/layouts/ignore-elements.html`)
  - Mixed TV-like composition scenarios (`test/layouts/tv-focus.html`)
- `test/lrud-directional.test.js` covers directional selection behavior that impacts TV feel and predictability:
  - Axis overlap and alignment priority (`test/directional-layouts/axis-overlap-priority.html`, `test/directional-layouts/alignment-priority.html`)
  - Overlap threshold handling (`test/directional-layouts/overlap-weighting.html`)
  - Screen/header scope boundaries for directional moves (`test/directional-layouts/screen-scope-header-single.html`, `test/directional-layouts/screen-scope-header-multiple.html`)
  - Complex directional and edge-case candidate filtering (`test/directional-layouts/complex-direction.html`, `test/directional-layouts/edge-cases.html`, `test/directional-layouts/directional-validation.html`)

### Focus memory

- `data-focus` stores the last focused child id.
- `data-focus` is updated only for ancestor containers with `data-autofocus="true"`.
- If no valid remembered target exists, fallback behavior is used.

### Destination priority

On container entry, resolution order is:

1. `data-destinations` (first valid id in list)
2. `data-focus` (only when autofocus is enabled)
3. Fallback candidate selection

If destinations are configured but none resolve, fallback is used and the no-valid-destination callback can run.

### Block exit behavior

- If requested direction is listed in `data-block-exit`, focus search is constrained to the blocking container scope.
- If direction is not blocked, candidate search continues outside the container as normal.

### Candidate validity and directional filtering

- Focus candidates are directional: candidates behind the movement direction are excluded.
- Per-candidate overlap tolerance is configurable by `data-lrud-overlap-threshold`.
- Default overlap tolerance is `0.3` when attribute is absent.

### Sorting strategy in this fork

- Tier 1: candidates overlapping the origin axis band are prioritized.
- Tier 1 sorting: distance, then alignment delta, then DOM order.
- Tier 2 (non-overlap) sorting: alignment delta, then distance, then DOM order.

This gives nearby on-axis movement preference while keeping alignment-first behavior for sparse layouts.

### Ignored/excluded candidates

- `.lrud-ignore` excludes the element and descendants.
- `[disabled]` excludes the element.
- `tabindex="-1"` elements are excluded from normal candidate selection.

## Reference Attributes

| Attribute | Type | Meaning |
|---|---|---|
| `.lrud-container` | Class | Marks a container boundary |
| `.lrud-ignore` | Class | Excludes subtree from navigation |
| `data-autofocus` | Attribute | Enables focus memory behavior |
| `data-focus` | Attribute | Stores last focused child id |
| `data-destinations` | Attribute | Preferred destination id list |
| `data-block-exit` | Attribute | Directional focus trap flags |
| `data-lrud-overlap-threshold` | Attribute | Directional overlap tolerance per candidate |
| `id="lrud-screen-<name>"` | Id convention | App-defined screen scope boundary for candidate search |
| `tabindex="-999"` | Attribute value | Internal FlatList TVFocusGuideView marker, ignored in default parent scoping |

## Related

- [React Native Web TV](https://github.com/hps1978/react-native-web-tv)
- [@bbc/lrud-spatial](https://github.com/bbc/lrud-spatial)

## License

Apache-2.0