import { useState } from "react"

import { useWalletStore } from "~stores/wallet"
import type { PopupRoute } from "~types"

interface CreateWalletProps {
  onBack: () => void
  onNavigate?: (route: PopupRoute) => void
}

export default function CreateWallet({
  onBack,
  onNavigate
}: CreateWalletProps) {
  const { createWallet, wallet, mnemonic } = useWalletStore()
  const [isCreating, setIsCreating] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [copied, setCopied] = useState(false)
  const [addressCopied, setAddressCopied] = useState(false)

  const handleCreate = async () => {
    if (!password.trim() || password.length < 8) {
      alert("请输入至少8位字符的密码")
      return
    }
    setIsCreating(true)
    try {
      await createWallet()
      // 存储密码到 store
      setPassword(password)
      if (onNavigate) {
        onNavigate("show")
      }
    } catch (error) {
      console.error("创建钱包失败:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="p-5 w-[320px] bg-gray-50 min-h-[220px]">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
        ← 返回
      </button>
      <h2 className="text-xl font-bold text-gray-900 mb-4">创建新钱包</h2>

      {wallet ? (
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-4">
          <div className="rounded-xl border border-yellow-900  p-4 mb-4">
            <div className="text-sm font-medium text-yellow mb-2">
              ⚠️ 请妥善保管助记词
            </div>
            <div className="text-xs text-yellow">
              助记词一旦泄露，资产可能被盗。建议离线抄写，不要截图/云端同步。
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">
              您的助记词
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mnemonic?.split(" ").map((word, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-2 rounded text-sm text-gray-800">
                  <span className="text-xs text-gray-500 mr-1">
                    {index + 1}.
                  </span>
                  {word}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              if (mnemonic) {
                navigator.clipboard.writeText(mnemonic)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }
            }}
            className="w-full mb-4 py-3 px-4 rounded-lg bg-green-500 text-white hover:bg-green-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
            {copied ? "已复制" : "复制助记词"}
          </button>

          <p className="text-sm text-green-800 font-medium">钱包创建成功！</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-green-600">
              地址：{wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
            </p>
            <button
              onClick={() => {
                if (wallet.address) {
                  navigator.clipboard.writeText(wallet.address)
                  setAddressCopied(true)
                  setTimeout(() => setAddressCopied(false), 2000)
                }
              }}
              className="text-xs text-blue-500 hover:text-blue-600 transition">
              {addressCopied ? "已复制" : "复制"}
            </button>
          </div>
        </div>
      ) : (
        <div className="my-4">
          <div className="text-sm  mb-2">设置密码</div>
          <input
            type="password"
            placeholder="至少8位字符"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border  px-3 py-2 text-sm  placeholder:text-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
      )}

      {password.length > 0 && password.length < 8 && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">密码至少需要8位字符</p>
        </div>
      )}

      <button
        onClick={() => {
          if (wallet) {
            // 钱包已创建，点击跳转到钱包展示页面
            if (onNavigate) {
              onNavigate("show")
            } else {
              onBack()
            }
          } else {
            handleCreate() // 钱包未创建，执行创建操作
          }
        }}
        disabled={
          isCreating ||
          (!password.trim() && !wallet) ||
          (password.length < 8 && !wallet)
        }
        className="w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-600 disabled:opacity-70 disabled:pointer-events-none hover:bg-blue-600 bg-blue-500 text-white"
        style={{
          backgroundColor:
            isCreating ||
            (!password.trim() && !wallet) ||
            (password.length < 8 && !wallet)
              ? undefined
              : "#3b82f6",
          color: "white"
        }}>
        {isCreating ? "创建中..." : wallet ? "已完成" : "创建钱包"}
      </button>
    </div>
  )
}
