import { useWalletStore } from "~stores/wallet"
import type { PopupRoute } from "~types"

interface NetworksPageProps {
  onBack: () => void
}

export default function NetworksPage({ onBack }: NetworksPageProps) {
  const { currentNetwork, networks, switchNetwork } = useWalletStore()

  return (
    <div className="p-5 w-[320px] bg-gray-50 min-h-[220px]">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
        ← 返回
      </button>

      <h2 className="text-xl font-bold text-gray-900 mb-4">选择网络</h2>

      <div className="space-y-2">
        {networks.map((network) => (
          <div
            key={network.id}
            onClick={() => {
              switchNetwork(network.id)
              onBack()
            }}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              currentNetwork.id === network.id
                ? "bg-blue-100 border border-blue-500"
                : "bg-white border border-gray-200 hover:bg-gray-50"
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {network.name}
                </div>
                <div className="text-xs text-gray-500">
                  Chain ID: {network.chainId}
                </div>
              </div>
              {currentNetwork.id === network.id && (
                <div className="text-blue-500">✓</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 py-2 px-4 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition">
        添加自定义网络
      </button>
    </div>
  )
}
