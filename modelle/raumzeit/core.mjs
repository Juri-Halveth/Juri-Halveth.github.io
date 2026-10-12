const TAU=Math.PI*2;

export const SCENE_IDS=Object.freeze([
  'erste-regel',
  'wellenfeld',
  'dimensionen',
  'schichten',
  'strudel-3d',
  'strudel-2d',
  'zwischenraum',
  'beobachterraum'
]);

export const SCENES=Object.freeze([
  {id:'erste-regel',index:'01',title:'Erste Regel · Plus / Minus',kind:'Gegenphasen · Beziehung',summary:'Zwei Wege werden erst getrennt gezeigt und bilden durch Kopplung eine sichtbare Mitte.',formula:'Δ = Beziehung(−, +)'},
  {id:'wellenfeld',index:'02',title:'Wellenfeld · erster Kontakt',kind:'Phase · Kontakt · Ruhe',summary:'Mehrere Wellen laufen aufeinander zu, begegnen sich und finden in eine gemeinsame Schwingung.',formula:'W(t) = Σ Phaseᵢ(t)'},
  {id:'dimensionen',index:'03',title:'Dimensionen · Layer-Live-Modell',kind:'Zeit · Drehung · Zoom',summary:'Ebenen werden als unabhängige Blickachsen einer navigierbaren Darstellung gehalten.',formula:'R(n) = (Sₙ, Ansichtₙ)'},
  {id:'schichten',index:'04',title:'Schichten · Zwischenräume',kind:'Zustand · Übergang · Dichte',summary:'Horizonte und die Räume dazwischen bleiben getrennt lesbar, statt in einer Linie zu verschwinden.',formula:'Sₙ → Δₙ → Sₙ₊₁'},
  {id:'strudel-3d',index:'05',title:'Strudel · räumliche Projektion',kind:'Tiefe · Richtung · Projektion',summary:'Eine perspektivische Spirale macht Tiefe als Darstellungsrelation erkundbar.',formula:'P₃→₂(x, y, z)'},
  {id:'strudel-2d',index:'06',title:'Strudel · Zeitbahn',kind:'Station · Reihenfolge · Rückweg',summary:'Eine Zeitbahn verbindet Stationen und bewahrt zugleich sichtbare offene Übergänge.',formula:'τ = (E₀, E₁, …, Eₙ)'},
  {id:'zwischenraum',index:'07',title:'Zwischenraum · Teilung',kind:'Teilung · Rest · Tiefe',summary:'Jede Teilung schafft weitere adressierbare Zwischenräume im selben begrenzten Rahmen.',formula:'dₙ = L / 2ⁿ'},
  {id:'beobachterraum',index:'08',title:'Beobachterraum',kind:'Quelle · Blick · Ausschnitt',summary:'Eine Sichtfläche hält Quelle, Blickrichtung und den sichtbaren Ausschnitt als getrennte Größen.',formula:'O = f(Quelle, Ansicht, Ausschnitt)'}
]);

const SCENE_BY_ID=new Map(SCENES.map(scene=>[scene.id,scene]));

export function getScene(id){
  const scene=SCENE_BY_ID.get(id);
  if(!scene)throw new RangeError('Unknown state-atlas scene: '+id);
  return scene;
}

export function clamp(value,min=0,max=1){
  if(!Number.isFinite(value))throw new TypeError('Expected finite scalar');
  return Math.min(max,Math.max(min,value));
}

export function phaseAt(milliseconds,period=12000){
  if(!Number.isFinite(milliseconds)||!Number.isFinite(period)||period<=0)throw new TypeError('Expected finite positive period');
  return ((milliseconds%period)+period)%period/period;
}

export function subdivision(depth){
  if(!Number.isSafeInteger(depth)||depth<0||depth>16)throw new RangeError('Depth must be an integer from 0 to 16');
  const count=2**depth;
  return Array.from({length:count},(_,index)=>({start:index/count,end:(index+1)/count,depth}));
}

