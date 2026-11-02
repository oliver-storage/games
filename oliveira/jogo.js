// Família Oliveira — plataforma e quebra-cabeça em 2D
const CONFIG = { SISTEMA:'Família Oliveira', VERSAO:'0.1.0.0', DESENVOLVEDOR:'Vettore Sistemas' };
const $ = id => document.getElementById(id);
const T = 30, VW = 480, VH = 300, DT = 1/60, G = 1400;
const fmtT = s => { s=Math.floor(s); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
const limpa = s => ((s||'').toString().replace(/[<>&"']/g,'').slice(0,16)) || 'Amigo';

const PERS = [
  { id:'tonho', nome:'Seu Tonho', vel:170, pulo:-500, ic:'💪', poder:'Ombrada: derruba parede rachada e robôs' },
  { id:'bia',   nome:'Bia',       vel:145, pulo:-545, ic:'🎯', poder:'Estilingue: acerta robôs e alavancas' },
  { id:'vo',    nome:'Vó Lurdes', vel:105, pulo:-370, ic:'☂️', poder:'Guarda-chuva: fechado bloqueia laser; aberto plana, sobe no ventilador e vira degrau' },
];

// ---------- Save ----------
const SK='familia_oliveira_v1';
let S; try{ S=Object.assign({desbloq:1,est:{},tempo:{},som:true,nome:''}, JSON.parse(localStorage.getItem(SK)||'{}')); }catch(e){ S={desbloq:1,est:{},tempo:{},som:true,nome:''}; }
const salvar = () => { try{ localStorage.setItem(SK, JSON.stringify(S)); }catch(e){} };

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
  troca(){ this.tom(600,.05,'triangle',.05); }
};
const vibrar = p => { try{ navigator.vibrate && navigator.vibrate(p); }catch(e){} };

// ---------- Estado ----------
let F=null, cv, ctx, rodando=false, raf=0;

function carregar(n){
  const def=FASES[n-1];
  const mapa=def.mapa.map(l=>l.split(''));
  const W=mapa[0].length;
  const ps=[], robos=[];
  for(let y=0;y<10;y++) for(let x=0;x<W;x++){
    const c=mapa[y][x];
    if('123'.includes(c)){ const i=+c-1; ps[i]={ ...PERS[i], i, x:x*T+6, y:y*T+2, w:18, h:28, vx:0, vy:0, chao:false, dir:1, hp:3, inv:0, cd:0, dash:0, guarda:false, saida:false, anim:0, coyote:0 }; mapa[y][x]='.'; }
    if(c==='R'){ robos.push({ x:x*T+4, y:y*T+6, w:22, h:24, vx:40, vy:0, dir:-1, hp:2, cd:1.5, morto:false, pisca:0 }); mapa[y][x]='.'; }
  }
  let saida={x:0,y:0}; for(let y=0;y<10;y++) for(let x=0;x<W;x++) if(mapa[y][x]==='S') saida={x,y};
  const totalEst = def.mapa.join('').split('*').length-1;
  F = { n, def, mapa, W, ps, robos, ativo:0, aberto:false, cam:0, t:0, est:0, totalEst, tiros:[], lasers:[], parts:[], saida, fim:false, msgs:[] };
}

// ---------- Tiles ----------
const tile = (x,y) => (y<0||y>=10) ? '.' : (x<0||x>=F.W) ? '#' : F.mapa[y][x];
function solido(x,y){ const c=tile(x,y); return c==='#'||c==='Q'||c==='F'||(c==='P'&&!F.aberto)||(c==='b'&&F.aberto); }
function solidoPx(px,py){ return solido(Math.floor(px/T), Math.floor(py/T)); }

function moverX(e,dx){
  e.x+=dx; let bateu=false;
  const y1=Math.floor(e.y/T), y2=Math.floor((e.y+e.h-1)/T);
  if(dx>0){ const tx=Math.floor((e.x+e.w)/T); for(let y=y1;y<=y2;y++) if(solido(tx,y)){ e.x=tx*T-e.w-.01; bateu=true; break; } }
  else if(dx<0){ const tx=Math.floor(e.x/T); for(let y=y1;y<=y2;y++) if(solido(tx,y)){ e.x=(tx+1)*T+.01; bateu=true; break; } }
  return bateu;
}
function moverY(e,dy){
  const pe=e.y+e.h; e.y+=dy; e.chao=false;
  const x1=Math.floor(e.x/T), x2=Math.floor((e.x+e.w-1)/T);
  if(dy>0){ const ty=Math.floor((e.y+e.h)/T); for(let x=x1;x<=x2;x++) if(solido(x,ty)){ e.y=ty*T-e.h; e.vy=0; e.chao=true; break; } }
  else if(dy<0){ const ty=Math.floor(e.y/T); for(let x=x1;x<=x2;x++) if(solido(x,ty)){ e.y=(ty+1)*T; e.vy=0; break; } }
  return pe;
}
const sobrepoe = (a,b) => a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;

// ---------- Entrada ----------
const K={ esq:false, dir:false, pulo:false, puloN:false, acaoN:false, trocaN:false };
const TECLAS={ ArrowLeft:'esq', KeyA:'esq', ArrowRight:'dir', KeyD:'dir', ArrowUp:'pulo', KeyW:'pulo', Space:'pulo' };
addEventListener('keydown',e=>{ if(!rodando) return; const k=TECLAS[e.code];
  if(k){ if(k==='pulo'&&!K.pulo) K.puloN=true; K[k]=true; e.preventDefault(); }
  if(e.code==='KeyX'||e.code==='KeyJ'||e.code==='KeyE'){ K.acaoN=true; e.preventDefault(); }
  if(e.code==='Tab'||e.code==='KeyQ'){ K.trocaN=true; e.preventDefault(); }
  if(e.code==='Digit1'||e.code==='Digit2'||e.code==='Digit3') selecionar(+e.code.slice(-1)-1);
  if(e.code==='KeyR') reiniciar(); });
addEventListener('keyup',e=>{ const k=TECLAS[e.code]; if(k) K[k]=false; });
function botao(id, ao, solto){
  const b=$(id);
  b.addEventListener('pointerdown',e=>{ e.preventDefault(); Som.init(); b.setPointerCapture(e.pointerId); b.classList.add('on'); ao(); });
  const fim=e=>{ b.classList.remove('on'); solto&&solto(); };
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
  if(F.fim) { partes(dt); return; }
  F.t+=dt;
  if(K.trocaN){ selecionar((F.ativo+1)%3); }
  const A=F.ps[F.ativo];
  const vo=F.ps[2];
  for(const p of F.ps){
    const ativo = p===A;
    if(p.inv>0) p.inv-=dt; if(p.cd>0) p.cd-=dt;
    // movimento horizontal
    if(p.dash>0){ p.dash-=dt; p.vx=p.dir*420; }
    else if(ativo){ const m=(K.dir?1:0)-(K.esq?1:0); p.vx=m*p.vel; if(m) p.dir=m; }
    else p.vx=0;
    if(p.empurra){ p.vx+=p.empurra; p.empurra*=0.85; if(Math.abs(p.empurra)<5) p.empurra=0; }
    // pulo
    p.coyote = p.chao ? .08 : p.coyote-dt;
    if(ativo && K.puloN && p.coyote>0){ p.vy=p.pulo; p.coyote=0; Som.pulo(); }
    // poder
    if(ativo && K.acaoN) poder(p);
    // gravidade, planar e ventilador
    p.vy+=G*dt;
    if(p.id==='vo' && p.guarda){
      if(p.vy>55) p.vy=55;
      if(noVento(p)){ p.vy-=2900*dt; if(p.vy<-170) p.vy=-170; }
    }
    if(p.vy>650) p.vy=650;
    const bateu=moverX(p,p.vx*dt);
    if(p.dash>0){ quebrar(p); if(bateu) p.dash=0; }
    const peAntes=moverY(p,p.vy*dt);
    // ficar em cima do guarda-chuva da Vó
    if(p!==vo && vo.guarda && p.vy>=0){
      const topo=vo.y-16, peAgora=p.y+p.h;
      if(peAntes<=topo+1 && peAgora>=topo && p.x+p.w>vo.x-8 && p.x<vo.x+vo.w+8){ p.y=topo-p.h; p.vy=0; p.chao=true; }
    }
    if(p.vx) p.anim+=dt;
    coletar(p); perigos(p);
    if(F.fim) return;
    const s=F.saida; p.saida = Math.abs(p.x+p.w/2-(s.x*T+T/2))<22 && Math.abs(p.y+p.h-(s.y*T+T))<8;
  }
  K.puloN=K.acaoN=K.trocaN=false;
  robos(dt); projeteis(dt); partes(dt);
  // câmera
  const alvo=Math.max(0,Math.min(F.W*T-VW, A.x+A.w/2-VW/2));
  F.cam+=(alvo-F.cam)*Math.min(1,dt*8);
  if(F.ps.every(p=>p.saida)) vitoria();
}
function noVento(p){
  const cx=Math.floor((p.x+p.w/2)/T), y0=Math.floor((p.y+p.h)/T);
  for(let y=y0; y<=Math.min(9,y0+9); y++){ const c=tile(cx,y); if(c==='F') return true; if(solido(cx,y)) return false; }
  return false;
}
function poder(p){
  if(p.id==='tonho'){ if(p.cd>0) return; p.dash=.24; p.cd=.6; Som.tom(180,.15,'sawtooth',.06,0,90); }
  if(p.id==='bia'){ if(p.cd>0) return; p.cd=.4; F.tiros.push({ x:p.x+p.w/2+p.dir*10, y:p.y+10, vx:p.dir*380, vida:1.4 }); Som.tiro(); }
  if(p.id==='vo'){ p.guarda=!p.guarda; Som.tom(p.guarda?500:350,.08,'triangle',.06); }
}
function quebrar(p){
  const fx=Math.floor((p.dir>0 ? p.x+p.w+4 : p.x-4)/T);
  const y1=Math.floor(p.y/T), y2=Math.floor((p.y+p.h-1)/T);
  for(let y=y1;y<=y2;y++) if(tile(fx,y)==='Q'){ F.mapa[y][fx]='.'; estilhaço(fx*T+15,y*T+15,'#c0704a',12); Som.quebra(); vibrar(40); }
  // pancada em robô
  for(const r of F.robos) if(!r.morto && sobrepoe({x:p.x-4,y:p.y,w:p.w+8,h:p.h},r)){ matarRobo(r); }
}
function coletar(p){
  const x1=Math.floor(p.x/T), x2=Math.floor((p.x+p.w-1)/T), y1=Math.floor(p.y/T), y2=Math.floor((p.y+p.h-1)/T);
  for(let y=y1;y<=y2;y++) for(let x=x1;x<=x2;x++) if(tile(x,y)==='*'){ F.mapa[y][x]='.'; F.est++; Som.estrela(); estilhaço(x*T+15,y*T+15,'#ffd93b',10); hudTopo(); }
}
function perigos(p){
  if(p.y>10*T+20) return falha(p,'caiu num buraco');
  const x1=Math.floor((p.x+3)/T), x2=Math.floor((p.x+p.w-4)/T), y=Math.floor((p.y+p.h-4)/T);
  for(let x=x1;x<=x2;x++) if(tile(x,y)==='^') return falha(p,'pisou nos espinhos');
  for(const r of F.robos) if(!r.morto && sobrepoe(p,r) && p.dash<=0) ferir(p, Math.sign(p.x-r.x)||1);
}
function ferir(p,lado){
  if(p.inv>0) return; p.hp--; p.inv=1.1; p.vy=-200; p.empurra=lado*150; Som.dano(); vibrar(60); hudPers();
  if(p.hp<=0) falha(p,'ficou sem corações');
}
function robos(dt){
  for(const r of F.robos){
    if(r.morto) continue;
    if(r.pisca>0) r.pisca-=dt;
    r.cd-=dt;
    // procura alguém na mesma altura
    let alvo=null, md=7*T;
    for(const p of F.ps){ const dy=Math.abs((p.y+p.h/2)-(r.y+r.h/2)), dx=(p.x+p.w/2)-(r.x+r.w/2);
      if(dy<22 && Math.abs(dx)<md && livre(r.y+r.h/2, r.x+r.w/2, p.x+p.w/2)){ md=Math.abs(dx); alvo=dx; } }
    if(alvo!==null){ if(!r.mira){ r.mira=true; r.cd=Math.max(r.cd,.7); } r.dir=Math.sign(alvo)||1; r.vx=0;
      if(r.cd<=0){ F.lasers.push({ x:r.x+r.w/2+r.dir*12, y:r.y+9, vx:r.dir*210 }); r.cd=1.7; Som.laser(); } }
    else {
      r.mira=false; r.vx=r.dir*40;
      const frente=r.dir>0 ? r.x+r.w+2 : r.x-2;
      if(solidoPx(frente, r.y+r.h/2) || !solidoPx(frente, r.y+r.h+4)) r.dir*=-1;
    }
    r.vy+=G*dt; moverX(r,r.vx*dt); moverY(r,r.vy*dt);
  }
}
function livre(y,x1,x2){ const ty=Math.floor(y/T), a=Math.floor(Math.min(x1,x2)/T), b=Math.floor(Math.max(x1,x2)/T); for(let x=a+1;x<b;x++) if(solido(x,ty)) return false; return true; }
function matarRobo(r){ r.morto=true; estilhaço(r.x+11,r.y+12,'#9aa4b8',16); Som.quebra(); vibrar(30); }
function projeteis(dt){
  for(const s of F.tiros){
    s.x+=s.vx*dt; s.vida-=dt;
    const tx=Math.floor(s.x/T), ty=Math.floor(s.y/T);
    if(tile(tx,ty)==='A' && !F.aberto){ F.aberto=true; s.vida=0; Som.clique(); vibrar(30); estilhaço(tx*T+15,ty*T+15,'#ffd93b',8); aviso('Clique! Algo se abriu…'); continue; }
    if(solido(tx,ty)){ s.vida=0; estilhaço(s.x,s.y,'#bbb',4); continue; }
    for(const r of F.robos) if(!r.morto && s.x>r.x&&s.x<r.x+r.w&&s.y>r.y&&s.y<r.y+r.h){ s.vida=0; r.hp--; r.pisca=.2; Som.tom(300,.06,'square',.06); if(r.hp<=0) matarRobo(r); break; }
  }
  F.tiros=F.tiros.filter(s=>s.vida>0);
  const vo=F.ps[2];
  for(const l of F.lasers){
    l.x+=l.vx*dt;
    if(solidoPx(l.x,l.y)){ l.morto=true; continue; }
    for(const p of F.ps){
      if(l.x>p.x-2 && l.x<p.x+p.w+2 && l.y>p.y && l.y<p.y+p.h){
        if(p===vo && !vo.guarda && Math.sign(l.vx)===-vo.dir){ l.morto=true; Som.bloq(); estilhaço(l.x,l.y,'#ff4d4d',6); }
        else { l.morto=true; ferir(p, Math.sign(l.vx)); }
        break;
      }
    }
  }
  F.lasers=F.lasers.filter(l=>!l.morto && l.x>F.cam-200 && l.x<F.cam+VW+200);
}
function estilhaço(x,y,cor,n){ for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, v=60+Math.random()*160; F.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-80,vida:.6,cor}); } }
function partes(dt){ for(const p of F.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=900*dt; p.vida-=dt; } F.parts=F.parts.filter(p=>p.vida>0); }

