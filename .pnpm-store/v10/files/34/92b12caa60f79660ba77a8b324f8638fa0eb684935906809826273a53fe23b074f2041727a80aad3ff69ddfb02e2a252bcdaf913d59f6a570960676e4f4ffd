var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};

// src/hooks/useDecorateRemoteCursors.ts
import { useCallback, useRef } from "react";
import { Range } from "slate";

// src/utils/getCursorRange.ts
import {
  relativeRangeToSlateRange
} from "@slate-yjs/core";
var CHILDREN_TO_CURSOR_STATE_TO_RANGE = /* @__PURE__ */ new WeakMap();
function getCursorRange(editor, cursorState) {
  if (!cursorState.relativeSelection) {
    return null;
  }
  let cursorStates = CHILDREN_TO_CURSOR_STATE_TO_RANGE.get(editor.children);
  if (!cursorStates) {
    cursorStates = /* @__PURE__ */ new WeakMap();
    CHILDREN_TO_CURSOR_STATE_TO_RANGE.set(editor.children, cursorStates);
  }
  let range = cursorStates.get(cursorState);
  if (range === void 0) {
    try {
      range = relativeRangeToSlateRange(editor.sharedRoot, editor, cursorState.relativeSelection);
      cursorStates.set(cursorState, range);
    } catch (e) {
      return null;
    }
  }
  return range;
}

// src/hooks/useRemoteCursorEditor.ts
import { CursorEditor as CursorEditor2 } from "@slate-yjs/core";
import { useSlateStatic } from "slate-react";
function useRemoteCursorEditor() {
  const editor = useSlateStatic();
  if (!CursorEditor2.isCursorEditor(editor)) {
    throw new Error("Cannot use useSyncExternalStore outside the context of a RemoteCursorEditor");
  }
  return editor;
}

// src/hooks/useRemoteCursorStates.ts
import { useSyncExternalStore } from "use-sync-external-store/shim";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector";

// src/hooks/useRemoteCursorStateStore.ts
import {
  CursorEditor as CursorEditor3
} from "@slate-yjs/core";
var EDITOR_TO_CURSOR_STORE = /* @__PURE__ */ new WeakMap();
function createRemoteCursorStateStore(editor) {
  let cursors = {};
  const changed = /* @__PURE__ */ new Set();
  const addChanged = changed.add.bind(changed);
  const onStoreChangeListeners = /* @__PURE__ */ new Set();
  let changeHandler = null;
  const subscribe = (onStoreChange) => {
    onStoreChangeListeners.add(onStoreChange);
    if (!changeHandler) {
      changeHandler = (event) => {
        event.added.forEach(addChanged);
        event.removed.forEach(addChanged);
        event.updated.forEach(addChanged);
        onStoreChangeListeners.forEach((listener) => listener());
      };
      CursorEditor3.on(editor, "change", changeHandler);
    }
    return () => {
      onStoreChangeListeners.delete(onStoreChange);
      if (changeHandler && onStoreChangeListeners.size === 0) {
        CursorEditor3.off(editor, "change", changeHandler);
        changeHandler = null;
      }
    };
  };
  const getSnapshot = () => {
    if (changed.size === 0) {
      return cursors;
    }
    changed.forEach((clientId) => {
      const state = CursorEditor3.cursorState(editor, clientId);
      if (state === null) {
        delete cursors[clientId.toString()];
        return;
      }
      cursors[clientId] = state;
    });
    changed.clear();
    cursors = __spreadValues({}, cursors);
    return cursors;
  };
  return [subscribe, getSnapshot];
}
function getCursorStateStore(editor) {
  const existing = EDITOR_TO_CURSOR_STORE.get(editor);
  if (existing) {
    return existing;
  }
  const store = createRemoteCursorStateStore(editor);
  EDITOR_TO_CURSOR_STORE.set(editor, store);
  return store;
}
function useRemoteCursorStateStore() {
  const editor = useRemoteCursorEditor();
  return getCursorStateStore(editor);
}

// src/hooks/useRemoteCursorStates.ts
function useRemoteCursorStates() {
  const [subscribe, getSnapshot] = useRemoteCursorStateStore();
  return useSyncExternalStore(subscribe, getSnapshot);
}
function useRemoteCursorStatesSelector(selector, isEqual) {
  const [subscribe, getSnapshot] = useRemoteCursorStateStore();
  return useSyncExternalStoreWithSelector(subscribe, getSnapshot, null, selector, isEqual);
}

