import { useState } from "react"

import { useBalance } from "~hooks/useBalance"
import { useWalletStore } from "~stores/wallet"
import type { PopupRoute } from "~types"

interface WalletShowProps {
  onBack: () => void
  onNavigate?: (route: PopupRoute) => void
}

export default function WalletShow({ onNavigate }: WalletShowProps) {
  const { wallet, mnemonic, currentNetwork } = useWalletStore()
  const { balance, loading } = useBalance()
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [mnemonicCopied, setMnemonicCopied] = useState(false)

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
          <div className="text-sm text-gray-600 mb-2">余额</div>
          <button
            onClick={() => onNavigate?.("networks")}
            className="text-xs text-blue-500 hover:text-blue-600 transition">
            {currentNetwork.name}
          </button>
        </div>

        <div className="text-2xl font-bold text-gray-900">
          {loading ? "加载中..." : balance} {currentNetwork.currency}
        </div>
        {/* <div className="text-xs text-gray-500 mt-1">
          ≈ ${(parseFloat(balance) * 2000).toFixed(2)} USD
        </div> */}
      </div>

      {mnemonic && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-700">助记词</div>
            <button
              onClick={() => setShowMnemonic(!showMnemonic)}
              className="text-xs text-blue-500 hover:text-blue-600 transition">
              {showMnemonic ? "隐藏" : "显示"}
            </button>
          </div>

          {showMnemonic && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="grid grid-cols-3 gap-2">
                {mnemonic.split(" ").map((word, index) => (
                  <div
                    key={index}
                    className="bg-white p-2 rounded text-xs text-gray-800 text-center border border-gray-200">
                    <span className="text-gray-500 mr-1">{index + 1}.</span>
                    {word}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(mnemonic)
                  setMnemonicCopied(true)
                  setTimeout(() => setMnemonicCopied(false), 2000)
                }}
                className="mt-3 w-full text-xs text-blue-500 hover:text-blue-600 transition">
                {mnemonicCopied ? "已复制" : "复制助记词"}
              </button>
            </div>
          )}

          {!showMnemonic && (
            <div className="text-xs text-gray-500 text-center py-4">
              点击"显示"查看助记词
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onNavigate?.("send")}
          className="flex-1 bg-blue-500 text-white py-2 px-3 rounded hover:bg-blue-600 transition">
          发送
        </button>
        <button
          onClick={() => onNavigate?.("receive")}
          className="flex-1 bg-green-500 text-white py-2 px-3 rounded hover:bg-green-600 transition">
          收款
        </button>
        <button
          onClick={() => onNavigate?.("tokens")}
          className="flex-1 bg-red-500 text-white py-2 px-3 rounded hover:bg-red-600 transition">
          代币
        </button>
        <button
          onClick={() => onNavigate?.("nfts")}
          className="flex-1 bg-yellow-500 text-white py-2 px-3 rounded hover:bg-yellow-600 transition">
          NFT
        </button>
      </div>
    </div>
  )
}
