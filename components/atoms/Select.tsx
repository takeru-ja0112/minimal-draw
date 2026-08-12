import { Listbox } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
// import { Tb}

interface SelectProps {
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    className?: string;
    children?: React.ReactNode;
}

export default function Select({ value, onChange, className, children }: SelectProps) {
    const options: { value: string; label: string }[] = [];
    React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
            const props = child.props as any;
            options.push({
                value: props.value ?? '',
                label: typeof props.children === 'string' ? props.children : String(props.children ?? ''),
            });
        }
    });

    const selectedOption = options.find((opt) => opt.value === value) || options[0] || { value: '', label: '' };

    const handleSelectChange = (newValue: string) => {
        if (onChange) {
            onChange({
                target: { value: newValue }
            } as React.ChangeEvent<HTMLSelectElement>);
        }
    };

    return (
        <div className="relative w-48">
            <Listbox value={value || selectedOption.value} onChange={handleSelectChange}>
                {({ open }) => (
                    <>
                        <Listbox.Button className={`flex justify-between  bg-white border border-gray-300 rounded-xl px-4 py-2 w-full text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-700 ${className || ''}`}>
                            {selectedOption.label}
                            <label>▼</label>
                        </Listbox.Button>
                        <AnimatePresence>
                            {open && (
                                <Listbox.Options static>
                                    <motion.ul
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.18 }}
                                        className="absolute mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto"
                                    >
                                        {options.map((option) => (
                                            <Listbox.Option
                                                key={option.value}
                                                value={option.value}
                                                className={({ active, selected }) =>
                                                    `px-4 py-2 cursor-pointer ${active ? 'bg-yellow-100' : ''} ${selected ? 'font-bold text-yellow-700' : ''}`
                                                }
                                            >
                                                {option.label}
                                            </Listbox.Option>
                                        ))}
                                    </motion.ul>
                                </Listbox.Options>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </Listbox>
        </div>
    );
}