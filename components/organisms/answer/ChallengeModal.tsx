import { resetRoomAnswer, resetRoomSettings } from '@/app/room/[id]/action';
import Button from '@/components/atoms/Button';
import Modal from '@/components/organisms/Modal';
import { useModalContext } from '@/hooks/useModalContext';
import { useRouter } from 'next/navigation';

export default function ChallengeModal({ roomId, onModify, setIsAnswerRole }: { roomId: string; onModify: () => void; setIsAnswerRole: React.Dispatch<React.SetStateAction<boolean>> }) {
  const router = useRouter();
  const { close } = useModalContext();

  return (
    <Modal isOpen={true}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">ちゃいます！</h2>
        <h2 className="text-2xl font-bold mb-4 text-center">新しいお題に挑戦しますか？</h2>
        <Button
          onClick={async () => {
            await resetRoomSettings(roomId);
            close();
            router.push(`/room/${roomId}`);
          }}
          value="お題を変更する"
          className="w-full mt-4"
        />
        <Button
          onClick={() => {
            onModify();
            close();
          }}
          value="修正してもらう"
          className="w-full mt-4"
        />
        <Button
          onClick={async () => {
            await resetRoomAnswer(roomId);
            setIsAnswerRole(false);
            close();
          }}
          value="終了する"
          className="w-full mt-4"
        />
        <p className='text-gray-500 text-xs mt-2'>終了した後は他の人の作品を見る事ができます。</p>
      </div>
    </Modal>
  )
}