I will implement the "Complexity Rating" selector in `Step1BasicInfo.tsx` to match the UI design.

### 1. Create a Rating Component
I will implement a rating component that displays numbers 1-10 with radio-button style selection, as seen in the screenshot (circles with numbers below). This will be integrated directly into `Step1BasicInfo.tsx` or as a small reusable internal component.

### 2. Update `Step1BasicInfo.tsx`
I will modify `src/pages/ContractManagementPage/components/Step1BasicInfo.tsx` to:
*   Add the "Complexity Rating (1-10)" section.
*   Use `Forger` with a custom component render prop or standard `Controller` pattern to manage the `rating` field.
*   The UI will consist of a label, an info icon (optional, based on screenshot), and a row of 10 circular selectable options.

### 3. Styling
I will use Tailwind CSS to match the design:
*   Selected state: Filled circle (like a radio button) with border.
*   Unselected state: Empty circle.
*   Numbers 1-10 displayed below each circle.
*   Horizontal layout with appropriate spacing.

This aligns with the schema update we made earlier where we added the `rating` field.
