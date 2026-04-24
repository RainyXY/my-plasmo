import { Contract } from "ethers"
import { useState } from "react"

import { useWalletStore } from "~stores/wallet"

interface NFTsProps {
  onBack: () => void
}

export default function NFTs({ onBack }: NFTsProps) {
  const { currentNetwork, address, nftCollections, addNFT, removeNFT } =
    useWalletStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [nftAddress, setNftAddress] = useState("")
  const [tokenId, setTokenId] = useState("")
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allNFTs = nftCollections.flatMap((collection) =>
    collection.nfts.map((nft) => ({
      ...nft,
      collectionName: collection.contractAddress
    }))
  )

  const handleAddNft = async () => {
    if (!nftAddress || !tokenId || !address) return

    setAdding(true)
    setError(null)

    try {
      const provider = useWalletStore.getState().getProvider()
      if (!provider) {
        throw new Error("Provider not available")
      }

      const ERC721_ABI = [
        "function ownerOf(uint256 tokenId) view returns (address)",
        "function tokenURI(uint256 tokenId) view returns (string)",
        "function name() view returns (string)",
        "function symbol() view returns (string)"
      ]

      const nftContract = new Contract(nftAddress, ERC721_ABI, provider)

      const owner = await nftContract.ownerOf(tokenId)
      if (owner.toLowerCase() !== address.toLowerCase()) {
        throw new Error("此 NFT 不属于当前账户")
      }

      let tokenURI: string | null = null
      let metadata: any = null
      let image: string | undefined
      let name: string | undefined
      let description: string | undefined

      try {
        tokenURI = await nftContract.tokenURI(tokenId)
        if (tokenURI) {
          const metadataUrl = tokenURI.startsWith("ipfs://")
            ? `https://ipfs.io/ipfs/${tokenURI.replace("ipfs://", "")}`
            : tokenURI
          const response = await fetch(metadataUrl)
          if (response.ok) {
            metadata = await response.json()
            image = metadata.image || metadata.image_url
            name = metadata.name
            description = metadata.description
            if (image && image.startsWith("ipfs://")) {
              image = `https://ipfs.io/ipfs/${image.replace("ipfs://", "")}`
            }
          }
        }
      } catch (err) {
        console.error("获取 NFT 元数据失败:", err)
      }

      addNFT({
        contractAddress: nftAddress,
        tokenId: tokenId,
        name,
        description,
        image,
        metadata
      })

      setShowAddForm(false)
      setNftAddress("")
      setTokenId("")
    } catch (err: any) {
      console.error("添加 NFT 失败:", err)
      setError(err.message || "添加 NFT 失败")
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveNft = (contractAddress: string, tokenId: string) => {
    removeNFT(contractAddress, tokenId)
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

          {error && <div className="text-xs text-red-500 mb-3">{error}</div>}

          <button
            onClick={handleAddNft}
            disabled={adding || !nftAddress || !tokenId}
            className="w-full py-2.5 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {adding ? "添加中..." : "添加 NFT"}
          </button>
        </div>
      ) : allNFTs.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-8">
          <div className="mb-3">暂无 NFT</div>
          <div className="text-xs text-gray-400">
            点击右上角"添加"按钮添加 NFT
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {allNFTs.map((nft) => (
            <div
              key={`${nft.contractAddress}-${nft.tokenId}`}
              className="relative bg-white border border-gray-200 rounded-lg p-3 group">
              <button
                onClick={() =>
                  handleRemoveNft(nft.contractAddress, nft.tokenId)
                }
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {nft.image ? (
                <img
                  src={nft.image}
                  alt={nft.name || `NFT #${nft.tokenId}`}
                  className="w-full aspect-square object-cover rounded-lg mb-2"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23334155' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%2394a3b8' font-size='12'%3ENFT%3C/text%3E%3C/svg%3E"
                  }}
                />
              ) : (
                <div className="w-full aspect-square bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                  <span className="text-xs text-gray-400">#{nft.tokenId}</span>
                </div>
              )}
              <div className="text-xs text-gray-700 truncate mb-1">
                {nft.name || `#${nft.tokenId}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
