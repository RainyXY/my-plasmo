/// <reference types="chrome" />

import { ethers } from "ethers"

// 获取存储的钱包数据
async function getWalletData() {
  try {
    // 使用 Plasmo 的 Storage API
    const result = await chrome.storage.local.get(["wallet-store"])
    console.log("[Background] chrome.storage.local 结果:", result)

    const walletStore = (result as any)["wallet-store"]
    console.log("[Background] wallet-store:", walletStore)

    if (walletStore) {
      // walletStore 本身就是 state，不需要再访问 .state
      console.log("[Background] state:", walletStore)
      return walletStore
    }

    // 如果没有 wallet-store，直接返回空对象
    console.log("[Background] 返回空对象")
    return {}
  } catch (error) {
    console.error("[Background] 获取钱包数据失败:", error)
    return {}
  }
}

// 处理 EIP-1193 请求
async function handleEIP1193Request(method: string, params: any[]) {
  console.log("[Background] EIP-1193 请求:", method, params)

  switch (method) {
    case "eth_sendTransaction": {
      return await handleSendTransaction(params[0])
    }

    case "eth_sign": {
      return await handleEthSign(params[0], params[1])
    }

    case "personal_sign": {
      return await handlePersonalSign(params[0], params[1])
    }

    case "eth_signTypedData":
    case "eth_signTypedData_v3":
    case "eth_signTypedData_v4": {
      return await handleSignTypedData(params, method)
    }

    case "wallet_switchEthereumChain": {
      return await handleSwitchEthereumChain(params[0])
    }

    case "wallet_addEthereumChain": {
      return await handleAddEthereumChain(params[0])
    }

    case "eth_requestAccounts": {
      return await handleRequestAccounts()
    }

    case "eth_accounts": {
      return await handleGetAccounts()
    }

    case "eth_chainId": {
      const state = await getWalletData()
      const chainId = state.currentNetwork?.chainId || 1
      return "0x" + chainId.toString(16)
    }

    case "eth_blockNumber": {
      const state = await getWalletData()
      const provider = new ethers.JsonRpcProvider(state.currentNetwork?.rpcUrl)
      const blockNumber = await provider.getBlockNumber()
      return "0x" + blockNumber.toString(16)
    }

    case "eth_getBalance": {
      const state = await getWalletData()
      const provider = new ethers.JsonRpcProvider(state.currentNetwork?.rpcUrl)
      const address = params[0]
      const balance = await provider.getBalance(address)
      return "0x" + balance.toString(16)
    }

    default:
      throw new Error(`不支持的方法：${method}`)
  }
}

// 处理发送交易
async function handleSendTransaction(transaction: {
  from: string
  to: string
  value?: string
  data?: string
  gas?: string
  gasPrice?: string
}) {
  const state = await getWalletData()

  console.log("[Background] 获取到的钱包数据:", state)
  console.log("[Background] 交易请求:", transaction)

  // 获取私钥
  const mnemonic = state.mnemonic
  if (!mnemonic) {
    console.error(
      "[Background] 助记词为空，storage 数据:",
      JSON.stringify(state, null, 2)
    )
    throw new Error("钱包未初始化")
  }

  // 从助记词推导钱包
  const wallet = ethers.HDNodeWallet.fromPhrase(
    mnemonic,
    "",
    "m/44'/60'/0'/0/0"
  )

  if (wallet.address.toLowerCase() !== transaction.from.toLowerCase()) {
    throw new Error("发送地址不匹配")
  }

  // 创建 provider 和交易请求
  const provider = new ethers.JsonRpcProvider(state.currentNetwork?.rpcUrl)

  const txRequest = {
    to: transaction.to,
    value: transaction.value,
    data: transaction.data || "0x",
    gasLimit: transaction.gas ? BigInt(transaction.gas) : undefined,
    gasPrice: transaction.gasPrice ? BigInt(transaction.gasPrice) : undefined
  }

  // 估算 gas
  if (!txRequest.gasLimit) {
    try {
      const estimatedGas = await provider.estimateGas({
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
        data: txRequest.data
      })
      txRequest.gasLimit = BigInt(Math.floor(Number(estimatedGas) * 1.2)) // 增加 20% 缓冲
    } catch (error: any) {
      throw new Error(`Gas 估算失败：${error.message}`)
    }
  }

  // 获取 gas 价格
  if (!txRequest.gasPrice) {
    const feeData = await provider.getFeeData()
    txRequest.gasPrice = feeData.gasPrice || feeData.maxFeePerGas
  }

  // 获取 nonce
  const nonce = await provider.getTransactionCount(transaction.from, "pending")

  // 签名并发送交易
  const tx = await wallet.populateTransaction({
    ...txRequest,
    nonce,
    chainId: state.currentNetwork?.chainId
  })

  const signedTx = await wallet.signTransaction(tx)
  const txResponse = await provider.broadcastTransaction(signedTx)

  console.log("[Background] 交易已发送:", txResponse.hash)

  return txResponse.hash
}

