# Expense & Budget Visualizer

A lightweight, client-side personal expense tracker built with plain HTML, CSS, and Vanilla JavaScript. No frameworks, no build tools, no backend — just open the file and start tracking.

---

## Description

Expense & Budget Visualizer helps you record and monitor your daily spending directly in the browser. Every transaction is saved to `localStorage` so your data persists across sessions. The app displays a real-time total balance, a sortable transaction history, and an interactive pie chart that breaks down spending by category — all without requiring an internet connection or account.

---

## Features

- **Add transactions** — Enter an item name, amount (formatted as Indonesian Rupiah), and a category to log a new expense.
- **Edit transactions** — Modify the name, amount, or category of any existing transaction inline without leaving the page.
- **Delete transactions** — Remove a transaction with a confirmation prompt to prevent accidental deletion.
- **Custom categories** — Create your own spending categories beyond the built-in Food, Transport, and Fun options.
- **Category management** — View all custom categories in a dedicated panel. Delete a custom category (only allowed when no transactions are using it).
- **Pie chart visualization** — An interactive canvas-based pie chart shows spending distribution by category, with hover tooltips displaying the category name and total amount.
- **Chart legend** — A color-coded legend below the chart lists every category with its percentage share.
- **Real-time balance** — The total spending balance updates instantly whenever a transaction is added, edited, or deleted.
- **Sort transactions** — Sort the transaction list by default order (newest first), amount (descending), or category (alphabetical).
- **Dark / Light theme** — Toggle between dark and light mode. The selected theme is saved and restored on the next visit.
- **LocalStorage persistence** — All transactions, custom categories, and theme preference are saved in the browser and survive page reloads.
- **Confirmation dialogs** — Custom modal dialogs confirm destructive actions (delete transaction, delete category) and block category deletion when it is still in use.
- **Toast notifications** — Non-intrusive toast messages confirm successful actions (add, delete) and surface errors.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 (semantic elements) |
| Styling | CSS3 (custom properties, flexbox, grid, responsive design) |
| Logic | Vanilla JavaScript (ES6+) |
| Storage | Web Storage API (`localStorage`) |
| Charts | HTML5 Canvas API |
| No dependencies | Zero external libraries or frameworks |

---

## How It Works

1. **State** — All application data lives in a single `state` object: `transactions`, `customCategories`, `sortMode`, and `theme`.
2. **Mutations** — Every change (add, edit, delete) goes through a dedicated function that updates `state`, writes to `localStorage` via `persist()`, and calls `render()` to refresh the UI.
3. **Rendering** — `render()` rebuilds the transaction list, balance display, pie chart, chart legend, and custom category panel from the current state on every update.
4. **Color generation** — Custom category colors are generated deterministically using a golden-angle HSL algorithm, ensuring each new category gets a visually distinct color that does not clash with the built-in palette.
5. **Chart interaction** — Mouse position is mapped to canvas coordinates on every `mousemove` event to hit-test pie slices and display a tooltip with the category name and formatted amount.
6. **Persistence** — On startup, `loadFromStorage()` reads `ebv_transactions`, `ebv_custom_categories`, and `ebv_theme` from `localStorage` and restores the full application state before the first render.

---

## Installation & Setup

No installation or build step is required.

1. **Clone or download** the repository:
   ```bash
   git clone https://github.com/your-username/CodingCamp-13Apr26-dennycahyow.git
   ```

2. **Open `index.html`** in any modern browser:
   ```
   CodingCamp-13Apr26-dennycahyow/
   └── index.html   ← open this file directly
   ```

3. That's it — no `npm install`, no build, no server required.

> **Browser support:** Chrome, Firefox, Edge, and Safari (current stable versions).

---

## Usage Guide

### Adding a Transaction

1. Fill in the **Item name** field.
2. Enter the **Amount** — the field automatically formats the number with dot separators and an `Rp` prefix.
3. Select a **Category** from the dropdown (Food, Transport, Fun, or any custom category you have created).
   - To create a new category, choose **Custom…**, then type the name in the field that appears.
4. Click **Add Transaction**. The transaction appears at the top of the list, the balance updates, and the chart refreshes.

### Editing a Transaction

1. Find the transaction in the list and click the **Edit** button.
2. An inline edit form replaces the row — update the name, amount, or category as needed.
3. Click **Save** to apply the changes, or **Cancel** to discard them.

### Deleting a Transaction

1. Click the **Delete** button on any transaction row.
2. A confirmation dialog appears — click **Yes, proceed** to confirm, or **Cancel** to abort.
3. A success notification confirms the deletion.

### Managing Custom Categories

- **Create:** Select **Custom…** in the category dropdown, enter a name, and submit a transaction. The category is registered automatically and appears in the **Custom Categories** panel.
- **Delete:** Click the **✕** button next to a category in the Custom Categories panel.
  - If the category is still used by one or more transactions, deletion is blocked and an alert explains why.
  - If the category is unused, a confirmation dialog appears before it is removed.

### Sorting Transactions

Use the **Sort** buttons above the transaction list:
- **Default** — newest transactions first.
- **Amount** — highest amount first.
- **Category** — alphabetical order.

### Switching Themes

Click the **🌙 Dark / ☀️ Light** button in the header to toggle between dark and light mode. The preference is saved automatically.

---

## Future Improvements

- **Backend integration** — Sync data to a server or cloud database so it is accessible across devices.
- **User authentication** — Support multiple user accounts with private transaction histories.
- **Date & time tracking** — Record when each transaction occurred and filter by date range.
- **Export / Import** — Download transactions as CSV or JSON, and import from a file.
- **Budget limits** — Set monthly spending limits per category and receive alerts when approaching the limit.
- **Recurring transactions** — Mark transactions as recurring (daily, weekly, monthly) for automatic re-entry.
- **Advanced analytics** — Monthly trend charts, spending comparisons, and category breakdowns over time.
- **Currency selection** — Support multiple currencies with live exchange rate conversion.
- **PWA support** — Add a service worker and manifest so the app can be installed on mobile devices and used offline.

---

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

You are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of this software, provided the original copyright notice and this permission notice are included in all copies or substantial portions of the software.