// ---------- Desenho ----------
function desenhar(){
  const c=ctx, cam=Math.round(F.cam);
  // fundo: dentro do videogame
  const g=c.createLinearGradient(0,0,0,VH); g.addColorStop(0,'#1b1046'); g.addColorStop(1,'#3a1c71'); c.fillStyle=g; c.fillRect(0,0,VW,VH);
  c.strokeStyle='rgba(255,255,255,.05)'; c.lineWidth=1;
  for(let x=-(cam*.3)%40; x<VW; x+=40){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,VH); c.stroke(); }
  for(let y=0;y<VH;y+=40){ c.beginPath(); c.moveTo(0,y); c.lineTo(VW,y); c.stroke(); }
  c.fillStyle='rgba(255,255,255,.5)'; for(let i=0;i<40;i++){ const x=((i*97)-(cam*.15))%(VW+20); c.fillRect((x+VW+20)%(VW+20)-10, (i*53)%200, 2, 2); }
  c.save(); c.translate(-cam,0);
  const x0=Math.floor(cam/T), x1=Math.min(F.W-1, x0+VW/T+1);
  for(let y=0;y<10;y++) for(let x=x0;x<=x1;x++) desenhaTile(F.mapa[y][x],x*T,y*T,x,y);
  // ventos
  for(let x=x0;x<=x1;x++) for(let y=0;y<10;y++) if(F.mapa[y][x]==='F'){ c.strokeStyle='rgba(180,230,255,.35)'; c.lineWidth=2;
    for(let k=0;k<4;k++){ const yy=y*T-((F.t*120+k*45)%240); c.beginPath(); c.moveTo(x*T+6+k*6,yy); c.lineTo(x*T+6+k*6,yy-14); c.stroke(); } }
  for(const r of F.robos) if(!r.morto) desenhaRobo(r);
  F.ps.forEach((p,i)=>{ if(i!==F.ativo) desenhaPers(p,false); }); desenhaPers(F.ps[F.ativo],true);
  c.fillStyle='#e8e8e8'; for(const s of F.tiros){ c.beginPath(); c.arc(s.x,s.y,3,0,7); c.fill(); }
  for(const l of F.lasers){ c.fillStyle='#ff3b3b'; c.fillRect(l.x-8,l.y-2,16,4); c.fillStyle='#ffd0d0'; c.fillRect(l.x-6,l.y-1,12,2); }
  for(const p of F.parts){ c.globalAlpha=Math.max(0,p.vida/.6); c.fillStyle=p.cor; c.fillRect(p.x-2,p.y-2,4,4); } c.globalAlpha=1;
  c.restore();
}
function desenhaTile(t,x,y,tx,ty){
  const c=ctx;
  if(t==='#'){ c.fillStyle='#5a3fa0'; c.fillRect(x,y,T,T); c.fillStyle='#7a5fd0'; c.fillRect(x,y,T,4); c.fillStyle='#4a3090'; c.fillRect(x+2,y+T-4,T-4,2);
    if(tile(tx,ty-1)!=='#'&&tile(tx,ty-1)!=='Q'){ c.fillStyle='#3ddc84'; c.fillRect(x,y,T,5); c.fillStyle='#2bb36a'; c.fillRect(x,y+5,T,2); } return; }
  if(t==='Q'){ c.fillStyle='#b35a3a'; c.fillRect(x,y,T,T); c.fillStyle='#8f4128'; c.fillRect(x,y+14,T,2); c.fillRect(x+14,y,2,14); c.fillRect(x+6,y+16,2,14); c.fillRect(x+22,y+16,2,14);
    c.strokeStyle='#2a1208'; c.lineWidth=2; c.beginPath(); c.moveTo(x+8,y+2); c.lineTo(x+14,y+12); c.lineTo(x+10,y+20); c.lineTo(x+18,y+28); c.stroke(); return; }
  if(t==='P'){ if(F.aberto){ c.fillStyle='rgba(255,170,40,.15)'; c.fillRect(x+10,y,10,T); return; }
    c.fillStyle='#2b2b2b'; c.fillRect(x+3,y,24,T); c.fillStyle='#ffaa28'; for(let k=0;k<3;k++) c.fillRect(x+3,y+k*10,24,5); return; }
  if(t==='b'){ if(F.aberto){ c.fillStyle='#c98a4a'; c.fillRect(x,y,T,12); c.fillStyle='#8f5a2a'; c.fillRect(x+T/2-1,y,2,12); c.fillRect(x,y+10,T,2); }
    else { c.strokeStyle='rgba(255,255,255,.25)'; c.setLineDash([4,4]); c.strokeRect(x+1,y+1,T-2,10); c.setLineDash([]); } return; }
  if(t==='A'){ c.fillStyle='#666'; c.fillRect(x+13,y+16,4,T*3); c.fillStyle='#444'; c.fillRect(x+6,y+18,18,8);
    c.strokeStyle='#ffd93b'; c.lineWidth=4; c.beginPath(); c.moveTo(x+15,y+20); c.lineTo(x+15+(F.aberto?10:-10),y+4); c.stroke(); c.fillStyle='#ff4d4d'; c.beginPath(); c.arc(x+15+(F.aberto?10:-10),y+4,4,0,7); c.fill(); return; }
  if(t==='^'){ c.fillStyle='#cfd6e6'; for(let k=0;k<3;k++){ c.beginPath(); c.moveTo(x+k*10,y+T); c.lineTo(x+k*10+5,y+8); c.lineTo(x+k*10+10,y+T); c.fill(); } return; }
  if(t==='F'){ c.fillStyle='#3a3f55'; c.fillRect(x,y,T,T); c.fillStyle='#8fd3ff'; c.save(); c.translate(x+15,y+15); c.rotate(F.t*12);
    for(let k=0;k<3;k++){ c.rotate(2.09); c.fillRect(-2,-12,4,12); } c.restore(); c.fillStyle='#fff'; c.beginPath(); c.arc(x+15,y+15,3,0,7); c.fill(); return; }
  if(t==='*'){ const s=1+Math.sin(F.t*5+tx)*.12; c.save(); c.translate(x+15,y+15); c.scale(s,s); c.fillStyle='#ffd93b'; c.beginPath();
    for(let k=0;k<10;k++){ const r=k%2?5:11, a=k*Math.PI/5-Math.PI/2; c.lineTo(Math.cos(a)*r,Math.sin(a)*r); } c.fill(); c.restore(); return; }
  if(t==='S'){ const pulso=.6+Math.sin(F.t*4)*.25;
    c.fillStyle='#222'; c.fillRect(x-6,y-14,42,44); c.fillStyle=`rgba(80,255,170,${pulso})`; c.fillRect(x-2,y-10,34,36);
    c.fillStyle='#fff'; c.font='bold 9px system-ui'; c.textAlign='center'; c.fillText('SAÍDA',x+15,y-17);
    return; }
}
function desenhaRobo(r){
  const c=ctx; if(r.pisca>0&&Math.floor(r.pisca*30)%2) return;
  c.fillStyle='#9aa4b8'; c.fillRect(r.x,r.y+2,r.w,r.h-6); c.fillStyle='#6b7488'; c.fillRect(r.x+2,r.y+r.h-6,r.w-4,6);
  c.fillStyle='#1b1b2e'; c.fillRect(r.x+3,r.y+6,r.w-6,8); c.fillStyle='#ff3b3b'; c.fillRect(r.x+(r.dir>0?13:5),r.y+8,5,4);
  c.strokeStyle='#9aa4b8'; c.lineWidth=2; c.beginPath(); c.moveTo(r.x+11,r.y+2); c.lineTo(r.x+11,r.y-5); c.stroke(); c.fillStyle='#ff3b3b'; c.beginPath(); c.arc(r.x+11,r.y-6,2.5,0,7); c.fill();
}
// Personagens originais
function desenhaPers(p, ativo){
  const c=ctx; if(p.inv>0 && Math.floor(p.inv*20)%2) return;
  const cx=p.x+p.w/2, y=p.y, d=p.dir, passo=p.chao&&p.vx? Math.sin(p.anim*18)*3 : 0;
  c.save();
  if(p.saida){ c.globalAlpha=.85; }
  // pernas
  c.fillStyle= p.id==='vo' ? '#e8c9a0' : '#2d3a6b';
  c.fillRect(cx-6, y+22, 4, 6+passo/2); c.fillRect(cx+2, y+22, 4, 6-passo/2);
  if(p.id==='tonho'){
    c.fillStyle='#2f6fd6'; c.fillRect(cx-9,y+11,18,12);                      // camisa
    c.fillStyle='#1f4fa8'; c.fillRect(cx-9,y+20,18,3);
    c.fillStyle='#8d5524'; c.beginPath(); c.arc(cx,y+6,6.5,0,7); c.fill();      // cabeça
    c.fillStyle='#d64545'; c.fillRect(cx-7,y-2,14,5); c.fillRect(cx+(d>0?2:-11),y+1,9,2); // boné
    c.fillStyle='#2b1a10'; c.fillRect(cx+(d>0?0:-5),y+8,5,2);                 // bigode
    c.fillStyle='#fff'; c.fillRect(cx+(d>0?2:-4),y+4,2,2);
    c.fillStyle='#8d5524'; c.fillRect(cx+(d>0?6:-9),y+13+(p.dash>0?-2:0),3,8);  // braço
  }
  if(p.id==='bia'){
    c.fillStyle='#ffc93b'; c.fillRect(cx-7,y+11,14,11);
    c.fillStyle='#3b6fd6'; c.fillRect(cx-7,y+20,14,3);
    c.fillStyle='#c68642'; c.beginPath(); c.arc(cx,y+6,6,0,7); c.fill();
    c.fillStyle='#3a2110'; c.fillRect(cx-6,y-1,12,4); c.beginPath(); c.arc(cx-d*7,y+3,4,0,7); c.fill();   // cabelo e rabo
    c.fillStyle='#ff5fa8'; c.fillRect(cx-d*4-1,y+1,3,3);                      // lacinho
    c.fillStyle='#fff'; c.fillRect(cx+(d>0?2:-4),y+4,2,2);
    c.strokeStyle='#8a5a2b'; c.lineWidth=2; c.beginPath(); c.moveTo(cx+d*6,y+16); c.lineTo(cx+d*10,y+12); c.moveTo(cx+d*10,y+12); c.lineTo(cx+d*8,y+8); c.moveTo(cx+d*10,y+12); c.lineTo(cx+d*12,y+8); c.stroke(); // estilingue
  }
  if(p.id==='vo'){
    c.fillStyle='#8e44ad'; c.beginPath(); c.moveTo(cx-6,y+11); c.lineTo(cx+6,y+11); c.lineTo(cx+9,y+24); c.lineTo(cx-9,y+24); c.closePath(); c.fill(); // vestido
    c.fillStyle='#fff'; for(let k=0;k<3;k++) c.fillRect(cx-5+k*4,y+16,2,2);
    c.fillStyle='#f1c27d'; c.beginPath(); c.arc(cx,y+6,6,0,7); c.fill();
    c.fillStyle='#d9d9e0'; c.beginPath(); c.arc(cx,y-1,5,0,7); c.fill(); c.fillRect(cx-6,y+0,12,3);  // coque
    c.strokeStyle='#333'; c.lineWidth=1; c.beginPath(); c.arc(cx+d*2-2,y+6,2,0,7); c.arc(cx+d*2+3,y+6,2,0,7); c.stroke(); // óculos
    if(p.guarda){ // guarda-chuva aberto para cima
      c.fillStyle='#e63946'; c.beginPath(); c.arc(cx,y-2,15,Math.PI,0); c.fill();
      c.fillStyle='#fff'; [-9,0,9].forEach(o=>{ c.beginPath(); c.arc(cx+o,y-8,2,0,7); c.fill(); });
      c.strokeStyle='#333'; c.lineWidth=2; c.beginPath(); c.moveTo(cx,y-2); c.lineTo(cx,y+14); c.stroke();
    } else { // fechado na frente, como escudo
      c.fillStyle='#e63946'; c.beginPath(); c.moveTo(cx+d*11,y-2); c.lineTo(cx+d*15,y+12); c.lineTo(cx+d*11,y+24); c.lineTo(cx+d*8,y+12); c.closePath(); c.fill();
      c.strokeStyle='#333'; c.lineWidth=2; c.beginPath(); c.moveTo(cx+d*11,y+24); c.lineTo(cx+d*11,y+28); c.stroke();
    }
  }
  c.restore();
  if(ativo){ const b=Math.sin(F.t*8)*2; c.fillStyle='#fff'; c.beginPath(); c.moveTo(cx-5,y-(p.guarda?30:16)+b); c.lineTo(cx+5,y-(p.guarda?30:16)+b); c.lineTo(cx,y-(p.guarda?24:10)+b); c.fill(); }
  if(p.saida){ c.fillStyle='#3ddc84'; c.font='bold 12px system-ui'; c.textAlign='center'; c.fillText('✓',cx,y-(ativo?(p.guarda?34:20):6)); }
}

