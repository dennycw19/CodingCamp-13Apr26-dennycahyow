# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a single-page, client-side web application built with HTML, CSS, and Vanilla JavaScript. It requires no build step, no framework, and no backend. All data is persisted in the browser's `localStorage`. The app can be opened directly as a local file or served as a static site, and it is also suitable for packaging as a browser extension.

The core user flow is:
1. Enter a transaction (name, amount, category)
2. See the transaction appear in the list, the balance update, and the pie chart refresh
3. Optionally sort or delete transactions
4. Toggle dark/light theme at any time
5. Return later and find all data intact

### Key Design Decisions

- **No framework**: Keeps the bundle to a single HTML file (or a small set of static files), ensuring fast load times and zero dependency risk.
- **Canvas-based pie chart**: The `<canvas>` API is universally supported and avoids any charting library dependency.
- **CSS custom properties for theming**: A single `data-theme` attribute on `<html>` drives all color changes via CSS variables, making theme switching instant and reliable.
- **Module pattern with a single state object**: All application state lives in one plain JS object; every mutation goes through a small set of functions that also persist to `localStorage` and re-render the UI.

---

## Architecture

The application follows a simple **unidirectional data flow**:

```
User Action → State Mutation → Persist to localStorage → Re-render UI
```

```mermaid
flowchart TD
    A[User Interaction] --> B[Action Handler]
    B --> C[State Mutation]
    C --> D[localStorage.setItem]
    C --> E[render()]
    E --> F[renderTransactionList]
    E --> G[renderBalance]
    E --> H[renderChart]
    E --> I[applyTheme]
```

### File Structure

```
expense-budget-visualizer/
├── index.html        ← markup + inline <style> + inline <script>
```

A single `index.html` is the simplest deployable unit. Alternatively, styles and scripts can be split into `style.css` and `app.js` for maintainability — the design supports either approach.

### State Shape

```js
const state = {
  transactions: [],   // Transaction[]
  sortMode: 'default', // 'default' | 'amount' | 'category'
  theme: 'light'       // 'light' | 'dark'
};
```

All mutations call `persist()` then `render()`.

---

## Components and Interfaces

### 1. Input Form (`#input-form`)

Responsible for collecting and validating new transaction data.

**Elements:**
- `#item-name` — text input
- `#amount` — number input (positive values only)
- `#category` — `<select>` with options: Food, Transport, Fun, Custom
- `#custom-category` — text input, hidden unless "Custom" is selected
- `#submit-btn` — submit button
- `#form-error` — error message container

**Behaviour:**
- On category change: show/hide `#custom-category`
- On submit: validate → add transaction → reset form
- Validation rules: name non-empty, amount > 0, category resolved (custom field non-empty when Custom selected)

### 2. Balance Display (`#balance-display`)

A single `<span>` or `<div>` showing the formatted sum of all transaction amounts.

**Update trigger:** called by `renderBalance()` after every state change.

### 3. Transaction List (`#transaction-list`)

A scrollable `<ul>` where each `<li>` represents one transaction.

**Each list item contains:**
- Item name
- Amount (formatted as currency)
- Category badge
- Delete button (`data-id` attribute holds transaction ID)

**Sort controls** (radio buttons or a `<select>` above the list):
- Default (insertion order, newest first)
- By amount (descending)
- By category (alphabetical ascending)

### 4. Pie Chart (`#spending-chart`)

A `<canvas>` element rendered by a pure JS drawing function.

**Rendering logic:**
1. Aggregate transaction amounts by category
2. Compute each category's percentage of total
3. Draw arc segments using `ctx.arc()` with distinct colors
4. Draw labels (category name + percentage) outside each segment
5. If no transactions: draw a placeholder circle with "No data" text

**Color palette** (accessible, works in both themes):
| Category | Color |
|---|---|
| Food | `#FF6384` |
| Transport | `#36A2EB` |
| Fun | `#FFCE56` |
| Custom (1st) | `#4BC0C0` |
| Custom (2nd) | `#9966FF` |
| Custom (3rd+) | `#FF9F40` |

