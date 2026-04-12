# MessageComposer Reply User Selection - Design

## 1. Problem Statement

The `MessageComposer` component currently accepts a single `replyToUser` prop which is hardcoded or passed as a static value. In `RfiTable.tsx`, it is hardcoded to `"Zenith Solution"`. Users need the ability to select which user they are replying to from a list of available respondents via a dropdown menu.

## 2. Architecture Overview

### Current Behavior
- `MessageComposer` receives `replyToUser?: { name: string; avatar?: string }`
- Displays "Reply to: {replyToUser?.name}" in the header when `!isNewChat && sendType`
- No user selection capability

### Proposed Behavior
- Add optional `availableUsers?: Array<{ name: string; avatar?: string }>` prop
- When `availableUsers` is provided, render a dropdown menu in the header to select the reply recipient
- The selected user becomes the new `replyToUser` value
- When `availableUsers` is not provided, fall back to existing behavior (static display)

## 3. Component Changes

### MessageComposer (SolicitationManagementPage)
**Props Interface Update:**
```typescript
interface MessageComposerProps {
  // ... existing props
  replyToUser?: {
    name: string;
    avatar?: string;
  };
  // NEW: Optional list of users to choose from
  availableUsers?: Array<{
    name: string;
    avatar?: string;
  }>;
  // ... existing props
}
```

**Internal State:**
- Add `selectedReplyUser` state, initialized from `replyToUser`
- When `availableUsers` is provided, use `selectedReplyUser` for display
- When `availableUsers` is not provided, fall back to `replyToUser` prop

**UI Changes:**
- In the header section, replace the static "Reply to: {name}" display with:
  - If `availableUsers` is provided: Dropdown showing all available users
  - If not: Static text display (existing behavior)

## 4. Backward Compatibility

- Existing usages (`QuestionsTab.tsx`, `ChangeDetailsSheet.tsx`) do not pass `availableUsers`
- They continue to work exactly as before
- Only `RfiTable.tsx` (and any new usage) will leverage the dropdown

## 5. Testing Strategy

- Verify existing usages still display "Reply to: {name}" correctly
- Verify new dropdown renders when `availableUsers` is provided
- Verify user can select different users from dropdown
- Verify selected user is displayed in the header

## 6. Out of Scope

- Fetching the list of available users (caller provides the list)
- Persisting selected user across component unmount/remount
- Any API changes to support user selection