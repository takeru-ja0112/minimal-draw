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
      <div className="lg:hidden border-b border-gray-200 bg-white h-16 px-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-white text-lg shadow-sm shadow-amber-500/30">M</div>
          <span className="font-bold text-gray-900 text-lg tracking-wider">MD Admin</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          className="text-gray-600 hover:text-gray-900 focus:outline-none p-1.5 rounded-lg hover:bg-amber-50 cursor-pointer"
        >
          {isOpen ? <TbX size={24} /> : <TbMenu2 size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 lg:z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 shadow-sm lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-6 flex items-center space-x-3 border-b border-gray-200">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-white text-lg shadow-sm shadow-amber-500/30">M</div>
          <span className="font-bold text-gray-900 text-lg tracking-wider">MD Admin</span>
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
                className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                  ? "bg-amber-500 text-white font-bold shadow-md shadow-amber-500/20"
                  : "text-gray-600 hover:bg-amber-50 hover:text-amber-600 font-medium"
                  }`}
              >
                <Icon size={20} className={isActive ? "text-white" : "text-gray-400 group-hover:text-amber-600"} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <Link
            href="/"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200 text-sm font-medium"
          >
            <TbArrowLeft size={20} />
            <span>アプリに戻る</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
