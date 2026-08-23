import { useState } from "react";
import Button from "@/components/atoms/Button";
import Modal from "@/components/organisms/Modal";
import UserIcon from "@/components/atoms/UserIcon";
import { Icons } from "@/utils/Icons";

export default function IconSettingModal({
    isOpen,
    currentIconName,
    currentIconColor,
    onClose,
    onSave,
}: {
    isOpen: boolean;
    currentIconName: string;
    currentIconColor: string;
    onClose: () => void;
    onSave: (iconName: string, iconColor: string) => void;
}) {
    const [selectedIconName, setSelectedIconName] = useState(currentIconName);
    const [selectedIconColor, setSelectedIconColor] = useState(currentIconColor);

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="w-full">
            <div>
                <p className="font-semibold mb-4 text-gray-700">アイコンの設定</p>

                <div className="flex items-center justify-center mb-4">
                    <div
                        className="flex items-center justify-center w-16 h-16 rounded-full border border-dotted border-gray-300 border-2"
                    >
                        <UserIcon iconName={selectedIconName} iconColor={selectedIconColor} size={36} />
                    </div>
                </div>

                <p className="text-sm text-gray-600 mb-2">アイコンを選択してください</p>
                <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto mb-4 p-1">
                    {Icons.map((Icon) => (
                        <button
                            key={Icon.name}
                            type="button"
                            onClick={() => setSelectedIconName(Icon.name)}
                            className={`flex items-center justify-center aspect-square rounded-xl border-2 transition-colors ${
                                selectedIconName === Icon.name
                                    ? "border-yellow-400 bg-yellow-50"
                                    : "border-gray-200 hover:bg-gray-100"
                            }`}
                        >
                            <UserIcon iconName={Icon.name} iconColor={selectedIconColor} size={22} />
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between mb-6">
                    <label htmlFor="iconColor" className="text-sm text-gray-600">
                        カラーを選択してください
                    </label>
                    <input
                        id="iconColor"
                        type="color"
                        value={selectedIconColor}
                        onChange={(e) => setSelectedIconColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer bg-transparent"
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Button value="キャンセル" onClick={onClose} />
                    <Button
                        value="設定"
                        onClick={() => onSave(selectedIconName, selectedIconColor)}
                    />
                </div>
            </div>
        </Modal>
    );
}
