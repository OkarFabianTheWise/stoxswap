import { useState, useEffect, useCallback } from "react";

// Base chain configuration
const BASE_CHAIN_CONFIG = {
  chainId: '0x2105', // 8453 in hex
  chainName: 'Base',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
};

// Phantom provider interface
interface PhantomProvider {
  isPhantom?: boolean;
  request: (request: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  chainId?: string;
}

declare global {
  interface Window {
    phantom?: {
      ethereum?: PhantomProvider;
    };
  }
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: string | null;
  provider: PhantomProvider | null;
  error: string | null;
  isPhantom: boolean;
}

export function usePhantomWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    provider: null,
    error: null,
    isPhantom: false,
  });

  // Get Phantom provider
  const getProvider = useCallback((): PhantomProvider | null => {
    if (typeof window === 'undefined') return null;

    // Check for Phantom at window.phantom.ethereum
    if (window.phantom?.ethereum?.isPhantom) {
      return window.phantom.ethereum;
    }

    // Fallback: check window.ethereum with isPhantom flag (cast to any to handle type conflicts)
    if ((window as any).ethereum?.isPhantom) {
      return (window as any).ethereum;
    }

    return null;
  }, []);

  // Check if Phantom is installed
  const isPhantomInstalled = useCallback(() => {
    return getProvider() !== null;
  }, [getProvider]);

  // Connect to Phantom wallet
  const connect = useCallback(async () => {
    try {
      const provider = getProvider();
      
      if (!provider) {
        throw new Error('Phantom wallet not found. Please install Phantom extension.');
      }

      // Request account access
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please ensure Phantom is unlocked.');
      }

      const address = accounts[0];
      
      // Get current chain ID
      const chainId = await provider.request({
        method: 'eth_chainId',
      });

      setWalletState({
        isConnected: true,
        address,
        chainId,
        provider,
        error: null,
        isPhantom: true,
      });

      return { address, chainId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setWalletState(prev => ({
        ...prev,
        error: errorMessage,
        isConnected: false,
      }));
      throw new Error(errorMessage);
    }
  }, [getProvider]);

  // Switch to Base chain
  const switchToBase = useCallback(async () => {
    try {
      const provider = getProvider();
      if (!provider) {
        throw new Error('Phantom wallet not found');
      }

      try {
        // Try to switch to Base chain
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: BASE_CHAIN_CONFIG.chainId }],
        });
      } catch (switchError: any) {
        // If Base chain is not added, add it
        if (switchError.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_CHAIN_CONFIG],
          });
        } else {
          throw switchError;
        }
      }

      // Update chain ID in state
      setWalletState(prev => ({
        ...prev,
        chainId: BASE_CHAIN_CONFIG.chainId,
        error: null,
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch to Base chain';
      setWalletState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  }, [getProvider]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setWalletState({
      isConnected: false,
      address: null,
      chainId: null,
      provider: null,
      error: null,
      isPhantom: false,
    });
  }, []);

  // Send transaction
  const sendTransaction = useCallback(async (txParams: {
    to: string;
    value?: string;
    data?: string;
    gasLimit?: string;
    gasPrice?: string;
  }) => {
    try {
      const provider = getProvider();
      if (!provider || !walletState.address) {
        throw new Error('Wallet not connected');
      }

      const transaction = {
        from: walletState.address,
        to: txParams.to,
        value: txParams.value || '0x0',
        data: txParams.data || '0x',
        gasLimit: txParams.gasLimit,
        gasPrice: txParams.gasPrice,
      };

      // Remove undefined values
      Object.keys(transaction).forEach(key => {
        if (transaction[key as keyof typeof transaction] === undefined) {
          delete transaction[key as keyof typeof transaction];
        }
      });

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [transaction],
      });

      return txHash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      setWalletState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  }, [getProvider, walletState.address]);

  // Sign message
  const signMessage = useCallback(async (message: string) => {
    try {
      const provider = getProvider();
      if (!provider || !walletState.address) {
        throw new Error('Wallet not connected');
      }

      const msgHex = `0x${Buffer.from(message, 'utf8').toString('hex')}`;
      const signature = await provider.request({
        method: 'personal_sign',
        params: [msgHex, walletState.address],
      });

      return signature;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Message signing failed';
      setWalletState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  }, [getProvider, walletState.address]);

  // Check if on Base chain
  const isOnBaseChain = useCallback(() => {
    return walletState.chainId === BASE_CHAIN_CONFIG.chainId;
  }, [walletState.chainId]);

  // Setup event listeners
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setWalletState(prev => ({
          ...prev,
          address: accounts[0],
          error: null,
        }));
      }
    };

    const handleChainChanged = (chainId: string) => {
      setWalletState(prev => ({
        ...prev,
        chainId,
        error: null,
      }));
    };

    const handleDisconnect = () => {
      disconnect();
    };

    // Add event listeners
    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);
    provider.on('disconnect', handleDisconnect);

    // Cleanup event listeners
    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
      provider.removeListener('disconnect', handleDisconnect);
    };
  }, [getProvider, disconnect]);

  // Auto-connect if already connected
  useEffect(() => {
    const autoConnect = async () => {
      try {
        const provider = getProvider();
        if (!provider) return;

        // Check if already connected
        const accounts = await provider.request({
          method: 'eth_accounts',
        });

        if (accounts.length > 0) {
          const chainId = await provider.request({
            method: 'eth_chainId',
          });

          setWalletState({
            isConnected: true,
            address: accounts[0],
            chainId,
            provider,
            error: null,
            isPhantom: true,
          });
        }
      } catch (error) {
        console.log('Auto-connect failed:', error);
      }
    };

    autoConnect();
  }, [getProvider]);

  return {
    ...walletState,
    isPhantomInstalled: isPhantomInstalled(),
    isOnBaseChain: isOnBaseChain(),
    connect,
    disconnect,
    switchToBase,
    sendTransaction,
    signMessage,
  };
}