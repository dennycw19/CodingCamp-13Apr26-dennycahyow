# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a single `index.html` file (with optional companion `style.css` and `app.js`) using HTML, CSS, and Vanilla JavaScript. No build step, no framework, no backend. All state lives in a single JS object; every mutation persists to `localStorage` and re-renders the UI.

## Tasks

- [x] 1. Scaffold the HTML structure and CSS custom-property theming
  - Create `index.html` with semantic markup: `<header>` (balance + theme toggle), `<main>` (input form, sort controls, transaction list, canvas chart)
  - Add all element IDs referenced in the design: `#input-form`, `#item-name`, `#amount`, `#category`, `#custom-category`, `#submit-btn`, `#form-error`, `#balance-display`, `#sort-controls`, `#transaction-list`, `#spending-chart`, `#theme-toggle`
  - Define CSS custom properties (`--bg`, `--surface`, `--text`, `--accent`, etc.) under `[data-theme="light"]` and `[data-theme="dark"]` selectors on `:root`
  - Add a responsive layout (flexbox/grid) that works from 320 px to 1440 px without horizontal scrolling
  - Associate every form input with a `<label>`; add `aria-label` to the canvas
  - _Requirements: 1.1, 7.1, 7.2, 7.3, 6.1_

- [x] 2. Implement core state management and localStorage persistence
  - [x] 2.1 Define the state object and core mutation functions
    - Declare `const state = { transactions: [], sortMode: 'default', theme: 'light' }`
    - Implement `addTransaction(name, amount, category)` — generates a UUID (with `Date.now` fallback), pushes to `state.transactions`, calls `persist()` then `render()`
    - Implement `deleteTransaction(id)` — filters `state.transactions`, calls `persist()` then `render()`
    - Implement `setSortMode(mode)` — updates `state.sortMode`, calls `render()`
    - Implement `setTheme(theme)` — updates `state.theme`, writes `ebv_theme` to `localStorage`, sets `document.documentElement.dataset.theme`
    - _Requirements: 1.4, 2.3, 5.1, 5.2, 6.2_

  - [x] 2.2 Implement `persist()` and `loadFromStorage()`
    - `persist()`: wraps `localStorage.setItem('ebv_transactions', JSON.stringify(state.transactions))` in a try/catch; on quota error shows a transient "Could not save data." toast
    - `loadFromStorage()`: reads `ebv_transactions` and `ebv_theme`; catches `SecurityError`, `DOMException`, and `SyntaxError`; on any error initializes empty state and shows a persistent "Saved data could not be loaded." banner
    - On app startup, call `loadFromStorage()` then `render()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 2.3 Write property test for persistence round-trip (Property 6)
    - **Property 6: Persistence round-trip preserves all transaction data**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Generate random transaction arrays; call `persist()` then `loadFromStorage()`; assert deep equality of IDs, names, amounts, and categories in original order

- [x] 3. Implement form validation and transaction submission
  - [x] 3.1 Implement `validateForm(formData)`
    - Returns `{ valid: boolean, errors: string[] }`
    - Checks: name non-empty/non-whitespace, amount > 0, category resolved (custom field non-empty when "Custom" selected)
    - _Requirements: 1.5, 1.6_

  - [x] 3.2 Wire up the Input_Form submit handler
    - On `#category` change: show `#custom-category` when value is `"Custom"`, hide otherwise
    - On form submit: call `validateForm`; if invalid display errors in `#form-error` and return; if valid call `addTransaction` and reset all fields to defaults
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 3.3 Write property test for invalid submission leaves state unchanged (Property 2)
    - **Property 2: Invalid transaction submission leaves state unchanged**
    - **Validates: Requirements 1.5, 1.6**
    - Generate invalid form inputs (empty/whitespace name, zero/negative amount, Custom + empty custom field); assert `state.transactions` length is unchanged after each attempt

  - [ ]* 3.4 Write property test for custom category field visibility (Property 10)
    - **Property 10: Custom category field visibility matches selector state**
    - **Validates: Requirements 1.2, 1.3**
    - Programmatically set `#category` to each option value; assert `#custom-category` is visible iff value is `"Custom"`

  - [ ]* 3.5 Write property test for form reset after valid submission (Property 11)
    - **Property 11: Form resets to empty state after successful submission**
    - **Validates: Requirements 1.7**
    - Generate random valid transactions; submit each; assert all form fields are reset to their default empty/initial state

