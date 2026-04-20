import { formatEther, JsonRpcProvider } from "ethers"
import { useEffect, useState } from "react"

import { useWalletStore } from "~stores/wallet"

export function useBalance() {
  const { wallet, currentNetwork } = useWalletStore()
  const [balance, setBalance] = useState<string>("0")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = async () => {
    if (!wallet?.address) {
      setBalance("0")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const provider = new JsonRpcProvider(currentNetwork.rpcUrl)
      const balanceResult = await provider.getBalance(wallet.address)
      console.log(
        "获取余额成功:",
        balanceResult,
        parseFloat(formatEther(balanceResult)).toFixed(6)
      )
      setBalance(parseFloat(formatEther(balanceResult)).toFixed(6))
    } catch (err) {
      console.error("获取余额失败:", err)
      setError("获取余额失败")
      setBalance("0")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [wallet?.address, currentNetwork.rpcUrl])

  return { balance, loading, error, refreshBalance: fetchBalance }
}
