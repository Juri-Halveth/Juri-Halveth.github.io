/* SPDX-License-Identifier: MIT. Original HALVETH motion renderer. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.JurisMotion = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DURATION = 20;
  const TAU = Math.PI * 2;
  const chapters = [
    {time:0, de:'Impuls', en:'Impulse'}, {time:3.3, de:'Wachsen', en:'Grow'},
    {time:7, de:'Verbinden', en:'Connect'}, {time:11, de:'Verwandeln', en:'Transform'},
    {time:15, de:'Weiterfließen', en:'Flow'}
  ];
  const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v));
  function finite(v, name) { if (!Number.isFinite(v)) throw new TypeError('Finite '+name+' required'); return v; }
  function smoother(v) { v=clamp(v); return v*v*v*(v*(v*6-15)+10); }
  function phase(t, start, end) { return smoother((t-start)/(end-start)); }
  function stateAt(time, options={}) {
    finite(time, 'time');
    if (time<0 || time>DURATION) throw new RangeError('Time outside composition');
    const glow = options.glow === undefined ? 1 : finite(options.glow, 'glow');
    if(glow<0 || glow>2) throw new RangeError('Glow outside 0..2');
    const grow = phase(time,.2,4.8);
    const connect = phase(time,5.5,9.5);
    const morph = .5-.5*Math.cos(TAU*phase(time,10,16));
    const breathe = 1+.027*Math.sin(time*1.3);
    return {time, glow, grow, connect, morph, breathe,
      radius:(16+155*grow)*breathe, rotation:time*.16,
      energy:.55+.45*Math.sin(time*.7)**2,
      chapter:chapters.reduce((n,c,i)=>time>=c.time?i:n,0)};
  }
  function advance(time, elapsed, speed, loop) {
    stateAt(time); finite(elapsed,'elapsed'); finite(speed,'speed');
    if(elapsed<0) throw new RangeError('Elapsed time must be positive');
    const raw=time+elapsed*speed;
    if(loop) return {time:((raw%DURATION)+DURATION)%DURATION, ended:false};
    return {time:clamp(raw,0,DURATION), ended:raw<0 || raw>DURATION};
  }
  function path3(u, v, s) {
    const radial=1+.042*Math.sin(3*u+2*v-s.time*.65)+s.morph*.065*Math.cos(5*u-3*v+s.time*.3);
    const x=Math.cos(v)*Math.cos(u)*radial, y=Math.sin(v)*radial, z=Math.cos(v)*Math.sin(u)*radial;
    const c=Math.cos(s.rotation), q=Math.sin(s.rotation);
    return {x:x*c+z*q, y:y+.04*Math.sin(2*u+s.time*.4)*Math.cos(v), z:z*c-x*q};
  }
  function project(p,cx,cy,scale) {
    const f=3.8/(3.8+p.z);
    return {x:cx+p.x*scale*f,y:cy+p.y*scale*f,z:p.z};
  }
  function trail(ctx, pts, colour, width, blur=0) {
    if(pts.length<2) return;
    ctx.save(); ctx.strokeStyle=colour; ctx.lineWidth=width;
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.shadowColor=colour; ctx.shadowBlur=blur;
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y);
    ctx.stroke(); ctx.restore();
  }
  function glowPoint(ctx,x,y,r,intensity) {
    if(intensity>0) {
      const g=ctx.createRadialGradient(x,y,0,x,y,r*7);
      g.addColorStop(0,'rgba(255,203,153,'+clamp(intensity*.58)+')');
      g.addColorStop(.14,'rgba(255,110,37,'+clamp(intensity*.27)+')');
      g.addColorStop(.48,'rgba(239,77,21,'+clamp(intensity*.075)+')'); g.addColorStop(1,'rgba(239,77,21,0)');
      ctx.fillStyle=g; ctx.fillRect(x-r*7,y-r*7,r*14,r*14);
    }
    ctx.beginPath(); ctx.arc(x,y,r*.45,0,TAU);ctx.fillStyle='#ffe3c2';ctx.fill();
  }
  function render(ctx, width, height, time, options={}) {
    const s=stateAt(time,options), language=options.language==='en'?'en':'de';
    finite(width,'width'); finite(height,'height');
    if(width<=0 || height<=0) throw new RangeError('Positive render dimensions required');
    ctx.save(); ctx.setTransform(width/1280,0,0,height/720,0,0);
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.shadowBlur=0;
    ctx.fillStyle='#0a0c0e';ctx.fillRect(0,0,1280,720);
    const back=ctx.createRadialGradient(970,335,0,970,335,530);
    back.addColorStop(0,'#1b1411');back.addColorStop(.58,'#111113');back.addColorStop(1,'#0a0c0e');
    ctx.fillStyle=back;ctx.fillRect(0,0,1280,720);
    // Fine, fading guides make movement readable without introducing a block world.
    const grid=1-phase(time,3.0,7.0);
    ctx.strokeStyle='rgba(232,192,167,'+(.032+.022*grid)+')';ctx.lineWidth=.65;
    for(let x=40;x<1280;x+=80){ctx.beginPath();ctx.moveTo(x,92);ctx.lineTo(x,654);ctx.stroke();}
    for(let y=92;y<655;y+=80){ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(1240,y);ctx.stroke();}
    ctx.font='12px Arial';ctx.fillStyle='#b99c87';ctx.fillText('HALVETH / LUCINET',54,52);
    ctx.textAlign='right';ctx.fillStyle='#81776e';ctx.fillText('MOTION / 001',1226,52);ctx.textAlign='left';
    const cx=935,cy=342,R=s.radius;
    const ambient=ctx.createRadialGradient(cx,cy,4,cx,cy,270);
    ambient.addColorStop(0,'rgba(255,139,64,'+(.024*s.glow)+')');
    ambient.addColorStop(.6,'rgba(255,93,28,'+(.07*s.glow*s.grow)+')');ambient.addColorStop(1,'rgba(255,80,20,0)');
    ctx.fillStyle=ambient;ctx.fillRect(cx-280,cy-280,560,560);
    // Rotating curves use a continuous 3D carrier, with depth-dependent brightness.
    for(let k=0;k<68;k++) {
      const u=k/68*TAU, pts=[]; let depth=0;
      for(let j=0;j<=64;j++) {
        const v=-1.49+j/64*2.98,p=path3(u+.13*Math.sin(v*3+s.time*.28),v,s);
        const projected=project(p,cx,cy,R);depth+=p.z;pts.push(projected);
      }
      const brightness=clamp(.21-(depth/65)*.18,.065,.45)*s.grow;
      trail(ctx,pts,'rgba(247,130,64,'+brightness+')',.68,1.2*s.glow);
    }
    for(let k=0;k<13;k++) {
      const v=-1.42+k/12*2.84,pts=[];
      for(let j=0;j<=120;j++) pts.push(project(path3(j/120*TAU,v,s),cx,cy,R));
      trail(ctx,pts,'rgba(244,161,106,'+(.11*s.grow)+')',.55,0);
    }
    // World lines connect smoothly to the carrier; path progress is evaluated at t.
    for(let k=0;k<8;k++) {
      const p=[];const seed=k*.79;
      const orbitPoint=fraction=>{
        const a=fraction*TAU, bend=.64+.09*Math.sin(2*a+seed+s.time*.21);
        return {x:cx+Math.cos(a+seed*.15)*(R+38)*bend*1.65,
                y:cy+Math.sin(a)*(R+75)*.46+Math.sin(a+seed)*(18+36*s.connect),
                z:Math.sin(a)};
      };
      for(let j=0;j<=88;j++) {
        p.push(orbitPoint(j/88));
      }
      const head=s.time*.047+k*.13;
      const tail=[];for(let j=0;j<17;j++)tail.push(orbitPoint(head-j/88));
      trail(ctx,p,'rgba(242,141,72,'+(.045+.035*s.connect)+')',.65,0);
      trail(ctx,tail,'rgba(255,161,79,'+(.09+.1*s.glow)+')',1.3,8*s.glow);
      const q=orbitPoint(head);glowPoint(ctx,q.x,q.y,2.1+s.glow, .4*s.glow);
    }
    // A moving luminous arc is evaluated analytically; its centre never jumps.
    const arcProgress=phase(s.time,5.1,8.9), arc=[];
    for(let j=0;j<Math.ceil(100*arcProgress);j++){const a=j/100;arc.push({x:580+a*190,y:477-125*Math.sin(a*Math.PI)});}
    if(arcProgress>0)arc.push({x:580+arcProgress*190,y:477-125*Math.sin(arcProgress*Math.PI)});
    trail(ctx,arc,'rgba(255,187,128,'+(.16+.37*s.connect)+')',1.0,9*s.glow);
    if(arc.length>1)glowPoint(ctx,arc.at(-1).x,arc.at(-1).y,3.8,s.glow);
    const dim=ctx.createRadialGradient(cx,cy,0,cx,cy,R*.87);
    dim.addColorStop(0,'rgba(12,12,13,.85)');dim.addColorStop(.45,'rgba(12,12,13,.30)');dim.addColorStop(1,'rgba(12,12,13,0)');
    ctx.fillStyle=dim;ctx.fillRect(cx-R,cy-R,R*2,R*2);
    // Kinetic typography is staggered by line, using smooth velocity at both ends.
    const titles=language==='en'?[['An impulse.','A whole world.'],['Form becomes','movement.'],['Keep the','flow.']]:[['Ein Impuls.','Eine ganze Welt.'],['Form wird','Bewegung.'],['Weiter','im Strom.']];
    let title=0,local=s.time;
    if(s.time>=6.5){title=1;local=s.time-6.5;} if(s.time>=13.3){title=2;local=s.time-13.3;}
    const end=title===0?6.5:title===1?6.8:20;
    const outgoing=1-phase(local,end-.65,end);
    for(let i=0;i<2;i++){
      const enter=phase(local,.15+i*.14,1.15+i*.14), alpha=enter*outgoing;
      ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=i?'#ee9d68':'#f2ece4';
      ctx.font=(i?'500 ':'600 ')+'64px Arial';ctx.fillText(titles[title][i],54,294+i*78+(1-enter)*28);ctx.restore();
    }
    const paragraph=language==='en'?'Time shapes movement. Light makes it visible.':'Zeit formt Bewegung. Licht macht sie sichtbar.';
    ctx.fillStyle='#aca29a';ctx.font='18px Arial';ctx.fillText(paragraph,57,438);
    ctx.fillStyle='#786c63';ctx.font='12px Arial';ctx.fillText(language==='en'?'AN ORIGINAL, CODE-DRIVEN COMPOSITION':'EINE EIGENE, DURCH CODE GESTALTETE KOMPOSITION',57,486);
    ctx.strokeStyle='#31251f';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(54,598);ctx.lineTo(1226,598);ctx.stroke();
    ctx.fillStyle='#fb9c56';ctx.fillRect(54,598,1172*time/DURATION,1.5);
    ctx.font='12px Arial';ctx.fillStyle='#a99685';ctx.fillText(chapters[s.chapter][language].toUpperCase(),54,626);
    ctx.textAlign='right';ctx.fillText(time.toFixed(2)+' / 20.00 s',1226,626);ctx.textAlign='left';
    ctx.restore();return s;
  }
  function artworkStateAt(time) {
    finite(time,'artwork time');
    if(time<0)throw new RangeError('Artwork time must be positive');
    return {time,glow:1.35,grow:1,connect:.7+.3*Math.sin(time*.11)**2,
      morph:.35+.3*Math.sin(time*.14),breathe:1+.028*Math.sin(time*.75),
      rotation:time*.13,energy:.6+.4*Math.sin(time*.37)**2};
  }
  // The landing artwork has its own continuous clock, isotropic geometry,
  // and no title cards, progress bars or 20-second reset.
  function renderArtwork(ctx,width,height,time) {
    const s=artworkStateAt(time);
    finite(width,'width');finite(height,'height');
    if(width<=0||height<=0)throw new RangeError('Positive render dimensions required');
    const scale=Math.min(width,height)/720,cx=width*.5,cy=height*.5,R=183*scale*s.breathe;
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;
    ctx.globalCompositeOperation='source-over';ctx.shadowBlur=0;
    ctx.fillStyle='#0b1515';ctx.fillRect(0,0,width,height);
    const halo=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(width,height)*.6);
    halo.addColorStop(0,'#352019');halo.addColorStop(.43,'#19221d');halo.addColorStop(1,'#0b1515');
    ctx.fillStyle=halo;ctx.fillRect(0,0,width,height);
    const cloud=ctx.createRadialGradient(cx,cy,R*.12,cx,cy,R*1.72);
    cloud.addColorStop(0,'rgba(255,172,107,.03)');cloud.addColorStop(.5,'rgba(236,113,49,.12)');cloud.addColorStop(1,'rgba(236,113,49,0)');
    ctx.fillStyle=cloud;ctx.fillRect(0,0,width,height);
    for(let k=0;k<68;k++){
      const u=k/68*TAU,pts=[];let depth=0;
      for(let j=0;j<=64;j++){
        const v=-1.49+j/64*2.98,p=path3(u+.13*Math.sin(v*3+s.time*.28),v,s);
        depth+=p.z;pts.push(project(p,cx,cy,R));
      }
      trail(ctx,pts,'rgba(255,152,87,'+clamp(.32-depth/65*.21,.09,.6)+')',.9*scale,2*scale);
    }
    for(let k=0;k<13;k++){
      const v=-1.42+k/12*2.84,pts=[];
      for(let j=0;j<=120;j++)pts.push(project(path3(j/120*TAU,v,s),cx,cy,R));
      trail(ctx,pts,'rgba(247,184,125,.2)',.8*scale,0);
    }
    for(let k=0;k<9;k++){
      const seed=k*.79,orbit=fraction=>{
        const a=fraction*TAU,bend=.7+.09*Math.sin(2*a+seed+s.time*.21);
        return {x:cx+Math.cos(a+seed*.15)*(R+38*scale)*bend*1.65,
          y:cy+Math.sin(a)*(R+75*scale)*.46+Math.sin(a+seed)*(18+36*s.connect)*scale};
      };
      const line=[],tail=[],head=s.time*.037+k*.13;
      for(let j=0;j<=88;j++)line.push(orbit(j/88));
      for(let j=0;j<24;j++)tail.push(orbit(head-j/110));
      trail(ctx,line,'rgba(236,161,95,.13)',.8*scale,0);
      trail(ctx,tail,'rgba(255,177,99,.42)',1.65*scale,13*scale);
      const q=orbit(head);glowPoint(ctx,q.x,q.y,3.7*scale,.9);
    }
    for(let k=0;k<26;k++){
      const a=k*2.399963+s.time*.017,r=(245+40*Math.sin(k*1.7+s.time*.13))*scale;
      const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.85;
      ctx.fillStyle='rgba(203,227,184,'+(.12+.22*Math.sin(s.time*.48+k)**2)+')';
      ctx.beginPath();ctx.arc(x,y,(.7+.45*Math.sin(k)**2)*scale,0,TAU);ctx.fill();
    }
    ctx.restore();return s;
  }
  return Object.freeze({DURATION,chapters,stateAt,advance,smoother,render,artworkStateAt,renderArtwork});
}));
