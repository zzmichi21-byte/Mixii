import { useEffect, useRef, useState, useCallback } from "react";

const W = 520, H = 460;
const PADDLE_W = 56, PADDLE_H = 8;
const BALL_R = 5;
const COLS = 8, ROWS = 5;
const BLOCK_W = 52, BLOCK_H = 24, GAP = 4;
const START_X = (W - (COLS * (BLOCK_W + GAP) - GAP)) / 2;
const START_Y = 44;
const PADDLE_Y = 395;

// ── Cat sprite definitions ──
const SPRITES = [
  { g: [" BBB ", "BBBBB", "BWBWB", "BBPBB", " bbb "], p: { B: "#111122", W: "#ffffff", P: "#ff88aa", b: "#334" } },
  { g: [" PPP ", "PPPPP", "PWPWP", "PPPPP", " NNN "], p: { P: "#ffaacc", W: "#fff", N: "#ff5599" } },
  { g: [" GGG ", "GGGGG", "GBGBG", "GGGGG", " NNN "], p: { G: "#eeeeee", B: "#aaaaaa", N: "#ffaacc" } },
  { g: [" OOO ", "OSOOO", "OWOWO", "OOOOO", " NNN "], p: { O: "#cc8844", S: "#aa6622", W: "#fff", N: "#ff88aa" } },
  { g: [" AAA ", "AAAAA", "ABABA", "AAAAA", " NNN "], p: { A: "#8899aa", B: "#556677", N: "#ffaacc" } },
  { g: [" RRR ", "RRRRR", "RWRWR", "RRRRR", " NNN "], p: { R: "#ff8833", W: "#fff", N: "#cc4400" } },
];

function drawGrid(ctx, grid, pal, ox, oy, s = 3) {
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[r].length; c++) {
      const ch = grid[r][c];
      if (ch !== " " && pal[ch]) {
        ctx.fillStyle = pal[ch];
        ctx.fillRect(ox + c * s, oy + r * s, s, s);
      }
    }
}

function drawBlock(ctx, b) {
  ctx.fillStyle = "#14082a";
  ctx.fillRect(b.x, b.y, BLOCK_W, BLOCK_H);
  ctx.strokeStyle = "#ff66aa55";
  ctx.lineWidth = 1;
  ctx.strokeRect(b.x + 0.5, b.y + 0.5, BLOCK_W - 1, BLOCK_H - 1);
  const s = 3;
  const gw = b.sprite.g[0].length * s;
  const gh = b.sprite.g.length * s;
  drawGrid(ctx, b.sprite.g, b.sprite.p,
    b.x + Math.floor((BLOCK_W - gw) / 2),
    b.y + Math.floor((BLOCK_H - gh) / 2), s);
}

// ── Draw rocker with long hair to chest ──
function drawRocker(ctx, x, y) {
  const cx = x + PADDLE_W / 2;
  // platform bar
  ctx.fillStyle = "#ff44aa";
  ctx.fillRect(x, y + 20, PADDLE_W, 2);
  ctx.fillStyle = "#330022";
  ctx.fillRect(x, y + 22, PADDLE_W, PADDLE_H - 2);
  // legs
  [0, 1].forEach(i => {
    ctx.fillStyle = "#111"; ctx.fillRect(cx - 5 + i * 6, y + 14, 4, 8);
    ctx.fillStyle = "#333"; ctx.fillRect(cx - 5 + i * 6, y + 20, 4, 2);
  });
  // torso
  ctx.fillStyle = "#0a0a0a"; ctx.fillRect(cx - 5, y + 5, 10, 11);
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(cx - 5, y + 5, 2, 11);
  ctx.fillRect(cx + 3, y + 5, 2, 11);
  // arms
  ctx.fillStyle = "#111";
  ctx.fillRect(cx - 7, y + 6, 3, 8);
  ctx.fillRect(cx + 4, y + 6, 3, 8);
  // head
  ctx.fillStyle = "#f5c9a0"; ctx.fillRect(cx - 4, y - 1, 8, 7);
  // eyes
  ctx.fillStyle = "#111";
  ctx.fillRect(cx - 3, y + 1, 2, 2);
  ctx.fillRect(cx + 1, y + 1, 2, 2);
  // mouth
  ctx.fillStyle = "#c06040"; ctx.fillRect(cx - 2, y + 4, 4, 1);

  // ── LONG curly brown hair (to chest level) ──
  const hairDark = "#4a2510";
  const hairMid = "#6b3a1f";
  const hairLight = "#8b5a2b";

  // top crown curls
  ctx.fillStyle = hairMid;
  [[-4,-4],[-2,-5],[0,-5],[2,-5],[4,-4],[5,-3],
   [-5,-3],[-5,-2],[-4,-1],[-3,0]].forEach(([dx,dy])=>{
    ctx.fillRect(cx+dx, y+dy, 2, 2);
  });
  ctx.fillStyle = hairLight;
  [[-1,-6],[0,-6],[1,-6],[3,-5],[5,-4]].forEach(([dx,dy])=>{
    ctx.fillRect(cx+dx, y+dy, 2, 2);
  });

  // left side flowing down (to chest ~y+16)
  ctx.fillStyle = hairMid;
  [[-5,-1],[-6,0],[-7,1],[-7,2],[-6,3],[-7,4],[-8,5],
   [-7,6],[-8,7],[-7,8],[-8,9],[-7,10],[-7,11],
   [-6,12],[-7,13],[-6,14],[-5,15],[-6,16]].forEach(([dx,dy])=>{
    ctx.fillRect(cx+dx, y+dy, 3, 2);
  });
  ctx.fillStyle = hairDark;
  [[-8,3],[-9,5],[-8,8],[-9,10],[-8,13],[-7,15]].forEach(([dx,dy])=>{
    ctx.fillRect(cx+dx, y+dy, 2, 2);
  });
  ctx.fillStyle = hairLight;
  [[-5,2],[-6,5],[-5,8],[-6,11],[-5,14]].forEach(([dx,dy])=>{
    ctx.fillRect(cx+dx, y+dy, 2, 2);
  });

  // right side flowing down (to chest ~y+16)
  ctx.fillStyle = hairMid;
  [[4,-1],[5,0],[6,1],[7,2],[6,3],[7,4],[8,5],
   [7,6],[8,7],[7,8],[8,9],[7,10],[7,11],
   [6,12],[7,13],[6,14],[5,15],[6,16]].forEach(([dx,dy])=>{
    ctx.fillRect(cx+dx, y+dy, 3, 2);
  });
  ctx.fillStyle = hairDark;
  [[8,3],[9,5],[8,8],[9,10],[8,13],[7,15]].forEach(([dx,dy])=>{
    ctx.fillRect(cx+dx, y+dy, 2, 2);
  });
  ctx.fillStyle = hairLight;
  [[5,2],[6,5],[5,8],[6,11],[5,14]].forEach(([dx,dy])=>{
    ctx.fillRect(cx+dx, y+dy, 2, 2);
  });

  // curly ends at chest
  ctx.fillStyle = hairMid;
  [[-4,17],[-5,17],[-3,16],[-4,18]].forEach(([dx,dy])=>ctx.fillRect(cx+dx,y+dy,2,2));
  [[4,17],[5,17],[3,16],[4,18]].forEach(([dx,dy])=>ctx.fillRect(cx+dx,y+dy,2,2));
  ctx.fillStyle = hairLight;
  [[-3,17],[-2,17],[3,17],[2,17]].forEach(([dx,dy])=>ctx.fillRect(cx+dx,y+dy,2,2));
}

