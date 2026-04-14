# Collaboration Editor Optimization Plan

## Summary
This plan details the optimization and enhancement of the collaboration document editor. The core issue of poor performance when importing large PDF, Excel, and Docx files will be resolved by abandoning the expensive text-to-Yoopta conversion in favor of a Split-Pane Native Viewer. Additionally, the plan outlines the implementation of document versioning and inline, text-anchored comments, alongside rigorous accessibility, performance, and TDD (Test-Driven Development) requirements.

## Current State Analysis
- **File Parsing Bottleneck:** `src/lib/fileToYoopta.ts` currently converts PDFs, Excel sheets, and Word documents to HTML strings and then deserializes them into YooptaEditor blocks. This is extremely slow for large files, consumes excessive memory, and often breaks complex formatting.
- **Versioning:** Currently relies solely on real-time Yjs state and a read-only Action Log. There is no snapshot-based version history allowing users to view or revert to previous document states.
- **Comments:** Handled at the document level via `SidebarPanel.tsx` and `CommentsTab.tsx`. There is no mechanism to highlight specific text in the editor and anchor a comment to it.
- **Performance & Accessibility:** Missing lazy-loading for heavy parsing libraries. The editor lacks comprehensive ARIA labels and keyboard navigation for collaborative features.

## Proposed Changes

### 1. Split-Pane Document Viewer (Optimization & Rendering)
- **Goal:** Render PDF, Excel, Docs, and Text files natively alongside the collaborative editor instead of converting them.
- **Implementation:**
  - Create a new component `src/pages/CollaborationToolPage/components/DocumentViewer.tsx`.
  - Update `EditorPanel.tsx` to use a split-pane layout (e.g., using `react-split` or Flexbox).
  - The left pane will house the `DocumentViewer`, conditionally rendering:
    - **PDFs:** Rendered using `react-pdf` (lazy-loaded).
    - **Excel (`.xlsx`):** Parsed using the existing `xlsx` dependency into a read-only HTML data grid.
    - **Word (`.docx`):** Parsed using `mammoth` and injected as sanitized HTML into a scrollable, read-only `div`.
    - **Text:** Rendered as a standard `<pre>` block.
  - The right pane remains the `YooptaEditor` for collaborative drafting and notes.
  - Remove the heavy `convertFileUrlToYoopta` logic for non-text formats on initial load.

### 2. Inline Comments (Review Reflections)
- **Goal:** Allow users to highlight text and attach a comment, visually reflecting the review area.
- **Implementation:**
  - Create a custom Yoopta mark plugin: `CommentMark` in `src/pages/CollaborationToolPage/collab/CommentMark.ts`.
  - The mark will wrap selected text in a `<mark data-comment-id="uuid" class="bg-yellow-200">` tag.
  - Add a custom toolbar action "Add Comment" that generates a UUID, applies the `CommentMark`, and opens the `CommentsTab` sidebar with the UUID pre-filled in state.
  - Update `CommentsTab.tsx` to link sidebar comments to their respective `data-comment-id`. Clicking a comment in the sidebar will scroll the editor to the highlighted text.

### 3. Versioning System
- **Goal:** Allow users to save, view, and restore document snapshots.
- **Implementation:**
  - Add a "Version History" button to the editor header.
  - Create `VersionHistoryModal.tsx` to list past snapshots.
  - Integrate with Yjs's state vector snapshotting (`Y.snapshot`) or serialize the Yoopta JSON state and save it to the backend via a new API endpoint.
  - Provide a "Restore this version" action that replaces the current Yoopta editor state with the selected snapshot.

### 4. Performance & Accessibility (/perf & /accessibility-audit)
- **Performance:**
  - Wrap `DocumentViewer`, `react-pdf`, and `mammoth` in `React.lazy()` and `<Suspense>` to reduce the initial bundle size.
  - Implement a virtualized list (e.g., `react-window` or `@tanstack/react-virtual`) in `CommentsTab.tsx` to handle large comment threads.
- **Accessibility:**
  - Run an accessibility audit.
  - Ensure all new toolbar buttons have descriptive `aria-label` attributes.
  - Ensure the split-pane resizer is focusable and keyboard navigable (`keydown` listeners for arrows).
  - Ensure the `DocumentViewer` has appropriate ARIA roles (e.g., `role="document"`, `aria-readonly="true"`).

### 5. Testing Strategy (TDD)
- **Strict TDD Adherence:** As requested via the `test-driven-development` skill, no production code will be written without a failing test first.
- **Test Scenarios:**
  - **`DocumentViewer.test.tsx`:** 
    - *Test 1:* Given a PDF file type, it renders the PDF viewer component (mocked).
    - *Test 2:* Given an Excel file type, it parses the buffer and renders an HTML table.
  - **`CommentMark.test.ts`:**
    - *Test 1:* Applies the comment mark with a unique ID to the provided text selection.
  - **`VersionHistory.test.ts`:**
    - *Test 1:* Serializes the current editor state and adds it to the version history array.

## Implementation Steps (Execution Phase)
1. **TDD Setup & Document Viewer:** Write tests for `DocumentViewer`. Implement the Split-Pane layout and lazy-loaded viewers for PDF, Excel, and Docx.
2. **Inline Comments:** Write tests for `CommentMark`. Implement the custom Yoopta mark, update the toolbar, and link it to the `CommentsTab` sidebar.
3. **Versioning:** Write tests for snapshot logic. Implement the `VersionHistoryModal` and the state restoration logic.
4. **Audit & Refactor:** Run accessibility checks on the new UI components. Ensure lazy loading is functioning correctly to optimize performance.
