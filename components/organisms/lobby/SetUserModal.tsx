import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Modal from '@/components/organisms/Modal';
import { setUsernameSchema, getUserId } from '@/lib/user';
import { generateUser } from '@/lib/user';
import { ensureUser } from '@/app/user/action';

export default function SetUserModal({
    isSetUserModal,
    user,
    nameError,
    loading,
    className,
    setUser,
    setNameError,
    setIsSetUserModal,
}
    :
    {
        isSetUserModal: boolean,
        user: string,
        nameError: string,
        loading: boolean,
        className?: string,
        setUser: React.Dispatch<React.SetStateAction<string>>,
        setNameError: React.Dispatch<React.SetStateAction<string>>,
        setIsSetUserModal: React.Dispatch<React.SetStateAction<boolean>>
    }) {
    return (
        <>
            <Modal
                isOpen={isSetUserModal}
                className={className}
            >
                <div>
                    <p className="font-semibold mb-2 text-gray-700">ユーザー名の入力</p>
                    <Input
                        value={user}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setUsernameSchema({ name: e.target.value, setNameError, setUser });
                        }}
                        className={`w-full ${nameError ? 'border-red-500 border-2' : ''}`}
                        placeholder='ユーザー名を入力してください'
                    />
                    {nameError && (
                        <div className="mt-2">
                            <p className="text-red-500 font-semibold text-sm">{nameError}</p>
                        </div>
                    )}
                    <p className='text-xs text-gray-500 mt-2'>
                        ・ユーザー名は1文字以上10文字以下で入力してください。<br />
                        ・ルームの作成、入室する際に必要となります。<br />
                        ・個人情報などの機密情報は含めないでください。
                    </p>
                    <div className='flex justify-end mt-4'>
                        <Button
                            value='設定'
                            onClick={() => {
                                const result = setUsernameSchema({ name: user, setNameError, setUser });
                                if (result?.success) {
                                    setIsSetUserModal(false);
                                    generateUser();
                                    const userId = getUserId();
                                    if (userId) {
                                        void ensureUser(userId, user);
                                    }
                                }
                            }}
                            disabled={loading}
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
}