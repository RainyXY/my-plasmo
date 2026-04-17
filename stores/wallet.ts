import * as bip39 from "bip39"
import { HDNodeWallet, JsonRpcProvider } from "ethers"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { Network } from "~types"
import { DEFAULT_NETWORKS } from "~types"

interface WalletStore {
  mnemonic: string | null
  address: string | null
  wallet?: HDNodeWallet | null
  currentNetwork: Network
  networks: Network[]
  isLocked: boolean
  password: string | null
  setMnemonic: (mnemonic: string | null) => void
  setAddress: (address: string | null) => void
  setWallet: (wallet: HDNodeWallet | null) => void
  setCurrentNetwork: (network: Network) => void
  addNetwork: (network: Network) => void
  switchNetwork: (networkId: string) => void
  setPassword: (password: string | null) => void
  createWallet: () => Promise<void>
  unlockWallet: (password: string) => Promise<boolean>
  lockWallet: () => Promise<void>
}
const default_path = "m/44'/60'/0'/0/0"
export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      mnemonic: null,
      address: null,
      wallet: null,
      currentNetwork: DEFAULT_NETWORKS[0],
      networks: DEFAULT_NETWORKS,
      isLocked: false,
      password: null,
      setMnemonic: (mnemonic) => set({ mnemonic }),
      setAddress: (address) => set({ address }),
      setWallet: (wallet) => set({ wallet }),
      setCurrentNetwork: (network) => set({ currentNetwork: network }),
      setPassword: (password) => set({ password }),
      addNetwork: (network: Network) => {
        set(state => ({
          networks: [...state.networks, network]
        }))
      },
      switchNetwork: (networkId: string) => {
        const state = get()
        const network = state.networks.find(net => net.id === networkId)
        if (network) {
          set({ currentNetwork: network })
        }
      },
      createWallet: async () => {
        const mnemonic = await bip39.generateMnemonic(128)
        const wallet = HDNodeWallet.fromPhrase(mnemonic, "", default_path)
        const walletObj = { ...wallet, privateKey: wallet.privateKey }
        set({
          wallet: walletObj as HDNodeWallet,
          mnemonic,
          address: wallet.address
        })
      },
      unlockWallet: async (password: string) => {
        // 简单的密码验证
        if (get().password === password) {
          set({ isLocked: false })
          return true
        }
        return false
      },
      lockWallet: async () => {
        set({ isLocked: true })
      }
    }),
    {
      name: "wallet-store",
      partialize: (state) => ({
        mnemonic: state.mnemonic,
        address: state.address,
        wallet: state.wallet,
        currentNetwork: state.currentNetwork,
        networks: state.networks,
        password: state.password
      })
    }
  )
)
