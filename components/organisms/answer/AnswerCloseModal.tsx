import { startAnswering } from '@/app/room/[id]/action';
import Button from '@/components/atoms/Button';
import { showToast } from '@/components/common/toast';
import Modal from '@/components/organisms/Modal';
import { useModalContext } from '@/hooks/useModalContext';
import { useState } from 'react';

export default function AnswerCloseModal({ roomId, dataLength }: { roomId: string, dataLength: number }) {
    const { modalType, close } = useModalContext();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleStatusAnswering = async () => {
        if (isSubmitting) return;

        const userId = localStorage.getItem('drawing_app_user_id');
        if (!userId) {
            showToast('ユーザー情報を確認できませんでした。', { variant: 'error' });
            return;
        }

        setIsSubmitting(true);
        const result = await startAnswering(roomId, userId);
        // console.log('startAnswering result:', result);
        setIsSubmitting(false);

        if (!result.success) {
            showToast('回答フェーズを開始できませんでした。', { variant: 'error' });
            return;
        }

        close();
    };

    return (
        <Modal
            isOpen={modalType === 'answerClose'}
            onClose={() => close()}
        >
            <div>
                {dataLength > 0 ? (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-center">締め切りますか？</h2>
                        <p>描画中の方はいないですか？<br />参加人数分のイラストが届いている事を確認してください</p>
                        <div className="flex justify-end gap-4 mt-6">
                            <Button
                                onClick={() => close()}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                                value="キャンセル"
                            />
                            <Button
                                onClick={handleStatusAnswering}
                                value={isSubmitting ? "開始中..." : "OK"}
                                disabled={isSubmitting}
                            />
                        </div>
                    </>
                ) : (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-center">イラストが届いていません</h2>
                        <p className="text-center">参加者全員からイラストが届いている事を確認してください</p>
                        <div className="flex justify-end mt-6">
                            <Button
                                onClick={() => close()}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                                value="キャンセル"
                            />
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    )
}
