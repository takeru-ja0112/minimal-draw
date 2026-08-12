"use client";

import { usePathname } from "next/navigation";
import { motion } from "motion/react";

export default function BgObject() {
    const pathname = usePathname();
    if (pathname.startsWith('/admin')) return null;
    return (
        <>
                                {/* 正方形 */}
                    <motion.div
                        initial={{ rotate: 0 , top:-20}}
                        animate={{ rotate: 360 , top:20}}
                        transition={{ repeat: Infinity, duration: 60, ease: "linear", repeatType: "reverse" }}
                        className="fixed -left-10 blur-[2px] -z-50"
                    >
                        <div className="border border-yellow-500 w-60 h-60 border-7 rounded-lg" />
                    </motion.div>
                    {/* 正円 */}
                    <motion.div
                        initial={{ right: -100 }}
                        animate={{ right: -10 }}
                        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", repeatType: "reverse" }}
                        className="fixed top-80 blur-[2px] -z-50"
                    >
                        <div className="border border-yellow-500 w-70 h-70 border-7 rounded-full" />
                    </motion.div>
                    <motion.div
                        initial={{ rotate: 0 , left: -100 }}
                        animate={{ rotate: 45 , left: -10 }}
                        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", repeatType: "reverse" }}
                        className="fixed bottom-20 blur-[2px] -z-50"
                    >
                        <div className="border-b border-yellow-500 border-7 w-100" />
                    </motion.div>
        </>
    )

}