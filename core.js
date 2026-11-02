// Núcleo compartilhado dos jogos — Vettore Sistemas
const CONFIG = { VERSAO:'0.6.0.0', DESENVOLVEDOR:'Vettore Sistemas' };

const $ = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString('pt-BR');
function rng(seed){ let a=seed>>>0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const hoje = () => { const d=new Date(); return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate(); };
const limpa = s => ((s||'').toString().replace(/[<>&"']/g,'').slice(0,16)) || 'Amigo';
function vibrar(p){ try{ navigator.vibrate && navigator.vibrate(p); }catch(e){} }
function popTxt(txt, cor){ const p=document.createElement('div'); p.className='pop'; p.textContent=txt; p.style.color=cor||'#fff'; document.body.appendChild(p); setTimeout(()=>p.remove(),700); }
function compartilhar(url, txt){
  if (navigator.share) navigator.share({ text:txt, url }).catch(()=>{});
  else window.open('https://wa.me/?text='+encodeURIComponent(txt+'\n'+url), '_blank');
}

// Canvas com tamanho lógico fixo 360x560
function criaCanvas(area){
  const W=360, H=560, dpr=Math.min(2, window.devicePixelRatio||1);
  const cv=document.createElement('canvas'); cv.width=W*dpr; cv.height=H*dpr; cv.className='cv';
  const ctx=cv.getContext('2d'); ctx.scale(dpr,dpr); area.appendChild(cv);
  const ponto = e => { const r=cv.getBoundingClientRect(); return { x:(e.clientX-r.left)*W/r.width, y:(e.clientY-r.top)*H/r.height }; };
  return { cv, ctx, W, H, ponto };
}

// Loop com passo fixo (mesma física em qualquer aparelho)
function loop(upd, draw){
  let ult=performance.now(), acc=0, vivo=true; const DT=1/60;
  function f(t){
    if (!vivo) return;
    acc += Math.min(0.1, (t-ult)/1000); ult=t;
    while (acc>=DT){ upd(DT); acc-=DT; if (!vivo) return; }
    draw(); requestAnimationFrame(f);
  }
  requestAnimationFrame(f);
  return () => { vivo=false; };
}

// Motor de telas: início, jogo, fim, desafio em dupla
function Motor(J){
  const ls = {
    get(k,d){ try{ const v=localStorage.getItem(J.id+'_'+k); return v===null?d:JSON.parse(v); }catch(e){ return d; } },
    set(k,v){ try{ localStorage.setItem(J.id+'_'+k, JSON.stringify(v)); }catch(e){} }
  };
  const P = new URLSearchParams(location.search);
  let desafio=null, resultado=null, modo='treino';
  if (P.get('r')) resultado = { seed:+P.get('r'), a:+P.get('a')||0, an:limpa(P.get('an')), b:+P.get('b')||0, bn:limpa(P.get('bn')) };
  else if (P.get('d')) desafio = { seed:+P.get('d'), s:+P.get('s')||0, n:limpa(P.get('n')) };
  const base = location.origin + location.pathname;

  document.title = J.nome;
  document.body.innerHTML = `
  <div class="app">
    <section class="tela on" id="t-inicio">
      <a class="voltar" href="index.html">‹ Jogos</a>
      <h1>${J.titulo}</h1>
      <p class="sub">${J.regras}</p>
      <div class="banner" id="convite" hidden></div>
      <input id="nome" maxlength="16" placeholder="Seu nome">
      <button class="btn" id="b-desafio" hidden>Aceitar desafio</button>
      <button class="btn" id="b-dia">Desafio do dia</button>
      <button class="btn sec" id="b-treino">Treino</button>
      <div class="box stats">
        <div><b id="s-nivel">1</b><small>Nível</small></div>
        <div><b id="s-rec">0</b><small>Recorde</small></div>
        <div><b id="s-hoje">–</b><small>Hoje</small></div>
      </div>
      <p class="sub" id="s-tema"></p>
    </section>
    <section class="tela jogo" id="t-jogo"><div id="area"></div></section>
    <section class="tela" id="t-fim">
      <p class="sub" id="f-titulo" style="margin-top:20px"></p>
      <div class="grande" id="f-pts">0</div>
      <p class="centro sub" id="f-rec"></p>
      <div class="box" id="f-dupla" hidden></div>
      <div class="espaco"></div>
      <button class="btn zap" id="f-share1"></button>
      <button class="btn sec" id="f-share2" hidden></button>
      <button class="btn sec" id="f-novo">Jogar de novo</button>
      <button class="btn sec" id="f-menu">Menu</button>
    </section>
    <section class="tela" id="t-res">
      <h1 style="font-size:30px">RESULTADO<br>DA DUPLA</h1>
      <div class="box" id="r-box"></div>
      <div class="espaco"></div>
      <button class="btn" id="r-jogar">Jogar</button>
    </section>
  </div>
  <footer>${J.nome} v${CONFIG.VERSAO}•Desenvolvido por ${CONFIG.DESENVOLVEDOR}</footer>`;

  const nome = () => limpa($('nome').value.trim() || 'Jogador');
  const mostrar = t => { document.querySelectorAll('.tela').forEach(e=>e.classList.remove('on')); $('t-'+t).classList.add('on'); scrollTo(0,0); };
  const barra = t => `<p class="centro sub mt">Dupla: ${fmt(t)} / ${fmt(J.meta)}</p><div class="meta"><i style="width:${Math.min(100,t/J.meta*100)}%"></i></div>`;
  const nivel = () => Math.floor(Math.sqrt(ls.get('total',0)/(J.meta/4)))+1;

  function tema(){
    const o = ls.get('ouro', false);
    document.body.classList.toggle('ouro', o);
    $('s-tema').textContent = o ? 'Visual Ouro desbloqueado ✓' : `Façam ${fmt(J.meta)} pts em dupla com um amigo e os dois ganham o visual Ouro.`;
  }
  function inicio(){
    $('s-nivel').textContent = nivel();
    $('s-rec').textContent = fmt(ls.get('recorde',0));
    const d = ls.get('dia',{});
    $('s-hoje').textContent = d.d===hoje() ? fmt(d.p) : '–';
    if (desafio){
      $('convite').hidden=false; $('b-desafio').hidden=false;
      $('convite').innerHTML = `<b>${desafio.n}</b> te desafiou com <b>${fmt(desafio.s)} pts</b>.<br>Juntos, cheguem a ${fmt(J.meta)} e <b>os dois</b> ganham o visual Ouro.`;
    }
    tema(); mostrar('inicio');
  }
  function jogar(seed, m){
    ls.set('nome', nome()); modo=m;
    $('area').innerHTML=''; mostrar('jogo');
    J.iniciar({ seed, area:$('area'), ouro:ls.get('ouro',false), fim: pts => terminar(Math.round(pts), seed) });
  }
  function terminar(pts, seed){
    ls.set('total', ls.get('total',0)+pts);
    const rec = ls.get('recorde',0), novoRec = pts>rec;
    if (novoRec) ls.set('recorde', pts);
    if (modo==='dia'){ const d=ls.get('dia',{}); if (d.d!==hoje() || pts>d.p) ls.set('dia',{d:hoje(),p:pts}); }
    $('f-pts').textContent = fmt(pts);
    $('f-rec').textContent = novoRec ? 'Novo recorde!' : `Recorde: ${fmt(rec)}`;
    $('f-titulo').textContent = modo==='dia' ? 'DESAFIO DO DIA' : modo==='desafio' ? 'DESAFIO' : 'TREINO';
    $('f-dupla').hidden=true; $('f-share2').hidden=true;
    const linkDes = `${base}?d=${seed}&s=${pts}&n=${encodeURIComponent(nome())}`;
    const txtDes = `Fiz ${fmt(pts)} pts no ${J.nome}. Bate isso? Se a gente somar ${fmt(J.meta)}, os dois ganham o visual Ouro.`;
    $('f-share1').textContent = 'Desafiar um amigo';
    $('f-share1').onclick = () => compartilhar(linkDes, txtDes);

    if (modo==='desafio' && desafio){
      const total = pts+desafio.s, bateu = total>=J.meta;
      if (bateu) ls.set('ouro', true);
      const venc = pts>desafio.s ? 'Você venceu!' : pts<desafio.s ? `${desafio.n} venceu.` : 'Empate!';
      $('f-dupla').hidden=false;
      $('f-dupla').innerHTML = `<div class="vs"><div><b>${fmt(pts)}</b><small>Você</small></div><div><b>${fmt(desafio.s)}</b><small>${desafio.n}</small></div></div>
        <p class="centro mt"><b>${venc}</b></p>${barra(total)}
        <p class="centro mt">${bateu ? '🏆 Meta batida! Visual Ouro liberado.' : 'Faltou pouco. Tentem de novo!'}</p>`;
      const linkRes = `${base}?r=${seed}&a=${desafio.s}&an=${encodeURIComponent(desafio.n)}&b=${pts}&bn=${encodeURIComponent(nome())}`;
      $('f-share1').textContent = `Mandar resultado para ${desafio.n}`;
      $('f-share1').onclick = () => compartilhar(linkRes, bateu ? 'Batemos a meta da dupla! Abre aqui pra pegar seu visual Ouro:' : `Fiz ${fmt(pts)} contra seus ${fmt(desafio.s)}. Veja:`);
      $('f-share2').hidden=false; $('f-share2').textContent='Desafiar outro amigo';
      $('f-share2').onclick = () => compartilhar(linkDes, txtDes);
    }
    $('f-novo').onclick = () => modo==='dia' ? jogar(hoje(),'dia') : modo==='desafio' ? jogar(desafio.seed,'desafio') : jogar(Math.floor(Math.random()*1e9),'treino');
    tema(); mostrar('fim');
  }
  function telaRes(){
    const total = resultado.a+resultado.b, bateu = total>=J.meta;
    if (bateu) ls.set('ouro', true);
    $('r-box').innerHTML = `<div class="vs"><div><b>${fmt(resultado.a)}</b><small>${resultado.an}</small></div><div><b>${fmt(resultado.b)}</b><small>${resultado.bn}</small></div></div>
      ${barra(total)}<p class="centro mt">${bateu ? '🏆 Meta batida! Visual Ouro liberado para você.' : 'A dupla não chegou na meta desta vez.'}</p>`;
    tema(); mostrar('res');
  }

  $('nome').value = ls.get('nome','');
  $('b-dia').onclick = () => jogar(hoje(),'dia');
  $('b-treino').onclick = () => jogar(Math.floor(Math.random()*1e9),'treino');
  $('b-desafio').onclick = () => jogar(desafio.seed,'desafio');
  $('f-menu').onclick = inicio;
  $('r-jogar').onclick = () => { history.replaceState(null,'',base); resultado=null; inicio(); };
  resultado ? telaRes() : inicio();
}
