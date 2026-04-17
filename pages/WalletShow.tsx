import { formatEther, JsonRpcProvider } from "ethers"
import { useEffect, useState } from "react"

import { useWalletStore } from "~stores/wallet"
import type { PopupRoute } from "~types"

interface WalletShowProps {
  onBack: () => void
  onNavigate?: (route: PopupRoute) => void
}

export default function WalletShow({ onBack, onNavigate }: WalletShowProps) {
  const { wallet, currentNetwork } = useWalletStore()
  console.log("currentNetwork: ", currentNetwork)
  const [balance, setBalance] = useState<string>("0")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (wallet?.address) {
      fetchBalance()
    }
  }, [wallet])

  const fetchBalance = async () => {
    setLoading(true)
    try {
      const provider = new JsonRpcProvider(currentNetwork.rpcUrl)
      const balance = await provider.getBalance(wallet!.address)
      console.log("balance: ", provider, balance)
      setBalance(formatEther(balance))
    } catch (error) {
      console.error("获取余额失败:", error)
      setBalance("0")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 w-[320px] bg-gray-50 min-h-[220px]">
      <h2 className="text-xl font-bold text-gray-900 mb-4">我的钱包</h2>

      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">地址</div>
          <button
            onClick={() => {
              if (wallet?.address) {
                navigator.clipboard.writeText(wallet.address)
              }
            }}
            className="text-xs text-blue-500 hover:text-blue-600 transition">
            复制
          </button>
        </div>
        <div className="text-sm text-gray-900 font-medium break-all">
          {wallet?.address}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600 mb-2">
            {currentNetwork.currency} 余额
          </div>
          <button
            onClick={() => onNavigate?.("networks")}
            className="text-xs text-blue-500 hover:text-blue-600 transition">
            {currentNetwork.name}
          </button>
        </div>

        <div className="text-2xl font-bold text-gray-900">
          {loading ? "加载中..." : balance}
        </div>
        {/* <div className="text-xs text-gray-500 mt-1">
          ≈ ${(parseFloat(balance) * 2000).toFixed(2)} USD
        </div> */}
      </div>

      <div className="flex gap-2">
        <button className="flex-1 bg-blue-500 text-white py-2 px-3 rounded hover:bg-blue-600 transition">
          发送
        </button>
        <button className="flex-1 bg-green-500 text-white py-2 px-3 rounded hover:bg-green-600 transition">
          接收
        </button>
      </div>
    </div>
  )
}
