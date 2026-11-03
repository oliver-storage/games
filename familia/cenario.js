// Família em Ação — desenhos: ambientes, móveis e personagens (tudo original, em canvas)
const T = 30;

// ---------- Paletas por ambiente ----------
const TEMAS = {
  sala:    { fundo:'#f1dfb8', fundo2:'#e8cf9f', bloco:'#b98552', blocoE:'#8a5a30', topo:'#7a4a24', topoL:'#a86b3a', teto:'#fff7e6', rodape:'#7a4a24' },
  cozinha: { fundo:'#d8eeea', fundo2:'#bfe0da', bloco:'#e9eef2', blocoE:'#b9c4cc', topo:'#2b2b2b', topoL:'#f2f2f2', teto:'#ffffff', rodape:'#6a7a84' },
  quintal: { fundo:'#8fd3ff', fundo2:'#cfeeff', bloco:'#9a6a3c', blocoE:'#6e4422', topo:'#4caf50', topoL:'#7bd66f', teto:null, rodape:null },
  garagem: { fundo:'#9aa0a8', fundo2:'#8a9098', bloco:'#7d838b', blocoE:'#5c6168', topo:'#5c6168', topoL:'#f2c230', teto:'#6b7077', rodape:'#4a4f55' },
  tv:      { fundo:'#1b1046', fundo2:'#3a1c71', bloco:'#5a3fa0', blocoE:'#4a3090', topo:'#3ddc84', topoL:'#2bb36a', teto:'#5a3fa0', rodape:null },
};

function desenhaFundo(c, tema, cam, VW, VH, t){
  const P=TEMAS[tema];
  if (tema==='quintal'){
    const g=c.createLinearGradient(0,0,0,VH); g.addColorStop(0,'#6ec6ff'); g.addColorStop(1,'#d6f1ff'); c.fillStyle=g; c.fillRect(0,0,VW,VH);
    c.fillStyle='#ffe066'; c.beginPath(); c.arc(VW-60-(cam*.05)%40, 50, 24, 0, 7); c.fill();
    c.fillStyle='rgba(255,255,255,.9)';
    for (let i=0;i<6;i++){ const x=((i*170 - cam*.25 + t*6) % (VW+200) + VW+200) % (VW+200) - 100, y=30+(i*37)%70; nuvem(c,x,y,1+(i%3)*.25); }
    c.fillStyle='#b5d99c'; for (let i=-1;i<8;i++){ const x=i*140-(cam*.4)%140; c.beginPath(); c.ellipse(x+70,VH-30,110,60,0,Math.PI,0); c.fill(); }
    c.fillStyle='#c98a5a'; const mx=-(cam*.6)%60; for(let x=mx-60;x<VW;x+=60){ c.fillRect(x,VH-110,58,80); } // muro do vizinho
    c.fillStyle='#b37448'; for(let x=mx-60;x<VW;x+=60){ for(let y=VH-110;y<VH-30;y+=14){ c.fillRect(x,y,58,2); c.fillRect(x+((y/14)%2?14:42),y,2,14);} }
    return;
  }
  if (tema==='tv'){
    const g=c.createLinearGradient(0,0,0,VH); g.addColorStop(0,P.fundo); g.addColorStop(1,P.fundo2); c.fillStyle=g; c.fillRect(0,0,VW,VH);
    c.strokeStyle='rgba(255,255,255,.06)'; c.lineWidth=1;
    for(let x=-(cam*.3)%40; x<VW; x+=40){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,VH); c.stroke(); }
    for(let y=0;y<VH;y+=40){ c.beginPath(); c.moveTo(0,y); c.lineTo(VW,y); c.stroke(); }
    c.fillStyle='rgba(255,255,255,.5)'; for(let i=0;i<40;i++){ const x=((i*97)-(cam*.15))%(VW+20); c.fillRect((x+VW+20)%(VW+20)-10,(i*53)%220,2,2); }
    c.fillStyle='rgba(255,255,255,.035)'; for(let y=(t*60)%4;y<VH;y+=4) c.fillRect(0,y,VW,1); // linhas de TV
    return;
  }
  c.fillStyle=P.fundo; c.fillRect(0,0,VW,VH);
  if (tema==='sala'){ c.fillStyle=P.fundo2; for(let x=-(cam%24); x<VW; x+=24) c.fillRect(x,0,10,VH); }
  if (tema==='cozinha'){ c.strokeStyle=P.fundo2; c.lineWidth=2; for(let x=-(cam%20); x<VW; x+=20){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,VH); c.stroke(); } for(let y=0;y<VH;y+=20){ c.beginPath(); c.moveTo(0,y); c.lineTo(VW,y); c.stroke(); } }
  if (tema==='garagem'){ c.strokeStyle=P.fundo2; c.lineWidth=2; for(let y=0;y<VH;y+=20){ c.beginPath(); c.moveTo(0,y); c.lineTo(VW,y); c.stroke(); for(let x=-(cam%40)+((y/20)%2?20:0); x<VW; x+=40){ c.beginPath(); c.moveTo(x,y); c.lineTo(x,y+20); c.stroke(); } } }
}
function nuvem(c,x,y,s){ c.beginPath(); c.arc(x,y,14*s,0,7); c.arc(x+16*s,y-6*s,16*s,0,7); c.arc(x+34*s,y,13*s,0,7); c.fill(); }

