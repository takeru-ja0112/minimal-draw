"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/organisms/Modal";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Loading from "@/components/atoms/Loading";
import RoomSetting from "@/components/organisms/RoomSetting";
import { createRoomByUsername } from "@/app/lobby/action";
import { setRoomSchema } from "@/lib/room";
import historyLocalRoom from "@/lib/hitoryLocalRoom";
import type { CreateRoom, RoomSettingType } from "@/type/roomType";

export default function RoomCreateModal({
  isOpen,
  onClose,
  user,
  userId,
  setNameError,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: string;
  userId: string;
  setNameError: React.Dispatch<React.SetStateAction<string>>;
}) {
  const router = useRouter();
  const { setLocalRoom } = historyLocalRoom();

  const [loading, setLoading] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomError, setRoomError] = useState("");

  const [settingData, setSettingData] = useState<RoomSettingType>({
    level: "normal",
    genre: "ランダム",
  });

  const [createRoomData, setCreateRoomData] = useState<CreateRoom>({
    level: "normal",
    genre: "ランダム",
    userId: userId,
    username: user,
    roomName: roomName,
  });

  // Sync settingData & user/userId changes with createRoomData
  useEffect(() => {
    setCreateRoomData((prev) => ({
      ...prev,
      username: user,
      userId: userId,
      level: settingData.level,
      genre: settingData.genre,
    }));
  }, [user, userId, settingData]);

  // Sync roomName changes with createRoomData
  useEffect(() => {
    setCreateRoomData((prev) => ({
      ...prev,
      roomName: roomName,
    }));
  }, [roomName]);

  const handleCreateRoom = async () => {
    setNameError("");
    setRoomError("");

    if (!user) {
      setNameError("ルームを作成するにはユーザー名が必要です。");
      return;
    }

    const result = setRoomSchema({
      roomName,
      setRoomError,
      setCreateRoomData,
    });

    if (!result || !result.success) {
      return;
    }

    setLoading(true);
    try {
      const res = await createRoomByUsername(createRoomData);
      if (res.success && res.data) {
        const roomId = res.data.id;
        setLocalRoom(roomId);
        onClose(); // Close modal before navigation
        router.push(`/room/${roomId}`);
      } else {
        console.error("Failed to create room:", res.error);
        setRoomError("ルームの作成に失敗しました。");
      }
    } catch (error) {
      console.error("Error create room:", error);
      setRoomError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full">
      <h2 className="text-xl font-semibold mb-4 text-gray-700 text-center">ルームをつくる</h2>
      
      <div className="mb-2">
        <label htmlFor="roomName" className="font-semibold text-gray-700 text-sm">
          ルーム名
        </label>
      </div>
      <div className="my-2">
        <Input
          name="roomName"
          value={roomName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setRoomName(e.target.value);
            setRoomSchema({
              roomName: e.target.value,
              setRoomError,
              setCreateRoomData,
            });
          }}
          onBlur={() => {
            if (!roomName) {
              setRoomError("ルーム名は必須です。");
            }
          }}
          placeholder="ルーム名を入力してください"
          className={`w-full ${roomError ? "border-red-500 border-2" : ""}`}
        />
      </div>
      {roomError && (
        <div className="mb-2">
          <p className="text-red-500 font-semibold text-sm">{roomError}</p>
        </div>
      )}

      <RoomSetting<RoomSettingType>
        className="mt-4"
        setRoomData={setSettingData}
      />

      <div className="flex space-x-2 mt-6 justify-end">
        <Button
          value="キャンセル"
          onClick={onClose}
          disabled={loading}
        />
        <Button
          value="作成"
          icon={loading ? <Loading /> : null}
          onClick={handleCreateRoom}
          disabled={loading}
          className="w-30"
        />
      </div>
    </Modal>
  );
}
