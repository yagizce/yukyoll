/* Taşıma sırasında kayıp, kayıt dışı kaynak ve belge bağlantısı kontrolü */
module.exports = ({test,ROOT,fs,path}) => {
 test('Tek kaynak yapısı ve belge bağlantıları',async()=>{
  const checks=[],walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
  const {js,css}=require('../../tools/project.js');
  const sources=walk(path.join(ROOT,'src')).filter(f=>/\.(js|css)$/.test(f)).map(f=>path.relative(ROOT,f).replaceAll('\\','/'));
  checks.push([sources.length===js.length+css.length&&sources.every(f=>[...js,...css].includes(f)), 'bütün JS/CSS kaynakları oluşturma sırasına kayıtlı']);
  checks.push([fs.readdirSync(ROOT).filter(f=>/^README/i.test(f)).join()==='README.md','kökte tek README']);
  for(const f of ['README.md',...walk(path.join(ROOT,'docs')).filter(f=>f.endsWith('.md')).map(f=>path.relative(ROOT,f))]){
   const text=fs.readFileSync(path.join(ROOT,f),'utf8');for(const link of text.matchAll(/\]\(([^)]+)\)/g)){if(!/^https?:|#/.test(link[1]))checks.push([fs.existsSync(path.resolve(ROOT,path.dirname(f),link[1])),'belge bağlantısı: '+link[1]]);}
  }
  checks.push([!fs.readFileSync(path.join(ROOT,'icons/icon-512.png')).equals(fs.readFileSync(path.join(ROOT,'icons/icon-maskable-512.png'))),'maskable simge ayrı güvenli alan kullanır']);
  for(const f of ['download','download (1)','download (3)','prepare-web.js','gen.py','generate.py'])checks.push([!fs.existsSync(path.join(ROOT,f)),'eski dosya kaldırıldı: '+f]);
  return checks;
 });
};
