import { TbLock } from 'react-icons/tb';

export default function RoomLockIcon({ className = 'text-amber-500' }: { className?: string }) {
  return <TbLock role="img" aria-label="パスワード付きルーム" className={`shrink-0 ${className}`} size="1.1em" />;
}