### 5. Theme Toggle (`#theme-toggle`)

A `<button>` or `<input type="checkbox">` that flips `state.theme` between `'light'` and `'dark'`, writes to `localStorage`, and sets `document.documentElement.dataset.theme`.

### 6. Sort Controls (`#sort-controls`)

A group of buttons or a `<select>` that sets `state.sortMode` and triggers a re-render of the transaction list.

---

## Data Models

### Transaction

```js
/**
 * @typedef {Object} Transaction
 * @property {string} id        - UUID (crypto.randomUUID() or Date.now() fallback)
 * @property {string} name      - Item name (non-empty string)
 * @property {number} amount    - Positive number
 * @property {string} category  - Resolved category label (never "Custom")
 */
```

### localStorage Keys

| Key | Value |
|---|---|
| `ebv_transactions` | JSON array of `Transaction` objects |
| `ebv_theme` | `"light"` or `"dark"` |

### Core Functions

```js
// State management
function addTransaction(name, amount, category): void
function deleteTransaction(id): void
function setSortMode(mode): void
function setTheme(theme): void

// Persistence
function persist(): void          // writes state.transactions to localStorage
function loadFromStorage(): void  // reads and parses localStorage on startup

// Rendering
function render(): void           // calls all sub-renderers
function renderTransactionList(): void
function renderBalance(): void
function renderChart(canvas, transactions): void

// Validation
function validateForm(formData): { valid: boolean, errors: string[] }

// Utilities
function sortTransactions(transactions, mode): Transaction[]
function aggregateByCategory(transactions): Map<string, number>
function formatCurrency(amount): string
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid transaction addition grows the list

*For any* transaction list and any valid transaction (non-empty name, positive amount, non-empty resolved category), adding that transaction SHALL result in the transaction list length increasing by exactly one and the new transaction appearing in the list with its correct name, amount, and category.

**Validates: Requirements 1.4, 2.1**

### Property 2: Invalid transaction submission leaves state unchanged

*For any* transaction list, submitting the input form with any combination of invalid fields — including empty or whitespace-only name, zero or negative amount, or Custom selected with an empty custom category field — SHALL leave the transaction list unchanged and SHALL not add a transaction.

**Validates: Requirements 1.5, 1.6**

### Property 3: Delete removes exactly the targeted transaction

*For any* transaction list containing at least one transaction, deleting a transaction by its ID SHALL result in a list that no longer contains that ID and whose length is exactly one less than before.

**Validates: Requirements 2.3**

### Property 4: Balance equals sum of all transaction amounts

*For any* transaction list (including the empty list), the value computed for the Balance_Display SHALL equal the arithmetic sum of the `amount` fields of all transactions in the list (and zero when the list is empty).

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 5: Chart segment proportions and labels match category totals

*For any* non-empty transaction list, the chart data produced by `aggregateByCategory` SHALL assign each category a proportion equal to that category's total amount divided by the sum of all transaction amounts, and each segment SHALL carry a label containing the category name and its percentage.

**Validates: Requirements 4.1, 4.2, 4.3, 4.5**

### Property 6: Persistence round-trip preserves all transaction data

*For any* transaction list, serializing it to `localStorage` via `persist()` and then deserializing it via `loadFromStorage()` SHALL produce a list that is deeply equal to the original (same IDs, names, amounts, and categories, in the same order).

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 7: Sort by amount produces descending order

*For any* transaction list, applying `sortTransactions(list, 'amount')` SHALL produce a list where every transaction's amount is greater than or equal to the amount of the transaction that follows it.

**Validates: Requirements 2.4**

### Property 8: Sort by category produces ascending alphabetical order

*For any* transaction list, applying `sortTransactions(list, 'category')` SHALL produce a list where every transaction's category is lexicographically less than or equal to the category of the transaction that follows it.

**Validates: Requirements 2.5**

### Property 9: Default sort preserves insertion order (newest first)

*For any* sequence of transaction additions, applying `sortTransactions(list, 'default')` SHALL produce a list in reverse insertion order — the most recently added transaction appears first.

**Validates: Requirements 2.6**

### Property 10: Custom category field visibility matches selector state

*For any* state of the category selector, the custom category text field SHALL be visible if and only if "Custom" is the selected option, and hidden for all other options.

**Validates: Requirements 1.2, 1.3**

### Property 11: Form resets to empty state after successful submission

*For any* valid transaction submission, after the transaction is added, all form fields (name, amount, category selector, custom category) SHALL be reset to their default empty/initial state.

**Validates: Requirements 1.7**

### Property 12: Theme persistence round-trip restores last selected theme

*For any* theme value ('light' or 'dark'), storing it via `setTheme()` and then calling `loadFromStorage()` SHALL restore the same theme value and apply it to the document.

**Validates: Requirements 6.3**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` unavailable on load | Catch `SecurityError` / `DOMException`; initialize with empty state; show persistent banner: "Saved data could not be loaded." |
| `localStorage` parse error on load | Catch `SyntaxError` from `JSON.parse`; initialize with empty state; show same banner |
| `localStorage` write failure (quota exceeded) | Catch error in `persist()`; show transient toast: "Could not save data." |
| Form submitted with empty fields | Inline validation error below the form; no state change |
| Amount is zero or negative | Inline validation error; no state change |
| Custom category selected but field empty | Inline validation error; no state change |
| `crypto.randomUUID` unavailable | Fall back to `Date.now().toString(36) + Math.random().toString(36)` for ID generation |

