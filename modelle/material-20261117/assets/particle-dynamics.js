/* HALVETH moving pair 1.0: classical, dimensionless demonstration model.
 * Positions follow integrated forces; no orbit curve or slider-to-position map.
 * Wave height is a separate driven/damped 2D field, not a quantum wavefunction.
 */
(()=>{'use strict';
 const defaults=Object.freeze({attraction:1,damping:.12,frequency:5,sourceMinus:1,sourcePlus:1,fieldFeedback:.03});
 const bounds={attraction:[0,3],damping:[0,2],frequency:[0,20],sourceMinus:[0,1],sourcePlus:[0,1],fieldFeedback:[0,1]};
 const nx=96,ny=64,xmin=-3,xmax=3,ymin=-2,ymax=2,dx=(xmax-xmin)/(nx-1),dy=(ymax-ymin)/(ny-1);
 const finite=(x,name)=>{if(!Number.isFinite(x))throw new RangeError('Nonfinite '+name);return x;};
 function create(options={}){
  const seed=options.seed??20261117;if(!Number.isInteger(seed))throw new RangeError('Invalid seed');
  const initialPositions=options.initialPositions??[[-1.2,0],[1.2,0]],initialVelocities=options.initialVelocities??[[0,-.37],[0,.37]];
  const initialAngles=options.initialAngles??[0,0],initialAngularVelocities=options.initialAngularVelocities??[3,-3];
  for(const [name,pair]of Object.entries({initialAngles,initialAngularVelocities}))if(!Array.isArray(pair)||pair.length!==2||pair.some(v=>!Number.isFinite(v)))throw new RangeError('Invalid '+name);
  for(const [name,pairs]of Object.entries({initialPositions,initialVelocities})){
   if(!Array.isArray(pairs)||pairs.length!==2||pairs.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v))))throw new RangeError('Invalid '+name);
  }
  // Copy input arrays: later caller changes cannot rewrite the initial state.
  const origins=initialPositions.map(p=>p.slice()),velocities=initialVelocities.map(p=>p.slice()),angles=initialAngles.slice(),spins=initialAngularVelocities.slice();
  let bodies,u,v,nextV,time,timeCorrection,steps,events,burst,trails,parameters,status,relativeAngle,relativeAngle0,orbitalPhase;
  const validitySeparation=options.validitySeparation??.18;
  if(!Number.isFinite(validitySeparation)||validitySeparation<=0)throw new RangeError('Invalid validity separation');
  const index=(x,y)=>y*nx+x;
  function reset(){
   bodies=origins.map((p,i)=>({id:i?'PAIR_PLUS':'PAIR_MINUS',sign:i?1:-1,x:p[0],y:p[1],vx:velocities[i][0],vy:velocities[i][1],angle:angles[i],angularVelocity:spins[i],radius:.09,active:true}));
   u=new Float64Array(nx*ny);v=new Float64Array(nx*ny);nextV=new Float64Array(nx*ny);time=0;timeCorrection=0;steps=0;events=[];burst=null;
   trails=bodies.map(b=>[{x:b.x,y:b.y,time:0}]);parameters={...defaults};status='RUNNING';
   relativeAngle=relativeAngle0=Math.atan2(bodies[1].y-bodies[0].y,bodies[1].x-bodies[0].x);orbitalPhase=0;
  }
  function fieldAt(x,y){
   const fx=(x-xmin)/dx,fy=(y-ymin)/dy;if(fx<1||fy<1||fx>nx-2||fy>ny-2)return 0;
   const ix=Math.floor(fx),iy=Math.floor(fy),a=fx-ix,b=fy-iy;
   return(1-b)*((1-a)*u[index(ix,iy)]+a*u[index(ix+1,iy)])+b*((1-a)*u[index(ix,iy+1)]+a*u[index(ix+1,iy+1)]);
  }
  function inject(x,y,amount,width){
   const cx=Math.round((x-xmin)/dx),cy=Math.round((y-ymin)/dy),rx=Math.ceil(width*3/dx),ry=Math.ceil(width*3/dy);
   for(let j=Math.max(1,cy-ry);j<=Math.min(ny-2,cy+ry);j++)for(let i=Math.max(1,cx-rx);i<=Math.min(nx-2,cx+rx);i++){
    const r2=((xmin+i*dx-x)**2+(ymin+j*dy-y)**2)/(width*width);nextV[index(i,j)]+=amount*Math.exp(-r2/2);
   }
  }
  function evolveField(dt){
   nextV.fill(0);
   const c2=1.3**2;
   for(let j=1;j<ny-1;j++)for(let i=1;i<nx-1;i++){
    const k=index(i,j),lap=(u[k-1]-2*u[k]+u[k+1])/(dx*dx)+(u[k-nx]-2*u[k]+u[k+nx])/(dy*dy);
    const edge=Math.min(i,j,nx-1-i,ny-1-j),damping=.38+Math.max(0,7-edge)*.48;
    nextV[k]=v[k]+dt*(c2*lap-damping*v[k]);
   }
   for(let i=0;i<2;i++)if(bodies[i].active){
    const b=bodies[i],amplitude=i?parameters.sourcePlus:parameters.sourceMinus;
    inject(b.x,b.y,dt*amplitude*24*Math.sin(2*Math.PI*parameters.frequency*(time+dt)),.13);
   }
   for(let k=0;k<u.length;k++){v[k]=nextV[k];u[k]+=v[k]*dt;}
  }
  // First intersection of the proposed relative line segment with the validity circle.
  // The rule freezes the last valid state; it neither collides nor zeroes the bodies.
  function boundaryFraction(old){
   const rx=old[1].x-old[0].x,ry=old[1].y-old[0].y;
   const sx=(bodies[1].x-bodies[0].x)-rx,sy=(bodies[1].y-bodies[0].y)-ry;
   const A=sx*sx+sy*sy,B=2*(rx*sx+ry*sy),C=rx*rx+ry*ry-validitySeparation**2;
   if(C<=0)return 0;
   if(A===0)return null;const D=B*B-4*A*C;if(D<0)return null;
   const alpha=(-B-Math.sqrt(D))/(2*A);return alpha>=0&&alpha<=1?alpha:null;
  }
  function advancePhase(){const angle=Math.atan2(bodies[1].y-bodies[0].y,bodies[1].x-bodies[0].x);orbitalPhase+=Math.atan2(Math.sin(angle-relativeAngle),Math.cos(angle-relativeAngle));relativeAngle=angle;}
  function diagnostics(){const a=bodies[0],b=bodies[1],r=Math.hypot(b.x-a.x,b.y-a.y);
   return {model:'EXPERIMENTAL_DRIVEN_MEDIUM',status,units:'dimensionless model units',separation:r,validitySeparation,relativeAngle,orbitalPhase,orbitalTurns:orbitalPhase/(2*Math.PI),
    kineticEnergy:.5*(a.vx*a.vx+a.vy*a.vy+b.vx*b.vx+b.vy*b.vy),softenedPotential:-parameters.attraction/Math.sqrt(r*r+.12**2),
    energyContract:'externally driven damped field; no closed particle+field energy balance claimed',eventLocalization:'first linear-segment boundary root inside substep; refinement tested',
    validity:'experiment ends at chosen finite separation; no collision, fusion, mass creation or relativistic horizon model'};}
  function step(dt,values={}){
   finite(dt,'time step');if(dt<=0||dt>1/30)throw new RangeError('Time step must be in (0,1/30]');
   for(const [key,value]of Object.entries(values)){
    if(!Object.hasOwn(bounds,key)||!Number.isFinite(value)||value<bounds[key][0]||value>bounds[key][1])throw new RangeError('Invalid particle parameter: '+key);
   }
   if(status!=='RUNNING')return {status,time,diagnostics:diagnostics()};
   parameters={...parameters,...values};
   const count=Math.ceil(dt/(1/180)),h=dt/count;
   for(let tick=0;tick<count;tick++){
    const old=bodies.map(b=>({...b}));
    if(bodies[0].active){
     const a=bodies[0],b=bodies[1],rx=b.x-a.x,ry=b.y-a.y,den=(rx*rx+ry*ry+.12**2)**1.5;
     const fx=parameters.attraction*rx/den,fy=parameters.attraction*ry/den;
     bodies.forEach((body,i)=>{
      const direction=i?-1:1,gradX=(fieldAt(body.x+dx,body.y)-fieldAt(body.x-dx,body.y))/(2*dx),gradY=(fieldAt(body.x,body.y+dy)-fieldAt(body.x,body.y-dy))/(2*dy);
      const ax=direction*fx-parameters.damping*body.vx-parameters.fieldFeedback*gradX;
      const ay=direction*fy-parameters.damping*body.vy-parameters.fieldFeedback*gradY;
      body.vx+=ax*h;body.vy+=ay*h;body.x+=body.vx*h;body.y+=body.vy*h;
      // Spin is an independent unwrapped coordinate; it never sets x/y.
      body.angularVelocity*=Math.exp(-parameters.damping*.15*h);body.angle+=body.angularVelocity*h;
     });
    }
    const alpha=boundaryFraction(old),accepted=alpha===null?h:h*alpha;
    if(alpha!==null)for(let i=0;i<bodies.length;i++)for(const key of ['x','y','vx','vy','angle','angularVelocity'])bodies[i][key]=old[i][key]+alpha*(bodies[i][key]-old[i][key]);
    const increment=accepted-timeCorrection,nextTime=time+increment;timeCorrection=(nextTime-time)-increment;time=nextTime;
    if(accepted>0)evolveField(accepted);advancePhase();
    if(alpha!==null){status='MODEL_LIMIT';events.push({id:'PAIR_LIMIT_001',type:'MODEL_VALIDITY_LIMIT',time,reason:'chosen finite validity separation reached; collision physics absent',separation:Math.hypot(bodies[1].x-bodies[0].x,bodies[1].y-bodies[0].y),sourceIds:bodies.map(b=>b.id)});break;}
   }
   steps++;
   if(steps%3===0||status!=='RUNNING')for(let i=0;i<2;i++){trails[i].push({x:bodies[i].x,y:bodies[i].y,time});if(trails[i].length>220)trails[i].shift();}
   return {status,time,diagnostics:diagnostics()};
  }
  function snapshot({field=true}={}){
   const state={status,diagnostics:diagnostics(),orbitalPhase,orbitalTurns:orbitalPhase/(2*Math.PI),schema:'halveth.moving-pair/1.1.0',seed,time,steps,bodies:bodies.map(b=>({...b})),trails:trails.map(t=>t.map(p=>({...p}))),events:events.map(e=>({...e,sourceIds:e.sourceIds.slice()})),burst:burst?{...burst}:null,parameters:{...parameters}};
   if(field)state.field={nx,ny,xmin,xmax,ymin,ymax,values:Array.from(u),velocity:Array.from(v)};
   return state;
  }
  reset();return Object.freeze({step,reset,snapshot,diagnostics});
 }
 globalThis.HALVETHParticles=Object.freeze({create,defaults});
})();
