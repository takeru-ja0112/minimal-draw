"use client";

import Button from '@/components/atoms/Button';
import AccessUser from '@/components/organisms/AccessUser';
import Modal from "@/components/organisms/Modal";
import useDraw from '@/hooks/DrawPage/handleDraw';
import { useBlocker } from "@/hooks/useBlocker";
import useStatus from "@/hooks/useStatus";
import { KonvaEventObject } from 'konva/lib/Node';
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IconContext } from "react-icons";
import { TbArrowBackUp, TbArrowForwardUp, TbArrowLeft, TbArrowsMove, TbEraser, TbSearch, TbTrash } from 'react-icons/tb';
import { Circle, Rect as KonvaRect, Layer, Line, Stage } from "react-konva";

type DrawPageProps = {
  roomId: string;
  theme?: string;
  furigana?: string;
  mode?: 'demo';
};

export default function DrawPage({ roomId, theme, furigana, mode }: DrawPageProps) {
  const {
    count,
    isSaving,
    saveMessage,
    lines,
    circles,
    rects,
    selectedShape,
    tool,
    setTool,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleUndo,
    handleRedo,
    handleReset,
    handleSave,
    saveToSessionStorage,
    w,
    h,
  } = useDraw(roomId);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(true);
  const [isBlocked, setIsBlocked] = useState(true);
  useBlocker(() => { }, isBlocked);
  const { status, currentTheme } = useStatus(roomId);
  const [isMobile, setIsMobile] = useState(false);
  const [isChangeTheme, setIsChangeTheme] = useState(false);


  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, []);


  useEffect(() => {
    if (!currentTheme) return;

    if (currentTheme !== theme) {
      setIsChangeTheme(true);
    }
  }, [currentTheme]);

  const handleSearchTheme = () => {
    if (!theme) return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(theme)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* <BgObject /> */}
      <div className="px-4 pt-5 pb-16">
        <Link href={
          mode === 'demo' ? `/` :
            `/room/${roomId}`
        } className='z-50 fixed top-13 left-2 text-gray-500 hover:text-gray-700 transition duration-300 p-2 rounded-full'>
          <TbArrowLeft size='2em' />
        </Link>
        {mode === 'demo' ? null : <AccessUser roomId={roomId} />}
        <div className="max-w-lg mx-auto text-center relative">
          {/* お題 */}
          <label className="block mb-1 font-semibold text-gray-600">
            お題
          </label>
          <h2 className="text-md font-bold text-gray-500">{isThemeOpen ? '' : furigana}</h2>
          <div className="flex items-center justify-center mb-2">
            <h1 className="text-xl font-bold">{isThemeOpen ? '' : theme}</h1>
          </div>
          {!isThemeOpen && theme && (
            <button
              type="button"
              onClick={handleSearchTheme}
              className="text-xs font-semibold text-gray-600 bg-white/60 border border-gray-300 rounded-full px-3 py-1 hover:bg-gray-100 transition mb-4 flex items-center gap-1 mx-auto"
            >
              <TbSearch />これを調べる
            </button>
          )}

          <div className="backdrop-blur bg-white/30 border border-white p-4 rounded-2xl shadow-md">
            {/*  描画エリア*/}
            <div className="mb-4 flex gap-2 justify-center items-center">
              <IconContext.Provider value={{ size: '1.5em' }}>
                <button onClick={handleUndo} className="w-fit h-10 border bg-white/50 border-gray-300 rounded-full p-2 px-4 flex justify-center items-center"  ><TbArrowBackUp /></button>
                <button onClick={handleRedo} className="w-fit h-10 border bg-white/50 border-gray-300 rounded-full p-2 px-4 flex justify-center items-center" ><TbArrowForwardUp /></button>
                <button onClick={handleReset} className="w-fit h-10 border bg-white/50 border-gray-300 rounded-full p-2 px-4 flex justify-center items-center font-semibold text-sm" ><TbTrash />リセット</button>
              </IconContext.Provider>
            </div>
            {/* Tool selection - カード風デザイン */}
            <div className="mt-4 flex gap-4 justify-center relative">
              {[
                {
                  key: 'line', label: '直線', icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="2" /></svg>
                  )
                },
                {
                  key: 'circle', label: '円', icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" /></svg>
                  )
                },
                {
                  key: 'rect', label: '長方形', icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" /></svg>
                  )
                },
                { key: 'eraser', label: '消しゴム', icon: <TbEraser /> },
                { key: 'move', label: '移動', icon: <TbArrowsMove /> },
              ].map(({ key, label, icon }) => (
                <div key={key} className="flex flex-col items-center gap-1 w-full relative">
                  {tool === key && (
                    <motion.span
                      layoutId="toolHighlight"
                      className="w-12 h-12 bg-yellow-400 absolute rounded-xl top-5 left-1/2 -translate-x-1/2 z-0"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className={`font-semibold text-xs ${tool === key ? 'text-gray-900' : 'text-gray-400'} z-5`}>{label}</span>
                  <motion.label
                    key={key}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full h-13 flex justify-center items-center text-md py-2 cursor-pointer z-5`}
                  >
                    <input
                      type="radio"
                      name="tool"
                      value={key}
                      checked={tool === key}
                      onChange={() => setTool(key as typeof tool)}
                      className="hidden"
                    />
                    <span className="mb-1 text-2xl">{icon}</span>
                  </motion.label>
                </div>
              ))}
            </div>
            <div className="relative w-[300px] h-[300px] mx-auto">
              <div className="w-fit h-fit p-1 px-4 flex items-center justify-center absolute -top-5 -left-7 z-5 bg-yellow-400 border border-white border-2 rounded-full">
                <motion.h1
                  key={count}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold "
                >
                  {count}
                </motion.h1>
              </div>
              <div className={`relative mx-auto mt-4 border bg-white border-4 border-gray-400 w-[300px] h-[300px] touch-none rounded overflow-hidden relative`}>
                <Stage
                  width={w}
                  height={h}
                  {...isMobile ? {
                    onTouchStart: (e: KonvaEventObject<TouchEvent>) => handleMouseDown(e),
                    onTouchMove: (e: KonvaEventObject<TouchEvent>) => handleMouseMove(e),
                    onTouchEnd: (e: KonvaEventObject<TouchEvent>) => handleMouseUp(e),
                  } : {
                    onMouseDown: handleMouseDown,
                    onMouseMove: handleMouseMove,
                    onMouseUp: handleMouseUp,
                  }}
                >
                  <Layer
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                  >
                    {lines.map((line, i) => (
                      <Line
                        key={i}
                        points={line}
                        stroke={selectedShape?.type === 'line' && selectedShape.index === i ? '#e9c10e' : 'black'}
                        strokeWidth={selectedShape?.type === 'line' && selectedShape.index === i ? 4 : 3}
                      />
                    ))}
                    {circles.map((circle, i) => (
                      <Circle
                        key={i}
                        x={circle.x}
                        y={circle.y}
                        radius={circle.radius}
                        stroke={selectedShape?.type === 'circle' && selectedShape.index === i ? '#e9c10e' : 'black'}
                        strokeWidth={selectedShape?.type === 'circle' && selectedShape.index === i ? 4 : 3}
                      />
                    ))}
                    {rects.map((rect, i) => (
                      <KonvaRect
                        key={i}
                        x={rect.x}
                        y={rect.y}
                        width={rect.width}
                        height={rect.height}
                        stroke={selectedShape?.type === 'rect' && selectedShape.index === i ? '#e9c10e' : 'black'}
                        strokeWidth={selectedShape?.type === 'rect' && selectedShape.index === i ? 4 : 3}
                        rotation={rect.rotation}
                      />
                    ))}
                  </Layer>
                </Stage>
              </div>
            </div>
          </div>
        </div>
        {mode === 'demo' ? null :
          <motion.div
            className="px-8 w-80 bottom-5 fixed left-1/2 transform -translate-x-1/2"
          >
            <Button
              onClick={() => setIsSaveOpen(!isSaveOpen)}
              disabled={isSaving || (lines.length === 0 && circles.length === 0 && rects.length === 0)}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
              value={isSaving ? '保存中...' : '保存'}
            />
          </motion.div>
        }
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
                  handleSave();
                  setIsSaveOpen(false);
                  setIsBlocked(false);
                  saveToSessionStorage();
                }}
                value={isSaving ? '保存中...' : '保存する'}
                disabled={isSaving}
              />
            </div>
          </Modal>
        )}
        {mode === 'demo' ? null :
          <Modal isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} className='text-center'>
            <h2 >お題</h2>
            <p className="font-bold text-xl text-gray-500">{furigana}</p>
            <p className="font-bold text-2xl mb-2">{theme}</p>
            <p className='font-semibold text-gray-500 text-xl my-2'>できるだけ少ない数で描こう！</p>
            <Button
              onClick={() => { setIsThemeOpen(false); setIsChangeTheme(false); }}
              className="mt-2"
              value="確認しました"
            />
          </Modal>
        }

        {status === 'ANSWERING' && (
          <Modal
            isOpen={true}
            onClose={() => {
              handleSave();
              setIsBlocked(false);
              saveToSessionStorage();
              // エラー発生時の応急遷移
              if (saveMessage) {
                window.location.href = `/room/${roomId}/answer`;
              }

            }}
          >
            <h1 className="text-xl font-semibold mb-4">回答者が締め切りました</h1>
            <p>回答ページに移動します</p>
            <Button
              onClick={() => {
                handleSave();
                setIsBlocked(false);
                saveToSessionStorage();
                // エラー発生時の応急遷移
                if (saveMessage) {
                  window.location.href = `/room/${roomId}/answer`;
                }
              }}
              className="mt-4"
              value="OK"
            />
          </Modal>
        )}

        {isChangeTheme && (
          <Modal isOpen={true} onClose={() => setIsChangeTheme(false)} className='text-center'>
            <h2 >お題が変更されました</h2>
            <p className="font-bold text-xl text-gray-500">画面を更新してください</p>
          </Modal>
        )}
      </div>
    </>
  );
}