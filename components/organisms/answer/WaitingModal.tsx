import Loading from '@/components/atoms/Loading'

export default function WaitingModal() {
  return (
    <div className="z-100 fixed flex items-center right-0 bottom-5 bg-white p-5 rounded-xl space-x-4 w-60 text-center">
      <Loading className="text-xl text-gray-400" />
      <div>
        <h1 className="text-sm font-bold text-gray-500">回答者が操作中です</h1>
        <p className="text-xs text-gray-500">少々お待ちください。</p>
      </div>
    </div>
  )
}