import Modal from '@/components/organisms/Modal';
import { useModalContext } from '@/hooks/useModalContext';
import Button from '@/components/atoms/Button';
import { advanceAnswerDrawing } from '@/app/room/[id]/action';
import { showToast } from '@/components/common/toast';
import { useState } from 'react';

type MistakeModalProps = {
    roomId: string;
    expectedIndex: number;
    onAdvanced: () => void;
};

export default function MistakeModal({ roomId, expectedIndex, onAdvanced }: MistakeModalProps) {
    const { close } = useModalContext();
    const [isAdvancing, setIsAdvancing] = useState(false);

    const handleAdvance = async () => {
        if (isAdvancing) return;

        const userId = localStorage.getItem('drawing_app_user_id');
        if (!userId) {
            showToast('ユーザー情報を確認できませんでした。', { variant: 'error' });
            return;
        }

        setIsAdvancing(true);
        const result = await advanceAnswerDrawing(roomId, userId, expectedIndex);
        setIsAdvancing(false);

        if (!result.success) {
            showToast('次のイラストへ進めませんでした。画面を更新してください。', { variant: 'error' });
            return;
        }

        onAdvanced();
        close();
    };

    return (
        <Modal isOpen={true} onClose={handleAdvance}>
            <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-center">ちゃいます！</h2>
                <p className="text-center">次のイラストへ移ります</p>
                <Button
                    onClick={handleAdvance}
                    value={isAdvancing ? '移動中...' : 'OK'}
                    disabled={isAdvancing}
                    className="w-full mt-4"
                />
            </div>
        </Modal>
    );
}