// src/hooks/useDecorateRemoteCursors.ts
var REMOTE_CURSOR_DECORATION_PREFIX = "remote-cursor-";
var REMOTE_CURSOR_CARET_DECORATION_PREFIX = "remote-caret-";
function getRemoteCursorsOnLeaf(leaf) {
  return Object.entries(leaf).filter(([key]) => key.startsWith(REMOTE_CURSOR_DECORATION_PREFIX)).map(([, data]) => data);
}
function getRemoteCaretsOnLeaf(leaf) {
  return Object.entries(leaf).filter(([key]) => key.startsWith(REMOTE_CURSOR_CARET_DECORATION_PREFIX)).map(([, data]) => data);
}
function getDecoration(clientId, state, range, caret) {
  if (!caret) {
    const key2 = `${REMOTE_CURSOR_DECORATION_PREFIX}${clientId}`;
    return __spreadProps(__spreadValues({}, range), { [key2]: state });
  }
  const key = `${REMOTE_CURSOR_CARET_DECORATION_PREFIX}${clientId}`;
  return __spreadProps(__spreadValues({}, range), {
    anchor: range.focus,
    [key]: state
  });
}
function useDecorateRemoteCursors({ carets = true } = {}) {
  const editor = useRemoteCursorEditor();
  const cursors = useRemoteCursorStates();
  const cursorsRef = useRef(cursors);
  cursorsRef.current = cursors;
  return useCallback((entry) => {
    const [, path] = entry;
    if (path.length !== 0) {
      return [];
    }
    return Object.entries(cursorsRef.current).flatMap(([clientId, state]) => {
      const range = getCursorRange(editor, state);
      if (!range) {
        return [];
      }
      if (carets && Range.isCollapsed(range)) {
        return getDecoration(clientId, state, range, true);
      }
      if (!carets) {
        return getDecoration(clientId, state, range, false);
      }
      return [
        getDecoration(clientId, state, range, false),
        getDecoration(clientId, state, range, true)
      ];
    });
  }, [carets, editor]);
}

// src/hooks/useUnsetCursorPositionOnBlur.ts
import { CursorEditor as CursorEditor4 } from "@slate-yjs/core";
import { useCallback as useCallback2, useEffect } from "react";
import { useFocused } from "slate-react";
function useUnsetCursorPositionOnBlur() {
  const editor = useRemoteCursorEditor();
  const isSlateFocused = useFocused();
  const sendCursorPosition = useCallback2((isFocused) => {
    if (isFocused && editor.selection) {
      CursorEditor4.sendCursorPosition(editor, editor.selection);
      return;
    }
    if (!isFocused) {
      CursorEditor4.sendCursorPosition(editor, null);
    }
  }, [editor]);
  useEffect(() => {
    const handleWindowBlur = () => {
      if (isSlateFocused) {
        sendCursorPosition(false);
      }
    };
    const handleWindowFocus = () => {
      if (isSlateFocused) {
        sendCursorPosition(true);
      }
    };
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [isSlateFocused, sendCursorPosition]);
  useEffect(() => {
    sendCursorPosition(isSlateFocused);
  }, [editor, isSlateFocused, sendCursorPosition]);
}

// src/hooks/useRemoteCursorOverlayPositions.tsx
import {
  useCallback as useCallback4,
  useLayoutEffect,
  useMemo,
  useRef as useRef3,
  useState as useState2
} from "react";

// src/utils/getOverlayPosition.ts
import { Editor, Path, Range as Range2, Text } from "slate";
import { ReactEditor as ReactEditor3 } from "slate-react";

// src/utils/react-editor-to-dom-range-safe.ts
import { ReactEditor as ReactEditor2 } from "slate-react";
function reactEditorToDomRangeSafe(editor, range) {
  try {
    return ReactEditor2.toDOMRange(editor, range);
  } catch (e) {
    return null;
  }
}

// src/utils/getOverlayPosition.ts
function getOverlayPosition(editor, range, { yOffset, xOffset, shouldGenerateOverlay }) {
  const [start, end] = Range2.edges(range);
  const domRange = reactEditorToDomRangeSafe(editor, range);
  if (!domRange) {
    return {
      caretPosition: null,
      selectionRects: []
    };
  }
  const selectionRects = [];
  const nodeIterator = Editor.nodes(editor, {
    at: range,
    match: (n, p) => Text.isText(n) && (!shouldGenerateOverlay || shouldGenerateOverlay(n, p))
  });
  let caretPosition = null;
  const isBackward = Range2.isBackward(range);
  for (const [node, path] of nodeIterator) {
    const domNode = ReactEditor3.toDOMNode(editor, node);
    const isStartNode = Path.equals(path, start.path);
    const isEndNode = Path.equals(path, end.path);
    let clientRects = null;
    if (isStartNode || isEndNode) {
      const nodeRange = document.createRange();
      nodeRange.selectNode(domNode);
      if (isStartNode) {
        nodeRange.setStart(domRange.startContainer, domRange.startOffset);
      }
      if (isEndNode) {
        nodeRange.setEnd(domRange.endContainer, domRange.endOffset);
      }
      clientRects = nodeRange.getClientRects();
    } else {
      clientRects = domNode.getClientRects();
    }
    const isCaret = isBackward ? isStartNode : isEndNode;
    for (let i = 0; i < clientRects.length; i++) {
      const clientRect = clientRects.item(i);
      if (!clientRect) {
        continue;
      }
      const isCaretRect = isCaret && (isBackward ? i === 0 : i === clientRects.length - 1);
      const top = clientRect.top - yOffset;
      const left = clientRect.left - xOffset;
      if (isCaretRect) {
        caretPosition = {
          height: clientRect.height,
          top,
          left: left + (isBackward || Range2.isCollapsed(range) ? 0 : clientRect.width)
        };
      }
      selectionRects.push({
        width: clientRect.width,
        height: clientRect.height,
        top,
        left
      });
    }
  }
  return {
    selectionRects,
    caretPosition
  };
}

// src/hooks/utils.ts
import {
  useCallback as useCallback3,
  useEffect as useEffect2,
  useReducer,
  useRef as useRef2,
  useState
} from "react";
function useRequestRerender() {
  const [, rerender] = useReducer((s) => s + 1, 0);
  const animationFrameIdRef = useRef2(null);
  const clearAnimationFrame = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = 0;
    }
  };
  useEffect2(clearAnimationFrame);
  useEffect2(() => clearAnimationFrame, []);
  return useCallback3((immediately = false) => {
    if (immediately) {
      rerender();
      return;
    }
    if (animationFrameIdRef.current) {
      return;
    }
    animationFrameIdRef.current = requestAnimationFrame(rerender);
  }, []);
}
function useOnResize(ref, onResize) {
  const onResizeRef = useRef2(onResize);
  onResizeRef.current = onResize;
  const [observer] = useState(() => new ResizeObserver(() => {
    onResizeRef.current();
  }));
  useEffect2(() => {
    if (!(ref == null ? void 0 : ref.current)) {
      return;
    }
    const { current: element } = ref;
    observer.observe(element);
    return () => observer.unobserve(element);
  }, [observer, ref]);
}

