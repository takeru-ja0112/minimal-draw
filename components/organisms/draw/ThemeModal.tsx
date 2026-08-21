"use client";

import Button from '@/components/atoms/Button';
import Modal from '@/components/organisms/Modal';

type Props = {
  isOpen: boolean;
  theme?: string;
  furigana?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ThemeModal({ isOpen, theme, furigana, onClose, onConfirm }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="text-center">
      <h2>お題</h2>
      <p className="font-bold text-xl text-gray-500">{furigana}</p>
      <p className="font-bold text-2xl mb-2">{theme}</p>
      <p className="font-semibold text-gray-500 text-xl my-2">できるだけ少ない数で描こう！</p>
      <Button
        onClick={onConfirm}
        className="mt-2"
        value="確認しました"
      />
    </Modal>
  );
}
