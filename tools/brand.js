#!/usr/bin/env node
// Tek SVG kaynağından PNG üretimi; ek paket, tarayıcı veya font gerektirmez.
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const {root}=require('./project.js');
const svg=fs.readFileSync(path.join(root,'assets/brand/mark.svg'),'utf8');
// Markanın kullandığı SVG alt kümesi: rect, circle, polygon ve linearGradient.
// Desteklenmeyen bir şekil sessizce kaybolmak yerine oluşturmayı durdurur.
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const rgb=s=>s.slice(1).match(/../g).map(x=>parseInt(x,16));
const gradients=Object.fromEntries([...svg.matchAll(/<linearGradient\b([^>]*)>([\s\S]*?)<\/linearGradient>/g)].map(m=>{
 const a=attrs(m[1]);return [a.id,{x1:+a.x1,y1:+a.y1,x2:+a.x2,y2:+a.y2,stops:[...m[2].matchAll(/<stop\b([^>]*)\/>/g)].map(s=>{const p=attrs(s[1]);return {offset:+p.offset,color:rgb(p['stop-color'])};})}];
}));
const supported=new Set(['svg','defs','linearGradient','stop','rect','circle','polygon']);
if([...svg.matchAll(/<([A-Za-z]\w*)\b/g)].some(m=>!supported.has(m[1])))throw Error('Marka SVG rasterleştiricisinin desteklemediği bir şekil kullanıyor.');
if(!svg.includes('viewBox="0 0 100 100"'))throw Error('Marka SVG 100 × 100 koordinat alanı kullanmalı.');
const shapes=[...svg.matchAll(/<(rect|circle|polygon)\b([^>]*)\/>/g)].map(m=>{
 const a=attrs(m[2]),kind=m[1],poly=kind==='polygon'?a.points.trim().split(/\s+/).map(p=>p.split(',').map(Number)):null;
 const box=poly?[Math.min(...poly.map(p=>p[0])),Math.min(...poly.map(p=>p[1])),Math.max(...poly.map(p=>p[0])),Math.max(...poly.map(p=>p[1]))]:kind==='circle'?[+a.cx- +a.r,+a.cy- +a.r,+a.cx+ +a.r,+a.cy+ +a.r]:[+a.x,+a.y,+a.x+ +a.width,+a.y+ +a.height];
 const gradient=/url\(#([^)]+)\)/.exec(a.fill);
 if(!gradient&&!/^#[a-f\d]{6}$/i.test(a.fill))throw Error('Desteklenmeyen marka rengi: '+a.fill);
 return {kind,a,poly,box,opacity:a.opacity===undefined?1:+a.opacity,color:gradient?null:rgb(a.fill),gradient:gradient&&gradients[gradient[1]]};
});
const hits=(s,x,y)=>{
 const [x0,y0,x1,y1]=s.box;if(x<x0||x>x1||y<y0||y>y1)return false;
 if(s.kind==='polygon')return inside(x,y,s.poly);
 if(s.kind==='circle')return (x- +s.a.cx)**2+(y- +s.a.cy)**2<=(+s.a.r)**2;
 const r=+s.a.rx||0,dx=Math.max(x0+r-x,x-(x1-r),0),dy=Math.max(y0+r-y,y-(y1-r),0);return dx*dx+dy*dy<=r*r;
};
function paint(s,x,y){
 if(s.color)return s.color;
 const g=s.gradient,[x0,y0,x1,y1]=s.box,px=(x-x0)/(x1-x0),py=(y-y0)/(y1-y0),dx=g.x2-g.x1,dy=g.y2-g.y1;
 const t=Math.max(0,Math.min(1,((px-g.x1)*dx+(py-g.y1)*dy)/(dx*dx+dy*dy)));
 let lo=g.stops[0],hi=g.stops[g.stops.length-1];for(let i=1;i<g.stops.length;i++)if(t<=g.stops[i].offset){lo=g.stops[i-1];hi=g.stops[i];break;}
 const k=Math.max(0,Math.min(1,(t-lo.offset)/(hi.offset-lo.offset)));return lo.color.map((v,i)=>v+(hi.color[i]-v)*k);
}
const inside=(x,y,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
const crc=b=>{let c=~0;for(const x of b){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^~0)>>>0};
const chunk=(name,data)=>{const t=Buffer.from(name),len=Buffer.alloc(4),tail=Buffer.alloc(4);len.writeUInt32BE(data.length);tail.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([len,t,data,tail])};
function png(size,full=false,mask=false){
 const raw=Buffer.alloc(size*(size*4+1));
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const sum=[0,0,0,0];for(let ay=0;ay<2;ay++)for(let ax=0;ax<2;ax++){
   const px=(x+(ax+.5)/2)*100/size,py=(y+(ay+.5)/2)*100/size,col=[0,0,0];let alpha=0;
   shapes.forEach((s,i)=>{const sx=mask&&i?(px-50)/.72+50:px,sy=mask&&i?(py-50)/.72+50:py;
    if(!((full&&i===0)||hits(s,sx,sy)))return;
    const c=paint(s,sx,sy),a=s.opacity;for(let k=0;k<3;k++)col[k]=c[k]*a+col[k]*(1-a);alpha=a+alpha*(1-a);
   });
   for(let k=0;k<3;k++)sum[k]+=col[k];sum[3]+=alpha*255;
  }
  const off=y*(size*4+1)+1+x*4;for(let k=0;k<3;k++)raw[off+k]=sum[3]?Math.round(sum[k]*255/sum[3]):0;raw[off+3]=Math.round(sum[3]/4);
 }
 const h=Buffer.alloc(13);h.writeUInt32BE(size,0);h.writeUInt32BE(size,4);h[8]=8;h[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
fs.mkdirSync(path.join(root,'icons'),{recursive:true});
fs.writeFileSync(path.join(root,'icons/icon.svg'),svg);
for(const [name,size,full,mask]of [['icon-192.png',192],['icon-512.png',512],['icon-maskable-512.png',512,true,true],['apple-touch-icon.png',180,true]])fs.writeFileSync(path.join(root,'icons',name),png(size,full,mask));
console.log('NakGo simgeleri assets/brand/mark.svg kaynağından üretildi.');
