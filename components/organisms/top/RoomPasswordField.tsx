'use client';

import PasswordInput from '@/components/molecules/PasswordInput';

type RoomPasswordFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error: string;
  disabled?: boolean;
};

export default function RoomPasswordField({ value, onChange, error, disabled }: RoomPasswordFieldProps) {
  return (
    <div className="mt-4">
      <p className="mb-1 text-sm font-semibold text-gray-700">パスワード(任意)</p>
      <p className="mb-2 text-xs text-gray-400">設定する場合は4桁の数字を入力してください。空のままなら誰でも入室できます。</p>
      <PasswordInput value={value} onChange={onChange} disabled={disabled} hasError={!!error} />
      {error && (
        <p className="mt-2 text-sm font-semibold text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
