import { useRef, useEffect, useState, useMemo } from 'react';
import { useTree } from '../../hooks/useTree';
import { useCombobox } from '../../hooks/useCombobox';
import { TreeNode } from '../../types';
import { ComboboxInput } from './ComboboxInput';
import { VirtualList } from './VirtualList';
import { TreeItem } from './TreeItem';
import { filterTree } from '../../utils/treeUtils';

interface HierarchicalComboboxProps {
    data: TreeNode[];
    onLoadChildren?: (nodeId: string) => Promise<TreeNode[] | void>;
    placeholder?: string;
    className?: string;
    onSearchChange?: (query: string) => void;
}

export const HierarchicalCombobox = ({
    data,
    onLoadChildren,
    placeholder = 'Select items...',
    className,
    onSearchChange,
}: HierarchicalComboboxProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Lifted Input State
    const [inputValue, setInputValue] = useState('');

    // Calculate filtered data synchronously for useTree
    // If onSearchChange is present, we assume data is already filtered by parent (async)
    // If not, we filter locally.
    const treeData = useMemo(() => {
        if (onSearchChange) return data;
        return filterTree(data, inputValue);
    }, [data, inputValue, onSearchChange]);

    const {
        flatData,
        selectedIds,
        toggleExpansion,
        toggleSelection,
        expandAll,
        collapseAll,
    } = useTree({
        data: treeData,
        onLoadChildren,
    });

    const {
        isOpen,
        activeIndex,
        open,
        close,
        toggle,
        // inputValue and setInputValue are now passed in
        handleKeyDown,
    } = useCombobox({
        items: flatData,
        onSelect: (item, multi) => toggleSelection(item.id, multi),
        onExpand: (item) => toggleExpansion(item.id),
        selectedIds,
        inputValue,
        onInputChange: setInputValue,
    });

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                close();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [close]);

    // Handle Search Output & Announcements
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        if (onSearchChange) {
            onSearchChange(inputValue);
        }

        if (inputValue.length > 0) {
            expandAll();
        } else {
            if (!onSearchChange) {
                collapseAll();
            } else {
                // For async, maybe we also want to collapse or keep state?
                // Let's stick to previous logic: Search -> Expand.
            }
        }
    }, [inputValue, onSearchChange, expandAll, collapseAll]);


    useEffect(() => {
        if (isOpen) {
            const count = flatData.length;
            setAnnouncement(`${count} result${count !== 1 ? 's' : ''} available.`);
        }
    }, [flatData.length, isOpen]);

    const selectedItems = flatData
        .filter((node) => selectedIds.has(node.id))
        .map((node) => ({ id: node.id, label: node.label }));

    const activeDescendantId = activeIndex >= 0 ? flatData[activeIndex]?.id : undefined;

    return (
        <div
            ref={containerRef}
            className={`relative w-full ${className}`}
            onKeyDown={handleKeyDown}
        >
            <div className="sr-only" aria-live="polite" aria-atomic="true">
                {announcement}
            </div>

            <ComboboxInput
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    open();
                }}
                placeholder={placeholder}
                selectedItems={selectedItems}
                onRemoveItem={(id) => toggleSelection(id, true)}
                isOpen={isOpen}
                onToggle={toggle}
                activeDescendantId={activeDescendantId}
            />

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-hidden">
                    {flatData.length === 0 ? (
                        <div className="p-2 text-gray-500 text-center">
                            {inputValue ? 'No results found' : 'No items'}
                        </div>
                    ) : (
                        <VirtualList
                            count={flatData.length}
                            itemHeight={32}
                            renderItem={(index, style) => {
                                const node = flatData[index];
                                if (!node) return null;
                                return (
                                    <TreeItem
                                        key={node.id}
                                        node={node}
                                        style={style}
                                        onToggle={toggleExpansion}
                                        onSelect={(id) => toggleSelection(id, true)}
                                        isActive={index === activeIndex}
                                    />
                                );
                            }}
                            className="max-h-60"
                        />
                    )}
                </div>
            )}
        </div>
    );
};
