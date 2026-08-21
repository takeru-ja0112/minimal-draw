"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconContext } from "react-icons";
import { MdOutlineMuseum } from "react-icons/md";
import { TbHome, TbPencil, TbUsersGroup } from "react-icons/tb";
import { motion } from 'motion/react';
import { CurrentRootingCheck } from "@/app/lib/RootingCheck";
import useIsMobile from "@/hooks/useIsMobile";


export default function Footer() {
  const isMobile = useIsMobile();
  const [isBrowser, setIsBrowser] = useState(false);
  const pathname = usePathname();

  const isCheckPage = CurrentRootingCheck();

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as any).standalone);
    setIsBrowser(!isStandalone);
  }, []);

  if (pathname.startsWith('/admin')) return null;
  if (isBrowser || !isMobile) return null;

  const navItems = [
    { href: '/', icon: <TbHome />, label: 'Home' },
    // { href: '/lobby', icon: <TbUsersGroup />, label: 'Lobby' },
    { href: '/drawing', icon: <TbPencil />, label: 'Drawing' },
    { href: '/museum', icon: <MdOutlineMuseum />, label: 'Museum' },
  ];

  return (
    <>
      {
        !isCheckPage && (
          <footer className="h-17 fixed bottom-4 border border-2 border-white rounded-full w-[85%] min-w-[300px] left-1/2 -translate-x-1/2 z-40 shadow-md bg-white/50 backdrop-blur-xs px-2 py-1">
            <nav className="h-full flex justify-around items-center">
              <IconContext.Provider value={{ size: "1.8em" }}>
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-label={item.label}
                      className="relative flex items-center justify-center w-20 h-11"
                    >
                      {isActive && (
                        <motion.span
                          layoutId="footerHighlight"
                          className="absolute inset-0 bg-amber-400 rounded-full z-0"
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                        />
                      )}
                      <div className={`z-10 transition-colors text-gray-800 hover:text-gray-600`}>
                        {item.icon}
                      </div>
                    </Link>
                  );
                })}
              </IconContext.Provider>
            </nav>
          </footer>
        )
      }
    </>
  );
}
