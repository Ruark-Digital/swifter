var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  getCursorRange: () => getCursorRange,
  getRemoteCaretsOnLeaf: () => getRemoteCaretsOnLeaf,
  getRemoteCursorsOnLeaf: () => getRemoteCursorsOnLeaf,
  useDecorateRemoteCursors: () => useDecorateRemoteCursors,
  useRemoteCursorOverlayPositions: () => useRemoteCursorOverlayPositions,
  useRemoteCursorStates: () => useRemoteCursorStates,
  useRemoteCursorStatesSelector: () => useRemoteCursorStatesSelector,
  useUnsetCursorPositionOnBlur: () => useUnsetCursorPositionOnBlur
});
module.exports = __toCommonJS(src_exports);

// src/hooks/useDecorateRemoteCursors.ts
var import_react = require("react");
var import_slate = require("slate");

// src/utils/getCursorRange.ts
var import_core = require("@slate-yjs/core");
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
      range = (0, import_core.relativeRangeToSlateRange)(editor.sharedRoot, editor, cursorState.relativeSelection);
      cursorStates.set(cursorState, range);
    } catch (e) {
      return null;
    }
  }
  return range;
}

// src/hooks/useRemoteCursorEditor.ts
var import_core2 = require("@slate-yjs/core");
var import_slate_react = require("slate-react");
function useRemoteCursorEditor() {
  const editor = (0, import_slate_react.useSlateStatic)();
  if (!import_core2.CursorEditor.isCursorEditor(editor)) {
    throw new Error("Cannot use useSyncExternalStore outside the context of a RemoteCursorEditor");
  }
  return editor;
}

// src/hooks/useRemoteCursorStates.ts
var import_shim = require("use-sync-external-store/shim");
var import_with_selector = require("use-sync-external-store/shim/with-selector");

