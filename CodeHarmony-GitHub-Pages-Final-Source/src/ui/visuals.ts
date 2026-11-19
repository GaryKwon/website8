import type {Composition,MusicTrack} from '../music/types.js';
const noteColors:Record<string,string>={bass:'#9b9b9b',chords:'#d4d4d4',melody:'#ffffff',arpeggio:'#b9b9b9',pad:'#7f7f7f'};
function canvasSize(canvas:HTMLCanvasElement):{ctx:CanvasRenderingContext2D;w:number;h:number}{const bounds=canvas.getBoundingClientRect();const scale=Math.min(devicePixelRatio||1,2);const w=Math.max(1,Math.round(bounds.width)),h=Math.max(1,Math.round(bounds.height));if(canvas.width!==Math.round(w*scale)||canvas.height!==Math.round(h*scale)){canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);}const ctx=canvas.getContext('2d')!;ctx.setTransform(scale,0,0,scale,0,0);return {ctx,w,h};}
export function drawVisualizer(canvas:HTMLCanvasElement,analyser:AnalyserNode|null,seed=12345):void{
 const {ctx,w,h}=canvasSize(canvas);ctx.clearRect(0,0,w,h);if(!analyser){ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(16,h/2);ctx.lineTo(w-16,h/2);ctx.stroke();return;}const bars=Math.min(62,Math.max(25,Math.floor(w/8)));const gap=3,barW=(w-(bars-1)*gap)/bars;
 const freq=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(freq);
 for(let i=0;i<bars;i++){
  const spectralIndex=Math.round(3+Math.pow(i/(bars-1),1.8)*Math.min(freq.length-4,620));
  const level=Math.pow(freq[spectralIndex]/255,.78);
  const height=Math.max(3,Math.min(h-12,level*(h-18)*1.8));const x=i*(barW+gap),y=(h-height)/2;
  const gradient=ctx.createLinearGradient(0,y,0,y+height);gradient.addColorStop(0,'rgba(255,255,255,0.95)');gradient.addColorStop(.5,'rgba(220,220,220,0.92)');gradient.addColorStop(1,'rgba(120,120,120,0.88)');ctx.fillStyle=gradient;ctx.beginPath();ctx.roundRect(x,y,Math.max(2,barW),height,1.5);ctx.fill();
 }
}
export function drawPiano(canvas:HTMLCanvasElement,composition:Composition|null,positionBeat=0):void{
 const {ctx,w,h}=canvasSize(canvas);ctx.clearRect(0,0,w,h);
 const left=35,pitchLow=44,pitchHigh=92,rows=pitchHigh-pitchLow+1,step=h/rows;
 for(let pitch=pitchLow;pitch<=pitchHigh;pitch++){const y=h-(pitch-pitchLow+1)*step;ctx.fillStyle=[1,3,6,8,10].includes(pitch%12)?'#0c0c0c':'#161616';ctx.fillRect(0,y,w,step);if(pitch%12===0){ctx.strokeStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.65)';ctx.font='9px monospace';ctx.fillText(`C${Math.floor(pitch/12)-1}`,4,y+9);}}
 if(!composition){ctx.fillStyle='rgba(255,255,255,.55)';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText('Compose music to see the notes.',w/2,h/2);ctx.textAlign='start';return;}
 const total=composition.bars*4;const timeline=w-left;
 for(let b=0;b<=composition.bars;b++){const x=left+timeline*b/composition.bars;ctx.strokeStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
 for(const track of composition.tracks){if(track.id==='drums')continue;drawNotes(ctx,track,left,timeline,total,h,step,pitchLow);}
 const x=left+positionBeat/total*timeline;ctx.strokeStyle='#fff';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();ctx.lineWidth=1;
}
function drawNotes(ctx:CanvasRenderingContext2D,track:MusicTrack,left:number,timeline:number,total:number,height:number,rowHeight:number,low:number):void{
 ctx.fillStyle=noteColors[track.id]||'#cfcfcf';for(const note of track.notes){if(note.pitch<low||note.pitch>92)continue;const x=left+note.startBeat/total*timeline;const w=Math.max(1.3,note.durationBeats/total*timeline-1);const y=height-(note.pitch-low+1)*rowHeight+.25;ctx.globalAlpha=.5+note.velocity*.4;ctx.fillRect(x,y,w,Math.max(1.8,rowHeight-.4));}ctx.globalAlpha=1;
}
