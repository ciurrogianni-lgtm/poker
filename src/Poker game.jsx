import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import WalletConnectProvider from "@walletconnect/web3-provider";

const TOKEN_ADDRESS = "0xfa4C07636B53D868E514777B9d4005F1e9c6c40B";
const GAME_CONTRACT = "0x6CB90Df0fCB1D29EdEDC988d94E969395d49f321";

// Bob4.0 Token ABI
const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

// Poker Game Contract ABI
const GAME_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "betAmount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "playerCardId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "houseCardId", "type": "uint256" },
      { "indexed": false, "internalType": "bool", "name": "won", "type": "bool" }
    ],
    "name": "GamePlayed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "bobToken",
    "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  { "inputs": [], "name": "maxBet", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "minBet", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  {
    "inputs": [{ "internalType": "uint256", "name": "betAmount", "type": "uint256" }],
    "name": "playCard",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  { "inputs": [], "name": "withdrawHouseBalance", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

function PokerGame() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [status, setStatus] = useState("");
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    if (signer && address) getBalance();
    // eslint-disable-next-line
  }, [signer, address]);

  // Connect with MetaMask
  async function connectMetaMask() {
    try {
      if (window.ethereum) {
        const ethersProvider = new ethers.BrowserProvider(window.ethereum, "any");
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = await ethersProvider.getSigner();
        setProvider(ethersProvider);
        setSigner(signer);
        setAddress(await signer.getAddress());
        setStatus("Wallet connected!");
      } else {
        setStatus("MetaMask not found. Use WalletConnect for mobile.");
      }
    } catch (err) {
      setStatus("Connection error: " + err.message);
    }
  }

  // Connect with WalletConnect
  async function connectWalletConnect() {
    try {
      const walletConnectProvider = new WalletConnectProvider({
        rpc: { 56: "https://bsc-dataseed.binance.org/" },
        chainId: 56,
      });
      await walletConnectProvider.enable();
      const ethersProvider = new ethers.BrowserProvider(walletConnectProvider, "any");
      const signer = await ethersProvider.getSigner();
      setProvider(ethersProvider);
      setSigner(signer);
      setAddress(await signer.getAddress());
      setStatus("Mobile wallet connected!");
    } catch (err) {
      setStatus("WalletConnect error: " + err.message);
    }
  }

  // Bob4.0 Token Balance and Decimals
  async function getBalance() {
    try {
      const contract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
      const decimals = await contract.decimals();
      setTokenDecimals(decimals);
      const balance = await contract.balanceOf(address);
      setBalance(Number(ethers.formatUnits(balance, decimals)));
    } catch (err) {
      setStatus("Error reading balance: " + err.message);
    }
  }

  // Play Poker
  async function playPoker() {
    if (!signer || !address) return setStatus("Connect your wallet!");
    if (balance < 100) return setStatus("Insufficient Bob4.0 balance!");

    setStatus("Transaction in progress...");
    setLastResult(null);

    try {
      // Approve Game Contract to spend 100 Bob4.0
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      const amount = ethers.parseUnits("100", tokenDecimals);
      const approveTx = await tokenContract.approve(GAME_CONTRACT, amount);
      await approveTx.wait();

      // Interact with Game Contract
      const gameContract = new ethers.Contract(GAME_CONTRACT, GAME_ABI, signer);
      const playTx = await gameContract.playCard(amount);
      const receipt = await playTx.wait();

      setStatus("Game played! Check your wallet and history.");
      let won = null;
      let playerCard = null, houseCard = null;
      // Look for GamePlayed event
      if (receipt && receipt.logs) {
        for (let log of receipt.logs) {
          try {
            const parsed = gameContract.interface.parseLog(log);
            if (parsed && parsed.name === "GamePlayed") {
              won = parsed.args.won;
              playerCard = parsed.args.playerCardId;
              houseCard = parsed.args.houseCardId;
              break;
            }
          } catch { }
        }
      }
      if (won !== null) {
        setLastResult(won
          ? `You won! Player card: ${playerCard} - House card: ${houseCard}`
          : `You lost. Player card: ${playerCard} - House card: ${houseCard}`);
      } else {
        setLastResult("Result available in events on BscScan.");
      }
      getBalance();
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  }

  return (
    <section className="poker-box">
      <div>
        <button onClick={connectMetaMask}>Connect MetaMask</button>
        <button onClick={connectWalletConnect}>Connect WalletConnect (Mobile)</button>
      </div>
      {address && <div>Wallet: {address}</div>}
      <div>Bob4.0 Balance: {balance}</div>
      <button onClick={playPoker}>Play Poker (100 Bob4.0)</button>
      {status && <div className="status">{status}</div>}
      {lastResult && <div className="result">{lastResult}</div>}
      <div style={{marginTop:'1em'}}>
        <a href="https://bscscan.com/address/0x6cb90df0fcb1d29ededc988d94e969395d49f321#events" target="_blank" rel="noopener noreferrer">
          Results & history on BscScan
        </a>
      </div>
    </section>
  );
}

export default PokerGame;
