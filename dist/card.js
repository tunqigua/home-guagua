import {rooms} from './data.js';
import {defaultConfig,validateConfig} from './logic.js';
import {sceneURI} from './scene.js';
import {tr,language} from './i18n.js';
// Keep words together in English, and Japanese closing punctuation off a new line.
export function wrapLines(value,measure,maxWidth,lang){
 const tokens=lang==='en'?(value.match(/\S+\s*/gu)||[]):Array.from(value);
 const lines=[];let line='';
 const close=/^[、。，．！？：；）」』】〕〉》…,.!?;:]/u,open=/[（「『【〔〈《]$/u;
 for(const token of tokens){
  if(line&&measure((line+token).trimEnd())>maxWidth){
   let carry='';
   if(close.test(token)||open.test(line)){carry=Array.from(line).pop();line=Array.from(line).slice(0,-1).join('');}
   if(line.trim())lines.push(line.trim());line=carry;
  }
  // Very long unbroken text still wraps without shrinking the font.
  for(const char of token){if(line&&measure(line+char)>maxWidth){lines.push(line.trim());line='';}line+=char;}
 }
 if(line.trim())lines.push(line.trim());return lines;
}
export async function createCard(config,lang=language) {
 const c=validateConfig(typeof config==='string'?defaultConfig(config):config);if(!c)throw Error('Invalid room');
 const r=rooms[c.type],t=source=>tr(source,{},lang);await document.fonts.ready;
 const image=new Image();image.src=sceneURI(c,{key:true});await image.decode();
 const canvas=document.createElement('canvas');canvas.width=1080;
 let ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
 const families=lang==='ja'?'"Hiragino Kaku Gothic ProN","Yu Gothic"':lang==='zh-Hant'?'"PingFang TC","Microsoft JhengHei"':'"PingFang SC","Microsoft YaHei"';
 const font=`-apple-system,BlinkMacSystemFont,${families},sans-serif`;
 const blocks=[],gap=18;
 const plan=(value,size,y,width,lineHeight,color='#293740')=>{
  ctx.font=`${size}px ${font}`;const lines=wrapLines(value,s=>ctx.measureText(s).width,width,lang);
  blocks.push({lines,size,y,lineHeight,color});return y+lines.length*lineHeight;
 };
 plan('HOME',32,112,860,44,'#A9443E');
 let y=plan(t('挂挂在窗边，给你留了一盏灯。'),25,168,860,38,'#5D6B73');
 y=plan(t(r.name),56,y+38,880,74);
 const sceneY=y+gap,sceneHeight=720;
 y=plan(t(r.quote),30,sceneY+sceneHeight+46,860,46,'#5D6B73');
 y=plan('「'+t(r.plaques[c.plaque])+'」',30,y+32,860,46);
 y=plan(r.tags.map(t).join('  /  '),25,y+26,860,38,'#5D6B73');
 y=plan(t('你的冬日小屋 · 此刻的布置'),23,y+28,860,36,'#5D6B73');
 canvas.height=Math.max(1440,y+56);
 ctx=canvas.getContext('2d');ctx.fillStyle='#EAF1F4';ctx.fillRect(0,0,1080,canvas.height);
 ctx.fillStyle='#FFF8EE';ctx.fillRect(40,40,1000,canvas.height-80);
 ctx.imageSmoothingEnabled=false;ctx.drawImage(image,60,sceneY,960,sceneHeight);
 ctx.textAlign='center';
 for(const block of blocks){ctx.font=`${block.size}px ${font}`;ctx.fillStyle=block.color;block.lines.forEach((line,i)=>ctx.fillText(line,540,block.y+i*block.lineHeight));}
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Empty image')),'image/png'));
 return {blob,width:1080,height:canvas.height,textEnd:y,language:lang};
}
