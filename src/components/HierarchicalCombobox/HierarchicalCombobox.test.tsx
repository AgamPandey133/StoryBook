import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HierarchicalCombobox } from './index';
import { TreeNode } from '../../types';

const mockData: TreeNode[] = [
    {
        id: '1',
        label: 'Parent 1',
        children: [
            { id: '1-1', label: 'Child 1-1' },
            { id: '1-2', label: 'Child 1-2' },
        ],
    },
    {
        id: '2',
        label: 'Parent 2',
        children: [], // hasChildren undefined -> false
    },
];

describe('HierarchicalCombobox', () => {
    it('renders the placeholder', () => {
        render(<HierarchicalCombobox data={mockData} placeholder="Test Placeholder" />);
        expect(screen.getByPlaceholderText('Test Placeholder')).toBeInTheDocument();
    });

    it('opens the list when input is clicked', () => {
        render(<HierarchicalCombobox data={mockData} />);
        const input = screen.getByRole('combobox');

        // Initially closed, list not visible
        expect(screen.queryByRole('tree')).not.toBeInTheDocument();

        fireEvent.click(input);

        // Now open
        expect(screen.getByRole('tree')).toBeInTheDocument();
    });

    it('displays items in the list', () => {
        render(<HierarchicalCombobox data={mockData} />);
        const input = screen.getByRole('combobox');
        fireEvent.click(input);

        expect(screen.getByText('Parent 1')).toBeInTheDocument();
        expect(screen.getByText('Parent 2')).toBeInTheDocument();
        // Children hidden initially
        expect(screen.queryByText('Child 1-1')).not.toBeInTheDocument();
    });

    it('expands a node when toggle is clicked', async () => {
        render(<HierarchicalCombobox data={mockData} />);
        fireEvent.click(screen.getByRole('combobox'));

        const parent1 = screen.getByText('Parent 1');
        // The toggle is a sibling div with "▶" or similar.
        // In our implementation, the toggle is inside the li but separate from label?
        // Let's rely on text or role.
        // The expander has "▶" inside it.

        const expanders = screen.getAllByText('▶');
        fireEvent.click(expanders[0]); // Expand Parent 1

        await waitFor(() => {
            expect(screen.getByText('Child 1-1')).toBeInTheDocument();
        });
    });

    it('selects an item and displays it as a tag', async () => {
        render(<HierarchicalCombobox data={mockData} />);
        fireEvent.click(screen.getByRole('combobox'));

        const parent2 = screen.getByText('Parent 2');
        fireEvent.click(parent2);

        // It should appear as a tag
        await waitFor(() => {
            expect(screen.getByText('Parent 2', { selector: 'span' })).toBeInTheDocument(); // Tag text
        });
    });

    it('shows "No results found" when searching for non-existent item', async () => {
        render(<HierarchicalCombobox data={mockData} />);
        const input = screen.getByRole('combobox');

        fireEvent.change(input, { target: { value: 'NonExistent' } });

        // Expect expanded list with message
        await waitFor(() => {
            expect(screen.getByText('No results found')).toBeInTheDocument();
        });
    });
});
