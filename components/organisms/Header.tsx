"use client"

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import HamburgerMenu from "../molecules/HamburgerMenu";
import AccessMenu from "./AccessMenu";

export default function Header() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      <header
        className={`h-14 fixed top-2 left-0 border border-2 border-white rounded-full w-[75%] min-w-[300px] left-1/2 -translate-x-1/2 z-40 transition-transform duration-500 shadow-md bg-white/50 backdrop-blur-xs px-7`}
      >
        <nav className=" h-full flex items-center justify-between">
          {/* ハンバーガーメニューの作成 */}
          <HamburgerMenu setIsOpen={setIsOpen} />
        </nav>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/">
            <Image src="/minimalDrawIcon.svg" alt="Logo" width={40} height={40} loading="eager" />
          </Link>
        </div>
      </header>
      <AccessMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}