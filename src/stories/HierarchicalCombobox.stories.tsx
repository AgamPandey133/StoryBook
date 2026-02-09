import type { Meta, StoryObj } from '@storybook/react';
import { HierarchicalCombobox } from '../components/HierarchicalCombobox';
import { TreeNode } from '../types';
import { filterTree } from '../utils/treeUtils';

const meta = {
    title: 'Components/HierarchicalCombobox',
    component: HierarchicalCombobox,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof HierarchicalCombobox>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock Data Generation
const generateTree = (depth: number, breadth: number, prefix = 'node'): TreeNode[] => {
    if (depth <= 0) return [];
    return Array.from({ length: breadth }).map((_, i) => {
        const id = `${prefix}-${i}`;
        return {
            id,
            label: `Node ${id}`,
            children: generateTree(depth - 1, breadth, id),
        };
    });
};

const smallData = generateTree(3, 3); // ~40 nodes
const largeData = generateTree(4, 5); // ~700 nodes
const hugeDirectData = Array.from({ length: 10000 }).map((_, i) => ({
    id: `item-${i}`,
    label: `Item ${i}`,
}));


export const Basic: Story = {
    args: {
        data: smallData,
        placeholder: 'Select a node...',
        className: 'w-72',
    },
};

export const LargeDataset: Story = {
    args: {
        data: largeData,
        placeholder: 'Scroll me...',
        className: 'w-72',
    },
};

export const TenThousandItems: Story = {
    args: {
        data: hugeDirectData,
        placeholder: 'Virtualization test...',
        className: 'w-72',
    },
};

export const AsyncLoading: Story = {
    args: {
        data: [
            { id: '1', label: 'Root 1 (Async)', children: [], hasChildren: true },
            { id: '2', label: 'Root 2 (Static)', children: [{ id: '2-1', label: 'Child 2-1' }] }
        ],
        onLoadChildren: async (nodeId) => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (nodeId === '1') {
                return [
                    { id: '1-1', label: 'Loaded Child 1' },
                    { id: '1-2', label: 'Loaded Child 2' },
                ];
            }
        },
        className: 'w-72',
    },
};

export const SearchableLocal: Story = {
    args: {
        data: largeData,
        placeholder: 'Type to search (Local)...',
        className: 'w-72',
        // No onSearchChange, relies on internal filtering
    },
};

// Async search mocking
// In Storybook, it's hard to mock controlled state perfectly without a wrapper.
// But we can try using render function or just mock the prop to log.
// For true async search demo, we need a stateful wrapper.
const AsyncSearchWrapper = () => {
    const [data, setData] = React.useState<TreeNode[]>(largeData);
    const handleSearch = async (query: string) => {
        // Simulate API
        await new Promise(resolve => setTimeout(resolve, 500));
        setData(filterTree(largeData, query));
    }
    return <HierarchicalCombobox data={data} onSearchChange={handleSearch} placeholder="Async Search..." className="w-72" />;
};

import React from 'react';

export const SearchableAsync: Story = {
    args: {
        data: [], // Dummy data to satisfy required prop, though render overrides it
    },
    render: () => <AsyncSearchWrapper />,
};