// ---------- HUD ----------
function hudPers(){
  $('pers').innerHTML = F.ps.map((p,i)=>`<button class="pc ${i===F.ativo?'on':''} ${p.saida?'ok':''}" data-i="${i}">
    <canvas width="40" height="40" data-p="${i}"></canvas><span class="nm">${p.nome.split(' ').pop()}</span><span class="hp">${'♥'.repeat(Math.max(0,p.hp))}<i>${'♥'.repeat(3-Math.max(0,p.hp))}</i></span></button>`).join('');
  $('pers').querySelectorAll('canvas').forEach(cv2=>retrato(cv2, F.ps[+cv2.dataset.p]));
  $('c-acao').innerHTML = `${F.ps[F.ativo].ic}<small>Poder</small>`;
}
function retrato(cv2,p){ const c2=cv2.getContext('2d'); const old=ctx; ctx=c2; c2.save(); c2.translate(20-(p.x+9)+0, 10-p.y); c2.scale(1,1);
  const tmp={...p, inv:0, saida:false, vx:0}; desenhaPers(tmp,false); c2.restore(); ctx=old; }
function hudTopo(){ $('h-est').textContent=`⭐ ${F.est}/${F.totalEst}`; }
let ultT=-1;
function hudTempo(){ const s=Math.floor(F.t); if(s!==ultT){ ultT=s; $('h-tempo').textContent='⏱ '+fmtT(F.t); const ok=F.ps.filter(p=>p.saida).length; $('h-saida').textContent=`🚪 ${ok}/3`; } }
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
  Som.init(); fecharModal();
  carregar(n); mostrar('jogo'); ajustaCanvas();
  hudPers(); hudTopo(); ultT=-1; ultSaida='';
  rodando=true; ult=performance.now(); acc=0; cancelAnimationFrame(raf); raf=requestAnimationFrame(quadro);
  aviso(innerHeight>innerWidth ? '📱 Gire o celular para ver melhor' : `Fase ${n}: ${F.def.nome}`);
}
function reiniciar(){ if(F) jogar(F.n); }
function parar(){ rodando=false; cancelAnimationFrame(raf); }

