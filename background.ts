import * as ethers from "ethers"

import { Storage } from "@plasmohq/storage"

console.log("[Background] 脚本开始加载...")

const storage = new Storage()
console.log("[Background] Storage 初始化完成")

interface WalletStoreData {
  mnemonic: string | null
  address: string | null
  wallet: any
  currentNetwork: {
    id: string
    name: string
    chainId: number
    rpcUrl: string
    currency: string
  }
  networks: Array<{
    id: string
    name: string
    chainId: number
    rpcUrl: string
    currency: string
  }>
  password: string | null
}

// 3. 获取当前钱包（从 storage 获取）
// ==============================
export async function getWalletData(): Promise<WalletStoreData | null> {
  const result = await chrome.storage.local.get(["wallet-store"])
  console.log("[Background] storage result:", result)

  const rawData = result["wallet-store"]
  if (!rawData) {
    console.log("[Background] rawData 不存在")
    return null
  }

  const data = typeof rawData === "string" ? JSON.parse(rawData) : rawData
  console.log("[Background] wallet-store data:", data)

  if (!data?.state) {
    console.log("[Background] data.state 不存在, data:", data)
    return null
  }

  return data.state as WalletStoreData
}

// 5. 发送 ETH（核心！自研钱包签名交易）
// ==============================
export async function sendTransaction(params: {
  from: string
  to: string
  value: string
}) {
  const walletData = await getWalletData()
  console.log("walletData: ", walletData)

  if (!walletData) {
    throw new Error("未创建钱包")
  }

  const mnemonic = walletData.mnemonic
  if (!mnemonic) {
    throw new Error("钱包未解锁")
  }

  const currentNetwork = walletData.currentNetwork
  if (!currentNetwork?.rpcUrl) {
    throw new Error("网络配置错误")
  }

  const provider = new ethers.JsonRpcProvider(currentNetwork.rpcUrl)
  console.log(
    "[Background] RPC Provider 创建成功, network:",
    currentNetwork.name,
    "rpcUrl:",
    JSON.stringify(currentNetwork.rpcUrl)
  )
  console.log("[Background] 发送交易... to:", params.to, "value:", params.value)

  const wallet = ethers.HDNodeWallet.fromPhrase(
    mnemonic,
    "",
    "m/44'/60'/0'/0/0"
  ).connect(provider)

  console.log("[Background] Wallet 连接 provider 成功")

  if (wallet.address.toLowerCase() !== params.from.toLowerCase()) {
    throw new Error("发送地址不匹配")
  }

  try {
    console.log("[Background] 开始发送交易...")

    const tx = await wallet.sendTransaction({
      to: params.to,
      value: params.value,
      gasLimit: 21000,
      gasPrice: ethers.parseUnits("1", "gwei")
    })
    console.log("交易哈希:", tx.hash)
    console.log("交易详情:", tx)
    return tx
  } catch (error: any) {
    console.error("[Background] 交易发送失败:", error)
    throw error
  }
}

// ==============================
// 监听前端消息
// ==============================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("[Background] 收到消息:", msg)
  console.log("sendResponse: ", msg, sender, sendResponse)
  ;(async () => {
    switch (msg.type) {
      case "SEND_ETH":
        const txParams = msg.params?.[0]
        sendResponse(await sendTransaction(txParams))
        break
      default:
        sendResponse(null)
    }
  })()
  return true
})
console.log("[Background] Service Worker 已启动")

// 监听扩展安装/更新
chrome.runtime.onInstalled.addListener(() => {
  console.log("扩展已安装 ✅")
})

// 监听标签页更新（可选）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    console.log("页面加载完成：", tab.url)
  }
})
