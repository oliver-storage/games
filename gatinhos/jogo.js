// Lar dos Gatinhos — jogar, decorar, colecionar
const CONFIG = { SISTEMA:'Lar dos Gatinhos', VERSAO:'0.1.0.0', DESENVOLVEDOR:'Vettore Sistemas' };
const $=id=>document.getElementById(id);
const fmt=n=>Math.round(n).toLocaleString('pt-BR');
const ICONES=['🍓','🍊','🍋','🍉','🍇','🍑','🌸','🌻','🌷','🐾','🧶','🐟','🍪','☕','🧁','🥛'];
const COLS=7, ROWS=8, SLOTS=7;
const PRECO={desf:20, ima:40, mist:30, volta3:30};

// ---------- Save ----------
const SK='lar_gatinhos_v1';
const PADRAO={fase:1, estrelas:0, moedas:50, comprados:{}, gatos:[], som:true, comodo:0, viu:false};
let S; try{ S=Object.assign({},PADRAO,JSON.parse(localStorage.getItem(SK)||'{}')); }catch(e){ S={...PADRAO}; }
const salvar=()=>{ try{ localStorage.setItem(SK,JSON.stringify(S)); }catch(e){} };
const comp=id=>S.comprados[id]||(S.comprados[id]=[]);

// ---------- Som ----------
const Som={ ctx:null,
  init(){ if(!this.ctx){ try{ this.ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(this.ctx&&this.ctx.state==='suspended') this.ctx.resume(); },
  tom(f,d=.1,tipo='sine',vol=.08,q=0,f2){ if(!S.som||!this.ctx) return; const c=this.ctx,t=c.currentTime+q,o=c.createOscillator(),g=c.createGain();
    o.type=tipo; o.frequency.setValueAtTime(f,t); o.frequency.exponentialRampToValueAtTime(f2||f*1.2,t+d); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.001,t+d); o.connect(g).connect(c.destination); o.start(t); o.stop(t+d+.02); },
  plop(){ this.tom(420,.09,'sine',.09,0,620); }, trinca(){ [784,988,1175].forEach((f,i)=>this.tom(f,.14,'triangle',.07,i*.06)); },
  erro(){ this.tom(200,.14,'triangle',.07,0,150); }, gelo(){ this.tom(2200,.08,'square',.03,0,1500); this.tom(1600,.1,'square',.03,.05,900); },
  chave(){ [1319,1568,2093].forEach((f,i)=>this.tom(f,.1,'triangle',.05,i*.05)); },
  vitoria(){ [523,659,784,1047,1319].forEach((f,i)=>this.tom(f,.22,'triangle',.08,i*.1)); }, derrota(){ [440,370,311].forEach((f,i)=>this.tom(f,.25,'sine',.08,i*.16)); },
  compra(){ [880,1109,1319,1760].forEach((f,i)=>this.tom(f,.12,'sine',.06,i*.07)); },
  miau(){ if(!S.som||!this.ctx) return; const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain(); o.type='triangle';
    o.frequency.setValueAtTime(520,t); o.frequency.linearRampToValueAtTime(820,t+.12); o.frequency.linearRampToValueAtTime(480,t+.45);
    g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.09,t+.05); g.gain.exponentialRampToValueAtTime(.001,t+.5); o.connect(g).connect(c.destination); o.start(t); o.stop(t+.52); }
};
const vibrar=p=>{ try{ navigator.vibrate&&navigator.vibrate(p); }catch(e){} };

