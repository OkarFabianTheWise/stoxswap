import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { ArrowLeftRight, Zap, AlertCircle, ExternalLink, Wallet, CheckCircle, Clock } from "lucide-react";
import { FiChevronDown } from "react-icons/fi";
import { useRaindexSwap, QuoteV2, SwapError } from "../hooks/useRaindexSwap";
import { usePhantomWallet } from "../hooks/usePhantomWallet";
import { BASE_TOKENS } from "../config/raindex";

// Base chain token configuration
interface BaseToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  isStablecoin?: boolean;
}

// Swap progress steps
type SwapStep = 
  | "idle" 
  | "getting_quote" 
  | "quote_received" 
  | "checking_allowance" 
  | "approving_token" 
  | "token_approved" 
  | "executing_swap" 
  | "swap_completed" 
  | "error";

interface SwapProgress {
  step: SwapStep;
  message: string;
  data?: any;
}

const SWAP_STEP_MESSAGES: Record<SwapStep, string> = {
  idle: "Ready to swap",
  getting_quote: "Getting best price...",
  quote_received: "Quote received",
  checking_allowance: "Checking token allowance...",
  approving_token: "Approving token spend...",
  token_approved: "Token approved",
  executing_swap: "Executing swap...",
  swap_completed: "Swap completed!",
  error: "Swap failed"
};

