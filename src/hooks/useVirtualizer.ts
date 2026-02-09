import { useEffect, useState, useMemo, useCallback } from 'react';

interface UseVirtualizerProps {
    count: number;
    getScrollElement: () => HTMLElement | null;
    estimateSize: (index: number) => number;
    overscan?: number;
}

export interface VirtualItem {
    index: number;
    start: number;
    size: number;
    end: number;
}

export function useVirtualizer({
    count,
    getScrollElement,
    estimateSize,
    overscan = 5,
}: UseVirtualizerProps) {
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    const scrollElement = getScrollElement();

    const handleScroll = useCallback(() => {
        if (scrollElement) {
            setScrollTop(scrollElement.scrollTop);
        }
    }, [scrollElement]);

    useEffect(() => {
        if (!scrollElement) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerHeight(entry.contentRect.height);
            }
        });

        resizeObserver.observe(scrollElement);
        setContainerHeight(scrollElement.clientHeight);
        scrollElement.addEventListener('scroll', handleScroll);

        return () => {
            resizeObserver.disconnect();
            scrollElement.removeEventListener('scroll', handleScroll);
        };
    }, [scrollElement, handleScroll]);

    // Pre-calculate positions
    const { totalSize, itemPositions } = useMemo(() => {
        let size = 0;
        const positions: VirtualItem[] = [];
        for (let i = 0; i < count; i++) {
            const itemSize = estimateSize(i);
            positions.push({
                index: i,
                start: size,
                size: itemSize,
                end: size + itemSize,
            });
            size += itemSize;
        }
        return { totalSize: size, itemPositions: positions };
    }, [count, estimateSize]);

    // Binary search for start index
    const findStartIndex = useCallback((offset: number, items: VirtualItem[]) => {
        let low = 0;
        let high = items.length - 1;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const item = items[mid];

            if (!item) break;

            if (item.start <= offset && item.end > offset) {
                return mid;
            } else if (item.end <= offset) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        if (low > 0) return low - 1;
        return 0;
    }, []);

    const virtualItems = useMemo(() => {
        const rangeStart = scrollTop;
        const rangeEnd = scrollTop + containerHeight;

        let startIndex = findStartIndex(rangeStart, itemPositions);
        let endIndex = findStartIndex(rangeEnd, itemPositions);

        // Ensure we cover the full range
        if (endIndex < count - 1) {
            const item = itemPositions[endIndex];
            if (item && item.end < rangeEnd) {
                endIndex++;
            }
        }

        startIndex = Math.max(0, startIndex - overscan);
        endIndex = Math.min(count - 1, endIndex + overscan);

        const visibleItems: VirtualItem[] = [];
        for (let i = startIndex; i <= endIndex; i++) {
            const item = itemPositions[i];
            if (item) {
                visibleItems.push(item);
            }
        }

        return visibleItems;
    }, [scrollTop, containerHeight, count, itemPositions, overscan, findStartIndex]);

    const scrollToIndex = useCallback((index: number) => {
        const item = itemPositions[index];
        if (scrollElement && item) {
            scrollElement.scrollTo({ top: item.start, behavior: 'auto' });
        }
    }, [scrollElement, itemPositions]);

    return {
        virtualItems,
        totalSize,
        scrollToIndex,
    };
}
