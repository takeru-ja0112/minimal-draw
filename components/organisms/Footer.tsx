"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconContext } from "react-icons";
import { MdOutlineMuseum } from "react-icons/md";
import { TbHome, TbPencil, TbUsersGroup } from "react-icons/tb";

export default function Footer() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  if (!isMobile) return null;

  return (
    <footer className="h-14 fixed bottom-2 border border-2 border-white rounded-full w-[75%] min-w-[300px] left-1/2 -translate-x-1/2 z-40 shadow-md bg-white/50 backdrop-blur-xs px-7">
      <nav className="h-full flex justify-around items-center">
        <IconContext.Provider value={{ size: "1.5em" }}>
          <Link href="/" aria-label="Home" className="hover:text-gray-600 transition-colors">
            <TbHome />
          </Link>
          <Link href="/lobby" aria-label="Lobby" className="hover:text-gray-600 transition-colors">
            <TbUsersGroup />
          </Link>
          <Link href="/drawing" aria-label="Drawing" className="hover:text-gray-600 transition-colors">
            <TbPencil />
          </Link>
          <Link href="/museum" aria-label="Museum" className="hover:text-gray-600 transition-colors">
            <MdOutlineMuseum />
          </Link>
        </IconContext.Provider>
      </nav>
    </footer>
  );
}
