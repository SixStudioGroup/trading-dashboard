import fs from 'node:fs';
const snap=JSON.parse(fs.readFileSync('crypto.json')).data;
const info=await (await fetch('https://data-api.binance.vision/api/v3/exchangeInfo?permissions=SPOT')).json();
const pairs=new Set(info.symbols.filter(s=>s.quoteAsset==='USDT'&&s.status==='TRADING').map(s=>s.symbol));
const stable=new Set(['usdt','usdc','dai','fdusd','tusd','usde','usds','pyusd','usd1','busd','wbtc','weth','steth','wsteth','wbeth','xaut','paxg','frax','eurc']);
const uni=snap.filter(c=>!stable.has(c.symbol)&&pairs.has(c.symbol.toUpperCase()+'USDT')).slice(0,120).map(c=>c.symbol.toUpperCase());
const END=Date.now(),START=END-730*24*3600e3;
async function hist(sym){const p=`cache/c_${sym}.json`;if(fs.existsSync(p))return JSON.parse(fs.readFileSync(p));let t=START,out=[];
 while(t<END){const r=await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${sym}USDT&interval=1h&startTime=${t}&limit=1000`);if(!r.ok)throw new Error(r.status);const k=await r.json();if(!k.length)break;for(const x of k)out.push([x[0],+x[1],+x[4],+x[7]]);t=k.at(-1)[0]+3600e3;if(k.length<1000)break}
 fs.writeFileSync(p,JSON.stringify(out));return out}
const D={};let idx=0;await Promise.all(Array(6).fill(0).map(async()=>{while(idx<uni.length){const s=uni[idx++];try{D[s]=await hist(s)}catch(e){console.log('skip',s,e.message)}}}));
console.log('coins',Object.keys(D).length,'window days 730; survivors listed today');
const H=3600e3;const maps={};for(const s in D){const m=new Map();D[s].forEach((b,i)=>m.set(b[0],i));maps[s]=m}
const t0=Math.floor(START/H)*H;const hours=[];for(let t=t0;t<END-H;t+=H)hours.push(t);
function at(s,t){const i=maps[s].get(t);return i===undefined?null:i}
function st(s,i){const b=D[s];if(i<25)return null;const d=(b[i][2]/b[i-24][2]-1)*100,h=(b[i][2]/b[i-1][2]-1)*100;let v=0;for(let j=i-23;j<=i;j++)v+=b[j][3];return{d,h,v}}
// universe baseline: equal weight forward from t+1 open over n hours
function basefwd(t,n){let sum=0,c=0;for(const s in D){const i=at(s,t+H),j=at(s,t+H*n);if(i!==null&&j!==null&&D[s][i][1]>0){sum+=D[s][j][2]/D[s][i][1]-1;c++}}return c?sum/c*100:null}
const bcache=new Map();const base=(t,n)=>{const k=t+':'+n;if(!bcache.has(k))bcache.set(k,basefwd(t,n));return bcache.get(k)};
const ev=[];const USDAUD=1.5;
for(const s in D){const b=D[s];let lastOn=-1e9;for(let i=25;i<b.length-170;i++){const x=st(s,i);if(!x)continue;if(!(x.d>=5&&x.h>0)){continue}const fresh=i-lastOn>24;lastOn=i;if(!fresh)continue;
 const volAud=x.v*USDAUD;const e=b[i+1][1];if(!(e>0))continue;
 const fw=n=>(b[i+n][2]/e-1)*100;
 // app invalidation: exit at next open after first negative 1h close
 let inv=null,invH=null;for(let j=i+1;j<=i+168;j++){if(b[j][2]<b[j-1][2]){inv=(b[j+1][1]/e-1)*100;invH=j-i;break}}
 // default stop -5% with 168h max
 let stop=fw(168);for(let j=i+1;j<=i+168;j++){if(b[j][2]<=e*.95){stop=(b[j+1][1]/e-1)*100;break}}
 ev.push({s,t:b[i][0],vol:volAud,d:x.d,r24:fw(24),r72:fw(72),r168:fw(168),inv,invH,stop,b24:base(b[i][0],24),b72:base(b[i][0],72),b168:base(b[i][0],168)})}}
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;const med=a=>{const c=[...a].sort((x,y)=>x-y);return c[c.length>>1]};
function boot(events,f,n=2000){const wk={};events.forEach(e=>{const w=Math.floor(e.t/(7*24*H));(wk[w]=wk[w]||[]).push(f(e))});const W=Object.values(wk);const ms=[];for(let k=0;k<n;k++){let sum=0,c=0;for(let i=0;i<W.length;i++){const w=W[Math.floor(Math.random()*W.length)];for(const v of w){sum+=v;c++}}ms.push(sum/c)}ms.sort((a,b)=>a-b);return[+ms[50].toFixed(2),+ms[1950].toFixed(2)]}
function rep(name,E){console.log(`\n${name} n=${E.length}`);for(const[k,bk]of[['r24','b24'],['r72','b72'],['r168','b168']]){const F=E.filter(e=>e[bk]!==null);console.log(k,'avg',mean(F.map(e=>e[k])).toFixed(2),'median',med(F.map(e=>e[k])).toFixed(2),'excess',mean(F.map(e=>e[k]-e[bk])).toFixed(2),'CI',boot(F,e=>e[k]-e[bk]),'win>2%cost',(F.filter(e=>e[k]>2).length/F.length*100).toFixed(0)+'%','win>0.3%',(F.filter(e=>e[k]>.3).length/F.length*100).toFixed(0)+'%')}
 const I=E.filter(e=>e.inv!==null);console.log('app invalidation exit: avg',mean(I.map(e=>e.inv)).toFixed(2),'median',med(I.map(e=>e.inv)).toFixed(2),'median hours held',med(I.map(e=>e.invH)),'win>2%',(I.filter(e=>e.inv>2).length/I.length*100).toFixed(0)+'%','win>0.3%',(I.filter(e=>e.inv>.3).length/I.length*100).toFixed(0)+'%');
 console.log('-5% stop/168h: avg',mean(E.map(e=>e.stop)).toFixed(2),'median',med(E.map(e=>e.stop)).toFixed(2),'win>2%',(E.filter(e=>e.stop>2).length/E.length*100).toFixed(0)+'%')}
rep('Breakout all',ev);rep('Breakout, liquidity Suitable (>=A$100M Binance vol)',ev.filter(e=>e.vol>=1e8));rep('Breakout, thin (<A$25M)',ev.filter(e=>e.vol<25e6));
// Queue-follower: at 3 snapshots a day pick #1 momentum score, one position at a time
function follow(holdH,cost,minVol=0){let eq=1,trades=[],i=0;const stamps=hours.filter(t=>[21,3,9].includes(new Date(t).getUTCHours()));let until=0;for(const t of stamps){if(t<until)continue;const vols=[];const cand=[];for(const s in D){const i=at(s,t);if(i===null)continue;const x=st(s,i);if(!x)continue;vols.push(x.v);cand.push({s,i,...x})}if(cand.length<20)continue;const th=[...vols].sort((a,b)=>b-a)[4];let best=null;for(const c of cand){if(!(c.d>=5&&c.h>0))continue;if(c.v*USDAUD<minVol)continue;const score=c.d*12+c.h*30+Math.min(c.v/th,2)*10;if(!best||score>best.score)best={...c,score}}if(!best)continue;const b=D[best.s];const j=best.i+holdH;if(j>=b.length)continue;const r=b[j][2]/b[best.i+1][1]-1;eq*=1+r-cost;trades.push(r);until=t+holdH*H}
 return{trades:trades.length,equity:+eq.toFixed(3),avg:+(mean(trades)*100).toFixed(2),med:+(med(trades)*100).toFixed(2),win:+(trades.filter(r=>r>cost).length/trades.length*100).toFixed(0)}}
for(const h of[24,72,168])for(const c of[.02,.002])console.log('queue #1 hold',h,'h cost',c*100+'%',JSON.stringify(follow(h,c)),'| vol>=A$100M',JSON.stringify(follow(h,c,1e8)));
const btc=D.BTC;console.log('BTC buy&hold',(btc.at(-1)[2]/btc[0][1]).toFixed(3));const allr=Object.values(D).filter(b=>b.length>17000).map(b=>b.at(-1)[2]/b[0][1]);console.log('EW alts B&H (full-history coins)',mean(allr).toFixed(3),'median',med(allr).toFixed(3),'n',allr.length);