function falha(p,motivo){
  if(F.fim) return; F.fim=true; Som.dano(); vibrar([80,40,80]);
  setTimeout(()=>{ parar(); modal(`<h2>Ops!</h2><p><b>${p.nome}</b> ${motivo}.</p><p class="sub">A família só passa de fase junta. Tente de novo!</p>
    <button class="btn" id="m-rep">Tentar de novo</button><button class="btn sec" id="m-menu">Fases</button>`);
    $('m-rep').onclick=()=>jogar(F.n); $('m-menu').onclick=telaFases; }, 700);
}
function vitoria(){
  if(F.fim) return; F.fim=true; Som.vitoria(); vibrar([30,40,30,40,60]);
  const n=F.n, est=F.est, t=Math.round(F.t);
  const ant=S.est[n]||0; if(est>ant) S.est[n]=est;
  const recorde = !S.tempo[n] || t<S.tempo[n]; if(recorde) S.tempo[n]=t;
  if(n>=S.desbloq) S.desbloq=Math.min(FASES.length, n+1);
  salvar();
  const D=DUELO&&DUELO.f===n ? DUELO : null;
  setTimeout(()=>{ parar();
    modal(`<h2>Família salva!</h2><p class="sub">Fase ${n} · ${F.def.nome}</p>
      <div class="estrelas">${[0,1,2].map(k=>`<span class="${k<est?'on':''}">★</span>`).join('')}</div>
      <p style="font-size:22px;font-weight:900">⏱ ${fmtT(t)} ${recorde?'· recorde!':''}</p>
      ${est<F.totalEst?`<p class="sub">Faltaram ${F.totalEst-est} estrela(s). Volte para pegar!</p>`:''}
      ${D?`<div class="caixa"><b>${t<D.t?'Você venceu!':t>D.t?D.nm+' venceu.':'Empate!'}</b><br>Você ${fmtT(t)} × ${fmtT(D.t)} ${D.nm}</div>`:''}
      ${n<FASES.length?'<button class="btn verde" id="m-prox">Próxima fase ›</button>':'<p style="margin-top:8px">🏆 Você terminou todas as fases! Novas fases em breve.</p>'}
      <button class="btn zap" id="m-des">Desafiar um amigo</button>
      <button class="btn sec" id="m-menu">Fases</button>`);
    if($('m-prox')) $('m-prox').onclick=()=>jogar(n+1);
    $('m-des').onclick=()=>desafiar(n,t);
    $('m-menu').onclick=telaFases; }, 600);
}
function desafiar(n,t){
  if(!S.nome){ const v=prompt('Seu nome para o desafio:',''); S.nome=limpa(v&&v.trim()); salvar(); }
  const url=`${location.origin}${location.pathname}?f=${n}&t=${t}&nm=${encodeURIComponent(S.nome)}`;
  const txt=`Salvei a Família Oliveira na fase ${n} em ${fmtT(t)}. Consegue mais rápido?`;
  if(navigator.share) navigator.share({text:txt,url}).catch(()=>{}); else window.open('https://wa.me/?text='+encodeURIComponent(txt+'\n'+url),'_blank');
}

