// Lar dos Gatinhos — cômodos, móveis extras e gatinhos (desenhos originais em canvas)
// Usa os móveis de ../familia/cenario.js (DECO) e acrescenta cama, guarda-roupa, poltrona-gato e o gato.

const GATOS = [
  { id:'mimi',   nome:'Mimi',    cor:'#f4a259', listra:'#d9822b', barriga:'#fff1dc' },
  { id:'nino',   nome:'Nino',    cor:'#9aa3ad', listra:'#6f7882', barriga:'#e8ecef' },
  { id:'luna',   nome:'Luna',    cor:'#3b3b46', listra:null,      barriga:'#5a5a66', olho:'#ffd93b' },
  { id:'flor',   nome:'Flor',    cor:'#ffffff', listra:null,      barriga:'#ffe9f1', mancha:'#f4a259', mancha2:'#3b3b46' },
  { id:'tico',   nome:'Tico',    cor:'#c9a27a', listra:'#8a6440', barriga:'#f3e3cc' },
  { id:'pipoca', nome:'Pipoca',  cor:'#fff6e0', listra:null,      barriga:'#fffdf5', ponta:'#7a5a44' },
  { id:'bolinha',nome:'Bolinha', cor:'#f7d9a8', listra:'#e8b97a', barriga:'#fff5e6' },
  { id:'fumaca', nome:'Fumaça',  cor:'#6b7a8f', listra:'#4f5b6b', barriga:'#9aa7b8', olho:'#7be0c3' },
];

function gato(c, x, y, g, pose, t, esc=1){
  c.save(); c.translate(x,y); c.scale(esc,esc);
  const resp=Math.sin(t*2)*1.2, rabo=Math.sin(t*3)*.35;
  // rabo
  c.strokeStyle=g.cor; c.lineWidth=6; c.lineCap='round';
  c.beginPath(); c.moveTo(14,-8); c.quadraticCurveTo(30,-14, 26+Math.cos(rabo)*6, -30+Math.sin(rabo)*6); c.stroke();
  if(g.ponta){ c.strokeStyle=g.ponta; c.beginPath(); c.moveTo(25,-26); c.lineTo(26+Math.cos(rabo)*6,-30+Math.sin(rabo)*6); c.stroke(); }
  // corpo
  c.fillStyle=g.cor; c.beginPath(); c.ellipse(0,-12-resp*.3,18,14+resp*.2,0,0,7); c.fill();
  c.fillStyle=g.barriga; c.beginPath(); c.ellipse(-2,-8,10,8,0,0,7); c.fill();
  if(g.listra){ c.strokeStyle=g.listra; c.lineWidth=2.5; for(let k=0;k<3;k++){ c.beginPath(); c.arc(6,-14,8+k*3,-1.9,-1.1); c.stroke(); } }
  if(g.mancha){ c.fillStyle=g.mancha; c.beginPath(); c.ellipse(8,-16,7,5,.4,0,7); c.fill(); c.fillStyle=g.mancha2; c.beginPath(); c.ellipse(-6,-20,5,4,0,0,7); c.fill(); }
  // patas
  c.fillStyle=g.barriga; c.beginPath(); c.ellipse(-9,0,5,3,0,0,7); c.ellipse(3,0,5,3,0,0,7); c.fill();
  // cabeça
  const hy=-30-resp*.4;
  c.fillStyle=g.cor; c.beginPath(); c.moveTo(-15,hy-6); c.lineTo(-12,hy-20); c.lineTo(-4,hy-11); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(1,hy-11); c.lineTo(8,hy-20); c.lineTo(11,hy-6); c.closePath(); c.fill();
  c.fillStyle='#ffb6c8'; c.beginPath(); c.moveTo(-12,hy-9); c.lineTo(-11,hy-16); c.lineTo(-7,hy-11); c.fill(); c.beginPath(); c.moveTo(3,hy-11); c.lineTo(7,hy-16); c.lineTo(8,hy-9); c.fill();
  c.fillStyle=g.cor; c.beginPath(); c.ellipse(-2,hy,14,12,0,0,7); c.fill();
  if(g.ponta){ c.fillStyle=g.ponta; c.beginPath(); c.ellipse(-2,hy+3,7,5,0,0,7); c.fill(); }
  // rosto
  const pisca = (t%4)<.12;
  c.fillStyle=g.olho||'#2b2b2b';
  if(pose==='dorme'||pisca){ c.strokeStyle='#2b2b2b'; c.lineWidth=1.5; c.beginPath(); c.arc(-7,hy-1,3,0.2,Math.PI-.2); c.moveTo(6,hy-1); c.arc(3,hy-1,3,0.2,Math.PI-.2); c.stroke(); }
  else { c.beginPath(); c.ellipse(-7,hy-1,2.6,3.2,0,0,7); c.ellipse(3,hy-1,2.6,3.2,0,0,7); c.fill(); c.fillStyle='#2b2b2b'; c.beginPath(); c.ellipse(-7,hy-1,1.2,2.6,0,0,7); c.ellipse(3,hy-1,1.2,2.6,0,0,7); c.fill();
    c.fillStyle='#fff'; c.beginPath(); c.arc(-6,hy-2.5,.9,0,7); c.arc(4,hy-2.5,.9,0,7); c.fill(); }
  c.fillStyle='#ff8fab'; c.beginPath(); c.moveTo(-3.5,hy+3); c.lineTo(-.5,hy+3); c.lineTo(-2,hy+5); c.fill();
  c.strokeStyle='#2b2b2b'; c.lineWidth=1; c.beginPath(); c.moveTo(-2,hy+5); c.quadraticCurveTo(-4,hy+7,-6,hy+6); c.moveTo(-2,hy+5); c.quadraticCurveTo(0,hy+7,2,hy+6); c.stroke();
  c.strokeStyle='rgba(60,60,60,.6)'; c.beginPath(); c.moveTo(-10,hy+3); c.lineTo(-19,hy+1); c.moveTo(-10,hy+5); c.lineTo(-19,hy+6); c.moveTo(6,hy+3); c.lineTo(15,hy+1); c.moveTo(6,hy+5); c.lineTo(15,hy+6); c.stroke();
  c.fillStyle='rgba(255,140,170,.35)'; c.beginPath(); c.arc(-11,hy+3,2.5,0,7); c.arc(7,hy+3,2.5,0,7); c.fill();
  if(pose==='dorme'){ c.fillStyle='#7a6a8a'; c.font='bold 10px system-ui'; c.fillText('z',14,hy-14-((t*8)%8)); c.font='bold 7px system-ui'; c.fillText('z',20,hy-22-((t*6)%6)); }
  c.restore();
}

