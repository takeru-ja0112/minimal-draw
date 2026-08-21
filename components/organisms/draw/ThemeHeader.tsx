"use client";

import { TbSearch } from 'react-icons/tb';

type Props = {
  theme?: string;
  furigana?: string;
  isThemeOpen: boolean;
};

export default function ThemeHeader({ theme, furigana, isThemeOpen }: Props) {
  const handleSearchTheme = () => {
    if (!theme) return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(theme)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-lg mx-auto text-center relative">
      {/* お題 */}
      <label className="block mb-1 font-semibold text-gray-600">
        お題
      </label>
      <div className="mb-6 h-21">
        <h2 className="text-md font-bold text-gray-500">{isThemeOpen ? '' : furigana}</h2>
        <div className="flex items-center justify-center mb-2">
          <h1 className="text-xl font-bold">{isThemeOpen ? '' : theme}</h1>
        </div>
        {!isThemeOpen && theme && (
          <button
            type="button"
            onClick={handleSearchTheme}
            className="text-xs font-semibold text-gray-600 bg-white/60 border border-gray-300 rounded-full px-3 py-1 hover:bg-gray-100 transition flex items-center gap-1 mx-auto"
          >
            <TbSearch />これを調べる
          </button>
        )}
      </div>
    </div>
  );
}
