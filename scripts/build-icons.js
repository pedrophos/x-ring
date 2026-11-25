// Gera os ícones e o splash a partir das artes em assets/source (geradas no ChatGPT).
// Uso: node scripts/build-icons.js
const Jimp = require('jimp-compact');
const src = require('path').join(__dirname, '../assets/source/'), out = require('path').join(__dirname, '../assets/images/');
const GREEN = [0x1f, 0x3d, 0x2b];
const smooth = (d, r, f) => Math.max(0, Math.min(1, (r - d) / f + 0.5)); // 1 inside, 0 outside
// Find medallion circle (non-background extent on center row/col).
function circle(im, isBg) {
  const { width: w, height: h } = im.bitmap; let l=w,r=0,t=h,b=0;
  im.scan(0,0,w,h,(x,y,i)=>{ if(!isBg(im.bitmap.data,i)){ if(y>400&&y<620){l=Math.min(l,x);r=Math.max(r,x);} if(x>400&&x<620){t=Math.min(t,y);b=Math.max(b,y);} } });
  return { cx:(l+r)/2, cy:(t+b)/2, r:Math.min(r-l,b-t)/2 };
}
// Medallion on transparent, centered, given diameter, on a 1024 canvas.
function place(cut, c, diameter) {
  const side = Math.ceil(c.r * 2) + 4;
  const crop = cut.clone().crop(Math.round(c.cx - side/2), Math.round(c.cy - side/2), side, side);
  const s = Math.round(diameter * side / (c.r * 2));
  crop.resize(s, s, Jimp.RESIZE_BICUBIC);
  const canvas = new Jimp(1024, 1024, 0x00000000);
  return canvas.composite(crop, Math.round(512 - s/2), Math.round(512 - s/2));
}
(async () => {
  // 1. icon.png: square full bleed, flat turf green outside the medallion.
  const icon = await Jimp.read(src + 'icone-gpt.jpeg');
  const ci = circle(icon, (d,i) => Math.abs(d[i]-29)+Math.abs(d[i+1]-57)+Math.abs(d[i+2]-42) < 60);
  console.log('icon circle', ci);
  icon.scan(0,0,1024,1024,(x,y,i)=>{ const d=icon.bitmap.data; const k=smooth(Math.hypot(x-ci.cx,y-ci.cy), ci.r+3, 3);
    for (let c=0;c<3;c++) d[i+c]=Math.round(d[i+c]*k+GREEN[c]*(1-k)); d[i+3]=255; });
  await icon.writeAsync(out + 'icon.png');
  // Cutout of the medallion (transparent outside), reused by foreground and splash.
  const cut = icon.clone();
  cut.scan(0,0,1024,1024,(x,y,i)=>{ cut.bitmap.data[i+3]=Math.round(255*smooth(Math.hypot(x-ci.cx,y-ci.cy), ci.r+1, 2)); });
  // 2. adaptive foreground: medallion inside the 66/108 safe circle (626 px).
  await place(cut, ci, 610).writeAsync(out + 'android-icon-foreground.png');
  // 4. splash: medallion only, nearly full canvas.
  await place(cut, ci, 980).writeAsync(out + 'splash-icon.png');
  // 3. monochrome: white with alpha = luminance.
  const mono = await Jimp.read(src + 'monocromatico-gpt.jpeg');
  const cm = circle(mono, (d,i) => d[i] < 60);
  console.log('mono circle', cm);
  mono.scan(0,0,1024,1024,(x,y,i)=>{ const d=mono.bitmap.data; const lum=(d[i]+d[i+1]+d[i+2])/3;
    d[i]=d[i+1]=d[i+2]=255; d[i+3]=Math.round(lum*smooth(Math.hypot(x-cm.cx,y-cm.cy), cm.r+2, 2)); });
  await place(mono, cm, 610).writeAsync(out + 'android-icon-monochrome.png');
})();
