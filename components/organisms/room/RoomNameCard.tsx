export default function RoomNameCard({ title }: { title: string }) {
  return (
    <div className="my-6 text-center">
      <h2 className="text-md text-gray-500 font-semibold mb-1">ルーム名</h2>
      <p className="text-gray-900 font-bold break-all">{title}</p>
    </div>
  );
}
