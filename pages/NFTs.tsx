interface NFTsProps {
  onBack: () => void
}

export default function NFTs({ onBack }: NFTsProps) {
  return (
    <div className="p-5 w-[320px] bg-gray-50 min-h-[220px]">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
        ← 返回
      </button>

      <h2 className="text-xl font-bold text-gray-900 mb-4">NFT</h2>

      <div className="text-sm text-gray-500 text-center py-8">NFT 页面</div>
    </div>
  )
}
