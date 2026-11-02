// Febre Doces — lógica do tabuleiro e das fases (sem DOM)
(function(G){
const C=8, L=9, N=C*L;

function rng(seed){ let a=seed>>>0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

function Tab(cfg, seed){
  this.r=rng(seed); this.tipos=cfg.tipos;
  this.c=new Array(N); this.gel=new Array(N).fill(false);
  for (let i=0;i<N;i++) this.c[i]={t:this.novoTipo(),esp:null,choc:0};
  const livres=[...Array(N).keys()];
  const pega = f => { const op=livres.filter(f); if(!op.length) return -1; const k=op[Math.floor(this.r()*op.length)]; livres.splice(livres.indexOf(k),1); return k; };
  for (let b=0;b<(cfg.blocos||0);b++){ const k=pega(k=>((k/C)|0)>=2); if(k>=0) this.c[k]={t:-1,esp:null,choc:2}; }
  const linhas=Math.ceil((cfg.geleia||0)/C)+1;
  for (let g=0;g<(cfg.geleia||0);g++){ const k=pega(k=>((k/C)|0)>=L-linhas); if(k>=0) this.gel[k]=true; }
  this.garantir();
}
const P=Tab.prototype;
P.novoTipo=function(){ return Math.floor(this.r()*this.tipos); };
P.viz=function(k){ const x=k%C,y=(k/C)|0,o=[]; if(x>0)o.push(k-1); if(x<C-1)o.push(k+1); if(y>0)o.push(k-C); if(y<L-1)o.push(k+C); return o; };
P.area=function(k){ const x=k%C,y=(k/C)|0,o=[]; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const nx=x+dx,ny=y+dy; if(nx>=0&&ny>=0&&nx<C&&ny<L) o.push(ny*C+nx); } return o; };
P.normal=function(c){ return c && !c.choc && c.esp!=='arco'; };
P.grupo=function(i){
  const a=this.c[i]; if(!this.normal(a)) return [i];
  const vis=new Set([i]), p=[i];
  while(p.length){ const k=p.pop(); for(const n of this.viz(k)){ const b=this.c[n]; if(!vis.has(n)&&this.normal(b)&&b.t===a.t){ vis.add(n); p.push(n); } } }
  return [...vis];
};
P.valida=function(i){ const a=this.c[i]; if(!a||a.choc) return false; if(a.esp) return true; return this.grupo(i).length>=3; };
P.temJogada=function(){ for(let i=0;i<N;i++) if(this.valida(i)) return true; return false; };
P.misturar=function(){
  const idx=[]; for(let i=0;i<N;i++){ const c=this.c[i]; if(c&&!c.choc&&!c.esp) idx.push(i); }
  const ts=idx.map(i=>this.c[i].t);
  for(let i=ts.length-1;i>0;i--){ const j=Math.floor(this.r()*(i+1)); [ts[i],ts[j]]=[ts[j],ts[i]]; }
  idx.forEach((k,n)=>this.c[k].t=ts[n]);
};
P.garantir=function(){
  let k=0; while(!this.temJogada() && k<40){ this.misturar(); k++; }
  if (this.temJogada()) return;
  for (let i=0;i<N-2;i++){ if(i%C>C-3) continue; const a=this.c[i],b=this.c[i+1],c=this.c[i+2];
    if([a,b,c].every(x=>x&&!x.choc&&!x.esp)){ b.t=a.t; c.t=a.t; return; } }
};
P.maisComum=function(){ const n={}; let m=-1,mt=0; for(const c of this.c){ if(this.normal(c)){ n[c.t]=(n[c.t]||0)+1; if(n[c.t]>m){m=n[c.t];mt=c.t;} } } return mt; };
P.geleias=function(){ return this.gel.filter(Boolean).length; };
P.chocolates=function(){ return this.c.filter(c=>c&&c.choc).length; };

P.jogar=function(i){
  if(!this.valida(i)) return null;
  const a=this.c[i], rem=new Set(), bombas=[]; let pts=0, criar=null, tam=0, arco=-1;
  if (a.esp==='arco'){
    arco=this.maisComum(); rem.add(i);
    for(let k=0;k<N;k++){ const b=this.c[k]; if(k!==i&&b&&!b.choc&&b.t===arco){ rem.add(k); tam++; if(b.esp==='bomba') bombas.push(k); } }
    pts+=tam*40;
  } else if (a.esp==='bomba'){ bombas.push(i); }
  else {
    const g=this.grupo(i); tam=g.length;
    g.forEach(k=>{ rem.add(k); if(this.c[k].esp==='bomba') bombas.push(k); });
    pts+=tam*tam*10;
    if(tam>=7) criar={i,esp:'arco',t:a.t}; else if(tam>=5) criar={i,esp:'bomba',t:a.t};
  }
  const res=this.resolver(rem,bombas,pts,criar,new Map());
  res.tam=tam; res.arco=arco; res.tipo=a.t; res.esp=a.esp;
  return res;
};
P.martelo=function(i){
  const c=this.c[i]; if(!c) return null;
  if (c.choc) return this.resolver(new Set(),[],0,null,new Map([[i,9]]));
  return this.resolver(new Set([i]), c.esp==='bomba'?[i]:[], 20, null, new Map());
};
P.resolver=function(rem,bombas,pts,criar,dano){
  const base=[...rem], feitos=new Set(), expl=[];
  while(bombas.length){
    const b=bombas.pop(); if(feitos.has(b)) continue; feitos.add(b); expl.push(b); rem.add(b);
    for(const k of this.area(b)){ const c=this.c[k]; if(!c) continue;
      if(c.choc){ dano.set(k,9); continue; }
      if(!rem.has(k)){ rem.add(k); pts+=30; }
      if(c.esp==='bomba'&&!feitos.has(k)) bombas.push(k);
    }
  }
  for(const k of base) for(const n of this.viz(k)){ const c=this.c[n]; if(c&&c.choc&&!dano.has(n)) dano.set(n,1); }
  const col={}; let gels=0, chocs=0; const sumidos=[];
  for(const k of rem){ const c=this.c[k]; if(!c) continue;
    if(c.t>=0) col[c.t]=(col[c.t]||0)+1;
    if(this.gel[k]){ this.gel[k]=false; gels++; }
    if(criar && k===criar.i) continue;
    this.c[k]=null; sumidos.push(k);
  }
  const chocDano=[];
  for(const [k,d] of dano){ const c=this.c[k]; if(!c||!c.choc) continue; c.choc-=d;
    if(c.choc<=0){ this.c[k]=null; chocs++; pts+=50; sumidos.push(k); if(this.gel[k]){ this.gel[k]=false; gels++; } }
    else chocDano.push(k);
  }
  if(criar) this.c[criar.i]={ t:criar.esp==='arco'?-2:criar.t, esp:criar.esp, choc:0 };
  const quedas=this.gravidade();
  let misturou=false; if(!this.temJogada()){ this.garantir(); misturou=true; }
  return { pts, col, gels, chocs, sumidos, expl, criado:criar, quedas, misturou, chocDano };
};
P.gravidade=function(){
  const q=new Array(N).fill(0);
  for(let x=0;x<C;x++){
    let y=L-1;
    for(let yy=L-1;yy>=0;yy--){ const k=yy*C+x, c=this.c[k];
      if(c){ const nk=y*C+x; if(nk!==k){ this.c[nk]=c; this.c[k]=null; q[nk]=y-yy; } y--; } }
    const vaz=y+1;
    for(;y>=0;y--){ this.c[y*C+x]={t:this.novoTipo(),esp:null,choc:0}; q[y*C+x]=vaz; }
  }
  return q;
};
P.dica=function(){
  let best=null, bs=0; const vis=new Set();
  for(let i=0;i<N;i++){ const c=this.c[i]; if(!c||c.choc) continue;
    if(c.esp==='arco') return [i];
    if(c.esp==='bomba'){ if(bs<6){ best=[i]; bs=6; } continue; }
    if(vis.has(i)) continue; const g=this.grupo(i); g.forEach(k=>vis.add(k));
    if(g.length>=3 && g.length>bs){ bs=g.length; best=g; } }
  return best;
};
// lista de jogadas distintas (usada pelo robô de calibração)
P.jogadas=function(){
  const out=[], vis=new Set();
  for(let i=0;i<N;i++){ const c=this.c[i]; if(!c||c.choc) continue;
    if(c.esp){ out.push({i,g:[i],esp:c.esp}); continue; }
    if(vis.has(i)) continue; const g=this.grupo(i); g.forEach(k=>vis.add(k));
    if(g.length>=3) out.push({i,g,t:c.t}); }
  return out;
};

// ---------- Campanha ----------
const MUNDOS=[
  { nome:'Vila do Brigadeiro', cor:'#ff7eb6', claro:'#ffe3ef', deco:['🍫','🍬','🧁','🍭'] },
  { nome:'Bosque das Jujubas', cor:'#58c46b', claro:'#e2f7dc', deco:['🌳','🍄','🐻','🍬'] },
  { nome:'Lago de Pudim',      cor:'#f2a93b', claro:'#fff1d6', deco:['🍮','🦆','🍯','🍋'] },
  { nome:'Castelo de Cupcake', cor:'#9b6bff', claro:'#ece3ff', deco:['🏰','🧁','👑','🍰'] },
];
const BONUS_JOGADA=120;
const TUNE = /*TUNE*/[{"jog":24,"alvo":14280,"qtd":0,"s2":18620,"s3":24450},{"jog":24,"alvo":7950,"qtd":0,"s2":13620,"s3":17750},{"jog":16,"alvo":0,"qtd":0,"s2":4490,"s3":6650},{"jog":25,"alvo":0,"qtd":52,"s2":11910,"s3":14140},{"jog":19,"alvo":0,"qtd":0,"s2":7060,"s3":10190},{"jog":24,"alvo":6400,"qtd":0,"s2":8790,"s3":11790},{"jog":32,"alvo":0,"qtd":0,"s2":7700,"s3":9250},{"jog":25,"alvo":0,"qtd":19,"s2":5120,"s3":6590},{"jog":48,"alvo":0,"qtd":0,"s2":9260,"s3":11580},{"jog":24,"alvo":6070,"qtd":0,"s2":7940,"s3":10660},{"jog":17,"alvo":0,"qtd":0,"s2":3970,"s3":5010},{"jog":25,"alvo":0,"qtd":30,"s2":5110,"s3":6090},{"jog":24,"alvo":0,"qtd":0,"s2":6870,"s3":8380},{"jog":24,"alvo":4330,"qtd":0,"s2":5570,"s3":7100},{"jog":26,"alvo":0,"qtd":0,"s2":5380,"s3":6450},{"jog":25,"alvo":0,"qtd":22,"s2":7170,"s3":8530},{"jog":30,"alvo":0,"qtd":0,"s2":7250,"s3":8880},{"jog":24,"alvo":5440,"qtd":0,"s2":6690,"s3":9440},{"jog":32,"alvo":0,"qtd":0,"s2":6120,"s3":7330},{"jog":25,"alvo":0,"qtd":29,"s2":6970,"s3":8630},{"jog":41,"alvo":0,"qtd":0,"s2":10020,"s3":12310},{"jog":24,"alvo":5190,"qtd":0,"s2":6220,"s3":8750},{"jog":42,"alvo":0,"qtd":0,"s2":8170,"s3":9750},{"jog":25,"alvo":0,"qtd":33,"s2":6670,"s3":8290},{"jog":45,"alvo":0,"qtd":0,"s2":9630,"s3":11100},{"jog":24,"alvo":4920,"qtd":0,"s2":6130,"s3":7870},{"jog":15,"alvo":0,"qtd":0,"s2":5820,"s3":7200},{"jog":25,"alvo":0,"qtd":37,"s2":7730,"s3":9160},{"jog":32,"alvo":0,"qtd":0,"s2":9170,"s3":11130},{"jog":24,"alvo":6200,"qtd":0,"s2":7890,"s3":10210},{"jog":38,"alvo":0,"qtd":0,"s2":8500,"s3":9550},{"jog":25,"alvo":0,"qtd":25,"s2":3700,"s3":4350},{"jog":47,"alvo":0,"qtd":0,"s2":9790,"s3":11890},{"jog":24,"alvo":3590,"qtd":0,"s2":4130,"s3":4910},{"jog":45,"alvo":0,"qtd":0,"s2":9010,"s3":10230},{"jog":25,"alvo":0,"qtd":17,"s2":4870,"s3":5820},{"jog":50,"alvo":0,"qtd":0,"s2":11310,"s3":13220},{"jog":24,"alvo":3790,"qtd":0,"s2":4340,"s3":5150},{"jog":38,"alvo":0,"qtd":0,"s2":8950,"s3":10240},{"jog":25,"alvo":0,"qtd":19,"s2":3990,"s3":4840}]/*FIM*/;

function fase(n){
  const m=Math.min(MUNDOS.length-1, Math.floor((n-1)/10));
  let tipos = n<=5?4 : n<=30?5 : 6;
  const blocos = n>=11 ? Math.min(9, 3+Math.floor((n-11)/3)) : 0;
  let tipo = n<=2 ? 'pontos' : ['coletar','geleia','pontos','chocolate'][n%4];
  if (tipo==='chocolate' && !blocos) tipo='geleia';
  if (tipo==='geleia'||tipo==='chocolate') tipos=Math.min(tipos,5);
  const geleia = tipo==='geleia' ? Math.min(16, 6+Math.floor(n*0.3)) : 0;
  const blocosF = tipo==='geleia' ? Math.floor(blocos/3) : blocos;
  const T = TUNE[n-1] || { jog:25, alvo:2000, qtd:20, s2:3000, s3:4000 };
  return { n, m, tipos, blocos:blocosF, geleia, tipo, jog:T.jog, alvo:T.alvo, coletaTipo:n%tipos, qtd:T.qtd, s2:T.s2, s3:T.s3, seed:n*7919+13 };
}
const TOTAL_FASES=40;

G.FD = { C, L, N, rng, Tab, MUNDOS, fase, TOTAL_FASES, BONUS_JOGADA };
})(typeof window!=='undefined'?window:globalThis);
