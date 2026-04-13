# MessageComposer Reply User Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dropdown user selection to MessageComposer component when `availableUsers` prop is provided, without breaking existing usages.

**Architecture:** Extend the `MessageComposerProps` interface with optional `availableUsers` array. Add internal state to track selected reply user. Conditionally render a dropdown when `availableUsers` is provided, otherwise fall back to existing static display behavior.

**Tech Stack:** React, TypeScript, shadcn/ui DropdownMenu

---

## File Structure

- Modify: `src/pages/SolicitationManagementPage/components/MessageComposer.tsx`
- Modify: `src/pages/ContractManagementPage/components/RfiTable.tsx`

---

## Tasks

### Task 1: Update MessageComposer Props Interface

**Files:**
- Modify: `src/pages/SolicitationManagementPage/components/MessageComposer.tsx:10-18`

- [ ] **Step 1: Add `availableUsers` prop to interface**

```typescript
interface MessageComposerProps {
  onSend: (content: string, type: "reply" | "addendum" | null) => void;
  isLoading?: boolean;
  replyToUser?: {
    name: string;
    avatar?: string;
  };
  // NEW PROP: List of users to choose from for reply
  availableUsers?: Array<{
    name: string;
    avatar?: string;
  }>;
  currentUser?: {
    name: string;
    avatar?: string;
  };
  sendType: "reply" | "addendum" | null;
  isNewChat: boolean;
  onSendTypeChange: (type: "reply" | "addendum") => void;
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new errors

---

### Task 2: Add Internal State for Selected Reply User

**Files:**
- Modify: `src/pages/SolicitationManagementPage/components/MessageComposer.tsx:36-55`

- [ ] **Step 1: Add state and update component signature**

```typescript
const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  isLoading = false,
  replyToUser,
  availableUsers, // NEW
  currentUser,
  sendType,
  isNewChat,
}) => {
  const { isProcurement } = useUserRole();
  const [content, setContent] = useState("");
  const [selectedReplyUser, setSelectedReplyUser] = useState(replyToUser); // NEW STATE
  const user = useUser();

  // Use authenticated user data or fallback to prop/default
  const displayUser = user
    ? {
        name: user.name,
        avatar: user.avatar,
      }
    : currentUser || { name: "You" };

  // Sync selectedReplyUser when replyToUser prop changes
  React.useEffect(() => {
    setSelectedReplyUser(replyToUser);
  }, [replyToUser]);
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new errors

---

### Task 3: Update Header to Show Dropdown When AvailableUsers Provided

**Files:**
- Modify: `src/pages/SolicitationManagementPage/components/MessageComposer.tsx:68-82`

- [ ] **Step 1: Replace static display with conditional dropdown**

Replace:
```typescript
{/* Header */}
{!isNewChat && sendType && (
  <div className="py-3">
    <div className="flex items-center gap-3">
      <Avatar className="h-14 w-14">
        <AvatarImage src={displayUser.avatar} />
        <AvatarFallback className="text-lg">
          {getInitials(displayUser.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Reply to:
        </span>
        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
          {replyToUser?.name || ""}
        </span>
      </div>
    </div>
  </div>
)}
```

With:
```typescript
{/* Header */}
{!isNewChat && sendType && (
  <div className="py-3">
    <div className="flex items-center gap-3">
      <Avatar className="h-14 w-14">
        <AvatarImage src={displayUser.avatar} />
        <AvatarFallback className="text-lg">
          {getInitials(displayUser.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Reply to:
        </span>
        {availableUsers && availableUsers.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-sm">
                {selectedReplyUser?.name || "Select user"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {availableUsers.map((user, index) => (
                <DropdownMenuItem
                  key={user.name + index}
                  onClick={() => setSelectedReplyUser(user)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            {replyToUser?.name || ""}
          </span>
        )}
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: Add DropdownMenu imports at top of file**

Add to existing import from "react":
```typescript
import React, { useState, useEffect } from "react";
```

Add DropdownMenu imports:
```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
```

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new errors

---

### Task 4: Update RfiTable.tsx to Pass Available Users

**Files:**
- Modify: `src/pages/ContractManagementPage/components/RfiTable.tsx:447-457`

- [ ] **Step 1: Update MessageComposer usage with availableUsers**

Replace:
```typescript
<MessageComposer
  onSend={(content) => {
    void handleSendComment(content);
  }}
  isLoading={addCommentMutation.isPending}
  replyToUser={{ name: "Zenith Solution" }}
  currentUser={{ name: "You" }}
  sendType="reply"
  isNewChat={false}
  onSendTypeChange={() => {}}
/>
```

With:
```typescript
<MessageComposer
  onSend={(content) => {
    void handleSendComment(content);
  }}
  isLoading={addCommentMutation.isPending}
  replyToUser={{ name: "Zenith Solution" }}
  availableUsers={[
    { name: "Zenith Solution" },
    { name: "Procurement Team" },
    { name: "Contract Manager" },
  ]}
  currentUser={{ name: "You" }}
  sendType="reply"
  isNewChat={false}
  onSendTypeChange={() => {}}
/>
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new errors

---

### Task 5: Verify Existing Usages Still Work

**Files:**
- Check: `src/pages/SolicitationManagementPage/components/QuestionsTab.tsx`
- Check: `src/pages/ContractManagementPage/components/ChangeDetailsSheet.tsx`

- [ ] **Step 1: Run TypeScript check on entire project**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Verify QuestionsTab still works (no availableUsers prop)**

No changes needed - falls back to existing behavior

- [ ] **Step 3: Verify ChangeDetailsSheet still works (no availableUsers prop)**

No changes needed - falls back to existing behavior

---

## Verification Commands

Run after each task:
```bash
npx tsc --noEmit
```

Run lint check at the end:
```bash
npm run lint
```