// ---------- Blocos ----------
function desenhaBloco(c, tema, x, y, cima, baixo, linha){
  const P=TEMAS[tema];
  if (linha===0 && !P.teto) return;
  if (linha===0 && P.teto){ c.fillStyle=P.teto; c.fillRect(x,y,T,T); c.fillStyle='rgba(0,0,0,.08)'; c.fillRect(x,y+T-5,T,5); return; }
  if (tema==='tv'){ c.fillStyle=P.bloco; c.fillRect(x,y,T,T); c.fillStyle='#7a5fd0'; c.fillRect(x,y,T,3); c.fillStyle=P.blocoE; c.fillRect(x+2,y+T-4,T-4,2);
    if(!cima){ c.fillStyle=P.topo; c.fillRect(x,y,T,5); c.fillStyle=P.topoL; c.fillRect(x,y+5,T,2); } return; }
  const prateleira = !cima && !baixo;
  if (prateleira){ // móvel/prateleira flutuante
    if (tema==='sala'){ c.fillStyle='#8a5a30'; c.fillRect(x,y,T,12); c.fillStyle='#a86b3a'; c.fillRect(x,y,T,4); c.fillStyle='#6b4220'; c.fillRect(x+4,y+12,3,8); c.fillRect(x+T-7,y+12,3,8); return; }
    if (tema==='cozinha'){ c.fillStyle='#d9c6a5'; c.fillRect(x,y,T,12); c.fillStyle='#f4e9d4'; c.fillRect(x,y,T,4); c.fillStyle='#8a8f94'; c.fillRect(x+T/2-1,y+12,2,6); return; }
    if (tema==='garagem'){ c.fillStyle='#4a6fa5'; c.fillRect(x,y,T,10); c.fillStyle='#6d93c9'; c.fillRect(x,y,T,3); c.fillStyle='#333'; c.fillRect(x+2,y+10,2,10); c.fillRect(x+T-4,y+10,2,10); return; }
  }
  c.fillStyle=P.bloco; c.fillRect(x,y,T,T);
  if (tema==='sala'){ c.fillStyle=P.blocoE; c.fillRect(x,y+T-2,T,2); c.fillRect(x+(linha%2?8:20),y,2,T); }
  if (tema==='cozinha'){ c.strokeStyle=P.blocoE; c.lineWidth=1; c.strokeRect(x+.5,y+.5,15,15); c.strokeRect(x+15.5,y+.5,14,15); c.strokeRect(x+.5,y+15.5,15,14); c.strokeRect(x+15.5,y+15.5,14,14); }
  if (tema==='quintal'){ c.fillStyle=P.blocoE; for(let k=0;k<4;k++) c.fillRect(x+((k*11+linha*7)%26),y+6+k*6,4,3); }
  if (tema==='garagem'){ c.fillStyle=P.blocoE; c.fillRect(x+4,y+8,6,3); c.fillRect(x+18,y+20,8,3); }
  if (!cima){
    if (tema==='sala'){ c.fillStyle=P.topo; c.fillRect(x,y,T,7); c.fillStyle=P.topoL; c.fillRect(x,y,T,2); c.fillStyle='#5e3618'; c.fillRect(x+((linha*13)%26),y+2,2,5); }
    if (tema==='cozinha'){ for(let k=0;k<2;k++){ c.fillStyle=(Math.floor(x/15)+k)%2?P.topo:P.topoL; c.fillRect(x+k*15,y,15,7); } }
    if (tema==='quintal'){ c.fillStyle=P.topo; c.fillRect(x,y,T,7); c.fillStyle=P.topoL; for(let k=0;k<5;k++) c.fillRect(x+k*6+1,y-3,2,4); }
    if (tema==='garagem'){ c.fillStyle=P.topo; c.fillRect(x,y,T,6); c.fillStyle=P.topoL; c.fillRect(x+((linha*9)%20),y+1,10,3); }
  }
}

