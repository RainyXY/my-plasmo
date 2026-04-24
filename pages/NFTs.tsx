import { useState } from "react"

import { useWalletStore } from "~stores/wallet"

interface NFTsProps {
  onBack: () => void
}

export default function NFTs({ onBack }: NFTsProps) {
  const { currentNetwork } = useWalletStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [nftAddress, setNftAddress] = useState("")
  const [tokenId, setTokenId] = useState("")

  const handleAddNft = () => {
    if (!nftAddress || !tokenId) {
      return
    }
    console.log("添加NFT:", {
      networkId: currentNetwork.id,
      nftAddress,
      tokenId
    })
    setShowAddForm(false)
    setNftAddress("")
    setTokenId("")
  }

  return (
    <div className="p-5 w-[320px] bg-gray-50 min-h-[220px]">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
        ← 返回
      </button>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">NFT</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm text-blue-500 hover:text-blue-600 font-medium">
          {showAddForm ? "取消" : "添加"}
        </button>
      </div>

      {showAddForm ? (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              NFT 合约地址
            </label>
            <input
              type="text"
              value={nftAddress}
              onChange={(e) => setNftAddress(e.target.value)}
              placeholder="0x..."
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Token ID
            </label>
            <input
              type="text"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="请输入 Token ID"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleAddNft}
            disabled={!nftAddress || !tokenId}
            className="w-full py-2.5 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
            添加 NFT
          </button>
        </div>
      ) : (
        <div className="text-sm text-gray-500 text-center py-8">
          <div className="mb-3">暂无 NFT</div>
          <div className="text-xs text-gray-400">
            点击右上角"添加"按钮添加 NFT
          </div>
        </div>
      )}
    </div>
  )
}
