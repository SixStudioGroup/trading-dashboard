import fs from 'node:fs';
const feed=JSON.parse(fs.readFileSync('feed.json'));const D={};for(const s of feed.symbols){const p=`cache/asx_${s}.json`;if(fs.existsSync(p))D[s]=JSON.parse(fs.readFileSync(p))}
const ma=(b,i,n)=>{let x=0;for(let j=i-n+1;j<=i;j++)x+=b[j].c;return x/n};
const TR=(b,i)=>Math.max(b[i].c,b[i-1].c)-Math.min(b[i].c,b[i-1].c);
const rows=[];const univ={};
for(const[s,b]of Object.entries(D)){for(let i=205;i<b.length-41;i++){const e=b[i+1].o;if(!(e>0))continue;const f20=(b[i+20].c/e-1)*100,f40=(b[i+40].c/e-1)*100;(univ[b[i].d]=univ[b[i].d]||[]).push({f20,f40});
 const m50=ma(b,i,50),m200=ma(b,i,200);let hi=0;for(let j=i-20;j<i;j++)hi=Math.max(hi,b[j].c);
 const on=b[i].c>m50&&m50>m200&&b[i].c>hi; if(on){let prev=false;{let h=0;for(let j=i-21;j<i-1;j++)h=Math.max(h,b[j].c);prev=b[i-1].c>h}if(!prev){
  let atr=0;for(let j=i-13;j<=i;j++)atr+=TR(b,j);atr/=14;const stop=e-2*atr;let r=null;for(let j=i+1;j<=i+40;j++){if(b[j].c<stop){r=(b[j+1].o/e-1)*100;break}}if(r===null)r=f40;
  rows.push({s,d:b[i].d,f20,f40,r,risk:(2*atr/e)*100})}}}}
const base={};for(const d in univ){base[d]={f20:univ[d].reduce((a,x)=>a+x.f20,0)/univ[d].length,f40:univ[d].reduce((a,x)=>a+x.f40,0)/univ[d].length}}
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
function boot(vals,dates){const bm={};vals.forEach((v,i)=>{const k=dates[i].slice(0,7);(bm[k]=bm[k]||[]).push(v)});const M=Object.values(bm);const o=[];for(let k=0;k<2000;k++){let s=0,c=0;for(let i=0;i<M.length;i++){for(const v of M[Math.floor(Math.random()*M.length)]){s+=v;c++}}o.push(s/c)}o.sort((a,b)=>a-b);return[+o[50].toFixed(2),+o[1950].toFixed(2)]}
const ex20=rows.map(r=>r.f20-base[r.d].f20),ex40=rows.map(r=>r.f40-base[r.d].f40);const ds=rows.map(r=>r.d);
const net=rows.map(r=>r.r-.3);const Rm=rows.map((r,i)=>net[i]/r.risk);
console.log('ASX trend+20d-high breakout, n',rows.length,'first',ds.sort()[0]);
console.log('20d excess',mean(ex20).toFixed(2),boot(ex20,rows.map(r=>r.d)),'40d excess',mean(ex40).toFixed(2),boot(ex40,rows.map(r=>r.d)));
console.log('2ATR stop/40d exit: net avg %',mean(net).toFixed(2),'win',(net.filter(x=>x>0).length/net.length*100).toFixed(0)+'%','expectancy R',mean(Rm).toFixed(3),boot(Rm,rows.map(r=>r.d)),'avg stop dist %',mean(rows.map(r=>r.risk)).toFixed(1));
const byY={};rows.forEach((r,i)=>{const y=r.d.slice(0,4);(byY[y]=byY[y]||[]).push(Rm[i])});console.log('by year R',Object.fromEntries(Object.entries(byY).map(([y,a])=>[y,[a.length,+mean(a).toFixed(2)]])));
const baseAvg=mean(Object.values(base).map(x=>x.f40));console.log('universe 40d avg',baseAvg.toFixed(2));
