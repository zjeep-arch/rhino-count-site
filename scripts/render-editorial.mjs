import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};
for(const file of ['data.js','homepage-editorial.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
const {SITE_DATA:d,RhinoEditorial:r}=context.window;
const newest=JSON.parse(fs.readFileSync('ai-daily/feed.json','utf8')).articles.sort((a,b)=>(b.slug||'').localeCompare(a.slug||''))[0];
if(newest)d.daily.latest=[{tag:'LATEST · '+newest.date,title:newest.title,desc:newest.excerpt,href:newest.url}];
let html=fs.readFileSync('index.html','utf8');
for(const [id,render] of [['hero-section',r.hero],['daily',r.daily]]){
 const re=new RegExp('(<section[^>]*id="'+id+'"[^>]*>)[\\s\\S]*?(</section>)');
 if(!re.test(html))throw Error('Missing '+id);
 html=html.replace(re,(_,a,b)=>a+'\n'+render(d)+'\n'+b);
}
const re=/(<div id="signals-reading">)[\s\S]*?(<\/div>\s*<\/section>)/;
if(!re.test(html))throw Error('Missing reading wrapper');
html=html.replace(re,(_,a,b)=>a+r.reading(d)+b);
fs.writeFileSync('index.html',html);
console.log('Editorial sections synchronized.');
