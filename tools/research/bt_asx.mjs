import fs from 'node:fs';
const feed=JSON.parse(fs.readFileSync(process.argv[2]));
const syms=feed.symbols; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function get(s){const p=`cache/asx_${s}.json`;if(fs.existsSync(p))return JSON.parse(fs.readFileSync(p));
 const r=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${s}.AX?range=5y&interval=1d&events=div,split`,{headers:{'User-Agent':'Mozilla/5.0'}});
 if(!r.ok)throw new Error(s+r.status);const j=(await r.json()).chart.result[0];const q=j.indicators.quote[0],ac=j.indicators.adjclose?.[0]?.adjclose||q.close;
 const out=[];j.timestamp.forEach((t,i)=>{if([q.open[i],q.close[i],q.volume[i],ac[i]].every(Number.isFinite)&&q.close[i]>0&&q.open[i]>0){const f=ac[i]/q.close[i];out.push({d:new Date(t*1000+11*3600e3).toISOString().slice(0,10),o:q.open[i]*f,c:ac[i],rc:q.close[i],v:q.volume[i]})}});
 const dedup=[];for(const b of out){if(dedup.length&&dedup.at(-1).d===b.d)dedup[dedup.length-1]=b;else dedup.push(b)}
 fs.writeFileSync(p,JSON.stringify(dedup));await sleep(150);return dedup}
function sig(c1,c5,rv){if(c1>=2&&rv>=1.5&&c5>0)return'Breakout';if(rv>=2&&c1>0)return'Volume Spike';if(c1>0&&c5>0)return'Watch';if(c1<=-2||c5<=-5)return'Sell Risk';return'No Action'}
const HS=[1,5,10,20]; const data={};for(const s of syms){try{data[s]=await get(s)}catch(e){console.log('skip',s,e.message)}}
// signal rows
const rows=[];const univ={};
for(const [s,b] of Object.entries(data)){for(let i=26;i<b.length-21;i++){
 const c1=(b[i].c/b[i-1].c-1)*100,c5=(b[i].c/b[i-5].c-1)*100;const av=b.slice(i-20,i).reduce((a,x)=>a+x.v,0)/20;const rv=av>0?b[i].v/av:1;
 const e=b[i+1].o;if(!(e>0))continue;const fr={};for(const h of HS)fr[h]=(b[i+h].c/e-1)*100;
 const st=sig(c1,c5,rv);rows.push({s,d:b[i].d,st,fr});(univ[b[i].d]=univ[b[i].d]||[]).push(fr)}}
const base={};for(const d in univ){base[d]={};for(const h of HS)base[d][h]=univ[d].reduce((a,f)=>a+f[h],0)/univ[d].length}
function boot(vals,blocks=20,n=2000){ // date-clustered bootstrap over per-date mean excess
 const m=vals.length;if(m<blocks)return[NaN,NaN];const means=[];for(let k=0;k<n;k++){let sum=0,c=0;while(c<m){const st=Math.floor(Math.random()*m);for(let j=0;j<blocks&&c<m;j++,c++)sum+=vals[(st+j)%m]}means.push(sum/m)}means.sort((a,b)=>a-b);return[means[Math.floor(.025*n)],means[Math.floor(.975*n)]]}
const dates=Object.keys(univ).sort();console.log('window',dates[0],dates.at(-1),'symbols',Object.keys(data).length,'obs',rows.length);
const RT=0.30;
for(const st of ['Breakout','Volume Spike','Watch','Sell Risk','No Action']){const sub=rows.filter(r=>r.st===st);
 const line={signal:st,n:sub.length};for(const h of HS){const byD={};sub.forEach(r=>(byD[r.d]=byD[r.d]||[]).push(r.fr[h]-base[r.d][h]));const dm=dates.filter(d=>byD[d]).map(d=>byD[d].reduce((a,b)=>a+b)/byD[d].length);const avg=dm.reduce((a,b)=>a+b,0)/dm.length;const[l,u]=boot(dm);const raw=sub.reduce((a,r)=>a+r.fr[h],0)/sub.length;const win=sub.filter(r=>r.fr[h]>RT).length/sub.length*100;line['h'+h]={rawAvg:+raw.toFixed(2),excess:+avg.toFixed(2),ci:[+l.toFixed(2),+u.toFixed(2)],winNet:+win.toFixed(0)}}console.log(JSON.stringify(line))}
console.log('universe avg fwd',JSON.stringify(Object.fromEntries(HS.map(h=>[h,+(dates.reduce((a,d)=>a+base[d][h],0)/dates.length).toFixed(2)]))));
