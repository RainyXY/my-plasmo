import { useEffect, useState } from "react"

import ConfirmTransaction from "~pages/ConfirmTransaction"
import CreateWallet from "~pages/CreateWallet"
import ImportWallet from "~pages/ImportWallet"
import NetworksPage from "~pages/NetworksPage"
import NFTs from "~pages/NFTs"
import Receive from "~pages/Receive"
import Send from "~pages/Send"
import Tokens from "~pages/Tokens"
import WalletShow from "~pages/WalletShow"

import "./style.css" // 引入样式

import { useWalletStore } from "~stores/wallet"
import type { PopupRoute } from "~types"

export default function Popup() {
  const { wallet } = useWalletStore()
  const [currentRoute, setCurrentRoute] = useState<PopupRoute>("main")
  const [message, setMessage] = useState("")
  const [response, setResponse] = useState("")
  const [transactionRequest, setTransactionRequest] = useState<any>(null)

  // 页面加载时检查是否已有钱包
  useEffect(() => {
    if (wallet) {
      setCurrentRoute("show")
    }
  }, [wallet])

  // 加载交易请求
  useEffect(() => {
    if (currentRoute === "transaction") {
      chrome.storage.local.get("transactionRequest").then((result) => {
        if (result.transactionRequest) {
          setTransactionRequest(result.transactionRequest)
        }
      })
    }
  }, [currentRoute])

  const onNavigate = (route: PopupRoute) => {
    setCurrentRoute(route)
  }

  const onBack = (to?: PopupRoute) => {
    if (to) {
      setCurrentRoute(to)
    } else {
      setCurrentRoute("main")
    }
  }

  // 发给 Background
  const sendToBackground = async () => {
    const res = await chrome.runtime.sendMessage({
      type: "POPUP_TO_BACKGROUND",
      data: message
    })
    setResponse(res)
  }

  // 发给当前页面 Content
  const sendToContent = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    })
    if (!tab.id) return

    try {
      const res = await chrome.tabs.sendMessage(tab.id, {
        type: "POPUP_TO_CONTENT",
        data: message
      })
      setResponse(res)
    } catch (e) {
      setResponse("❌ 页面未加载插件，请刷新网页后重试")
    }
  }

  if (currentRoute === "create") {
    return <CreateWallet onBack={onBack} onNavigate={onNavigate} />
  }

  if (currentRoute === "import") {
    return <ImportWallet onBack={onBack} onNavigate={onNavigate} />
  }

  if (currentRoute === "show") {
    return <WalletShow onBack={onBack} onNavigate={onNavigate} />
  }

  if (currentRoute === "networks") {
    return <NetworksPage onBack={() => onBack("show")} />
  }

  if (currentRoute === "send") {
    return <Send onBack={() => onBack("show")} onNavigate={onNavigate} />
  }

  if (currentRoute === "receive") {
    return <Receive onBack={() => onBack("show")} onNavigate={onNavigate} />
  }

  if (currentRoute === "tokens") {
    return <Tokens onBack={() => onBack("show")} />
  }

  if (currentRoute === "nfts") {
    return <NFTs onBack={() => onBack("show")} />
  }

  if (currentRoute === "transaction" && transactionRequest) {
    return (
      <ConfirmTransaction
        request={transactionRequest}
        onConfirm={() => {
          setTransactionRequest(null)
          onBack("show")
        }}
        onReject={() => {
          setTransactionRequest(null)
          onBack("show")
        }}
      />
    )
  }

  return (
    <div className="p-5 w-[320px] bg-gray-50 min-h-[220px]">
      <button
        className="w-full  my-2  rounded-lg bg-blue-500 text-white px-4 py-3 text-sm font-medium text-black hover:bg-blue-600 transition-colors shadow-lg shadow-accent/20"
        onClick={() => onNavigate("create")}>
        创建新钱包
      </button>

      <button
        className="w-full  my-2  rounded-lg  bg-green-500 text-white px-4 py-3 text-sm text-slate-200 hover:bg-green-600 hover:border-accent/50 transition-colors"
        onClick={() => onNavigate("import")}>
        导入钱包
      </button>

      {/* <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="输入要发送的消息"
        className="w-full px-3 py-2 border border-gray-300 rounded mb-3 outline-none focus:ring-2 focus:ring-blue-400"
      />

      <div className="flex gap-2 mb-4">
        <button
          onClick={sendToBackground}
          className="flex-1 bg-blue-500 text-white py-2 px-3 rounded hover:bg-blue-600 transition">
          发给后台
        </button>
        <button
          onClick={sendToContent}
          className="flex-1 bg-green-500 text-white py-2 px-3 rounded hover:bg-green-600 transition">
          发给页面
        </button>
      </div>

      {response && (
        <div className="mt-2 p-2 bg-white border rounded text-sm text-gray-700">
          <span className="font-semibold">返回结果：</span> {response}
        </div>
      )} */}
    </div>
  )
}
