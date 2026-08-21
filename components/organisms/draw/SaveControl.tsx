"use client";

import Button from '@/components/atoms/Button';
import Modal from '@/components/organisms/Modal';
import { motion } from 'motion/react';
import { useState } from 'react';

type Props = {
  isSaving: boolean;
  saveMessage: string;
  hasShapes: boolean;
  onConfirmSave: () => void;
};

export default function SaveControl({ isSaving, saveMessage, hasShapes, onConfirmSave }: Props) {
  const [isSaveOpen, setIsSaveOpen] = useState(false);

  return (
    <>
      <motion.div
        className="px-8 w-80 bottom-5 fixed left-1/2 transform -translate-x-1/2"
      >
        <Button
          onClick={() => setIsSaveOpen(!isSaveOpen)}
          disabled={isSaving || !hasShapes}
          className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
          value={isSaving ? '保存中...' : '保存'}
        />
      </motion.div>
      {saveMessage && (
        <div className="mb-4 p-2 bg-gray-100 rounded">
          {saveMessage}
        </div>
      )}
      {isSaveOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsSaveOpen(false)}
        >
          <h2 className="text-xl font-semibold mb-4">保存しますか？</h2>
          <p>保存が完了次第、自動で回答ページに移動します。</p>
          <div className="flex justify-end gap-4">
            <Button
              onClick={() => setIsSaveOpen(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg mr-2"
              value="キャンセル"
            />
            <Button
              onClick={() => {
                onConfirmSave();
                setIsSaveOpen(false);
              }}
              value={isSaving ? '保存中...' : '保存する'}
              disabled={isSaving}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
