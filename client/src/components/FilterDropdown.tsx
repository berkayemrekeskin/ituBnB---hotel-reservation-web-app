import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface FilterOption {
    label: string;
    value: string | number;
}

interface FilterDropdownProps {
    label: string;
    options: FilterOption[];
    value: string | number | null;
    onChange: (value: string | number | null) => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
    label,
    options,
    value,
    onChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                const modal = document.getElementById(`modal-${label}`);
                if (modal && !modal.contains(e.target as Node)) {
                    setIsOpen(false);
                }
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, label]);

    return (
        <>
            <div
                ref={containerRef}
                style={{
                    position: 'relative',
                    display: 'inline-block',
                    zIndex: isOpen ? 99999 : 10
                }}
            >
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 border rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${value
                            ? 'border-gray-900 bg-gray-900 text-white shadow-md'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-900 hover:shadow-sm'
                        }`}
                    style={{ position: 'relative', zIndex: 100000 }}
                >
                    {selectedOption ? selectedOption.label : label}
                    <ChevronDown
                        size={14}
                        className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>
            </div>

            {/* Modal Overlay */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            zIndex: 99998,
                            backdropFilter: 'blur(2px)'
                        }}
                    />

                    {/* Modal Content */}
                    <div
                        id={`modal-${label}`}
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: '#ffffff',
                            borderRadius: '16px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                            width: '90%',
                            maxWidth: '400px',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            zIndex: 99999,
                            padding: '24px',
                            animation: 'slideIn 0.2s ease-out'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                            paddingBottom: '16px',
                            borderBottom: '2px solid #e5e7eb'
                        }}>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: '#111827',
                                margin: 0
                            }}>
                                {label}
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: '#f3f4f6',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: '8px',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            >
                                <X size={20} color="#374151" />
                            </button>
                        </div>

                        {/* Clear Button */}
                        <button
                            type="button"
                            onClick={() => {
                                onChange(null);
                                setIsOpen(false);
                            }}
                            style={{
                                width: '100%',
                                textAlign: 'center',
                                padding: '14px 20px',
                                backgroundColor: '#fef2f2',
                                border: '2px solid #fecaca',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                marginBottom: '16px',
                                fontSize: '15px',
                                fontWeight: '600',
                                color: '#dc2626',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#fee2e2';
                                e.currentTarget.style.borderColor = '#fca5a5';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#fef2f2';
                                e.currentTarget.style.borderColor = '#fecaca';
                            }}
                        >
                            ✕ Clear Filter
                        </button>

                        {/* Options Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: '12px'
                        }}>
                            {options.map((option) => {
                                const isSelected = value === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        style={{
                                            padding: '16px 20px',
                                            backgroundColor: isSelected ? '#dbeafe' : '#f9fafb',
                                            border: isSelected ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            fontSize: '15px',
                                            fontWeight: isSelected ? 'bold' : '600',
                                            color: isSelected ? '#1e40af' : '#374151',
                                            transition: 'all 0.2s',
                                            textAlign: 'center'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.backgroundColor = '#eff6ff';
                                                e.currentTarget.style.borderColor = '#93c5fd';
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.backgroundColor = '#f9fafb';
                                                e.currentTarget.style.borderColor = '#e5e7eb';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }
                                        }}
                                    >
                                        {isSelected && '✓ '}
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Add animation */}
                    <style>{`
                        @keyframes slideIn {
                            from {
                                opacity: 0;
                                transform: translate(-50%, -45%);
                            }
                            to {
                                opacity: 1;
                                transform: translate(-50%, -50%);
                            }
                        }
                    `}</style>
                </>
            )}
        </>
    );
};