// ---------- Móveis e objetos ----------
// base: linha onde o objeto apoia (chão) ou, para objetos de parede, linha do topo
const DECO = {
  sofa(c,x,b){ const y=b-36; c.fillStyle='#c0392b'; c.fillRect(x,y,96,30); c.fillStyle='#a83226'; c.fillRect(x,y,96,12); c.fillRect(x-4,y+8,12,24); c.fillRect(x+88,y+8,12,24);
    c.fillStyle='#d9534f'; c.fillRect(x+8,y+14,38,12); c.fillRect(x+50,y+14,38,12); c.fillStyle='#5a3a1e'; c.fillRect(x+2,y+30,6,6); c.fillRect(x+88,y+30,6,6);
    c.fillStyle='#f4d03f'; c.fillRect(x+12,y+2,14,12); },
  poltrona(c,x,b){ const y=b-34; c.fillStyle='#2e86c1'; c.fillRect(x,y,44,28); c.fillStyle='#21618c'; c.fillRect(x,y,44,10); c.fillRect(x-4,y+8,10,22); c.fillRect(x+38,y+8,10,22); c.fillStyle='#5a3a1e'; c.fillRect(x+2,y+28,5,6); c.fillRect(x+37,y+28,5,6); },
  tv(c,x,b){ const y=b-60; c.fillStyle='#6b4423'; c.fillRect(x-4,y+34,64,26); c.fillStyle='#4a2f17'; c.fillRect(x+2,y+40,24,14); c.fillRect(x+30,y+40,24,14);
    c.fillStyle='#333'; c.fillRect(x,y,56,36); c.fillStyle='#7fd1c7'; c.fillRect(x+5,y+4,40,28); c.fillStyle='rgba(255,255,255,.35)'; for(let k=0;k<6;k++) c.fillRect(x+5,y+6+k*5,40,1);
    c.fillStyle='#999'; c.beginPath(); c.arc(x+50,y+10,2,0,7); c.arc(x+50,y+18,2,0,7); c.fill(); c.strokeStyle='#333'; c.lineWidth=2; c.beginPath(); c.moveTo(x+20,y); c.lineTo(x+10,y-14); c.moveTo(x+30,y); c.lineTo(x+40,y-14); c.stroke(); },
  estante(c,x,b){ const y=b-120; c.fillStyle='#8a5a30'; c.fillRect(x,y,88,120); c.fillStyle='#6b4220';
    for(let k=1;k<4;k++) c.fillRect(x+4,y+k*30,80,4); const cores=['#e74c3c','#3498db','#f1c40f','#2ecc71','#9b59b6'];
    for(let s=0;s<3;s++) for(let k=0;k<6;k++){ c.fillStyle=cores[(k+s)%5]; c.fillRect(x+8+k*12,y+s*30+10+(k%2)*3,9,20-(k%2)*3); } },
  quadro(c,x,top){ const y=top*0+top; c.fillStyle='#8a5a30'; c.fillRect(x,y,40,30); c.fillStyle='#aee3ff'; c.fillRect(x+4,y+4,32,22); c.fillStyle='#4caf50'; c.beginPath(); c.moveTo(x+4,y+26); c.lineTo(x+18,y+12); c.lineTo(x+36,y+26); c.fill(); c.fillStyle='#ffe066'; c.beginPath(); c.arc(x+28,y+10,4,0,7); c.fill(); },
  janela(c,x,top){ const y=top; c.fillStyle='#fff'; c.fillRect(x,y,60,54); c.fillStyle='#8fd3ff'; c.fillRect(x+4,y+4,24,46); c.fillRect(x+32,y+4,24,46); c.fillStyle='#e74c3c'; c.fillRect(x-8,y-4,12,62); c.fillRect(x+56,y-4,12,62); c.fillStyle='#c0392b'; c.fillRect(x-10,y-6,80,5); },
  abajur(c,x,b){ c.fillStyle='#5a3a1e'; c.fillRect(x+10,b-40,4,36); c.fillRect(x+2,b-4,20,4); c.fillStyle='#f7dc6f'; c.beginPath(); c.moveTo(x+2,b-40); c.lineTo(x+22,b-40); c.lineTo(x+18,b-58); c.lineTo(x+6,b-58); c.fill(); },
  tapete(c,x,b){ c.fillStyle='#8e44ad'; c.fillRect(x,b-2,120,4); c.fillStyle='#f39c12'; for(let k=0;k<12;k++) c.fillRect(x+k*10+2,b-2,4,2); },
  planta(c,x,b){ c.fillStyle='#d35400'; c.fillRect(x+4,b-18,18,18); c.fillStyle='#27ae60'; for(let k=0;k<5;k++){ c.beginPath(); c.ellipse(x+13+(k-2)*5,b-30-(k%2)*6,4,12,(k-2)*.4,0,7); c.fill(); } },
  relogio(c,x,top){ c.fillStyle='#fff'; c.beginPath(); c.arc(x+15,top*1+15,13,0,7); c.fill(); c.strokeStyle='#333'; c.lineWidth=2; c.stroke(); c.beginPath(); c.moveTo(x+15,top+15); c.lineTo(x+15,top+6); c.moveTo(x+15,top+15); c.lineTo(x+21,top+18); c.stroke(); },
  geladeira(c,x,b){ const y=b-80; c.fillStyle='#f4f6f7'; c.fillRect(x,y,44,80); c.strokeStyle='#aab'; c.lineWidth=2; c.strokeRect(x+1,y+1,42,78); c.beginPath(); c.moveTo(x,y+28); c.lineTo(x+44,y+28); c.stroke();
    c.fillStyle='#aab'; c.fillRect(x+36,y+8,3,14); c.fillRect(x+36,y+34,3,20); c.fillStyle='#e74c3c'; c.fillRect(x+8,y+40,8,8); c.fillStyle='#f1c40f'; c.fillRect(x+18,y+46,8,8); },
  fogao(c,x,b){ const y=b-44; c.fillStyle='#eceff1'; c.fillRect(x,y,44,44); c.fillStyle='#333'; c.fillRect(x+4,y+16,36,24); c.fillStyle='#555'; c.fillRect(x+8,y+20,28,14);
    c.fillStyle='#222'; c.fillRect(x,y-4,44,4); c.fillStyle='#888'; [8,20,32].forEach(k=>{ c.beginPath(); c.arc(x+k+2,y+8,3,0,7); c.fill(); });
    c.fillStyle='#c0392b'; c.fillRect(x+6,y-16,22,12); c.fillStyle='#922b21'; c.fillRect(x+4,y-16,26,3); },
  pia(c,x,b){ const y=b-40; c.fillStyle='#d9c6a5'; c.fillRect(x,y,60,40); c.fillStyle='#b8a17c'; c.fillRect(x+4,y+10,24,26); c.fillRect(x+32,y+10,24,26); c.fillStyle='#bdc3c7'; c.fillRect(x-2,y-4,64,6); c.fillStyle='#95a5a6'; c.fillRect(x+28,y-16,4,12); c.fillRect(x+28,y-16,12,3); },
  armario(c,x,top){ const y=top*T; c.fillStyle='#d9c6a5'; c.fillRect(x,y,60,40); c.strokeStyle='#b8a17c'; c.lineWidth=2; c.strokeRect(x+2,y+2,27,36); c.strokeRect(x+31,y+2,27,36); c.fillStyle='#8a6d3b'; c.fillRect(x+24,y+18,3,6); c.fillRect(x+34,y+18,3,6); },
  mesa(c,x,b){ const y=b-30; c.fillStyle='#a0522d'; c.fillRect(x,y,70,6); c.fillStyle='#7a3e1d'; c.fillRect(x+4,y+6,5,24); c.fillRect(x+61,y+6,5,24); c.fillStyle='#fff'; c.fillRect(x+10,y-8,16,8); c.fillStyle='#e74c3c'; c.beginPath(); c.arc(x+48,y-5,6,0,7); c.fill(); c.fillStyle='#f39c12'; c.beginPath(); c.arc(x+58,y-4,5,0,7); c.fill(); },
  panelas(c,x,top){ const y=top*T; c.fillStyle='#7f8c8d'; c.fillRect(x,y,70,3); [[6,'#c0392b',14],[28,'#7f8c8d',18],[52,'#e67e22',12]].forEach(([dx,cor,r])=>{ c.fillStyle='#555'; c.fillRect(x+dx+r/2-1,y+3,2,6); c.fillStyle=cor; c.beginPath(); c.arc(x+dx+r/2,y+9+r/2,r/2,0,7); c.fill(); }); },
  arvore(c,x,b){ c.fillStyle='#7a4a24'; c.fillRect(x+26,b-70,14,70); c.fillStyle='#2e8b3a'; c.beginPath(); c.arc(x+33,b-90,34,0,7); c.arc(x+10,b-70,22,0,7); c.arc(x+56,b-70,22,0,7); c.fill();
    c.fillStyle='#ff9800'; [[18,-86],[44,-98],[50,-72],[22,-66]].forEach(([dx,dy])=>{ c.beginPath(); c.arc(x+dx,b+dy,4,0,7); c.fill(); }); },
  flores(c,x,b){ const cores=['#e74c3c','#f1c40f','#ff79c6','#ffffff']; for(let k=0;k<4;k++){ c.fillStyle='#27ae60'; c.fillRect(x+k*8+3,b-12,2,12); c.fillStyle=cores[k]; c.beginPath(); c.arc(x+k*8+4,b-14,4,0,7); c.fill(); } },
  casinha(c,x,b){ c.fillStyle='#c0392b'; c.beginPath(); c.moveTo(x-4,b-36); c.lineTo(x+24,b-56); c.lineTo(x+52,b-36); c.fill(); c.fillStyle='#e67e22'; c.fillRect(x,b-36,48,36); c.fillStyle='#3b2412'; c.beginPath(); c.arc(x+24,b-12,10,Math.PI,0); c.fillRect(x+14,b-12,20,12); c.fill(); },
  varal(c,x,b){ c.fillStyle='#7a4a24'; c.fillRect(x,b-70,4,70); c.fillRect(x+110,b-70,4,70); c.strokeStyle='#ddd'; c.lineWidth=1.5; c.beginPath(); c.moveTo(x+2,b-66); c.quadraticCurveTo(x+57,b-58,x+112,b-66); c.stroke();
    [['#e74c3c',14],['#3498db',40],['#f1c40f',70]].forEach(([cor,dx])=>{ c.fillStyle=cor; c.fillRect(x+dx,b-62,22,26); c.fillRect(x+dx-5,b-62,32,8); }); },
  rede(c,x,b){ c.strokeStyle='#7a4a24'; c.lineWidth=4; c.beginPath(); c.moveTo(x,b); c.lineTo(x,b-50); c.moveTo(x+100,b); c.lineTo(x+100,b-50); c.stroke(); c.fillStyle='#e67e22'; c.beginPath(); c.moveTo(x,b-46); c.quadraticCurveTo(x+50,b-10,x+100,b-46); c.quadraticCurveTo(x+50,b-22,x,b-46); c.fill(); },
  cerca(c,x,b){ c.fillStyle='#f5f5f5'; for(let k=0;k<5;k++){ c.beginPath(); c.moveTo(x+k*12,b); c.lineTo(x+k*12,b-34); c.lineTo(x+k*12+4,b-40); c.lineTo(x+k*12+8,b-34); c.lineTo(x+k*12+8,b); c.fill(); } c.fillRect(x,b-26,60,4); c.fillRect(x,b-12,60,4); },
  ferramentas(c,x,top){ const y=top*T; c.fillStyle='#c9a26b'; c.fillRect(x,y,80,50); c.fillStyle='#333'; for(let i=0;i<4;i++) for(let j=0;j<3;j++) c.fillRect(x+6+i*20,y+6+j*15,2,2);
    c.fillStyle='#e74c3c'; c.fillRect(x+10,y+10,4,24); c.fillRect(x+6,y+8,12,6); c.fillStyle='#7f8c8d'; c.fillRect(x+30,y+8,3,28); c.fillRect(x+27,y+8,9,4); c.fillStyle='#f39c12'; c.fillRect(x+50,y+10,6,26); c.fillStyle='#95a5a6'; c.beginPath(); c.arc(x+68,y+20,8,0,7); c.fill(); },
  pneus(c,x,b){ for(let k=0;k<3;k++){ c.fillStyle='#222'; c.beginPath(); c.ellipse(x+20,b-8-k*14,20,8,0,0,7); c.fill(); c.fillStyle='#444'; c.beginPath(); c.ellipse(x+20,b-8-k*14,8,3,0,0,7); c.fill(); } },
  prateleira(c,x,top){ const y=top*T; c.fillStyle='#4a6fa5'; c.fillRect(x,y,70,4); c.fillRect(x,y+30,70,4); c.fillStyle='#e74c3c'; c.fillRect(x+6,y-14,14,14); c.fillStyle='#27ae60'; c.fillRect(x+26,y-18,10,18); c.fillStyle='#f1c40f'; c.fillRect(x+44,y-10,18,10); c.fillStyle='#8e44ad'; c.fillRect(x+10,y+16,22,14); c.fillStyle='#3498db'; c.fillRect(x+40,y+12,12,18); },
  bicicleta(c,x,b){ c.strokeStyle='#e74c3c'; c.lineWidth=3; c.beginPath(); c.arc(x+12,b-12,11,0,7); c.arc(x+52,b-12,11,0,7); c.stroke(); c.beginPath(); c.moveTo(x+12,b-12); c.lineTo(x+28,b-28); c.lineTo(x+46,b-28); c.lineTo(x+52,b-12); c.moveTo(x+28,b-28); c.lineTo(x+32,b-12); c.lineTo(x+46,b-28); c.stroke(); c.fillStyle='#333'; c.fillRect(x+24,b-34,10,3); },
  carro(c,x,b){ c.fillStyle='#2e86c1'; c.beginPath(); c.moveTo(x,b-16); c.lineTo(x,b-34); c.lineTo(x+30,b-38); c.lineTo(x+50,b-62); c.lineTo(x+110,b-62); c.lineTo(x+130,b-38); c.lineTo(x+150,b-34); c.lineTo(x+150,b-16); c.closePath(); c.fill();
    c.fillStyle='#aee3ff'; c.beginPath(); c.moveTo(x+56,b-58); c.lineTo(x+78,b-58); c.lineTo(x+78,b-40); c.lineTo(x+40,b-40); c.fill(); c.beginPath(); c.moveTo(x+84,b-58); c.lineTo(x+106,b-58); c.lineTo(x+122,b-40); c.lineTo(x+84,b-40); c.fill();
    c.fillStyle='#222'; c.beginPath(); c.arc(x+34,b-14,14,0,7); c.arc(x+118,b-14,14,0,7); c.fill(); c.fillStyle='#bbb'; c.beginPath(); c.arc(x+34,b-14,6,0,7); c.arc(x+118,b-14,6,0,7); c.fill(); c.fillStyle='#f1c40f'; c.fillRect(x+144,b-32,6,6); },
  lampada(c,x,top){ const y=top*T; c.strokeStyle='#333'; c.lineWidth=1; c.beginPath(); c.moveTo(x+10,y); c.lineTo(x+10,y+16); c.stroke(); c.fillStyle='#555'; c.fillRect(x+4,y+14,12,6); c.fillStyle='rgba(255,240,150,.9)'; c.beginPath(); c.arc(x+10,y+24,6,0,7); c.fill(); c.fillStyle='rgba(255,240,150,.12)'; c.beginPath(); c.moveTo(x+4,y+24); c.lineTo(x-30,y+150); c.lineTo(x+50,y+150); c.lineTo(x+16,y+24); c.fill(); },
  pixel(c,x,top){ const y=top*T; const cores=['#ff4d6a','#3ddc84','#46a8ff','#ffd93b']; for(let i=0;i<4;i++) for(let j=0;j<4;j++) if((i*3+j)%3){ c.fillStyle=cores[(i+j)%4]; c.globalAlpha=.35; c.fillRect(x+i*8,y+j*8,7,7); } c.globalAlpha=1; },
  tvgrande(c,x,b){ const y=b-120; c.fillStyle='#222'; c.fillRect(x-10,y,100,90); c.fillStyle='#333'; c.fillRect(x+30,y+90,20,30); },
};
const PAREDE = new Set(['quadro','janela','relogio','armario','panelas','ferramentas','prateleira','lampada','pixel']);
function desenhaDeco(c, d){ const [tipo,col,lin]=d; const f=DECO[tipo]; if(!f) return; const x=col*T;
  if (PAREDE.has(tipo)) f(c, x, (tipo==='quadro'||tipo==='janela'||tipo==='relogio') ? lin*T : lin); else f(c, x, lin*T); }

