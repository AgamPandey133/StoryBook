import { forwardRef } from 'react';

interface ComboboxInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    selectedItems: { id: string; label: string }[];
    onRemoveItem: (id: string) => void;
    isOpen: boolean;
    onToggle: () => void;
    activeDescendantId?: string;
}

export const ComboboxInput = forwardRef<HTMLInputElement, ComboboxInputProps>(
    ({ selectedItems, onRemoveItem, isOpen, onToggle, activeDescendantId, ...props }, ref) => {
        return (
            <div
                className="border border-gray-300 rounded-md p-1 flex flex-wrap gap-1 items-center bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 min-h-[42px]"
                onClick={() => {
                    // Focus input if container clicked
                    if (typeof ref === 'object' && ref?.current) {
                        ref.current.focus();
                    }
                    onToggle();
                }}
            >
                {selectedItems.map((item) => (
                    <span
                        key={item.id}
                        className="bg-blue-100 text-blue-800 text-sm px-2 py-0.5 rounded-full flex items-center"
                    >
                        {item.label}
                        <button
                            type="button"
                            className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveItem(item.id);
                            }}
                            aria-label={`Remove ${item.label}`}
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    ref={ref}
                    type="text"
                    className="flex-1 outline-none min-w-[80px] bg-transparent text-gray-900 placeholder-gray-500 px-1"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={isOpen}
                    aria-haspopup="tree"
                    aria-activedescendant={activeDescendantId}
                    {...props}
                />
                <div className="mr-2 text-gray-400 pointer-events-none" aria-hidden="true">
                    {isOpen ? '▲' : '▼'}
                </div>
            </div>
        );
    }
);
