// Febre Doces — interface, campanha e gamificação
const CONFIG = { SISTEMA:'Febre Doces', VERSAO:'0.1.0.0', DESENVOLVEDOR:'Vettore Sistemas' };
const { C, L, N, Tab, MUNDOS, fase, TOTAL_FASES, BONUS_JOGADA } = FD;
const $ = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString('pt-BR');
const hoje = () => { const d=new Date(); return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate(); };
const limpa = s => ((s||'').toString().replace(/[<>&"']/g,'').slice(0,16)) || 'Amigo';
const espera = ms => new Promise(r=>setTimeout(r,ms));
const PRECO = { mar:30, mis:20, mais:40 };

// ---------- Save ----------
const SAVE_KEY='febre_doces_v1';
const PADRAO = { desbloq:1, est:{}, melhor:{}, moedas:60, xp:0, conq:{}, som:true, bau:0, dia:0, nome:'', st:{bombas:0,arcos:0,maior:0,desafios:0,vitorias:0}, duos:{} };
let S;
try { S = Object.assign({}, PADRAO, JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')); S.st=Object.assign({},PADRAO.st,S.st); } catch(e){ S = JSON.parse(JSON.stringify(PADRAO)); }
const salvar = () => { try{ localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }catch(e){} };
const totalEst = () => Object.values(S.est).reduce((a,b)=>a+b,0);
const nivelJog = () => Math.floor(Math.sqrt(S.xp/40))+1;

// ---------- Som ----------
const Som = {
  ctx:null,
  init(){ if(!this.ctx){ try{ this.ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(this.ctx&&this.ctx.state==='suspended') this.ctx.resume(); },
  tom(f,d=.12,tipo='sine',vol=.14,q=0){ if(!S.som||!this.ctx) return; const c=this.ctx,t=c.currentTime+q,o=c.createOscillator(),g=c.createGain();
    o.type=tipo; o.frequency.setValueAtTime(f,t); o.frequency.exponentialRampToValueAtTime(f*1.45,t+d);
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.001,t+d); o.connect(g).connect(c.destination); o.start(t); o.stop(t+d+.02); },
  pop(n){ this.tom(380+Math.min(n,12)*55,.13,'triangle'); if(n>=5) this.tom(760+n*40,.15,'sine',.08,.06); },
  boom(){ this.tom(110,.35,'sawtooth',.16); this.tom(70,.4,'sine',.2); },
  erro(){ this.tom(170,.14,'square',.06); },
  moeda(){ this.tom(990,.07,'square',.05); },
  vitoria(){ [523,659,784,1047].forEach((f,i)=>this.tom(f,.22,'triangle',.14,i*.12)); },
  derrota(){ [392,330,262].forEach((f,i)=>this.tom(f,.25,'triangle',.12,i*.16)); }
};
const vibrar = p => { try{ navigator.vibrate && navigator.vibrate(p); }catch(e){} };

// ---------- UI util ----------
let toastT;
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'),2200); }
function grito(txt){ const g=document.createElement('div'); g.className='grito'; g.textContent=txt; document.body.appendChild(g); setTimeout(()=>g.remove(),1000); }
function mostrar(t){ document.querySelectorAll('.tela').forEach(e=>e.classList.remove('on')); $('t-'+t).classList.add('on'); }
function modal(html){ $('mbox').innerHTML=html; $('modal').hidden=false; }
function fecharModal(){ $('modal').hidden=true; }
function ganharMoedas(n){ if(n<=0) return; S.moedas+=n; salvar(); Som.moeda(); atualizaBarra(); }

// ---------- Conquistas ----------
const CONQ = [
  { id:'primeira', ic:'🍬', nome:'Primeira mordida', desc:'Vença a fase 1', pr:15, ok:()=>S.desbloq>1 },
  { id:'bomba',    ic:'💥', nome:'Docinho explosivo', desc:'Crie uma bomba (5+ doces de uma vez)', pr:15, ok:()=>S.st.bombas>0 },
  { id:'arco',     ic:'🌈', nome:'Arco-íris', desc:'Crie um arco-íris (7+ doces de uma vez)', pr:20, ok:()=>S.st.arcos>0 },
  { id:'grupo10',  ic:'🔥', nome:'Febre Doce', desc:'Estoure 10+ doces de uma vez', pr:25, ok:()=>S.st.maior>=10 },
  { id:'perfeito', ic:'⭐', nome:'Perfeição', desc:'Faça 3 estrelas numa fase', pr:20, ok:()=>Object.values(S.est).some(v=>v>=3) },
  { id:'mundo1',   ic:'🍫', nome:'Rei do Brigadeiro', desc:'Complete a Vila do Brigadeiro', pr:40, ok:()=>S.desbloq>10 },
  { id:'mundo2',   ic:'🐻', nome:'Amigo dos Ursinhos', desc:'Complete o Bosque das Jujubas', pr:60, ok:()=>S.desbloq>20 },
  { id:'mundo3',   ic:'🍮', nome:'Mestre do Pudim', desc:'Complete o Lago de Pudim', pr:80, ok:()=>S.desbloq>30 },
  { id:'mundo4',   ic:'👑', nome:'Majestade Doce', desc:'Complete o Castelo de Cupcake', pr:150, ok:()=>S.desbloq>40 },
  { id:'est30',    ic:'🌟', nome:'Céu estrelado', desc:'Junte 30 estrelas', pr:30, ok:()=>totalEst()>=30 },
  { id:'est90',    ic:'✨', nome:'Constelação', desc:'Junte 90 estrelas', pr:80, ok:()=>totalEst()>=90 },
  { id:'duelo',    ic:'🤝', nome:'Ganha-ganha', desc:'Desafie um amigo', pr:20, ok:()=>S.st.desafios>0 },
  { id:'diario',   ic:'📅', nome:'Doce de todo dia', desc:'Vença um desafio do dia', pr:20, ok:()=>S.dia>0 },
];
async function checaConquistas(){
  for (const c of CONQ){
    if (!S.conq[c.id] && c.ok()){
      S.conq[c.id]=1; salvar(); ganharMoedas(c.pr);
      toast(`🏆 ${c.nome}! +${c.pr} 🪙`); await espera(2300);
    }
  }
}
function telaConq(){
  const feitas=CONQ.filter(c=>S.conq[c.id]).length;
  $('c-qtd').textContent=`${feitas}/${CONQ.length}`;
  $('c-lista').innerHTML = CONQ.map(c=>`<div class="conq ${S.conq[c.id]?'':'off'}"><div class="ic">${c.ic}</div><div><b>${c.nome}</b><small>${c.desc}</small></div><div class="pr">${S.conq[c.id]?'✓':'🪙 '+c.pr}</div></div>`).join('');
  mostrar('conq');
}

// ---------- Mapa ----------
function atualizaBarra(){
  $('h-nivel').textContent='Nv '+nivelJog();
  $('h-est').textContent='⭐ '+totalEst();
  $('h-moe').textContent='🪙 '+fmt(S.moedas);
  $('h-som').textContent=S.som?'🔊':'🔇';
  $('bau-dot').hidden = S.bau===hoje();
  $('dia-dot').hidden = S.dia===hoje();
}
function montaMapa(){
  const mapa=$('mapa'); mapa.innerHTML='';
  const ESP=96, TOPO=70;
  MUNDOS.forEach((M,m)=>{
    const h=TOPO+10*ESP+20;
    const div=document.createElement('div'); div.className='mundo';
    div.style.height=h+'px';
    div.style.background=`linear-gradient(180deg, ${M.cor}, ${M.claro} 18%, ${M.claro} 82%, ${MUNDOS[m+1]?MUNDOS[m+1].cor:M.claro})`;
    const pts=[];
    let nos='';
    for (let f=0;f<10;f++){
      const n=m*10+f+1, x=50+27*Math.sin(n*0.85), y=TOPO+f*ESP;
      pts.push(`${x},${y+33}`);
      const bloq=n>S.desbloq, atual=n===S.desbloq, e=S.est[n]||0;
      const est = bloq ? '' : `<span class="est">${'<b>★</b>'.repeat(e)}${'★'.repeat(3-e)}</span>`;
      nos += `<button class="no ${bloq?'bloq':''} ${atual?'atual':''}" data-n="${n}" style="left:${x}%;top:${y}px;background:${M.cor}">${bloq?'🔒':n}${est}${atual?'<span class="eu">🍭</span>':''}</button>`;
    }
    let deco='';
    for (let i=0;i<8;i++){ const lado=i%2, y=TOPO+i*120+((i*37)%50); deco+=`<span class="deco" style="${lado?'right':'left'}:${4+(i*13)%10}%;top:${y}px">${M.deco[i%M.deco.length]}</span>`; }
    div.innerHTML = `<div class="mundo-nome" style="background:${M.cor}">${M.nome}</div>
      <svg class="trilha" viewBox="0 0 100 ${h}" preserveAspectRatio="none"><polyline points="${pts.join(' ')}" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="14" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${pts.join(' ')}" fill="none" stroke="${M.cor}" stroke-width="4" stroke-dasharray="2 10" vector-effect="non-scaling-stroke" stroke-linecap="round" opacity=".7"/></svg>
      ${deco}${nos}`;
    mapa.appendChild(div);
  });
  const fim=document.createElement('div'); fim.className='fim-mapa'; fim.style.background=MUNDOS[MUNDOS.length-1].claro; fim.style.color=MUNDOS[MUNDOS.length-1].cor;
  fim.textContent='🍰 Novos mundos em breve! 🍰'; mapa.appendChild(fim);
  mapa.onclick = e => { const b=e.target.closest('.no'); if(!b) return; Som.init(); const n=+b.dataset.n;
    if (n>S.desbloq){ toast('Complete a fase anterior para liberar'); Som.erro(); return; } preFase(fase(n),'fase'); };
  atualizaBarra();
  requestAnimationFrame(()=>{ const a=mapa.querySelector('.no.atual')||mapa.querySelector('.no:not(.bloq):last-of-type'); if(a){ mapa.style.scrollBehavior='auto'; mapa.scrollTop=a.offsetTop+a.parentElement.offsetTop-mapa.clientHeight/2; mapa.style.scrollBehavior=''; } });
}

// ---------- Objetivos ----------
function objIcone(f){
  if (f.tipo==='pontos') return '🎯';
  if (f.tipo==='coletar') return svgTipo(f.coletaTipo);
  if (f.tipo==='geleia') return '<div class="geli"></div>';
  return `<svg viewBox="0 0 100 100">${CHOC(2)}</svg>`;
}
function objTexto(f){
  if (f.tipo==='pontos') return `Faça ${fmt(f.alvo)} pontos`;
  if (f.tipo==='coletar') return `Colete ${f.qtd} ${NOMES[f.coletaTipo].toLowerCase()}${f.qtd>1?'s':''}`;
  if (f.tipo==='geleia') return `Limpe todas as ${f.geleia} geleias`;
  return `Quebre todos os ${f.blocos} chocolates`;
}
function dicaFase(f){
  if (f.n===1) return '👆 Toque em <b>3 ou mais doces iguais</b> que estejam grudados para estourar. Quanto maior o grupo, mais pontos!';
  if (f.n===2) return '💥 Estoure <b>5 ou 6 doces</b> de uma vez para criar uma <b>bomba</b>. Toque nela para explodir tudo em volta!';
  if (f.n===3) return '🍓 A <b>geleia</b> fica embaixo dos doces. Estoure os doces em cima dela para limpar.';
  if (f.n===4) return '🌈 Estoure <b>7 ou mais</b> de uma vez para criar o <b>arco-íris</b>: ele leva todos os doces da cor mais comum!';
  if (f.n===11) return '🍫 O <b>chocolate</b> não estoura sozinho. Estoure doces <b>ao lado</b> dele (2 vezes) ou use uma bomba.';
  if (f.n===6) return '💡 Ficou parado? O jogo mostra uma <b>sugestão</b> de jogada piscando.';
  return '';
}

// ---------- Jogo ----------
let J=null, ociosoT=null;

function preFase(f, modo, extra){
  const melhor=S.melhor[f.n]||0, e=S.est[f.n]||0;
  const titulo = modo==='dia' ? 'Desafio do dia' : `Fase ${f.n}`;
  const dica = dicaFase(f);
  modal(`<h2>${titulo}</h2>
    ${modo==='fase'?`<p class="sub">${MUNDOS[f.m].nome}</p>`:''}
    ${extra||''}
    <div class="objbox"><div class="ic">${objIcone(f)}</div><div>${objTexto(f)}<br><span class="sub">em ${f.jog} jogadas</span></div></div>
    ${modo==='fase'&&melhor?`<p class="sub">Seu recorde: ${fmt(melhor)} pts · ${'⭐'.repeat(e)}</p>`:''}
    <p class="sub">⭐⭐ ${fmt(f.s2)} pts · ⭐⭐⭐ ${fmt(f.s3)} pts</p>
    ${dica?`<div class="dicabox">${dica}</div>`:''}
    <button class="btn verde" id="m-jogar">Jogar!</button>
    <button class="btn sec" id="m-fechar">Voltar</button>`);
  $('m-jogar').onclick=()=>{ fecharModal(); iniciar(f,modo); };
  $('m-fechar').onclick=()=>{ fecharModal(); if(modo==='duelo') history.replaceState(null,'',location.pathname); };
}

function iniciar(f, modo){
  Som.init();
  J = { f, modo, tab:new Tab(f, f.seed), jog:f.jog, pts:0, col:0, busy:false, martelo:false, maisUsado:0, fimDado:false };
  if (modo!=='duelo') J.duelo=null; else J.duelo=DUELO;
  $('bo-mar').classList.remove('ativo');
  montaFundo(); render(J.tab.c.map(()=>L)); hud();
  mostrar('jogo'); armaDica();
}
function montaFundo(){ const fu=$('fundo'); fu.innerHTML=''; for(let i=0;i<N;i++) fu.appendChild(document.createElement('div')); }
function render(quedas){
  const fu=$('fundo').children; for(let i=0;i<N;i++) fu[i].className=J.tab.gel[i]?'gel':'';
  const d=$('doces'); d.innerHTML='';
  const frag=document.createDocumentFragment(); J.els=[];
  for(let i=0;i<N;i++){
    const c=J.tab.c[i], el=document.createElement('div'); el.className='doce';
    el.style.left=(i%C)*12.5+'%'; el.style.top=((i/C)|0)*(100/L)+'%';
    el.innerHTML=svgDoce(c);
    if (quedas && quedas[i]>0){ el.classList.add('semt'); el.style.transform=`translateY(-${quedas[i]*100}%)`; }
    frag.appendChild(el); J.els.push(el);
  }
  d.appendChild(frag);
  if (quedas) requestAnimationFrame(()=>requestAnimationFrame(()=>{ J.els.forEach(el=>{ el.classList.remove('semt'); el.style.transform=''; }); }));
}
function progresso(){
  const f=J.f;
  if (f.tipo==='pontos') return { feito:J.pts>=f.alvo, txt:`${fmt(Math.min(J.pts,f.alvo))}/${fmt(f.alvo)}` };
  if (f.tipo==='coletar') return { feito:J.col>=f.qtd, txt:`${Math.min(J.col,f.qtd)}/${f.qtd}` };
  if (f.tipo==='geleia'){ const r=J.tab.geleias(); return { feito:r===0, txt:`faltam ${r}` }; }
  const r=J.tab.chocolates(); return { feito:r===0, txt:`faltam ${r}` };
}
function estrelasDe(pts, venceu){ if(!venceu) return 0; return pts>=J.f.s3?3:pts>=J.f.s2?2:1; }
function hud(){
  const p=progresso(), f=J.f;
  $('j-obj').className='obj'+(p.feito?' ok':'');
  $('j-obj').innerHTML=`<div class="ic">${objIcone(f)}</div><div><span class="num">${p.feito?'✓ ':''}${p.txt}</span><br><small>${objTexto(f)}</small></div>`;
  $('j-jog').textContent=J.jog;
  $('j-jogb').classList.toggle('pouco', J.jog<=5);
  $('j-pts').textContent=fmt(J.pts);
  const max=f.s3*1.05;
  $('j-bar').style.width=Math.min(100,J.pts/max*100)+'%';
  const s1 = f.tipo==='pontos' ? f.alvo : Math.min(f.s2*0.6, f.s2-1);
  [['st1',s1],['st2',f.s2],['st3',f.s3]].forEach(([id,v],k)=>{ const e=$(id); e.style.left=Math.min(97,v/max*100)+'%';
    e.classList.toggle('on', k===0 ? p.feito : J.pts>=v && (p.feito||f.tipo==='pontos'&&J.pts>=f.alvo)); });
  ['mar','mis','mais'].forEach(k=>$('bo-'+k).style.opacity = S.moedas>=PRECO[k]?1:.45);
}
function armaDica(){
  clearTimeout(ociosoT);
  ociosoT=setTimeout(()=>{ if(!J||J.busy||J.fimDado) return; const d=J.tab.dica(); if(d) d.forEach(k=>J.els[k]&&J.els[k].classList.add('dica')); }, 5000);
}
function limpaDica(){ if(J&&J.els) J.els.forEach(e=>e.classList.remove('dica')); }
function indiceDe(e){ const r=$('doces').getBoundingClientRect(); const x=Math.floor((e.clientX-r.left)/r.width*C), y=Math.floor((e.clientY-r.top)/r.height*L); if(x<0||y<0||x>=C||y>=L) return -1; return y*C+x; }

function particulas(snap, sumidos, expl){
  const fx=$('fx'); const lim=sumidos.slice(0,28);
  lim.forEach(k=>{ const c=snap[k]; const cor = c&&c.choc ? '#6b3a1e' : c&&c.t>=0 ? CORES_DOCE[c.t] : '#fff';
    for(let p=0;p<4;p++){ const d=document.createElement('div'); d.className='part'; d.style.background=cor;
      d.style.left=((k%C)+.5)*12.5+'%'; d.style.top=(((k/C)|0)+.5)*(100/L)+'%';
      const a=Math.random()*Math.PI*2, v=25+Math.random()*45; d.style.setProperty('--dx',Math.cos(a)*v+'px'); d.style.setProperty('--dy',Math.sin(a)*v+'px');
      fx.appendChild(d); setTimeout(()=>d.remove(),560); } });
  expl.forEach(k=>{ const b=document.createElement('div'); b.className='boom'; b.style.left=((k%C)+.5)*12.5+'%'; b.style.top=(((k/C)|0)+.5)*(100/L)+'%'; fx.appendChild(b); setTimeout(()=>b.remove(),420); });
}

async function aplicar(res, snap){
  J.busy=true; limpaDica();
  res.sumidos.forEach(k=>J.els[k]&&J.els[k].classList.add('some'));
  res.chocDano.forEach(k=>J.els[k]&&J.els[k].classList.add('nao'));
  particulas(snap, res.sumidos, res.expl);
  if (res.expl.length){ Som.boom(); vibrar([30,20,40]); $('tab').classList.add('treme'); setTimeout(()=>$('tab').classList.remove('treme'),320); }
  J.pts+=res.pts;
  if (J.f.tipo==='coletar') J.col+=res.col[J.f.coletaTipo]||0;
  hud();
  await espera(190);
  render(res.quedas); hud();
  if (res.criado){ const el=J.els[res.criado.i]; if(el){ el.classList.add('alvo'); setTimeout(()=>el.classList.remove('alvo'),900); } }
  if (res.misturou){ grito('Misturando!'); await espera(500); }
  await espera(280);
  J.busy=false;
  await checaFim();
  armaDica();
}

async function tocar(e){
  if (!J || J.busy || J.fimDado) return;
  e.preventDefault(); Som.init();
  const i=indiceDe(e); if(i<0) return;
  const snap=J.tab.c.map(c=>c&&{...c});
  if (J.martelo){
    if (!J.tab.c[i]) return;
    J.martelo=false; $('bo-mar').classList.remove('ativo');
    S.moedas-=PRECO.mar; salvar(); atualizaBarra();
    const res=J.tab.martelo(i); Som.boom(); vibrar(40);
    await aplicar(res, snap); return;
  }
  if (!J.tab.valida(i)){ const el=J.els[i]; if(el){ el.classList.remove('nao'); void el.offsetWidth; el.classList.add('nao'); } Som.erro(); vibrar(25); return; }
  const res=J.tab.jogar(i);
  J.jog--;
  const n=res.tam;
  Som.pop(n); vibrar(n>=5?[15,20,15]:12);
  if (res.esp==='arco'){ grito('Arco-íris!'); }
  else if (n>=10){ grito('FEBRE DOCE!'); }
  else if (n>=7){ grito('Delícia!'); }
  else if (n>=5){ grito('Que doce!'); }
  if (res.criado){ if(res.criado.esp==='bomba') S.st.bombas++; else S.st.arcos++; }
  if (n>S.st.maior) S.st.maior=n;
  salvar();
  await aplicar(res, snap);
}

async function checaFim(){
  if (J.fimDado) return;
  const p=progresso(), f=J.f;
  const venceObj = f.tipo!=='pontos' && p.feito;
  if (venceObj || J.jog<=0){
    const venceu = f.tipo==='pontos' ? J.pts>=f.alvo : p.feito;
    J.fimDado=true; clearTimeout(ociosoT);
    if (venceu){
      if (J.jog>0){ grito('Febre Final!'); await espera(700);
        while(J.jog>0){ J.jog--; J.pts+=BONUS_JOGADA; Som.moeda(); hud(); await espera(90); } }
      await espera(300); vitoria();
    } else { await espera(300); derrota(); }
  }
}

function linkDesafio(f, pts){ return `${location.origin}${location.pathname}?f=${f.n}&s=${pts}&nm=${encodeURIComponent(S.nome||'Amigo')}`; }
function compartilhar(url, txt){
  if (navigator.share) navigator.share({ text:txt, url }).catch(()=>{});
  else window.open('https://wa.me/?text='+encodeURIComponent(txt+'\n'+url),'_blank');
}
function pedeNome(){ if(!S.nome){ const n=prompt('Seu nome para o desafio:',''); S.nome=limpa(n&&n.trim()||'Amigo'); salvar(); } }
function desafiar(f, pts){
  pedeNome(); S.st.desafios++; salvar();
  compartilhar(linkDesafio(f,pts), `Fiz ${fmt(pts)} pts na Fase ${f.n} do Febre Doces 🍬 Bate isso? Se juntos a gente fizer ${fmt(f.s2*2)}, os dois ganham 50 moedas!`);
  checaConquistas();
}

function blocoDuelo(pts){
  if (!J.duelo) return '';
  const D=J.duelo, total=pts+D.s, meta=J.f.s2*2, bateu=total>=meta;
  const chave=`d_${J.f.n}_${D.s}_${D.nm}`;
  let premio='';
  if (bateu && !S.duos[chave]){ S.duos[chave]=1; salvar(); ganharMoedas(50); premio='<span class="moedas">+50 🪙 da dupla!</span>'; }
  return `<div class="vs"><div><b>${fmt(pts)}</b><span class="sub">Você</span></div><div><b>${fmt(D.s)}</b><span class="sub">${D.nm}</span></div></div>
    <p class="sub">Dupla: ${fmt(total)} / ${fmt(meta)}</p><div class="metab"><i style="width:${Math.min(100,total/meta*100)}%"></i></div>
    <p>${bateu?'🏆 Meta da dupla batida!':'A dupla não chegou na meta.'}</p>${premio}
    <button class="btn zap" id="m-res">Mandar resultado para ${D.nm}</button>`;
}
function ligaDuelo(pts){
  if (!J.duelo || !$('m-res')) return;
  $('m-res').onclick=()=>{ pedeNome(); const D=J.duelo, f=J.f;
    compartilhar(`${location.origin}${location.pathname}?rf=${f.n}&a=${D.s}&an=${encodeURIComponent(D.nm)}&b=${pts}&bn=${encodeURIComponent(S.nome)}`,
      (pts+D.s)>=f.s2*2 ? 'Batemos a meta da dupla no Febre Doces! Abre pra pegar suas 50 moedas 🍬' : `Fiz ${fmt(pts)} contra seus ${fmt(D.s)} no Febre Doces. Bora de novo?`); };
}

function vitoria(){
  Som.vitoria(); vibrar([30,40,30,40,60]);
  const f=J.f, pts=J.pts, e=estrelasDe(pts,true);
  let moedas=5, novas=0, recorde=false;
  if (J.modo==='fase' || J.modo==='duelo'){
    const ant=S.est[f.n]||0; if (e>ant){ novas=e-ant; S.est[f.n]=e; }
    if (pts>(S.melhor[f.n]||0)){ S.melhor[f.n]=pts; recorde=true; }
    if (f.n<=S.desbloq) S.desbloq=Math.max(S.desbloq,f.n+1);
  }
  if (J.modo==='dia' && S.dia!==hoje()){ S.dia=hoje(); moedas+=30; }
  moedas+=novas*10;
  S.xp+=Math.round(pts/50); S.st.vitorias++; salvar(); ganharMoedas(moedas);
  const proxima = (J.modo!=='dia' && f.n<TOTAL_FASES) ? fase(f.n+1) : null;
  modal(`<h2>${J.modo==='dia'?'Desafio vencido!':'Fase '+f.n+' completa!'}</h2>
    <div class="estrelas"><span>★</span><span>★</span><span>★</span></div>
    <p style="font-size:30px;font-weight:900">${fmt(pts)} pts</p>
    ${recorde?'<p class="sub">🎉 Novo recorde!</p>':''}
    <span class="moedas">+${moedas} 🪙</span>
    ${blocoDuelo(pts)}
    ${proxima?'<button class="btn verde" id="m-prox">Próxima fase ›</button>':''}
    ${f.n>0?'<button class="btn zap" id="m-desafio">Desafiar um amigo</button>':''}
    <button class="btn sec" id="m-mapa">Mapa</button>`);
  const sp=document.querySelectorAll('.estrelas span');
  sp.forEach((s,k)=>setTimeout(()=>{ if(k<e){ s.classList.add('on'); Som.tom(700+k*200,.15,'triangle',.12); } else s.classList.add('vazia'); }, 300+k*350));
  if (proxima) $('m-prox').onclick=()=>{ fecharModal(); preFase(proxima,'fase'); };
  if (f.n>0) $('m-desafio').onclick=()=>desafiar(f,pts);
  $('m-mapa').onclick=voltarMapa;
  ligaDuelo(pts);
  setTimeout(checaConquistas, 1500);
}
function derrota(){
  Som.derrota(); vibrar(80);
  const f=J.f, p=progresso();
  modal(`<h2>Faltou pouco!</h2>
    <div class="objbox"><div class="ic">${objIcone(f)}</div><div>${objTexto(f)}<br><span class="sub">${p.txt}</span></div></div>
    <p style="font-size:24px;font-weight:900;margin-top:8px">${fmt(J.pts)} pts</p>
    ${blocoDuelo(J.pts)}
    <button class="btn verde" id="m-mais">+5 jogadas · 🪙 ${PRECO.mais}</button>
    <button class="btn" id="m-rep">Tentar de novo</button>
    <button class="btn sec" id="m-mapa">Mapa</button>`);
  $('m-mais').style.opacity = S.moedas>=PRECO.mais?1:.5;
  $('m-mais').onclick=()=>{ if(S.moedas<PRECO.mais){ toast('Moedas insuficientes. Ganhe com estrelas, conquistas e o baú do dia.'); return; }
    S.moedas-=PRECO.mais; salvar(); atualizaBarra(); fecharModal(); J.jog+=5; J.fimDado=false; hud(); armaDica(); };
  $('m-rep').onclick=()=>{ fecharModal(); iniciar(J.f,J.modo); };
  $('m-mapa').onclick=voltarMapa;
  ligaDuelo(J.pts);
}
function voltarMapa(){ fecharModal(); clearTimeout(ociosoT); if(J&&J.modo==='duelo') history.replaceState(null,'',location.pathname); J=null; montaMapa(); mostrar('mapa'); }

// ---------- Boosters ----------
function podePagar(k){ if (S.moedas>=PRECO[k]) return true; toast('Moedas insuficientes. Ganhe com estrelas, conquistas e o baú do dia.'); Som.erro(); return false; }
$('bo-mar').onclick=()=>{ if(!J||J.busy||J.fimDado) return; if(J.martelo){ J.martelo=false; $('bo-mar').classList.remove('ativo'); return; }
  if(!podePagar('mar')) return; J.martelo=true; $('bo-mar').classList.add('ativo'); toast('Toque no doce ou chocolate que quer quebrar'); };
$('bo-mis').onclick=async()=>{ if(!J||J.busy||J.fimDado||!podePagar('mis')) return; S.moedas-=PRECO.mis; salvar(); atualizaBarra();
  J.busy=true; limpaDica(); J.tab.misturar(); J.tab.garantir(); grito('Misturando!'); render(J.tab.c.map(()=>L)); hud(); await espera(400); J.busy=false; armaDica(); };
$('bo-mais').onclick=()=>{ if(!J||J.busy||J.fimDado||!podePagar('mais')) return; S.moedas-=PRECO.mais; salvar(); atualizaBarra(); J.jog+=5; hud(); grito('+5 jogadas!'); };

// ---------- Desafio do dia e baú ----------
function faseDoDia(){
  const base=fase(18);
  return { ...base, n:0, m:0, tipo:'pontos', tipos:5, blocos:3, geleia:0, seed:hoje() };
}
$('n-dia').onclick=()=>{ Som.init(); preFase(faseDoDia(),'dia', S.dia===hoje()?'<p class="sub">✓ Você já venceu hoje. Pode jogar para treinar!</p>':'<p class="sub">O mesmo tabuleiro para todo mundo hoje. Vencer dá <b>+30 🪙</b>.</p>'); };
$('n-bau').onclick=()=>{ Som.init();
  if (S.bau===hoje()){ modal(`<h2>Baú do dia</h2><p style="font-size:60px">📦</p><p>Você já abriu o baú hoje.<br>Volte amanhã!</p><button class="btn sec" id="m-ok">Ok</button>`); $('m-ok').onclick=fecharModal; return; }
  const v=10+Math.floor(Math.random()*4)*5; S.bau=hoje(); salvar();
  modal(`<h2>Baú do dia</h2><p style="font-size:64px">🎁</p><p>Você ganhou</p><span class="moedas" style="font-size:24px">+${v} 🪙</span><button class="btn verde" id="m-ok">Oba!</button>`);
  ganharMoedas(v); $('m-ok').onclick=fecharModal; };
$('n-conq').onclick=telaConq;
$('c-volta').onclick=()=>{ montaMapa(); mostrar('mapa'); };
$('h-som').onclick=()=>{ S.som=!S.som; salvar(); atualizaBarra(); Som.init(); };
$('j-sair').onclick=()=>{ if(!J) return; modal(`<h2>Sair da fase?</h2><p>Você vai perder o progresso desta partida.</p><button class="btn" id="m-sim">Sair</button><button class="btn sec" id="m-nao">Continuar jogando</button>`);
  $('m-sim').onclick=voltarMapa; $('m-nao').onclick=fecharModal; };
$('doces').addEventListener('pointerdown', tocar);

// ---------- Links de duelo ----------
let DUELO=null;
function lerLinks(){
  const P=new URLSearchParams(location.search);
  if (P.get('rf')){
    const n=+P.get('rf'), a=+P.get('a')||0, b=+P.get('b')||0, an=limpa(P.get('an')), bn=limpa(P.get('bn'));
    if (!(n>=1&&n<=TOTAL_FASES)) return;
    const f=fase(n), total=a+b, meta=f.s2*2, bateu=total>=meta, chave=`r_${n}_${a}_${b}`;
    let premio=''; if (bateu && !S.duos[chave]){ S.duos[chave]=1; salvar(); ganharMoedas(50); premio='<span class="moedas">+50 🪙 da dupla!</span>'; }
    modal(`<h2>Resultado da dupla</h2><p class="sub">Fase ${n}</p>
      <div class="vs"><div><b>${fmt(a)}</b><span class="sub">${an}</span></div><div><b>${fmt(b)}</b><span class="sub">${bn}</span></div></div>
      <p class="sub">Dupla: ${fmt(total)} / ${fmt(meta)}</p><div class="metab"><i style="width:${Math.min(100,total/meta*100)}%"></i></div>
      <p>${bateu?'🏆 Meta batida!':'Não deu desta vez.'}</p>${premio}<button class="btn verde" id="m-ok">Jogar</button>`);
    $('m-ok').onclick=()=>{ history.replaceState(null,'',location.pathname); fecharModal(); };
  } else if (P.get('f')){
    const n=+P.get('f'); if (!(n>=1&&n<=TOTAL_FASES)) return;
    DUELO={ s:+P.get('s')||0, nm:limpa(P.get('nm')) };
    const f=fase(n);
    preFase(f,'duelo',`<div class="dicabox">🤝 <b>${DUELO.nm}</b> fez <b>${fmt(DUELO.s)} pts</b> nesta fase. Juntos, cheguem a <b>${fmt(f.s2*2)}</b> e <b>os dois</b> ganham 50 🪙!</div>`);
  }
}

// ---------- Início ----------
document.body.insertAdjacentHTML('afterbegin', DEFS);
$('rodape').textContent = `${CONFIG.SISTEMA} v${CONFIG.VERSAO}•Desenvolvido por ${CONFIG.DESENVOLVEDOR}`;
montaMapa();
lerLinks();
