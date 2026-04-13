'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var React = require('react');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

/**
 * This function check if a given point is inside of the items rect.
 * If it's not inside any rect, it will return the index of the closest rect
 */
var findItemIndexAtPosition = function findItemIndexAtPosition(_a, itemsRect, _b) {
  var x = _a.x,
    y = _a.y;
  var _c = _b === void 0 ? {} : _b,
    _d = _c.fallbackToClosest,
    fallbackToClosest = _d === void 0 ? false : _d;
  var smallestDistance = 10000;
  var smallestDistanceIndex = -1;
  for (var index = 0; index < itemsRect.length; index += 1) {
    var rect = itemsRect[index];
    // if it's inside the rect, we return the current index directly
    if (x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom) {
      return index;
    }
    if (fallbackToClosest) {
      // otherwise we compute the distance and update the smallest distance index if needed
      var itemCenterX = (rect.left + rect.right) / 2;
      var itemCenterY = (rect.top + rect.bottom) / 2;
      var distance = Math.sqrt(Math.pow(x - itemCenterX, 2) + Math.pow(y - itemCenterY, 2)); // ** 2 operator is not supported on IE11
      if (distance < smallestDistance) {
        smallestDistance = distance;
        smallestDistanceIndex = index;
      }
    }
  }
  return smallestDistanceIndex;
};
/**
 * Finds the first scrollable parent of an element.
 * @param {HTMLElement} element The element to start searching from.
 * @returns {HTMLElement | Window} The scrollable parent or the window.
 */