// ---------- Telas ----------
function mostrar(t){ document.querySelectorAll('.tela').forEach(e=>e.classList.remove('on')); $('t-'+t).classList.add('on'); }
function modal(h){ $('mbox').innerHTML=h; $('modal').hidden=false; }
function fecharModal(){ $('modal').hidden=true; }
function telaFases(){
  parar(); fecharModal();
  $('lista').innerHTML = FASES.map((f,i)=>{ const n=i+1, bloq=n>S.desbloq, e=S.est[n]||0;
    return `<button class="fase ${bloq?'bloq':''}" data-n="${n}"><span class="num">${bloq?'🔒':n}</span><span class="info"><b>${f.nome}</b><small>${bloq?'Complete a anterior':(S.tempo[n]?'Recorde '+fmtT(S.tempo[n]):'Ainda não jogada')}</small></span><span class="est">${'★'.repeat(e)}<i>${'★'.repeat(3-e)}</i></span></button>`; }).join('');
  mostrar('fases');
}
$('lista').addEventListener('click',e=>{ const b=e.target.closest('.fase'); if(!b) return; const n=+b.dataset.n;
  if(n>S.desbloq){ aviso('Complete a fase anterior'); return; } preFase(n); });
function preFase(n,extra){
  const f=FASES[n-1];
  modal(`<h2>Fase ${n}</h2><p class="sub">${f.nome}</p>${extra||''}<div class="caixa">💡 ${f.dica}</div>
    <button class="btn verde" id="m-ir">Jogar!</button><button class="btn sec" id="m-volta">Voltar</button>`);
  $('m-ir').onclick=()=>jogar(n); $('m-volta').onclick=fecharModal;
}
$('b-jogar').onclick=()=>{ Som.init(); telaFases(); };
$('b-volta').onclick=()=>mostrar('inicio');
$('j-pausa').onclick=()=>{ if(!F||F.fim) return; rodando=false;
  modal(`<h2>Pausa</h2><p class="sub">Teclado: ←→ andar · espaço pular · X poder · Tab trocar · R reiniciar</p>
    <button class="btn verde" id="m-cont">Continuar</button><button class="btn" id="m-rep">Reiniciar fase</button><button class="btn sec" id="m-menu">Fases</button>`);
  $('m-cont').onclick=()=>{ fecharModal(); rodando=true; ult=performance.now(); raf=requestAnimationFrame(quadro); };
  $('m-rep').onclick=()=>jogar(F.n); $('m-menu').onclick=telaFases; };