// src/hooks/useRemoteCursorOverlayPositions.tsx
var FROZEN_EMPTY_ARRAY = Object.freeze([]);
function useRemoteCursorOverlayPositions(_a = {}) {
  var _b = _a, {
    containerRef,
    shouldGenerateOverlay
  } = _b, opts = __objRest(_b, [
    "containerRef",
    "shouldGenerateOverlay"
  ]);
  var _a2;
  const editor = useRemoteCursorEditor();
  const cursorStates = useRemoteCursorStates();
  const requestRerender = useRequestRerender();
  const overlayPositionCache = useRef3(/* @__PURE__ */ new WeakMap());
  const [overlayPositions, setOverlayPositions] = useState2({});
  const refreshOnResize = "refreshOnResize" in opts ? (_a2 = opts.refreshOnResize) != null ? _a2 : true : true;
  useOnResize(refreshOnResize ? containerRef : void 0, () => {
    overlayPositionCache.current = /* @__PURE__ */ new WeakMap();
    requestRerender(refreshOnResize !== "debounced");
  });
  useLayoutEffect(() => {
    var _a3, _b2, _c;
    if (containerRef && !containerRef.current) {
      return;
    }
    const containerRect = (_a3 = containerRef == null ? void 0 : containerRef.current) == null ? void 0 : _a3.getBoundingClientRect();
    const xOffset = (_b2 = containerRect == null ? void 0 : containerRect.x) != null ? _b2 : 0;
    const yOffset = (_c = containerRect == null ? void 0 : containerRect.y) != null ? _c : 0;
    let overlayPositionsChanged = Object.keys(overlayPositions).length !== Object.keys(cursorStates).length;
    const updated = Object.fromEntries(Object.entries(cursorStates).map(([key, state]) => {
      const range = state.relativeSelection && getCursorRange(editor, state);
      if (!range) {
        return [key, FROZEN_EMPTY_ARRAY];
      }
      const cached = overlayPositionCache.current.get(range);
      if (cached) {
        return [key, cached];
      }
      const overlayPosition = getOverlayPosition(editor, range, {
        xOffset,
        yOffset,
        shouldGenerateOverlay
      });
      overlayPositionsChanged = true;
      overlayPositionCache.current.set(range, overlayPosition);
      return [key, overlayPosition];
    }));
    if (overlayPositionsChanged) {
      setOverlayPositions(updated);
    }
  });
  const overlayData = useMemo(() => Object.entries(cursorStates).map(([clientId, state]) => {
    var _a3, _b2;
    const range = state.relativeSelection && getCursorRange(editor, state);
    const overlayPosition = overlayPositions[clientId];
    return __spreadProps(__spreadValues({}, state), {
      range,
      caretPosition: (_a3 = overlayPosition == null ? void 0 : overlayPosition.caretPosition) != null ? _a3 : null,
      selectionRects: (_b2 = overlayPosition == null ? void 0 : overlayPosition.selectionRects) != null ? _b2 : FROZEN_EMPTY_ARRAY
    });
  }), [cursorStates, editor, overlayPositions]);
  const refresh = useCallback4(() => {
    overlayPositionCache.current = /* @__PURE__ */ new WeakMap();
    requestRerender(true);
  }, [requestRerender]);
  return [overlayData, refresh];
}
export {
  getCursorRange,
  getRemoteCaretsOnLeaf,
  getRemoteCursorsOnLeaf,
  useDecorateRemoteCursors,
  useRemoteCursorOverlayPositions,
  useRemoteCursorStates,
  useRemoteCursorStatesSelector,
  useUnsetCursorPositionOnBlur
};
//# sourceMappingURL=index.js.map