// 处理 eth_sign
async function handleEthSign(address: string, message: string) {
  const state = await getWalletData()

  const mnemonic = state.mnemonic
  if (!mnemonic) {
    throw new Error("钱包未初始化")
  }

  const wallet = ethers.HDNodeWallet.fromPhrase(
    mnemonic,
    "",
    "m/44'/60'/0'/0/0"
  )

  if (wallet.address.toLowerCase() !== address.toLowerCase()) {
    throw new Error("地址不匹配")
  }

  // 添加以太坊签名前缀
  const messageBytes = ethers.toUtf8Bytes(
    "\x19Ethereum Signed Message:\n" + message.length + message
  )
  const signature = wallet.signingKey.sign(messageBytes)

  return ethers.Signature.from(signature).serialized
}

// 处理 personal_sign
async function handlePersonalSign(message: string, address: string) {
  const state = await getWalletData()

  const mnemonic = state.mnemonic
  if (!mnemonic) {
    throw new Error("钱包未初始化")
  }

  const wallet = ethers.HDNodeWallet.fromPhrase(
    mnemonic,
    "",
    "m/44'/60'/0'/0/0"
  )

  if (wallet.address.toLowerCase() !== address.toLowerCase()) {
    throw new Error("地址不匹配")
  }

  const signature = await wallet.signMessage(message)
  return signature
}

// 处理签名类型化数据
async function handleSignTypedData(params: any[], method: string) {
  const state = await getWalletData()

  let address: string
  let typedData: any

  if (method === "eth_signTypedData_v4") {
    address = params[0]
    typedData = JSON.parse(params[1])
  } else {
    // v3 或其他版本
    address = params[1]
    typedData = params[0]
  }

  const mnemonic = state.mnemonic
  if (!mnemonic) {
    throw new Error("钱包未初始化")
  }

  const wallet = ethers.HDNodeWallet.fromPhrase(
    mnemonic,
    "",
    "m/44'/60'/0'/0/0"
  )

  if (wallet.address.toLowerCase() !== address.toLowerCase()) {
    throw new Error("地址不匹配")
  }

  const signature = await wallet.signTypedData(
    typedData.domain,
    typedData.types,
    typedData.message
  )

  return signature
}

// 处理切换网络
async function handleSwitchEthereumChain(params: { chainId: string }) {
  const chainId = parseInt(params.chainId, 16)
  const state = await getWalletData()

  const network = state.networks?.find((n: any) => n.chainId === chainId)

  if (!network) {
    throw new Error(`未找到 Chain ID 为 ${chainId} 的网络`)
  }

  // 更新当前网络
  // @ts-ignore
  await chrome.storage.local.set({
    "wallet-store": {
      state: {
        ...state,
        currentNetwork: network
      }
    }
  })

  // 通知 popup 网络已切换
  // @ts-ignore
  chrome.runtime.sendMessage({
    type: "NETWORK_CHANGED",
    networkId: network.id
  })

  return null
}

