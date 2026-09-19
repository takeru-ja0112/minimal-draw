"use client"

import { motion } from "motion/react";

interface BtnProps {
  value?: string;
  name?: string;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: "text" | "password" | "email" | "number" | "date";
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}

export default function Input({
  value, name, className, onClick, onChange, onBlur, disabled, type = "text", placeholder, ...props }: BtnProps) {
  return (
    <>
      <label htmlFor={name} className="sr-only">{value}</label>
      <motion.input
        className={`bg-input rounded-full px-4 py-2 font-semibold ${className}`}
        onClick={onClick}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        type={type}
        value={value}
        name={name}
        id={name}
        placeholder={placeholder}
        {...props}
      />
    </>
  );
}