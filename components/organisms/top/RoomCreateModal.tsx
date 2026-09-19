"use client";

import Modal from "@/components/organisms/Modal";
import RoomCreateForm from "@/components/organisms/top/RoomCreateForm";

export default function RoomCreateModal({
  isOpen,
  onClose,
  user,
  userId,
  setNameError,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: string;
  userId: string;
  setNameError: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full !mx-1">
      <h2 className="text-xl font-semibold mb-4 text-gray-700 text-center">ルームをつくる</h2>
      <RoomCreateForm
        user={user}
        userId={userId}
        setNameError={setNameError}
        onClose={onClose}
      />
    </Modal>
  );
}
