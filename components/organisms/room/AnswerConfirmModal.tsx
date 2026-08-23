'use client';

import Button from '@/components/atoms/Button';
import Modal from '@/components/organisms/Modal';

export default function AnswerConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4 text-center">
        <h2 className="text-2xl font-bold text-gray-500 mb-4">確認</h2>
        <p className="mb-4 font-bold">
          まだAnswerが決まっていません<br />
          あなたがAnswerになりますか？
        </p>
        <Button value="いいえ" onClick={onClose} />
        <Button value="はい" onClick={onConfirm} className="ml-4" />
      </div>
    </Modal>
  );
}
