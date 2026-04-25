import { Contract } from "ethers"
import { useState } from "react"

import { useWalletStore } from "~stores/wallet"

interface TokensProps {
  onBack: () => void
}

export default function Tokens({ onBack }: TokensProps) {
  const { currentNetwork, networks, tokens, addToken, getProvider } =
    useWalletStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [showNetworkSelector, setShowNetworkSelector] = useState(false)
  const [tokenAddress, setTokenAddress] = useState("")
  const [selectedNetworkId, setSelectedNetworkId] = useState(currentNetwork.id)
  const [isLoading, setIsLoading] = useState(false)

  const selectedNetwork =
    networks.find((n) => n.id === selectedNetworkId) || currentNetwork

  const networkTokens = tokens.filter((t) => t.networkId === selectedNetworkId)

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetworkId(networkId)
    setShowNetworkSelector(false)
  }

  const handleAddToken = async () => {
    if (!tokenAddress) {
      return
    }
    setIsLoading(true)
    try {
      const provider = getProvider()
      if (!provider) {
        console.error("Failed to get provider")
        setIsLoading(false)
        return
      }

      const tokenContract = new Contract(
        tokenAddress,
        [
          "function name() view returns (string)",
          "function symbol() view returns (string)",
          "function decimals() view returns (uint8)"
        ],
        provider
      )

      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals()
      ])

      addToken({
        address: tokenAddress,
        name,
        symbol,
        decimals: Number(decimals),
        networkId: selectedNetworkId
      })

      setShowAddForm(false)
      setTokenAddress("")
    } catch (error) {
      console.error("Failed to add token:", error)
      alert("添加代币失败，请检查合约地址是否正确")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-5 w-[320px] bg-gray-50 min-h-[220px]">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
        ← 返回
      </button>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">代币</h2>
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
              区块链网络
            </label>
            <button
              onClick={() => setShowNetworkSelector(!showNetworkSelector)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm flex items-center justify-between hover:bg-gray-100 transition">
              <span className="font-medium text-gray-900">
                {selectedNetwork.name}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${showNetworkSelector ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showNetworkSelector && (
              <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                {networks.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => handleNetworkSelect(network.id)}
                    className={`w-full p-2.5 text-left text-sm border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition ${
                      selectedNetworkId === network.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-900"
                    }`}>
                    <div className="font-medium">{network.name}</div>
                    <div className="text-xs text-gray-500">
                      Chain ID: {network.chainId} · {network.currency}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              代币合约地址
            </label>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="0x..."
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleAddToken}
            disabled={!tokenAddress || isLoading}
            className="w-full py-2.5 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? "添加中..." : "添加代币"}
          </button>
        </div>
      ) : (
        <div>
          {networkTokens.length > 0 ? (
            <div className="space-y-2">
              {networkTokens.map((token) => (
                <div
                  key={`${token.networkId}-${token.address}`}
                  className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {token.symbol}
                    </div>
                    <div className="text-xs text-gray-500">{token.name}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {token.address.slice(0, 6)}...{token.address.slice(-4)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">
              <div className="mb-3">暂无代币</div>
              <div className="text-xs text-gray-400">
                点击右上角"添加"按钮添加代币
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
