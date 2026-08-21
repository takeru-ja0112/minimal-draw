"use client";

import Button from '@/components/atoms/Button';
import Modal from '@/components/organisms/Modal';

type Props = {
  roomId: string;
  saveMessage: string;
  onLeave: () => void;
};

export default function RoomClosedModal({ roomId, saveMessage, onLeave }: Props) {
  const handleLeave = () => {
    onLeave();
    // エラー発生時の応急遷移
    if (saveMessage) {
      window.location.href = `/room/${roomId}/answer`;
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleLeave}
    >
      <h1 className="text-xl font-semibold mb-4">回答者が締め切りました</h1>
      <p>回答ページに移動します</p>
      <Button
        onClick={handleLeave}
        className="mt-4"
        value="OK"
      />
    </Modal>
  );
}
