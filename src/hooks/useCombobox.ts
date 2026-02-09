import { useState, useCallback, useRef } from 'react';
import { FlatTreeNode } from '../types';

interface UseComboboxProps {
    items: FlatTreeNode[];
    onSelect: (item: FlatTreeNode, multiSelect: boolean) => void;
    onExpand: (item: FlatTreeNode) => void;
    selectedIds: Set<string>;
    inputValue: string;
    onInputChange: (value: string) => void;
}

export function useCombobox({
    items,
    onSelect,
    onExpand,
    inputValue,
    onInputChange,
}: UseComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    // inputValue is now controlled via props
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => {
        setIsOpen(false);
        setActiveIndex(-1);
    }, []);

    const toggle = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            // If closed and navigation key is pressed, open it
            if (!isOpen && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
                setIsOpen(true);
                if (e.key === 'ArrowDown') setActiveIndex(0);
                return;
            }

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setActiveIndex((prev) => (prev + 1 < items.length ? prev + 1 : prev));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (activeIndex >= 0 && items[activeIndex]) {
                        onSelect(items[activeIndex], false); // Single select via helper? Or toggle? 
                        // The requirement says "Multi-select with indeterminate states". 
                        // Usually Enter selects. Space might also select. 
                        // Let's assume Enter toggles for now or selects.
                        // Actually, for multi-select combo, Enter usually adds tag.
                        // But if it's a tree, maybe we just toggle selection.
                    }
                    break;
                case ' ':
                    // Space usually toggles checkbox if focused on item
                    // Or if typing, adds space.
                    // If activeIndex is -1 (in input), space is space.
                    // If activeIndex >= 0 (navigating list), space could toggle selection.
                    if (activeIndex >= 0) {
                        e.preventDefault();
                        if (items[activeIndex]) {
                            onSelect(items[activeIndex], true); // multiSelect true for checkbox feel?
                        }
                    }
                    break;
                case 'ArrowRight':
                    if (activeIndex >= 0 && items[activeIndex]) {
                        e.preventDefault();
                        const item = items[activeIndex];
                        if (item.hasChildren && !item.isExpanded) {
                            onExpand(item);
                        }
                    }
                    break;
                case 'ArrowLeft':
                    if (activeIndex >= 0 && items[activeIndex]) {
                        e.preventDefault();
                        const item = items[activeIndex];
                        if (item.hasChildren && item.isExpanded) {
                            onExpand(item); // Toggle collapse
                        } else if (item.parentId) {
                            // Move focus to parent
                            // Find parent index
                            // This is O(N) but typically N visible is not huge, or we can use a map.
                            // For now, linear scan is acceptable given virtualization limits DOM but not flatData (flatData can be large)
                            // But flatData only contains expanded items.
                            // We should optimize this if possible.
                            const parentIndex = items.findIndex(i => i.id === item.parentId);
                            if (parentIndex !== -1) setActiveIndex(parentIndex);
                        }
                    }
                    break;
                case 'Home':
                    e.preventDefault();
                    setActiveIndex(0);
                    break;
                case 'End':
                    e.preventDefault();
                    setActiveIndex(items.length - 1);
                    break;
                case 'Escape':
                    e.preventDefault();
                    close();
                    break;
                case 'Tab':
                    // Allow default tab behavior to move focus out, also close
                    close();
                    break;
            }
        },
        [isOpen, items, activeIndex, onSelect, onExpand, close],
    );

    return {
        isOpen,
        open,
        close,
        toggle,
        activeIndex,
        setActiveIndex,
        inputValue,
        setInputValue: onInputChange,
        inputRef,
        listRef,
        handleKeyDown,
    };
}
