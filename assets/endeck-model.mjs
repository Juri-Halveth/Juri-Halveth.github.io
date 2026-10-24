// SPDX-License-Identifier: MIT
// Geometry retained from the accepted ENDECK 1.0 fragment.
const IDs = Object.freeze(['A','B','C','D']);
  const CORNERS = Object.freeze([[-1,-1,0],[1,-1,0],[1,1,0],[-1,1,0]].map(Object.freeze));
  const MODES = Object.freeze(['projection','shrink','merge','history']);
  function checked(mode,t,path='straight') {
    if (!MODES.includes(mode) || !Number.isFinite(t) || t<0 || t>1 || !['straight','arc'].includes(path)) throw new RangeError('Invalid bound model input');
  }
  function source(mode,t,path='straight') {
    checked(mode,t,path);
    return CORNERS.map((c,i) => {
      let x=c[0], y=c[1], z=0;
      if (mode==='projection' || mode==='shrink') {
        const scale=t===1?0:1-t;
        x=c[0]*scale; y=c[1]*scale;
        z=mode==='projection'?(i-1.5)*0.85*t:0;
      } else if (mode==='merge' && i>0) {
        const u=t>=i/3?1:Math.max(0,3*t-(i-1));
        x=u===1?CORNERS[0][0]:c[0]+u*(CORNERS[0][0]-c[0]);
        y=u===1?CORNERS[0][1]:c[1]+u*(CORNERS[0][1]-c[1]);
      } else if (mode==='history') {
        x+=-1.25+2.5*t;
        y+=path==='arc' && t!==0 && t!==1 ? Math.sin(Math.PI*t)*1.15 : 0;
      }
      return {id:IDs[i],x,y,z};
    });
  }
  function observeXY(points) { return points.map(p=>({id:p.id,x:p.x,y:p.y})); }
  function distinct(points,axes) {
    return new Set(points.map(p=>axes.map(a=>p[a]).join('|'))).size;
  }
  function project(p,tilt=0) {
    if (!p || ![p.x,p.y,p.z].every(Number.isFinite) || !Number.isFinite(tilt) || tilt<0 || tilt>80) throw new RangeError('Invalid view input');
    const a=tilt*Math.PI/180, yaw=0.42*Math.sin(a);
    const x=p.x*Math.cos(yaw)-p.y*Math.sin(yaw);
    const y=p.x*Math.sin(yaw)+p.y*Math.cos(yaw);
    return {id:p.id,x,y:y*Math.cos(a)+p.z*Math.sin(a)};
  }
export { IDs, CORNERS, MODES, source, observeXY, distinct, project };
