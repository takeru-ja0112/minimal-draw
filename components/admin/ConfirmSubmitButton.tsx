"use client";

import { useFormStatus } from "react-dom";

interface ConfirmSubmitButtonProps {
  message?: string;
  buttonText?: string;
  className?: string;
}

export default function ConfirmSubmitButton({
  message = "本当に削除しますか？",
  buttonText = "削除",
  className = "bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors duration-200"
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
      className={`${className} ${pending ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {pending ? "処理中..." : buttonText}
    </button>
  );
}
