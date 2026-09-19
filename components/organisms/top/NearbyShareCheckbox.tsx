'use client';

type NearbyShareCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export default function NearbyShareCheckbox({ checked, onChange, disabled }: NearbyShareCheckboxProps) {
  return (
    <div className="mt-4">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="size-5 accent-amber-500"
        />
        近くの人が見つけられるようにする
      </label>
      <p className="mt-1 text-xs text-gray-400">
        作成時の現在地(約150m四方の範囲)を保存し、近くのルーム検索に表示します。位置情報の許可が必要です。
      </p>
    </div>
  );
}