// 处理添加网络
async function handleAddEthereumChain(params: {
  chainId: string
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls?: string[]
}) {
  const chainId = parseInt(params.chainId, 16)
  const state = await getWalletData()

  // 检查网络是否已存在
  const existingNetwork = state.networks?.find(
    (n: any) => n.chainId === chainId
  )

  if (existingNetwork) {
    // 网络已存在，直接切换
    await handleSwitchEthereumChain({ chainId: params.chainId })
    return null
  }

  // 创建新网络
  const newNetwork = {
    id: `custom-${chainId}`,
    name: params.chainName,
    chainId: chainId,
    rpcUrl: params.rpcUrls[0],
    currency: params.nativeCurrency.symbol,
    blockExplorer: params.blockExplorerUrls?.[0]
  }

  // 添加到网络列表
  const updatedNetworks = [...(state.networks || []), newNetwork]

  // @ts-ignore
  await chrome.storage.local.set({
    "wallet-store": {
      state: {
        ...state,
        networks: updatedNetworks,
        currentNetwork: newNetwork
      }
    }
  })

  // 通知 popup 网络列表已更新
  // @ts-ignore
  chrome.runtime.sendMessage({
    type: "NETWORKS_UPDATED",
    networks: updatedNetworks
  })

  return null
}

// 处理请求账户访问
async function handleRequestAccounts() {
  // 检查是否有账户
  const state = await getWalletData()

  if (!state.address) {
    throw new Error("没有可用的账户")
  }

  return [state.address]
}

// 处理获取账户列表
async function handleGetAccounts() {
  const state = await getWalletData()

  if (!state.address) {
    return []
  }

  return [state.address]
}

// 监听所有消息
// @ts-ignore
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  console.log("[Background] 收到消息:", msg.type, msg)

  // 处理 EIP-1193 请求
  if (msg.type === "EIP1193_REQUEST") {
    handleEIP1193Request(msg.method, msg.params || [])
      .then((result) => {
        console.log("[Background] 请求成功:", result)
        sendResponse({ success: true, result })
      })
      .catch((error) => {
        console.error("[Background] 请求失败:", error)
        sendResponse({ success: false, error: { message: error.message } })
      })
    return true // 保持消息通道开启（异步响应）
  }

  // 处理 Popup 路由设置
  if (msg.type === "POPUP_SET_ROUTE") {
    // @ts-ignore
    chrome.storage.local.set({ currentRoute: msg.route })
    sendResponse({ success: true })
    return
  }

  // 处理 Popup 路由获取
  if (msg.type === "POPUP_GET_ROUTE") {
    // @ts-ignore
    chrome.storage.local.get("currentRoute").then((result) => {
      sendResponse({ route: result.currentRoute || "main" })
    })
    return true
  }

  // 处理钱包解锁通知
  if (msg.type === "WALLET_UNLOCKED") {
    console.log("[Background] 收到钱包解锁通知:", msg.address)
    sendResponse({ success: true })
    return
  }

  // 处理钱包锁定通知
  if (msg.type === "WALLET_LOCKED") {
    console.log("[Background] 收到钱包锁定通知:", msg.address)
    sendResponse({ success: true })
    return
  }

  // 处理其他消息
  switch (msg.type) {
    case "POPUP_TO_BACKGROUND":
      sendResponse(`✅ 后台已收到：${msg.data}`)
      break

    case "CONTENT_TO_BACKGROUND":
      sendResponse(`✅ 后台收到页面消息：${msg.data}`)
      break
  }
})

console.log("[Background] Service Worker 已启动")

// 扩展安装或更新时触发
// @ts-ignore
browser.runtime.onInstalled.addListener((details) => {
  console.log("[Background] 扩展已安装/更新:", details.reason)

  // 初始化默认路由
  // @ts-ignore
  browser.storage.local.set({ currentRoute: "main" })
})