var getScrollableParent = function getScrollableParent(element) {
  if (!element) {
    return window;
  }
  var current = element;
  while (current) {
    var _a = window.getComputedStyle(current),
      overflowX = _a.overflowX,
      overflowY = _a.overflowY;
    // check if the element is horizontally scrollable
    var isHorizontallyScrollable = (overflowX === 'auto' || overflowX === 'scroll') && current.scrollWidth > current.clientWidth;
    // check if the element is vertically scrollable
    var isVerticallyScrollable = (overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight;
    // if it's scrollable in either direction it's a match
    if (isHorizontallyScrollable || isVerticallyScrollable) {
      return current;
    }
    current = current.parentElement;
  }
  return window;
};
function arrayMoveMutable(array, fromIndex, toIndex) {
  var startIndex = fromIndex < 0 ? array.length + fromIndex : fromIndex;
  if (startIndex >= 0 && startIndex < array.length) {
    var endIndex = toIndex < 0 ? array.length + toIndex : toIndex;
    var item = array.splice(fromIndex, 1)[0];
    array.splice(endIndex, 0, item);
  }
}
function arrayMove(array, fromIndex, toIndex) {
  var newArray = tslib.__spreadArray([], array, true);
  arrayMoveMutable(newArray, fromIndex, toIndex);
  return newArray;
}

var getMousePoint = function getMousePoint(e) {
  return {
    x: Number(e.clientX),
    y: Number(e.clientY)
  };
};
var getTouchPoint = function getTouchPoint(touch) {
  return {
    x: Number(touch.clientX),
    y: Number(touch.clientY)
  };
};
var getPointInContainer = function getPointInContainer(point, containerTopLeft) {
  return {
    x: point.x - containerTopLeft.x,
    y: point.y - containerTopLeft.y
  };
};
var preventDefault = function preventDefault(event) {
  event.preventDefault();
};
var disableContextMenu = function disableContextMenu() {
  window.addEventListener('contextmenu', preventDefault, {
    capture: true,
    passive: false
  });
};
var enableContextMenu = function enableContextMenu() {
  window.removeEventListener('contextmenu', preventDefault);
};
var useDrag = function useDrag(_a) {
  var onStart = _a.onStart,
    onMove = _a.onMove,
    onEnd = _a.onEnd,
    _b = _a.allowDrag,
    allowDrag = _b === void 0 ? true : _b,
    containerRef = _a.containerRef,
    knobs = _a.knobs;
  // contains the top-left coordinates of the container in the window. Set on drag start and used in drag move
  var containerPositionRef = React__default["default"].useRef({
    x: 0,
    y: 0
  });
  // on touch devices, we only start the drag gesture after pressing the item 200ms.
  // this ref contains the timer id to be able to cancel it
  var handleTouchStartTimerRef = React__default["default"].useRef(undefined);
  // on non-touch device, we don't call onStart on mouse down but on the first mouse move
  // we do this to let the user clicks on clickable element inside the container
  // this means that the drag gesture actually starts on the fist move
  var isFirstMoveRef = React__default["default"].useRef(false);
  // see https://twitter.com/ValentinHervieu/status/1324407814970920968
  // we do this so that the parent doesn't have to use `useCallback()` for these callbacks
  var callbacksRef = React__default["default"].useRef({
    onStart: onStart,
    onMove: onMove,
    onEnd: onEnd
  });
  // instead of relying on hacks to know if the device is a touch device or not,
  // we track this using an onTouchStart listener on the document. (see https://codeburst.io/the-only-way-to-detect-touch-with-javascript-7791a3346685)
  var _c = React__default["default"].useState(false),
    isTouchDevice = _c[0],
    setTouchDevice = _c[1];
  React__default["default"].useEffect(function () {
    callbacksRef.current = {
      onStart: onStart,
      onMove: onMove,
      onEnd: onEnd
    };
  }, [onStart, onMove, onEnd]);
  var cancelTouchStart = function cancelTouchStart() {
    if (handleTouchStartTimerRef.current) {
      window.clearTimeout(handleTouchStartTimerRef.current);
    }
  };
  var saveContainerPosition = React__default["default"].useCallback(function () {
    if (containerRef.current) {
      var bounds = containerRef.current.getBoundingClientRect();
      containerPositionRef.current = {
        x: bounds.left,
        y: bounds.top
      };
    }
  }, [containerRef]);
  var onDrag = React__default["default"].useCallback(function (pointInWindow) {
    var point = getPointInContainer(pointInWindow, containerPositionRef.current);
    if (callbacksRef.current.onMove) {
      callbacksRef.current.onMove({
        pointInWindow: pointInWindow,
        point: point
      });
    }
  }, []);
  var onMouseMove = React__default["default"].useCallback(function (e) {
    // if this is the first move, we trigger the onStart logic
    if (isFirstMoveRef.current) {
      isFirstMoveRef.current = false;
      var pointInWindow = getMousePoint(e);
      var point = getPointInContainer(pointInWindow, containerPositionRef.current);
      if (callbacksRef.current.onStart) {
        callbacksRef.current.onStart({
          point: point,
          pointInWindow: pointInWindow
        });
      }
    }
    // otherwise, we do the normal move logic
    else {
      onDrag(getMousePoint(e));
    }
  }, [onDrag]);
  var onTouchMove = React__default["default"].useCallback(function (e) {
    if (e.cancelable) {
      // Prevent the whole page from scrolling
      e.preventDefault();
      onDrag(getTouchPoint(e.touches[0]));
    } else {
      // if the event is not cancelable, it means the browser is currently scrolling
      // which cannot be interrupted. Thus we cancel the drag gesture.
      document.removeEventListener('touchmove', onTouchMove);
      if (callbacksRef.current.onEnd) {
        callbacksRef.current.onEnd();
      }
    }
  }, [onDrag]);
  var onMouseUp = React__default["default"].useCallback(function () {
    isFirstMoveRef.current = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    if (callbacksRef.current.onEnd) {
      callbacksRef.current.onEnd();
    }
  }, [onMouseMove]);
  var onTouchEnd = React__default["default"].useCallback(function () {
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    enableContextMenu();
    if (callbacksRef.current.onEnd) {
      callbacksRef.current.onEnd();
    }
  }, [onTouchMove]);
  var onMouseDown = React__default["default"].useCallback(function (e) {
    if (e.button !== 0) {
      // we don't want to handle clicks other than left ones
      return;
    }
    if ((knobs === null || knobs === void 0 ? void 0 : knobs.length) && !knobs.find(function (knob) {
      return knob.contains(e.target);
    })) {
      return;
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    saveContainerPosition();
    // mark the next move as being the first one
    isFirstMoveRef.current = true;
  }, [onMouseMove, onMouseUp, saveContainerPosition, knobs]);
  var handleTouchStart = React__default["default"].useCallback(function (point, pointInWindow) {
    document.addEventListener('touchmove', onTouchMove, {
      capture: false,
      passive: false
    });
    document.addEventListener('touchend', onTouchEnd);
    disableContextMenu();
    if (callbacksRef.current.onStart) {
      callbacksRef.current.onStart({
        point: point,
        pointInWindow: pointInWindow
      });
    }
  }, [onTouchEnd, onTouchMove]);
  var onTouchStart = React__default["default"].useCallback(function (e) {
    if ((knobs === null || knobs === void 0 ? void 0 : knobs.length) && !knobs.find(function (knob) {
      return knob.contains(e.target);
    })) {
      return;
    }
    saveContainerPosition();
    var pointInWindow = getTouchPoint(e.touches[0]);
    var point = getPointInContainer(pointInWindow, containerPositionRef.current);
    // we wait 120ms to start the gesture to be sure that the user
    // is not trying to scroll the page
    handleTouchStartTimerRef.current = window.setTimeout(function () {
      return handleTouchStart(point, pointInWindow);
    }, 120);
  }, [handleTouchStart, saveContainerPosition, knobs]);
  var detectTouchDevice = React__default["default"].useCallback(function () {
    setTouchDevice(true);
    document.removeEventListener('touchstart', detectTouchDevice);
  }, []);
  // if the user is scrolling on mobile, we cancel the drag gesture
  var touchScrollListener = React__default["default"].useCallback(function () {
    cancelTouchStart();
  }, []);
  React__default["default"].useLayoutEffect(function () {
    if (isTouchDevice) {
      var container_1 = containerRef.current;
      if (allowDrag) {
        container_1 === null || container_1 === void 0 ? void 0 : container_1.addEventListener('touchstart', onTouchStart, {
          capture: true,
          passive: false
        });
        // we are adding this touchmove listener to cancel drag if user is scrolling
        // however, it's also important to have a touchmove listener always set
        // with non-capture and non-passive option to prevent an issue on Safari
        // with e.preventDefault (https://github.com/atlassian/react-beautiful-dnd/issues/1374)
        document.addEventListener('touchmove', touchScrollListener, {
          capture: false,
          passive: false
        });
        document.addEventListener('touchend', touchScrollListener, {
          capture: false,
          passive: false
        });
      }
      return function () {
        container_1 === null || container_1 === void 0 ? void 0 : container_1.removeEventListener('touchstart', onTouchStart, {
          capture: true
        });
        document.removeEventListener('touchmove', touchScrollListener, {
          capture: false
        });
        document.removeEventListener('touchend', touchScrollListener, {
          capture: false
        });
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        enableContextMenu();
        cancelTouchStart();
      };
    }
    // if non-touch device
    document.addEventListener('touchstart', detectTouchDevice);
    return function () {
      document.removeEventListener('touchstart', detectTouchDevice);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isTouchDevice, allowDrag, detectTouchDevice, onMouseMove, onTouchMove, touchScrollListener, onTouchEnd, onMouseUp, containerRef, onTouchStart]);
  // on touch devices, we cannot attach the onTouchStart directly via React:
  // Touch handlers must be added with {passive: false} to be cancelable.
  // https://developers.google.com/web/updates/2017/01/scrolling-intervention
  return isTouchDevice ? {} : {
    onMouseDown: onMouseDown
  };
};
var useDropTarget = function useDropTarget(content) {
  var dropTargetRef = React__default["default"].useRef(null);
  if (!content) {
    return {};
  }
  var show = function show(sourceRect) {
    if (dropTargetRef.current) {
      dropTargetRef.current.style.width = "".concat(sourceRect.width, "px");
      dropTargetRef.current.style.height = "".concat(sourceRect.height, "px");
      dropTargetRef.current.style.opacity = '1';
      dropTargetRef.current.style.visibility = 'visible';
    }
  };
  var hide = function hide() {
    if (dropTargetRef.current) {
      dropTargetRef.current.style.opacity = '0';
      dropTargetRef.current.style.visibility = 'hidden';
    }
  };
  var setPosition = function setPosition(index, itemsRect, lockAxis) {
    if (dropTargetRef.current) {
      var sourceRect = itemsRect[index];
      var newX = lockAxis === 'y' ? sourceRect.left : itemsRect[index].left;
      var newY = lockAxis === 'x' ? sourceRect.top : itemsRect[index].top;
      dropTargetRef.current.style.transform = "translate3d(".concat(newX, "px, ").concat(newY, "px, 0px)");
    }
  };
  var DropTargetWrapper = function DropTargetWrapper() {
    return React__default["default"].createElement("div", {
      ref: dropTargetRef,
      "aria-hidden": true,
      style: {
        opacity: 0,
        visibility: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none'
      }
    }, content);
  };
  return {
    show: show,
    hide: hide,
    setPosition: setPosition,
    render: DropTargetWrapper
  };
};

var DEFAULT_CONTAINER_TAG = 'div';
var SortableListContext = React__default["default"].createContext(undefined);
var SortableList = function SortableList(_a) {
  var _b;
  var children = _a.children,
    _c = _a.allowDrag,
    allowDrag = _c === void 0 ? true : _c,
    onSortStart = _a.onSortStart,
    onSortMove = _a.onSortMove,
    onSortEnd = _a.onSortEnd,
    draggedItemClassName = _a.draggedItemClassName,
    as = _a.as,
    lockAxis = _a.lockAxis,
    customHolderRef = _a.customHolderRef,
    dropTarget = _a.dropTarget,
    _d = _a.autoScroll,
    autoScroll = _d === void 0 ? false : _d,
    rest = tslib.__rest(_a, ["children", "allowDrag", "onSortStart", "onSortMove", "onSortEnd", "draggedItemClassName", "as", "lockAxis", "customHolderRef", "dropTarget", "autoScroll"]);
  // this array contains the elements than can be sorted (wrapped inside SortableItem)
  var itemsRef = React__default["default"].useRef([]);
  // this array contains the coordinates of each sortable element (only computed on dragStart and used in dragMove for perf reason)
  var itemsRect = React__default["default"].useRef([]);
  // Hold all registered knobs
  var knobs = React__default["default"].useRef([]);
  // contains the container element
  var containerRef = React__default["default"].useRef(null);
  // contains the target element (copy of the source element)
  var targetRef = React__default["default"].useRef(null);
  // contains the index in the itemsRef array of the element being dragged
  var sourceIndexRef = React__default["default"].useRef(undefined);
  // contains the index in the itemsRef of the element to be exchanged with the source item
  var lastTargetIndexRef = React__default["default"].useRef(undefined);
  // contains the offset point where the initial drag occurred to be used when dragging the item
  var offsetPointRef = React__default["default"].useRef({
    x: 0,
    y: 0
  });
  // contains the dropTarget logic
  var dropTargetLogic = useDropTarget(dropTarget);
  // contains the original opacity of the sorted item in order te restore it correctly
  var sourceOpacityRef = React__default["default"].useRef('1');
  // contains the speed at which the container scrolls horizontally or vertically when auto scrolling
  var scrollSpeedRef = React__default["default"].useRef({
    x: 0,
    y: 0
  });
  // contains the auto scroll animation
  var scrollAnimationRef = React__default["default"].useRef(null);
  // contains the scrollable list parent (element or window)
  var scrollContainerRef = React__default["default"].useRef(null);
  // contains the horizontal and vertical scroll positions of the container
  var initialScrollRef = React__default["default"].useRef({
    x: 0,
    y: 0
  });
  // auto scroll method
  var autoScrolling = React__default["default"].useCallback(function () {
    var scroller = scrollContainerRef.current;
    var scrollSpeed = scrollSpeedRef.current;
    if (scrollSpeed.x === 0 && scrollSpeed.y === 0 || !scroller) {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
      return;
    }
    // handle both window and element scrolling
    if (scroller instanceof Window) {
      scroller.scrollBy(scrollSpeed.x, scrollSpeed.y);
    } else if (scroller instanceof HTMLElement) {
      scroller.scrollTop += scrollSpeed.y;
      scroller.scrollLeft += scrollSpeed.x;
    }
    scrollAnimationRef.current = requestAnimationFrame(autoScrolling);
  }, []);
  React__default["default"].useEffect(function () {
    var holder = (customHolderRef === null || customHolderRef === void 0 ? void 0 : customHolderRef.current) || document.body;
    return function () {
      // cleanup the target element from the DOM when SortableList in unmounted
      if (targetRef.current) {
        holder.removeChild(targetRef.current);
      }
    };
  }, [customHolderRef]);
  var updateTargetPosition = function updateTargetPosition(position) {
    if (targetRef.current && sourceIndexRef.current !== undefined) {
      var offset = offsetPointRef.current;
      var sourceRect = itemsRect.current[sourceIndexRef.current];
      var newX = lockAxis === 'y' ? sourceRect.left : position.x - offset.x;
      var newY = lockAxis === 'x' ? sourceRect.top : position.y - offset.y;
      // we use `translate3d` to force using the GPU if available
      targetRef.current.style.transform = "translate3d(".concat(newX, "px, ").concat(newY, "px, 0px)");
    }
  };
  var copyItem = React__default["default"].useCallback(function (sourceIndex) {
    if (!containerRef.current) {
      return;
    }
    var source = itemsRef.current[sourceIndex];
    var sourceRect = itemsRect.current[sourceIndex];
    var copy = source.cloneNode(true);
    // added the "dragged" class name
    if (draggedItemClassName) {
      draggedItemClassName.split(' ').forEach(function (c) {
        return copy.classList.add(c);
      });
    }
    // we ensure the copy has the same size than the source element
    copy.style.width = "".concat(sourceRect.width, "px");
    copy.style.height = "".concat(sourceRect.height, "px");
    // we place the target starting position to the top left of the window
    // it will then be moved relatively using `transform: translate3d()`
    copy.style.position = 'fixed';
    copy.style.margin = '0';
    copy.style.top = '0';
    copy.style.left = '0';
    var sourceCanvases = source.querySelectorAll('canvas');
    copy.querySelectorAll('canvas').forEach(function (canvas, index) {
      var _a;
      (_a = canvas.getContext('2d')) === null || _a === void 0 ? void 0 : _a.drawImage(sourceCanvases[index], 0, 0);
    });
    var holder = (customHolderRef === null || customHolderRef === void 0 ? void 0 : customHolderRef.current) || document.body;
    holder.appendChild(copy);
    targetRef.current = copy;
  }, [customHolderRef, draggedItemClassName]);
  var listeners = useDrag({
    allowDrag: allowDrag,
    containerRef: containerRef,
    knobs: knobs.current,
    onStart: function onStart(_a) {
      var _b, _c;
      var pointInWindow = _a.pointInWindow;
      if (!containerRef.current) {
        return;
      }
      // auto scrolling of the container
      if (autoScroll) {
        var scroller = getScrollableParent(containerRef.current);
        scrollContainerRef.current = scroller;
        // record the starting scroll position to calculate the scroll delta later
        // record the starting scroll position for both axes
        if (scroller instanceof HTMLElement) {
          initialScrollRef.current = {
            y: scroller.scrollTop,
            x: scroller.scrollLeft
          };
        } else {
          initialScrollRef.current = {
            y: scroller.scrollY,
            x: scroller.scrollX
          };
        }
      }
      itemsRect.current = itemsRef.current.map(function (item) {
        return item.getBoundingClientRect();
      });
      var sourceIndex = findItemIndexAtPosition(pointInWindow, itemsRect.current);
      // if we are not starting the drag gesture on a SortableItem, we exit early
      if (sourceIndex === -1) {
        return;
      }
      // saving the index of the item being dragged
      sourceIndexRef.current = sourceIndex;
      // let the parent know that sort started
      if (onSortStart) {
        onSortStart();
      }
      // the item being dragged is copied to the document body and will be used as the target
      copyItem(sourceIndex);
      // hide source during the drag gesture (and store original opacity)
      var source = itemsRef.current[sourceIndex];
      sourceOpacityRef.current = (_b = source.style.opacity) !== null && _b !== void 0 ? _b : '1';
      source.style.opacity = '0';
      source.style.visibility = 'hidden';
      // get the offset between the source item's window position relative to the point in window
      var sourceRect = source.getBoundingClientRect();
      offsetPointRef.current = {
        x: pointInWindow.x - sourceRect.left,
        y: pointInWindow.y - sourceRect.top
      };
      // set the initial position of the cloned item
      updateTargetPosition(pointInWindow);
      (_c = dropTargetLogic.show) === null || _c === void 0 ? void 0 : _c.call(dropTargetLogic, sourceRect);
      // Adds a nice little physical feedback
      if (window.navigator.vibrate) {
        window.navigator.vibrate(100);
      }
    },
    onMove: function onMove(_a) {
      var _b;
      var pointInWindow = _a.pointInWindow;
      if (!containerRef.current) {
        return;
      }
      updateTargetPosition(pointInWindow);
      var sourceIndex = sourceIndexRef.current;
      // if there is no source, we exit early (happened when drag gesture was started outside a SortableItem)
      if (sourceIndex === undefined) {
        return;
      }
      if (autoScroll) {
        var scroller = scrollContainerRef.current;
        if (scroller) {
          // auto scroll trigger logic point
          var SCROLL_THRESHOLD = 60;
          var MAX_SCROLL_SPEED = 15;
          var pointerX = pointInWindow.x,
            pointerY = pointInWindow.y;
          // reset speed before recalculating
          scrollSpeedRef.current = {
            x: 0,
            y: 0
          };
          var scrollerRect = void 0;
          if (scroller instanceof Window) {
            scrollerRect = {
              top: 0,
              bottom: scroller.innerHeight,
              left: 0,
              right: scroller.innerWidth
            };
          } else {
            scrollerRect = scroller.getBoundingClientRect();
          }
          // vertical scroll logic (if not locked)
          if (lockAxis !== 'x') {
            if (pointerY < scrollerRect.top + SCROLL_THRESHOLD && pointerY >= scrollerRect.top) {
              var proximity = scrollerRect.top + SCROLL_THRESHOLD - pointerY;
              scrollSpeedRef.current.y = -MAX_SCROLL_SPEED * (proximity / SCROLL_THRESHOLD);
            } else if (pointerY > scrollerRect.bottom - SCROLL_THRESHOLD && pointerY <= scrollerRect.bottom) {
              var proximity = pointerY - (scrollerRect.bottom - SCROLL_THRESHOLD);
              scrollSpeedRef.current.y = MAX_SCROLL_SPEED * (proximity / SCROLL_THRESHOLD);
            }
          }
          // horizontal scroll logic (if not locked)
          if (lockAxis !== 'y') {
            if (pointerX < scrollerRect.left + SCROLL_THRESHOLD && pointerX >= scrollerRect.left) {
              var proximity = scrollerRect.left + SCROLL_THRESHOLD - pointerX;
              scrollSpeedRef.current.x = -MAX_SCROLL_SPEED * (proximity / SCROLL_THRESHOLD);
            } else if (pointerX > scrollerRect.right - SCROLL_THRESHOLD && pointerX <= scrollerRect.right) {
              var proximity = pointerX - (scrollerRect.right - SCROLL_THRESHOLD);
              scrollSpeedRef.current.x = MAX_SCROLL_SPEED * (proximity / SCROLL_THRESHOLD);
            }
          }
          // start animation if speed is not 0
          if ((scrollSpeedRef.current.x !== 0 || scrollSpeedRef.current.y !== 0) && !scrollAnimationRef.current) {
            scrollAnimationRef.current = requestAnimationFrame(autoScrolling);
          }
        }
      }
      // drop-point correction for both axes
      var scrollDelta = {
        x: 0,
        y: 0
      };
      if (autoScroll && scrollContainerRef.current) {
        var scroller = scrollContainerRef.current;
        if (scroller instanceof HTMLElement) {
          scrollDelta = {
            y: scroller.scrollTop - initialScrollRef.current.y,
            x: scroller.scrollLeft - initialScrollRef.current.x
          };
        } else if (scroller instanceof Window) {
          scrollDelta = {
            y: scroller.scrollY - initialScrollRef.current.y,
            x: scroller.scrollX - initialScrollRef.current.x
          };
        }
      }
      var sourceRect = itemsRect.current[sourceIndex];
      var targetPoint = {
        x: (lockAxis === 'y' ? sourceRect.left : pointInWindow.x) + scrollDelta.x,
        y: (lockAxis === 'x' ? sourceRect.top : pointInWindow.y) + scrollDelta.y
      };
      var targetIndex = findItemIndexAtPosition(targetPoint, itemsRect.current, {
        fallbackToClosest: true
      });
      // if not target detected, we don't need to update other items' position
      if (targetIndex === -1) {
        return;
      }
      // if targetIndex changed and last target index is set we can let the parent know the new position
      if (onSortMove && lastTargetIndexRef.current !== undefined && lastTargetIndexRef.current !== targetIndex) {
        onSortMove(targetIndex);
      }
      // we keep track of the last target index (to be passed to the onSortEnd callback)
      lastTargetIndexRef.current = targetIndex;
      var isMovingRight = sourceIndex < targetIndex;
      // in this loop, we go over each sortable item and see if we need to update their position
      for (var index = 0; index < itemsRef.current.length; index += 1) {
        var currentItem = itemsRef.current[index];
        var currentItemRect = itemsRect.current[index];
        // if current index is between sourceIndex and targetIndex, we need to translate them
        if (isMovingRight && index >= sourceIndex && index <= targetIndex || !isMovingRight && index >= targetIndex && index <= sourceIndex) {
          // we need to move the item to the previous or next item position
          var nextItemRects = itemsRect.current[isMovingRight ? index - 1 : index + 1];
          if (nextItemRects) {
            var translateX = nextItemRects.left - currentItemRect.left;
            var translateY = nextItemRects.top - currentItemRect.top;
            // we use `translate3d` to force using the GPU if available
            currentItem.style.transform = "translate3d(".concat(translateX, "px, ").concat(translateY, "px, 0px)");
          }
        }
        // otherwise, the item should be at its original position
        else {
          currentItem.style.transform = 'translate3d(0,0,0)';
        }
        // we want the translation to be animated
        currentItem.style.transitionDuration = '300ms';
      }
      (_b = dropTargetLogic.setPosition) === null || _b === void 0 ? void 0 : _b.call(dropTargetLogic, lastTargetIndexRef.current, itemsRect.current, lockAxis);
    },
    onEnd: function onEnd() {
      var _a;
      // reset auto scroll variables
      if (autoScroll) {
        // reset the ref that holds the scrollable container
        scrollContainerRef.current = null;
        // reset the scroll speed
        scrollSpeedRef.current = {
          x: 0,
          y: 0
        };
        // cancel any ongoing animation frame loop
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
          scrollAnimationRef.current = null;
        }
      }
      // we reset all items translations (the parent is expected to sort the items in the onSortEnd callback)
      for (var index = 0; index < itemsRef.current.length; index += 1) {
        var currentItem = itemsRef.current[index];
        currentItem.style.transform = '';
        currentItem.style.transitionDuration = '';
      }
      var sourceIndex = sourceIndexRef.current;
      if (sourceIndex !== undefined) {
        // show the source item again
        var source = itemsRef.current[sourceIndex];
        if (source) {
          source.style.opacity = sourceOpacityRef.current;
          source.style.visibility = '';
        }
        var targetIndex = lastTargetIndexRef.current;
        if (targetIndex !== undefined) {
          if (sourceIndex !== targetIndex) {
            // sort our internal items array
            itemsRef.current = arrayMove(itemsRef.current, sourceIndex, targetIndex);
            // let the parent know
            onSortEnd(sourceIndex, targetIndex);
          }
        }
      }
      // reset internal state refs
      sourceIndexRef.current = undefined;
      lastTargetIndexRef.current = undefined;
      (_a = dropTargetLogic.hide) === null || _a === void 0 ? void 0 : _a.call(dropTargetLogic);
      // cleanup the target element from the DOM
      if (targetRef.current) {
        var holder = (customHolderRef === null || customHolderRef === void 0 ? void 0 : customHolderRef.current) || document.body;
        holder.removeChild(targetRef.current);
        targetRef.current = null;
      }
    }
  });
  var registerItem = React__default["default"].useCallback(function (item) {
    itemsRef.current.push(item);
  }, []);
  var removeItem = React__default["default"].useCallback(function (item) {
    var index = itemsRef.current.indexOf(item);
    if (index !== -1) {
      itemsRef.current.splice(index, 1);
    }
  }, []);
  var registerKnob = React__default["default"].useCallback(function (item) {
    knobs.current.push(item);
  }, []);
  var removeKnob = React__default["default"].useCallback(function (item) {
    var index = knobs.current.indexOf(item);
    if (index !== -1) {
      knobs.current.splice(index, 1);
    }
  }, []);
  // we need to memoize the context to avoid re-rendering every children of the context provider
  // when not needed
  var context = React__default["default"].useMemo(function () {
    return {
      registerItem: registerItem,
      removeItem: removeItem,
      registerKnob: registerKnob,
      removeKnob: removeKnob
    };
  }, [registerItem, removeItem, registerKnob, removeKnob]);
  return React__default["default"].createElement(as || DEFAULT_CONTAINER_TAG, tslib.__assign(tslib.__assign(tslib.__assign({}, allowDrag ? listeners : {}), rest), {
    ref: containerRef
  }), React__default["default"].createElement(SortableListContext.Provider, {
    value: context
  }, children, (_b = dropTargetLogic.render) === null || _b === void 0 ? void 0 : _b.call(dropTargetLogic)));
};
/**
 * SortableItem only adds a ref to its children so that we can register it to the main Sortable
 */
var SortableItem = function SortableItem(_a) {
  var children = _a.children;
  var context = React__default["default"].useContext(SortableListContext);
  if (!context) {
    throw new Error('SortableItem must be a child of SortableList');
  }
  var registerItem = context.registerItem,
    removeItem = context.removeItem;
  var elementRef = React__default["default"].useRef(null);
  React__default["default"].useEffect(function () {
    var currentItem = elementRef.current;
    if (currentItem) {
      registerItem(currentItem);
    }
    return function () {
      if (currentItem) {
        removeItem(currentItem);
      }
    };
    // if the children changes, we want to re-register the DOM node
  }, [registerItem, removeItem, children]);
  return React__default["default"].cloneElement(children, {
    ref: elementRef
  });
};
var SortableKnob = function SortableKnob(_a) {
  var children = _a.children;
  var context = React__default["default"].useContext(SortableListContext);
  if (!context) {
    throw new Error('SortableKnob must be a child of SortableList');
  }
  var registerKnob = context.registerKnob,
    removeKnob = context.removeKnob;
  var elementRef = React__default["default"].useRef(null);
  React__default["default"].useEffect(function () {
    var currentItem = elementRef.current;
    if (currentItem) {
      registerKnob(currentItem);
    }
    return function () {
      if (currentItem) {
        removeKnob(currentItem);
      }
    };
    // if the children changes, we want to re-register the DOM node
  }, [registerKnob, removeKnob, children]);
  return React__default["default"].cloneElement(children, {
    ref: elementRef
  });
};

exports.SortableItem = SortableItem;
exports.SortableKnob = SortableKnob;
exports["default"] = SortableList;
//# sourceMappingURL=index.js.map
