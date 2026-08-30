"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface DrawingFilterControlsProps {
  currentFilter: string;
  currentSort: string;
}

export default function DrawingFilterControls({
  currentFilter,
  currentSort,
}: DrawingFilterControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParams = (newFilter?: string, newSort?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    const filterVal = newFilter !== undefined ? newFilter : currentFilter;
    const sortVal = newSort !== undefined ? newSort : currentSort;

    if (filterVal && filterVal !== "active") {
      params.set("filter", filterVal);
    } else {
      params.delete("filter");
    }

    if (sortVal && sortVal !== "desc") {
      params.set("sort", sortVal);
    } else {
      params.delete("sort");
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const filterOptions = [
    { value: "active", label: "全件(削除を除く)" },
    { value: "all", label: "全件表示" },
    { value: "deleted", label: "削除済み" },
  ];

  const sortOptions = [
    { value: "desc", label: "作成順（新しい順）" },
    { value: "asc", label: "作成順（古い順）" },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-6">
      {/* Filter Options */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">
          フィルター:
        </span>
        {filterOptions.map((opt) => {
          const isActive = currentFilter === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateParams(opt.value, undefined)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-amber-500 text-white font-bold shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <label htmlFor="sort-select" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          表示順:
        </label>
        <select
          id="sort-select"
          value={currentSort}
          onChange={(e) => updateParams(undefined, e.target.value)}
          className="bg-white border border-gray-300 text-gray-800 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium cursor-pointer"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}