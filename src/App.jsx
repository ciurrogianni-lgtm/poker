import PokerGame from './PokerGame';
import './App.css';

function App() {
  return (
    <div className="container">
      <header>
        <img src="/logo.png" alt="Bob4.0 Logo" className="logo" />
        <h1>Bob4.0 Poker Game</h1>
        <a
          className="buy-link"
          href="https://pancakeswap.finance/swap?chain=bsc&chainOut=bsc&inputCurrency=0xfa4C07636B53D868E514777B9d4005F1e9c6c40B&outputCurrency=BNB"
          target="_blank"
          rel="noopener noreferrer"
        >
          Buy Bob4.0 on PancakeSwap
        </a>
        <p>
          Bet <b>100 Bob4.0</b> and win up to <b>2000 Bob4.0</b>!<br />
          Connect with MetaMask or WalletConnect.<br />
          Low chance of winning.<br />
          <a href="https://bscscan.com/address/0x6cb90df0fcb1d29ededc988d94e969395d49f321#code" target="_blank" rel="noopener noreferrer">
            Poker Smart Contract
          </a>
        </p>
      </header>
      <PokerGame />
      <footer>
        <small>
          ⚠️ Gambling. 18+ only. Play responsibly.<br />
          <a href="https://bscscan.com/token/0xfa4C07636B53D868E514777B9d4005F1e9c6c40B" target="_blank">Bob4.0 on BSCScan</a>
        </small>
      </footer>
    </div>
  );
}

export default App;
