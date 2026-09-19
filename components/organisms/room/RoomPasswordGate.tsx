'use client';

import { verifyRoomPassword } from '@/app/room/[id]/access-action';
import Loading from '@/components/atoms/Loading';
import { showToast } from '@/components/common/toast';
import RoomPasswordDialog from '@/components/organisms/room/RoomPasswordDialog';
import { getRoomAccessPassword, removeRoomAccess } from '@/lib/roomAccessLocal';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Phase = 'checking' | 'prompt';

/**
 * パスワード付きルームの入口。サーバーが「未確認」と判断したときだけ表示される。
 * 保存済みのパスワードがあれば静かに再検証し、なければ(または古ければ)入力を求める。
 * 確認できなかった場合は Top へ戻す。
 */
export default function RoomPasswordGate({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('checking');

  useEffect(() => {
    let cancelled = false;
    const saved = getRoomAccessPassword(roomId);
    const verification = saved ? verifyRoomPassword(roomId, saved) : Promise.resolve({ success: false });

    verification
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          router.refresh();
          return;
        }
        if (saved) removeRoomAccess(roomId);
        setPhase('prompt');
      })
      .catch(() => {
        if (!cancelled) setPhase('prompt');
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, router]);

  const backToTop = () => router.replace('/');

  return (
    <div className="flex min-h-screen items-center justify-center">
      {phase === 'checking' ? (
        <Loading className="size-8" />
      ) : (
        <RoomPasswordDialog
          roomId={roomId}
          onVerified={() => router.refresh()}
          onCancel={backToTop}
          onExhausted={() => {
            showToast('パスワードを3回間違えたため、トップに戻ります。', { variant: 'error' });
            backToTop();
          }}
        />
      )}
    </div>
  );
}
