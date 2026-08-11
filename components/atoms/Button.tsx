"use client";

import { motion } from "motion/react";
import React from "react";

interface BtnProps {
    value?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    className?: string;
    icon?: React.ReactNode;
    id?: string;
}

export default function Btn({ value, className ,onClick, disabled, type = "button", icon, ...props }: BtnProps) {

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className={`text-black bg-white border hover:bg-gray-200 transition duration-500 border-dotted border-3 font-bold py-2 px-4 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ${className}`}
            onClick={(e) => {
                if (onClick) onClick(e);
            }}
            disabled={disabled}
            type={type}
            {...props}
        >
            <span className="flex flex-row items-center justify-center">
                {icon && <span className="mr-1">{icon}</span>}
                {value && <span>{value}</span>}
            </span>
        </motion.button>
    );
}