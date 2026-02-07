import Button from '@/components/atoms/Button';

export default function Loading() {
  return (
    <>
      {/* <BgObject /> */}
      <div className="px-4 pt-5 pb-16">
        <div className="max-w-lg mx-auto text-center relative">
          {/* お題 */}
          <label className="block mb-1 font-semibold text-gray-600">
            お題
          </label>
          <div className="h-5 w-24 bg-gray-300 rounded mx-auto mb-2 animate-pulse" />
          <div className="flex items-center justify-center mb-2">
            <div className="h-6 w-40 bg-gray-300 rounded mx-auto animate-pulse" />
          </div>
          <div className="h-6 w-28 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse" />

          <div className="backdrop-blur bg-white/30 border border-white p-4 rounded-2xl shadow-md">
            {/*  描画エリア*/}
            <div className="mb-4 flex gap-2 justify-center items-center">
              <Button className="w-fit h-10 border bg-white/50 border-gray-300 rounded-full p-2 px-4" />
              <Button className="w-fit h-10 border bg-white/50 border-gray-300 rounded-full p-2 px-4" />
              <Button className="w-fit h-10 border bg-white/50 border-gray-300 rounded-full p-2 px-4" />
            </div>

            {/* Tool selection */}
            <div className="mt-4 flex gap-4 justify-center relative">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 w-full relative">
                  <div className="h-3 w-10 bg-gray-200 rounded animate-pulse" />
                  <div className="w-full h-13 flex justify-center items-center py-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            <div className="relative w-[300px] h-[300px] mx-auto">
              <div className="w-fit h-fit p-1 px-4 flex items-center justify-center absolute -top-5 -left-7 z-5 bg-yellow-400/60 border border-white border-2 rounded-full">
                <div className="h-8 w-8 bg-yellow-200 rounded animate-pulse" />
              </div>
              <div className="relative mx-auto mt-4 border bg-white border-4 border-gray-400 w-[300px] h-[300px] touch-none rounded overflow-hidden">
                <div className="w-[300px] h-[300px] bg-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}