// ---------- Personagens (originais) ----------
// Galeria de visuais que o jogador escolhe para cada membro da família
const VISUAIS = [
  { id:'oculos',   nome:'Homem de óculos', pele:'#c68642', cabelo:'curto',     corCab:'#1b1b1b', roupa:'#1f3a93', calca:'#2c3e50', oculos:true, largo:true },
  { id:'barba',    nome:'Homem de barba',  pele:'#e0ac69', cabelo:'curto',     corCab:'#6b4423', roupa:'#2e86c1', calca:'#34495e', barba:true, largo:true },
  { id:'bone',     nome:'Jovem de boné',   pele:'#8d5524', cabelo:'bone',      corCab:'#f39c12', roupa:'#c0392b', calca:'#34495e', regata:true, largo:true },
  { id:'longo',    nome:'Mulher cabelo longo', pele:'#e0ac69', cabelo:'longo', corCab:'#6b4423', roupa:'#e84393', calca:'#5d6d7e', saia:true },
  { id:'cacheado', nome:'Mulher cacheada', pele:'#6b3e26', cabelo:'cacheado',  corCab:'#1b1b1b', roupa:'#f1c40f', calca:'#2c3e50' },
  { id:'vovo',     nome:'Vovó',            pele:'#f1c27d', cabelo:'coque',     corCab:'#dfe6e9', roupa:'#8e44ad', calca:'#f1c27d', oculos:true, saia:true, vestido:true },
  { id:'vovoh',    nome:'Vovô',            pele:'#d9a066', cabelo:'careca',    corCab:'#ecf0f1', roupa:'#7f8c8d', calca:'#4a4f55', bigode:true, suspensorio:true },
  { id:'menino',   nome:'Menino',          pele:'#c68642', cabelo:'curto',     corCab:'#5a3a1e', roupa:'#27ae60', calca:'#2980b9', crianca:true },
  { id:'menina',   nome:'Menina',          pele:'#f1c27d', cabelo:'chiquinhas',corCab:'#e1b12c', roupa:'#ff79c6', calca:'#ff79c6', crianca:true, saia:true, vestido:true },
  { id:'moletom',  nome:'Jovem de moletom',pele:'#d9a066', cabelo:'topete',    corCab:'#2b1a10', roupa:'#16a085', calca:'#2d3436', mochila:true },
];
const visual = id => VISUAIS.find(v=>v.id===id) || VISUAIS[0];

