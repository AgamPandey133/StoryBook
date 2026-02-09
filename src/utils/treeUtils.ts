import { TreeNode } from '../types';

export const filterTree = (nodes: TreeNode[], query: string): TreeNode[] => {
    if (!query) return nodes;
    const lowerQuery = query.toLowerCase();

    return nodes
        .map((node): TreeNode | null => {
            // Check if current node matches
            const matches = node.label.toLowerCase().includes(lowerQuery);

            // Check children
            // If node has children, filter them
            const filteredChildren = node.children
                ? filterTree(node.children, query)
                : [];

            if (matches || filteredChildren.length > 0) {
                return {
                    ...node,
                    children: filteredChildren,
                    // Note: references to original objects are lost here only for the structure, 
                    // but we copy properties.
                };
            }
            return null;
        })
        .filter((node): node is TreeNode => node !== null);
};