- [x] 4. Implement the transaction list renderer and sort controls
  - [x] 4.1 Implement `sortTransactions(transactions, mode)`
    - `'amount'`: sort descending by `amount`
    - `'category'`: sort ascending alphabetically by `category`
    - `'default'`: reverse insertion order (newest first — rely on array order; no mutation of `state.transactions`)
    - Returns a new sorted array; never mutates the original
    - _Requirements: 2.4, 2.5, 2.6_

  - [x] 4.2 Implement `renderTransactionList()`
    - Calls `sortTransactions(state.transactions, state.sortMode)`
    - Clears and rebuilds `#transaction-list` as a `<ul>` of `<li>` items, each showing name, formatted amount, category badge, and a delete button with `data-id`
    - Attaches delete button click handlers that call `deleteTransaction(id)`
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 4.3 Wire up sort controls in `#sort-controls`
    - On change, call `setSortMode(mode)` which triggers `render()`
    - _Requirements: 2.4, 2.5, 2.6_

  - [ ]* 4.4 Write property test for sort by amount (Property 7)
    - **Property 7: Sort by amount produces descending order**
    - **Validates: Requirements 2.4**
    - Generate random transaction lists; apply `sortTransactions(list, 'amount')`; assert each item's amount ≥ the next item's amount

  - [ ]* 4.5 Write property test for sort by category (Property 8)
    - **Property 8: Sort by category produces ascending alphabetical order**
    - **Validates: Requirements 2.5**
    - Generate random transaction lists; apply `sortTransactions(list, 'category')`; assert each item's category ≤ the next item's category lexicographically

  - [ ]* 4.6 Write property test for default sort (Property 9)
    - **Property 9: Default sort preserves insertion order (newest first)**
    - **Validates: Requirements 2.6**
    - Generate random sequences of additions; apply `sortTransactions(list, 'default')`; assert the result is the reverse of insertion order

  - [ ]* 4.7 Write property test for delete removes exactly the targeted transaction (Property 3)
    - **Property 3: Delete removes exactly the targeted transaction**
    - **Validates: Requirements 2.3**
    - Generate a list with ≥1 transaction; call `deleteTransaction(id)` for a random entry; assert length decreases by exactly 1 and the deleted ID is absent

- [x] 5. Checkpoint — verify list, sort, and delete work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement the balance display and chart
  - [x] 6.1 Implement `formatCurrency(amount)` and `renderBalance()`
    - `formatCurrency`: formats a number as `$X.XX` (or locale equivalent)
    - `renderBalance()`: sums `state.transactions` amounts; writes formatted result to `#balance-display`; shows `$0.00` when list is empty
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 6.2 Write property test for balance equals sum of amounts (Property 4)
    - **Property 4: Balance equals sum of all transaction amounts**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    - Generate random transaction lists (including empty); assert the value produced by the balance calculation equals `transactions.reduce((s, t) => s + t.amount, 0)`

  - [x] 6.3 Implement `aggregateByCategory(transactions)`
    - Returns a `Map<string, number>` of category → total amount
    - _Requirements: 4.1, 4.5_

  - [ ]* 6.4 Write property test for chart proportions match category totals (Property 5)
    - **Property 5: Chart segment proportions and labels match category totals**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**
    - Generate random non-empty transaction lists; call `aggregateByCategory`; assert each category's proportion equals `categoryTotal / grandTotal` and the label contains the category name and percentage

  - [x] 6.5 Implement `renderChart(canvas, transactions)`
    - If `transactions` is empty: draw a placeholder circle with "No data" text
    - Otherwise: call `aggregateByCategory`; draw arc segments with the defined color palette; draw labels outside each segment showing category name and percentage
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Implement theme toggle and OS-preference detection
  - [x] 7.1 Implement theme initialization in `loadFromStorage()`
    - Read `ebv_theme` from `localStorage`; if present call `setTheme(value)`
    - If absent, read `window.matchMedia('(prefers-color-scheme: dark)')` and apply accordingly
    - _Requirements: 6.3, 6.4_

  - [x] 7.2 Wire up `#theme-toggle`
    - On click/change, call `setTheme(newTheme)` which updates `document.documentElement.dataset.theme` and persists to `localStorage`
    - _Requirements: 6.1, 6.2_

  - [ ]* 7.3 Write property test for theme persistence round-trip (Property 12)
    - **Property 12: Theme persistence round-trip restores last selected theme**
    - **Validates: Requirements 6.3**
    - For each theme value (`'light'`, `'dark'`): call `setTheme(value)`; simulate reload by calling `loadFromStorage()`; assert `state.theme` and `document.documentElement.dataset.theme` match the stored value

- [x] 8. Implement valid transaction addition and list-growth property
  - [ ]* 8.1 Write property test for valid transaction addition grows the list (Property 1)
    - **Property 1: Valid transaction addition grows the list by exactly one**
    - **Validates: Requirements 1.4, 2.1**
    - Generate random valid transactions (non-empty name, positive amount, non-empty resolved category); call `addTransaction`; assert `state.transactions.length` increased by 1 and the new entry has the correct fields

- [x] 9. Final checkpoint — full integration review
  - Ensure all tests pass, ask the user if questions arise.
  - Manually verify the app loads in Chrome, Firefox, Edge, and Safari
  - Confirm `localStorage` read/write cycle works end-to-end
  - Confirm theme toggle persists across a simulated page reload
  - Confirm responsive layout at 320 px, 375 px, and 1440 px viewport widths

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP (NFR-1: no test setup required)
- Property tests require a library such as [fast-check](https://github.com/dubzzz/fast-check); skip all `*` sub-tasks if no test harness is desired
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation before moving to the next phase
