// Família em Ação — plataforma e quebra-cabeça em 2D
const CONFIG = { SISTEMA:'Família em Ação', VERSAO:'0.7.0.0', DESENVOLVEDOR:'Vettore Sistemas' };
const $ = id => document.getElementById(id);
const VW = 480, VH = 300, DT = 1/60, G = 1400;
const fmtT = s => { s=Math.floor(s); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
const limpa = s => ((s||'').toString().replace(/[<>&"']/g,'').slice(0,16)) || 'Amigo';

const PERS = [
  { id:'william', nome:'William', curto:'William', vel:165, pulo:-500, h:44, ic:'💪', poder:'Força: Ombrada que derruba parede rachada e robôs' },
  { id:'kelly',   nome:'Kelly',   curto:'Kelly',   vel:140, pulo:-545, h:40, ic:'🛡️', poder:'Proteção: o quadro-negro bloqueia laser; erguido, vira degrau, plana e sobe no vento' },
  { id:'junior',  nome:'Junior',  curto:'Junior',  vel:160, pulo:-530, h:42, ic:'🤏', poder:'Encolher: fica pequeno para passar por vãos e apertar botões' },
];
const KE=1, JU=2;
const PODERES = ['💪 Força','🛡️ Proteção','🤏 Encolher'];
const FAM_PADRAO = { sobrenome:'', membros:[{nome:'William',vis:'oculos'},{nome:'Kelly',vis:'longo'},{nome:'Junior',vis:'bone'}] };
const H_AGACH = 20;

// ---------- Save ----------
const SK='familia_oliveira_v3';
let S; try{ S=Object.assign({desbloq:1,est:{},tempo:{},som:true,nome:'',viuAbertura:false,familia:null}, JSON.parse(localStorage.getItem(SK)||'{}')); }catch(e){ S={desbloq:1,est:{},tempo:{},som:true,nome:'',viuAbertura:false,familia:null}; }
const salvar = () => { try{ localStorage.setItem(SK, JSON.stringify(S)); }catch(e){} };

// ---------- Família do jogador ----------
const fam = () => S.familia || FAM_PADRAO;
function aplicaFamilia(){
  const F2=fam();
  PERS.forEach((p,i)=>{ const m=F2.membros[i]||FAM_PADRAO.membros[i]; p.nome=p.curto=m.nome; p.vis=m.vis; });
  const sob=(F2.sobrenome||'').trim();
  document.title='Família em Ação'; const t=$('titulo-sob'); if(t){ t.textContent= sob ? 'Família '+sob : ''; t.hidden=!sob; }
}
const ORIGINAIS={William:0,Kelly:1,Junior:2};
const trocaNomes = txt => txt.replace(/\{(\d)\}/g,(_,i)=>PERS[+i].curto).replace(/\b(William|Kelly|Junior)\b/g, n=>PERS[ORIGINAIS[n]].curto);

// ---------- Som ----------
const Som = { ctx:null,
  init(){ if(!this.ctx){ try{ this.ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(this.ctx&&this.ctx.state==='suspended') this.ctx.resume(); },
  tom(f,d=.1,tipo='square',vol=.06,q=0,f2){ if(!S.som||!this.ctx) return; const c=this.ctx,t=c.currentTime+q,o=c.createOscillator(),g=c.createGain();
    o.type=tipo; o.frequency.setValueAtTime(f,t); o.frequency.exponentialRampToValueAtTime(f2||f*1.3,t+d); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.001,t+d);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t+d+.02); },
  pulo(){ this.tom(300,.12,'square',.05,0,600); }, estrela(){ this.tom(880,.08,'square',.05); this.tom(1320,.1,'square',.05,.08); },
  quebra(){ this.tom(120,.25,'sawtooth',.1,0,50); }, tiro(){ this.tom(700,.06,'triangle',.06,0,300); }, laser(){ this.tom(1200,.12,'sawtooth',.03,0,400); },
  dano(){ this.tom(200,.2,'square',.08,0,80); }, clique(){ this.tom(500,.06,'square',.06); this.tom(900,.08,'square',.06,.07); },
  bloq(){ this.tom(1500,.05,'triangle',.06); }, vitoria(){ [523,659,784,1047].forEach((f,i)=>this.tom(f,.18,'square',.06,i*.12)); },
  troca(){ this.tom(600,.05,'triangle',.05); }, fala(){ this.tom(420+Math.random()*200,.04,'triangle',.03); }
};
const vibrar = p => { try{ navigator.vibrate && navigator.vibrate(p); }catch(e){} };

// ---------- Estado ----------
let F=null, cv, ctx, rodando=false, raf=0;

function novoPers(i, x, yBase){ const d=PERS[i]; return { ...d, i, x, y:yBase-d.h, w:18, h:d.h, vx:0, vy:0, chao:false, dir:1, hp:3, inv:0, cd:0, dash:0, guarda:false, agach:false, saida:false, anim:0, coyote:0, empurra:0 }; }
function carregar(n){
  const def=FASES[n-1];
  const mapa=def.mapa.map(l=>l.split('')); const W=mapa[0].length;
  const ps=[], robos=[], perd=[];
  for(let y=0;y<10;y++) for(let x=0;x<W;x++){
    const c=mapa[y][x];
    if('123'.includes(c)){ const i=+c-1; ps[i]=novoPers(i, x*T+6, (y+1)*T); mapa[y][x]='.'; }
    if(c==='X'||c==='Y'){ const it=PERDIDOS.filter(q=>q.fase===n)[c==='X'?0:1]; if(it) perd.push({ it, x, y, achado:perdidosAchados().includes(it.id) }); mapa[y][x]='.'; }
    if(c==='R'){ robos.push({ x:x*T+4, y:y*T+6, w:22, h:24, vx:40, vy:0, dir:-1, hp:2, cd:1.5, morto:false, pisca:0, mira:false }); mapa[y][x]='.'; }
  }
  let saida={x:0,y:0}; for(let y=0;y<10;y++) for(let x=0;x<W;x++) if(mapa[y][x]==='S') saida={x,y};
  F = { n, def, perd, novos:[], tema:def.tema, mapa, W, ps, robos, ativo:0, aberto:false, porta:false, cam:0, t:0, est:0, totalEst:def.mapa.join('').split('*').length-1, tiros:[], lasers:[], parts:[], saida, fim:false };
}

// ---------- Tiles ----------
const tile = (x,y) => (y<0||y>=10) ? '.' : (x<0||x>=F.W) ? '#' : F.mapa[y][x];
function solido(x,y){ const c=tile(x,y); return c==='#'||c==='Q'||c==='F'||(c==='P'&&!F.aberto)||(c==='b'&&F.aberto)||(c==='D'&&!F.porta); }
function solidoPx(px,py){ return solido(Math.floor(px/T), Math.floor(py/T)); }
function moverX(e,dx){
  e.x+=dx; let bateu=false; const y1=Math.floor(e.y/T), y2=Math.floor((e.y+e.h-1)/T);
  if(dx>0){ const tx=Math.floor((e.x+e.w)/T); for(let y=y1;y<=y2;y++) if(solido(tx,y)){ e.x=tx*T-e.w-.01; bateu=true; break; } }
  else if(dx<0){ const tx=Math.floor(e.x/T); for(let y=y1;y<=y2;y++) if(solido(tx,y)){ e.x=(tx+1)*T+.01; bateu=true; break; } }
  return bateu;
}
function moverY(e,dy){
  const pe=e.y+e.h; e.y+=dy; e.chao=false; const x1=Math.floor(e.x/T), x2=Math.floor((e.x+e.w-1)/T);
  if(dy>0){ const ty=Math.floor((e.y+e.h)/T); for(let x=x1;x<=x2;x++) if(solido(x,ty)){ e.y=ty*T-e.h; e.vy=0; e.chao=true; break; } }
  else if(dy<0){ const ty=Math.floor(e.y/T); for(let x=x1;x<=x2;x++) if(solido(x,ty)){ e.y=(ty+1)*T; e.vy=0; break; } }
  return pe;
}
const sobrepoe = (a,b) => a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
function cabe(p, novoH){ const y=p.y+p.h-novoH; const x1=Math.floor(p.x/T), x2=Math.floor((p.x+p.w-1)/T), y1=Math.floor(y/T), y2=Math.floor((p.y+p.h-1)/T);
  for(let yy=y1;yy<=y2;yy++) for(let x=x1;x<=x2;x++) if(solido(x,yy)) return false; return true; }

// ---------- Entrada ----------
const K={ esq:false, dir:false, pulo:false, puloN:false, acaoN:false, trocaN:false };
const TECLAS={ ArrowLeft:'esq', KeyA:'esq', ArrowRight:'dir', KeyD:'dir', ArrowUp:'pulo', KeyW:'pulo', Space:'pulo' };
addEventListener('keydown',e=>{
  if(cena){ if(e.code==='Space'||e.code==='Enter'){ e.preventDefault(); avancarCena(); } return; }
  if(!rodando) return; const k=TECLAS[e.code];
  if(k){ if(k==='pulo'&&!K.pulo) K.puloN=true; K[k]=true; e.preventDefault(); }
  if(e.code==='KeyX'||e.code==='KeyJ'||e.code==='KeyE'){ K.acaoN=true; e.preventDefault(); }
  if(e.code==='Tab'||e.code==='KeyQ'){ K.trocaN=true; e.preventDefault(); }
  if(/^Digit[1-3]$/.test(e.code)) selecionar(+e.code.slice(-1)-1);
  if(e.code==='KeyR') reiniciar(); });
addEventListener('keyup',e=>{ const k=TECLAS[e.code]; if(k) K[k]=false; });
function botao(id, ao, solto){
  const b=$(id);
  b.addEventListener('pointerdown',e=>{ e.preventDefault(); Som.init(); b.setPointerCapture(e.pointerId); b.classList.add('on'); ao(); });
  const fim=()=>{ b.classList.remove('on'); solto&&solto(); };
  b.addEventListener('pointerup',fim); b.addEventListener('pointercancel',fim); b.addEventListener('lostpointercapture',fim);
}
botao('c-esq', ()=>K.esq=true, ()=>K.esq=false);
botao('c-dir', ()=>K.dir=true, ()=>K.dir=false);
botao('c-pulo', ()=>{ K.puloN=true; K.pulo=true; }, ()=>K.pulo=false);
botao('c-acao', ()=>K.acaoN=true);
botao('c-troca', ()=>K.trocaN=true);
function selecionar(i){ if(!F||F.fim||F.ativo===i) return; F.ativo=i; Som.troca(); hudPers(); }

// ---------- Lógica ----------
function atualizar(dt){
  if(F.fim){ partes(dt); return; }
  F.t+=dt;
  if(K.trocaN) selecionar((F.ativo+1)%3);
  const A=F.ps[F.ativo], mi=F.ps[KE];
  for(const p of F.ps){
    const ativo=p===A;
    if(p.inv>0) p.inv-=dt; if(p.cd>0) p.cd-=dt;
    if(p.dash>0){ p.dash-=dt; p.vx=p.dir*420; }
    else if(ativo){ const m=(K.dir?1:0)-(K.esq?1:0); p.vx=m*(p.agach?90:p.vel); if(m) p.dir=m; }
    else p.vx=0;
    if(p.empurra){ p.vx+=p.empurra; p.empurra*=0.85; if(Math.abs(p.empurra)<5) p.empurra=0; }
    p.coyote = p.chao ? .08 : p.coyote-dt;
    if(ativo && K.puloN && p.coyote>0 && !p.agach){ p.vy=p.pulo; p.coyote=0; Som.pulo(); }
    if(ativo && K.acaoN) poder(p);
    p.vy+=G*dt;
    if(p.id==='kelly' && p.guarda){ if(p.vy>55) p.vy=55; if(noVento(p)){ p.vy-=2900*dt; if(p.vy<-170) p.vy=-170; } }
    if(p.vy>650) p.vy=650;
    const bateu=moverX(p,p.vx*dt);
    if(p.dash>0){ quebrar(p); if(bateu) p.dash=0; }
    const peAntes=moverY(p,p.vy*dt);
    if(p!==mi && mi.guarda && p.vy>=0){
      const topo=mi.y-16, peAgora=p.y+p.h;
      if(peAntes<=topo+1 && peAgora>=topo && p.x+p.w>mi.x-8 && p.x<mi.x+mi.w+8){ p.y=topo-p.h; p.vy=0; p.chao=true; }
    }
    if(p.vx) p.anim+=dt;
    coletar(p); perigos(p); if(F.fim) return;
    const s=F.saida; p.saida = Math.abs(p.x+p.w/2-(s.x*T+T/2))<26 && Math.abs(p.y+p.h-(s.y*T+T))<8;
  }
  K.puloN=K.acaoN=K.trocaN=false;
  robos(dt); projeteis(dt); partes(dt);
  const alvo=Math.max(0,Math.min(F.W*T-VW, A.x+A.w/2-VW/2)); F.cam+=(alvo-F.cam)*Math.min(1,dt*8);
  if(F.ps.every(p=>p.saida)) vitoria();
}
function noVento(p){ const cx=Math.floor((p.x+p.w/2)/T), y0=Math.floor((p.y+p.h)/T);
  for(let y=y0;y<=Math.min(9,y0+9);y++){ const c=tile(cx,y); if(c==='F') return true; if(solido(cx,y)) return false; } return false; }
function poder(p){
  if(p.id==='william'){ if(p.cd>0) return; p.dash=.24; p.cd=.6; Som.tom(180,.15,'sawtooth',.06,0,90); }
  if(p.id==='kelly'){ p.guarda=!p.guarda; Som.tom(p.guarda?500:350,.08,'triangle',.06); }
  if(p.id==='junior'){
    if(!p.agach){ p.y+=p.h-H_AGACH; p.h=H_AGACH; p.agach=true; Som.tom(900,.15,'sine',.06,0,300); }
    else if(cabe(p, PERS[JU].h)){ p.y-=PERS[JU].h-p.h; p.h=PERS[JU].h; p.agach=false; Som.tom(300,.15,'sine',.06,0,900); }
    else aviso('Sem espaço para crescer aqui');
  }
}
function quebrar(p){
  const fx=Math.floor((p.dir>0 ? p.x+p.w+4 : p.x-4)/T), y1=Math.floor(p.y/T), y2=Math.floor((p.y+p.h-1)/T);
  for(let y=y1;y<=y2;y++) if(tile(fx,y)==='Q'){ F.mapa[y][fx]='.'; estilhaço(fx*T+15,y*T+15,'#c0704a',12); Som.quebra(); vibrar(40); }
  for(const r of F.robos) if(!r.morto && sobrepoe({x:p.x-4,y:p.y,w:p.w+8,h:p.h},r)) matarRobo(r);
}
function achaItens(p){
  for(const q of F.perd){ if(q.achado) continue;
    const cx=q.x*T+15, cy=q.y*T+15;
    if(cx>p.x-8 && cx<p.x+p.w+8 && cy>p.y-6 && cy<p.y+p.h+6){
      q.achado=true; marcarAchado(q.it.id); F.novos.push(q.it);
      Som.estrela(); Som.clique(); vibrar([20,30,20]); estilhaço(cx,cy,'#f2c14e',18); estilhaço(cx,cy,'#81d8d0',10);
      aviso(`🔍 Achou: ${q.it.nome}! Foi para o Lar dos Gatinhos 🐱`); hudTopo(); } }
}
function coletar(p){ achaItens(p);
  const x1=Math.floor(p.x/T), x2=Math.floor((p.x+p.w-1)/T), y1=Math.floor(p.y/T), y2=Math.floor((p.y+p.h-1)/T);
  for(let y=y1;y<=y2;y++) for(let x=x1;x<=x2;x++){
    const c=tile(x,y);
    if(c==='*'){ F.mapa[y][x]='.'; F.est++; Som.estrela(); estilhaço(x*T+15,y*T+15,'#ffd93b',10); hudTopo(); }
    if(c==='C' && !F.aberto){ F.aberto=true; Som.clique(); vibrar(30); estilhaço(x*T+15,y*T+25,'#46a8ff',8); aviso('Clique! Algo se abriu'); }
    if(c==='B' && !F.porta){ F.porta=true; Som.clique(); vibrar(30); estilhaço(x*T+15,y*T+25,'#ff4d4d',8); aviso('Clique! A porta abriu'); }
  }
}
function perigos(p){
  if(p.y>10*T+20) return falha(p,'caiu num buraco');
  const x1=Math.floor((p.x+3)/T), x2=Math.floor((p.x+p.w-4)/T), y=Math.floor((p.y+p.h-4)/T);
  for(let x=x1;x<=x2;x++) if(tile(x,y)==='^') return falha(p,'pisou nos cacos');
  for(const r of F.robos) if(!r.morto && sobrepoe(p,r) && p.dash<=0) ferir(p, Math.sign(p.x-r.x)||1);
}
function ferir(p,lado){ if(p.inv>0) return; p.hp--; p.inv=1.1; p.vy=-200; p.empurra=lado*150; Som.dano(); vibrar(60); hudPers(); if(p.hp<=0) falha(p,'ficou sem corações'); }
function robos(dt){
  for(const r of F.robos){
    if(r.morto) continue; if(r.pisca>0) r.pisca-=dt; r.cd-=dt;
    let alvo=null, md=7*T;
    for(const p of F.ps){ const dy=Math.abs((p.y+p.h/2)-(r.y+r.h/2)), dx=(p.x+p.w/2)-(r.x+r.w/2);
      if(dy<24 && Math.abs(dx)<md && livre(r.y+r.h/2, r.x+r.w/2, p.x+p.w/2)){ md=Math.abs(dx); alvo=dx; } }
    if(alvo!==null){ if(!r.mira){ r.mira=true; r.cd=Math.max(r.cd,.7); } r.dir=Math.sign(alvo)||1; r.vx=0;
      if(r.cd<=0){ F.lasers.push({ x:r.x+r.w/2+r.dir*12, y:r.y+12, vx:r.dir*210 }); r.cd=1.7; Som.laser(); } }
    else { r.mira=false; r.vx=r.dir*40; const fr=r.dir>0?r.x+r.w+2:r.x-2; if(solidoPx(fr,r.y+r.h/2)||!solidoPx(fr,r.y+r.h+4)) r.dir*=-1; }
    r.vy+=G*dt; moverX(r,r.vx*dt); moverY(r,r.vy*dt);
  }
}
function livre(y,x1,x2){ const ty=Math.floor(y/T), a=Math.floor(Math.min(x1,x2)/T), b=Math.floor(Math.max(x1,x2)/T); for(let x=a+1;x<b;x++) if(solido(x,ty)) return false; return true; }
function matarRobo(r){ r.morto=true; estilhaço(r.x+11,r.y+12,'#9aa4b8',16); Som.quebra(); vibrar(30); }
function projeteis(dt){
  for(const s of F.tiros){
    s.x+=s.vx*dt; s.vida-=dt; const tx=Math.floor(s.x/T), ty=Math.floor(s.y/T);
    if(solido(tx,ty)){ s.vida=0; estilhaço(s.x,s.y,'#bbb',4); continue; }
    for(const r of F.robos) if(!r.morto && s.x>r.x&&s.x<r.x+r.w&&s.y>r.y&&s.y<r.y+r.h){ s.vida=0; r.hp--; r.pisca=.2; Som.tom(300,.06,'square',.06); if(r.hp<=0) matarRobo(r); break; }
  }
  F.tiros=F.tiros.filter(s=>s.vida>0);
  const mi=F.ps[KE];
  for(const l of F.lasers){
    l.x+=l.vx*dt; if(solidoPx(l.x,l.y)){ l.morto=true; continue; }
    for(const p of F.ps) if(l.x>p.x-2 && l.x<p.x+p.w+2 && l.y>p.y && l.y<p.y+p.h){
      if(p===mi && !mi.guarda && Math.sign(l.vx)===-mi.dir){ l.morto=true; Som.bloq(); estilhaço(l.x,l.y,'#ff4d4d',6); }
      else { l.morto=true; ferir(p, Math.sign(l.vx)); }
      break; }
  }
  F.lasers=F.lasers.filter(l=>!l.morto && l.x>F.cam-200 && l.x<F.cam+VW+200);
}
function estilhaço(x,y,cor,n){ for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, v=60+Math.random()*160; F.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-80,vida:.6,cor}); } }
function partes(dt){ for(const p of F.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=900*dt; p.vida-=dt; } F.parts=F.parts.filter(p=>p.vida>0); }

// ---------- Desenho da fase ----------
function desenhar(){
  const c=ctx, cam=Math.round(F.cam);
  desenhaFundo(c, F.tema, cam, VW, VH, F.t);
  c.save(); c.translate(-cam,0);
  for(const d of F.def.deco){ if(d[1]*T>cam-200 && d[1]*T<cam+VW+40) desenhaDeco(c,d); }
  const x0=Math.max(0,Math.floor(cam/T)), x1=Math.min(F.W-1, x0+VW/T+1);
  for(let y=0;y<10;y++) for(let x=x0;x<=x1;x++) desenhaTile(F.mapa[y][x],x*T,y*T,x,y);
  for(let x=x0;x<=x1;x++) for(let y=0;y<10;y++) if(F.mapa[y][x]==='F'){ c.strokeStyle='rgba(180,230,255,.45)'; c.lineWidth=2;
    for(let k=0;k<4;k++){ const yy=y*T-((F.t*120+k*45)%240); c.beginPath(); c.moveTo(x*T+6+k*6,yy); c.lineTo(x*T+6+k*6,yy-14); c.stroke(); } }
  for(const q of F.perd){ if(q.achado) continue; const bx=q.x*T, by=q.y*T, bob=Math.sin(F.t*3+q.x)*2.5, pul=.5+Math.sin(F.t*5)*.25;
    const g=c.createRadialGradient(bx+15,by+15,2,bx+15,by+15,24); g.addColorStop(0,`rgba(255,230,120,${pul})`); g.addColorStop(1,'rgba(255,230,120,0)'); c.fillStyle=g; c.fillRect(bx-10,by-10,50,50);
    c.save(); c.translate(bx+15,by+T-4+bob); c.scale(.78,.78); q.it.d(c,-15,0); c.restore();
    c.fillStyle='#fff'; c.font='bold 10px system-ui'; c.textAlign='center'; c.fillText('?',bx+26,by+4+bob); }
  for(const r of F.robos) if(!r.morto) desenhaRobo(r);
  F.ps.forEach((p,i)=>{ if(i!==F.ativo) desenhaP(p,false); }); desenhaP(F.ps[F.ativo],true);
  c.fillStyle='#e8e8e8'; for(const s of F.tiros){ c.beginPath(); c.arc(s.x,s.y,3,0,7); c.fill(); }
  for(const l of F.lasers){ c.fillStyle='#ff3b3b'; c.fillRect(l.x-8,l.y-2,16,4); c.fillStyle='#ffd0d0'; c.fillRect(l.x-6,l.y-1,12,2); }
  for(const p of F.parts){ c.globalAlpha=Math.max(0,p.vida/.6); c.fillStyle=p.cor; c.fillRect(p.x-2,p.y-2,4,4); } c.globalAlpha=1;
  c.restore();
}
function desenhaP(p, ativo){
  const c=ctx; if(p.inv>0 && Math.floor(p.inv*20)%2) return;
  c.save(); if(p.saida) c.globalAlpha=.85; desenhaPers(c,p); c.restore();
  const cx=p.x+p.w/2, topo=p.y-(p.guarda?24:8);
  if(ativo){ const b=Math.sin(F.t*8)*2; c.fillStyle='#fff'; c.strokeStyle='#222'; c.lineWidth=1.5; c.beginPath(); c.moveTo(cx-5,topo-8+b); c.lineTo(cx+5,topo-8+b); c.lineTo(cx,topo-2+b); c.closePath(); c.fill(); c.stroke(); }
  if(p.saida){ c.fillStyle='#2ecc71'; c.font='bold 12px system-ui'; c.textAlign='center'; c.fillText('✓',cx,topo-(ativo?12:0)); }
}
function desenhaTile(t,x,y,tx,ty){
  const c=ctx;
  if(t==='#'){ desenhaBloco(c, F.tema, x, y, tile(tx,ty-1)==='#', tile(tx,ty+1)==='#'||ty===9, ty); return; }
  if(t==='Q'){ c.fillStyle='#b35a3a'; c.fillRect(x,y,T,T); c.fillStyle='#8f4128'; c.fillRect(x,y+14,T,2); c.fillRect(x+14,y,2,14); c.fillRect(x+6,y+16,2,14); c.fillRect(x+22,y+16,2,14);
    c.strokeStyle='#2a1208'; c.lineWidth=2; c.beginPath(); c.moveTo(x+8,y+2); c.lineTo(x+14,y+12); c.lineTo(x+10,y+20); c.lineTo(x+18,y+28); c.stroke(); return; }
  if(t==='P'){ if(F.aberto){ c.fillStyle='rgba(255,170,40,.18)'; c.fillRect(x+10,y,10,T); return; }
    c.fillStyle='#2b2b2b'; c.fillRect(x+3,y,24,T); c.fillStyle='#ffaa28'; for(let k=0;k<3;k++) c.fillRect(x+3,y+k*10,24,5); return; }
  if(t==='D'){ if(F.porta){ c.fillStyle='rgba(120,70,30,.25)'; c.fillRect(x+2,y,6,T); return; }
    c.fillStyle='#8b5a2b'; c.fillRect(x+2,y,26,T); c.fillStyle='#6b4220'; c.fillRect(x+5,y+3,20,10); c.fillRect(x+5,y+17,20,10); c.fillStyle='#f1c40f'; c.beginPath(); c.arc(x+22,y+15,2.5,0,7); c.fill(); return; }
  if(t==='B'){ c.fillStyle='#555'; c.fillRect(x+6,y+T-6,18,6); c.fillStyle=F.porta?'#2ecc71':'#e74c3c'; c.fillRect(x+9,y+T-(F.porta?8:12),12,F.porta?2:6);
    if(!F.porta){ c.fillStyle='rgba(255,255,255,.8)'; c.font='bold 9px system-ui'; c.textAlign='center'; c.fillText('▼',x+15,y+T-16+Math.sin(F.t*6)*2); } return; }
  if(t==='b'){ if(F.aberto){ c.fillStyle='#c98a4a'; c.fillRect(x,y,T,12); c.fillStyle='#8f5a2a'; c.fillRect(x+T/2-1,y,2,12); c.fillRect(x,y+10,T,2); }
    else { c.strokeStyle='rgba(0,0,0,.25)'; c.setLineDash([4,4]); c.strokeRect(x+1,y+1,T-2,10); c.setLineDash([]); } return; }
  if(t==='C'){ c.fillStyle='#555'; c.fillRect(x+6,y+T-6,18,6); c.fillStyle=F.aberto?'#2ecc71':'#2e86de'; c.fillRect(x+9,y+T-(F.aberto?8:12),12,F.aberto?2:6);
    if(!F.aberto){ c.fillStyle='rgba(255,255,255,.85)'; c.font='bold 9px system-ui'; c.textAlign='center'; c.fillText('▼',x+15,y+T-16+Math.sin(F.t*6)*2); } return; }
  if(t==='A'){ c.fillStyle='#666'; c.fillRect(x+13,y+16,4,T*3); c.fillStyle='#444'; c.fillRect(x+6,y+18,18,8);
    c.strokeStyle='#ffd93b'; c.lineWidth=4; c.beginPath(); c.moveTo(x+15,y+20); c.lineTo(x+15+(F.aberto?10:-10),y+4); c.stroke(); c.fillStyle='#ff4d4d'; c.beginPath(); c.arc(x+15+(F.aberto?10:-10),y+4,4,0,7); c.fill(); return; }
  if(t==='^'){ c.fillStyle='#9fd8e6'; for(let k=0;k<3;k++){ c.beginPath(); c.moveTo(x+k*10,y+T); c.lineTo(x+k*10+5,y+8+(k%2)*6); c.lineTo(x+k*10+10,y+T); c.fill(); } c.fillStyle='rgba(255,255,255,.6)'; c.fillRect(x+4,y+18,2,8); return; }
  if(t==='F'){ c.fillStyle='#3a3f55'; c.fillRect(x,y,T,T); c.fillStyle='#8fd3ff'; c.save(); c.translate(x+15,y+15); c.rotate(F.t*12);
    for(let k=0;k<3;k++){ c.rotate(2.09); c.fillRect(-2,-12,4,12); } c.restore(); c.fillStyle='#fff'; c.beginPath(); c.arc(x+15,y+15,3,0,7); c.fill(); return; }
  if(t==='*'){ const s=1+Math.sin(F.t*5+tx)*.12; c.save(); c.translate(x+15,y+15); c.scale(s,s); c.fillStyle='#ffd93b'; c.strokeStyle='#b8860b'; c.lineWidth=1.5; c.beginPath();
    for(let k=0;k<10;k++){ const r=k%2?5:11, a=k*Math.PI/5-Math.PI/2; c.lineTo(Math.cos(a)*r,Math.sin(a)*r); } c.closePath(); c.fill(); c.stroke(); c.restore(); return; }
  if(t==='S'){ const pulso=.6+Math.sin(F.t*4)*.25;
    c.fillStyle='#222'; c.fillRect(x-8,y-30,46,60); c.fillStyle=`rgba(80,255,170,${pulso})`; c.fillRect(x-4,y-26,38,52);
    c.fillStyle='#fff'; c.font='bold 10px system-ui'; c.textAlign='center'; c.fillText('SAÍDA',x+15,y-34); return; }
}
function desenhaRobo(r){
  const c=ctx; if(r.pisca>0&&Math.floor(r.pisca*30)%2) return;
  c.fillStyle='#9aa4b8'; c.fillRect(r.x,r.y+2,r.w,r.h-6); c.fillStyle='#6b7488'; c.fillRect(r.x+2,r.y+r.h-6,r.w-4,6);
  c.fillStyle='#1b1b2e'; c.fillRect(r.x+3,r.y+6,r.w-6,8); c.fillStyle='#ff3b3b'; c.fillRect(r.x+(r.dir>0?13:5),r.y+8,5,4);
  c.strokeStyle='#9aa4b8'; c.lineWidth=2; c.beginPath(); c.moveTo(r.x+11,r.y+2); c.lineTo(r.x+11,r.y-5); c.stroke(); c.fillStyle='#ff3b3b'; c.beginPath(); c.arc(r.x+11,r.y-6,2.5,0,7); c.fill();
}

// ---------- HUD ----------
function retrato(cv2,p){ const c2=cv2.getContext('2d'); c2.clearRect(0,0,40,40); const q={...p, x:11, y:(40-PERS[p.i].h)/2+2, h:PERS[p.i].h, agach:false, guarda:false, inv:0, vx:0, dash:0, dir:1}; c2.save(); c2.translate(0,0); desenhaPers(c2,q); c2.restore(); }
function hudPers(){
  $('pers').innerHTML = F.ps.map((p,i)=>`<button class="pc ${i===F.ativo?'on':''} ${p.saida?'ok':''}" data-i="${i}"><canvas width="40" height="40" data-p="${i}"></canvas><span class="nm">${p.curto}</span><span class="hp">${'♥'.repeat(Math.max(0,p.hp))}<i>${'♥'.repeat(3-Math.max(0,p.hp))}</i></span></button>`).join('');
  $('pers').querySelectorAll('canvas').forEach(c2=>retrato(c2, F.ps[+c2.dataset.p]));
  $('c-acao').innerHTML = `${F.ps[F.ativo].ic}<small>Poder</small>`;
}
function hudTopo(){ $('h-est').textContent=`⭐ ${F.est}/${F.totalEst}`; $('h-perd').textContent=`🔍 ${F.perd.filter(q=>q.achado).length}/${F.perd.length}`; }
let ultT=-1;
function hudTempo(){ const s=Math.floor(F.t); if(s!==ultT){ ultT=s; $('h-tempo').textContent='⏱ '+fmtT(F.t); $('h-saida').textContent=`🚪 ${F.ps.filter(p=>p.saida).length}/3`; } }
$('pers').addEventListener('pointerdown',e=>{ const b=e.target.closest('.pc'); if(b){ e.preventDefault(); Som.init(); selecionar(+b.dataset.i); } });
let avisoT; function aviso(txt){ const a=$('aviso'); a.textContent=txt; a.classList.add('on'); clearTimeout(avisoT); avisoT=setTimeout(()=>a.classList.remove('on'),2200); }

// ---------- Loop ----------
let acc=0, ult=0, ultSaida='';
function quadro(t){
  if(!rodando) return;
  acc+=Math.min(.1,(t-ult)/1000); ult=t;
  while(acc>=DT){ atualizar(DT); acc-=DT; }
  desenhar(); hudTempo();
  const s=F.ps.map(p=>p.saida?1:0).join(''); if(s!==ultSaida){ ultSaida=s; hudPers(); }
  raf=requestAnimationFrame(quadro);
}
function jogar(n){
  Som.init(); fecharModal(); pararCena();
  carregar(n); mostrar('jogo'); ajustaCanvas(cv,ctx);
  hudPers(); hudTopo(); ultT=-1; ultSaida='';
  rodando=true; ult=performance.now(); acc=0; cancelAnimationFrame(raf); raf=requestAnimationFrame(quadro);
  aviso(innerHeight>innerWidth ? '📱 Gire o celular para ver melhor' : `Fase ${n}: ${F.def.nome}`);
}
function reiniciar(){ if(F) jogar(F.n); }
function parar(){ rodando=false; cancelAnimationFrame(raf); }
function falha(p,motivo){
  if(F.fim) return; F.fim=true; Som.dano(); vibrar([80,40,80]);
  setTimeout(()=>{ parar(); modal(`<h2>Ops!</h2><p><b>${p.nome}</b> ${motivo}.</p><p class="sub">A família só passa de fase junta.</p>
    <button class="btn" id="m-rep">Tentar de novo</button><button class="btn sec" id="m-menu">Fases</button>`);
    $('m-rep').onclick=()=>jogar(F.n); $('m-menu').onclick=telaFases; }, 700);
}
function vitoria(){
  if(F.fim) return; F.fim=true; Som.vitoria(); vibrar([30,40,30,40,60]);
  const n=F.n, est=F.est, t=Math.round(F.t);
  if(est>(S.est[n]||0)) S.est[n]=est;
  const recorde=!S.tempo[n]||t<S.tempo[n]; if(recorde) S.tempo[n]=t;
  if(n>=S.desbloq) S.desbloq=Math.min(FASES.length,n+1); salvar();
  const D=DUELO&&DUELO.f===n?DUELO:null;
  const mostraFim=()=>{ modal(`<h2>Família salva!</h2><p class="sub">Fase ${n} · ${F.def.nome}</p>
      <div class="estrelas">${[0,1,2].map(k=>`<span class="${k<est?'on':''}">★</span>`).join('')}</div>
      <p style="font-size:22px;font-weight:900">⏱ ${fmtT(t)} ${recorde?'· recorde!':''}</p>
      ${F.novos.length?`<div class="caixa">🔍 Itens achados: <b>${F.novos.map(i=>i.nome).join(', ')}</b><br>Já estão no <a href="../gatinhos/index.html" style="color:#3ddc84">Lar dos Gatinhos</a>!</div>`:''}
      ${D?`<div class="caixa"><b>${t<D.t?'Você venceu!':t>D.t?D.nm+' venceu.':'Empate!'}</b> Você ${fmtT(t)} × ${fmtT(D.t)} ${D.nm}</div>`:''}
      ${n<FASES.length?'<button class="btn verde" id="m-prox">Próxima fase ›</button>':''}
      <button class="btn zap" id="m-des">Desafiar um amigo</button><button class="btn sec" id="m-menu">Fases</button>`);
    if($('m-prox')) $('m-prox').onclick=()=>iniciarFase(n+1);
    $('m-des').onclick=()=>desafiar(n,t); $('m-menu').onclick=telaFases; };
  setTimeout(()=>{ parar(); if(n===FASES.length) tocarCena(CENAS.final, mostraFim); else mostraFim(); }, 600);
}
function desafiar(n,t){
  if(!S.nome){ const v=prompt('Seu nome para o desafio:',''); S.nome=limpa(v&&v.trim()); salvar(); }
  const url=`${location.origin}${location.pathname}?f=${n}&t=${t}&nm=${encodeURIComponent(S.nome)}`;
  const txt=`Salvei minha família no Família em Ação, fase ${n} em ${fmtT(t)}. Consegue mais rápido?`;
  if(navigator.share) navigator.share({text:txt,url}).catch(()=>{}); else window.open('https://wa.me/?text='+encodeURIComponent(txt+'\n'+url),'_blank');
}

// ---------- Cenas da história ----------
// Cada cena: lista de quadros { cen:'sala'|..., atores:[[id,x,dir,extra]], quem, txt, fx }
const CENAS = {
  abertura: [
    { cen:'salaNoite', atores:[['kelly',170,1],['junior',220,1],['william',300,-1]], quem:'junior', txt:'A TV tá chiando…', fx:'chuvisco' },
    { cen:'salaNoite', atores:[['kelly',170,1],['junior',220,1],['william',300,-1]], quem:'kelly', txt:'{0}, dá uma olhada nela.', fx:'chuvisco' },
    { cen:'salaNoite', atores:[['kelly',170,1],['junior',220,1],['william',95,-1,'tapa']], quem:'william', txt:'É só mau contato…', fx:'chuvisco' },
    { cen:'salaNoite', atores:[['kelly',170,1],['junior',220,1],['william',95,-1]], quem:'junior', txt:'Aaaah!', fx:'suga', dur:2.6 },
    { cen:'tv', atores:[['william',170,1],['kelly',230,1],['junior',290,1]], quem:'william', txt:'Estamos DENTRO do videogame!' },
    { cen:'tv', atores:[['william',170,1],['kelly',230,1],['junior',290,1]], quem:'kelly', txt:'Bora achar a saída. Juntos!' },
  ],
  f1: [{ cen:'sala', atores:[['kelly',180,1],['junior',230,-1]], quem:'kelly', txt:'É a nossa sala… de videogame!' },
       { cen:'sala', atores:[['kelly',180,1],['junior',230,-1]], quem:'junior', txt:'Eu encolho e passo naquele vão!' }],
  f2: [{ cen:'cozinha', atores:[['junior',170,1],['kelly',230,-1]], quem:'junior', txt:'Um buraco na cozinha?!' },
       { cen:'cozinha', atores:[['junior',170,1],['kelly',230,-1,'guarda']], quem:'kelly', txt:'Eu plano até o botão.' }],
  f3: [{ cen:'quintal', atores:[['william',160,1],['kelly',220,-1,'guarda']], quem:'kelly', txt:'Muro alto? Sobe no meu quadro!' }],
  f4: [{ cen:'garagem', atores:[['william',150,1],['kelly',210,1]], quem:'william', txt:'Robôs na garagem!' },
       { cen:'garagem', atores:[['william',150,1],['kelly',210,1]], quem:'kelly', txt:'Fiquem atrás do meu escudo.' }],
  f5: [{ cen:'tv', atores:[['william',180,1],['kelly',240,1],['junior',300,1]], quem:'william', txt:'Lá está a saída de verdade!' }],
  final: [
    { cen:'salaDia', atores:[['kelly',170,1],['junior',220,1],['william',290,-1]], quem:'kelly', txt:'Voltamos pra casa!', fx:'flash' },
    { cen:'salaDia', atores:[['kelly',170,1],['junior',220,1],['william',290,-1]], quem:'william', txt:'Chega de TV por hoje.' },
    { cen:'salaDia', atores:[['kelly',170,1],['junior',220,-1],['william',290,-1]], quem:'junior', txt:'Só mais uma partida…?' },
  ],
};
const CEN_DECO = {
  sala:[['janela',1,2],['quadro',7,2],['estante',11,9],['sofa',4,9],['tapete',4,9],['abajur',1,9],['tv',2,9],['planta',14,9]],
  cozinha:[['armario',1,2],['geladeira',1,9],['fogao',4,9],['pia',7,9],['relogio',10,2],['mesa',11,9],['panelas',10,4]],
  quintal:[['arvore',0,9],['varal',4,9],['casinha',11,9],['flores',14,9],['cerca',9,9]],
  garagem:[['ferramentas',1,3],['carro',4,9],['pneus',11,9],['prateleira',11,4],['lampada',7,1]],
  tv:[['pixel',2,2],['pixel',8,1],['pixel',12,3]],
};
let cena=null, cenaRaf=0, ccv, cctx;
function tocarCena(lista, depois){
  parar(); fecharModal(); lista=lista.map(q=>({...q, txt:trocaNomes(q.txt)})); cena={ lista, i:0, t:0, depois, ult:performance.now(), letras:0 };
  mostrar('cena'); ajustaCanvas(ccv,cctx); cancelAnimationFrame(cenaRaf); cenaRaf=requestAnimationFrame(passoCena);
}
function pararCena(){ cena=null; cancelAnimationFrame(cenaRaf); }
function durQuadro(q){ return q.dur || Math.max(2.2, 1.2 + q.txt.length*0.06); }
function avancarCena(){
  if(!cena) return; const q=cena.lista[cena.i];
  if(cena.letras<q.txt.length){ cena.letras=q.txt.length; return; }   // 1º toque completa o texto
  cena.i++; cena.t=0; cena.letras=0;
  if(cena.i>=cena.lista.length){ const d=cena.depois; pararCena(); d&&d(); }
}
function pularCena(){ if(!cena) return; const d=cena.depois; pararCena(); d&&d(); }
function passoCena(t){
  if(!cena) return;
  const dt=Math.min(.1,(t-cena.ult)/1000); cena.ult=t; cena.t+=dt;
  const q=cena.lista[cena.i];
  const antes=Math.floor(cena.letras); cena.letras=Math.min(q.txt.length, cena.letras+dt*30); if(Math.floor(cena.letras)>antes && Math.floor(cena.letras)%3===0) Som.fala();
  desenhaCena(cctx, q, cena.t);
  const dur=durQuadro(q);
  $('cena-barra').style.width = Math.min(100, cena.t/dur*100)+'%';
  if(cena.t>=dur){ cena.letras=q.txt.length; avancarCena(); }
  if(cena) cenaRaf=requestAnimationFrame(passoCena);
}
function desenhaCena(c, q, t){
  const base=VH-40, tema = q.cen.startsWith('sala') ? 'sala' : q.cen;
  desenhaFundo(c, tema, 0, VW, VH, t);
  if(q.cen==='salaNoite'){ /* escurece depois de desenhar */ }
  for(const d of (CEN_DECO[tema]||[])){ const [tp,col,lin]=d; desenhaDeco(c,[tp,col,lin===9? base/T : lin]); }
  // chão
  if(tema!=='tv'){ for(let x=0;x<VW;x+=T) desenhaBloco(c, tema, x, base, false, true, 9); for(let x=0;x<VW;x+=T) desenhaBloco(c, tema, x, base+T, true, true, 9); }
  else { c.fillStyle='#5a3fa0'; c.fillRect(0,base,VW,VH-base); c.fillStyle='#3ddc84'; c.fillRect(0,base,VW,5); }
  // atores (desenhados em escala 1,6)
  const ESC=1.6;
  let falaX=VW/2, falaY=80;
  for(const [id,x,dir,extra] of q.atores){
    const i=PERS.findIndex(p=>p.id===id), d=PERS[i];
    let ax=x, ay=base, esc=ESC, rot=0;
    if(q.fx==='suga'){ const k=Math.min(1,t/2.2); ax = x + (95-x)*k*k; ay = base - 40*Math.sin(k*Math.PI); esc=ESC*(1-k*.85); rot=k*8; }
    const p={ ...d, x:-9, y:-d.h, w:18, h:d.h, dir, anim:t, vx:extra==='anda'?1:0, chao:true, guarda:extra==='guarda', dash:extra==='tapa'?1:0, agach:false };
    c.save(); c.translate(ax, ay); c.rotate(rot); c.scale(esc,esc);
    const pul = id===q.quem && q.fx!=='suga' ? Math.abs(Math.sin(t*6))*1.5 : 0; c.translate(0,-pul);
    desenhaPers(c,p); c.restore();
    if(id===q.quem){ falaX=ax; falaY=ay-d.h*ESC-(extra==='guarda'?28:8); }
  }
  // efeitos
  if(q.cen==='salaNoite'){ c.fillStyle='rgba(10,10,40,.45)'; c.fillRect(0,0,VW,VH); c.fillStyle='rgba(130,220,255,.18)'; c.beginPath(); c.moveTo(95,base-40); c.lineTo(40,VH); c.lineTo(360,VH); c.fill(); }
  if(q.fx==='chuvisco'||q.fx==='suga'){ // chuvisco na tela da TV da cena
    const tx=2*T+5, ty=base-60+4; for(let k=0;k<70;k++){ c.fillStyle=Math.random()<.5?'#fff':'#777'; c.fillRect(tx+Math.random()*40, ty+Math.random()*28, 2, 2); }
  }
  if(q.fx==='suga'){ c.save(); c.translate(2*T+25, base-42); c.rotate(t*6); c.strokeStyle='rgba(120,255,200,.8)'; c.lineWidth=3;
    for(let k=0;k<3;k++){ c.beginPath(); c.arc(0,0,10+k*14+Math.sin(t*8)*3, k, k+4); c.stroke(); } c.restore();
    if(t>2.2){ c.fillStyle=`rgba(255,255,255,${Math.min(1,(t-2.2)*3)})`; c.fillRect(0,0,VW,VH); } }
  if(q.fx==='flash' && t<.6){ c.fillStyle=`rgba(255,255,255,${1-t/.6})`; c.fillRect(0,0,VW,VH); }
  balao(c, q, falaX, falaY);
}
function balao(c, q, ax, ay){
  const nome=PERS.find(p=>p.id===q.quem).curto, txt=q.txt.slice(0, Math.floor(cena.letras));
  c.font='bold 14px system-ui'; const largMax=220;
  const linhas=[]; let l=''; for(const w of q.txt.split(' ')){ const tt=l?l+' '+w:w; if(c.measureText(tt).width>largMax){ linhas.push(l); l=w; } else l=tt; } linhas.push(l);
  const larg=Math.max(...linhas.map(s=>c.measureText(s).width))+24, alt=linhas.length*18+30;
  let bx=Math.max(8, Math.min(VW-larg-8, ax-larg/2)), by=Math.max(8, ay-alt-14);
  c.fillStyle='#fff'; c.strokeStyle='#222'; c.lineWidth=2.5;
  c.beginPath(); c.roundRect(bx,by,larg,alt,12); c.fill(); c.stroke();
  const px=Math.max(bx+16,Math.min(bx+larg-16,ax)); c.beginPath(); c.moveTo(px-8,by+alt-1); c.lineTo(ax,ay-4); c.lineTo(px+8,by+alt-1); c.fill(); c.stroke(); c.fillRect(px-7,by+alt-3,14,4);
  c.fillStyle='#7c3aed'; c.font='bold 11px system-ui'; c.textAlign='left'; c.fillText(nome.toUpperCase(), bx+12, by+15);
  c.fillStyle='#222'; c.font='bold 14px system-ui';
  let resto=txt; linhas.forEach((ln,k)=>{ const parte=resto.slice(0,ln.length); resto=resto.slice(ln.length+1); c.fillText(parte, bx+12, by+33+k*18); });
}

// ---------- Montar a família ----------
let famTmp=null, famDepois=null;
function telaFamilia(depois){
  famDepois=depois||null; famTmp=JSON.parse(JSON.stringify(fam()));
  $('f-sobrenome').value=famTmp.sobrenome;
  $('f-membros').innerHTML = famTmp.membros.map((m,i)=>`<div class="membro"><div class="mtopo"><span class="poder">${PODERES[i]}</span><input data-i="${i}" maxlength="12" value="${m.nome}" placeholder="Nome"></div>
    <div class="galeria">${VISUAIS.map(v=>`<button class="vis ${v.id===m.vis?'on':''}" data-i="${i}" data-v="${v.id}" title="${v.nome}"><canvas width="46" height="58"></canvas></button>`).join('')}</div></div>`).join('');
  $('f-membros').querySelectorAll('.vis').forEach(b=>{ const c2=b.querySelector('canvas').getContext('2d'); c2.save(); c2.translate(23,54); c2.scale(1.05,1.05);
    desenhaPers(c2,{id:'x',vis:b.dataset.v,x:-9,y:-44,w:18,h:44,dir:1,anim:0,vx:0,chao:true,guarda:false,dash:0,agach:false}); c2.restore(); });
  mostrar('familia');
}
$('f-membros').addEventListener('click',e=>{ const b=e.target.closest('.vis'); if(!b) return; const i=+b.dataset.i; famTmp.membros[i].vis=b.dataset.v;
  b.parentElement.querySelectorAll('.vis').forEach(x=>x.classList.toggle('on',x===b)); Som.troca(); });
$('f-salvar').onclick=()=>{ Som.init();
  famTmp.sobrenome = $('f-sobrenome').value.trim() ? limpa($('f-sobrenome').value.trim()).slice(0,14) : '';
  $('f-membros').querySelectorAll('input').forEach(inp=>{ const i=+inp.dataset.i, v=inp.value.trim(); famTmp.membros[i].nome = v ? limpa(v).slice(0,12) : FAM_PADRAO.membros[i].nome; });
  S.familia=famTmp; salvar(); aplicaFamilia(); apresentar();
  const d=famDepois; famDepois=null; d ? d() : mostrar('inicio'); };
$('f-volta').onclick=()=>mostrar('inicio');

// ---------- Telas ----------
function mostrar(t){ document.querySelectorAll('.tela').forEach(e=>e.classList.remove('on')); $('t-'+t).classList.add('on'); }
function modal(h){ $('mbox').innerHTML=h; $('modal').hidden=false; }
function fecharModal(){ $('modal').hidden=true; }
function telaFases(){
  parar(); pararCena(); fecharModal();
  $('lista').innerHTML = FASES.map((f,i)=>{ const n=i+1, bloq=n>S.desbloq, e=S.est[n]||0;
    return `<button class="fase ${bloq?'bloq':''}" data-n="${n}"><span class="num">${bloq?'🔒':n}</span><span class="info"><b>${f.nome}</b><small>${bloq?'Complete a anterior':(S.tempo[n]?'Recorde '+fmtT(S.tempo[n]):'Ainda não jogada')} · 🔍 ${PERDIDOS.filter(q=>q.fase===n&&perdidosAchados().includes(q.id)).length}/${PERDIDOS.filter(q=>q.fase===n).length}</small></span><span class="est">${'★'.repeat(e)}<i>${'★'.repeat(3-e)}</i></span></button>`; }).join('');
  mostrar('fases');
}
$('lista').addEventListener('click',e=>{ const b=e.target.closest('.fase'); if(!b) return; const n=+b.dataset.n; if(n>S.desbloq) return; iniciarFase(n); });
function iniciarFase(n, extra){ Som.init(); fecharModal(); tocarCena(CENAS['f'+n], ()=>preFase(n, extra)); }
function preFase(n,extra){
  const f=FASES[n-1]; mostrar('fases');
  modal(`<h2>Fase ${n}</h2><p class="sub">${f.nome}</p>${extra||''}<div class="caixa">💡 ${trocaNomes(f.dica)}</div>
    <button class="btn verde" id="m-ir">Jogar!</button><button class="btn sec" id="m-volta">Voltar</button>`);
  $('m-ir').onclick=()=>jogar(n); $('m-volta').onclick=telaFases;
}
function comecar(){ if(!S.viuAbertura){ S.viuAbertura=true; salvar(); tocarCena(CENAS.abertura, telaFases); } else telaFases(); }
$('b-jogar').onclick=()=>{ Som.init(); if(!S.familia) telaFamilia(comecar); else comecar(); };
$('b-familia').onclick=()=>{ Som.init(); telaFamilia(); };
$('b-historia').onclick=()=>{ Som.init(); tocarCena(CENAS.abertura, ()=>mostrar('inicio')); };
$('b-volta').onclick=()=>{ apresentar(); mostrar('inicio'); };
$('cena-pular').onclick=e=>{ e.stopPropagation(); pularCena(); };
$('t-cena').addEventListener('pointerdown',e=>{ if(e.target.id==='cena-pular') return; Som.init(); avancarCena(); });
$('j-pausa').onclick=()=>{ if(!F||F.fim) return; rodando=false;
  modal(`<h2>Pausa</h2><p class="sub">Teclado: ←→ andar · espaço pular · X poder · Tab ou 1-3 trocar · R reiniciar</p>
    <button class="btn verde" id="m-cont">Continuar</button><button class="btn" id="m-rep">Reiniciar fase</button><button class="btn sec" id="m-menu">Fases</button>`);
  $('m-cont').onclick=()=>{ fecharModal(); rodando=true; ult=performance.now(); raf=requestAnimationFrame(quadro); };
  $('m-rep').onclick=()=>jogar(F.n); $('m-menu').onclick=telaFases; };
$('b-som').onclick=()=>{ S.som=!S.som; salvar(); $('b-som').textContent=S.som?'🔊':'🔇'; };
function ajustaCanvas(c,x){ const dpr=Math.min(2,devicePixelRatio||1); c.width=VW*dpr; c.height=VH*dpr; x.setTransform(dpr,0,0,dpr,0,0); }

function apresentar(){
  const ach=perdidosAchados().filter(id=>PERDIDOS.some(q=>q.id===id)).length; const el=$('perdidos-total'); if(el) el.innerHTML=`🔍 Itens perdidos da casa: <b>${ach}/${PERDIDOS.length}</b> · eles vão para o <a href="../gatinhos/index.html">Lar dos Gatinhos</a>`;
  $('elenco').innerHTML = PERS.map((p,i)=>`<div class="ator"><canvas width="60" height="60" data-i="${i}"></canvas><div><b>${p.nome}</b><small>${p.ic} ${p.poder}</small></div></div>`).join('');
  $('elenco').querySelectorAll('canvas').forEach(c2=>{ const i=+c2.dataset.i, d=PERS[i]; const cc=c2.getContext('2d');
    cc.save(); cc.translate(30,56); cc.scale(1.15,1.15); desenhaPers(cc,{...d,x:-9,y:-d.h,w:18,h:d.h,dir:1,anim:0,vx:0,chao:true,guarda:false,dash:0,agach:false}); cc.restore(); });
}

let DUELO=null;
(function(){
  cv=$('tela'); ctx=cv.getContext('2d'); ccv=$('cena'); cctx=ccv.getContext('2d');
  $('rodape').textContent=`${CONFIG.SISTEMA} v${CONFIG.VERSAO}•Desenvolvido por ${CONFIG.DESENVOLVEDOR}`;
  $('b-som').textContent=S.som?'🔊':'🔇';
  aplicaFamilia(); apresentar();
  const P=new URLSearchParams(location.search), n=+P.get('f');
  if(n>=1 && n<=FASES.length){
    DUELO={ f:n, t:+P.get('t')||0, nm:limpa(P.get('nm')) }; history.replaceState(null,'',location.pathname);
    preFase(n, `<div class="caixa">🤝 <b>${DUELO.nm}</b> terminou esta fase em <b>${fmtT(DUELO.t)}</b>. Consegue mais rápido?</div>`);
  }
})();