const MOVEIS_EXTRA = {
  cama(c,x,b){ const y=b-46; c.fillStyle='#b98552'; c.fillRect(x,y-20,8,66); c.fillRect(x+122,y+4,8,42);
    c.fillStyle='#fff'; c.fillRect(x+8,y+8,114,22); c.fillStyle='#a5d8ff'; c.fillRect(x+40,y+6,84,26); c.fillStyle='#8cc8f0'; for(let k=0;k<5;k++) c.fillRect(x+46+k*16,y+10,6,18);
    c.fillStyle='#fff3f8'; c.beginPath(); c.ellipse(x+24,y+10,14,8,0,0,7); c.fill(); c.fillStyle='#8a5a30'; c.fillRect(x+8,y+30,114,8); },
  guardaRoupa(c,x,b){ const y=b-110; c.fillStyle='#e8d5b7'; c.fillRect(x,y,70,110); c.strokeStyle='#c9a77a'; c.lineWidth=2; c.strokeRect(x+3,y+3,31,96); c.strokeRect(x+36,y+3,31,96);
    c.fillStyle='#b8925a'; c.fillRect(x+29,y+50,3,10); c.fillRect(x+38,y+50,3,10); c.fillStyle='#c9a77a'; c.fillRect(x,y+100,70,10); },
  arranhador(c,x,b){ c.fillStyle='#d9b38c'; c.fillRect(x+10,b-60,10,60); c.fillStyle='#a7d7c5'; c.fillRect(x,b-66,30,8); c.fillRect(x-2,b-8,34,8); c.strokeStyle='#b8925a'; c.lineWidth=1; for(let k=0;k<8;k++){ c.beginPath(); c.moveTo(x+10,b-56+k*6); c.lineTo(x+20,b-53+k*6); c.stroke(); } },
  caminha(c,x,b){ c.fillStyle='#f7b2c4'; c.beginPath(); c.ellipse(x+30,b-8,32,12,0,0,7); c.fill(); c.fillStyle='#ffe0ea'; c.beginPath(); c.ellipse(x+30,b-11,24,7,0,0,7); c.fill(); },
  vasoFlor(c,x,b){ c.fillStyle='#e8a87c'; c.beginPath(); c.moveTo(x,b-22); c.lineTo(x+20,b-22); c.lineTo(x+16,b); c.lineTo(x+4,b); c.fill(); ['#ff8fab','#ffd93b','#b39ddb'].forEach((cor,k)=>{ c.fillStyle='#6cbf84'; c.fillRect(x+5+k*5,b-40+k*4,2,18); c.fillStyle=cor; c.beginPath(); c.arc(x+6+k*5,b-42+k*4,5,0,7); c.fill(); }); },
  luminaria(c,x,b){ c.strokeStyle='#888'; c.lineWidth=1; c.beginPath(); c.moveTo(x+20,0); c.lineTo(x+20,30); c.stroke(); c.fillStyle='#ffd166'; c.beginPath(); c.moveTo(x+6,44); c.lineTo(x+34,44); c.lineTo(x+26,30); c.lineTo(x+14,30); c.fill(); c.fillStyle='rgba(255,230,150,.18)'; c.beginPath(); c.moveTo(x+6,44); c.lineTo(x-30,b); c.lineTo(x+70,b); c.lineTo(x+34,44); c.fill(); },
};

