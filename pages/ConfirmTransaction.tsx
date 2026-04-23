import { useState } from "react"

import { useWalletStore } from "~stores/wallet"

interface TransactionRequest {
  from: string
  to: string
  value: string
  origin?: string
}

interface ConfirmTransactionProps {
  request: TransactionRequest
  onConfirm: () => void
  onReject: () => void
}

export default function ConfirmTransaction({
  request,
  onConfirm,
  onReject
}: ConfirmTransactionProps) {
  const { wallet, currentNetwork } = useWalletStore()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatValue = (valueHex: string) => {
    if (!valueHex) return "0"
    const wei = BigInt(valueHex)
    const eth = Number(wei) / 1e18
    return eth.toFixed(6)
  }

  const extensionOrigin = chrome.runtime.getURL("").replace(/\/$/, "")
  const displayOrigin = request.origin || extensionOrigin

  const handleSend = async () => {
    setSending(true)
    setError(null)

    try {
      const response = await chrome.runtime.sendMessage({
        type: "SEND_ETH",
        params: [request]
      })

      if (response?.hash) {
        alert(`交易发送成功！\n哈希: ${response.hash}`)
        await chrome.storage.local.set({ transactionRequest: null })
        onConfirm()
      } else if (response?.success && response.result) {
        await chrome.storage.local.set({ transactionRequest: null })
        onConfirm()
      } else {
        throw new Error(response?.error?.message || "发送交易失败")
      }
    } catch (err: any) {
      console.error("发送交易失败:", err)
      setError(err.message || "发送交易失败")
    } finally {
      setSending(false)
    }
  }

  const handleReject = async () => {
    await chrome.storage.local.set({ transactionRequest: null })
    onReject()
  }

  return (
    <div className="p-5 w-[320px] bg-gray-50 min-h-[220px]">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">交易确认</h2>
      </div>

      <div className="bg-white  mb-4">
        <div className="mb-3 border border-gray-200 rounded-lg p-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            网络
          </label>
          <div className="text-sm text-gray-900 font-mono break-all">
            {displayOrigin}
          </div>
        </div>
        <div className="mb-3 border border-gray-200 rounded-lg p-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            发送账户
          </label>
          <div className="text-sm text-gray-900 font-mono break-all">
            {wallet?.address}
          </div>
        </div>

        <div className="mb-3 border border-gray-200 rounded-lg p-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            接收地址
          </label>
          <div className="text-sm text-gray-900 font-mono break-all">
            {request.to}
          </div>
        </div>

        <div className="mb-3 border border-gray-200 rounded-lg p-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            金额
          </label>
          <div className="text-xl font-bold text-gray-900">
            {formatValue(request.value)} {currentNetwork.currency}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleReject}
          disabled={sending}
          className="flex-1 py-2.5 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50">
          拒绝
        </button>
        <button
          onClick={handleSend}
          disabled={sending}
          className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
          {sending ? "发送中..." : "发送"}
        </button>
      </div>
    </div>
  )
}