// src/hooks/useRemoteCursorStateStore.ts
var import_core3 = require("@slate-yjs/core");
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
      import_core3.CursorEditor.on(editor, "change", changeHandler);
    }
    return () => {
      onStoreChangeListeners.delete(onStoreChange);
      if (changeHandler && onStoreChangeListeners.size === 0) {
        import_core3.CursorEditor.off(editor, "change", changeHandler);
        changeHandler = null;
      }
    };
  };
  const getSnapshot = () => {
    if (changed.size === 0) {
      return cursors;
    }
    changed.forEach((clientId) => {
      const state = import_core3.CursorEditor.cursorState(editor, clientId);
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
  return (0, import_shim.useSyncExternalStore)(subscribe, getSnapshot);
}
function useRemoteCursorStatesSelector(selector, isEqual) {
  const [subscribe, getSnapshot] = useRemoteCursorStateStore();
  return (0, import_with_selector.useSyncExternalStoreWithSelector)(subscribe, getSnapshot, null, selector, isEqual);
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
  const cursorsRef = (0, import_react.useRef)(cursors);
  cursorsRef.current = cursors;
  return (0, import_react.useCallback)((entry) => {
    const [, path] = entry;
    if (path.length !== 0) {
      return [];
    }
    return Object.entries(cursorsRef.current).flatMap(([clientId, state]) => {
      const range = getCursorRange(editor, state);
      if (!range) {
        return [];
      }
      if (carets && import_slate.Range.isCollapsed(range)) {
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
var import_core4 = require("@slate-yjs/core");
var import_react2 = require("react");
var import_slate_react2 = require("slate-react");
function useUnsetCursorPositionOnBlur() {
  const editor = useRemoteCursorEditor();
  const isSlateFocused = (0, import_slate_react2.useFocused)();
  const sendCursorPosition = (0, import_react2.useCallback)((isFocused) => {
    if (isFocused && editor.selection) {
      import_core4.CursorEditor.sendCursorPosition(editor, editor.selection);
      return;
    }
    if (!isFocused) {
      import_core4.CursorEditor.sendCursorPosition(editor, null);
    }
  }, [editor]);
  (0, import_react2.useEffect)(() => {
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
  (0, import_react2.useEffect)(() => {
    sendCursorPosition(isSlateFocused);
  }, [editor, isSlateFocused, sendCursorPosition]);
}

// src/hooks/useRemoteCursorOverlayPositions.tsx
var import_react4 = require("react");

// src/utils/getOverlayPosition.ts
var import_slate2 = require("slate");
var import_slate_react4 = require("slate-react");

// src/utils/react-editor-to-dom-range-safe.ts
var import_slate_react3 = require("slate-react");
function reactEditorToDomRangeSafe(editor, range) {
  try {
    return import_slate_react3.ReactEditor.toDOMRange(editor, range);
  } catch (e) {
    return null;
  }
}

// src/utils/getOverlayPosition.ts
function getOverlayPosition(editor, range, { yOffset, xOffset, shouldGenerateOverlay }) {
  const [start, end] = import_slate2.Range.edges(range);
  const domRange = reactEditorToDomRangeSafe(editor, range);
  if (!domRange) {
    return {
      caretPosition: null,
      selectionRects: []
    };
  }
  const selectionRects = [];
  const nodeIterator = import_slate2.Editor.nodes(editor, {
    at: range,
    match: (n, p) => import_slate2.Text.isText(n) && (!shouldGenerateOverlay || shouldGenerateOverlay(n, p))
  });
  let caretPosition = null;
  const isBackward = import_slate2.Range.isBackward(range);
  for (const [node, path] of nodeIterator) {
    const domNode = import_slate_react4.ReactEditor.toDOMNode(editor, node);
    const isStartNode = import_slate2.Path.equals(path, start.path);
    const isEndNode = import_slate2.Path.equals(path, end.path);
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
          left: left + (isBackward || import_slate2.Range.isCollapsed(range) ? 0 : clientRect.width)
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
var import_react3 = require("react");
function useRequestRerender() {
  const [, rerender] = (0, import_react3.useReducer)((s) => s + 1, 0);
  const animationFrameIdRef = (0, import_react3.useRef)(null);
  const clearAnimationFrame = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = 0;
    }
  };
  (0, import_react3.useEffect)(clearAnimationFrame);
  (0, import_react3.useEffect)(() => clearAnimationFrame, []);
  return (0, import_react3.useCallback)((immediately = false) => {
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
  const onResizeRef = (0, import_react3.useRef)(onResize);
  onResizeRef.current = onResize;
  const [observer] = (0, import_react3.useState)(() => new ResizeObserver(() => {
    onResizeRef.current();
  }));
  (0, import_react3.useEffect)(() => {
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
  const overlayPositionCache = (0, import_react4.useRef)(/* @__PURE__ */ new WeakMap());
  const [overlayPositions, setOverlayPositions] = (0, import_react4.useState)({});
  const refreshOnResize = "refreshOnResize" in opts ? (_a2 = opts.refreshOnResize) != null ? _a2 : true : true;
  useOnResize(refreshOnResize ? containerRef : void 0, () => {
    overlayPositionCache.current = /* @__PURE__ */ new WeakMap();
    requestRerender(refreshOnResize !== "debounced");
  });
  (0, import_react4.useLayoutEffect)(() => {
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
  const overlayData = (0, import_react4.useMemo)(() => Object.entries(cursorStates).map(([clientId, state]) => {
    var _a3, _b2;
    const range = state.relativeSelection && getCursorRange(editor, state);
    const overlayPosition = overlayPositions[clientId];
    return __spreadProps(__spreadValues({}, state), {
      range,
      caretPosition: (_a3 = overlayPosition == null ? void 0 : overlayPosition.caretPosition) != null ? _a3 : null,
      selectionRects: (_b2 = overlayPosition == null ? void 0 : overlayPosition.selectionRects) != null ? _b2 : FROZEN_EMPTY_ARRAY
    });
  }), [cursorStates, editor, overlayPositions]);
  const refresh = (0, import_react4.useCallback)(() => {
    overlayPositionCache.current = /* @__PURE__ */ new WeakMap();
    requestRerender(true);
  }, [requestRerender]);
  return [overlayData, refresh];
}
//# sourceMappingURL=index.cjs.map