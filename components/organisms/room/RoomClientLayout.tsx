'use client';

import { ModalProvider } from '@/hooks/useModalContext';
import { useEffect } from 'react';

export default function RoomClientLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/custom-sw.js')
        .catch((err) => {
          console.error('SW registration failed!', err);
          alert('Service Worker登録に失敗しました。プッシュ通知は利用できません。');
        });
    }
  }, []);

  return <ModalProvider>{children}</ModalProvider>;
}
