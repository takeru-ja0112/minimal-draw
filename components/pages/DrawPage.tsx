"use client";

import AccessUser from '@/components/organisms/AccessUser';
import DrawCanvas from '@/components/organisms/draw/DrawCanvas';
import DrawToolbar from '@/components/organisms/draw/DrawToolbar';
import RoomClosedModal from '@/components/organisms/draw/RoomClosedModal';
import SaveControl from '@/components/organisms/draw/SaveControl';
import ThemeChangedModal from '@/components/organisms/draw/ThemeChangedModal';
import ThemeHeader from '@/components/organisms/draw/ThemeHeader';
import ThemeModal from '@/components/organisms/draw/ThemeModal';
import ToolSelector from '@/components/organisms/draw/ToolSelector';
import useDraw from '@/hooks/DrawPage/handleDraw';
import { useBlocker } from "@/hooks/useBlocker";
import useIsMobile from '@/hooks/useIsMobile';
import useStatus from "@/hooks/useStatus";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TbArrowLeft } from 'react-icons/tb';

type DrawPageProps = {
  roomId: string;
  theme?: string;
  furigana?: string;
  mode?: 'demo';
};

export default function DrawPage({ roomId, theme, furigana, mode }: DrawPageProps) {
  const draw = useDraw(roomId);
  const [isThemeOpen, setIsThemeOpen] = useState(true);
  const [isBlocked, setIsBlocked] = useState(true);
  useBlocker(() => { }, isBlocked);
  const { status, currentTheme } = useStatus(roomId);
  const isMobile = useIsMobile();
  const [isChangeTheme, setIsChangeTheme] = useState(false);

  useEffect(() => {
    if (!currentTheme) return;

    if (currentTheme !== theme) {
      setIsChangeTheme(true);
    }
  }, [currentTheme]);

  const finalizeSave = () => {
    draw.handleSave();
    setIsBlocked(false);
    draw.saveToSessionStorage();
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
        {mode === 'demo' ? null :
          <>
            <AccessUser roomId={roomId} />
            <ThemeHeader theme={theme} furigana={furigana} isThemeOpen={isThemeOpen} />
          </>
        }

        <div className="max-w-xl mx-auto backdrop-blur bg-white/30 border border-white p-4 rounded-2xl shadow-md">
          {/*  描画エリア*/}
          <DrawToolbar onUndo={draw.handleUndo} onRedo={draw.handleRedo} onReset={draw.handleReset} />
          {/* Tool selection - カード風デザイン */}
          <ToolSelector tool={draw.tool} onChange={draw.setTool} />
          <DrawCanvas
            count={draw.count}
            lines={draw.lines}
            circles={draw.circles}
            rects={draw.rects}
            selectedShape={draw.selectedShape}
            w={draw.w}
            h={draw.h}
            isMobile={isMobile}
            onMouseDown={draw.handleMouseDown}
            onMouseMove={draw.handleMouseMove}
            onMouseUp={draw.handleMouseUp}
          />
        </div>
      </div>
      {mode === 'demo' ? null :
        <SaveControl
          isSaving={draw.isSaving}
          saveMessage={draw.saveMessage}
          hasShapes={draw.lines.length > 0 || draw.circles.length > 0 || draw.rects.length > 0}
          onConfirmSave={finalizeSave}
        />
      }
      {mode === 'demo' ? null :
        <ThemeModal
          isOpen={isThemeOpen}
          theme={theme}
          furigana={furigana}
          onClose={() => setIsThemeOpen(false)}
          onConfirm={() => { setIsThemeOpen(false); setIsChangeTheme(false); }}
        />
      }

      {status === 'ANSWERING' && (
        <RoomClosedModal roomId={roomId} saveMessage={draw.saveMessage} onLeave={finalizeSave} />
      )}

      {isChangeTheme && (
        <ThemeChangedModal onClose={() => setIsChangeTheme(false)} />
      )}
    </>
  );
}
