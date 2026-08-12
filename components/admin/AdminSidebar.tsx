"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  TbLayoutDashboard,
  TbUsers,
  TbDoor,
  TbPalette,
  TbHistory,
  TbTags,
  TbArrowLeft,
  TbMenu2,
  TbX
} from "react-icons/tb";

const navItems = [
  { href: "/admin", label: "ダッシュボード", icon: TbLayoutDashboard },
  { href: "/admin/users", label: "ユーザー管理", icon: TbUsers },
  { href: "/admin/rooms", label: "ルーム管理", icon: TbDoor },
  { href: "/admin/drawings", label: "イラスト管理", icon: TbPalette },
  { href: "/admin/history-drawings", label: "履歴管理", icon: TbHistory },
  { href: "/admin/themes", label: "お題管理", icon: TbTags },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 h-16 px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-650 flex items-center justify-center font-bold text-white text-lg">M</div>
          <span className="font-bold text-white text-lg tracking-wider">MD Admin</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          className="text-slate-400 hover:text-white focus:outline-none p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          {isOpen ? <TbX size={24} /> : <TbMenu2 size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 lg:z-30 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-6 flex items-center space-x-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-lg">M</div>
          <span className="font-bold text-white text-lg tracking-wider">MD Admin</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/10"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Icon size={20} className={isActive ? "text-white" : "text-slate-400"} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <Link
            href="/"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-all duration-200 text-sm"
          >
            <TbArrowLeft size={20} />
            <span>アプリに戻る</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
