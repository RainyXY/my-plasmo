import { useState } from "react"

import { useBalance } from "~hooks/useBalance"
import { useWalletStore } from "~stores/wallet"
import type { PopupRoute } from "~types"

interface SendProps {
  onBack: () => void
  onNavigate?: (route: PopupRoute) => void
}

export default function Send({ onBack, onNavigate }: SendProps) {
  const { currentNetwork, networks, switchNetwork, wallet } = useWalletStore()
  const { balance, loading, refreshBalance } = useBalance()
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [showNetworkSelector, setShowNetworkSelector] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const handleNetworkSelect = (networkId: string) => {
    switchNetwork(networkId)
    setShowNetworkSelector(false)
  }

  const handleSend = async () => {
    if (!recipient || !amount || !wallet?.address) {
      setSendError("请填写完整信息")
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setSendError("请输入有效的金额")
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      setSendError("无效的地址格式")
      return
    }

    if (amountNum > parseFloat(balance)) {
      setSendError("余额不足")
      return
    }

    const valueWei = BigInt(Math.floor(amountNum * 1e18)).toString(16)
    const txParams = {
      from: wallet.address,
      to: recipient,
      value: "0x" + valueWei
    }

    await chrome.storage.local.set({ transactionRequest: txParams })
    onNavigate?.("transaction")
  }

  return (
    <div className="p-5 w-[320px] bg-gray-50 min-h-[220px]">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
        ← 返回
      </button>

      <h2 className="text-xl font-bold text-gray-900 mb-4">发送</h2>

      {/* 网络选择 */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          当前网络
        </label>
        <button
          onClick={() => setShowNetworkSelector(!showNetworkSelector)}
          className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm flex items-center justify-between hover:bg-gray-50 transition">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {currentNetwork.name}
            </span>
          </div>
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
          <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {networks.map((network) => (
              <button
                key={network.id}
                onClick={() => handleNetworkSelect(network.id)}
                className={`w-full p-2.5 text-left text-sm border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition ${
                  currentNetwork.id === network.id
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

      {/* 可用余额 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-gray-700">
            可用余额
          </label>
          <button
            onClick={refreshBalance}
            disabled={loading}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50">
            {loading ? "加载中..." : "刷新"}
          </button>
        </div>
        <div className="p-2.5 bg-white border border-gray-200 rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {loading ? "加载中..." : balance} {currentNetwork.currency}
          </div>
        </div>
      </div>

      {/* 接收地址输入框 */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          接收地址
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 金额输入框 */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          金额（{currentNetwork.currency}）
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.000001"
            min="0"
            max={balance}
            className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-16"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button
              onClick={() => setAmount(balance)}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition font-medium">
              MAX
            </button>
          </div>
        </div>
      </div>

      {/* 错误信息 */}
      {sendError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {sendError}
        </div>
      )}

      {/* 发送按钮 */}
      <button
        onClick={handleSend}
        disabled={!recipient || !amount}
        className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
        确认
      </button>
    </div>
  )
}
