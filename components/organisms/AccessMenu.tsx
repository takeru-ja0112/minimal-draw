"use client";

import historyLocalRoom from "@/lib/hitoryLocalRoom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconContext } from "react-icons";
import { MdOutlineMuseum } from "react-icons/md";
import { TbArrowBackUp, TbHome, TbPencil, TbUsersGroup } from "react-icons/tb";

export default function AccessMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { getLocalRoom } = historyLocalRoom();
  const router = useRouter();

  const handleGoToLastRoom = () => {
    if (typeof window === 'undefined') return;

    const latestRoom = getLocalRoom();
    if (latestRoom) {
      router.push(`/room/${latestRoom}`);
      onClose();
    }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-white/50 z-40 ${isOpen ? "block" : "hidden"}`} onClick={onClose}></div>
      <div className={`w-70 bg-white fixed top-3 h-fit shadow-lg z-100 p-6 block ${isOpen ? "left-0 opacity-100" : "-left-full opacity-0"} transition-left duration-400 rounded-r-xl`}>
        <div className="mb-8">
          <Image src="/minimalDrawIcon.svg" alt="Logo" width={40} height={40} />
        </div>
        <hr className="border-gray-300"></hr>
        <ol>
          <IconContext.Provider value={{ size: "1.5em", className: "inline-block mr-2" }}>
            <Link href="/" onClick={onClose}><li className="my-3 flex px-2 py-1 hover:bg-gray-200 transition duration-200 rounded-full"><TbHome />ホーム</li></Link>
            {/* <Link href="/lobby" onClick={onClose}><li className="my-3 flex px-3 py-1 hover:bg-gray-200 transition duration-200 rounded-full"><TbUsersGroup />ロビー</li></Link> */}
            <Link href="/drawing" onClick={onClose}><li className="my-3 flex px-3 py-1 hover:bg-gray-200 transition duration-200 rounded-full"><TbPencil />試し書き</li></Link>
            <Link href="/museum" onClick={onClose}><li className="my-3 flex px-3 py-1 hover:bg-gray-200 transition duration-200 rounded-full"><MdOutlineMuseum />過去のイラスト</li></Link>
            {/* <Link href="/mobile" onClick={onClose}><li className="my-3 flex px-3 py-1 hover:bg-gray-200 transition duration-200 rounded-full"><TbSettings />設定</li></Link> */}
            {getLocalRoom() && (
              <>
                <hr className="border-gray-300" />
                <button onClick={handleGoToLastRoom} className="w-full text-left">
                  <li className="my-3 flex px-3 py-1 hover:bg-gray-200 transition duration-200 rounded-full">
                    <TbArrowBackUp />最後に入ったルーム
                  </li>
                </button>
              </>
            )}
          </IconContext.Provider>
        </ol>
      </div>
    </>
  )
}