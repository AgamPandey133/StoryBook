import { memo } from 'react';
import { FlatTreeNode } from '../../types';

interface TreeItemProps {
    node: FlatTreeNode;
    style: React.CSSProperties;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
    isActive: boolean; // Focused via keyboard
}

export const TreeItem = memo(({ node, style, onToggle, onSelect, isActive }: TreeItemProps) => {
    const { id, label, level, hasChildren, isExpanded, isSelected, isIndeterminate, isLoaded } = node;

    return (
        <li
            id={id}
            className={`
        flex items-center px-2 py-1 cursor-pointer select-none
        ${isActive ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
        ${isSelected || isIndeterminate ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-200'}
      `}
            style={style}
            role="treeitem"
            aria-selected={isSelected}
            aria-checked={isIndeterminate ? 'mixed' : isSelected}
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-level={level + 1}
            onClick={() => onSelect(id)}
        >
            {/* Indentation */}
            <div style={{ width: `${level * 20}px` }} className="shrink-0" />

            {/* Expander Icon */}
            <div
                className="w-5 h-5 flex items-center justify-center mr-1 cursor-pointer shrink-0"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle(id);
                }}
            >
                {hasChildren ? (
                    isLoaded ? (
                        <span className={`transform transition-transform text-gray-500 ${isExpanded ? 'rotate-90' : ''}`}>
                            ▶
                        </span>
                    ) : (
                        <span className="animate-spin text-gray-500">⌛</span>
                    )
                ) : (
                    <span className="w-4" />
                )}
            </div>

            {/* Checkbox for multi-select */}
            <div className="mr-2 relative flex items-center justify-center w-4 h-4">
                <input
                    type="checkbox"
                    checked={!!isSelected}
                    ref={(input) => {
                        if (input) input.indeterminate = !!isIndeterminate;
                    }}
                    readOnly
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    tabIndex={-1}
                />
            </div>

            {/* Label */}
            <span className="truncate">{label}</span>

            {!isLoaded && isExpanded && <span className="ml-2 text-xs text-gray-400">Loading...</span>}
        </li>
    );
});
