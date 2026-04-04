import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type VirtualizedFeedListProps<T> = {
  className?: string;
  items: T[];
  itemHeight: number;
  overscan?: number;
  getItemKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
};

const VirtualizedFeedList = <T,>({
  className,
  items,
  itemHeight,
  overscan = 4,
  getItemKey,
  renderItem,
}: VirtualizedFeedListProps<T>) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      setContainerHeight(container.clientHeight);
    });
    observer.observe(container);
    setContainerHeight(container.clientHeight);

    return () => {
      observer.disconnect();
    };
  }, []);

  const totalHeight = items.length * itemHeight;
  const firstVisibleIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
  const lastVisibleIndex = Math.min(items.length, firstVisibleIndex + visibleCount);

  const visibleItems = useMemo(
    () => items.slice(firstVisibleIndex, lastVisibleIndex),
    [firstVisibleIndex, items, lastVisibleIndex],
  );

  return (
    <div
      ref={containerRef}
      className={className}
      onScroll={handleScroll}
    >
      <div style={{ height: `${totalHeight}px`, position: "relative" }}>
        {visibleItems.map((item, index) => {
          const itemIndex = firstVisibleIndex + index;
          return (
            <div
              key={getItemKey(item, itemIndex)}
              style={{
                position: "absolute",
                top: `${itemIndex * itemHeight}px`,
                left: 0,
                right: 0,
              }}
            >
              {renderItem(item, itemIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(VirtualizedFeedList) as typeof VirtualizedFeedList;