const point=(x,y)=>({x:clamp(x,-.35,1.35),y:clamp(y,-.35,1.35)});
const path=(count,fn)=>Array.from({length:count},(_,index)=>fn(index/(count-1),index));
const line=(points,color,width=1.5,alpha=1)=>({points,color,width,alpha});
const dot=(x,y,r,color,alpha=1)=>({x:clamp(x,-.35,1.35),y:clamp(y,-.35,1.35),r,color,alpha});
const ring=(x,y,r,color,width=1,alpha=.5)=>({x:clamp(x,-.35,1.35),y:clamp(y,-.35,1.35),r,color,width,alpha});

function firstRule(t){
  const coupling=.18+.72*(.5+.5*Math.sin(t*TAU));
  const left=path(64,x=>point(x*.5,.5+Math.sin((x*7+t*2)*Math.PI)*(.12*(1-x)+.015)));
  const right=path(64,x=>point(.5+x*.5,.5-Math.sin((x*7+t*2)*Math.PI)*(.12*x+.015)));
  return {lines:[line(left,'#8b7bd0',2),line(right,'#f0b46b',2)],rings:[ring(.5,.5,.08+coupling*.07,'#f4efa8',1,.65),ring(.5,.5,.17+coupling*.1,'#9de1cf',1,.26)],dots:[dot(.18,.5,7,'#8b7bd0'),dot(.82,.5,7,'#f0b46b'),dot(.5,.5,5+coupling*7,'#ecf4bd')]};
}

function waveField(t){
  const lines=Array.from({length:6},(_,row)=>{
    const center=(row+1)/7,damping=.35+.65*Math.abs(.5-t);
    return line(path(96,x=>{
      const local=Math.sin((x*3.5+t*1.6+row*.17)*TAU);
      const pulse=Math.exp(-((x-.5)**2)*17);
      return point(x,center+local*.04*damping+pulse*Math.sin((t+row*.05)*TAU)*.055);
    }),['#75d3cf','#9a80d3','#f0bd71'][row%3],1.2,.74);
  });
  const dots=Array.from({length:16},(_,index)=>{
    const direction=index%2?1:-1,x=.5+direction*(.39-((t+index*.07)%1)*.28),y=.18+(index%6)*.12+Math.sin((t+index*.11)*TAU)*.022;
    return dot(x,y,2.4,['#75d3cf','#9a80d3','#f0bd71'][index%3],.8);
  });
  return {lines,rings:[ring(.5,.5,.11,'#e9e6b8',1,.34)],dots};
}

function dimensions(t){
  const rings=Array.from({length:5},(_,index)=>ring(.5,.5,.12+index*.085,['#94dfcf','#8974c9','#edc170'][index%3],1.2,.36));
  const dots=Array.from({length:12},(_,index)=>{
    const angle=t*TAU*(.32+index%3*.12)+index/12*TAU,radius=.14+(index%4)*.075;
    return dot(.5+Math.cos(angle)*radius,.5+Math.sin(angle)*radius*.58,3+(index%3),'#f6f2c7',.82);
  });
  const lines=Array.from({length:3},(_,index)=>line(path(34,x=>{
    const angle=t*TAU*(.22+index*.1)+x*TAU;
    return point(.5+Math.cos(angle)*(.14+index*.08),.5+Math.sin(angle)*(.1+index*.045));
  }),['#94dfcf','#8974c9','#edc170'][index],1.4,.6));
  return {lines,rings,dots};
}

function layers(t){
  const lines=Array.from({length:7},(_,index)=>{
    const base=.16+index*.115;
    return line(path(92,x=>point(x,base+Math.sin((x*2.4+t*.6+index*.12)*TAU)*(.009+index*.004))),['#89d2c5','#d9a96c','#9b85cf'][index%3],1.6,.77);
  });
  const dots=Array.from({length:7},(_,index)=>dot(.12+((t*.24+index*.127)%1)*.75,.16+index*.115,3.5,['#89d2c5','#d9a96c','#9b85cf'][index%3],.95));
  return {lines,rings:[ring(.5,.5,.41,'#e7edbd',1,.18)],dots};
}