---

## Testing Strategy

### Unit Tests (example-based)

Focus on specific, concrete scenarios:

- `validateForm` returns errors for each invalid input combination
- `sortTransactions` with an empty list returns an empty list
- `sortTransactions` with a single item returns that item unchanged
- `aggregateByCategory` correctly sums amounts for the same category
- `formatCurrency` formats edge values (0, negative, large numbers)
- `loadFromStorage` with malformed JSON initializes to empty state
- `renderBalance` shows `$0.00` when transaction list is empty

### Property-Based Tests

Use a property-based testing library (e.g., [fast-check](https://github.com/dubzzz/fast-check) for JavaScript) with a minimum of **100 iterations per property**.

Each test is tagged with the corresponding design property:

| Tag format | `Feature: expense-budget-visualizer, Property N: <property text>` |
|---|---|

**Properties to implement as PBT:**

- **Property 1** — Generate random valid transactions; verify list length grows by 1 and transaction appears with correct fields
- **Property 2** — Generate invalid form inputs (empty/whitespace name, zero/negative amount, Custom + empty custom field); verify list unchanged
- **Property 3** — Generate a list with ≥1 transaction; delete one; verify length decreases by 1 and ID is absent
- **Property 4** — Generate random transaction lists (including empty); verify balance equals `sum(amounts)`
- **Property 5** — Generate random non-empty transaction lists; verify `aggregateByCategory` proportions and labels match chart segment data
- **Property 6** — Generate random transaction lists; serialize → deserialize; verify deep equality
- **Property 7** — Generate random transaction lists; apply sort-by-amount; verify descending order invariant
- **Property 8** — Generate random transaction lists; apply sort-by-category; verify alphabetical ascending order invariant
- **Property 9** — Generate random sequences of additions; verify default sort is newest-first
- **Property 10** — Generate random category selector values; verify custom field visibility matches "Custom" selection
- **Property 11** — Generate random valid transactions; submit; verify all form fields reset to defaults
- **Property 12** — Generate random theme values; store via `setTheme`; reload; verify theme restored

### Integration / Smoke Tests

- App loads without errors in Chrome, Firefox, Edge, Safari (manual or Playwright smoke test)
- `localStorage` read/write cycle works end-to-end in a real browser
- Theme toggle persists across a simulated page reload

### Accessibility Checks

- All form inputs have associated `<label>` elements
- Color contrast meets WCAG AA ratios in both themes
- Interactive elements are keyboard-navigable
- Chart canvas has an `aria-label` describing the chart content
