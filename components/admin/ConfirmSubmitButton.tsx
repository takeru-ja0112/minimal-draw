"use client";

import { useFormStatus } from "react-dom";

interface ConfirmSubmitButtonProps {
  message?: string;
  buttonText?: string;
  className?: string;
  color?: string;
}

export default function ConfirmSubmitButton({
  message = "本当に削除しますか？",
  buttonText = "削除",
  className = "text-white font-bold py-1 px-3 rounded-lg text-xs transition-colors duration-200 shadow-sm cursor-pointer",
  color = "bg-gray-500 hover:bg-gray-600",
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (pending) {
      e.preventDefault();
      return;
    }
    if (!window.confirm(message)) {
      e.preventDefault();
    }
  };

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={handleClick}
      className={`${color} ${className} ${pending ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {pending ? "処理中..." : buttonText}
    </button>
  );
}