// ---------- Gerador de fases (sempre com solução) ----------
function rng(seed){ let a=seed>>>0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const cobre=(a,b)=>b.l>a.l && Math.abs(a.x-b.x)<1 && Math.abs(a.y-b.y)<1;
function gerar(n){
  const r=rng(n*7907+3), emb=a=>{ for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  const camadas=Math.min(2+Math.floor((n-1)/3),6), tipos=Math.min(4+Math.floor(n/3),12);
  let alvo=Math.min(24+(n-1)*3,96); alvo-=alvo%3;
  const pesos=[...Array(camadas)].map((_,l)=>camadas-l+1), soma=pesos.reduce((a,b)=>a+b,0);
  let pecas=[];
  for(let l=0;l<camadas;l++){
    const off=(l%2)*.5, m=Math.min(l*.5,1.5), cota=Math.round(alvo*pesos[l]/soma)+2;
    const cand=[]; for(let x=m;x<=COLS-1-m-off+1e-9;x++) for(let y=m;y<=ROWS-1-m-off+1e-9;y++){ const xa=x+off; if(xa<=(COLS-1)/2) cand.push([xa,y+off]); }
    emb(cand); const usadas=new Set(); let k=0;
    for(const [xa,ya] of cand){ if(k>=cota) break; const xb=COLS-1-xa;
      for(const xx of (Math.abs(xb-xa)<.01?[xa]:[xa,xb])){ const ch=xx+','+ya; if(usadas.has(ch)) continue; usadas.add(ch); pecas.push({x:xx,y:ya,l}); k++; } }
  }
  // corta para múltiplo de 3 (tirando de cima)
  pecas.sort((a,b)=>a.l-b.l); while(pecas.length>alvo) pecas.pop(); pecas.length-=pecas.length%3;
  const temChave=n>=10;
  if(temChave){ const top=Math.max(...pecas.map(p=>p.l)); const livres=[]; for(let x=0;x<COLS;x++) for(let y=0;y<ROWS;y++) if(!pecas.some(p=>p.l===top+1&&Math.abs(p.x-x)<1&&Math.abs(p.y-y)<1)) livres.push([x,y]);
    const [cx,cy]=livres[Math.floor(r()*livres.length)]; pecas.push({x:cx,y:cy,l:top+1,chave:true}); }
  pecas.forEach((p,i)=>p.id=i);
  // ordem de retirada possível (de cima para baixo)
  const resta=new Set(pecas.map(p=>p.id)), ordem=[];
  while(resta.size){ const ac=[...resta].filter(i=>![...resta].some(j=>cobre(pecas[i],pecas[j]))); const e=ac[Math.floor(r()*ac.length)]; ordem.push(e); resta.delete(e); }
  // tipos em blocos embaralhados: seguindo essa ordem, a bandeja nunca enche
  const semChave=ordem.filter(i=>!pecas[i].chave), bloco=n<15?6:9;
  for(let b=0;b<semChave.length;b+=bloco){
    const parte=semChave.slice(b,b+bloco), qt=parte.length/3, ts=emb([...Array(tipos).keys()]).slice(0,qt);
    const lista=emb(ts.flatMap(t=>[t,t,t])); parte.forEach((id,k)=>pecas[id].tipo=lista[k]);
  }
  // gelo: só onde as trincas anteriores garantem o derretimento
  if(n>=6) semChave.forEach((id,p)=>{ const blocosAntes=Math.floor(p/bloco), max=Math.min(3,blocosAntes*bloco/3); if(max>=1 && r()<.08) pecas[id].gelo=1+Math.floor(r()*max); });
  // corrente: só peças que vêm depois da chave na ordem
  if(temChave){ const q=ordem.findIndex(i=>pecas[i].chave); ordem.slice(q+1).forEach(id=>{ if(!pecas[id].chave && !pecas[id].gelo && r()<.1) pecas[id].corrente=true; }); }
  return { n, pecas, tipos, total:semChave.length };
}

// ---------- Estado do jogo ----------
let J=null;
function iniciar(n){
  Som.init(); fecharModal();
  const g=gerar(n);
  J={ n, pecas:g.pecas.map(p=>({...p,vivo:true})), band:[], trincas:0, chave:false, hist:[], gratis:{desf:1,ima:1,mist:1}, busy:false, max:0, fim:false };
  mostrar('jogo'); montaSlots(); desenhaTab(); hudJogo();
  if(n===1) setTimeout(()=>toast('Toque nas peças claras: 3 iguais somem!'),400);
  if(n===6) setTimeout(()=>toast('🧊 Peça congelada derrete a cada trinca'),400);
  if(n===10) setTimeout(()=>toast('🔑 Pegue a chave para soltar as correntes'),400);
}
function tamanhos(){ const el=$('tab'), W=el.clientWidth, H=el.clientHeight; const ts=Math.floor(Math.min(W/(COLS+.2), H/(ROWS+.5))); return {ts, ox:(W-COLS*ts)/2, oy:Math.max(0,(H-ROWS*ts)/2-ts*.1)}; }
function desenhaTab(){
  const el=$('tab'); el.innerHTML=''; const {ts,ox,oy}=tamanhos(); el.style.setProperty('--ts',ts+'px');
  J.pecas.forEach(p=>{ if(!p.vivo) return;
    const d=document.createElement('div'); d.className='peca'+(p.chave?' chave':''); d.dataset.id=p.id;
    d.style.cssText+=`left:${ox+p.x*ts+2}px;top:${oy+p.y*ts+2-p.l*3}px;width:${ts-4}px;height:${ts-4}px;z-index:${p.l*20+Math.round(p.y*2)}`;
    d.innerHTML=`<span>${p.chave?'🔑':ICONES[p.tipo]}</span>`+(p.gelo?`<div class="gelo">${p.gelo}</div>`:'')+(p.corrente&&!J.chave?'<div class="corrente">⛓️</div>':'');
    el.appendChild(d); p.el=d; });
  atualizaCobertas();
}
function atualizaCobertas(){ const vivos=J.pecas.filter(p=>p.vivo); vivos.forEach(p=>{ const cob=vivos.some(q=>cobre(p,q)); p.cob=cob; p.el&&p.el.classList.toggle('coberta',cob); }); }
function montaSlots(){ $('slots').innerHTML=Array.from({length:SLOTS},()=>'<div class="slot"></div>').join(''); document.querySelectorAll('.voa').forEach(e=>e.remove()); }
function rectSlot(k){ return $('slots').children[k].getBoundingClientRect(); }
function layoutBandeja(){
  J.band.forEach((it,k)=>{ const r=rectSlot(k); Object.assign(it.el.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'}); it.el.firstChild.style.fontSize=(r.width*.6)+'px'; });
  $('bandeja').classList.toggle('alerta', J.band.length>=SLOTS-1);
}
function hudJogo(){
  $('j-fase').textContent='Fase '+J.n; $('j-moe').textContent='🪙 '+fmt(S.moedas);
  $('j-resta').textContent='🧩 '+J.pecas.filter(p=>p.vivo&&!p.chave).length;
  ['desf','ima','mist'].forEach(k=>$('pr-'+k).textContent= J.gratis[k]>0 ? 'grátis' : '🪙 '+PRECO[k]);
}

async function tocar(e){
  const d=e.target.closest('.peca'); if(!d||!J||J.busy||J.fim) return; Som.init();
  const p=J.pecas[+d.dataset.id]; if(!p.vivo) return;
  if(p.cob){ treme(d); Som.erro(); return; }
  if(p.chave){ J.busy=true; Som.chave(); vibrar(30); p.vivo=false; particulas(d.getBoundingClientRect(),'#f2c14e',14); d.style.transition='.4s'; d.style.transform='translateY(-60px) scale(1.4) rotate(20deg)'; d.style.opacity=0;
    await espera(350); d.remove(); J.chave=true; J.pecas.forEach(q=>{ if(q.corrente&&q.el){ const c=q.el.querySelector('.corrente'); if(c){ c.style.transition='.4s'; c.style.opacity=0; setTimeout(()=>c.remove(),400);} } });
    grito('Correntes soltas!'); atualizaCobertas(); hudJogo(); J.busy=false; return; }
  if(p.corrente&&!J.chave){ treme(d); Som.erro(); toast('🔑 Pegue a chave primeiro'); return; }
  if(p.gelo>0){ treme(d); Som.gelo(); toast('🧊 Congelada! Faça trincas para derreter'); return; }
  await paraBandeja(p);
}
async function paraBandeja(p){
  J.busy=true; Som.plop(); vibrar(8);
  const r=p.el.getBoundingClientRect(); p.vivo=false; p.el.remove(); p.el=null;
  const v=document.createElement('div'); v.className='voa'; v.innerHTML=`<span style="font-size:${r.width*.6}px">${ICONES[p.tipo]}</span>`;
  Object.assign(v.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'}); document.body.appendChild(v);
  let pos=J.band.length; for(let k=J.band.length-1;k>=0;k--) if(J.band[k].tipo===p.tipo){ pos=k+1; break; }
  J.band.splice(pos,0,{tipo:p.tipo, id:p.id, el:v}); J.hist.push(p.id); J.max=Math.max(J.max,J.band.length);
  atualizaCobertas(); hudJogo();
  requestAnimationFrame(()=>layoutBandeja());
  await espera(300);
  await checaTrinca();
  J.busy=false;
  checaFim();
}
async function checaTrinca(){
  const cont={}; J.band.forEach(it=>cont[it.tipo]=(cont[it.tipo]||0)+1);
  const t=Object.keys(cont).find(k=>cont[k]>=3); if(t===undefined) return false;
  const tipo=+t, sai=J.band.filter(it=>it.tipo===tipo).slice(0,3);
  sai.forEach(it=>{ particulas(it.el.getBoundingClientRect(),['#ff8fab','#81d8d0','#f2c14e'][Math.floor(Math.random()*3)],8); it.el.classList.add('some'); });
  Som.trinca(); vibrar([15,20,25]);
  await espera(200); sai.forEach(it=>it.el.remove());
  J.band=J.band.filter(it=>!sai.includes(it)); J.hist=J.hist.filter(id=>!sai.some(s=>s.id===id));
  layoutBandeja(); await derreter(); return true;
}
async function derreter(){
  J.trincas++;
  let derreteu=false;
  J.pecas.forEach(p=>{ if(p.vivo&&p.gelo>0){ p.gelo--; const g=p.el&&p.el.querySelector('.gelo'); if(g){ if(p.gelo>0) g.textContent=p.gelo; else { g.style.transition='.35s'; g.style.opacity=0; g.style.transform='scale(1.3)'; setTimeout(()=>g.remove(),350); derreteu=true; particulas(p.el.getBoundingClientRect(),'#bfe9ff',8); } } } });
  if(derreteu) Som.gelo();
}
function checaFim(){
  if(J.fim) return;
  if(!J.pecas.some(p=>p.vivo&&!p.chave) && !J.band.length){ J.fim=true; return setTimeout(vitoria,350); }
  if(J.band.length>=SLOTS){ J.fim=true; return setTimeout(derrota,350); }
}

// ---------- Reforços ----------
function usa(k){ if(J.gratis[k]>0){ J.gratis[k]--; return true; } if(S.moedas<PRECO[k]){ toast('Moedas insuficientes'); Som.erro(); return false; } S.moedas-=PRECO[k]; salvar(); return true; }
async function desfazer(qtd=1){
  if(!J||J.busy) return false;
  const ids=J.hist.filter(id=>J.band.some(it=>it.id===id)); if(!ids.length){ toast('Nada para desfazer'); return false; }
  J.busy=true;
  for(const id of ids.slice(-qtd).reverse()){
    const it=J.band.find(x=>x.id===id); J.band=J.band.filter(x=>x!==it); J.hist=J.hist.filter(x=>x!==id);
    const p=J.pecas[id]; p.vivo=true; it.el.classList.add('some'); setTimeout(()=>it.el.remove(),200);
  }
  desenhaTab(); layoutBandeja(); hudJogo(); Som.tom(500,.12,'sine',.06,0,300); J.busy=false; return true;
}
async function ima(){
  if(!J||J.busy) return; if(!usa('ima')){ return; }
  J.busy=true;
  const cont={}; J.band.forEach(it=>cont[it.tipo]=(cont[it.tipo]||0)+1);
  let tipo=Object.keys(cont).sort((a,b)=>cont[b]-cont[a])[0];
  if(tipo===undefined){ const c2={}; J.pecas.forEach(p=>{ if(p.vivo&&!p.chave) c2[p.tipo]=(c2[p.tipo]||0)+1; }); tipo=Object.keys(c2).sort((a,b)=>c2[b]-c2[a])[0]; }
  tipo=+tipo; const naBand=J.band.filter(it=>it.tipo===tipo); const falta=3-naBand.length;
  const doTab=J.pecas.filter(p=>p.vivo&&!p.chave&&p.tipo===tipo).sort((a,b)=>(a.cob-b.cob)||(b.l-a.l)).slice(0,falta);
  Som.tom(300,.4,'sawtooth',.05,0,1200); grito('🧲 Ímã!');
  doTab.forEach(p=>{ const r=p.el.getBoundingClientRect(); particulas(r,'#81d8d0',10); p.el.style.transition='.35s'; p.el.style.transform='scale(1.3)'; p.el.style.opacity=0; p.vivo=false; });
  naBand.forEach(it=>{ it.el.classList.add('some'); });
  await espera(380); doTab.forEach(p=>{ p.el&&p.el.remove(); p.el=null; }); naBand.forEach(it=>it.el.remove());
  J.band=J.band.filter(it=>!naBand.includes(it)); J.hist=J.hist.filter(id=>!naBand.some(s=>s.id===id));
  Som.trinca(); await derreter(); atualizaCobertas(); layoutBandeja(); hudJogo(); J.busy=false; checaFim();
}
function misturar(){
  if(!J||J.busy) return; if(!usa('mist')) return;
  const vivos=J.pecas.filter(p=>p.vivo&&!p.chave), ts=vivos.map(p=>p.tipo);
  for(let i=ts.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [ts[i],ts[j]]=[ts[j],ts[i]]; }
  vivos.forEach((p,i)=>p.tipo=ts[i]); grito('🔀 Misturado!'); Som.tom(400,.3,'triangle',.06,0,900);
  desenhaTab(); J.pecas.forEach(p=>{ if(p.el){ p.el.style.transform='rotateY(90deg)'; requestAnimationFrame(()=>requestAnimationFrame(()=>{ p.el.style.transition='transform .35s'; p.el.style.transform=''; })); } }); hudJogo();
}

// ---------- Fim de fase ----------
function vitoria(){
  Som.vitoria(); vibrar([30,40,30,40,80]); confete();
  const ganhaEst = 1 + (J.max<=4?1:0), moedas=15;
  S.estrelas+=ganhaEst; S.moedas+=moedas; if(J.n>=S.fase) S.fase=J.n+1; salvar();
  modal(`<h2>Fase ${J.n} limpa!</h2><div class="estrela">${'⭐'.repeat(ganhaEst)}</div>
    <div class="premio"><span>+${ganhaEst} ⭐</span><span>+${moedas} 🪙</span></div>
    ${J.max<=4?'<p>Bônus de calma: a bandeja nunca passou de 4 peças!</p>':''}
    <button class="btn ouro" id="m-casa">🏠 Decorar a casa</button><button class="btn" id="m-prox">Próxima fase ›</button>`);
  $('m-casa').onclick=()=>{ fecharModal(); telaCasa(); }; $('m-prox').onclick=()=>iniciar(S.fase);
}
function derrota(){
  Som.derrota(); vibrar(80);
  modal(`<h2>Bandeja cheia!</h2><p>Faltaram ${J.pecas.filter(p=>p.vivo&&!p.chave).length} peças.</p>
    <button class="btn ouro" id="m-volta">↩️ Devolver 3 peças · 🪙 ${PRECO.volta3}</button><button class="btn" id="m-rep">Tentar de novo</button><button class="btn sec" id="m-casa">🏠 Casa</button>`);
  $('m-volta').style.opacity=S.moedas>=PRECO.volta3?1:.5;
  $('m-volta').onclick=async()=>{ if(S.moedas<PRECO.volta3){ toast('Moedas insuficientes'); return; } S.moedas-=PRECO.volta3; salvar(); fecharModal(); J.fim=false; await desfazer(3); };
  $('m-rep').onclick=()=>iniciar(J.n); $('m-casa').onclick=()=>{ fecharModal(); telaCasa(); };
}

// ---------- Casa (meta) ----------
let casaRaf=0, tCasa=0, novoItem=null;
const comodoLiberado=i=> i===0 || COMODOS[i-1].itens.every(it=>comp(COMODOS[i-1].id).includes(it.id));
function telaCasa(){
  mostrar('casa'); fecharModal();
  if(!comodoLiberado(S.comodo)) S.comodo=0;
  const cm=COMODOS[S.comodo], c=comp(cm.id);
  $('c-est').textContent='⭐ '+S.estrelas; $('c-moe').textContent='🪙 '+fmt(S.moedas);
  $('b-jogar').innerHTML=`Jogar fase ${S.fase}<small>ganhe ⭐ para decorar</small>`;
  $('abas').innerHTML=COMODOS.map((x,i)=>`<button class="aba ${i===S.comodo?'on':''} ${comodoLiberado(i)?'':'bloq'}" data-i="${i}">${comodoLiberado(i)?'':'🔒 '}${x.nome}</button>`).join('');
  $('itens').innerHTML=cm.itens.map(it=>{ const f=c.includes(it.id); return `<button class="item ${f?'feito':''} ${!f&&S.estrelas>=it.custo?'pode':''}" data-id="${it.id}"><span class="ic">${it.ic}</span>${it.nome}<br><span class="preco">${f?'✓':'⭐ '+it.custo}</span></button>`; }).join('');
  $('prog').style.width=(c.length/cm.itens.length*100)+'%';
  const barato=cm.itens.filter(it=>!c.includes(it.id)).sort((a,b)=>a.custo-b.custo)[0];
  const host=(S.gatos[0] && GATOS.find(g=>g.id===S.gatos[0]).nome) || 'Gatinho';
  fala( !barato ? `${cm.nome} pronta! Miau! 💖` : S.estrelas>=barato.custo ? `Temos ⭐! Que tal ${barato.nome.toLowerCase()}?` : `Vamos jogar e ganhar ⭐ para a ${cm.nome.toLowerCase()}!`, host);
  cancelAnimationFrame(casaRaf); casaRaf=requestAnimationFrame(loopCasa);
}
function fala(txt){ const b=$('balao'); b.textContent=txt; b.style.animation='none'; void b.offsetWidth; b.style.animation=''; }
function loopCasa(t){
  if(!$('t-casa').classList.contains('on')) return;
  tCasa=t/1000; const cv=$('casa'), c=cv.getContext('2d'); c.setTransform(2,0,0,2,0,0); c.clearRect(0,0,360,240);
  const cm=COMODOS[S.comodo];
  if(novoItem){ fantasma_t=Math.min(1,(t-novoItem.t0)/500); if(fantasma_t>=1) novoItem=null; }
  desenhaComodo(c,360,240,cm,comp(cm.id),cm.gatos.filter(g=>S.gatos.includes(g)),tCasa, novoItem&&novoItem.id);
  if(novoItem){ for(let k=0;k<8;k++){ const a=k/8*Math.PI*2+tCasa*3, rr=40+fantasma_t*60; c.fillStyle=`rgba(242,193,78,${1-fantasma_t})`; c.beginPath(); c.arc(180+Math.cos(a)*rr,150+Math.sin(a)*rr*.5,4,0,7); c.fill(); } }
  casaRaf=requestAnimationFrame(loopCasa);
}
function comprar(id){
  const cm=COMODOS[S.comodo], it=cm.itens.find(x=>x.id===id), c=comp(cm.id);
  if(c.includes(id)) return;
  if(S.estrelas<it.custo){ Som.erro(); toast(`Precisa de ${it.custo} ⭐. Jogue mais uma fase!`); return; }
  S.estrelas-=it.custo; c.push(id); salvar(); Som.compra(); vibrar([20,30,20]);
  novoItem={id, t0:performance.now()}; fantasma_t=0;
  telaCasa(); fala(`${it.nome} novo! Ficou lindo!`);
  // gatinhos chegam no 3º e no 6º item
  const chega = c.length===3 ? cm.gatos[0] : c.length===6 ? cm.gatos[1] : null;
  if(chega && !S.gatos.includes(chega)){ S.gatos.push(chega); salvar(); setTimeout(()=>chegouGato(chega),900); }
  if(c.length===cm.itens.length && S.comodo<COMODOS.length-1) setTimeout(()=>toast(`🎉 ${cm.nome} completa! ${COMODOS[S.comodo+1].nome} liberado`),2200);
}
function chegouGato(id){
  const g=GATOS.find(x=>x.id===id); Som.miau();
  modal(`<h2>Um gatinho chegou!</h2><canvas id="g-novo" width="240" height="200" style="width:180px;height:150px"></canvas><p><b>${g.nome}</b> adorou a casa e vai morar aqui! 🐾</p>
    <button class="btn" id="m-ok">Miau! 💖</button>`);
  const cv=$('g-novo'), c=cv.getContext('2d'); let ini=performance.now();
  (function anima(t){ if(!$('g-novo')) return; c.setTransform(2,0,0,2,0,0); c.clearRect(0,0,120,100); const e=Math.min(1,(t-ini)/500); gato(c,60,90,g,'senta',t/1000,1.4*(.3+.7*e)); requestAnimationFrame(anima); })(ini);
  $('m-ok').onclick=()=>{ fecharModal(); telaCasa(); };
}
function colecao(){
  modal(`<h2>Meus gatinhos</h2><p>${S.gatos.length} de ${GATOS.length}. Decore os cômodos para chamar mais!</p>
    <div class="gatos">${GATOS.map(g=>`<div class="gc ${S.gatos.includes(g.id)?'':'bloq'}"><canvas width="120" height="120" data-g="${g.id}"></canvas>${S.gatos.includes(g.id)?g.nome:'???'}</div>`).join('')}</div>
    <button class="btn" id="m-ok">Fechar</button>`);
  document.querySelectorAll('.gc canvas').forEach(cv=>{ const c=cv.getContext('2d'); c.setTransform(2,0,0,2,0,0); gato(c,30,54,GATOS.find(g=>g.id===cv.dataset.g),'senta',1,1); });
  $('m-ok').onclick=fecharModal;
}
function regras(){
  modal(`<h2>Como jogar</h2><ul class="regras">
    <li>Toque nas peças <b>claras</b> (as escuras estão cobertas) para levá-las à bandeja.</li>
    <li><b>3 iguais</b> na bandeja somem. Se a bandeja encher com 7 peças, a fase reinicia.</li>
    <li>Limpe o tabuleiro para ganhar <b>⭐</b> e moedas.</li>
    <li>Use as ⭐ para decorar a casa. Novos <b>gatinhos</b> chegam quando você decora!</li></ul>
    <button class="btn ouro" id="m-ok">Vamos lá! 🐾</button>`);
  $('m-ok').onclick=fecharModal;
}

// ---------- Efeitos ----------
const espera=ms=>new Promise(r=>setTimeout(r,ms));
function treme(d){ d.classList.remove('treme'); void d.offsetWidth; d.classList.add('treme'); vibrar(20); }
function particulas(r,cor,n){ for(let k=0;k<n;k++){ const p=document.createElement('div'); p.className='part'; p.style.background=cor; p.style.left=(r.left+r.width/2)+'px'; p.style.top=(r.top+r.height/2)+'px';
  const a=Math.random()*Math.PI*2, v=30+Math.random()*50; p.style.setProperty('--dx',Math.cos(a)*v+'px'); p.style.setProperty('--dy',Math.sin(a)*v+'px'); document.body.appendChild(p); setTimeout(()=>p.remove(),700); } }
function confete(){ const cores=['#ff8fab','#81d8d0','#f2c14e','#b39ddb','#9fd88a']; for(let k=0;k<70;k++){ const p=document.createElement('div'); p.className='part';
  p.style.background=cores[k%5]; p.style.borderRadius='2px'; p.style.left=(innerWidth/2)+'px'; p.style.top=(innerHeight*.45)+'px'; p.style.animationDuration=(1+Math.random())+'s';
  const a=Math.random()*Math.PI*2, v=80+Math.random()*200; p.style.setProperty('--dx',Math.cos(a)*v+'px'); p.style.setProperty('--dy',Math.sin(a)*v+80+'px'); document.body.appendChild(p); setTimeout(()=>p.remove(),2000); } }
let toastT; function toast(t){ const e=$('toast'); e.textContent=t; e.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>e.classList.remove('on'),2200); }
function grito(t){ const g=document.createElement('div'); g.className='grito'; g.textContent=t; document.body.appendChild(g); setTimeout(()=>g.remove(),1100); }
function mostrar(t){ document.querySelectorAll('.tela').forEach(e=>e.classList.remove('on')); $('t-'+t).classList.add('on'); }
function modal(h){ $('mbox').innerHTML=h; $('modal').hidden=false; }
function fecharModal(){ $('modal').hidden=true; }

// ---------- Ligações ----------
$('tab').addEventListener('pointerdown',tocar);
$('bo-desf').onclick=async()=>{ if(!J||J.busy) return; const tem=J.hist.some(id=>J.band.some(it=>it.id===id)); if(!tem){ toast('Nada para desfazer'); return; } if(usa('desf')) await desfazer(1); hudJogo(); };
$('bo-ima').onclick=ima; $('bo-mist').onclick=misturar;
$('j-casa').onclick=()=>{ document.querySelectorAll('.voa').forEach(e=>e.remove()); J=null; telaCasa(); };
$('b-jogar').onclick=()=>iniciar(S.fase);
$('b-gatos').onclick=colecao;
$('b-som').onclick=()=>{ S.som=!S.som; salvar(); $('b-som').textContent=S.som?'🔊':'🔇'; };
$('abas').addEventListener('click',e=>{ const b=e.target.closest('.aba'); if(!b) return; const i=+b.dataset.i; if(!comodoLiberado(i)){ toast('Complete o cômodo anterior'); return; } S.comodo=i; salvar(); telaCasa(); });
$('itens').addEventListener('click',e=>{ const b=e.target.closest('.item'); if(b){ Som.init(); comprar(b.dataset.id); } });
$('casa').addEventListener('pointerdown',()=>{ Som.init(); Som.miau(); fala(['Miau!','Purrr…','Que casa linda!','Bora jogar? 🐾'][Math.floor(Math.random()*4)]); });
addEventListener('resize',()=>{ if(J&&$('t-jogo').classList.contains('on')){ desenhaTab(); layoutBandeja(); } });
$('rodape').textContent=`${CONFIG.SISTEMA} v${CONFIG.VERSAO}•Desenvolvido por ${CONFIG.DESENVOLVEDOR}`;
$('b-som').textContent=S.som?'🔊':'🔇';
telaCasa();
if(!S.viu){ S.viu=true; salvar(); regras(); }
