import { useCallback, useMemo, useState } from 'react';
import { FlatTreeNode, TreeNode } from '../types';

interface UseTreeProps {
    data: TreeNode[];
    onLoadChildren?: (nodeId: string) => Promise<TreeNode[] | void>;
    defaultExpandedIds?: string[];
    defaultSelectedIds?: string[];
}

export function useTree({
    data,
    onLoadChildren,
    defaultExpandedIds = [],
    defaultSelectedIds = [],
}: UseTreeProps) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(defaultExpandedIds));
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(defaultSelectedIds));
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

    // Create a map for easy lookup and parent reference
    const nodeMap = useMemo(() => {
        const map = new Map<string, { node: TreeNode; parentId?: string; childrenIds: string[] }>();
        const traverse = (nodes: TreeNode[], parentId?: string) => {
            nodes.forEach((node) => {
                map.set(node.id, {
                    node,
                    parentId,
                    childrenIds: node.children?.map((c) => c.id) || [],
                });
                if (node.children) {
                    traverse(node.children, node.id);
                }
            });
        };
        traverse(data);
        return map;
    }, [data]);

    const toggleExpansion = useCallback(
        async (nodeId: string) => {
            const isExpanded = expandedIds.has(nodeId);
            const newExpandedIds = new Set(expandedIds);

            if (isExpanded) {
                newExpandedIds.delete(nodeId);
                setExpandedIds(newExpandedIds);
            } else {
                newExpandedIds.add(nodeId);
                setExpandedIds(newExpandedIds);

                const nodeInfo = nodeMap.get(nodeId);
                const hasChildren = nodeInfo?.node.hasChildren ?? (nodeInfo?.node.children && nodeInfo.node.children.length > 0);

                if (onLoadChildren && hasChildren && (!nodeInfo?.node.children || nodeInfo.node.children.length === 0)) {
                    setLoadingIds((prev) => {
                        const next = new Set(prev);
                        next.add(nodeId);
                        return next;
                    });
                    try {
                        await onLoadChildren(nodeId);
                    } finally {
                        setLoadingIds((prev) => {
                            const next = new Set(prev);
                            next.delete(nodeId);
                            return next;
                        });
                    }
                }
            }
        },
        [expandedIds, onLoadChildren, nodeMap],
    );

    const expandAll = useCallback(() => {
        const allIds = new Set<string>();
        // We only expand nodes that have children to keep set size reasonable?
        // Or just all IDs. Expanding leaf nodes is harmless usually (no children).
        // Better: Only expand nodes with children.
        nodeMap.forEach((info, id) => {
            if ((info.node.children && info.node.children.length > 0) || info.node.hasChildren) {
                allIds.add(id);
            }
        });
        setExpandedIds(allIds);
    }, [nodeMap]);

    const collapseAll = useCallback(() => {
        setExpandedIds(new Set());
    }, []);

    const toggleSelection = useCallback((nodeId: string, multiSelect: boolean) => {
        if (!multiSelect) {
            // Toggle single select
            setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(nodeId)) next.delete(nodeId);
                else {
                    // If single select, traditionally we clear others, strict requirement "Multi-select" implies this mode is primarily multi.
                    // But if we support both... let's assumes just toggle for now.
                    next.add(nodeId);
                }
                return next;
            });
            return;
        }

        // Cascading selection logic
        setSelectedIds((prev) => {
            const next = new Set(prev);
            const isSelected = !next.has(nodeId);

            // 1. Update the node itself
            if (isSelected) next.add(nodeId);
            else next.delete(nodeId);

            // 2. Cascade down to all LOADED children
            const cascadeDown = (id: string, select: boolean) => {
                const info = nodeMap.get(id);
                if (!info) return;
                info.childrenIds.forEach(childId => {
                    if (select) next.add(childId);
                    else next.delete(childId);
                    cascadeDown(childId, select);
                });
            };
            cascadeDown(nodeId, isSelected);

            // 3. Cascade up to check parents
            let currentId = nodeId;
            while (currentId) {
                const info = nodeMap.get(currentId);
                if (!info || !info.parentId) break;

                const parentId = info.parentId;
                const parentInfo = nodeMap.get(parentId);
                if (!parentInfo) break;

                if (!isSelected) {
                    // If we deselected a child, parent must be deselected
                    next.delete(parentId);
                } else {
                    // Check if all siblings selected
                    const siblings = parentInfo.childrenIds;
                    const allSiblingsSelected = siblings.every(id => next.has(id));
                    if (allSiblingsSelected) {
                        next.add(parentId);
                    } else {
                        next.delete(parentId);
                    }
                }
                currentId = parentId;
            }

            return next;
        });
    }, [nodeMap]);

    const flatData = useMemo(() => {
        const result: FlatTreeNode[] = [];

        // We compute derived state (indeterminate, implicit selection) logic here to avoid state sync issues.
        // Map id -> { selected, indeterminate }
        const stateCache = new Map<string, { selected: boolean; indeterminate: boolean }>();

        // Post-order traversal to calculate upward state
        const calculateState = (nodes: TreeNode[]) => {
            nodes.forEach(node => {
                if (node.children) calculateState(node.children);

                let isSelected = selectedIds.has(node.id);
                let isIndeterminate = false;

                if (node.children && node.children.length > 0) {
                    const childIds = node.children.map(c => c.id);
                    const allSelected = childIds.every(id => selectedIds.has(id) || (stateCache.get(id)?.selected));
                    const someSelected = childIds.some(id => selectedIds.has(id) || (stateCache.get(id)?.selected) || (stateCache.get(id)?.indeterminate));

                    // If all children selected, parent is visually selected (even if not in set)
                    if (allSelected) {
                        isSelected = true;
                    }

                    if (!isSelected && someSelected) {
                        isIndeterminate = true;
                    }
                }
                stateCache.set(node.id, { selected: isSelected, indeterminate: isIndeterminate });
            });
        };
        calculateState(data);

        const flatten = (nodes: TreeNode[], level: number, parentId?: string) => {
            nodes.forEach((node, index) => {
                const isExpanded = expandedIds.has(node.id);
                const state = stateCache.get(node.id);
                const isSelected = state?.selected || false;
                const isIndeterminate = state?.indeterminate || false;

                // Use explicit flag if present, otherwise check children length
                const hasChildren = node.hasChildren !== undefined
                    ? node.hasChildren
                    : (!!node.children && node.children.length > 0);

                result.push({
                    id: node.id,
                    label: node.label,
                    level,
                    hasChildren,
                    isExpanded,
                    isSelected,
                    isIndeterminate,
                    isLoaded: node.isLoaded ?? true,
                    original: node,
                    parentId,
                    pos: index + 1,
                    setSize: nodes.length,
                });

                if (isExpanded && hasChildren && node.children) {
                    flatten(node.children, level + 1, node.id);
                }
            });
        };

        flatten(data, 0);
        return result;
    }, [data, expandedIds, selectedIds]);

    return {
        flatData,
        expandedIds,
        selectedIds,
        loadingIds,
        toggleExpansion,
        toggleSelection,
        expandAll,
        collapseAll,
    };
}
