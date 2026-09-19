'use client';

import { ROOM_PASSWORD_LENGTH } from '@/lib/roomPassword';
import { useLayoutEffect, useRef } from 'react';

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
};

const DIGITS_ONLY = /\D/g;

/**
 * 4桁の数字を1桁ずつ入力する枠。
 * 値は常に先頭から連続した数字(欠けなし)として保つため、入力できる枠は「入力済みの枠」か「次の空き枠」のみ。
 */
export default function PasswordInput({ value, onChange, disabled, hasError, autoFocus }: PasswordInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 連続入力ではフォーカス移動が再レンダーより先に起こるため、最新値は ref で同期的に持つ
  const valueRef = useRef(value);
  useLayoutEffect(() => {
    valueRef.current = value;
  }, [value]);

  const update = (next: string) => {
    valueRef.current = next;
    onChange(next);
  };

  const focusAt = (index: number) => {
    inputRefs.current[Math.min(Math.max(index, 0), ROOM_PASSWORD_LENGTH - 1)]?.focus();
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(DIGITS_ONLY, '').slice(-1);
    if (!digit) return;

    // 空き枠を飛ばした入力でも欠けが生じないよう、次の空き枠までに丸める
    const current = valueRef.current;
    const at = Math.min(index, current.length);
    update((current.slice(0, at) + digit + current.slice(at + 1)).slice(0, ROOM_PASSWORD_LENGTH));
    focusAt(at + 1);
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    const current = valueRef.current;

    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      const target = current[index] !== undefined ? index : index - 1;
      if (target < 0) return;

      update(current.slice(0, target) + current.slice(target + 1));
      focusAt(target);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusAt(Math.min(index + 1, current.length));
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const digits = event.clipboardData.getData('text').replace(DIGITS_ONLY, '').slice(0, ROOM_PASSWORD_LENGTH);
    if (!digits) return;

    update(digits);
    focusAt(digits.length);
  };

  return (
    <div role="group" aria-label="パスワード(4桁の数字)" className="flex gap-2">
      {Array.from({ length: ROOM_PASSWORD_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label={`パスワード${index + 1}桁目`}
          aria-invalid={hasError || undefined}
          value={value[index] ?? ''}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => {
            // 空き枠を飛ばして入力されないよう、入力可能な枠へ寄せる
            if (index > valueRef.current.length) focusAt(valueRef.current.length);
            else event.target.select();
          }}
          className={`h-14 w-12 rounded-xl bg-input text-center text-2xl font-semibold ${
            hasError ? 'border-2 border-red-500' : ''
          }`}
        />
      ))}
    </div>
  );
}
