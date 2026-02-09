import React from 'react';
import { useVirtualizer } from '../../hooks/useVirtualizer';

interface VirtualListProps {
    count: number;
    itemHeight: number;
    renderItem: (index: number, style: React.CSSProperties) => React.ReactNode;
    className?: string;
    role?: string;
}

export const VirtualList = ({ count, itemHeight, renderItem, className, role = 'tree' }: VirtualListProps) => {
    const parentRef = React.useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count,
        getScrollElement: () => parentRef.current,
        estimateSize: () => itemHeight,
        overscan: 5,
    });

    return (
        <div
            ref={parentRef}
            className={`overflow-auto ${className}`}
            style={{
                height: '100%',
                maxHeight: '300px', // Default max height
                position: 'relative',
            }}
        >
            <div
                style={{
                    height: `${virtualizer.totalSize}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                <ul className="m-0 p-0 list-none relative" role={role}>
                    {virtualizer.virtualItems.map((virtualItem) => (
                        <React.Fragment key={virtualItem.index}>
                            {renderItem(virtualItem.index, {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`,
                            })}
                        </React.Fragment>
                    ))}
                </ul>
            </div>
        </div>
    );
};
