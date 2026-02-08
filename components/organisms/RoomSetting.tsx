import { motion } from 'motion/react';
// RoomSettingTypeのimportは不要になるので削除
import { useState } from 'react';

type RoomSettingProps<T> = {
  className?: string;
  setRoomData: React.Dispatch<React.SetStateAction<T>>;
};

export default function RoomSetting<T>({
  className,
  setRoomData,
}: RoomSettingProps<T>) {
  const levels = ['easy', 'normal', 'hard'];
  const genres = ['ランダム', '動物', '料理', '雑貨'];
  const [selectedLevel, setSelectedLevel] = useState<string>('normal');

  return (
    <div className={className}>
      {/* 難易度タブ */}
      <p className="font-semibold mb-2 text-gray-700">難易度</p>
      <div className="grid grid-cols-3 gap-2 mb-2 border border-2 border-yellow-400/70 rounded-full p-2">
        {levels.map((level) => (
          <div key={level} className="relative flex justify-center">
            {selectedLevel === level && (
              <motion.span
                layoutId='levelHighlight'
                className='w-full absolute z-0 w-12 h-9 bg-amber-400 rounded-3xl -top-0 left-1/2 -translate-x-1/2 z-0'
              >
              </motion.span>
            )}
            <motion.label
              key={level}
              className="cursor-pointer z-10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`w-full px-2 py-2 font-black text-sm rounded-full text-center whitespace-nowrap text-ellipsis overflow-hidden z-10`}>
                {level === 'easy' && 'かんたん'}
                {level === 'normal' && 'ふつう'}
                {level === 'hard' && 'むずかしい'}
              </div>
              <motion.input
                type='radio'
                name='level'
                onChange={() => {
                  setSelectedLevel(level);
                  setRoomData(prev => ({ ...prev, level: level }));
                }}
                checked={selectedLevel === level}
                key={level}
                className="hidden"
              />
            </motion.label>
          </div>

        ))}
      </div>
      <p className='text-sm text-yellow-700 font-bold h-10'>
        {selectedLevel === 'easy' && 'いちご、風船、太陽などのかんたんなお題が出るよ！'}
        {selectedLevel === 'normal' && 'ケーキ、フラミンゴ、トロフィーなどのお題が出るよ！'}
        {selectedLevel === 'hard' && 'とにかくむずかしいお題が出るよ！'}
      </p>

      {/* ジャンルセレクタ */}
      <p className="font-semibold mt-6 mb-2 text-gray-700">ジャンル</p>
      <div className="">
        <motion.select
          name="genre"
          id="genre"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onChange={(e) => setRoomData(prev => ({ ...prev, genre: e.target.value }))}
          className="w-full col-span-3 p-3 bg-yellow-400 font-bold rounded-full hover:bg-amber-500 transition-colors cursor-pointer"
        >
          {genres.map((genre) => (
            <motion.option
              key={genre}
              value={genre}
              className='text-center'
            >
              {genre}
            </motion.option>
          ))}
        </motion.select>
      </div>
    </div>
  );
}