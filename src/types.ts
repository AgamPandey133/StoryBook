export interface TreeNode {
    id: string;
    label: string;
    children?: TreeNode[];
    hasChildren?: boolean; // Explicit flag for async loading
    isLoaded?: boolean; // For async loading state
    data?: any; // Extra data
}

export interface TreeState {
    expandedIds: Set<string>;
    selectedIds: Set<string>;
}

export interface FlatTreeNode {
    id: string;
    label: string;
    level: number;
    hasChildren: boolean;
    isExpanded: boolean;
    isSelected: boolean;
    isIndeterminate?: boolean; // New field
    isLoaded: boolean;
    original: TreeNode;
    parentId?: string;
    pos: number; // Position in the flat list
    setSize: number; // For aria-setsize
}
