"use client";

import Modal from '@/components/organisms/Modal';

type Props = {
  onClose: () => void;
};

export default function ThemeChangedModal({ onClose }: Props) {
  return (
    <Modal isOpen={true} onClose={onClose} className="text-center">
      <h2>お題が変更されました</h2>
      <p className="font-bold text-xl text-gray-500">画面を更新してください</p>
    </Modal>
  );
}
