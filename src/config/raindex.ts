// Raindex Configuration for Base Chain Integration
// This file contains all the configuration needed for Raindex SDK integration

export const RAINDEX_CONFIG = {
  // Base chain configuration
  CHAIN_ID: 8453,
  CHAIN_NAME: "Base",
  RPC_URL: "https://mainnet.base.org",
  EXPLORER_URL: "https://basescan.org",
  CURRENCY: "ETH",

  // Orderbook configuration
  ORDERBOOK_ADDRESS: "0x90CAF23eA7E507BB722647B0674e50D8d6468234",
  SUBGRAPH_URL: "https://api.thegraph.com/subgraphs/name/rainprotocol/base-orderbook",

  // Default swap settings
  DEFAULT_SLIPPAGE: 0.5, // 0.5%
  DEFAULT_DEADLINE: 300, // 5 minutes in seconds
  MAX_SLIPPAGE: 10, // 10%

  // Gas settings
  GAS_LIMIT_MULTIPLIER: 1.2,
  MAX_PRIORITY_FEE_PER_GAS: "2000000000", // 2 gwei
  MAX_FEE_PER_GAS: "20000000000", // 20 gwei
};

// YAML configuration string for Raindex SDK
export const BASE_CHAIN_YAML_CONFIG = `
version: "4"
networks:
  base:
    chain-id: ${RAINDEX_CONFIG.CHAIN_ID}
    rpc: ${RAINDEX_CONFIG.RPC_URL}
    network-id: ${RAINDEX_CONFIG.CHAIN_ID}
    currency: ${RAINDEX_CONFIG.CURRENCY}
    explorer: ${RAINDEX_CONFIG.EXPLORER_URL}

tokens:
  USDC:
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    decimals: 6
    symbol: USDC
    name: "USD Coin"
  WETH:
    address: "0x4200000000000000000000000000000000000006"
    decimals: 18
    symbol: WETH
    name: "Wrapped Ether"
  DAI:
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"
    decimals: 18
    symbol: DAI
    name: "Dai Stablecoin"
  USDbC:
    address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA"
    decimals: 6
    symbol: USDbC
    name: "USD Base Coin"
  CBETH:
    address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22"
    decimals: 18
    symbol: cbETH
    name: "Coinbase Wrapped Staked ETH"

orderbooks:
  main-orderbook:
    address: "${RAINDEX_CONFIG.ORDERBOOK_ADDRESS}"
    network: base
    subgraph: "${RAINDEX_CONFIG.SUBGRAPH_URL}"

vaults:
  # Add vault configurations as needed
  main-vault:
    address: "0x..." # Replace with actual vault address
    network: base
`;

// Token list for UI
export const BASE_TOKENS = [
  {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
    isStablecoin: true,
  },
  {
    address: "0x4200000000000000000000000000000000000006",
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    logoURI: "https://assets.coingecko.com/coins/images/2518/small/weth.png",
    isStablecoin: false,
  },
  {
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
    logoURI: "https://assets.coingecko.com/coins/images/9956/small/dai-multi-collateral-mcd.png",
    isStablecoin: true,
  },
  {
    address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
    symbol: "USDbC",
    name: "USD Base Coin",
    decimals: 6,
    logoURI: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
    isStablecoin: true,
  },
  {
    address: "0xff647ad8c4b065bd746911bb9ea1a33c38c63604",
    symbol: "tMSTR",
    name: "MicroStrategy Incorporated ST0x",
    decimals: 18,
    logoURI: "https://s3-symbol-logo.tradingview.com/strategy-cad-hedged-cibc-cdr--big.svg",
    isStablecoin: false,
  },
  {
    address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
    symbol: "EURC",
    name: "Euro Coin",
    decimals: 6,
    logoURI: "https://assets.coingecko.com/coins/images/26045/small/euro-coin.png",
    isStablecoin: true,
  },
  {
    address: "0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85",
    symbol: "tTSLA",
    name: "Tesla Inc ST0x",
    decimals: 18,
    logoURI: "https://s3-symbol-logo.tradingview.com/tesla--big.svg",
    isStablecoin: false,
  },
  {
    address: "0x8d8c315db61f60dcc3c66cdb48ca87fc643e35ea",
    symbol: "tAMZN",
    name: "Amazon.com Inc ST0x",
    decimals: 18,
    logoURI: "https://s3-symbol-logo.tradingview.com/amazon--big.svg",
    isStablecoin: false,
  },
  {
    address: "0x69fca9f7fad46a7eef3acef5beac9df5b7eca73b",
    symbol: "tNVDA",
    name: "NVIDIA Corporation ST0x",
    decimals: 18,
    logoURI: "https://s3-symbol-logo.tradingview.com/nvidia--big.svg",
    isStablecoin: false,
  },
];



// ERC-20 ABI for token interactions
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

// Utility functions for token handling
export const formatTokenAmount = (amount: string, _decimals?: number): string => {
  const value = parseFloat(amount);
  if (value === 0) return "0";
  
  if (value < 0.001) return value.toExponential(2);
  if (value < 1) return value.toFixed(6);
  if (value < 1000) return value.toFixed(4);
  if (value < 10000) return value.toFixed(2);
  
  return value.toLocaleString();
};

export const parseTokenAmount = (amount: string, decimals: number): string => {
  return (parseFloat(amount) * Math.pow(10, decimals)).toString();
};

export const formatTokenDisplay = (amount: string, decimals: number, symbol: string): string => {
  const formatted = formatTokenAmount(amount, decimals);
  return `${formatted} ${symbol}`;
};

// Error codes and messages
export const RAINDEX_ERROR_CODES = {
  INSUFFICIENT_LIQUIDITY: "INSUFFICIENT_LIQUIDITY",
  SLIPPAGE_EXCEEDED: "SLIPPAGE_EXCEEDED",
  DEADLINE_EXCEEDED: "DEADLINE_EXCEEDED",
  INSUFFICIENT_ALLOWANCE: "INSUFFICIENT_ALLOWANCE",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  NETWORK_ERROR: "NETWORK_ERROR",
  QUOTE_ERROR: "QUOTE_ERROR",
  EXECUTION_ERROR: "EXECUTION_ERROR",
} as const;

export const RAINDEX_ERROR_MESSAGES = {
  [RAINDEX_ERROR_CODES.INSUFFICIENT_LIQUIDITY]: "Insufficient liquidity for this trade size",
  [RAINDEX_ERROR_CODES.SLIPPAGE_EXCEEDED]: "Price moved beyond acceptable slippage",
  [RAINDEX_ERROR_CODES.DEADLINE_EXCEEDED]: "Transaction deadline exceeded",
  [RAINDEX_ERROR_CODES.INSUFFICIENT_ALLOWANCE]: "Token allowance insufficient",
  [RAINDEX_ERROR_CODES.INSUFFICIENT_BALANCE]: "Insufficient token balance",
  [RAINDEX_ERROR_CODES.NETWORK_ERROR]: "Network connection error",
  [RAINDEX_ERROR_CODES.QUOTE_ERROR]: "Failed to get swap quote",
  [RAINDEX_ERROR_CODES.EXECUTION_ERROR]: "Failed to execute swap",
} as const;