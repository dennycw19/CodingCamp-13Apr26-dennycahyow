# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly, client-side web application that helps users track their daily spending. It provides a real-time total balance, a scrollable transaction history, category-based filtering and sorting, and a pie chart visualization of spending by category. All data is persisted in the browser's Local Storage. The app supports dark and light display modes.

## Glossary

- **App**: The Expense & Budget Visualizer web application.
- **Transaction**: A single spending record consisting of an item name, a monetary amount, and a category.
- **Category**: A label assigned to a Transaction. Built-in categories are Food, Transport, and Fun. Users may also define Custom categories.
- **Custom_Category**: A user-defined category name entered when the "Custom" option is selected in the input form.
- **Transaction_List**: The scrollable UI component that displays all recorded Transactions.
- **Balance_Display**: The UI component at the top of the App that shows the current total of all Transaction amounts.
- **Chart**: The pie chart UI component that visualizes spending distribution across categories.
- **Input_Form**: The UI component containing fields for entering a new Transaction.
- **Local_Storage**: The browser's Web Storage API used to persist Transaction data client-side.
- **Theme_Toggle**: The UI control that switches the App between dark mode and light mode.

---

## Requirements

### Requirement 1: Transaction Input

**User Story:** As a user, I want to enter a new transaction with a name, amount, and category, so that I can record my spending.

#### Acceptance Criteria

1. THE Input_Form SHALL contain a text field for item name, a numeric field for amount, and a category selector with the options Food, Transport, Fun, and Custom.
2. WHEN the user selects the Custom option in the category selector, THE Input_Form SHALL display an additional text field for entering a custom category name.
3. WHEN the user selects any category option other than Custom, THE Input_Form SHALL hide the custom category text field.
4. WHEN the user submits the Input_Form with all required fields filled, THE App SHALL add a new Transaction to the Transaction_List.
5. IF the user submits the Input_Form with one or more required fields empty, THEN THE Input_Form SHALL display a validation error message identifying the missing fields and SHALL NOT add a Transaction.
6. IF the user submits the Input_Form with the Custom option selected and the custom category text field empty, THEN THE Input_Form SHALL display a validation error message and SHALL NOT add a Transaction.
7. WHEN a Transaction is successfully added, THE Input_Form SHALL reset all fields to their default empty state.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to view, sort, and delete my recorded transactions, so that I can manage my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all recorded Transactions, each showing the item name, amount, and category.
2. THE Transaction_List SHALL be scrollable when the number of Transactions exceeds the visible area.
3. WHEN the user activates the delete control on a Transaction, THE App SHALL remove that Transaction from the Transaction_List and from Local_Storage.
4. WHEN the user selects the sort-by-amount option, THE Transaction_List SHALL reorder Transactions in descending order by amount.
5. WHEN the user selects the sort-by-category option, THE Transaction_List SHALL reorder Transactions in ascending alphabetical order by category name.
6. WHEN no sort option is selected, THE Transaction_List SHALL display Transactions in the order they were added, most recent first.

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my total spending balance at the top of the page, so that I always know how much I have spent in total.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of the amounts of all Transactions currently in the Transaction_List.
2. WHEN a Transaction is added, THE Balance_Display SHALL update to reflect the new total without requiring a page reload.
3. WHEN a Transaction is deleted, THE Balance_Display SHALL update to reflect the new total without requiring a page reload.
4. WHILE the Transaction_List is empty, THE Balance_Display SHALL show a total of zero.

---

### Requirement 4: Spending Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE Chart SHALL display a pie chart where each segment represents one category and its size is proportional to the total amount spent in that category relative to all Transactions.
2. WHEN a Transaction is added, THE Chart SHALL update to reflect the new spending distribution without requiring a page reload.
3. WHEN a Transaction is deleted, THE Chart SHALL update to reflect the new spending distribution without requiring a page reload.
4. WHILE the Transaction_List is empty, THE Chart SHALL display a placeholder state indicating no data is available.
5. THE Chart SHALL label each segment with the category name and its percentage of total spending.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my transactions to be saved between sessions, so that I do not lose my spending history when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a Transaction is added, THE App SHALL write the updated Transaction data to Local_Storage.
2. WHEN a Transaction is deleted, THE App SHALL write the updated Transaction data to Local_Storage.
3. WHEN the App loads, THE App SHALL read all previously stored Transactions from Local_Storage and populate the Transaction_List, Balance_Display, and Chart accordingly.
4. IF Local_Storage is unavailable or returns a parse error on load, THEN THE App SHALL initialize with an empty Transaction_List and display an error message informing the user that saved data could not be loaded.

---

### Requirement 6: Dark and Light Mode

**User Story:** As a user, I want to toggle between dark and light display modes, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL provide a Theme_Toggle control that switches between dark mode and light mode.
2. WHEN the user activates the Theme_Toggle, THE App SHALL apply the selected theme to all visible UI components without requiring a page reload.
3. WHEN the App loads, THE App SHALL apply the theme that was last selected by the user, as stored in Local_Storage.
4. IF no theme preference is stored, THEN THE App SHALL apply the theme that matches the user's operating system preference as reported by the browser.

---

### Requirement 7: Mobile-Friendly Layout

**User Story:** As a user, I want the app to work well on my phone, so that I can track spending on the go.

#### Acceptance Criteria

1. THE App SHALL use a responsive layout that adapts to viewport widths from 320px to 1440px without horizontal scrolling.
2. THE Input_Form, Transaction_List, Balance_Display, and Chart SHALL each remain fully usable on a viewport width of 375px.
3. THE App SHALL render and function correctly in current stable versions of Chrome, Firefox, Edge, and Safari.
