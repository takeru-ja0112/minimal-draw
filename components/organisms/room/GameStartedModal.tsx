'use client';

import Button from '@/components/atoms/Button';
import Modal from '@/components/organisms/Modal';

export default function GameStartedModal({
  isOpen,
  isAnswerer,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  isAnswerer: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className="p-4 text-center">
        <h2 className="text-2xl font-bold text-gray-500 mb-4">ゲームが始まっています</h2>
        <p className="mb-4 font-bold">
          {isAnswerer ? 'あなたは回答者です' : 'あなたは描く人です'}
          <br />
          {isAnswerer ? '回答ページ' : '描画ページ'}に移動しますか？
        </p>
        <Button value="あとで" onClick={onCancel} />
        <Button value="移動する" onClick={onConfirm} className="ml-4" />
      </div>
    </Modal>
  );
}
