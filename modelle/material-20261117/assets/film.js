/* Canvas-only recording; simulation and input handling keep their own clocks. */
(()=>{'use strict';let active=null;
const save=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);};
window.addEventListener('halveth-record-scene',event=>{
 if(active){active.recorder.stop();return;}
 const {canvas,scene}=event.detail,panel=canvas.closest('[data-motion-scene],.lab-full,.embedded-lab')||canvas.parentElement,button=panel.querySelector('[data-action="movie"]');
 let note=panel.querySelector('[data-film-note]');if(!note){note=document.createElement('p');note.className='lab-note';note.dataset.filmNote='';panel.append(note);}
 const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(type=>globalThis.MediaRecorder?.isTypeSupported(type));
 if(!mime||!canvas.captureStream){note.textContent='Dieser Browser unterstützt die Filmaufnahme nicht. PNG und Zustands-JSON sind weiterhin verfügbar.';return;}
 const chunks=[],start=performance.now(),initial=scene(),stream=canvas.captureStream(30);let bytes=0;
 const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:12000000});
 const timeout=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},60000);
 active={recorder};if(button){button.dataset.recording='true';button.textContent=globalThis.HALVETHMotionUI?.label('stop')||'Aufnahme stoppen';}note.textContent='Canvas-Aufnahme läuft. Erneut klicken zum Stoppen; maximal 60 Sekunden.';
 recorder.ondataavailable=e=>{if(e.data.size){chunks.push(e.data);bytes+=e.data.size;if(bytes>128*1024*1024&&recorder.state==='recording')recorder.stop();}};
 recorder.onerror=()=>{note.textContent='Aufnahme fehlgeschlagen. Es wird kein Erfolg gemeldet.';};
 let redraw=null;recorder.onstop=()=>{clearTimeout(timeout);if(redraw!==null)clearInterval(redraw);stream.getTracks().forEach(t=>t.stop());active=null;if(button){button.dataset.recording='false';button.textContent=globalThis.HALVETHMotionUI?.label('record')||'Film aufnehmen';}const blob=new Blob(chunks,{type:mime});
  if(!blob.size){note.textContent='Die Aufnahme enthält keine Videodaten.';return;}
  const receipt={schema:'halveth.canvas-recording/1.0',width:canvas.width,height:canvas.height,requestedCaptureFPS:30,actualEncodedFrameCount:null,elapsedWallSeconds:(performance.now()-start)/1000,bytes:blob.size,mime,initialState:initial,finalState:scene(),limit:'Browser recording may drop frames; exact offline export has a separate decoded-frame receipt'};
  save(blob,'HALVETH_FILM.webm');save(new Blob([JSON.stringify(receipt,null,2)],{type:'application/json'}),'HALVETH_FILM_RECEIPT.json');note.textContent='Film und Zustandsbeleg gespeichert. Die Browseraufnahme kann Bilder auslassen; der Beleg kennzeichnet diese Grenze.';
 };
 recorder.start(1000);event.detail.draw();stream.getVideoTracks()[0]?.requestFrame?.();redraw=setInterval(()=>{event.detail.draw();stream.getVideoTracks()[0]?.requestFrame?.();},1000/30);
});
})();