function drawBall(ctx, x, y) {
  ctx.fillStyle = "#ff4499";
  ctx.beginPath(); ctx.arc(x, y, BALL_R + 1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffaacc";
  ctx.beginPath(); ctx.arc(x, y, BALL_R - 1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.fillRect(x - 1, y - 2, 2, 2);
}

// ── Falling cat pixel (from broken block) ──
function drawFallingCat(ctx, fc) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, fc.life);
  ctx.translate(fc.x, fc.y);
  ctx.rotate(fc.rot);
  ctx.scale(fc.scale, fc.scale);
  drawGrid(ctx, fc.sprite.g, fc.sprite.p, -8, -8, 3);
  ctx.restore();
}

// ── Background woman: pixel art, white skin, long black curly hair, black top ──
function drawWoman(ctx, frame) {
  const cx = 46, cy = 290;
  const breathe = Math.sin(frame * 0.04) * 1.5;
  const kissFrame = Math.floor(frame / 80) % 3; // 0=neutral,1=pucker,2=kiss
  const armSwing = Math.sin(frame * 0.06) * 6;

  ctx.save();
  ctx.globalAlpha = 0.22;

  // ── Body ──
  // legs
  ctx.fillStyle = "#d4a0c0";
  ctx.fillRect(cx - 6, cy + 30, 5, 16);
  ctx.fillRect(cx + 1, cy + 30, 5, 16);
  // skirt hint
  ctx.fillStyle = "#1a0010";
  ctx.fillRect(cx - 9, cy + 22, 18, 12);
  // torso (black top)
  ctx.fillStyle = "#111";
  ctx.fillRect(cx - 7, cy + 8 + breathe, 14, 16);
  // arms
  ctx.fillStyle = "#f0d0b0";
  // left arm (static)
  ctx.fillRect(cx - 11, cy + 10 + breathe, 5, 12);
  // right arm (waving for kiss)
  ctx.save();
  ctx.translate(cx + 10, cy + 10 + breathe);
  ctx.rotate((armSwing * Math.PI) / 180);
  ctx.fillRect(0, 0, 5, 12);
  // hand at end of arm
  ctx.fillStyle = "#f0d0b0";
  ctx.beginPath(); ctx.arc(2, 13, 3, 0, Math.PI * 2); ctx.fill();
  // flying kisses (hearts) from hand
  if (kissFrame === 2) {
    [0, 1, 2].forEach(i => {
      const hx = 8 + i * 9 + ((frame * 1.5) % 14);
      const hy = -6 - i * 7 - ((frame * 0.8) % 10);
      const hs = 0.7 + i * 0.15;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.scale(hs, hs);
      ctx.fillStyle = "#ff4488";
      ctx.beginPath();
      ctx.moveTo(0, 2); ctx.bezierCurveTo(-4, -2, -8, 0, -8, 4);
      ctx.bezierCurveTo(-8, 8, 0, 12, 0, 14);
      ctx.bezierCurveTo(0, 12, 8, 8, 8, 4);
      ctx.bezierCurveTo(8, 0, 4, -2, 0, 2);
      ctx.fill();
      ctx.restore();
    });
  }
  ctx.restore();

  // neck
  ctx.fillStyle = "#f0d0b0";
  ctx.fillRect(cx - 3, cy + 3 + breathe, 6, 7);
  // head
  ctx.fillStyle = "#f0d0b0";
  ctx.beginPath(); ctx.ellipse(cx, cy - 4 + breathe, 10, 11, 0, 0, Math.PI * 2); ctx.fill();
  // eyes
  ctx.fillStyle = "#2a1a3a";
  ctx.beginPath(); ctx.ellipse(cx - 4, cy - 5 + breathe, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 4, cy - 5 + breathe, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  // eyelashes
  ctx.strokeStyle = "#1a0a2a"; ctx.lineWidth = 1;
  [[-6,-7],[-4,-8],[-2,-7]].forEach(([ex,ey])=>{
    ctx.beginPath(); ctx.moveTo(cx+ex, cy+ey+breathe); ctx.lineTo(cx+ex-1, cy+ey-2+breathe); ctx.stroke();
  });
  [[2,-7],[4,-8],[6,-7]].forEach(([ex,ey])=>{
    ctx.beginPath(); ctx.moveTo(cx+ex, cy+ey+breathe); ctx.lineTo(cx+ex+1, cy+ey-2+breathe); ctx.stroke();
  });
  // blush
  ctx.fillStyle = "#ffaacc";
  ctx.globalAlpha = 0.18;
  ctx.beginPath(); ctx.ellipse(cx - 7, cy - 2 + breathe, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 7, cy - 2 + breathe, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.22;

  // mouth
  if (kissFrame === 0) {
    // smile
    ctx.strokeStyle = "#cc4466"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + 1 + breathe);
    ctx.quadraticCurveTo(cx, cy + 4 + breathe, cx + 4, cy + 1 + breathe);
    ctx.stroke();
  } else {
    // pucker / kiss
    ctx.fillStyle = "#ee4466";
    ctx.beginPath(); ctx.ellipse(cx, cy + 2 + breathe, 3, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    if (kissFrame === 2) {
      // kiss mark floating right
      const kx = cx + 14 + ((frame * 0.5) % 20);
      const ky = cy - 10 - ((frame * 0.3) % 15);
      ctx.fillStyle = "#ff4488";
      ctx.save(); ctx.translate(kx, ky); ctx.rotate(0.4);
      ctx.beginPath(); ctx.ellipse(-3, 0, 4, 2.5, -0.4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(3, 0, 4, 2.5, 0.4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0,2); ctx.lineTo(-3,7); ctx.lineTo(3,7); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  // ── Long black curly hair ──
  ctx.fillStyle = "#1a0a1a";
  // top & sides of head
  [[-9,-14],[-7,-15],[-5,-16],[-3,-16],[-1,-16],[1,-16],[3,-15],[5,-14],
   [-10,-12],[8,-12],[-11,-10],[9,-10],[-11,-8],[9,-8]].forEach(([dx,dy])=>{
    ctx.fillRect(cx+dx, cy+dy+breathe, 3, 3);
  });
  // left flowing curls
  [[-11,-6],[-12,-4],[-11,-2],[-13,0],[-12,2],[-13,4],[-12,6],
   [-13,8],[-12,10],[-13,12],[-12,14],[-11,16],[-12,18],[-11,20],
   [-10,22],[-11,24],[-9,26]].forEach(([dx,dy])=>{
    ctx.fillRect(cx+dx, cy+dy+breathe, 3, 3);
  });
  // right flowing curls
  [[9,-6],[10,-4],[9,-2],[11,0],[10,2],[11,4],[10,6],
   [11,8],[10,10],[11,12],[10,14],[9,16],[10,18],[9,20],
   [8,22],[9,24],[7,26]].forEach(([dx,dy])=>{
    ctx.fillRect(cx+dx, cy+dy+breathe, 3, 3);
  });
  // curl highlights
  ctx.fillStyle = "#3a1a3a";
  [[-10,4],[-11,10],[-10,16],[-9,22],[9,4],[10,10],[9,16],[8,22]].forEach(([dx,dy])=>{
    ctx.fillRect(cx+dx, cy+dy+breathe, 2, 2);
  });

  ctx.restore();
}

// ── Celebration special cat (black + white + pink ribbon) ──
function drawCelebCat(ctx, frame) {
  const cx = W / 2, cy = H / 2 - 40;
  const bob = Math.sin(frame * 0.12) * 5;
  const tw = Math.sin(frame * 0.18) * 12;
  ctx.save();
  ctx.strokeStyle = "#111"; ctx.lineWidth = 5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx-16, cy+30+bob);
  ctx.quadraticCurveTo(cx-34, cy+8+tw, cx-26, cy-14+tw); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+16, cy+30+bob);
  ctx.quadraticCurveTo(cx+34, cy+8-tw, cx+26, cy-14-tw); ctx.stroke();
  // body
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.ellipse(cx, cy+26+bob, 19, 23, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#f0f0f0";
  ctx.beginPath(); ctx.ellipse(cx, cy+30+bob, 9, 14, 0, 0, Math.PI*2); ctx.fill();
  [[-19,40],[19,40]].forEach(([dx,dy])=>{
    ctx.fillStyle="#111";
    ctx.beginPath(); ctx.ellipse(cx+dx, cy+dy+bob, 7, 5, dx>0?-0.3:0.3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle="#fff";
    ctx.beginPath(); ctx.ellipse(cx+dx, cy+dy+1+bob, 5, 3, dx>0?-0.3:0.3, 0, Math.PI*2); ctx.fill();
  });
  ctx.fillStyle="#111";
  ctx.beginPath(); ctx.ellipse(cx, cy+bob, 22, 20, 0, 0, Math.PI*2); ctx.fill();
  [[-1],[1]].forEach(([sx])=>{
    ctx.fillStyle="#111";
    ctx.beginPath(); ctx.moveTo(cx+sx*14, cy-8+bob); ctx.lineTo(cx+sx*22, cy-24+bob); ctx.lineTo(cx+sx*6, cy-12+bob); ctx.fill();
    ctx.fillStyle="#ff88bb";
    ctx.beginPath(); ctx.moveTo(cx+sx*13, cy-9+bob); ctx.lineTo(cx+sx*19, cy-21+bob); ctx.lineTo(cx+sx*7, cy-12+bob); ctx.fill();
  });
  ctx.fillStyle="#f0f0f0";
  ctx.beginPath(); ctx.ellipse(cx-6, cy+9+bob, 7, 6, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx+6, cy+9+bob, 7, 6, 0, 0, Math.PI*2); ctx.fill();
  const blink = frame%90<5;
  if(blink){
    ctx.strokeStyle="#111"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(cx-8,cy+3+bob); ctx.lineTo(cx-3,cy+3+bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+3,cy+3+bob); ctx.lineTo(cx+8,cy+3+bob); ctx.stroke();
  } else {
    ctx.fillStyle="#1a1a1a";
    ctx.beginPath(); ctx.ellipse(cx-6,cy+3+bob,4,5,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+6,cy+3+bob,4,5,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#44aaff";
    ctx.beginPath(); ctx.ellipse(cx-6,cy+3+bob,2.5,3,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+6,cy+3+bob,2.5,3,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#fff"; ctx.fillRect(cx-5,cy+1+bob,2,2); ctx.fillRect(cx+7,cy+1+bob,2,2);
  }
  ctx.fillStyle="#ff88aa";
  ctx.beginPath(); ctx.ellipse(cx,cy+8+bob,3,2,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#ff6699"; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(cx-4,cy+10+bob); ctx.quadraticCurveTo(cx,cy+14+bob,cx+4,cy+10+bob); ctx.stroke();
  ctx.strokeStyle="#cccccc"; ctx.lineWidth=1;
  [[-22,6,-10,9],[-23,9,-10,10],[-21,12,-10,11],[10,9,22,6],[10,10,23,9],[10,11,21,12]].forEach(([x1,y1,x2,y2])=>{
    ctx.beginPath(); ctx.moveTo(cx+x1,cy+y1+bob); ctx.lineTo(cx+x2,cy+y2+bob); ctx.stroke();
  });
  // ribbon
  ctx.fillStyle="#ff5599";
  ctx.beginPath(); ctx.ellipse(cx,cy+18+bob,14,4,0,0,Math.PI*2); ctx.fill();
  [[-12,15],[12,15]].forEach(([dx,dy])=>{
    ctx.fillStyle="#ff5599";
    ctx.beginPath(); ctx.ellipse(cx+dx,cy+dy+bob,7,4.5,dx>0?-0.4:0.4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#ff99cc";
    ctx.beginPath(); ctx.ellipse(cx+dx,cy+dy+bob,4,2.5,dx>0?-0.4:0.4,0,Math.PI*2); ctx.fill();
  });
  ctx.fillStyle="#ffbbdd";
  ctx.beginPath(); ctx.ellipse(cx,cy+16+bob,4,4,0,0,Math.PI*2); ctx.fill();
  [[32,-22],[-36,-16],[28,18],[-32,22],[0,-40]].forEach(([sx,sy],i)=>{
    const a=frame*0.09+i*1.25, sc=0.6+Math.sin(a)*0.4;
    ctx.save(); ctx.translate(cx+sx,cy+sy+bob); ctx.scale(sc,sc);
    ctx.fillStyle=["#ffaacc","#fff","#ff66aa","#ffe0ee","#ffdd00"][i];
    ctx.fillRect(-2,-2,4,4); ctx.fillRect(-5,0,10,1); ctx.fillRect(0,-5,1,10);
    ctx.restore();
  });
  ctx.restore();
}

// ── Audio ──
let audioCtx = null;
function getAC() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playCatMeow(freq = 420) {
  try {
    const ac = getAC(); const t = ac.currentTime;
    const osc = ac.createOscillator(), gain = ac.createGain(), filt = ac.createBiquadFilter();
    filt.type="bandpass"; filt.Q.value=10;
    filt.frequency.setValueAtTime(700,t); filt.frequency.linearRampToValueAtTime(2100+freq*0.5,t+0.1); filt.frequency.linearRampToValueAtTime(950,t+0.28);
    osc.type="sawtooth";
    osc.frequency.setValueAtTime(freq,t); osc.frequency.linearRampToValueAtTime(freq*1.65,t+0.1); osc.frequency.linearRampToValueAtTime(freq*0.78,t+0.28);
    gain.gain.setValueAtTime(0,t); gain.gain.linearRampToValueAtTime(0.2,t+0.05); gain.gain.linearRampToValueAtTime(0,t+0.32);
    osc.connect(filt); filt.connect(gain); gain.connect(ac.destination);
    osc.start(t); osc.stop(t+0.36);
  } catch(e){}
}
function playWin() { [600,800,1000,1400].forEach((f,i)=>setTimeout(()=>playCatMeow(f),i*250)); }
function playLoseTone() {
  try {
    const ac=getAC(), t=ac.currentTime;
    const osc=ac.createOscillator(), gain=ac.createGain();
    osc.type="sawtooth"; osc.frequency.setValueAtTime(300,t); osc.frequency.linearRampToValueAtTime(150,t+0.4);
    gain.gain.setValueAtTime(0.15,t); gain.gain.linearRampToValueAtTime(0,t+0.4);
    osc.connect(gain); gain.connect(ac.destination); osc.start(t); osc.stop(t+0.45);
  } catch(e){}
}
let jazzInterval = null;
function startJazz() {
  try {
    const ac = getAC();
    const chords = [
      [261,329,392,493],[294,370,440,523],[329,415,493,587],[261,329,392,523],
      [294,349,440,587],[261,329,415,523],[246,311,392,493],[261,329,392,523],
    ];
    const beatDur = 1.7;
    function scheduleChords(startT) {
      chords.forEach((chord,ci)=>{
        chord.forEach((freq,fi)=>{
          const osc=ac.createOscillator(), g=ac.createGain(), f=ac.createBiquadFilter();
          f.type="lowpass"; f.frequency.value=900;
          osc.type=fi===0?"triangle":"sine"; osc.frequency.value=freq;
          const st=startT+ci*beatDur;
          g.gain.setValueAtTime(0,st); g.gain.linearRampToValueAtTime(0.04-fi*0.007,st+0.1);
          g.gain.linearRampToValueAtTime(0.01,st+beatDur*0.8); g.gain.linearRampToValueAtTime(0,st+beatDur);
          osc.connect(f); f.connect(g); g.connect(ac.destination);
          osc.start(st); osc.stop(st+beatDur);
        });
      });
    }
    scheduleChords(ac.currentTime+0.1);
    const loopMs = beatDur*chords.length*1000-100;
    jazzInterval = setInterval(()=>scheduleChords(ac.currentTime+0.1), loopMs);
  } catch(e){}
}
function stopJazz() { if(jazzInterval){clearInterval(jazzInterval);jazzInterval=null;} }

// ── Stars ──
const STARS = Array.from({length:70},()=>({
  x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.3+0.3, b:Math.random()*Math.PI*2,
}));

function makeBlocks() {
  const arr=[];
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++)
    arr.push({
      x:START_X+c*(BLOCK_W+GAP), y:START_Y+r*(BLOCK_H+GAP),
      alive:true, sprite:SPRITES[(r*COLS+c)%SPRITES.length],
    });
  return arr;
}

// ── CSS celebration component (outside canvas) ──
function CelebScreen({ onRestart }) {
  return (
    <div style={{
      position:"relative", width: W, maxWidth:"100%",
      background:"linear-gradient(160deg,#0a001a,#1a0030,#0a0018)",
      borderRadius:14, border:"2px solid #ff44aa",
      padding:"28px 28px 24px", boxSizing:"border-box",
      fontFamily:"monospace", color:"#ffe0f0",
      overflow:"hidden",
    }}>
      <style>{`
        @keyframes floatCat{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-12px) rotate(4deg)}}
        @keyframes spinBean{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        @keyframes heartPop{0%{transform:scale(0);opacity:0}50%{transform:scale(1.3);opacity:1}100%{transform:scale(1);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes twinkle{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}
        @keyframes driftRight{0%{transform:translateX(0) translateY(0) rotate(0deg);opacity:1}100%{transform:translateX(60px) translateY(-40px) rotate(360deg);opacity:0}}
        .celeb-cat{display:inline-block;animation:floatCat 2.2s ease-in-out infinite;}
        .celeb-cat:nth-child(2){animation-delay:.4s}
        .celeb-cat:nth-child(3){animation-delay:.8s}
        .celeb-cat:nth-child(4){animation-delay:1.2s}
        .bean{display:inline-block;animation:spinBean 3s linear infinite;font-size:18px}
        .bean:nth-child(2){animation-delay:.6s}
        .bean:nth-child(3){animation-delay:1.2s}
        .heart-pop{animation:heartPop .6s cubic-bezier(.2,.8,.3,1) both}
        .fade-up{animation:fadeUp .8s ease both}
        .twinkle{animation:twinkle 1.5s ease-in-out infinite}
        .drift{position:absolute;animation:driftRight 3s ease-out infinite}
      `}</style>

      {/* floating background sparkles */}
      {[...Array(10)].map((_,i)=>(
        <div key={i} className="twinkle" style={{
          position:"absolute", left:`${8+i*9}%`, top:`${10+((i*17)%70)}%`,
          fontSize:"10px", animationDelay:`${i*0.3}s`, opacity:0.4,
          color:["#ffaacc","#fff","#ff66aa","#ffdd88","#aaffcc"][i%5],
        }}>✦</div>
      ))}

      {/* drifting mini-kisses */}
      {[...Array(4)].map((_,i)=>(
        <div key={i} className="drift" style={{
          left:`${5+i*22}%`, top:`${60+i*8}%`,
          fontSize:"11px", animationDelay:`${i*0.8}s`, animationDuration:`${2.5+i*0.4}s`,
        }}>💋</div>
      ))}

      {/* Cat parade */}
      <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:18}}>
        {["🐱","😸","🐾","😻","🐈"].map((c,i)=>(
          <span key={i} className="celeb-cat" style={{
            fontSize:i===2?"28px":"22px",
            animationDelay:`${i*0.25}s`,
          }}>{c}</span>
        ))}
      </div>

      {/* Coffee beans row */}
      <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:22,alignItems:"center"}}>
        {["☕","🫘","☕","🫘","☕"].map((c,i)=>(
          <span key={i} className="bean" style={{
            fontSize:i%2===0?"20px":"16px",
            animationDelay:`${i*0.4}s`,
            animationDuration:i%2===0?"3s":"2.2s",
          }}>{c}</span>
        ))}
      </div>

      {/* Main message */}
      <div className="fade-up" style={{
        background:"#1a0028", border:"1px solid #ff66aa44",
        borderRadius:10, padding:"18px 20px", marginBottom:18,
        lineHeight:1.85, fontSize:13, textAlign:"left",
      }}>
        <div style={{color:"#ff99cc",fontWeight:"bold",fontSize:14,marginBottom:10,textAlign:"center"}}>
          💌 Un mensaje de Toñito 💌
        </div>
        <p style={{margin:"0 0 10px",color:"#ffe8f4"}}>
          Hola papá, soy Toñito si llegaste hasta aquí es porque conseguiste romper todos los gatitos, ¡nunca dudé de ti! Mamá programó este pequeño mini-juego
          que aunque sencillo, está hecho con mucho amor y esfuerzo,
          esperando que te guste muchísimo.
        </p>
        <p style={{margin:"0 0 10px",color:"#ffe8f4"}}>
          Y ambos estamos enormemente orgullosos de ti y todo lo que
          haces por mantenernos felices y amados.
        </p>
        <p style={{margin:"0 0 10px",color:"#ffe8f4"}}>
          Eres el hombre más fuerte y capaz, según mi mami, aunque yo
          pienso lo mismo aunque a veces me dejes paticas arriba y no
          me pueda levantar.
        </p>
        <p style={{margin:0,color:"#ffddee"}}>
          Te amamos muchísimo y estamos seguros de que no nos pudo
          haber tocado un mejor papi y esposo! 🐾
        </p>
      </div>

      {/* Anniversary banner */}
      <div className="fade-up" style={{
        animationDelay:".4s",
        background:"linear-gradient(135deg,#2a0040,#1a0028)",
        border:"2px solid #ff44aa",
        borderRadius:12, padding:"16px 20px",
        textAlign:"center", marginBottom:18,
        position:"relative", overflow:"hidden",
      }}>
        {/* mini cats + beans decorating the banner */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:14}}>🐱☕🐱</span>
          <span style={{fontSize:14}}>🐱☕🐱</span>
        </div>
        <div style={{
          fontFamily:"monospace", fontSize:22, fontWeight:"bold",
          color:"#ff99cc", letterSpacing:2, lineHeight:1.3,
          textShadow:"0 0 20px #ff44aa88",
        }}>
          💕 Felices 4 años 💕
        </div>
        <div style={{
          fontFamily:"monospace", fontSize:14, color:"#ffaacc",
          letterSpacing:3, marginTop:4,
        }}>
          de casados
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
          <span style={{fontSize:14}}>☕🐾☕</span>
          <span style={{fontSize:14}}>☕🐾☕</span>
        </div>

        {/* Corner hearts */}
        {[[0,0],[1,0],[0,1],[1,1]].map(([c,r],i)=>(
          <div key={i} className="heart-pop" style={{
            position:"absolute", [c?"right":"left"]:8, [r?"bottom":"top"]:8,
            fontSize:12, animationDelay:`${0.2+i*0.15}s`,
          }}>💗</div>
        ))}
      </div>

      {/* Cat + bean footer */}
      <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        {["🐱","🫘","😸","☕","🐾","🫘","🐱","☕","😻"].map((c,i)=>(
          <span key={i} style={{
            fontSize:i===4?"20px":"15px",
            animation:`floatCat ${1.8+i*0.2}s ease-in-out infinite`,
            animationDelay:`${i*0.18}s`,
            display:"inline-block",
          }}>{c}</span>
        ))}
      </div>

      <button onClick={onRestart} style={{
        display:"block", width:"100%",
        background:"#1a0830", color:"#ffaacc",
        border:"2px solid #ff44aa", padding:"10px",
        fontSize:13, fontFamily:"monospace", cursor:"pointer",
        letterSpacing:2, borderRadius:6, transition:"all .15s",
      }}
        onMouseOver={e=>e.target.style.background="#330a55"}
        onMouseOut={e=>e.target.style.background="#1a0830"}
      >
        🔄 Jugar de nuevo
      </button>
    </div>
  );
}

export default function CatBreakout() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    phase: "idle",
    px: (W - PADDLE_W) / 2,
    bx: W/2, by:0, bdx:0, bdy:0,
    lives:3, score:0,
    blocks:[],
    particles:[],
    fallingCats:[],
    frame:0,
    mouseX: W/2,
  });
  const rafRef = useRef(null);
  const [uiPhase, setUiPhase] = useState("idle");
  const [hud, setHud] = useState({lives:3,score:0,blocks:0});
  const [msg, setMsg] = useState("");

  const spawnParticles = useCallback((x,y)=>{
    const colors=["#ff66aa","#ffaacc","#ff4488","#ffddee","#ffcc00","#ffffff"];
    for(let i=0;i<9;i++){
      const angle=(Math.PI*2/9)*i+Math.random()*0.4;
      const spd=1.8+Math.random()*2.5;
      stateRef.current.particles.push({
        x,y, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd,
        life:1, size:3+Math.random()*3,
        color:colors[Math.floor(Math.random()*colors.length)],
      });
    }
  },[]);

  const spawnFallingCat = useCallback((b)=>{
    stateRef.current.fallingCats.push({
      x: b.x + BLOCK_W/2,
      y: b.y + BLOCK_H/2,
      vx: (Math.random()-0.5)*3,
      vy: -(2+Math.random()*2),
      rot: Math.random()*Math.PI*2,
      rotV: (Math.random()-0.5)*0.18,
      scale: 0.9+Math.random()*0.3,
      life: 1.0,
      sprite: b.sprite,
    });
  },[]);

  const startGame = useCallback(()=>{
    stopJazz();
    const s=stateRef.current;
    s.phase="playing";
    s.lives=3; s.score=0;
    s.px=(W-PADDLE_W)/2;
    s.bx=W/2; s.by=370;
    const angle=-Math.PI/2+(Math.random()-0.5)*0.6;
    const spd=4.5;
    s.bdx=Math.cos(angle)*spd; s.bdy=Math.sin(angle)*spd;
    s.blocks=makeBlocks();
    s.particles=[]; s.fallingCats=[];
    s.frame=0;
    setUiPhase("playing");
    setHud({lives:3,score:0,blocks:COLS*ROWS});
    setMsg("");
    setTimeout(()=>startJazz(),50);
  },[]);

  const resetBall = useCallback((s)=>{
    s.bx=W/2; s.by=370;
    const angle=-Math.PI/2+(Math.random()-0.5)*0.5;
    const spd=4.5;
    s.bdx=Math.cos(angle)*spd; s.bdy=Math.sin(angle)*spd;
  },[]);

  useEffect(()=>{
    const canvas=canvasRef.current;
    const ctx=canvas.getContext("2d");

    function draw(){
      rafRef.current=requestAnimationFrame(draw);
      const s=stateRef.current;
      s.frame++;

      // BG
      ctx.fillStyle="#080818"; ctx.fillRect(0,0,W,H);
      STARS.forEach(st=>{
        st.b+=0.012;
        ctx.globalAlpha=0.2+Math.sin(st.b)*0.2;
        ctx.fillStyle="#ffaacc";
        ctx.beginPath(); ctx.arc(st.x,st.y,st.r,0,Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha=1;

      // ── Background woman ──
      drawWoman(ctx, s.frame);

      if(s.phase==="idle"){
        ctx.fillStyle="#ff44aa"; ctx.font="bold 22px monospace"; ctx.textAlign="center";
        ctx.fillText("🐱 CAT BREAKER 🐱",W/2,H/2-30);
        ctx.fillStyle="#ffaacc"; ctx.font="13px monospace";
        ctx.fillText("Mueve el ratón para controlar al guapetón",W/2,H/2+8);
        ctx.fillText("Rompe todos los gatitos 🐾",W/2,H/2+28);
        return;
      }

      if(s.phase==="playing"||s.phase==="dead"){
        s.px=Math.max(0,Math.min(W-PADDLE_W,s.mouseX-PADDLE_W/2));

        if(s.phase==="playing"){
          s.bx+=s.bdx; s.by+=s.bdy;
          if(s.bx-BALL_R<0){s.bx=BALL_R;s.bdx=Math.abs(s.bdx);}
          if(s.bx+BALL_R>W){s.bx=W-BALL_R;s.bdx=-Math.abs(s.bdx);}
          if(s.by-BALL_R<0){s.by=BALL_R;s.bdy=Math.abs(s.bdy);}

          // paddle bounce
          if(s.bdy>0&&s.by+BALL_R>=PADDLE_Y&&s.by+BALL_R<=PADDLE_Y+14&&
             s.bx>=s.px-2&&s.bx<=s.px+PADDLE_W+2){
            const rel=(s.bx-(s.px+PADDLE_W/2))/(PADDLE_W/2);
            const ang=rel*0.35*Math.PI-Math.PI/2;
            const spd=Math.hypot(s.bdx,s.bdy);
            s.bdx=Math.cos(ang)*spd; s.bdy=Math.sin(ang)*spd;
            s.by=PADDLE_Y-BALL_R;
          }

          // block collision
          let hit=false;
          s.blocks.forEach(b=>{
            if(!b.alive||hit) return;
            if(s.bx+BALL_R>b.x&&s.bx-BALL_R<b.x+BLOCK_W&&
               s.by+BALL_R>b.y&&s.by-BALL_R<b.y+BLOCK_H){
              b.alive=false; hit=true; s.score+=10;
              const freqs=[360,420,480,520,380,440];
              playCatMeow(freqs[Math.floor(Math.random()*freqs.length)]);
              spawnParticles(b.x+BLOCK_W/2, b.y+BLOCK_H/2);
              spawnFallingCat(b);
              s.bdy=(s.by<b.y+BLOCK_H/2)?-Math.abs(s.bdy):Math.abs(s.bdy);
              const alive=s.blocks.filter(b2=>b2.alive).length;
              setHud({lives:s.lives,score:s.score,blocks:alive});
              if(alive===0){
                s.phase="celeb"; stopJazz(); playWin();
                setUiPhase("celeb"); setMsg("");
              }
            }
          });

          if(s.by>H+20){
            s.lives--; playLoseTone();
            setHud(h=>({...h,lives:s.lives}));
            if(s.lives<=0){
              s.phase="dead"; stopJazz(); setUiPhase("dead"); setMsg("Game Over");
            } else {
              resetBall(s);
              setMsg(`¡Vida perdida! ${s.lives} restantes`);
              setTimeout(()=>setMsg(""),2000);
            }
          }
        }

        // particles
        s.particles=s.particles.filter(p=>{
          p.x+=p.vx; p.y+=p.vy; p.vy+=0.09; p.life-=0.032; return p.life>0;
        });
        // falling cats
        s.fallingCats=s.fallingCats.filter(fc=>{
          fc.x+=fc.vx; fc.y+=fc.vy; fc.vy+=0.18;
          fc.rot+=fc.rotV; fc.life-=0.012;
          return fc.life>0 && fc.y<H+40;
        });

        s.blocks.forEach(b=>{ if(b.alive) drawBlock(ctx,b); });
        s.fallingCats.forEach(fc=>drawFallingCat(ctx,fc));
        drawRocker(ctx, s.px, PADDLE_Y-20);
        if(s.phase==="playing") drawBall(ctx,s.bx,s.by);
        s.particles.forEach(p=>{
          ctx.globalAlpha=p.life; ctx.fillStyle=p.color;
          ctx.fillRect(p.x,p.y,p.size,p.size);
        });
        ctx.globalAlpha=1;
      }

      if(s.phase==="celeb"){
        s.particles=s.particles.filter(p=>{
          p.x+=p.vx; p.y+=p.vy; p.vy+=0.06; p.life-=0.022; return p.life>0;
        });
        if(s.frame%14===0) spawnParticles(60+Math.random()*(W-120),60+Math.random()*(H-200));
        ctx.fillStyle="#0a001888"; ctx.fillRect(0,0,W,H);
        drawCelebCat(ctx,s.frame);
        s.particles.forEach(p=>{
          ctx.globalAlpha=p.life; ctx.fillStyle=p.color;
          ctx.fillRect(p.x,p.y,p.size,p.size);
        });
        ctx.globalAlpha=1;
      }

      ctx.strokeStyle="#ff44aa33"; ctx.lineWidth=2;
      ctx.strokeRect(1,1,W-2,H-2);
    }

    draw();
    return ()=>{ cancelAnimationFrame(rafRef.current); stopJazz(); };
  },[spawnParticles,spawnFallingCat,resetBall]);

  useEffect(()=>{
    const canvas=canvasRef.current;
    const onMove=(clientX)=>{
      const rect=canvas.getBoundingClientRect();
      stateRef.current.mouseX=(clientX-rect.left)*(W/rect.width);
    };
    const onMouse=e=>onMove(e.clientX);
    const onTouch=e=>{ e.preventDefault(); onMove(e.touches[0].clientX); };
    canvas.addEventListener("mousemove",onMouse);
    canvas.addEventListener("touchmove",onTouch,{passive:false});
    return ()=>{
      canvas.removeEventListener("mousemove",onMouse);
      canvas.removeEventListener("touchmove",onTouch);
    };
  },[]);

  return (
    <div style={{
      display:"flex",flexDirection:"column",alignItems:"center",
      background:"#080818",minHeight:"100vh",padding:"16px 0 32px",
      fontFamily:"monospace",
    }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .hud{display:flex;gap:28px;color:#ffaacc;font-size:13px;letter-spacing:2px;margin-bottom:8px;}
        .hud span{background:#14082a;border:1px solid #ff44aa44;padding:4px 14px;border-radius:4px;}
        .msg{color:#ff88bb;font-size:12px;margin-top:6px;letter-spacing:1px;min-height:18px;text-align:center;}
        .btn{margin-top:10px;background:#1a0830;color:#ffaacc;border:2px solid #ff44aa;padding:10px 32px;font-size:14px;font-family:monospace;cursor:pointer;letter-spacing:2px;border-radius:6px;transition:all .15s;}
        .btn:hover{background:#330a55;transform:scale(1.04);}
        canvas{cursor:none;display:block;}
      `}</style>

      <div className="hud">
        <span>VIDAS: {hud.lives}</span>
        <span>BLOQUES: {hud.blocks}</span>
        <span>PUNTOS: {hud.score}</span>
      </div>

      <canvas ref={canvasRef} width={W} height={H}
        style={{imageRendering:"pixelated",maxWidth:"100%",borderRadius:4}}
      />

      <div className="msg">{msg}</div>

      {(uiPhase==="idle"||uiPhase==="dead")&&(
        <button className="btn" onClick={startGame}>
          {uiPhase==="dead"?"🔄 REINICIAR":"▶ INICIAR JUEGO"}
        </button>
      )}

      {uiPhase==="celeb"&&(
        <div style={{marginTop:16,width:W,maxWidth:"100%"}}>
          <CelebScreen onRestart={startGame}/>
        </div>
      )}
    </div>
  );