interface TokenSelectorProps {
  selectedToken: BaseToken | null;
  onSelect: (token: BaseToken) => void;
  label: string;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ selectedToken, onSelect, label }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 bg-gray-800/50 border border-gray-600/50 rounded-xl flex items-center justify-between hover:border-blue-500/30 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          {selectedToken ? (
            <>
              {selectedToken.logoURI && (
                <img src={selectedToken.logoURI} alt={selectedToken.symbol} className="w-6 h-6 rounded-full" />
              )}
              <span className="text-white font-medium">{selectedToken.symbol}</span>
              <span className="text-gray-400 text-sm">{selectedToken.name}</span>
            </>
          ) : (
            <span className="text-gray-400">Select token</span>
          )}
        </div>
        <FiChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600/50 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto">
          {BASE_TOKENS.map((token) => (
            <button
              key={token.address}
              onClick={() => {
                onSelect(token);
                setIsOpen(false);
              }}
              className="w-full p-3 flex items-center gap-3 hover:bg-gray-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              {token.logoURI && (
                <img src={token.logoURI} alt={token.symbol} className="w-6 h-6 rounded-full" />
              )}
              <div className="flex flex-col items-start">
                <span className="text-white font-medium">{token.symbol}</span>
                <span className="text-gray-400 text-xs">{token.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function BaseSwap() {
  const { user, isAuthenticated } = useAuth();
  const [fromToken, setFromToken] = useState<BaseToken | null>(BASE_TOKENS[0]); // Default to USDC
  const [toToken, setToToken] = useState<BaseToken | null>(BASE_TOKENS[1]); // Default to WETH
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<QuoteV2 | null>(null);
  const [swapProgress, setSwapProgress] = useState<SwapProgress>({ step: "idle", message: SWAP_STEP_MESSAGES.idle });
  const [lastTxHash, setLastTxHash] = useState<string>("");
  const [error, setError] = useState<SwapError | null>(null);
  const [slippage, setSlippage] = useState(0.5);

  const createTransactionWithVolume = useMutation(
    api.transactions.createWithVolumeTracking
  );

  // Phantom wallet integration
  const {
    isConnected: isWalletConnected,
    address: userAddress,
    chainId,
    provider,
    error: walletError,
    isPhantomInstalled,
    isOnBaseChain,
    connect: connectWallet,
    disconnect: disconnectWallet,
    switchToBase,
  } = usePhantomWallet();

  // Initialize Raindex swap hook
  const {
    isClientReady,
    initError,
    getQuote,
    performSwap
  } = useRaindexSwap({
    chainId: 8453, // Base chain
    userAddress: userAddress || "",
    signer: provider // Use Phantom provider as signer
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
          <p className="text-gray-400">Please log in to access Base chain swaps.</p>
        </div>
      </div>
    );
  }

  const handleConnectWallet = async () => {
    try {
      setError(null);
      
      if (!isPhantomInstalled) {
        setError({
          message: "Phantom wallet is not installed. Please install the Phantom browser extension.",
          code: "PHANTOM_NOT_INSTALLED"
        });
        return;
      }

      // Connect to Phantom
      await connectWallet();
      
      // Check if on Base chain, if not switch
      if (!isOnBaseChain) {
        await switchToBase();
      }

      console.log("Wallet connected successfully:", userAddress);
    } catch (error) {
      console.error("Wallet connection failed:", error);
      setError({
        message: error instanceof Error ? error.message : "Failed to connect wallet",
        code: "WALLET_CONNECTION_ERROR"
      });
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    setQuote(null);
    setError(null);
    setLastTxHash("");
    setSwapProgress({ step: "idle", message: SWAP_STEP_MESSAGES.idle });
  };

  // Reset state when wallet disconnects
  useEffect(() => {
    if (!isWalletConnected) {
      setQuote(null);
      setError(null);
      setLastTxHash("");
      setSwapProgress({ step: "idle", message: SWAP_STEP_MESSAGES.idle });
    }
  }, [isWalletConnected]);

  const handleSwapTokens = () => {
    if (fromToken && toToken) {
      setFromToken(toToken);
      setToToken(fromToken);
      setQuote(null);
      setError(null);
    }
  };

  const handleGetQuote = async () => {
    if (!fromToken || !toToken || !amount || !isWalletConnected) return;

    setError(null);
    setSwapProgress({ step: "getting_quote", message: SWAP_STEP_MESSAGES.getting_quote });

    try {
      const { quote: newQuote, error: quoteError } = await getQuote(
        fromToken.address,
        toToken.address,
        parseFloat(amount),
        fromToken.decimals,
        slippage
      );

      if (quoteError) {
        throw new Error(quoteError.message);
      }

      if (newQuote) {
        setQuote(newQuote);
        setSwapProgress({ step: "quote_received", message: SWAP_STEP_MESSAGES.quote_received, data: newQuote });
      }
    } catch (error) {
      console.error("Failed to get quote:", error);
      setError({
        message: error instanceof Error ? error.message : "Failed to get quote",
        code: "QUOTE_ERROR"
      });
      setSwapProgress({ step: "error", message: SWAP_STEP_MESSAGES.error });
    }
  };

  const handleExecuteSwap = async () => {
    if (!fromToken || !toToken || !amount || !isWalletConnected) return;

    setError(null);
    setLastTxHash("");

    const onProgress = (step: string, data?: any) => {
      const progressStep = step as SwapStep;
      setSwapProgress({
        step: progressStep,
        message: SWAP_STEP_MESSAGES[progressStep] || step,
        data
      });
    };

    try {
      const { txHash, error: swapError } = await performSwap(
        fromToken.address,
        toToken.address,
        parseFloat(amount),
        fromToken.decimals,
        slippage,
        onProgress
      );

      if (swapError) {
        throw new Error(swapError.message);
      }

      if (txHash) {
        setLastTxHash(txHash);
        setSwapProgress({
          step: "swap_completed",
          message: SWAP_STEP_MESSAGES.swap_completed,
          data: { txHash }
        });

        // Record transaction in database
        if (user?._id) {
          await createTransactionWithVolume({
            userId: user._id,
            type: "swap",
            amount: parseFloat(amount),
            token: fromToken.symbol,
            status: "success",
            paymentReference: `base_swap_${Date.now()}`,
            transactionId: txHash,
            usdValue: parseFloat(amount), // Assuming USDC amount for simplicity
          });
        }

        // Reset form after successful swap
        setTimeout(() => {
          setQuote(null);
          setAmount("");
          setSwapProgress({ step: "idle", message: SWAP_STEP_MESSAGES.idle });
        }, 5000);
      }
    } catch (error) {
      console.error("Swap execution failed:", error);
      setError({
        message: error instanceof Error ? error.message : "Swap execution failed",
        code: "EXECUTION_ERROR"
      });
      setSwapProgress({ step: "error", message: SWAP_STEP_MESSAGES.error });
    }
  };

  return (
    <div className="relative w-full px-4 py-6 md:px-6 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl mx-auto w-full"
      >
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-700/50 shadow-2xl w-full overflow-hidden">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-6 pt-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex items-center gap-4 mb-2"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-blue-500/20">
                <ArrowLeftRight className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent text-center">
                STOX - Base Swap
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-gray-400 text-sm text-center max-w-md"
            >
              Swap tokens on Base chain with optimal routing powered by Raindex
            </motion.p>

            {/* Client Status */}
            <div className="mt-4 flex items-center gap-2">
              {isClientReady ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">Raindex Client Ready</span>
                </>
              ) : initError ? (
                <>
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">Client Error: {initError?.message}</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
                  <span className="text-yellow-400 text-sm">Initializing Raindex...</span>
                </>
              )}
            </div>
          </div>

          {/* Wallet Connection */}
          {!isWalletConnected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <Wallet className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-medium">
                  {isPhantomInstalled ? "Connect Phantom Wallet" : "Phantom Wallet Required"}
                </span>
              </div>
              {isPhantomInstalled ? (
                <>
                  <p className="text-gray-300 text-sm mb-4">
                    Connect your Phantom wallet to start swapping on Base chain (8453).
                  </p>
                  <button
                    onClick={handleConnectWallet}
                    disabled={!isClientReady}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isClientReady ? (
                      <>
                        <img 
                          src="https://phantom.app/img/phantom-logo.png" 
                          alt="Phantom" 
                          className="w-5 h-5"
                        />
                        Connect Phantom Wallet
                      </>
                    ) : (
                      "Waiting for Client..."
                    )}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-300 text-sm mb-4">
                    Install the Phantom browser extension to connect your wallet and start swapping.
                  </p>
                  <a
                    href="https://phantom.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium py-3 px-4 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Install Phantom Wallet
                  </a>
                </>
              )}
            </motion.div>
          )}

          {/* Wallet Connected Status */}
          {isWalletConnected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <img 
                        src="https://phantom.app/img/phantom-logo.png" 
                        alt="Phantom" 
                        className="w-4 h-4"
                      />
                      <span className="text-green-400 font-medium">Phantom Connected</span>
                      {isOnBaseChain && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                          Base Chain
                        </span>
                      )}
                    </div>
                    <span className="text-gray-300 text-xs mt-1">
                      {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : ""}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleDisconnectWallet}
                  className="text-gray-400 hover:text-red-400 transition-colors text-sm"
                >
                  Disconnect
                </button>
              </div>
              
              {/* Chain Warning */}
              {!isOnBaseChain && chainId && (
                <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                    <span className="text-orange-400 text-sm font-medium">Wrong Network</span>
                  </div>
                  <p className="text-gray-300 text-xs mt-1 mb-2">
                    Please switch to Base chain to continue.
                  </p>
                  <button
                    onClick={switchToBase}
                    className="text-xs bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 px-3 py-1 rounded-lg transition-colors"
                  >
                    Switch to Base Chain
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Wallet Error */}
          {walletError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-red-400 font-medium">Wallet Error</span>
                  <p className="text-gray-300 text-sm mt-1">{walletError}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-red-400 font-medium">Error</span>
                  <p className="text-gray-300 text-sm mt-1">{error.message}</p>
                  {error.code && (
                    <p className="text-gray-400 text-xs mt-1">Code: {error.code}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Swap Progress */}
          {swapProgress.step !== "idle" && swapProgress.step !== "error" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"
            >
              <div className="flex items-center gap-3">
                {swapProgress.step === "swap_completed" ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Zap className="w-5 h-5 text-blue-400 animate-pulse" />
                )}
                <div className="flex-1">
                  <span className="text-blue-400 font-medium">{swapProgress.message}</span>
                  {swapProgress.data?.txHash && (
                    <p className="text-gray-300 text-xs mt-1">
                      Transaction: {swapProgress.data.txHash.slice(0, 10)}...{swapProgress.data.txHash.slice(-6)}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Swap Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="space-y-6"
          >
            {/* Swap Settings */}
            <div className="mb-4 p-3 bg-gray-800/30 border border-gray-600/30 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Slippage Tolerance</span>
                <div className="flex gap-2">
                  {[0.1, 0.5, 1.0].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSlippage(value)}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        slippage === value
                          ? "bg-blue-500 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* From Token */}
            <div className="space-y-3">
              <TokenSelector
                selectedToken={fromToken}
                onSelect={setFromToken}
                label="From"
              />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full p-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:outline-none transition-colors"
                disabled={!isWalletConnected}
              />
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSwapTokens}
                className="p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 rounded-xl transition-all duration-200"
                disabled={!isWalletConnected}
              >
                <ArrowLeftRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* To Token */}
            <TokenSelector
              selectedToken={toToken}
              onSelect={setToToken}
              label="To"
            />

            {/* Quote Display */}
            {quote && (
              <div className="p-4 bg-gray-800/30 border border-gray-600/30 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">You'll receive:</span>
                  <span className="text-white font-medium">{quote.estimatedOutput} {toToken?.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price Impact:</span>
                  <span className="text-white">{quote.priceImpact}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fee:</span>
                  <span className="text-white">{quote.fee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Slippage:</span>
                  <span className="text-white">{slippage}%</span>
                </div>
              </div>
            )}

            {/* Last Transaction */}
            {lastTxHash && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div className="flex-1">
                    <span className="text-green-400 font-medium">Last Transaction</span>
                    <p className="text-gray-300 text-sm mt-1">
                      {lastTxHash.slice(0, 10)}...{lastTxHash.slice(-6)}
                    </p>
                  </div>
                  <a
                    href={`https://basescan.org/tx/${lastTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {!quote ? (
                <button
                  onClick={handleGetQuote}
                  disabled={
                    !isWalletConnected || 
                    !fromToken || 
                    !toToken || 
                    !amount || 
                    !isClientReady ||
                    !isOnBaseChain ||
                    swapProgress.step !== "idle"
                  }
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-4 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {swapProgress.step === "getting_quote" ? (
                    <>
                      <Zap className="w-5 h-5 animate-spin" />
                      Getting Quote...
                    </>
                  ) : !isOnBaseChain && isWalletConnected ? (
                    "Switch to Base Chain First"
                  ) : (
                    "Get Quote"
                  )}
                </button>
              ) : (
                <button
                  onClick={handleExecuteSwap}
                  disabled={
                    (swapProgress.step !== "quote_received" && 
                    swapProgress.step !== "idle") ||
                    !isOnBaseChain
                  }
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-medium py-4 px-6 rounded-xl hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {swapProgress.step !== "quote_received" && swapProgress.step !== "idle" ? (
                    <>
                      <Zap className="w-5 h-5 animate-spin" />
                      {swapProgress.message}
                    </>
                  ) : !isOnBaseChain ? (
                    "Switch to Base Chain First"
                  ) : (
                    "Execute Swap"
                  )}
                </button>
              )}
            </div>

            {/* Development Notice */}
            {!isClientReady && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-yellow-400 font-medium text-sm">
                      SDK Installation Required
                    </p>
                    <p className="text-gray-300 text-sm">
                      To enable full functionality, install the required dependencies:
                    </p>
                    <div className="bg-gray-900/50 rounded-lg p-3 mt-2">
                      <code className="text-green-400 text-xs font-mono">
                        npm install raindex-sdk wagmi viem @wagmi/core @wagmi/connectors ethers
                      </code>
                    </div>
                    <p className="text-gray-400 text-xs">
                      Phantom wallet integration is ready - currently running in demo mode for swaps.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Phantom Wallet Info */}
            {isPhantomInstalled && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <img 
                    src="https://phantom.app/img/phantom-logo.png" 
                    alt="Phantom" 
                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                  />
                  <div className="space-y-2">
                    <p className="text-purple-400 font-medium text-sm">
                      Phantom Wallet Detected
                    </p>
                    <p className="text-gray-300 text-sm">
                      Your Phantom wallet supports Base chain swaps. Connect your wallet and switch to Base (8453) to start trading.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                        EVM Support
                      </span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                        Base Chain Ready
                      </span>
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                        Auto Network Switch
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}