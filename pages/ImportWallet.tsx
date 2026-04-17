import * as bip39 from "bip39"
import { HDNodeWallet, Wallet } from "ethers"
import { useState } from "react"

import { useWalletStore } from "~stores/wallet"
import type { PopupRoute } from "~types"

interface ImportWalletProps {
  onBack: () => void
  onNavigate?: (route: PopupRoute) => void
}

export default function ImportWallet({
  onBack,
  onNavigate
}: ImportWalletProps) {
  const {
    setMnemonic: saveMnemonic,
    setAddress,
    setWallet,
    wallet,
    setPassword: setWalletPassword
  } = useWalletStore()
  const [mnemonic, setMnemonic] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [importType, setImportType] = useState<"mnemonic" | "privateKey">(
    "mnemonic"
  )
  const [error, setError] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [password, setPassword] = useState("")

  const validateMnemonic = (phrase: string): boolean => {
    return bip39.validateMnemonic(phrase.trim())
  }

  const handleImportByMnemonic = async () => {
    setError("")
    const trimmedMnemonic = mnemonic.trim()

    if (!trimmedMnemonic) {
      setError("请输入助记词")
      return
    }

    if (!validateMnemonic(trimmedMnemonic)) {
      setError("助记词无效，请检查")
      return
    }

    setIsImporting(true)
    try {
      const path = "m/44'/60'/0'/0/0"
      const walletObj = HDNodeWallet.fromPhrase(trimmedMnemonic, "", path)
      console.log("walletObj: ", walletObj)
      saveMnemonic(trimmedMnemonic)
      setAddress(walletObj.address)
      setWallet(walletObj)
      // 存储密码到 store
      setWalletPassword(password)
      console.log("onNavigate2222: ", onNavigate)
      // 导入成功后跳转到钱包展示页面
      if (onNavigate) {
        setTimeout(() => {
          onNavigate("show")
        }, 500)
      }
      console.log("钱包导入成功！")
    } catch (err) {
      console.error("导入钱包失败:", err)
      setError("导入失败，请检查助记词")
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportByPrivateKey = async () => {
    setError("")

    if (!privateKey) {
      setError("请输入私钥")
      return
    }

    setIsImporting(true)
    try {
      const walletObj = new Wallet(privateKey)
      saveMnemonic(null)
      setAddress(walletObj.address)
      setWallet(walletObj as unknown as HDNodeWallet)
      // 存储密码到 store
      setWalletPassword(password)

      // 导入成功后跳转到钱包展示页面
      if (onNavigate) {
        setTimeout(() => {
          onNavigate("show")
        }, 500)
      }
    } catch (err) {
      setError("私钥无效")
    } finally {
      setIsImporting(false)
    }
  }

  const handleSubmit = async () => {
    if (importType === "mnemonic") {
      await handleImportByMnemonic()
    } else {
      await handleImportByPrivateKey()
    }
  }

  return (
    <div className="p-5 w-[320px] bg-gray-50 min-h-[220px]">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
        ← 返回
      </button>

      <h2 className="text-xl font-bold text-gray-900 mb-4">导入钱包</h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setImportType("mnemonic")}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
            importType === "mnemonic"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}>
          助记词
        </button>
        <button
          onClick={() => setImportType("privateKey")}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
            importType === "privateKey"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}>
          私钥
        </button>
      </div>

      {importType === "mnemonic" ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            助记词
          </label>
          <textarea
            value={mnemonic}
            onChange={(e) => setMnemonic(e.target.value)}
            placeholder="请输入12或24个助记词，用空格分隔"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 resize-none h-24"
          />
        </div>
      ) : (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            私钥
          </label>
          <input
            type="password"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="请输入私钥"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {wallet && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-4">
          <p className="text-sm text-green-800 font-medium">钱包导入成功！</p>
          <p className="text-xs text-green-600 mt-1">
            地址：{wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
          </p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isImporting}
        className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
        {isImporting ? "导入中..." : "导入钱包"}
      </button>
    </div>
  )
}
