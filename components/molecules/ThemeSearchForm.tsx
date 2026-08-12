"use client";

import { useState, useEffect } from "react";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";

export default function ThemeSearchForm({
  themeList,
  onSearch,
  loading,
}: {
  themeList: string[];
  onSearch: (theme: string, minCount?: number) => void;
  loading: boolean;
}) {
  const [theme, setTheme] = useState(themeList[0] ?? "");
  const [minCount, setMinCount] = useState("");

  useEffect(() => {
    if (themeList.length > 0 && !themeList.includes(theme)) {
      setTheme(themeList[0]);
    }
  }, [themeList, theme]);

  return (
    <form
      className="flex flex-wrap items-end gap-3 px-6 mb-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!theme) return;
        onSearch(theme, minCount ? Number(minCount) : undefined);
      }}
    >
      <label className="flex flex-col text-sm">
        テーマ
        <Select
          className="border rounded px-2 py-1 text-gray-700 bg-white"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        >
          {themeList.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col text-sm">
        画数（この画数以上・任意）
        <Input
          type="number"
          className="border rounded px-2 py-1 w-28 text-gray-700 bg-white"
          value={minCount}
          onChange={(e) => setMinCount(e.target.value)}
        />
      </label>
      <Button
        type="submit"
        disabled={loading || !theme}
        className="bg-yellow-500 text-white border-none rounded-xl hover:bg-yellow-600 transition-colors"
        value={loading ? "検索中..." : "検索"}
      />
    </form>
  );
}