$('b-som').onclick=()=>{ S.som=!S.som; salvar(); $('b-som').textContent=S.som?'🔊':'🔇'; };

function ajustaCanvas(){ const dpr=Math.min(2,devicePixelRatio||1); cv.width=VW*dpr; cv.height=VH*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); ctx.imageSmoothingEnabled=false; }

// apresentação dos personagens
function apresentar(){
  $('elenco').innerHTML = PERS.map((p,i)=>`<div class="ator"><canvas width="60" height="60" data-i="${i}"></canvas><div><b>${p.nome}</b><small>${p.ic} ${p.poder}</small></div></div>`).join('');
  F={ t:0, ps:[] };
  $('elenco').querySelectorAll('canvas').forEach(c2=>{ const i=+c2.dataset.i; const p={...PERS[i],x:0,y:0,w:18,h:28,dir:1,inv:0,anim:0,vx:0,chao:true,guarda:false,dash:0,saida:false};
    const cc=c2.getContext('2d'); const old=ctx; ctx=cc; cc.save(); cc.scale(1.6,1.6); cc.translate(10,8); desenhaPers(p,false); cc.restore(); ctx=old; });
  F=null;
}

// links de desafio
let DUELO=null;
(function(){
  const P=new URLSearchParams(location.search); const n=+P.get('f');
  cv=$('tela'); ctx=cv.getContext('2d');
  $('rodape').textContent=`${CONFIG.SISTEMA} v${CONFIG.VERSAO}•Desenvolvido por ${CONFIG.DESENVOLVEDOR}`;
  $('b-som').textContent=S.som?'🔊':'🔇';
  apresentar();
  if(n>=1 && n<=FASES.length){
    DUELO={ f:n, t:+P.get('t')||0, nm:limpa(P.get('nm')) };
    history.replaceState(null,'',location.pathname);
    preFase(n, `<div class="caixa">🤝 <b>${DUELO.nm}</b> terminou esta fase em <b>${fmtT(DUELO.t)}</b>. Consegue mais rápido?</div>`);
  }
})();