function quadroNegro(c, x, y, w, h){ c.fillStyle='#8b5a2b'; c.fillRect(x-2,y-2,w+4,h+4); c.fillStyle='#2f5d3a'; c.fillRect(x,y,w,h);
  c.strokeStyle='rgba(255,255,255,.75)'; c.lineWidth=1; c.beginPath(); c.moveTo(x+3,y+h*.35); c.lineTo(x+w*.45,y+h*.35); c.moveTo(x+3,y+h*.65); c.lineTo(x+w*.7,y+h*.65); c.stroke(); }

// p: {id (poder: william|kelly|junior), vis, x, y (topo), w, h, dir, anim, vx, chao, guarda, dash, agach}
function desenhaPers(c, p){
  if (p.agach){ // encolhido: miniatura da pessoa
    c.save(); const cx=p.x+p.w/2, base=p.y+p.h; c.translate(cx, base); c.scale(.48,.48);
    desenhaPers(c, {...p, agach:false, x:-p.w/2, y:-42, h:42}); c.restore(); return;
  }
  const V=visual(p.vis);
  const cx=p.x+p.w/2, base=p.y+p.h, d=p.dir||1, passo=(p.chao&&p.vx)?Math.sin((p.anim||0)*18)*3:0;
  const H=p.h, cab=H*(V.crianca?0.32:0.24), tronco=H*(V.crianca?0.33:0.36), perna=H-cab-tronco;
  const yC=p.y+cab/2, yT=p.y+cab, yP=yT+tronco, lt=V.largo?11:(V.crianca?7:8);
  // pernas e sapatos
  c.fillStyle=V.vestido?V.pele:V.calca; c.fillRect(cx-6,yP,5,perna-2+passo/2); c.fillRect(cx+1,yP,5,perna-2-passo/2);
  c.fillStyle='#222'; c.fillRect(cx-7,base-3,7,3); c.fillRect(cx,base-3,7,3);
  // cabelo comprido atrás
  if (V.cabelo==='longo'){ c.fillStyle=V.corCab; c.fillRect(cx-d*2-6,yC-2,12,cab+6); }
  if (V.cabelo==='cacheado'){ c.fillStyle=V.corCab; c.beginPath(); c.arc(cx,yC,cab/2+5,0,7); c.fill(); }
  if (V.mochila){ c.fillStyle='#34495e'; c.fillRect(cx-d*10-3,yT+2,6,tronco*.6); }
  // tronco
  if (V.vestido){ c.fillStyle=V.roupa; c.beginPath(); c.moveTo(cx-lt+2,yT); c.lineTo(cx+lt-2,yT); c.lineTo(cx+lt+2,yP+4); c.lineTo(cx-lt-2,yP+4); c.closePath(); c.fill();
    c.fillStyle='rgba(255,255,255,.8)'; for(let k=0;k<3;k++) c.fillRect(cx-5+k*4,yT+tronco/2,2,2); }
  else if (V.saia){ c.fillStyle=V.roupa; c.fillRect(cx-lt,yT,lt*2,tronco*.6); c.fillStyle=V.calca; c.beginPath(); c.moveTo(cx-lt,yT+tronco*.6); c.lineTo(cx+lt,yT+tronco*.6); c.lineTo(cx+lt+2,yP+3); c.lineTo(cx-lt-2,yP+3); c.fill(); }
  else { c.fillStyle=V.roupa; c.fillRect(cx-lt,yT,lt*2,tronco);
    if (V.regata){ c.fillStyle=V.pele; c.fillRect(cx-lt,yT,4,4); c.fillRect(cx+lt-4,yT,4,4); }
    if (V.suspensorio){ c.fillStyle='#c0392b'; c.fillRect(cx-5,yT,2,tronco); c.fillRect(cx+3,yT,2,tronco); }
    if (V.id==='oculos'){ c.fillStyle='#fff'; c.fillRect(cx-2,yT,4,5); } }
  // braços
  c.fillStyle=V.pele; c.fillRect(cx+(d>0?lt-3:-lt-1),yT+3+(p.dash>0?-3:0),4,tronco-4);
  // cabeça
  c.fillStyle=V.pele; c.beginPath(); c.arc(cx,yC,cab/2+(V.largo?1:0),0,7); c.fill();
  c.fillStyle=V.corCab;
  if (V.cabelo==='curto'||V.cabelo==='longo'){ c.beginPath(); c.arc(cx,yC-2,cab/2+(V.largo?1:0),Math.PI,0); c.fill(); if(V.cabelo==='longo') c.fillRect(cx-d*cab/2-1,yC-2,3,cab); }
  if (V.cabelo==='cacheado'){ c.beginPath(); c.arc(cx,yC-3,cab/2+2,Math.PI,0); c.fill(); }
  if (V.cabelo==='coque'){ c.beginPath(); c.arc(cx,yC-cab/2,4.5,0,7); c.fill(); c.beginPath(); c.arc(cx,yC-1,cab/2,Math.PI,0); c.fill(); }
  if (V.cabelo==='careca'){ c.fillRect(cx-cab/2,yC-2,3,5); c.fillRect(cx+cab/2-3,yC-2,3,5); }
  if (V.cabelo==='bone'){ c.beginPath(); c.arc(cx,yC-2,cab/2+.5,Math.PI,0); c.fill(); c.fillRect(cx-d*cab/2-5,yC-3,7,3); }
  if (V.cabelo==='topete'){ c.beginPath(); c.arc(cx,yC-1,cab/2+.5,Math.PI,0); c.fill(); c.fillRect(cx+d*2-2,yC-cab/2-1,6,3); }
  if (V.cabelo==='chiquinhas'){ c.beginPath(); c.arc(cx,yC-2,cab/2,Math.PI,0); c.fill(); c.beginPath(); c.arc(cx-cab/2-2,yC,3.5,0,7); c.arc(cx+cab/2+2,yC,3.5,0,7); c.fill(); }
  // rosto
  c.fillStyle='#111'; c.fillRect(cx+d*3-1,yC,2,2);
  if (V.barba){ c.fillStyle=V.corCab; c.beginPath(); c.arc(cx,yC+3,cab/2,0.1,Math.PI-0.1); c.fill(); }
  if (V.bigode){ c.fillStyle=V.corCab; c.fillRect(cx+d*1-3,yC+3,7,2); }
  if (V.oculos){ c.strokeStyle='#111'; c.lineWidth=1.2; c.strokeRect(cx+d*2-4,yC-1,4,3); c.strokeRect(cx+d*2+1,yC-1,4,3); }
  // acessório do poder de proteção: quadro-negro
  if (p.id==='kelly'){
    if (p.guarda){ quadroNegro(c, cx-17, p.y-14, 34, 10); c.fillStyle=V.pele; c.fillRect(cx-9,p.y-4,3,8); c.fillRect(cx+6,p.y-4,3,8); }
    else quadroNegro(c, cx+(d>0?lt-2:-lt-4), p.y+4, 6, H-12);
  }
}
