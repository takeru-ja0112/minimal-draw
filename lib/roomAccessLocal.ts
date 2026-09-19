const ROOM_ACCESS_KEY = 'room_access_list';
const MAX_ENTRIES = 20;

export type RoomAccessEntry = { room_id: string; password: string };

function isEntry(value: unknown): value is RoomAccessEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as RoomAccessEntry).room_id === 'string' &&
    typeof (value as RoomAccessEntry).password === 'string'
  );
}

function readList(): RoomAccessEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ROOM_ACCESS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch {
    return [];
  }
}

function writeList(list: RoomAccessEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ROOM_ACCESS_KEY, JSON.stringify(list.slice(-MAX_ENTRIES)));
  } catch {
    // 容量超過・プライベートモード等では記憶できないだけで、入室自体は妨げない
  }
}

export function getRoomAccessPassword(roomId: string): string | null {
  return readList().find((entry) => entry.room_id === roomId)?.password ?? null;
}

export function saveRoomAccess(roomId: string, password: string) {
  writeList([...readList().filter((entry) => entry.room_id !== roomId), { room_id: roomId, password }]);
}

export function removeRoomAccess(roomId: string) {
  writeList(readList().filter((entry) => entry.room_id !== roomId));
}
