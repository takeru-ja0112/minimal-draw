import Modal from "../Modal";
import Button from "@/components/atoms/Button";
import { useState } from "react";
import Loading from "@/components/atoms/Loading";
import Input from "@/components/atoms/Input";
import { SEARCH_CODE_LENGTH, searchRoomSchema } from "@/lib/room";
import { getRoomBySearchCode } from "@/app/lobby/action";
import historyLocalRoom from '@/lib/hitoryLocalRoom';

export default function SearchRoomModal({
    isOpen,
    onClose
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const { setLocalRoom } = historyLocalRoom();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [roomId, setRoomId] = useState<string>('');

    /**
     * ルーム検索入力変更時
     * 
     * @param e 
     */
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        // IDは数字のみ。数字以外は入力時点で取り除く
        const value = e.target.value.replace(/\D/g, '');
        const result = searchRoomSchema(value);

        setError(result.success ? null : result.error);
        setRoomId(value);
    }

    const submitSearch = async () => {
        const result = searchRoomSchema(roomId);
        if (!result.success) {
            setError(result.error);
            return;
        }

        setLoading(true);
        setError(null);
        // 検索処理
        const dbResult = await getRoomBySearchCode(roomId);
        if (!dbResult.success || !dbResult.data) {
            setError(dbResult.error || 'ルームの検索に失敗しました。');
        } else {
            // ルームが見つかった場合、ルームページへ遷移
            setLocalRoom(dbResult.data.id);
            window.location.href = `/room/${dbResult.data.id}`;
        }
        setLoading(false);
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
        >
            <p className="font-semibold mb-2 text-gray-700">ルームIDの入力</p>
            <p className="font-semibold mb-4 text-gray-700 text-sm">数字{SEARCH_CODE_LENGTH}桁でIDを入力してください。</p>

            <div className="h-15">
                <Input
                    value={roomId}
                    inputMode="numeric"
                    maxLength={SEARCH_CODE_LENGTH}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e)}
                    className="w-full"
                />
                {error && <p className="text-red-500 font-semibold text-sm mt-2">{error}</p>}
            </div>

            <div className='flex space-x-2 mt-6 justify-end'>
                <Button
                    value='キャンセル'
                    onClick={() => onClose()}
                    disabled={loading}
                />
                <Button
                    value='検索'
                    icon={loading ? <Loading /> : null}
                    onClick={() => {
                        handleSearch({ target: { value: roomId } } as React.ChangeEvent<HTMLInputElement>);
                        submitSearch();
                    }}
                    className='w-30'
                />
            </div>
        </Modal>
    )
}