// Cômodos: cada item custa estrelas; gatinhos chegam no 3º e no 6º item
const COMODOS = [
  { id:'sala', nome:'Sala', parede:'#ffe3ec', papel:'#ffd0de', chao:'#e9c9a6', chaoL:'#dcb892',
    itens:[
      { id:'tapete',  nome:'Tapete',   ic:'🟪', custo:1, d:(c,b)=>DECO.tapete(c,110,b) },
      { id:'sofa',    nome:'Sofá',     ic:'🛋️', custo:1, d:(c,b)=>DECO.sofa(c,120,b) },
      { id:'quadro',  nome:'Quadro',   ic:'🖼️', custo:2, d:(c,b)=>DECO.quadro(c,150,60) },
      { id:'abajur',  nome:'Abajur',   ic:'💡', custo:2, d:(c,b)=>DECO.abajur(c,90,b) },
      { id:'estante', nome:'Estante',  ic:'📚', custo:2, d:(c,b)=>DECO.estante(c,250,b) },
      { id:'planta',  nome:'Planta',   ic:'🪴', custo:3, d:(c,b)=>DECO.planta(c,40,b) },
    ], gatos:['mimi','nino'] },
  { id:'cozinha', nome:'Cozinha', parede:'#dff5ec', papel:'#c9eddf', chao:'#f3efe6', chaoL:'#e3ddd0',
    itens:[
      { id:'geladeira', nome:'Geladeira', ic:'🧊', custo:1, d:(c,b)=>DECO.geladeira(c,20,b) },
      { id:'fogao',     nome:'Fogão',     ic:'🍳', custo:1, d:(c,b)=>DECO.fogao(c,74,b) },
      { id:'pia',       nome:'Pia',       ic:'🚰', custo:2, d:(c,b)=>DECO.pia(c,128,b) },
      { id:'armario',   nome:'Armário',   ic:'🗄️', custo:2, d:(c,b)=>DECO.armario(c,110,1.4) },
      { id:'mesa',      nome:'Mesa',      ic:'🍽️', custo:2, d:(c,b)=>DECO.mesa(c,230,b) },
      { id:'relogio',   nome:'Relógio',   ic:'🕰️', custo:3, d:(c,b)=>DECO.relogio(c,250,50) },
    ], gatos:['luna','flor'] },
  { id:'quarto', nome:'Quarto', parede:'#ece3ff', papel:'#ddd0fb', chao:'#e6cfb0', chaoL:'#d7bd9a',
    itens:[
      { id:'cama',     nome:'Cama',         ic:'🛏️', custo:1, d:(c,b)=>MOVEIS_EXTRA.cama(c,150,b) },
      { id:'janela',   nome:'Janela',       ic:'🪟', custo:1, d:(c,b)=>DECO.janela(c,50,40) },
      { id:'roupa',    nome:'Guarda-roupa', ic:'🚪', custo:2, d:(c,b)=>MOVEIS_EXTRA.guardaRoupa(c,30,b) },
      { id:'caminha',  nome:'Caminha',      ic:'🧺', custo:2, d:(c,b)=>MOVEIS_EXTRA.caminha(c,280,b) },
      { id:'luz',      nome:'Luminária',    ic:'🏮', custo:2, d:(c,b)=>MOVEIS_EXTRA.luminaria(c,200,b) },
      { id:'vaso',     nome:'Flores',       ic:'💐', custo:3, d:(c,b)=>MOVEIS_EXTRA.vasoFlor(c,120,b) },
    ], gatos:['tico','pipoca'] },
  { id:'jardim', nome:'Jardim', parede:'#cfefff', papel:null, chao:'#9fd88a', chaoL:'#8cc977', ceu:true,
    itens:[
      { id:'arvore',  nome:'Árvore',      ic:'🌳', custo:1, d:(c,b)=>DECO.arvore(c,10,b) },
      { id:'flores',  nome:'Canteiro',    ic:'🌷', custo:1, d:(c,b)=>{ DECO.flores(c,100,b); DECO.flores(c,140,b); } },
      { id:'casinha', nome:'Casinha',     ic:'🏠', custo:2, d:(c,b)=>DECO.casinha(c,190,b) },
      { id:'varal',   nome:'Varal',       ic:'👕', custo:2, d:(c,b)=>DECO.varal(c,90,b-6) },
      { id:'arranha', nome:'Arranhador',  ic:'🪵', custo:2, d:(c,b)=>MOVEIS_EXTRA.arranhador(c,270,b) },
      { id:'cerca',   nome:'Cerca',       ic:'🪜', custo:3, d:(c,b)=>{ DECO.cerca(c,240,b); DECO.cerca(c,296,b); } },
    ], gatos:['bolinha','fumaca'] },
];

