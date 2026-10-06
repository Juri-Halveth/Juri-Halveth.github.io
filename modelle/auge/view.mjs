import {ray, paraxialFocus, temporal} from './model.mjs';

  (() => {
    const root = document.getElementById('eye-time-lab');
    const ids = ['radius', 'retina', 'delta', 'correction', 'pupil', 'moment', 'delay', 'gain', 'motion'];
    const el = id => root.querySelector('#' + id);
    const value = id => id === 'motion' ? el(id).value : Number(el(id).value);
    const roundedZero = (v,digits) => Math.abs(v)<0.5*Math.pow(10,-digits) ? 0 : v;
    const number = (v, digits = 2) => roundedZero(v,digits).toLocaleString('de-DE', {minimumFractionDigits: digits, maximumFractionDigits: digits});
    const signed = (v, digits = 2) => (roundedZero(v,digits) > 0 ? '+' : '') + number(v, digits);
    const ns = 'http://www.w3.org/2000/svg';
    function add(svg, tag, attrs, text) {
      const node = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
      if (text !== undefined) node.textContent = text;
      svg.append(node); return node;
    }
    const line = (svg, x1, y1, x2, y2, attrs = {}) => add(svg, 'line', {x1,y1,x2,y2,stroke:'var(--border)','stroke-width':1,...attrs});
    function drawEye() {
      const svg = el('eye-drawing'), width = svg.getBoundingClientRect().width;
      if (!width) return;
      svg.replaceChildren(); svg.setAttribute('viewBox', `0 0 ${width} 265`);
      const r = value('radius'), length = value('retina'), d = value('delta'), c = value('correction'), p = value('pupil');
      const foci = [paraxialFocus(r,c), paraxialFocus(r+d,c)];
      const upperX = Math.max(32, ...foci) + 2;
      const sx = x => 16 + (x + 8) / (upperX + 8) * (width - 32);
      const sy = y => 133 - y * 19;
      add(svg, 'title', {}, 'Brechung an einer Ersatzfläche, mit paraxialen Fokuspunkten A und B');
      line(svg, sx(-8), sy(0), sx(upperX), sy(0));
      line(svg, sx(length), 48, sx(length), 218, {stroke:'var(--foreground)','stroke-width':2});
      add(svg, 'text', {x:sx(length),y:32,'text-anchor':'middle'}, 'Netzhaut');
      line(svg, sx(-3), 67, sx(-3), 199, {stroke:'var(--muted-foreground)','stroke-width':2});
      add(svg,'text',{x:16,y:251}, `Glas ${signed(c,1)} dpt`);
      add(svg,'text',{x:width-16,y:251,'text-anchor':'end'}, 'Längsrichtung →');
      const samples = [-1,-0.75,-0.5,-0.25,0,0.25,0.5,0.75,1].map(a => a*p/2);
      const footprints=[];
      [r,r+d].forEach((radius,k) => {
        const color = `var(--viz-series-${k+1})`, dash = k ? '6 4' : '';
        const heights=samples.map(h=>ray(radius,h,c).at(length));
        footprints.push(Math.max(...heights)-Math.min(...heights));
        const surface = Array.from({length:81},(_,i)=>{
          const y=-3.5+7*i/80, x=radius-Math.sqrt(radius*radius-y*y);
          return `${i?'L':'M'}${sx(x)},${sy(y)}`;
        }).join(' ');
        add(svg,'path',{d:surface,fill:'none',stroke:color,'stroke-width':2,'stroke-dasharray':dash});
        samples.forEach(h => {
          const q=ray(radius,h,c), retinaY=q.at(length);
          add(svg,'path',{d:`M${sx(-8)},${sy(h)} L${sx(-3)},${sy(h)} L${sx(q.x)},${sy(q.y)} L${sx(length)},${sy(retinaY)}`,fill:'none',stroke:color,'stroke-width':1.2,'stroke-dasharray':dash,opacity:0.7});
        });
        const fx=sx(foci[k]), fy=sy(0);
        if(k===0) add(svg,'circle',{cx:fx,cy:fy,r:4,fill:color});
        else add(svg,'rect',{x:fx-3.5,y:fy-3.5,width:7,height:7,fill:color});
        line(svg,fx,fy+(k?8:-8),fx,k?204:61,{stroke:color});
        add(svg,'text',{x:fx,y:k?220:55,'text-anchor':'middle'},k?'Fokus B':'Fokus A');
      });
      el('eye-result').textContent=`Fokus zur Netzhaut: A ${signed(foci[0]-length)} mm · B ${signed(foci[1]-length)} mm`;
      el('eye-width').textContent=`Strahlenbreite auf Netzhaut: A ${number(footprints[0],3)} mm · B ${number(footprints[1],3)} mm`;
      add(svg,'desc',{},`Positive Fokusabweichung: hinter der Netzhaut, negative: davor. Geometrische Strahlenbreite auf der Netzhaut: A ${number(footprints[0],3)} mm und B ${number(footprints[1],3)} mm. Die Höhenachse ist zur Erkennbarkeit vergrößert.`);
    }
    function drawTime() {
      const svg=el('time-drawing'), width=svg.getBoundingClientRect().width;
      if(!width) return;
      svg.replaceChildren(); svg.setAttribute('viewBox',`0 0 ${width} 265`);
      const m=temporal(value('moment'),value('delay'),value('gain'),value('motion')==='turn');
      const sx=x=>20+x/90*(width-40);
      const entries=[['Reiz jetzt',m.current,55,'var(--foreground)'],['Verzögertes Signal',m.delayed,125,'var(--viz-series-1)'],['Lineare Vorhersage',m.predicted,195,'var(--viz-series-2)']];
      line(svg,sx(m.current),37,sx(m.current),209,{'stroke-dasharray':'3 4'});
      entries.forEach(([label,x,y,color],i)=>{
        add(svg,'text',{x:16,y:y-17},label);
        add(svg,'text',{x:width-16,y:y-17,'text-anchor':'end'},number(x,1));
        line(svg,sx(0),y,sx(90),y);
        if(i===0) add(svg,'circle',{cx:sx(x),cy:y,r:6,fill:color});
        else if(i===1) add(svg,'rect',{x:sx(x)-5,y:y-5,width:10,height:10,fill:color});
        else add(svg,'path',{d:`M${sx(x)},${y-7} L${sx(x)+7},${y+5} L${sx(x)-7},${y+5} Z`,fill:color});
      });
      [0,30,60,90].forEach(x=>add(svg,'text',{x:sx(x),y:235,'text-anchor':x===0?'start':x===90?'end':'middle'},String(x)));
      add(svg,'text',{x:width/2,y:259,'text-anchor':'middle'},'Position (Modell-Einheiten)');
      el('time-result').textContent=`Positionsfehler: verzögert ${number(m.errorDelayed,1)} · vorhergesagt ${number(m.errorPredicted,1)}`;
      add(svg,'title',{},'Kausale Extrapolation aus bereits verfügbaren Signalen');
    }
    function render() {
      const labels={radius:number(value('radius'))+' mm',retina:number(value('retina'))+' mm',delta:signed(value('delta'))+' mm',correction:signed(value('correction'),1)+' dpt',pupil:number(value('pupil'),1)+' mm',moment:number(value('moment'),0)+' ms',delay:number(value('delay'),0)+' ms',gain:number(value('gain'),1)+' ×'};
      Object.entries(labels).forEach(([id,label])=>el(id+'-value').textContent=label);
      drawEye(); drawTime();
    }
    ids.forEach(id=>el(id).addEventListener('input',render));
    const tabs=[el('eye-tab'),el('time-tab')];
    tabs.forEach((tab,index)=>tab.addEventListener('click',()=>{
      tabs.forEach((other,k)=>{
        const selected=k===index;
        other.setAttribute('aria-selected',String(selected));
        other.classList.toggle('active',selected);
        el(k===0?'eye-panel':'time-panel').hidden=!selected;
      });
      render();
    }));
    const observer=new ResizeObserver(render); observer.observe(el('eye-drawing')); observer.observe(el('time-drawing'));
    render();
  })();
