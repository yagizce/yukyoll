#!/usr/bin/env node
// Tek SVG kaynağından PNG üretimi; ek paket, tarayıcı veya font gerektirmez.
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const {root}=require('./project.js');
const svg=fs.readFileSync(path.join(root,'assets/brand/mark.svg'),'utf8');
const points=/points="([^"]+)"/.exec(svg)[1].split(' ').map(p=>p.split(',').map(Number));
const colors=[...svg.matchAll(/fill="#([a-f0-9]{6})"/g)].map(m=>m[1].match(/../g).map(x=>parseInt(x,16)));
const inside=(x,y,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
const crc=b=>{let c=~0;for(const x of b){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^~0)>>>0};
const chunk=(name,data)=>{const t=Buffer.from(name),len=Buffer.alloc(4),tail=Buffer.alloc(4);len.writeUInt32BE(data.length);tail.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([len,t,data,tail])};
function png(size,full=false,mask=false){
 const raw=Buffer.alloc(size*(size*4+1));
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const sum=[0,0,0,0];for(let ay=0;ay<2;ay++)for(let ax=0;ax<2;ax++){
   const px=(x+(ax+.5)/2)*64/size,py=(y+(ay+.5)/2)*64/size;
   const dx=Math.max(16-px,px-48,0),dy=Math.max(16-py,py-48,0),a=full||dx*dx+dy*dy<=256;
   const gx=mask?(px-32)/.72+32:px,gy=mask?(py-32)/.72+32:py;
   const col=inside(gx,gy,points)?colors[1]:colors[0];for(let k=0;k<3;k++)sum[k]+=col[k];sum[3]+=a?255:0;
  }
  const off=y*(size*4+1)+1+x*4;for(let k=0;k<4;k++)raw[off+k]=Math.round(sum[k]/4);
 }
 const h=Buffer.alloc(13);h.writeUInt32BE(size,0);h.writeUInt32BE(size,4);h[8]=8;h[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
fs.mkdirSync(path.join(root,'icons'),{recursive:true});
fs.writeFileSync(path.join(root,'icons/icon.svg'),svg);
for(const [name,size,full,mask]of [['icon-192.png',192],['icon-512.png',512],['icon-maskable-512.png',512,true,true],['apple-touch-icon.png',180,true]])fs.writeFileSync(path.join(root,'icons',name),png(size,full,mask));
console.log('NakGo simgeleri assets/brand/mark.svg kaynağından üretildi.');
