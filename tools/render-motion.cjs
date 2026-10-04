/* SPDX-License-Identifier: MIT. CPU rendering; no browser or desktop control. */
'use strict';
const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto');
const {spawn}=require('node:child_process'), {once}=require('node:events');
const {createCanvas}=require('@napi-rs/canvas');
const M=require('../motion-core.js');
const args=process.argv.slice(2), values={};
const allowed=new Set(['out','width','height','fps','ffmpeg']);
for(let i=0;i<args.length;i+=2){const name=args[i].slice(2);if(!args[i].startsWith('--')||args[i+1]===undefined||!allowed.has(name)||Object.hasOwn(values,name))throw new Error('Unique supported named argument with a value required');values[name]=args[i+1];}
const out=path.resolve(values.out||'motion-render'), width=Number(values.width||1920), height=Number(values.height||1080), fps=Number(values.fps||30);
if(![width,height,fps].every(Number.isInteger)||width<320||height<180||width>7680||height>4320||fps<1||fps>120)throw new Error('Explicit valid render dimensions and rate required');
fs.mkdirSync(out,{recursive:true});
const canvas=createCanvas(width,height),ctx=canvas.getContext('2d');
const source=fs.readFileSync(path.join(__dirname,'../motion-core.js'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function main(){
  const stills=[];
  for(const t of [1,4,8,12,16,19.5]){
    M.render(ctx,width,height,t);const name='motion-'+String(t).replace('.','_')+'s.png',bytes=canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(out,name),bytes);stills.push({time:t,file:name,sha256:sha(bytes)});
  }
  M.render(ctx,width,height,8);fs.writeFileSync(path.join(out,'poster.jpg'),canvas.toBuffer('image/jpeg',90));
  let movie=null;
  if(values.ffmpeg){
    const filename=path.join(out,'HALVETH_MOTION_20s_'+height+'p.mp4');
    const child=spawn(values.ffmpeg,['-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgba','-video_size',width+'x'+height,'-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',filename],{stdio:['pipe','ignore','pipe'],windowsHide:true});
    let error='';child.stderr.on('data',chunk=>error+=chunk.toString());
    const completed=once(child,'exit');
    for(let i=0;i<fps*M.DURATION;i++){
      M.render(ctx,width,height,i/fps);
      const bytes=Buffer.from(ctx.getImageData(0,0,width,height).data.buffer);
      if(!child.stdin.write(bytes))await once(child.stdin,'drain');
      if(i%(fps*5)===0)console.log('Rendered '+i+'/'+fps*M.DURATION+' frames');
    }
    child.stdin.end();const [code]=await completed;
    if(code!==0)throw new Error('FFmpeg '+code+': '+error);
    movie={file:path.basename(filename),sha256:sha(fs.readFileSync(filename)),bytes:fs.statSync(filename).size,frames:fps*M.DURATION};
  }
  fs.writeFileSync(path.join(out,'RENDER.json'),JSON.stringify({schema:'halveth.motion-render.v1',recordedAt:new Date().toISOString(),renderer:'@napi-rs/canvas CPU',coreSha256:sha(source),width,height,fps,durationSeconds:M.DURATION,stills,movie,desktopControl:false,audio:'Original silent composition'},null,2)+'\n');
  console.log(JSON.stringify({state:'RENDERED',width,height,stills:stills.length,movie}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
