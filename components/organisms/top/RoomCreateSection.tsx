"use client";

import RoomCreateForm from "@/components/organisms/top/RoomCreateForm";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type RoomCreateSectionProps = {
  user: string;
  userId: string;
  setNameError: React.Dispatch<React.SetStateAction<string>>;
};

export default function RoomCreateSection({
  user,
  userId,
  setNameError,
}: RoomCreateSectionProps) {
  const [isRoomCreateOpen, setIsRoomCreateOpen] = useState(false);

  return (
    <>
      <motion.div
        layout
        className="my-6 overflow-hidden rounded-2xl border border-amber-300 bg-white shadow-sm"
        transition={{ layout: { duration: 0.25, ease: "easeOut" } }}
      >
        <motion.button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left font-bold text-gray-700"
          onClick={() => {
            if (!user) {
              setNameError("ルームを作成するにはユーザー名が必要です。");
              return;
            }
            setNameError("");
            setIsRoomCreateOpen((current) => !current);
          }}
          whileHover={{ backgroundColor: "#fef3c7" }}
          whileTap={{ scale: 0.99 }}
          aria-expanded={isRoomCreateOpen}
          aria-controls="room-create-fields"
        >
          <span>ルームを作成する</span>
          <motion.span
            animate={{ rotate: isRoomCreateOpen ? 45 : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="text-2xl leading-none text-amber-500"
            aria-hidden="true"
          >
            ＋
          </motion.span>
        </motion.button>

        <AnimatePresence initial={false}>
          {isRoomCreateOpen && (
            <motion.div
              id="room-create-fields"
              key="room-create-fields"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-amber-200 px-5 py-5">
                <RoomCreateForm
                  user={user}
                  userId={userId}
                  setNameError={setNameError}
                  onClose={() => setIsRoomCreateOpen(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
