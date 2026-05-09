import { Buffer } from 'buffer';
import * as bip39 from 'bip39';
import { HDNodeWallet, JsonRpcProvider } from 'ethers';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

globalThis.Buffer = Buffer;

import type { Network, Token } from '../entrypoints/popup/types';
import { DEFAULT_NETWORKS } from '../entrypoints/popup/types';

interface NFT {
  contractAddress: string;
  tokenId: string;
  name?: string;
  description?: string;
  image?: string;
  metadata?: any;
}

interface NFTCollection {
  contractAddress: string;
  nfts: NFT[];
}

const chromeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        const result = await chrome.storage.local.get(name);
        const value = result[name];
        return typeof value === 'string' ? value : null;
      } else {
        // 开发环境降级到 localStorage
        return localStorage.getItem(name);
      }
    } catch (error) {
      console.warn('[Storage] getItem failed, using localStorage:', error);
      return localStorage.getItem(name);
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({ [name]: value });
      } else {
        // 开发环境降级到 localStorage
        localStorage.setItem(name, value);
      }
    } catch (error) {
      console.warn('[Storage] setItem failed, using localStorage:', error);
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.remove(name);
      } else {
        // 开发环境降级到 localStorage
        localStorage.removeItem(name);
      }
    } catch (error) {
      console.warn('[Storage] removeItem failed, using localStorage:', error);
      localStorage.removeItem(name);
    }
  },
};

interface WalletStore {
  mnemonic: string | null;
  address: string | null;
  wallet?: HDNodeWallet | null;
  currentNetwork: Network;
  networks: Network[];
  isLocked: boolean;
  password: string | null;
  nftCollections: NFTCollection[];
  tokens: Token[];
  setMnemonic: (mnemonic: string | null) => void;
  setAddress: (address: string | null) => void;
  setWallet: (wallet: HDNodeWallet | null) => void;
  setCurrentNetwork: (network: Network) => void;
  addNetwork: (network: Network) => void;
  switchNetwork: (networkId: string) => void;
  setPassword: (password: string | null) => void;
  addNFT: (nft: NFT) => void;
  removeNFT: (contractAddress: string, tokenId: string) => void;
  addToken: (token: Token) => void;
  removeToken: (address: string, networkId: string) => void;
  getProvider: () => JsonRpcProvider | null;
  createWallet: () => Promise<void>;
  unlockWallet: (password: string) => Promise<boolean>;
  lockWallet: () => Promise<void>;
}
const default_path = "m/44'/60'/0'/0/0";
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
      nftCollections: [],
      tokens: [],
      setMnemonic: (mnemonic) => set({ mnemonic }),
      setAddress: (address) => set({ address }),
      setWallet: (wallet) => set({ wallet }),
      setCurrentNetwork: (network) => set({ currentNetwork: network }),
      setPassword: (password) => set({ password }),
      addNetwork: (network: Network) => {
        set((state) => ({
          networks: [...state.networks, network],
        }));
      },
      switchNetwork: (networkId: string) => {
        const state = get();
        const network = state.networks.find((net) => net.id === networkId);
        if (network) {
          set({ currentNetwork: network });
        }
      },
      addNFT: (nft: NFT) => {
        set((state) => {
          const collection = state.nftCollections.find(
            (col) => col.contractAddress.toLowerCase() === nft.contractAddress.toLowerCase()
          );
          console.log('collection3333: ', collection);
          if (collection) {
            const existingNFT = collection.nfts.find((n) => n.tokenId === nft.tokenId);
            if (!existingNFT) {
              return {
                nftCollections: state.nftCollections.map((col) =>
                  col.contractAddress.toLowerCase() === nft.contractAddress.toLowerCase()
                    ? { ...col, nfts: [...col.nfts, nft] }
                    : col
                ),
              };
            }
            return state;
          } else {
            return {
              nftCollections: [
                ...state.nftCollections,
                {
                  contractAddress: nft.contractAddress,
                  nfts: [nft],
                },
              ],
            };
          }
        });
      },
      removeNFT: (contractAddress: string, tokenId: string) => {
        set((state) => ({
          nftCollections: state.nftCollections
            .map((collection) =>
              collection.contractAddress.toLowerCase() === contractAddress.toLowerCase()
                ? {
                    ...collection,
                    nfts: collection.nfts.filter((nft) => nft.tokenId !== tokenId),
                  }
                : collection
            )
            .filter((collection) => collection.nfts.length > 0),
        }));
      },
      addToken: (token: Token) => {
        set((state) => {
          const existingToken = state.tokens.find(
            (t) =>
              t.address.toLowerCase() === token.address.toLowerCase() &&
              t.networkId === token.networkId
          );
          if (existingToken) {
            return state;
          }
          return { tokens: [...state.tokens, token] };
        });
      },
      removeToken: (address: string, networkId: string) => {
        set((state) => ({
          tokens: state.tokens.filter(
            (t) => !(t.address.toLowerCase() === address.toLowerCase() && t.networkId === networkId)
          ),
        }));
      },
      getProvider: () => {
        const state = get();
        try {
          const provider = new JsonRpcProvider(state.currentNetwork.rpcUrl, {
            name: state.currentNetwork.name,
            chainId: state.currentNetwork.chainId,
          });
          return provider;
        } catch (error) {
          console.error('Failed to create provider:', error);
          return null;
        }
      },
      createWallet: async () => {
        const mnemonic = await bip39.generateMnemonic(128);
        const wallet = HDNodeWallet.fromPhrase(mnemonic, '', default_path);
        set({
          wallet,
          mnemonic,
          address: wallet.address,
        });
      },
      unlockWallet: async (password: string) => {
        // 简单的密码验证
        if (get().password === password) {
          set({ isLocked: false });
          return true;
        }
        return false;
      },
      lockWallet: async () => {
        set({ isLocked: true });
      },
    }),
    {
      name: 'wallet-store',
      storage: createJSONStorage(() => chromeStorage),
      partialize: (state) => ({
        mnemonic: state.mnemonic,
        address: state.address,
        // wallet 对象不持久化，启动时从 mnemonic 重建
        currentNetwork: state.currentNetwork,
        networks: state.networks,
        password: state.password,
        nftCollections: state.nftCollections,
        tokens: state.tokens,
      }),
      onRehydrateStorage: () => (state) => {
        // 从 storage 恢复后，如果有 mnemonic 则重建 wallet 对象
        if (state?.mnemonic && !state.wallet) {
          try {
            const wallet = HDNodeWallet.fromPhrase(state.mnemonic, '', default_path);
            state.wallet = wallet;
          } catch (e) {
            console.error('[WalletStore] 从助记词重建钱包失败:', e);
          }
        }
      },
    }
  )
);
