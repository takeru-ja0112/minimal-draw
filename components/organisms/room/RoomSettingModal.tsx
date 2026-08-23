'use client';

import Button from '@/components/atoms/Button';
import Modal from '@/components/organisms/Modal';
import RoomSetting from '@/components/organisms/RoomSetting';
import type { RoomSettingType, Theme } from '@/type/roomType';
import { motion } from 'motion/react';

export default function RoomSettingModal({
  isOpen,
  onClose,
  setRoomSetting,
  threeThemes,
  onSearchTheme,
  onSelectTheme,
}: {
  isOpen: boolean;
  onClose: () => void;
  setRoomSetting: React.Dispatch<React.SetStateAction<RoomSettingType>>;
  threeThemes: Theme[];
  onSearchTheme: () => void;
  onSelectTheme: (themeId: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className='w-full'>
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4 text-center">ルーム設定</h2>
        {threeThemes.length > 0 && (
          <div className='mt-6 rounded-lg'>
            <h3 className='text-lg font-bold mb-2 text-gray-700'>お題候補</h3>
            <p className='text-sm text-gray-500 mb-2'>以下の候補からお題を選んでください</p>
            {threeThemes.map((theme) => (
              <motion.button
                initial={{ x: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.1 * threeThemes.findIndex(t => t.id === theme.id) }}
                animate={{ x: 0, opacity: 1 }}
                key={theme.id}
                className='w-full bg-amber-400 rounded-full font-bold p-2 pl-4 mb-2 flex items-center justify-center gap-2'
                onClick={() => onSelectTheme(theme.id)}
              >
                <span>{theme.theme}</span>
              </motion.button>
            ))}
          </div>
        )}
        <RoomSetting setRoomData={setRoomSetting} />
        <div className='grid grid-cols-2 gap-3 mt-2'>
          <Button
            onClick={onClose}
            value="閉じる"
            className="w-full mt-4"
          />
          <Button
            onClick={onSearchTheme}
            value="お題を選ぶ"
            className="w-full mt-4"
          />
        </div>
      </div>
    </Modal>
  );
}
