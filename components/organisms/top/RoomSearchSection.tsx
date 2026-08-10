"use client";

import { useState, useEffect } from "react";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Loading from "@/components/atoms/Loading";
import { getRoomByPageSearch, RoomSearchFilters } from "@/app/lobby/action";
import historyLocalRoom from "@/lib/hitoryLocalRoom";
import { motion } from "motion/react";
import { TbGhost2, TbPlus } from "react-icons/tb";
import { useRouter } from "next/navigation";
import { Room } from "@/type/roomType";
import RoomCreateModal from "@/components/organisms/top/RoomCreateModal";

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function RoomSearchSection({
  user,
  userId,
  setNameError,
}: {
  user: string;
  userId: string;
  setNameError: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { setLocalRoom } = historyLocalRoom();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Search filter states
  const [roomName, setRoomName] = useState("");
  const [createdByName, setCreatedByName] = useState("");
  const [createdDate, setCreatedDate] = useState(getTodayString());

  // Pagination & results states
  const [rooms, setRooms] = useState<Room[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // To store the active filters applied during search
  const [activeFilters, setActiveFilters] = useState<RoomSearchFilters>({
    createdDate: getTodayString(),
  });

  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const forbiddenChars = /[<>&\/\\'"]/;

  const fetchRooms = async (pageToFetch: number, filtersToUse: RoomSearchFilters) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRoomByPageSearch(pageToFetch, filtersToUse);
      if (res.success && res.data) {
        setRooms(res.data as unknown as Room[]);
        setTotal(res.total);
        setPage(res.page);
      } else {
        setError(res.error || "ルームの取得に失敗しました。");
      }
    } catch (e) {
      console.error(e);
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  // Initial search on mount
  useEffect(() => {
    const today = getTodayString();
    const initialFilters = { createdDate: today };
    setActiveFilters(initialFilters);
    fetchRooms(1, initialFilters);
  }, []);

  const handleSearch = () => {
    setNameError("");
    setError(null);

    // Check forbidden characters
    if (forbiddenChars.test(roomName)) {
      setError("ルーム名に使用できない文字が含まれています。");
      return;
    }
    if (forbiddenChars.test(createdByName)) {
      setError("作成者名に使用できない文字が含まれています。");
      return;
    }

    const filters: RoomSearchFilters = {};
    if (roomName.trim()) filters.roomName = roomName.trim();
    if (createdByName.trim()) filters.createdByName = createdByName.trim();
    if (createdDate) filters.createdDate = createdDate;

    setActiveFilters(filters);
    fetchRooms(1, filters);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchRooms(newPage, activeFilters);
  };

  const handleIntoRoom = (roomId: string) => {
    setNameError("");
    if (!user) {
      setNameError("ルームに参加するにはユーザー名が必要です。");
      return;
    }
    setLocalRoom(roomId);
    router.push(`/room/${roomId}`);
  };

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700">ルームをさがす</h2>
        <button
          onClick={() => {
            if (!user) {
              setNameError("ルームを作成するにはユーザー名が必要です。");
              return;
            }
            setIsCreateModalOpen(true);
          }}
          className="p-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-full flex items-center justify-center transition-colors duration-200 shadow-md font-bold cursor-pointer"
        >
          <TbPlus size={20} />
        </button>
      </div>

      {/* Search Filters */}
      <div className="grid gap-3 sm:grid-cols-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">ルーム名</label>
          <Input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="部分一致"
            className="w-full text-sm min-w-0"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">作成者名</label>
          <Input
            value={createdByName}
            onChange={(e) => setCreatedByName(e.target.value)}
            placeholder="部分一致"
            className="w-full text-sm min-w-0"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">作成日付</label>
          <Input
            type="date"
            value={createdDate}
            onChange={(e) => setCreatedDate(e.target.value)}
            className="w-full text-sm min-w-0 !px-3"
          />
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <Button
          value="検索"
          onClick={handleSearch}
          disabled={loading}
          className="w-24"
        />
      </div>

      {/* Local Error Display */}
      {error && (
        <p className="text-red-500 font-semibold text-sm mb-4 text-center">
          {error}
        </p>
      )}

      {/* Search Results */}
      <div className="max-h-[400px] overflow-y-auto pr-1">
        {loading ? (
          <div className="flex justify-center my-8">
            <Loading />
          </div>
        ) : rooms.length > 0 ? (
          rooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 * index }}
              className="cursor-pointer mb-3"
              onClick={() => handleIntoRoom(room.id)}
              whileHover={{ scale: 1.01 }}
            >
              <div className="relative p-3 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden text-left bg-white">
                <span className="absolute -right-8 -top-8 w-15 h-15 bg-blue-500 rotate-45"></span>
                <div className="w-full font-bold">
                  <h3 className="text-base text-gray-800">{room.room_name}</h3>
                  <div className="text-xs text-gray-500">
                    ID: <span className="font-semibold">{room.short_id}</span>
                  </div>
                </div>
                <hr className="border-gray-200 my-2" />
                <div className="text-gray-500 text-xs">
                  作成者: {room.creator?.username || "不明"}
                  <span className="mx-2">|</span>
                  作成日時: {new Date(room.created_at).toLocaleString()}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="my-8">
            <TbGhost2 size={40} className="mx-auto text-gray-300" />
            <div className="text-center text-gray-400 font-semibold mt-2">
              該当するルームが見つかりません
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {rooms.length > 0 && !loading && (
        <div className="flex items-center justify-between mt-6 border-t border-gray-200 pt-4">
          <Button
            value="前へ"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="text-xs px-3 py-1"
          />
          <span className="text-sm text-gray-600 font-semibold">
            {page} / {totalPages} ページ
          </span>
          <Button
            value="次へ"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="text-xs px-3 py-1"
          />
        </div>
      )}

      {isCreateModalOpen && (
        <RoomCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          user={user}
          userId={userId}
          setNameError={setNameError}
        />
      )}
    </Card>
  );
}