function spatialVortex(t){
  const turn=t*TAU*.28,lines=[];
  for(let spiral=0;spiral<4;spiral+=1){
    lines.push(line(path(110,(_,index)=>{
      const p=index/109,radius=.03+p*.39,angle=turn+spiral*TAU/4+p*TAU*2.45,depth=.52+p*.38;
      return point(.5+Math.cos(angle)*radius,.54+Math.sin(angle)*radius*.56-(depth-.7)*.18);
    }),['#9a82db','#86d5c5','#efbc70','#e9ebbd'][spiral],1.45,.78));
  }
  const dots=Array.from({length:16},(_,index)=>{
    const p=index/15,angle=turn+p*TAU*2.45,radius=.04+p*.38;
    return dot(.5+Math.cos(angle)*radius,.54+Math.sin(angle)*radius*.56-(p-.5)*.08,2.4+p*3,['#9a82db','#86d5c5','#efbc70'][index%3],.9);
  });
  return {lines,rings:[ring(.5,.54,.42,'#e8edbe',1,.2)],dots};
}

function timeVortex(t){
  const lines=[line(path(150,(_,index)=>{
    const p=index/149,angle=-Math.PI/2+p*TAU*3.7+t*TAU*.18,radius=.04+p*.4;
    return point(.5+Math.cos(angle)*radius,.5+Math.sin(angle)*radius*.75);
  }),'#e7e9bd',2,.9)];
  const dots=Array.from({length:9},(_,index)=>{
    const p=(index+1)/10,angle=-Math.PI/2+p*TAU*3.7+t*TAU*.18,radius=.04+p*.4;
    return dot(.5+Math.cos(angle)*radius,.5+Math.sin(angle)*radius*.75,4,'#8ed6c6',.92);
  });
  return {lines,rings:[ring(.5,.5,.1,'#9b84cd',1.3,.6),ring(.5,.5,.31,'#eebd75',1,.3)],dots};
}

function interspace(t){
  const divisions=subdivision(5);
  const lines=divisions.map((segment,index)=>line([point(segment.start,.16),point(segment.start,.84)],index%2?'#8ed5c5':'#d6b36d',index%8===0?1.7:.8,index%8===0?.94:.45));
  const dots=divisions.filter((_,index)=>index%4===0).map((segment,index)=>dot((segment.start+segment.end)/2,.5+Math.sin((t+index*.12)*TAU)*.07,2.8,'#e7e9bd',.9));
  return {lines,rings:[ring(.5,.5,.34,'#9b84cd',1,.26)],dots};
}

function observerSpace(t){
  const source=point(.18,.64),gaze=point(.72,.36);
  const rays=Array.from({length:9},(_,index)=>{
    const offset=(index-4)*.055;
    return line([source,point(gaze.x+offset*.35,gaze.y+offset)],'#8dd5c7',index===4?2.1:1,index===4?.95:.34);
  });
  const rings=[ring(source.x,source.y,.055,'#eabf75',1.5,.86),ring(gaze.x,gaze.y,.08,'#9a84d4',1.4,.6),ring(gaze.x,gaze.y,.19+Math.sin(t*TAU)*.015,'#e7eabc',1,.25)];
  return {lines:rays,rings,dots:[dot(source.x,source.y,5,'#f0bf71'),dot(gaze.x,gaze.y,4,'#98decf')]};
}

const BUILDERS=Object.freeze({'erste-regel':firstRule,wellenfeld:waveField,dimensionen:dimensions,schichten:layers,'strudel-3d':spatialVortex,'strudel-2d':timeVortex,zwischenraum:interspace,beobachterraum:observerSpace});

export function frameFor(id,milliseconds=0){
  const scene=getScene(id),time=phaseAt(milliseconds),frame=BUILDERS[id](time);
  return {scene,time,...frame};
}
