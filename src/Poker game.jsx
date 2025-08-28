import { useState, useEffect } from "react";
import { ethers } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";

console.log("PokerGame.jsx loaded"); // DEBUG: file caricato

const TOKEN_ADDRESS = "0xfa4C07636B53D868E514777B9d4005F1e9c6c40B";
const GAME_CONTRACT = "0x6CB90Df0fCB1D29EdEDC988d94E969395d49f321";

const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const GAME_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "uint256", name: "betAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "playerCardId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "houseCardId", type: "uint256" },
      { indexed: false, internalType: "bool", name: "won", type: "bool" }
    ],
    name: "GamePlayed",
    type: "event"
  },
  { inputs: [], name: "maxBet", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "minBet", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "owner", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "betAmount", type: "uint256" }], name: "playCard", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "withdrawHouseBalance", outputs: [], stateMutability: "nonpayable", type: "function" }
];

function PokerGame() {
  console.log("PokerGame component mounting"); // DEBUG: componente montato

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [status, setStatus] = useState("");
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    console.log("useEffect fired", signer, address); // DEBUG
    if (signer && address) getBalance();
  }, [signer, address]);

  async function connectMetaMask() {
    console.log("connectMetaMask called"); // DEBUG
    try {
      if (window.ethereum) {
        const ethersProvider = new ethers.BrowserProvider(window.ethereum, "any");
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = await ethersProvider.getSigner();
        setProvider(ethersProvider);
        setSigner(signer);
        setAddress(await signer.getAddress());
        setStatus("MetaMask connected!");
        console.log("MetaMask connected:", await signer.getAddress());
      } else {
        setStatus("MetaMask not found. Try WalletConnect.");
        console.warn("MetaMask not found");
      }
    } catch (err) {
      setStatus("Connection error: " + err.message);
      console.error("MetaMask error:", err);
    }
  }

  async function connectWalletConnect() {
    console.log("connectWalletConnect called"); // DEBUG
    try {
      const walletConnectProvider = await EthereumProvider.init({
        projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
        chains: [56],
        showQrModal: true,
        rpcMap: { 56: "https://bsc-dataseed.binance.org/" }
      });

      await walletConnectProvider.enable();
      const ethersProvider = new ethers.BrowserProvider(walletConnectProvider, "any");
      const signer = await ethersProvider.getSigner();

      setProvider(ethersProvider);
      setSigner(signer);
      setAddress(await signer.getAddress());
      setStatus("WalletConnect v2 connected!");
      console.log("WalletConnect connected:", await signer.getAddress());
    } catch (err) {
      setStatus("WalletConnect error: " + err.message);
      console.error("WalletConnect error:", err);
    }
  }

  async function getBalance() {
    console.log("getBalance called"); // DEBUG
    try {
      const contract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
      const decimals = await contract.decimals();
      setTokenDecimals(decimals);
      const bal = await contract.balanceOf(address);
      setBalance(Number(ethers.formatUnits(bal, decimals)));
      console.log("Balance fetched:", bal.toString());
    } catch (err) {
      setStatus("Error reading balance: " + err.message);
      console.error("Balance error:", err);
    }
  }

  async function playPoker() {
    console.log("playPoker called"); // DEBUG
    if (!signer || !address) return setStatus("Connect your wallet!");
    if (balance < 100) return setStatus("Insufficient Bob4.0 balance!");

    setStatus("Transaction in progress...");
    setLastResult(null);

    try {
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      const amount = ethers.parseUnits("100", tokenDecimals);
      const approveTx = await tokenContract.approve(GAME_CONTRACT, amount);
      await approveTx.wait();

      const gameContract = new ethers.Contract(GAME_CONTRACT, GAME_ABI, signer);
      const playTx = await gameContract.playCard(amount);
      const receipt = await playTx.wait();

      setStatus("Game played! Check your wallet and history.");
      console.log("Transaction receipt:", receipt);

      let won = null, playerCard = null, houseCard = null;

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
          } catch {}
        }
      }

      if (won !== null) {
        setLastResult(
          won
            ? `🎉 You won! Player card: ${playerCard} - House card: ${houseCard}`
            : `😢 You lost. Player card: ${playerCard} - House card: ${houseCard}`
        );
      } else {
        setLastResult("Result available in events on BscScan.");
      }

      getBalance();
    } catch (err) {
      setStatus("Error: " + err.message);
      console.error("Play poker error:", err);
    }
  }

  return (
    <section className="poker-box">
      <div>
        <button onClick={connectMetaMask}>Connect MetaMask</button>
        <button onClick={connectWalletConnect}>Connect WalletConnect (v2)</button>
      </div>
      {address && <div>Wallet: {address}</div>}
      <div>Bob4.0 Balance: {balance}</div>
      <button onClick={playPoker}>Play Poker (100 Bob4.0)</button>
      {status && <div className="status">{status}</div>}
      {lastResult && <div className="result">{lastResult}</div>}
      <div style={{ marginTop: "1em" }}>
        <a
          href="https://bscscan.com/address/0x6cb90df0fcb1d29ededc988d94e969395d49f321#events"
          target="_blank"
          rel="noopener noreferrer"
        >
          Results & history on BscScan
        </a>
      </div>
    </section>
  );
}

export default PokerGame;