function desenhaComodo(c, W, H, cm, comprados, gatosDoComodo, t, fantasma){
  const b=H-34;
  if(cm.ceu){ const g=c.createLinearGradient(0,0,0,b); g.addColorStop(0,'#bfe8ff'); g.addColorStop(1,'#eaf8ff'); c.fillStyle=g; c.fillRect(0,0,W,b);
    c.fillStyle='#fff'; [[60,40],[220,30],[300,70]].forEach(([x,y],k)=>{ const dx=(t*6+k*40)%(W+80)-40; c.beginPath(); c.arc(x+dx-60,y,12,0,7); c.arc(x+dx-46,y-6,14,0,7); c.arc(x+dx-30,y,11,0,7); c.fill(); });
    c.fillStyle='#ffe28a'; c.beginPath(); c.arc(W-40,36,18,0,7); c.fill(); }
  else { c.fillStyle=cm.parede; c.fillRect(0,0,W,b); if(cm.papel){ c.fillStyle=cm.papel; for(let x=0;x<W;x+=26){ for(let y=10;y<b;y+=26){ c.beginPath(); c.arc(x+((y/26)%2?13:0),y,3,0,7); c.fill(); } } }
    c.fillStyle='rgba(0,0,0,.06)'; c.fillRect(0,b-10,W,10); }
  c.fillStyle=cm.chao; c.fillRect(0,b,W,H-b); c.fillStyle=cm.chaoL; for(let x=0;x<W;x+=40) c.fillRect(x,b,2,H-b); c.fillRect(0,b+14,W,1);
  // itens já comprados (na ordem do cômodo)
  cm.itens.forEach(it=>{ if(comprados.includes(it.id)){ c.save(); if(fantasma===it.id){ const k=Math.min(1,fantasma_t); c.globalAlpha=k; c.translate(W/2,b); c.scale(.6+.4*k,.6+.4*k); c.translate(-W/2,-b); } it.d(c,b); c.restore(); } });
  // gatinhos que já chegaram
  gatosDoComodo.forEach((id,k)=>{ const g=GATOS.find(x=>x.id===id); const px=[200,70][k]||150, py=b+16; gato(c,px+Math.sin(t*.4+k)*6,py,g,k?'dorme':'senta',t,1); });
}
let fantasma_t=1;
