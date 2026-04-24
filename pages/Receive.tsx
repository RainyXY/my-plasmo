import { QRCodeSVG } from "qrcode.react"
import { useState } from "react"

import { useWalletStore } from "~stores/wallet"
import type { PopupRoute } from "~types"

interface ReceiveProps {
  onBack: () => void
  onNavigate: (route: PopupRoute) => void
}

export default function Receive({ onBack, onNavigate }: ReceiveProps) {
  const { address, currentNetwork } = useWalletStore()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="p-5 w-[320px] bg-gray-50 min-h-[220px]">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
        ← 返回
      </button>

      <h2 className="text-xl font-bold text-gray-900 mb-4">收款</h2>

      <div className="bg-white flex flex-col items-center">
        {address && <QRCodeSVG value={address} size={160} level="M" />}
        <div className="text-xs text-gray-500 mt-2">扫描二维码获取地址</div>

        <div className="mt-4 w-full p-4 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">收款地址</div>
          <span className="text-xs text-gray-700 break-all">{address}</span>
          <button
            onClick={handleCopy}
            className="mt-3 w-full py-2 text-sm font-medium text-blue-500 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
            {copied ? "✓ 已复制" : "复制地址"}
          </button>
        </div>

        <button
          className="text-left mt-4 w-full p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          onClick={() => onNavigate("networks")}>
          <div className="text-xs text-gray-500 mb-1">当前网络</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">
                {currentNetwork.name}
              </div>
              <div className="text-xs text-gray-500">
                Chain ID: {currentNetwork.chainId}
              </div>
            </div>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l4-4 4 4m0 6l-4 4-4-4"
              />
            </svg>
          </div>
        </button>
      </div>
    </div>
  )
}
