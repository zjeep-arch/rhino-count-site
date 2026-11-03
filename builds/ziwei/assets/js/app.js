/* 问星 · 应用主逻辑 */
(function(){
'use strict';
const _ZW = window.ZiweiEngine;
const E = (_ZW && _ZW.generateChart) ? _ZW : (_ZW && _ZW.ZiweiEngine);
const D = window.GXG_DATA;
if(!E || !E.generateChart || !D){ document.body.innerHTML = '<p style="padding:40px;text-align:center">引擎加载失败，请刷新重试。</p>'; return; }

/* ---------- 工具 ---------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* 印章式四化徽章：禄=鎏金 权=深紫 科=雾紫 忌=豆沙红 */
function shBadge(h){
  if(!h) return '';
  const cls = { '禄': 'sh-lu', '权': 'sh-quan', '科': 'sh-ke', '忌': 'sh-ji' }[h] || '';
  return `<span class="sihua ${cls}">${esc(h)}</span>`;
}
const pad2 = n => String(n).padStart(2,'0');
const BR = E.BRANCHES, ST = E.STEMS;
/* 北京时间日期：今日小运按东八区日期翻篇，不跟随设备时区 */
function bjDate(){
  try{
    const parts = new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date());
    const g = t => +parts.find(p=>p.type===t).value;
    return { y: g('year'), m: g('month'), d: g('day') };
  }catch(e){ const d = new Date(); return { y: d.getFullYear(), m: d.getMonth()+1, d: d.getDate() }; }
}
/* 斗君：流年支起，逆数生月（农历），顺数生时；流月以斗君起正月顺排 */
function doujunBranch(chart, year){
  const yb = ((year - 4) % 12 + 12) % 12;
  const lm = chart.lunarInfo && chart.lunarInfo.lunarMonth;
  const hb = chart.birthInfo && chart.birthInfo.hour;
  if(!lm || hb == null) return yb;
  return ((((yb - (lm - 1)) % 12) + 12) % 12 + hb) % 12;
}
// 引擎返回的宫名是简称（福德/仆役…），展示时映射为全称
const PALACE_FULL = { '命宫':'命宫','兄弟':'兄弟宫','夫妻':'夫妻宫','子女':'子女宫','财帛':'财帛宫','疾厄':'疾厄宫','迁移':'迁移宫','仆役':'交友宫','官禄':'官禄宫','田宅':'田宅宫','福德':'福德宫','父母':'父母宫' };
const disp = short => PALACE_FULL[short] || short || '';
const PALACE_ORDER = ['命宫','兄弟宫','夫妻宫','子女宫','财帛宫','疾厄宫','迁移宫','交友宫','官禄宫','田宅宫','福德宫','父母宫'];
const SHICHEN = [
  {v:0,label:'早子时',range:'00:00–01:00'},{v:1,label:'丑时',range:'01:00–03:00'},
  {v:2,label:'寅时',range:'03:00–05:00'},{v:3,label:'卯时',range:'05:00–07:00'},
  {v:4,label:'辰时',range:'07:00–09:00'},{v:5,label:'巳时',range:'09:00–11:00'},
  {v:6,label:'午时',range:'11:00–13:00'},{v:7,label:'未时',range:'13:00–15:00'},
  {v:8,label:'申时',range:'15:00–17:00'},{v:9,label:'酉时',range:'17:00–19:00'},
  {v:10,label:'戌时',range:'19:00–21:00'},{v:11,label:'亥时',range:'21:00–23:00'},
  {v:12,label:'晚子时',range:'23:00–24:00'},
];
const SHICHEN_MID = {0:[0,30],1:[2,0],2:[4,0],3:[6,0],4:[8,0],5:[10,0],6:[12,0],7:[14,0],8:[16,0],9:[18,0],10:[20,0],11:[22,0],12:[23,30]};

/* ---------- 本地存档 ---------- */
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} },
};
const SIHUA_ORDER = ['禄','权','科','忌'];
const SIHUA_RULE_KEY = 'gxg_sihua_table_v1';
const ENGINE_SIHUA = {
  getSiHuaByStem: E.getSiHuaByStem.bind(E),
  getDaXianSiHua: E.getDaXianSiHua.bind(E),
  getLiuNianSiHua: E.getLiuNianSiHua.bind(E),
  getLiuYueSiHua: E.getLiuYueSiHua.bind(E),
  getLiuRiSiHua: E.getLiuRiSiHua.bind(E),
};
function cloneSihuaTable(table){
  const out={};
  for(let i=0;i<10;i++){
    const row=Array.isArray(table?.[i])?table[i]:E.SI_HUA_TABLE[i];
    if(!Array.isArray(row)||row.length!==4) return null;
    out[i]=row.map(String);
  }
  return out;
}
function getStoredSihuaTable(){ return cloneSihuaTable(store.get(SIHUA_RULE_KEY, E.SI_HUA_TABLE)) || cloneSihuaTable(E.SI_HUA_TABLE); }
let activeSihuaTable = getStoredSihuaTable();
function transformsForStem(stem){
  const row=activeSihuaTable?.[stem] || E.SI_HUA_TABLE[stem] || [];
  return { '禄':row[0]||'', '权':row[1]||'', '科':row[2]||'', '忌':row[3]||'' };
}
function withConfiguredTransforms(result){
  if(!result) return result;
  const transforms=transformsForStem(result.stemIndex);
  return {...result, transforms, lu:transforms['禄'], quan:transforms['权'], ke:transforms['科'], ji:transforms['忌']};
}
function setActiveSihuaTable(table){
  activeSihuaTable=cloneSihuaTable(table)||cloneSihuaTable(E.SI_HUA_TABLE);
  E.getSiHuaByStem = stem => transformsForStem(stem);
  E.getDaXianSiHua = (...args) => withConfiguredTransforms(ENGINE_SIHUA.getDaXianSiHua(...args));
  E.getLiuNianSiHua = (...args) => withConfiguredTransforms(ENGINE_SIHUA.getLiuNianSiHua(...args));
  E.getLiuYueSiHua = (...args) => withConfiguredTransforms(ENGINE_SIHUA.getLiuYueSiHua(...args));
  E.getLiuRiSiHua = (...args) => withConfiguredTransforms(ENGINE_SIHUA.getLiuRiSiHua(...args));
}
setActiveSihuaTable(activeSihuaTable);
function applySihuaTableToChart(chart){
  if(!chart?.palaces?.length) return;
  chart.palaces.forEach(p => p.stars.forEach(s => { delete s.siHua; }));
  const natal=transformsForStem(chart.lunarInfo?.yearStem);
  for(const hua of SIHUA_ORDER){
    const star=natal[hua];
    const pal=chart.palaces.find(p=>p.stars.some(s=>s.name===star));
    const target=pal?.stars.find(s=>s.name===star);
    if(target) target.siHua=hua;
  }
  chart.sihuaTable=cloneSihuaTable(activeSihuaTable);
}
function renderSihuaSettings(){
  const box=$('#sihua-settings-grid'); if(!box) return;
  const table=getStoredSihuaTable();
  const stars=[...new Set(Object.values(E.SI_HUA_TABLE).flat())].sort((a,b)=>a.localeCompare(b,'zh-CN'));
  box.innerHTML=E.STEMS.map((stem,i)=>'<div class="sihua-settings-row"><b>'+esc(stem)+'干</b>'+SIHUA_ORDER.map((hua,col)=>
    '<label><span>'+hua+'</span><select data-sihua-stem="'+i+'" data-sihua-col="'+col+'" aria-label="'+stem+'干化'+hua+'">'+
    stars.map(star=>'<option value="'+esc(star)+'" '+(table[i][col]===star?'selected':'')+'>'+esc(star)+'</option>').join('')+
    '</select></label>').join('')+'</div>').join('');
}
document.addEventListener('change',e=>{
  if(!e.target.matches('#sihua-settings-grid select[data-sihua-stem]')) return;
  const table=getStoredSihuaTable();
  table[+e.target.dataset.sihuaStem][+e.target.dataset.sihuaCol]=e.target.value;
  store.set(SIHUA_RULE_KEY,table);
  setActiveSihuaTable(table);
  if(cur()) { const rec=cur(); rec.chart.sihuaTable=cloneSihuaTable(table); rec.input.sihuaTable=cloneSihuaTable(table); applySihuaTableToChart(rec.chart); attachSelfSihua(rec.chart); store.set('gxg_archive',archive); renderChart(); }
});
document.addEventListener('click',e=>{
  if(!e.target.closest('#sihua-settings-reset')) return;
  store.set(SIHUA_RULE_KEY,E.SI_HUA_TABLE);
  renderSihuaSettings();
  setActiveSihuaTable(E.SI_HUA_TABLE);
  const rec=cur(); if(rec){ rec.chart.sihuaTable=cloneSihuaTable(E.SI_HUA_TABLE); rec.input.sihuaTable=cloneSihuaTable(E.SI_HUA_TABLE); applySihuaTableToChart(rec.chart); attachSelfSihua(rec.chart); store.set('gxg_archive',archive); renderChart(); }
});
let archive = store.get('gxg_archive', []);   // [{id, name, tag, gender, input, chart, createdAt}]
archive.forEach(r => { if(r && r.chart && r.chart.palaces) attachSelfSihua(r.chart); }); // 存量盘补挂自化
let currentId = store.get('gxg_current', null);
const uid = () => 'c' + Date.now().toString(36) + Math.floor(Math.random()*1e4).toString(36);
const cur = () => archive.find(a => a.id === currentId) || null;

/* ---------- 导航 ---------- */
const VIEWS = ['home','input','chart','reading','guide','archive','dingpan'];
function nav(name){
  if(['menu','palaces','answer'].includes(name)) name = 'reading';
  else if(name === 'life' || name === 'sihuapan') return;
  if(!VIEWS.includes(name)) return;
  if(name === 'chart' && !cur()) name = 'input'; // 还没排过盘时，"命盘"入口直接引导去排盘
  $$('.view').forEach(v => v.classList.remove('active'));
  $('#view-'+name).classList.add('active');
  $$('#tabbar button, #topnav button').forEach(b => b.classList.toggle('on', b.dataset.nav === name));
  window.scrollTo({top:0});
  if(name==='home') renderHome();
  if(name==='chart') renderChart();
  if(name==='input') renderInputHistory();
  if(name==='archive') renderArchive();
  if(name==='reading') renderUnifiedReading();
  if(name==='guide') renderGuide();
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-nav]');
  if(t){ nav(t.dataset.nav); }
});

/* ---------- 弹窗 ---------- */
function modal(title, bodyHtml){
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = bodyHtml;
  $('#modal').hidden = false;
}
$('#modal-x').addEventListener('click', () => $('#modal').hidden = true);
$('#modal').addEventListener('click', e => { if(e.target.id==='modal') $('#modal').hidden = true; });
/* "星化X入宫"家族的合成词条：V2 未收录时按星性+化性+落宫生成，不留空白 */
function patternFamilyText(name){
  const m=/^(.{2})化(禄|权|科|忌)入(命|迁|官|财|身|福|夫|疾)$/.exec(name||'');if(!m)return null;
  const palace={'命':'命宫','迁':'迁移宫','官':'官禄宫','财':'财帛宫','身':'身宫','福':'福德宫','夫':'夫妻宫','疾':'疾厄宫'}[m[3]];
  return {text:`${m[1]}化${m[2]}落${palace}的传统组合标签`,condition:`生年${m[1]}化${m[2]}飞入${palace}`,source:'本站当前规则整理',caution:'只说明规则匹配，不代表现实事件结果'};
}
function safeSihuaNote(star, hua, palace){const meanings={'禄':'资源、回应与投入','权':'推动、责任与掌控','科':'表达、规范与可见度','忌':'牵挂、反复投入与需要核对的部分'};return `${star}化${hua}落在${palace}，按本站所选规则得到这一传统盘面对应。可把“${meanings[hua]||'主题变化'}”当作复盘问题，再核对现实情况；它不表示收益、损失、疾病或关系结果必然发生。`;}
function glossary(kind, name){
  let html = '', isHtml = false;
  if(kind==='star'){
    const rec = cur();
    const star = rec && rec.chart && rec.chart.palaces
      ? rec.chart.palaces.flatMap(p => p.stars || []).find(s => s.name === name)
      : null;
    const category = ({major:'十四主星',lucky:'辅曜',sha:'煞曜',minor:'杂曜'})[star && star.type] || '星曜';
    const description = D.stars[name] || '本站尚未整理该星条目。单星不足以判断吉凶，请结合落宫、同宫星曜、四化与运限阅读。';
    html = `<div class="star-glossary">
      <span class="star-glossary-category">${esc(category)}</span>
      <p class="star-glossary-description">${esc(description)}</p>
      <div class="star-glossary-note"><b>读盘提示</b><br>单星只提供传统取象，需结合落宫、同宫主辅星、三方四正、四化和大限流年；不同流派对辅曜与杂曜的权重、取法可能不同。</div>
      <div class="star-glossary-source">本站独立白话整理，用作文化参考，不作确定性预言、医疗诊断或现实决策依据。</div>
    </div>`;
    isHtml = true;
  }
  else if(kind==='sihua'){
    html = esc(D.sihua[name] || '') + '<br><br><span class="hint">以上是传统象义摘要，不是对某项事件或结果的保证。四化规则依你选择的流派与设置而变。</span>';
    if(window.GXG_SIHUA_WUXING) html += '<br>' + esc(window.GXG_SIHUA_WUXING);
  }
  else if(kind==='pattern'){
    const v2=(window.GXG_PATTERNS_V2||{})[name]||patternFamilyText(name);
    if(v2){html=`<b>${esc(name)}</b> 是按本站规则检测到的传统星曜组合标签。成立条件：${esc(v2.condition||'见当前格局检测规则')}。<br><br>不同流派的组合边界、权重和名称可能不同；识别到标签只说明满足一组规则，不表示格局等级、个性定论或现实成败。建议回到具体宫位、四化和现实问题逐项核对。`;isHtml=true;}
    else{html=esc(D.patterns[name]||(window.GXG_PATTERNS||{})[name]||D.patternDefault)+'<br><br><span class="hint">传统组合标签只描述所采用的匹配规则，不用于预测成败。</span>';}
  }
  else if(kind==='brightness') html = esc(D.brightness[name] || '') + '<br><br><span class="hint">亮度只是所采用传统表格中的分类，不是客观测量结果；请在设置中核对排盘体系。</span>'; 
  else if(kind==='palace'){
    const p = D.palaces.find(p => p.name === name);
    html = p ? `<b>${esc(p.modern)}</b> · ${esc(p.keywords)}<br><br>${esc(p.desc)}<br><br><span class="hint">宫位是传统解读的主题分类，不代表相关事情必然发生，也不能用来给家人或伴侣下定论。</span>` : '';
    // 有盘时：加上命主此宫的具体信息
    const rec0 = cur();
    if(rec0){
      const pl = palaceByName(rec0.chart, name);
      if(pl){
        const majors = pl.stars.filter(s => s.type === 'major')
          .map(s => `${esc(s.name)}${s.siHua ? shBadge(s.siHua) : ''}${s.brightnessRaw ? esc(s.brightnessRaw) : ''}`).join('、') || '空宫';
        const dx = pl.daXianAge ? ` · 大限${pl.daXianAge[0]}–${pl.daXianAge[1]}岁` : '';
        const ms = (pl.isMingGong ? '（命宫）' : '') + (pl.isShenGong ? '（身宫）' : '');
        html += `<br><br><b>${esc(rec0.name)} 的${esc(name)}${ms}</b>：${ST[pl.stem]}${BR[pl.branch]}${dx}<br>主星：${majors}`;
        // 干货：主星白话 + 辅煞 + 三方四正
        const majorList = pl.stars.filter(s => s.type === 'major');
        majorList.slice(0, 2).forEach(s => {
          if(D.stars[s.name]) html += `<br><br><b>${esc(s.name)}</b>：${esc(D.stars[s.name])}`;
        });
        const minors0 = pl.stars.filter(s => s.type !== 'major');
        if(minors0.length) html += `<br><br>辅煞：${minors0.map(s => esc(s.name) + (s.siHua ? shBadge(s.siHua) : '')).join('、')}`;
        const sf0 = [pl.branch, (pl.branch + 6) % 12, (pl.branch + 4) % 12, (pl.branch + 8) % 12].map(b => {
          const q = palaceByBranch(rec0.chart, b);
          const qm = q.stars.filter(s => s.type === 'major').map(s => s.name).join('') || '空';
          return `${disp(q.name)}${qm}`;
        });
        html += `<br><br>三方四正：${sf0.map(esc).join(' · ')}`;
      }
      // 四化入宫断语（有盘时）：本宫的化星各一句
      const hits = pl ? pl.stars.filter(s => s.siHua).map(s => `${esc(s.name)}化${esc(s.siHua)}：${esc(safeSihuaNote(s.name,s.siHua,name))}`) : [];
      if(hits.length) html += '<br><br>' + hits.join('<br>');
    }
    isHtml = true;
  }
  modal(name, isHtml ? html : html.replace(/\n/g, '<br>'));
}

/* ---------- 排盘页：排过的盘快捷入口 ---------- */
function renderInputHistory(){
  const box = $('#input-history-card');
  if(!archive.length){ box.hidden = true; return; }
  box.hidden = false;
  $('#input-history').innerHTML = archive.map(a =>
    `<button class="chip${a.id===currentId?' on':''}" data-open-arch="${a.id}">${esc(a.name)}</button>`).join('');
}
document.addEventListener('click', e => {
  const c = e.target.closest('[data-open-arch]');
  if(!c) return;
  currentId = c.dataset.openArch; store.set('gxg_current', currentId);
  luckMode = 'natal'; luckParam = null;
  renderChart(); nav('chart');
});

/* ---------- 表单初始化 ---------- */
function fillSelect(sel, items, placeholder){
  sel.innerHTML = '';
  if(placeholder){ const o = document.createElement('option'); o.value=''; o.textContent = placeholder; sel.appendChild(o); }
  items.forEach(([v,t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); });
}
function initForm(){
  const nowY = bjDate().y;
  const years = []; for(let y=nowY; y>=1950; y--) years.push([y, y+'年']);
  fillSelect($('#f-year'), years, '年');
  fillSelect($('#f-month'), Array.from({length:12},(_,i)=>[i+1,(i+1)+'月']), '月');
  fillSelect($('#f-day'), Array.from({length:31},(_,i)=>[i+1,(i+1)+'日']), '日');
  fillSelect($('#f-hour'), SHICHEN.map(s=>[s.v, s.label+'（'+s.range+'）']), '请选择时辰');
  const ph = [2,4,6,8,10,12,14,16,18,20,22]; // 精确时间：时
  // 省市
  fillSelect($('#f-province'), E.PROVINCES.map(p=>[p.name,p.name]), '请选择省份');
  $('#f-province').addEventListener('change', () => {
    const p = E.PROVINCES.find(p => p.name === $('#f-province').value);
    fillSelect($('#f-city'), (p?p.cities:[]).map(c=>[c.name+'|'+c.longitude, c.name]), '请选择城市');
    updateDstHint();
  });
  $('#f-city').addEventListener('change', updateDstHint);
  ['#f-year','#f-month','#f-day'].forEach(s => $(s).addEventListener('change', updateDstHint));
  // 性别 seg
  $('#f-gender').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    $$('#f-gender button').forEach(x => x.classList.toggle('on', x===b));
  });
  $('#f-tag').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    $$('#f-tag button').forEach(x => x.classList.toggle('on', x===b));
  });
  // 默认值：1990-05-15 午时
  $('#f-year').value = 1995; $('#f-month').value = 6; $('#f-day').value = 15; $('#f-hour').value = 6;
  // 精确时间（可选）：时 0-23，分 0-59
  const eh = $('#f-exhour'), em = $('#f-exmin');
  for(let h=0; h<24; h++){ const o=document.createElement('option'); o.value=h; o.textContent=pad2(h)+' 时'; eh.appendChild(o); }
  for(let m=0; m<60; m+=1){ const o=document.createElement('option'); o.value=m; o.textContent=pad2(m)+' 分'; em.appendChild(o); }
  const checkBoundary = () => {
    const hint = $('#boundary-hint'); hint.textContent = '';
    if(eh.value === '' || em.value === '') return;
    const mins = (+eh.value)*60 + (+em.value);
    // 时辰交界在奇数整点（23/1/3/5…时）；前后 10 分钟内提示
    const bounds = [0,60,180,300,420,540,660,780,900,1020,1140,1260,1380];
    const near = bounds.some(b => { const d = Math.abs(mins - b); return Math.min(d, 1440 - d) <= 10; });
    if(near) hint.textContent = '接近时辰交界（前后 10 分钟），排盘可能差一个时辰。建议排完后用「定盘验证辅助」核对一下。';
  };
  eh.addEventListener('change', checkBoundary); em.addEventListener('change', checkBoundary);
  // 选了晚子时才显示"换日派"口径开关（默认不勾＝同多数工具不换日）
  const syncLateziRow = () => { $('#latezi-row').hidden = (+$('#f-hour').value) !== 12; };
  $('#f-hour').addEventListener('change', syncLateziRow);
  // 填精确时间时自动同步时辰下拉，避免"精确 0:10 + 下拉停在默认午时"的错位
  const syncHourFromExact = () => {
    if(eh.value === '') return;
    const h = +eh.value;
    const b = Math.floor(((h + 1) % 24) / 2);
    $('#f-hour').value = h === 23 ? 12 : b;
    syncLateziRow();
  };
  eh.addEventListener('change', syncHourFromExact);
  $('#birth-form').addEventListener('submit', onSubmit);
  $('#f-unknown-hour').addEventListener('change', e => {
    if(e.target.checked){ nav('dingpan'); e.target.checked = false; }
  });
}
function updateDstHint(){
  const y = +$('#f-year').value, m = +$('#f-month').value, d = +$('#f-day').value;
  const hint = $('#dst-hint');
  const prov = $('#f-province') ? $('#f-province').value : '';
  if(y && m && d && dstApplies(y, m, d, prov)){
    hint.textContent = `注意：你出生在 ${y} 年夏令时期间，当时时钟拨快了 1 小时，排盘会自动扣回。`;
  } else hint.textContent = '';
}
/* 夏令时口径：大陆仅 1986–1991 实行过全国夏令时；引擎表里的 1950–1979 项是台湾夏令时，
 * 只有出生地在台湾时才套用（香港同理按引擎表）。无省份信息时按大陆口径。 */
function dstApplies(y, m, d, province){
  if(!E.isChinaDST(y, m, d)) return false;
  if(province && /台湾|香港/.test(province)) return true;
  return y >= 1986 && y <= 1991;
}
function segVal(id){ const b = document.querySelector('#'+id+' button.on'); return b ? b.dataset.v : null; }

/* ---------- 排盘管线 ---------- */
function shiftDate(y,m,d,offset){
  const dt = new Date(y, m-1, d + offset);
  return { y: dt.getFullYear(), m: dt.getMonth()+1, d: dt.getDate() };
}
function computeChart(input){
  // input: {name, gender, year, month, day, shichen(0-12), exHour, exMin, province, city, longitude, trueSolar, lateZiNextDay}
  let clockHour, clockMinute;
  if(input.exHour !== '' && input.exHour != null){
    clockHour = +input.exHour; clockMinute = +(input.exMin || 0);
  } else {
    [clockHour, clockMinute] = SHICHEN_MID[input.shichen];
  }
  let branch, dayOffset = 0, note = [];
  const shichenBranch = input.shichen === 12 ? 0 : input.shichen; // 晚子时=子
  const hasExact = input.exHour !== '' && input.exHour != null;
  const exBranch = Math.floor(((clockHour + 1) % 24) / 2); // 精确时间对应的时辰支
  const branchName = b => b === 0 ? '子时' : SHICHEN[b].label;
  if(input.trueSolar && input.longitude != null){
    let ch = clockHour, cm = clockMinute;
    if(dstApplies(input.year, input.month, input.day, input.province)){ cm -= 60; note.push('已按夏令时扣回 1 小时'); }
    // 夏令时扣回可能使分钟为负，先归一化再送引擎
    let tot = ch * 60 + cm;
    if(tot < 0) tot += 1440;
    ch = Math.floor(tot / 60); cm = tot % 60;
    const solar = E.calculateTrueSolarTime({ year: input.year, month: input.month, day: input.day, clockHour: ch, clockMinute: cm, longitude: input.longitude });
    branch = solar.branch;
    // 口径对齐测测/问真等主流工具：真太阳时只用来定时辰，排盘日一律按公历出生日，
    // 不因校正跨午夜而前后挪日。换日派仅在真太阳钟点为 23 点（晚子时）时按次日。
    dayOffset = 0;
    if(input.lateZiNextDay && branch === 0 && solar.hour === 23){
      dayOffset = solar.dayOffset === -1 ? 0 : 1;
      note.push('晚子时按次日排盘（换日派）');
    }
    const corrMin = Math.round(solar.totalCorrectionMinutes);
    note.push('真太阳时校正 ' + (corrMin>=0?'+':'') + corrMin + ' 分钟（只定时辰，排盘日按公历出生日不变）');
    const baseBranch = hasExact ? exBranch : shichenBranch;
    if(branch !== baseBranch) note.push('校正后时辰由' + branchName(baseBranch) + '变为' + branchName(branch));
  } else {
    // 未勾真太阳时：精确时间直接决定时辰（此前只记提示未生效，属口径与行为不一致，已修正）
    branch = hasExact ? exBranch : shichenBranch;
    if(hasExact && exBranch !== shichenBranch) note.push('你填的精确时间与所选时辰不一致，已按精确时间（' + branchName(branch) + '）排盘');
    if(input.shichen === 12 || (hasExact && clockHour === 23)){
      if(input.lateZiNextDay){ dayOffset = 1; note.push('晚子时按次日排盘（换日派）'); }
      else note.push('晚子时默认不换日；需要次日换日口径时可在设置中勾选');
    }
  }
  const pd = shiftDate(input.year, input.month, input.day, dayOffset);
  if(dayOffset !== 0 && input.shichen !== 12 && input.trueSolar) note.push('排盘日顺延至 ' + pd.m + '月' + pd.d + '日');
  setActiveSihuaTable(input.sihuaTable || getStoredSihuaTable());
  const chart = E.generateChart({
    year: pd.y, month: pd.m, day: pd.d, hour: branch, gender: input.gender,
    name: input.name || undefined,
    province: input.province || undefined, city: input.city || undefined,
    longitude: input.longitude,
    origInput: { year: input.year, month: input.month, day: input.day, clockHour, clockMinute },
  });
  applySihuaTableToChart(chart);
  attachSelfSihua(chart);
  return { chart, note };
}
/* 引擎 generateChart 不挂自化，这里统一补上：buildAllSelfSihua 返回 {branch:[{siHua,starName}]} */
function attachSelfSihua(chart){
  chart.palaces.forEach(p=>{
    const byStar=transformsForStem(p.stem);
    p.selfSihua=SIHUA_ORDER.filter(h=>p.stars.some(s=>s.name===byStar[h])).map(h=>({siHua:h,starName:byStar[h]}));
  });
}
function onSubmit(e){
  e.preventDefault();
  const err = $('#form-error'); err.textContent = '';
  const y = +$('#f-year').value, m = +$('#f-month').value, d = +$('#f-day').value;
  const shichen = $('#f-hour').value === '' ? null : +$('#f-hour').value;
  if(!y || !m || !d){ err.textContent = '请把公历生日选完整。'; return; }
  if(!segVal('f-gender')){err.textContent='请先选择排盘使用的性别口径；传统大限顺逆按此设置计算。';return;}
  // 防止 new Date 静默滚日（如 2 月 30 日变成 3 月 2 日）：先验日期真实存在
  if(!E.isValidGregorianDate(y,m,d)){
    err.textContent = '这天不存在，请检查日期（比如 2 月没有 30 日）。'; return;
  }
  if(shichen == null){ err.textContent = '请选择出生时辰（实在不知道可以去定盘辅助）。'; return; }
  const cityVal = $('#f-city').value;
  const longitude = cityVal ? parseFloat(cityVal.split('|')[1]) : null;
  // 真太阳时勾了但没选出生地：不硬阻断，给一键改用普通时间的出口
  if($('#f-true-solar').checked && longitude == null){
    err.innerHTML = '勾了「真太阳时校正」但还没选出生地（校正需要经度）。' +
      '<button type="button" class="link-btn" id="skip-truesolar">不校正，直接排 ›</button>' +
      ' <span class="hint">或先在上方选省市</span>';
    const skip = $('#skip-truesolar');
    if(skip) skip.addEventListener('click', () => { $('#f-true-solar').checked = false; $('#birth-form').requestSubmit(); });
    err.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return;
  }
  const exHour = $('#f-exhour').value, exMin = $('#f-exmin').value;
  const input = {
    name: $('#f-name').value.trim(),
    gender: segVal('f-gender'),
    year: y, month: m, day: d, shichen,
    exHour: exHour === '' ? '' : exHour, exMin: exMin === '' ? '' : exMin,
    province: $('#f-province').value || '',
    city: cityVal ? cityVal.split('|')[0] : '',
    longitude,
    trueSolar: $('#f-true-solar').checked && longitude != null,
    lateZiNextDay: $('#f-latezi-next').checked,
    tag: segVal('f-tag') || '我',
    sihuaTable: getStoredSihuaTable(),
  };
  try{
    const { chart, note } = computeChart(input);
    const rec = { id: uid(), name: input.name || ('命盘'+(archive.length+1)), tag: input.tag,
      gender: input.gender, input: Object.assign({}, input, {longitude}),
      chart, note, createdAt: Date.now() };
    archive.unshift(rec);
    if(archive.length > 20) archive.length = 20;
    store.set('gxg_archive', archive);
    currentId = rec.id; store.set('gxg_current', currentId);
    luckMode = 'natal'; luckParam = null;
    renderChart();
    nav('chart');
  }catch(ex){
    const bad = /does not exist/i.test(ex.message || '');
    err.textContent = bad ? '这天不存在，请检查日期（比如 2 月没有 30 日）。' : ('排盘失败：' + (ex.message || '日期无效'));
  }
}

/* ---------- 命盘渲染 ---------- */
let luckMode = 'natal', luckParam = null, lastLiuNianYear = null; // natal | daxian(idx) | liunian(year) | liuyue({y,lm}) | liuri({y,lm,ld})
let sanfangBranch = null; // 三方四正联动：当前选中的宫位地支，null 表示未选中
/* 三方四正：本宫 + 对宫 + 三合两宫 */
function sanfangBranches(b){
  b = ((b % 12) + 12) % 12;
  return [b, (b + 6) % 12, (b + 4) % 12, (b + 8) % 12];
}

function palaceByName(chart, name){ return chart.palaces.find(p => p.name === name || disp(p.name) === name); }
function palaceByBranch(chart, b){ return chart.palaces.find(p => p.branch === ((b%12)+12)%12); }

function starHtml(s, activeSihua){
  const natal = s.siHua ? shBadge(s.siHua) : '';
  const liveMap = activeSihua ? { '禄': activeSihua.lu, '权': activeSihua.quan, '科': activeSihua.ke, '忌': activeSihua.ji } : {};
  const live = Object.entries(liveMap).filter(([, star]) => star === s.name).map(([hua]) => {
    const cls = { '禄': 'sh-lu', '权': 'sh-quan', '科': 'sh-ke', '忌': 'sh-ji' }[hua] || '';
    return `<span class="sihua sihua-live ${cls}" title="当前运限化${hua}">运${hua}</span>`;
  }).join('');
  const br = s.brightnessRaw ? `<span class="br br-${s.brightnessRaw}">${s.brightnessRaw}</span>` : '';
  return `<span class="star-chip" data-star="${esc(s.name)}">${esc(s.name)}${natal}${live}${br}</span>`;
}
function palaceStarsHtml(p, activeSihua){
  const majors = p.stars.filter(s => s.type==='major');
  const others = p.stars.filter(s => s.type!=='major');
  let h = majors.map(s => starHtml(s, activeSihua)).join('');
  if(others.length) h += '<br>' + others.map(s => starHtml(s, activeSihua));
  if(p.isEmpty && p.borrowedStars && p.borrowedStars.length)
    h += `<div class="hint">空宫，借对宫：${p.borrowedStars.map(esc).join('、')}</div>`;
  return h || '<span class="hint">—</span>';
}

/* 运势叠加：返回 {hlBranch, sihua:{禄,权,科,忌}[], label} */
function luckOverlay(chart){
  if(luckMode === 'natal') return { hlBranch: -1, sihua: null, label: '本命盘' };
  if(luckMode === 'daxian'){
    const dx = chart.daXians[luckParam];
    if(!dx) return { hlBranch: -1, sihua: null, label: '' };
    const sh = normSihua(E.getDaXianSiHua(chart, luckParam));
    return { hlBranch: dx.palaceBranch, sihua: sh, label: `大限 ${dx.startAge}–${dx.endAge} 岁（${disp(dx.palaceName)}）` };
  }
  if(luckMode === 'liunian'){
    const y = luckParam;
    const stem = ((y - 4) % 10 + 10) % 10, branch = ((y - 4) % 12 + 12) % 12;
    const sh = normSihua(E.getLiuNianSiHua(y));
    lastLiuNianYear = y;
    return { hlBranch: branch, sihua: sh, label: `${y} 年流年（${ST[stem]}${BR[branch]}年）命宫在${disp(palaceByBranch(chart,branch).name)}` };
  }
  if(luckMode === 'liuyue'){
    const { y, lm } = luckParam; // lm: 农历月 1-12
    const yearStem = ((y - 4) % 10 + 10) % 10;
    const sh = normSihua(E.getLiuYueSiHua(yearStem, lm));
    const hl = (doujunBranch(chart, y) + (lm - 1)) % 12; // 流月以斗君起正月顺排
    return { hlBranch: hl, sihua: sh, label: `${y} 年农历 ${lm} 月流月 · 流月命宫${disp(palaceByBranch(chart, hl).name)}` };
  }
  if(luckMode === 'liuri'){
    const { y, lm, ld } = luckParam;
    const sh = normSihua(E.getLiuRiSiHua(y, lm, ld));
    const lyueHl = (doujunBranch(chart, y) + (lm - 1)) % 12;
    const hl = (lyueHl + (ld - 1)) % 12; // 流日以流月命宫起初一顺排
    return { hlBranch: hl, sihua: sh, label: `农历 ${lm} 月 ${ld} 日流日 · 流日命宫${disp(palaceByBranch(chart, hl).name)}` };
  }
  return { hlBranch: -1, sihua: null, label: '' };
}
function normSihua(r){
  if(!r) return null;
  const t = r.transforms || {};
  return { stemName: r.stemName || '', lu: r.lu || t['禄'] || '', quan: r.quan || t['权'] || '', ke: r.ke || t['科'] || '', ji: r.ji || t['忌'] || '' };
}
function sihuaStripHtml(sh){
  if(!sh) return '';
  const item = (k, v) => v ? `<span class="sihua-chip"><b>${k}</b> ${esc(v)}</span>` : '';
  const stem = sh.stemName ? `<span class="sihua-chip">${esc(sh.stemName)}干四化</span>` : '';
  return stem + item('禄', sh.lu) + item('权', sh.quan) + item('科', sh.ke) + item('忌', sh.ji);
}
/* 本命四化落宫：{禄:[{star,palace}], 权:…, 科:…, 忌:…} */
function natalSihuaMap(chart){
  const out = {};
  chart.palaces.forEach(p => p.stars.forEach(s => {
    if(s.siHua) (out[s.siHua] = out[s.siHua] || []).push({ star: s.name, palace: disp(p.name) });
  }));
  return out;
}
function sihuaStarPalace(chart, starName){
  if(!starName) return '';
  const p = chart.palaces.find(pl => pl.stars.some(s => s.name === starName));
  return p ? disp(p.name) : '';
}
/* 叠盘：overlay 命宫在 hlBranch 时，branch 处叠着哪一宫（PALACE_ORDER 按命宫起逆排） */
function overlayPalaceAt(hlBranch, branch){
  const off = ((hlBranch - branch) % 12 + 12) % 12;
  return PALACE_ORDER[off];
}
const STACK_THEME = {
  '命宫': '这一年的重心是找回自己的节奏', '兄弟宫': '重心在同辈、合伙与团队关系',
  '夫妻宫': '重心围绕感情与核心合伙人展开', '子女宫': '重心在孩子、下属或自己的作品产出上',
  '财帛宫': '重心是钱：收入结构和花钱方式要动一动', '疾厄宫': '重心在身体与作息，先养人再做事',
  '迁移宫': '重心在外：奔波、搬迁、对外拓展的事多', '交友宫': '重心在人脉圈层，筛选朋友就是筛选运气',
  '官禄宫': '重心压在事业上，是要冲的一年', '田宅宫': '重心在安顿：房子、家人与资产配置',
  '福德宫': '重心向内：适合休整、学习，想清楚再出发', '父母宫': '重心在长辈与平台：跟上级、体制打交道多',
};
const LUCK_PREFIX = { daxian: '限', liunian: '流', liuyue: '流月', liuri: '流日' };
function stackSayHTML(chart, ov){
  if(!ov || ov.hlBranch == null) return '';
  const pre = luckMode === 'daxian' ? '大限' : luckMode === 'liunian' ? '流年' : luckMode === 'liuyue' ? '流月' : '流日';
  const natalAt = palaceByBranch(chart, ov.hlBranch);
  const natalName = natalAt ? disp(natalAt.name) : '';
  let s = `<b>叠盘看</b>：${pre}命宫落在你的本命【${esc(natalName)}】——${esc(STACK_THEME[natalName] || '')}。`;
  if(ov.sihua && ov.sihua.ji){
    const jiPal = sihuaStarPalace(chart, ov.sihua.ji);
    if(jiPal) s += `${pre}${esc(ov.sihua.ji)}化忌落你的本命【${esc(jiPal)}】，这一块是今年的功课，提前留心。`;
  }
  if(ov.sihua && ov.sihua.lu){
    const luPal = sihuaStarPalace(chart, ov.sihua.lu);
    if(luPal) s += `${pre}${esc(ov.sihua.lu)}化禄落【${esc(luPal)}】，顺风在这一块。`;
  }
  return `<div class="overlay-bar" style="margin-bottom:8px"><div>${s}</div></div>`;
}
/* 大限/流年四化叠加提示：双禄/双忌/禄忌交战/化禄解化忌/多层集中 */
function renderOverlayStrip(chart, ov){
  const box = $('#overlay-strip'); box.innerHTML = stackSayHTML(chart, ov);
  if(luckMode !== 'daxian' && luckMode !== 'liunian') return;
  const natal = natalSihuaMap(chart);
  const layers = [{ name: '本命', map: natal }];
  if(luckMode === 'daxian' || luckMode === 'liunian'){
    const dxIdx = (luckMode === 'daxian') ? luckParam : chart.currentDaXianIndex;
    const dxSh = normSihua(E.getDaXianSiHua(chart, dxIdx));
    if(dxSh){
      const m = {};
      ['lu','quan','ke','ji'].forEach(k => {
        const star = dxSh[k]; if(!star) return;
        const key = {lu:'禄',quan:'权',ke:'科',ji:'忌'}[k];
        (m[key] = m[key] || []).push({ star, palace: sihuaStarPalace(chart, star) });
      });
      layers.push({ name: '大限', map: m });
    }
  }
  if(luckMode === 'liunian' && ov.sihua){
    const m = {};
    ['lu','quan','ke','ji'].forEach(k => {
      const star = ov.sihua[k]; if(!star) return;
      const key = {lu:'禄',quan:'权',ke:'科',ji:'忌'}[k];
      (m[key] = m[key] || []).push({ star, palace: sihuaStarPalace(chart, star) });
    });
    layers.push({ name: '流年', map: m });
  }
  // 按宫聚合：palace -> {禄:[layer], 忌:[layer]}
  const agg = {};
  layers.forEach(L => ['禄','忌'].forEach(k => (L.map[k]||[]).forEach(e => {
    if(!e.palace) return;
    const a = agg[e.palace] = agg[e.palace] || { '禄': [], '忌': [] };
    a[k].push(L.name);
  })));
  const msgs = [];
  Object.keys(agg).forEach(pl => {
    const lu = agg[pl]['禄'], ji = agg[pl]['忌'];
    const uniq = a => [...new Set(a)];
    if(uniq(ji).length >= 2) msgs.push({ w: 0, t: `<b>${esc(pl)}双忌叠压</b>（${uniq(ji).map(esc).join('＋')}）：这是这段时间要花心力的地方，别硬扛，慢一点、留余地。` });
    else if(uniq(lu).length >= 1 && uniq(ji).length >= 1) msgs.push({ w: 1, t: `<b>${esc(pl)}禄忌交战</b>（${uniq(lu).map(esc).join('＋')}禄、${uniq(ji).map(esc).join('＋')}忌）：得到和牵挂撞在同一处，好事里掺着功课，拿好处时多留一眼代价。` });
    else if(uniq(lu).length >= 2) msgs.push({ w: 2, t: `<b>${esc(pl)}双禄临门</b>（${uniq(lu).map(esc).join('＋')}）：这段时间${esc(pl)}方面的顺风比较多，适合把重要的事往前排。` });
    else if(uniq(lu).some(l => l !== '本命') && (natal['忌']||[]).some(e => e.palace === pl)) msgs.push({ w: 3, t: `<b>化禄解化忌</b>：运年化禄飞到本命化忌所在的${esc(pl)}，难处里有转机，凶中见吉。` });
    else if(uniq(lu).length + uniq(ji).length >= 3) msgs.push({ w: 4, t: `<b>${esc(pl)}是这段时间的焦点</b>：多层四化落在这里，事情会比较多，值得多分一点注意力。` });
  });
  msgs.sort((a,b) => a.w - b.w);
  if(msgs.length) box.innerHTML += `<div class="overlay-bar">${msgs.slice(0,3).map(m => `<div>${m.t}</div>`).join('')}</div>`;
}

function renderChart(){
  const rec = cur(); if(!rec){ nav('input'); return; }
  setActiveSihuaTable(rec.chart.sihuaTable || rec.input?.sihuaTable || getStoredSihuaTable());
  applySihuaTableToChart(rec.chart);
  attachSelfSihua(rec.chart);
  const chart = rec.chart;
  sanfangBranch = null;
  const ming = palaceByBranch(chart, chart.mingGongBranch);
  const mingMajors = ming.stars.filter(s=>s.type==='major').map(s=>s.name).join('、') || '（空宫）';
  const bi = chart.birthInfo;
  $('#chart-head').innerHTML =
    `<h3>${esc(rec.name)}的完整命盘</h3>
     <div class="meta">公历 ${bi.year} 年 ${bi.month} 月 ${bi.day} 日 · ${BR[bi.hour]}时 · ${bi.gender==='male'?'男':'女'} · ${esc(chart.wuxingJuName)} · 命主${esc(chart.mingZhu||'')} / 身主${esc(chart.shenZhu||'')}</div>
     <div class="meta">命宫主星：${esc(mingMajors)}${rec.note && rec.note.length ? ' · ' + esc(rec.note.join('；')) : ''}</div>`;
  renderLuckPicker();
  renderChartBody();
  renderRetroCard();
  $('#chart-palaces').innerHTML = D.palaces.map((p, i) => palaceCardHTML(p, i, chart)).join('');
}
/* ---------- 过往流年回溯卡：用已发生的年份锚定信任 ---------- */
function retroYears(chart){
  const context = currentLunarContext(chart);
  if(!context.valid) return [];
  const nowY = context.year;
  const birthY = chart.birthInfo.year;
  const natal = natalSihuaMap(chart);
  const natalJiStar = ((natal['忌'] || [])[0] || {}).star;
  const KEY = ['命宫', '官禄宫', '财帛宫', '夫妻宫', '迁移宫'];
  const out = [];
  for(let y = nowY - 1; y >= Math.max(nowY - 8, birthY + 16); y--){
    const yBranch = ((y - 4) % 12 + 12) % 12;
    const liuP = palaceByBranch(chart, yBranch);
    const ySh = normSihua(E.getLiuNianSiHua(y));
    if(!ySh) continue;
    let score = 0; const reasons = [];
    const jiPal = ySh.ji ? sihuaStarPalace(chart, ySh.ji) : '';
    if(jiPal && KEY.includes(jiPal)){ score += 3; reasons.push(`流年${ySh.ji}化忌落进你的【${jiPal}】`); }
    if(ySh.ji && natalJiStar && ySh.ji === natalJiStar){ score += 3; reasons.push(`流年化忌与本命化忌同星，按该流派可作为重复关注主题`); }
    if(liuP){
      const ln = disp(liuP.name);
      if(ln === '命宫'){ score += 2; reasons.push('流年命宫回到本命命宫，是传统上关注自我定位的一个线索'); }
      else if(KEY.includes(ln)){ score += 2; reasons.push(`流年命宫落入本命【${ln}】，可作为该主题的年度观察入口`); }
    }
    if(score >= 3 && reasons.length) out.push({ y, score, text: reasons.slice(0, 2).join('；') });
  }
  out.sort((a, b) => b.score - a.score || b.y - a.y);
  return out.slice(0, 2).sort((a, b) => a.y - b.y);
}
function renderRetroCard(){
  const rec = cur(); const box = $('#retro-card');
  if(!rec){ box.hidden = true; return; }
  if(!currentLunarContext(rec.chart).valid){box.hidden=false;box.innerHTML='<p class="hint">当前日期的农历换算暂不可用，过往流年回看已暂停。</p>';return;}
  const years = retroYears(rec.chart);
  if(!years.length){ box.hidden = true; return; }
  const done = store.get('gxg_retro_' + rec.id, '');
  box.hidden = false;
  box.innerHTML = `<div class="card-kicker">过往流年 · 象意回看</div>
    <p style="margin:0 0 8px">下面年份由传统流年命宫与四化规则筛出，只是盘面触发线索，不表示当年一定有大事，也不能用来证明出生时辰准确。请只对照你愿意分享的真实经历：</p>
    ${years.map(it => `<p style="margin:0 0 6px"><b>${it.y} 年</b>：${esc(it.text)}。</p>`).join('')}
    ${done === 'hit' ? '<p class="hint" style="margin:8px 0 0">✓ 已记录你的主观反馈。共鸣不等于算法验证；今年流年页签显示的是盘面规则线索，解读仍需对照现实信息。</p>'
      : done === 'miss' ? '<p class="hint" style="margin:8px 0 0">你标记过「不太吻合」。这并不能推出出生时辰有误。若需核对，请先查原始出生记录、时区、出生地、真太阳时开关、晚子时换日与闰月口径；不要用事件是否“对上”反向修改出生资料。</p>'
      : `<div style="display:flex;gap:10px;margin-top:10px">
           <button class="btn-primary" id="btn-retro-hit" style="flex:1">这些主题与经历有共鸣</button>
           <button class="btn-ghost" id="btn-retro-miss" style="flex:1;margin-top:0">不吻合？核对出生口径</button>
         </div>`}`;
  const hit = $('#btn-retro-hit'), miss = $('#btn-retro-miss');
  if(hit) hit.addEventListener('click', () => {
    const context=currentLunarContext(rec.chart); if(!context.valid) return;
    store.set('gxg_retro_' + rec.id, 'hit');
    luckMode = 'liunian'; luckParam = context.year;
    renderChart();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  if(miss) miss.addEventListener('click', () => {
    store.set('gxg_retro_' + rec.id, 'miss');
    nav('dingpan');
  });
}
function renderLuckPicker(){
  const rec = cur(); const chart = rec.chart;
  const box = $('#luck-picker'); box.innerHTML = '';
  $$('#luck-tabs button').forEach(b => b.classList.toggle('on', b.dataset.mode === luckMode));
  if(luckMode === 'daxian'){
    const sel = document.createElement('select');
    chart.daXians.forEach((dx, i) => {
      const o = document.createElement('option'); o.value = i;
      o.textContent = `${dx.startAge}–${dx.endAge} 岁 · ${dx.palaceName}`;
      if(i === luckParam) o.selected = true; sel.appendChild(o);
    });
    if(luckParam == null){ luckParam = chart.currentDaXianIndex; sel.value = luckParam; }
    sel.addEventListener('change', () => { luckParam = +sel.value; renderChartBody(); });
    box.appendChild(sel);
  } else if(luckMode === 'liunian'){
    const sel = document.createElement('select');
    const context = currentLunarContext(chart);
    if(!context.valid){ box.innerHTML='<p class="hint">当前日期的农历换算暂不可用，流年选择器已暂停，避免显示错误年份。请稍后重试。</p>'; return; }
    const thisY = context.year;
    const bi = chart.birthInfo || {};
    const yMin = Math.min(thisY - 60, bi.year || thisY);
    const yMax = Math.max(thisY + 30, (bi.year || thisY) + 121);
    for(let y = yMin; y <= yMax; y++){
      const o = document.createElement('option'); o.value = y; o.textContent = y + ' 年';
      if(y === luckParam) o.selected = true; sel.appendChild(o);
    }
    if(luckParam == null){ luckParam = thisY; sel.value = thisY; }
    sel.addEventListener('change', () => { luckParam = +sel.value; renderChartBody(); });
    box.appendChild(sel);
  }
}
$('#luck-tabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  luckMode = b.dataset.mode; luckParam = null;
  renderLuckPicker(); renderChartBody();
});

/* 盘心中枢：罗盘环 + 十二地支刻度 + 大字主星（命盘页/四化盘共用） */
function hubHTML(chart, rec, kind, ySh){
  const li = chart.lunarInfo || {}, bi = chart.birthInfo || {};
  const ring = '<div class="hub-ring" aria-hidden="true">' + [...BR].map((ch, i) => `<i style="--a:${i * 30}deg">${ch}</i>`).join('') + '</div>';
  const seal = '<div class="ci-seal" aria-hidden="true">問星</div>';
  if(kind === 'sihua'){
    const row = h => `<div class="hub-hua">${shBadge(h)}<b>${esc(ySh[h] || '—')}</b><span class="to">→ ${esc(sihuaStarPalace(chart, ySh[h]) || '—')}</span></div>`;
    return `<div class="cell sp-hub">${ring}<div class="hub-core">
      <div class="hub-brand">生年四化 · ${ST[chart.lunarInfo.yearStem]}干</div>
      ${['禄','权','科','忌'].map(row).join('')}
    </div>${seal}</div>`;
  }
  const mingP = chart.palaces.find(p => p.isMingGong);
  const majors = mingP.stars.filter(x => x.type === 'major').map(x => x.name).join(' · ') || '空宫';
  const lx = li.lunarMonth ? `农历${li.isLeapMonth ? '闰' : ''}${li.lunarMonth}月${li.lunarDay}日` : '';
  const fp = li.fourPillars || [];
  const dayStem = fp.length === 4 ? ST.indexOf(fp[2][0]) : -1;
  const pillarLabels = ['年','月','日','时'];
  const pillarHTML = fp.length === 4 ? '<div class="hub-bazi"><div class="hub-bazi-title">四柱八字 <span>BAZI</span></div><div class="hub-bazi-grid">' + fp.map((gz,i)=>{
    const s=ST.indexOf(gz[0]), b=BR.indexOf(gz[1]);
    if(s<0||b<0) return '<div class="hub-pillar"><small>'+pillarLabels[i]+'柱</small><b>—</b></div>';
    const hidden=(HIDDEN_STEMS[b]||[]).map(x=>ST[x]).join(' ');
    return '<div class="hub-pillar '+(i===2?'is-day':'')+'"><small>'+pillarLabels[i]+'柱</small><b class="pillar-stem">'+gz[0]+'</b><b class="pillar-branch">'+gz[1]+'</b><span>'+ (i===2?'日主':shiShen(dayStem,s)) +'</span><small class="pillar-hidden">藏 '+hidden+'</small></div>';
  }).join('')+'</div></div>' : '<div class="hub-bazi hub-bazi-empty">四柱信息暂不可用</div>';
  return `<div class="cell sp-hub">${ring}<div class="hub-core">
    <div class="hub-brand">✦ 问星 · 本命命盘</div>
    <div class="hub-name">${esc(rec.name)} · ${bi.gender === 'male' ? '男命' : '女命'}</div>
    <div class="hub-meta">${bi.year}.${String(bi.month).padStart(2, '0')}.${String(bi.day).padStart(2, '0')} · ${BR[bi.hour]}时 · ${esc(lx)} · ${esc(chart.wuxingJuName || '')}</div>
    <div class="hub-meta">命主 ${esc(chart.mingZhu || '—')} · 身主 ${esc(chart.shenZhu || '—')}</div>
    ${pillarHTML}
    <div class="hub-stars">命宫主星 · ${esc(majors)}</div>
  </div>${seal}</div>`;
}
function renderChartBody(){
  const rec = cur(); if(!rec) return;
  const chart = rec.chart;
  const ov = luckOverlay(chart);
  $('#sihua-strip').innerHTML = (ov.label ? `<div class="hint" style="margin-bottom:6px">${esc(ov.label)}</div>` : '') + sihuaStripHtml(ov.sihua);
  renderOverlayStrip(chart, ov);
  // 三方四正提示条
  const sfb = $('#sanfang-hint');
  if(sanfangBranch != null){
    const p0 = palaceByBranch(chart, sanfangBranch);
    sfb.innerHTML = `<div class="sf-hint">正在看 <b>${esc(disp(p0.name))}</b> 的三方四正（本宫＋对宫＋三合两宫）——看一宫要合看四宫。<button class="btn-ghost" data-palace-detail="${esc(disp(p0.name))}" style="margin-left:8px">看${esc(disp(p0.name))}解读 →</button><br><span class="hint">再点一次宫位取消</span></div>`;
  } else sfb.innerHTML = '<div class="hint" style="margin:6px 0">点任意一宫，高亮它的三方四正一起看。</div>';
  const sfSet = sanfangBranch != null ? new Set(sanfangBranches(sanfangBranch)) : null;
  // 十二宫田字格；中宫跨 2×2，并承载完整四柱
  const grid = $('#chart-grid');
  // 巳午未申 / 辰·中宫·酉 / 卯·中宫·戌 / 寅丑子亥（子=0…亥=11）
  const order = [5,6,7,8, 4,-1,-1,9, 3,-1,-1,10, 2,1,0,11];
  let h = '';
  let centerDone = false;
  order.forEach(b => {
    if(b === -1){
      if(centerDone) return;
      centerDone = true;
      h += hubHTML(chart, rec, 'chart');
      return;
    }
    const p = palaceByBranch(chart, b);
    const tags = [];
    if(p.isMingGong) tags.push('<span class="tag">命</span>');
    if(p.isShenGong) tags.push('<span class="tag">身</span>');
    const hl = ov.hlBranch === b ? ' hl' : '';
    const sf = (sfSet && sfSet.has(b)) ? ' sf' : '';
    const selected = sanfangBranch === b ? ' selected' : '';
    const pressed = sanfangBranch === b ? 'true' : 'false';
    const ovNameG = ov.hlBranch != null ? overlayPalaceAt(ov.hlBranch, b) : '';
    const ovTagG = ovNameG && ['命宫','官禄宫','财帛宫','夫妻宫'].includes(ovNameG)
      ? `<span class="ov-tag">${LUCK_PREFIX[luckMode] || '流'}${ovNameG.replace('宫','')}</span>` : '';
    h += `<div class="cell${hl}${sf}${selected}" data-branch="${b}" role="button" tabindex="0" aria-pressed="${pressed}" aria-label="选择${disp(p.name)}">${tags.join('')}${ovTagG}
      <div class="pname">${disp(p.name)}</div><div class="gz">${ST[p.stem]}${BR[p.branch]}</div>
      <div class="stars">${palaceStarsHtml(p, ov.sihua)}</div>
      ${p.daXianAge ? `<div class="dx">大限 ${p.daXianAge[0]}–${p.daXianAge[1]}</div>` : ''}</div>`;
  });
  grid.innerHTML = h;
  const picker = $('#mobile-palace-picker');
  if(picker){
    const options = PALACE_ORDER.map(name => {
      const palace = palaceByName(chart, name);
      return '<option value="' + palace.branch + '">' + disp(name) + '</option>';
    }).join('');
    picker.innerHTML = '<option value="">选择宫位…</option>' + options;
    picker.value = sanfangBranch == null ? '' : String(sanfangBranch);
  }
  // 移动列表（十二宫顺序）
  const list = $('#chart-list');
  list.innerHTML = PALACE_ORDER.map(name => {
    const p = palaceByName(chart, name);
    const hl = ov.hlBranch === p.branch ? ' style="border:2px solid var(--primary)"' : '';
    const sfAttr = (sfSet && sfSet.has(p.branch)) ? ' data-sf="1"' : '';
    const tags = (p.isMingGong?'命':'') + (p.isShenGong?'身':'');
    const majors0 = p.stars.filter(s => s.type === 'major').map(s => s.name).join('、') || '空宫';
    const ovNameL = ov.hlBranch != null ? overlayPalaceAt(ov.hlBranch, p.branch) : '';
    const ovTagL = ovNameL && ['命宫','官禄宫','财帛宫','夫妻宫'].includes(ovNameL)
      ? ` <span class="star-chip">${LUCK_PREFIX[luckMode] || '流'}${ovNameL.replace('宫','')}</span>` : '';
    return `<div class="palace-row"${hl}${sfAttr} data-branch="${p.branch}">
      <div class="palace-row-head"><div><span class="t">${disp(p.name)}</span>${tags?` <span class="star-chip">${tags}宫</span>`:''}${ovTagL}
        <div class="s">${ST[p.stem]}${BR[p.branch]}${p.daXianAge?` · 大限${p.daXianAge[0]}–${p.daXianAge[1]}`:''} · ${majors0}</div></div>
        <span class="arrow">›</span></div>
      <div class="palace-row-body">${palaceStarsHtml(p, ov.sihua)}
        ${p.selfSihua && p.selfSihua.length ? `<div class="hint">自化：${p.selfSihua.map(s=>s.starName+s.siHua).join('、')}</div>` : ''}
        <div style="margin-top:8px"><button class="btn-ghost" data-palace-detail="${esc(disp(p.name))}">看${esc(disp(p.name))}解读 →</button>
        <button class="btn-ghost" data-sanfang="${p.branch}">看三方四正</button></div>
      </div></div>`;
  }).join('');
  // 格局
  let pats = [];
  try{ pats = E.detectPatterns(chart); }catch(e){}
  window.GXG_PATTERNS = {};
  pats.forEach(pt => { if(pt.description) window.GXG_PATTERNS[pt.name] = pt.description; });
  $('#pattern-list').innerHTML = pats.length ? pats.map(pt => {
      const v2=window.GXG_PATTERNS_V2&&window.GXG_PATTERNS_V2[pt.name];
      const condition=v2&&v2.condition?'识别条件：'+v2.condition+'。':'识别条件见本站当前规则定义。';
      return `<div class="pat" data-pattern="${esc(pt.name)}"><h5>${esc(pt.name)}<span class="lvl">组合标签</span></h5><p>${esc(condition)}命中标签只表示满足一组传统组合条件，不代表命格等级、个人能力或现实成败；请结合盘面事实和现实经历阅读。</p></div>`;
    }).join('') : '<div class="empty">当前规则下未识别到已收录的组合标签；这不代表命盘缺少特点。</div>';
  // 当前解读上下文
  window.GXG_CTX = { chart, rec };
  renderShengongCard(chart);
  renderWuxingjuCard(chart);
  renderHuajiCard(chart);
  renderBaziCard(chart);
  renderDayunCard(chart);
  renderTimelineCard(chart);
  renderFeixingCard(chart);
  renderChartSihua(chart);
  renderOverlayGrid(chart, ov);
  renderKoujingCard(rec);
  renderBriefCard(chart);
  renderHeCard();
  applyCollapseState();
}
/* ---------- 节气与八字大运（Meeus 低精度太阳黄经，日界级精度足够） ---------- */
function sunLongitude(jd){
  const T = (jd - 2451545) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const Mr = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * Math.PI / 180;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) + 0.000289 * Math.sin(3 * Mr);
  const omega = (125.04 - 1934.136 * T) * Math.PI / 180;
  return ((L0 + C - 0.00569 - 0.00478 * Math.sin(omega)) % 360 + 360) % 360;
}
const _angDiff = (a, b) => { let d = (a - b) % 360; if(d > 180) d -= 360; if(d < -180) d += 360; return d; };
/* 求 jd0 起第一个黄经==target 的 JD（若 jd0 已过 target，先回退） */
function _seekTerm(jd0, target){
  let lo = jd0;
  const f = j => _angDiff(sunLongitude(j), target);
  if(f(lo) > 0){ let t = lo - 1, g = 0; while(f(t) > 0 && g++ < 45) t -= 1; lo = t; }
  let hi = lo + 36, g = 0;
  while(hi - lo > 1e-6 && g++ < 60){ const m = (lo + hi) / 2; if(f(m) < 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
/* 某时刻的前一节与后一节（大运用"节"，不用中气）：黄经 = 15°×奇数 */
function prevNextJie(dateMs){
  const jd = dateMs / 86400000 + 2440587.5;
  const lam = sunLongitude(jd);
  let nd = Math.ceil(lam / 15) * 15; if((nd / 15) % 2 !== 1) nd += 15;
  let pd = Math.floor(lam / 15) * 15; if((pd / 15) % 2 !== 1) pd -= 15;
  return { prevJD: _seekTerm(jd - 31, ((pd % 360) + 360) % 360), nextJD: _seekTerm(jd, nd % 360) };
}
function renderDayunCard(chart){
  const card = $('#dayun-card'), body = $('#dayun-body');
  const fp = chart.lunarInfo && chart.lunarInfo.fourPillars;
  if(!fp || fp.length !== 4){ card.hidden = true; return; }
  try{
    const bi = chart.birthInfo;
    const birthMs = Date.UTC(bi.year, bi.month - 1, bi.day, 12);
    const { prevJD, nextJD } = prevNextJie(birthMs);
    const birthJD = birthMs / 86400000 + 2440587.5;
    const yearStem = ST.indexOf(fp[0][0]);
    const yangYear = YANG_STEM[yearStem] === 1;
    const male = bi.gender !== 'female';
    const forward = (yangYear && male) || (!yangYear && !male); // 阳男阴女顺
    const distDays = Math.abs((forward ? nextJD : prevJD) - birthJD);
    const years = Math.floor(distDays / 3), remDays = distDays - years * 3;
    const remMonths = Math.round(remDays * 4); // 1日=4月
    const monthK = gz60(ST.indexOf(fp[1][0]), BR.indexOf(fp[1][1]));
    const startAge = years + remMonths / 12;
    const birthY = bi.year;
    const nowAge = chart.currentAge != null ? chart.currentAge : null;
    const rows = [];
    for(let i = 1; i <= 9; i++){
      const k = ((forward ? monthK + i : monthK - i) % 60 + 60) % 60;
      const a1 = Math.round(years + (i - 1) * 10 + remMonths / 12), a2 = a1 + 9;
      const cur = nowAge != null && nowAge >= a1 && nowAge <= a2;
      rows.push(`<tr${cur ? ' class="cur"' : ''}><td>${cur ? '▶' : i}</td><td class="dy-gz"><b>${ST[k % 10]}${BR[k % 12]}</b></td>` +
        `<td>${a1}–${a2} 岁</td><td>${birthY + a1}–${birthY + a2}</td></tr>`);
    }
    body.innerHTML =
      `<p class="hint" style="margin:0 0 8px">${yangYear ? '阳' : '阴'}年${male ? '男' : '女'}，大运${forward ? '顺' : '逆'}排；` +
      `距${forward ? '下一' : '上一'}个节气 ${distDays.toFixed(1)} 天，按「3 日折 1 年」约 <b>${years} 岁${remMonths ? ' ' + remMonths + ' 个月' : ''}</b>起运。</p>` +
      `<table class="fx-table dy-table"><tr><th></th><th>大运</th><th>岁段</th><th>年份</th></tr>${rows.join('')}</table>` +
      `<p class="hint" style="margin:8px 0 0">起运时间由天文节气计算（误差约数分钟）；岁段按虚岁习惯四舍五入对齐，仅供参照。</p>`;
    card.hidden = false;
  }catch(e){ card.hidden = true; }
}
/* ---------- 犯太岁提醒（民俗参考，克制表述） ---------- */
const XING_GROUPS = [[2,5,8],[1,7,10],[0,3]];            // 寅巳申 / 丑未戌 / 子卯
const ZIXING = [4,6,9,11];                                // 辰午酉亥自刑
const HAI_PAIRS = [[0,7],[1,6],[2,5],[3,4],[8,11],[9,10]]; // 六害
function taisuiOf(year){
  const yb = ((year - 4) % 12 + 12) % 12;
  const zodiac = b => E.ZODIAC_CN ? E.ZODIAC_CN[b] : '鼠牛虎兔龙蛇马羊猴鸡狗猪'[b];
  const out = { year, ygz: ST[((year - 4) % 10 + 10) % 10] + BR[yb], items: [] };
  out.items.push({ k:'值太岁', branches:[yb], say:'本命年是民俗分类之一；是否参与相关仪式由个人选择，不代表现实风险增加' });
  out.items.push({ k:'冲太岁', branches:[(yb + 6) % 12], say:'民俗将其称为“冲太岁”，属于传统文化说法；不表示当年必有变动' });
  const xg = XING_GROUPS.find(g => g.includes(yb));
  const xb = xg ? xg.filter(x => x !== yb) : (ZIXING.includes(yb) ? [yb] : []);
  if(xb.length) out.items.push({ k:'刑太岁', branches:xb, say:'“刑太岁”是民俗标签，不构成冲突预告；合同和人际问题一贯应按事实与条款处理' });
  const hai = (HAI_PAIRS.find(p => p.includes(yb)) || []).filter(x => x !== yb);
  if(hai.length) out.items.push({ k:'害太岁', branches:hai, say:'“害太岁”是民俗标签，不预示暗损或疾病；健康问题请依据医疗建议处理' });
  return out;
}
function renderTaisuiCard(){
  const card = $('#taisui-card'), body = $('#taisui-body');
  if(!card) return;
  const current=currentLunarContext(cur()&&cur().chart);
  if(!current.valid){card.hidden=false;body.innerHTML='<p class="hint">当前日期的农历换算暂不可用，太岁年份暂不显示。</p>';return;}
  const year = current.year;
  const ts = taisuiOf(year);
  const rec = cur();
  let mine = '';
  if(rec){
    const myB = (rec.chart.lunarInfo&&Number.isInteger(rec.chart.lunarInfo.yearBranch))?rec.chart.lunarInfo.yearBranch:((rec.chart.birthInfo.year-4)%12+12)%12;
    const hits = [];
    ts.items.forEach(it => { if(it.branches.includes(myB)) hits.push(it.k); });
    if(hits.length) mine = `<p style="margin:8px 0 0"><b style="color:var(--gold)">你属${'鼠牛虎兔龙蛇马羊猴鸡狗猪'[myB]}，今年${hits.join('＋')}</b>——民俗做法参考即可，心态上当作"今年谨慎些、好事多做些"。</p>`;
    else mine = `<p class="hint" style="margin:8px 0 0">你属${'鼠牛虎兔龙蛇马羊猴鸡狗猪'[myB]}，今年不犯太岁。</p>`;
  }
  body.innerHTML =
    `<div class="ts-year"><b>${ts.year} ${ts.ygz}年</b><span>太岁值年 · 民俗提醒</span></div>` +
    ts.items.map(it => `<div class="ts-row"><span class="ts-k">${it.k}</span>` +
      it.branches.map(b => `<span class="ts-z">${'鼠牛虎兔龙蛇马羊猴鸡狗猪'[b]}</span>`).join('') +
      `<span class="ts-say">${esc(it.say)}</span></div>`).join('') + mine +
    `<p class="hint" style="margin:8px 0 0">民俗参考，不构成任何决策建议。</p>`;
  card.hidden = false;
}
const WX_OF_STEM = ['木','木','火','火','土','土','金','金','水','水'];   // 甲乙丙丁戊己庚辛壬癸
const YANG_STEM  = [1,0,1,0,1,0,1,0,1,0];
const HIDDEN_MAIN = [9,5,0,1,4,2,3,5,6,7,4,8]; // 支本气：子癸 丑己 寅甲 卯乙 辰戊 巳丙 午丁 未己 申庚 酉辛 戌戊 亥壬
const HIDDEN_STEMS = [[9],[5,9,7],[0,2,4],[1],[4,1,9],[2,4,6],[3,5],[5,3,1],[6,8,4],[7],[4,7,3],[8,0]]; // 常用子平藏干表
const NA_YIN = ['海中金','炉中火','大林木','路旁土','剑锋金','山头火','涧下水','城头土','白蜡金','杨柳木',
  '泉中水','屋上土','霹雳火','松柏木','长流水','沙中金','山下火','平地木','壁上土','金箔金',
  '覆灯火','天河水','大驿土','钗钏金','桑柘木','大溪水','沙中土','天上火','石榴木','大海水'];
function shiShen(dayStem, t){
  const dw = WX_OF_STEM[dayStem], tw = WX_OF_STEM[t];
  const same = YANG_STEM[dayStem] === YANG_STEM[t];
  if(dw === tw) return same ? '比肩' : '劫财';
  const sheng = {木:'火',火:'土',土:'金',金:'水',水:'木'}, ke = {木:'土',土:'水',水:'火',火:'金',金:'木'};
  if(sheng[dw] === tw) return same ? '食神' : '伤官';
  if(ke[dw] === tw) return same ? '偏财' : '正财';
  if(ke[tw] === dw) return same ? '七杀' : '正官';
  return same ? '偏印' : '正印';
}
function gz60(stem, branch){ for(let k = 0; k < 60; k++){ if(k % 10 === stem && k % 12 === branch) return k; } return 0; }
/* 八字人话字典：日主 + 十神 + 五行强弱（粗断，克制表述） */
const SHI_SHEN_GROUP = { '比肩':'比劫','劫财':'比劫','食神':'食伤','伤官':'食伤','偏财':'财星','正财':'财星','七杀':'官杀','正官':'官杀','偏印':'印星','正印':'印星' };
/* 旧版性格与评级断语已移除；页面仅保留可核对的四柱、十神和五行计数。 */
function renderBaziCard(chart){
  const card=$('#bazi-card'),body=$('#bazi-body'),fp=chart.lunarInfo&&chart.lunarInfo.fourPillars;
  if(!fp||fp.length!==4){card.hidden=true;return;}
  const cols=fp.map(gz=>ST.indexOf(gz[0])!==-1?{s:ST.indexOf(gz[0]),b:BR.indexOf(gz[1])}:null);
  if(cols.some(c=>!c||c.s<0||c.b<0)){card.hidden=true;return;}
  const dayS=cols[2].s,pillarNames=['年柱','月柱','日柱','时柱'];let h='<table class="bazi-table"><tr><th></th>'+pillarNames.map(n=>'<th>'+n+'</th>').join('')+'</tr>';
  h+='<tr><td class="lab">天干</td>'+cols.map((c,i)=>'<td><b class="gz-b">'+fp[i][0]+'</b><span class="ss">'+(i===2?'日主':shiShen(dayS,c.s))+'</span></td>').join('')+'</tr>';
  h+='<tr><td class="lab">地支</td>'+cols.map(c=>'<td><b class="gz-b">'+BR[c.b]+'</b><span class="ss">'+shiShen(dayS,HIDDEN_MAIN[c.b])+'</span></td>').join('')+'</tr>';
  h+='<tr class="hidden-stem-row"><td class="lab">藏干</td>'+cols.map(c=>'<td><div class="hidden-stems">'+HIDDEN_STEMS[c.b].map(s=>'<span><b>'+ST[s]+'</b><i>'+shiShen(dayS,s)+'</i></span>').join('')+'</div></td>').join('')+'</tr>';
  h+='<tr><td class="lab">纳音</td>'+cols.map(c=>'<td><span class="ny">'+NA_YIN[Math.floor(gz60(c.s,c.b)/2)]+'</span></td>').join('')+'</tr></table>';
  const wx={金:0,木:0,水:0,火:0,土:0};cols.forEach(c=>{wx[WX_OF_STEM[c.s]]++;wx[WX_OF_STEM[HIDDEN_MAIN[c.b]]]++;});const WXC={金:'#8C6D3F',木:'#75855F',水:'#5F6E7A',火:'#B0523A',土:'#8B8477'};
  h+='<div class="bz-sec">五行计数 · 干与支主气</div><div class="wx-bars">'+Object.keys(wx).map(k=>'<div class="wx-row"><span class="wx-name">'+k+'</span><div class="wx-track"><div class="wx-fill" style="width:'+wx[k]/8*100+'%;background:'+WXC[k]+'"></div></div><span class="wx-n">'+wx[k]+'</span></div>').join('')+'</div>';
  const sgCount={'比劫':0,'食伤':0,'财星':0,'官杀':0,'印星':0};cols.forEach((c,i)=>{if(i!==2){const t=shiShen(dayS,c.s);sgCount[SHI_SHEN_GROUP[t]]++;}const bt=shiShen(dayS,HIDDEN_MAIN[c.b]);sgCount[SHI_SHEN_GROUP[bt]]++;});
  h+='<div class="bz-sec">十神简化计数 · 可展开查看藏干</div><div class="wx-bars">'+Object.keys(sgCount).map(k=>'<div class="wx-row"><span class="wx-name" style="width:32px">'+k+'</span><div class="wx-track"><div class="wx-fill" style="width:'+sgCount[k]/7*100+'%;background:#5F74C4"></div></div><span class="wx-n">'+sgCount[k]+'</span></div>').join('')+'</div>';
  h+='<p class="hint" style="margin:8px 0 0">五行计数只统计四个天干与四个地支的主气；十神计数统计非日主天干和各支主气，未按藏干权重、月令、节气深浅等规则加权。它们是可见信息摘要，不能据此判断日主强弱、喜用神、性格、职业或财富。若要做专业子平分析，需明确流派和完整旺衰取用规则。</p><p class="hint">四柱按节气口径计算；紫微斗数的农历年柱可能与四柱年柱不同，尤其在春节与立春前后。纳音和十神均按本站当前表格转换显示。</p>';
  body.innerHTML=h;card.hidden=false;
}
/* ---------- 宫干飞星卡：十二宫天干各自飞出的禄/忌落在哪 ---------- */
function renderFeixingCard(chart){
  const card = $('#feixing-card'), body = $('#feixing-body');
  try{
    const findPal = star => {
      const q = chart.palaces.find(pl => pl.stars.some(s => s.name === star));
      return q ? disp(q.name).replace('宫','') : '命外';
    };
    const rows = chart.palaces.map(p => {
      const sh = E.getSiHuaByStem(p.stem) || {};
      const cell = (star, hua, cls) => star ? `${findPal(star)}<span class="fx-star ${cls || ''}">${star}${hua}</span>` : '—';
      return `<tr><td class="fx-g"><b>${disp(p.name).replace('宫','')}</b><span class="fx-gz">${ST[p.stem]}</span></td>` +
        `<td>${cell(sh['禄'], '禄')}</td>` +
        `<td>${cell(sh['权'], '权', 'fx-quan')}</td>` +
        `<td>${cell(sh['科'], '科', 'fx-ke')}</td>` +
        `<td>${cell(sh['忌'], '忌', 'fx-ji')}</td></tr>`;
    }).join('');
    body.innerHTML =
      `<table class="fx-table"><tr><th>宫（干）</th><th>禄</th><th>权</th><th>科</th><th>忌</th></tr>${rows}</table>` +
      `<p class="hint" style="margin:10px 0 0">看法：本表列出各宫宫干按当前四化表所化出的星曜，以及该星在本命盘的位置。它是规则关系的可视化；“飞入”只表示星曜落点，不等于该宫主动给另一宫带来顺逆结果。不同飞星派别对自化、向心/离心和飞化链条有不同定义，本站不把它简化成因果断语。点选落点可回到盘面核对。</p>`;
    card.hidden = false;
  }catch(e){ card.hidden = true; }
}
/* 本次排盘口径：把已有的 note + 历法信息整理成固定尾注块 */
function renderChartSihua(chart){
  const box = $('#chart-sihua-summary');
  if(!box || !chart || !chart.lunarInfo) return;
  const yearStem = chart.lunarInfo.yearStem;
  const yearGan = ST[yearStem];
  const born = E.getSiHuaByStem(yearStem) || {};
  const labels = ['禄','权','科','忌'];
  const meanings = { '禄':'资源／回应观察', '权':'推动／责任观察', '科':'表达／规范观察', '忌':'牵挂／反复观察' };
  const flows = labels.map(h => {
    const star = born[h] || '';
    const palace = sihuaStarPalace(chart, star);
    const target = chart.palaces.find(p => p.stars.some(s => s.name === star));
    const branch = target ? target.branch : '';
    return '<button type="button" class="sihua-flow-btn" data-sihua-focus="' + branch + '" aria-pressed="false" ' + (branch === '' ? 'disabled' : '') + '>' +
      '<span class="sihua-flow-top">' + shBadge(h) + '<small>' + meanings[h] + '</small></span>' +
      '<strong>' + esc(star || '未能匹配') + '</strong>' +
      '<span class="sihua-flow-dest">' + (palace ? '→ ' + esc(palace) : '未落入十二宫') + '</span>' +
      '<span class="sihua-flow-source">生年 ' + yearGan + ' 干</span></button>';
  }).join('');
  const active = luckOverlay(chart);
  const activeItems = active.sihua ? labels.map((h, i) => {
    const key = ['lu','quan','ke','ji'][i];
    const star = active.sihua[key];
    const palace = sihuaStarPalace(chart, star);
    return star ? '<span class="active-sihua-item">' + shBadge(h) + '<b>' + esc(star) + '</b><span>→ ' + esc(palace || '命外') + '</span></span>' : '';
  }).filter(Boolean).join('') : '';
  box.innerHTML =
    '<section class="card sihua-core-card"><div class="card-kicker">生年四化 · ' + yearGan + '干落点</div>' +
      '<div class="sihua-flow-grid">' + flows + '</div>' +
      '<p class="hint sihua-instruction">点击一项，命盘会定位对应落宫；切换大限或流年时，相关运限四化会直接标在星曜旁。四化属于传统术数解释线索，不代表现实结果保证。</p></section>' +
    '<section class="card sihua-overlay-card"><div class="card-kicker">叠盘对照 · ' + esc(active.label || '本命盘') + '</div>' +
      (activeItems ? '<div class="active-sihua-list">' + activeItems + '</div>' : '<p class="hint" style="margin:0">当前为本命模式。切换左侧「大限 / 流年」后，这里会同步显示对应层的四化星与落宫。</p>') + '</section>' +
    '<div class="sihua-next-step"><span>宫干飞化矩阵已并入这张命盘。</span><span>切换本命、大限与流年查看动态标记。</span></div>';
}
document.addEventListener('click', e => {
  const btn = e.target.closest('.sihua-flow-btn');
  if(!btn) return;
  const branch = btn.dataset.sihuaFocus;
  if(branch === '') return;
  const wasOn = btn.getAttribute('aria-pressed') === 'true';
  $('.sihua-flow-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
  $('#chart-grid .cell, #chart-list .palace-row').forEach(el => el.classList.remove('sihua-focus'));
  if(wasOn) return;
  btn.setAttribute('aria-pressed', 'true');
  const targets = $('#chart-grid .cell[data-branch="' + branch + '"], #chart-list .palace-row[data-branch="' + branch + '"]');
  targets.forEach(el => el.classList.add('sihua-focus'));
  const gridVisible = getComputedStyle($('#chart-grid')).display !== 'none';
  const target = gridVisible
    ? (targets.find(el => el.closest('#chart-grid-wrap')) || targets[0])
    : (targets.find(el => el.closest('#chart-list')) || targets[0]);
  if(target) target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
});

/* 本次排盘口径：把已有的 note + 历法信息整理成固定尾注块 */
function renderKoujingCard(rec){
  const card = $('#koujing-card'), body = $('#koujing-body');
  if(!rec){ card.hidden = true; return; }
  const chart = rec.chart, li = chart.lunarInfo || {};
  const inp = rec.input || {};
  const items = [];
  const pillars=li.fourPillars||[];
  items.push('本盘四柱（按节气口径）：'+(pillars.length?pillars.join(' · '):'当前引擎未返回四柱'));
  if(li.yearStem!=null&&li.yearBranch!=null)items.push('紫微年干支（按农历年）：'+ST[li.yearStem]+BR[li.yearBranch]+'。接近春节或立春时，紫微农历年与四柱节气年柱可能不同；这是历法口径差异，不应只因两者不同就判为排盘错误。');
  if(rec.note && rec.note.length) items.push(rec.note.join('；'));
  items.push((inp.lateZiNextDay ? '晚子时按次日排盘（换日口径）' : '晚子时默认不换日')
    + (li.isLeapMonth ? '；闰月按十五分界（十五及以前归本月，之后归下月）' : ''));
  items.push('大限起法：按五行局对应岁数起运，阳男阴女顺行、阴男阳女逆行');
  items.push('与其他工具结果不同时，先核对三处：①是否开启真太阳时校正（本站默认关闭；开启后用于确定时辰，排盘日仍按公历出生日）②晚子时是否换日 ③闰月口径是否一致');
  body.innerHTML = items.map(esc).join('<br>');
  card.hidden = false;
}
/* 身宫卡 */
function renderShengongCard(chart){const body=$('#shengong-body'),sp=chart.palaces.find(p=>p.isShenGong);if(!sp){if(body)body.innerHTML='';syncMingshenCard();return;}const name=disp(sp.name);body.innerHTML=`<p class="bz-sec" style="margin-top:0">身宫 · 行动落点</p><p style="margin:0 0 6px">身宫是紫微斗数中的盘面标记之一，常与命宫合看，用于讨论行动重心；不同流派解释有差异，不代表某个年龄后才开始改变。</p><p style="margin:0"><b>你的身宫在${esc(name)}</b>。可把该宫主题与现实中的持续投入、角色责任和选择相互核对。</p>`;syncMingshenCard();}
function syncMingshenCard(){
  const card = $('#mingshen-card');
  if(!card) return;
  const a = $('#shengong-body')?.innerHTML.trim(), b = $('#wuxingju-body')?.innerHTML.trim();
  card.hidden = !(a || b);
}
/* 五行局卡 */
function renderWuxingjuCard(chart){const body=$('#wuxingju-body');if(!chart.wuxingJuName){if(body)body.innerHTML='';syncMingshenCard();return;}body.innerHTML=`<p class="bz-sec" style="margin-top:10px">五行局 · 排盘参数</p><p style="margin:0 0 6px">五行局是紫微斗数安星与大限起法所用的规则参数。它不是心理测量，也不能单独用于判断性格、运势或人生节奏。</p><p style="margin:0"><b>本盘五行局：${esc(chart.wuxingJuName)}</b>。若与其他排盘结果不同，请核对历法、时区、出生时辰与流派设置。</p>`;syncMingshenCard();}
/* 化忌化解卡 */
function renderHuajiCard(chart){const card=$('#huaji-card'),body=$('#huaji-body'),natal=natalSihuaMap(chart),list=natal['忌']||[];if(!list.length){card.hidden=true;return;}const items=list.map(e=>`<li><b>${esc(e.star)}化忌落${esc(e.palace)}</b>：按本盘规则得到的传统对应。可记录你在该领域反复投入注意力的具体情境，再观察哪些环节能通过沟通、流程或资源安排改善。</li>`).join('');body.innerHTML='<p style="margin:0 0 8px">化忌是四化体系中的一种标记，不能简单等同于凶兆、疾病、破财或关系失败。下面只列盘面位置和适合自我核对的问题。</p><ul style="margin:0;padding-left:20px;font-size:14px">'+items+'</ul><p class="hint" style="margin:8px 0 0">处理建议应来自现实问题本身：先定义目标、收集事实、拆分可控步骤；医疗、财务、法律和关系重大决定请结合相应专业意见与当事人沟通。</p>';card.hidden=false;}
// 点击星/格局/宫：解释弹窗
$('#mobile-palace-picker').addEventListener('change', e => {
  const value = e.target.value;
  sanfangBranch = value === '' ? null : +value;
  renderChartBody();
});
function toggleSanfangBranch(branch){
  sanfangBranch = sanfangBranch === branch ? null : branch;
  renderChartBody();
}
document.addEventListener('click', e => {
  const touchCell = e.target.closest('#chart-grid .cell[data-branch]');
  if(touchCell && matchMedia('(pointer: coarse)').matches){
    toggleSanfangBranch(+touchCell.dataset.branch);
    return;
  }
  const s = e.target.closest('[data-star]');
  if(s){ glossary('star', s.dataset.star); return; }
  const p = e.target.closest('[data-pattern]');
  if(p && !e.target.closest('[data-star]')){ glossary('pattern', p.dataset.pattern); return; }
  const pd = e.target.closest('[data-palace-detail]');
  if(pd){ showPalaceDetail(pd.dataset.palaceDetail); return; }
  const sfb2 = e.target.closest('[data-sanfang]');
  if(sfb2){
    const b = +sfb2.dataset.sanfang;
    toggleSanfangBranch(b);
    return;
  }
  const row = e.target.closest('.palace-row-head');
  if(row){ row.parentElement.classList.toggle('open'); return; }
  const cell = e.target.closest('.cell[data-branch]');
  if(cell && !e.target.closest('[data-star]')){
    const b = +cell.dataset.branch;
    sanfangBranch = (sanfangBranch === b) ? null : b; // 点任意宫：高亮其三方四正；再点取消
    renderChartBody();
    return;
  }
  const lv = e.target.closest('.lvl');
  if(lv){ /* 级别标签不弹窗 */ return; }
});
document.addEventListener('keydown', e => {
  const cell = e.target.closest('#chart-grid .cell[data-branch]');
  if(!cell || (e.key !== 'Enter' && e.key !== ' ')) return;
  e.preventDefault();
  const branch = +cell.dataset.branch;
  toggleSanfangBranch(branch);
  const next = document.querySelector('#chart-grid .cell[data-branch="' + branch + '"]');
  if(next) next.focus({ preventScroll: true });
});

function showPalaceDetail(name){
  $('#modal').hidden = true;
  renderPalaceCards();
  nav('palaces');
  // 滚动到对应卡片并闪一下，告诉用户"就是这张"
  requestAnimationFrame(() => {
    const card = document.querySelector(`#palace-cards [data-palace="${CSS.escape(name)}"]`);
    if(card){
      card.scrollIntoView({ block: 'center', behavior: 'smooth' });
      card.style.outline = '2px solid var(--primary)';
      card.style.outlineOffset = '2px';
      setTimeout(() => { card.style.outline = ''; card.style.outlineOffset = ''; }, 1800);
    }
  });
}
let palaceDetailName = null;
/* 分享按钮已移入"解读"菜单，openShare 由菜单调用 */

/* ---------- 十二宫卡片（结合命主命盘的专属展示） ---------- */
/* 命宫专属：命主画像 —— 综合主星、四化、身宫、官禄，回答"我是谁/天赋/人生方向" */
const STAR_GIFT = {
  '紫微':['统筹、承担与决策是传统取象的观察方向，需用实际经历验证','盘面不指定管理岗位；比较你在组织、专业和独立工作中的真实表现'],
  '天机':['规划、学习与调整是传统取象的观察方向','先试一个小项目，记录拆解问题与持续交付的表现'],
  '太阳':['外显表达、承担与服务是传统取象的观察方向','检查你是否喜欢公开表达，以及责任边界是否清楚'],
  '武曲':['执行、资源管理与纪律是传统取象的观察方向','用结果记录检验效率、准确度和沟通协作'],
  '天同':['协作、感受与生活品质是传统取象的观察方向','观察自己如何处理冲突和不确定性，不贴“怕吃苦”标签'],
  '廉贞':['原则、边界和表达是传统取象的观察方向','用真实反馈审视规则意识与情绪沟通'],
  '天府':['统筹、承接与资源保存是传统取象的观察方向','检验自己在稳定维护和尝试新机会之间的平衡'],
  '太阴':['细致观察、积累和感受是传统取象的观察方向','用作品和数据验证细节能力，不把情绪状态定型'],
  '贪狼':['兴趣、社交与拓展是传统取象的观察方向','记录注意力如何分配，再看哪些兴趣能转成持续能力'],
  '巨门':['表达、辨析与追问是传统取象的观察方向','核对观点是否有证据，也练习倾听和表达边界'],
  '天相':['协调、规范与支持是传统取象的观察方向','观察自己如何处理分工、公平和职责边界'],
  '天梁':['经验、照料与原则是传统取象的观察方向','留意支持他人的同时是否也给自己留出边界'],
  '七杀':['独立决断和压力下行动是传统取象的观察方向','做重大决定前评估信息、风险和协作支持'],
  '破军':['拆解旧方案、试验和重组是传统取象的观察方向','用小范围试验测成本与收益，避免把变化当成宿命'],
};
const SIHUA_GIFT = {
  '禄':'化禄落命宫：传统象义可联想到资源、兴趣或回应；它不保证财运或机会，宜观察资源如何获得与维护。',
  '权':'化权落命宫：传统象义可联想到承担、推动和主导；不保证现实职位或权力。',
  '科':'化科落命宫：传统象义可联想到学习、表达、规范与声誉经营；不保证考试或名声结果。',
  '忌':'化忌落命宫：传统象义可联想到牵挂、反复关注或需要处理的议题；不是凶兆，也不是人生必须完成的功课。',
};
/* 外在人设（命宫/迁移宫主星）与内心世界（福德宫主星）的反差句库 */
const STAR_OUTER = {
  '紫微': '自带气场，像个能拿主意的人', '天机': '脑子转得快，像个有主意的军师',
  '太阳': '热络敞亮，存在感很强', '武曲': '雷厉风行、讲求效率',
  '天同': '好说话、没架子，让人放松', '廉贞': '有个性有棱角，不好惹也不好懂',
  '天府': '稳重可靠，像个能兜底的人', '太阴': '温和细致，不张扬',
  '贪狼': '会来事、熟场面，魅力外放', '巨门': '嘴皮子利、逻辑感强',
  '天相': '得体周到，像个靠谱的帮手', '天梁': '老成持重，像个能商量事的长辈',
  '七杀': '干脆果断，有一股冲劲', '破军': '不按套路出牌，让人猜不透下一步',
};
const STAR_INNER = {
  '紫微': '其实很需要被认可，面子看得重', '天机': '脑子停不下来，容易想太多',
  '太阳': '心里也想被人照顾，只是习惯了自己发光', '武曲': '对钱和安全感有执念，闲不下来',
  '天同': '就想安稳舒服，最怕折腾和冲突', '廉贞': '感情浓烈，爱憎都藏在心里烧',
  '天府': '需要秩序感和存粮感，乱了就慌', '太阴': '敏感细腻，情绪容易在夜里翻涌',
  '贪狼': '好奇心和欲望都很旺，安分不下来', '巨门': '爱较真、爱追问，心里有个解不开的为什么',
  '天相': '习惯先为别人想，委屈了自己也不说', '天梁': '心里装着一套规矩，也装着一份操不完的心',
  '七杀': '表面果断，心里其实一直在跟焦虑赛跑', '破军': '总想推倒重来，安稳日子过久了反而闷',
};
/* 生年化忌落宫 = 软肋句库 */
const JI_SOFTSPOT = {
  '命宫': '和自己较劲：越想证明自己，越容易把自己逼得太紧',
  '兄弟宫': '同辈关系里容易受伤：朋友或兄弟的一句话，能在心里记很久',
  '夫妻宫': '在感情上越在意越患得患失，嘴上硬、心里软',
  '子女宫': '对孩子、下属或自己的作品放不下：付出得多，也容易失落',
  '财帛宫': '和钱较劲：不是没钱，而是钱来钱去总让你不安',
  '疾厄宫': '身体是情绪的出口：压力一大，先出状况的往往是身体',
  '迁移宫': '在外面容易"水土不服"：离乡、变动、新环境都要适应得更久',
  '交友宫': '在人情里容易吃亏：怕拒绝别人，又怕被辜负',
  '官禄宫': '在事业上跟自己过不去：成就不算小，心里总觉得还不够',
  '田宅宫': '对"家"有执念：安身之处不安，心就定不下来',
  '福德宫': '心里难安：想停停不下来，想放放不下',
  '父母宫': '和长辈、权威的关系是课题：既想被认可，又怕被束缚',
};
function mingPortraitHTML(chart){
  const ming=chart.palaces.find(p=>p.isMingGong),shen=chart.palaces.find(p=>p.isShenGong);
  const majors=ming.stars.filter(s=>s.type==='major').map(s=>s.name),natal=natalSihuaMap(chart),items=[];
  ['禄','权','科','忌'].forEach(h=>(natal[h]||[]).forEach(x=>items.push(`<li><b>生年化${h}</b>：${esc(x.star)}落${esc(x.palace)}。这是所选四化规则下的盘面位置，可结合该宫主题做事实核对；不作吉凶定论。</li>`)));
  let pats=[];try{pats=E.detectPatterns(chart).slice(0,3).map(x=>x.name);}catch(e){}
  return '<div class="portrait-card"><div class="p-sec">✦ 命盘摘要 · 可核对的结构</div>'+ 
    '<p><b>命宫主星：</b>'+esc(majors.join('、')||'空宫（可合看对宫及三方四正）')+'。<b>身宫：</b>'+esc(shen?disp(shen.name):'未定位')+'。这些是盘面事实，不等同于人格测验或人生结论。</p>'+ 
    '<p><b>怎么读：</b>查看星曜说明与亮度表，再结合命宫、迁移宫、福德宫及三方四正。若与自己的长期经历不符，先核对出生时间、时区和排盘设置，不要为了迎合描述而勉强解释。</p>'+ 
    (items.length?'<p><b>生年四化位置：</b></p><ul>'+items.join('')+'</ul>':'<p><b>四化位置：</b>当前规则未返回可展示项目，请核对规则设置。</p>')+
    '<p><b>传统组合标签：</b>'+esc(pats.join('、')||'当前规则未识别到已收录组合')+'。仅表示匹配本站条件，不是命格高低或成败判断。</p>'+ 
    '<p><b>把读盘变成行动：</b>选一个你真正关心的议题，写下盘面线索、支持它的现实证据、相反证据和一个低成本验证行动；观察一段时间后再复盘。</p>'+ 
    '<p class="hint">紫微斗数属于传统文化解释框架，不能验证具体事件、诊断健康问题或替代专业建议；资料不完整时结论应保留。</p></div>';
}
/* 十二宫阅读卡：单列排版，命盘页与十二宫页复用 */
function palaceCardHTML(p, i, chart){
  if(!chart){
    return `<div class="palace-card" data-palace="${p.name}" style="--i:${i}">`
      + `<div class="p-top"><h4>${p.name}</h4></div>`
      + `<div style="margin:6px 0"><span class="modern">${p.modern}</span></div>`
      + `<div class="p-line">${p.keywords}</div>`
      + `<p class="p-say" style="margin-top:8px">${p.desc}</p></div>`;
  }
  const pl = palaceByName(chart, p.name);
  const tags = (pl.isMingGong ? '<span class="p-tag">命宫</span>' : '')
    + (pl.isShenGong ? '<span class="p-tag">身宫</span>' : '');
  const vBadge = '';
  const majors = pl.stars.filter(s => s.type === 'major');
  const minors = pl.stars.filter(s => s.type !== 'major');
  const dx = pl.daXianAge ? ` · 大限 ${pl.daXianAge[0]}–${pl.daXianAge[1]} 岁` : '';
  let h = `<div class="palace-card" data-palace="${p.name}" style="--i:${i}">`
    + `<div class="p-top"><h4>${p.name}</h4>${tags}${vBadge}<span class="p-gz">${ST[pl.stem]}${BR[pl.branch]}${dx}</span></div>`
    + (pl.isMingGong ? mingPortraitHTML(chart) : '')
    + `<div style="margin:2px 0 4px"><span class="modern">${p.modern}</span></div>`;
  // 疾厄宫不作疾病、器官或寿命推断。
  if(p.name === '疾厄宫') h += '<p class="p-say"><b>阅读边界</b>：此宫属于传统身心主题分类，不能用于诊断疾病、判断器官风险或寿命。身体不适请咨询医疗专业人员。</p>';
  // 主星 + 白话
  if(majors.length){
    h += `<div class="p-sec">主星</div><div class="p-stars">${majors.map(s =>
      `${esc(s.name)}${s.siHua ? shBadge(s.siHua) : ''}${s.brightnessRaw ? `<span style="color:var(--gold);font-size:12px">【${s.brightnessRaw}】</span>` : ''}`
    ).join('　')}</div>`;
    majors.forEach(st => { if(D.stars[st.name]) h += `<p class="p-say"><b>${esc(st.name)}</b>：${withTerms(D.stars[st.name])}</p>`; });
    const dual = dualStarText(pl);
    if(dual) h += `<p class="p-say"><b>双星同宫</b>：${esc(dual)}</p>`;
  } else {
    const bname = pl.borrowedStars && pl.borrowedStars.length ? pl.borrowedStars.map(esc).join('、') : '对宫';
    h += `<div class="p-sec">主星</div><p class="p-say">空宫，借对宫（${bname}）来看，力量打些折扣。</p>`;
  }
  // 辅煞全列
  if(minors.length){
    h += `<p class="p-line">辅煞：${minors.map(s => esc(s.name) + (s.siHua ? shBadge(s.siHua) : '')).join('、')}</p>`;
  }
  // 四化只说明所选规则下的盘面位置，配合复盘问题阅读。
  h += pl.stars.filter(s=>s.siHua).slice(0,2).map(s=>'<p class="p-say"><b>化'+esc(s.siHua)+'在'+esc(p.name)+'</b>：'+esc(safeSihuaNote(s.name,s.siHua,p.name))+'</p>').join('');
  // 三方四正
  const sf = [pl.branch, (pl.branch + 6) % 12, (pl.branch + 4) % 12, (pl.branch + 8) % 12].map(b => {
    const q = palaceByBranch(chart, b);
    const qm = q.stars.filter(s => s.type === 'major').map(s => s.name).join('') || '空';
    return `${disp(q.name)}${qm}`;
  });
  h += `<p class="p-line">三方四正：${sf.map(esc).join(' · ')}</p>`;
  h += `<p class="p-line" style="margin-top:8px">${withTerms(p.desc)}</p>`;
  return h + `</div>`;
}
function renderPalaceCards(){
  const rec = cur();
  const chart = rec ? rec.chart : null;
  let banner = '';
  if(chart){
    const bi = chart.birthInfo;
    banner = `<div class="card" style="margin-bottom:12px"><div class="card-kicker">${esc(rec.name)}的十二宫</div>`
      + `<p class="hint" style="margin:0">${bi.year} 年 ${bi.month} 月 ${bi.day} 日 · ${bi.gender==='male'?'男':'女'} · ${esc(chart.wuxingJuName)} · 下面每张卡都是按你的命盘填的：点宫看详解，点星看星的解释</p></div>`;
  } else {
    banner = `<div class="card" style="margin-bottom:12px"><p style="margin:0 0 10px">先排一张盘，这里的十二宫就会结合你的命盘来展示——每宫的星曜、四化、干支、大限都会填上。</p><button class="btn" data-nav="input">去排盘 →</button></div>`;
  }
  $('#palace-cards').innerHTML = banner + D.palaces.map((p, i) => palaceCardHTML(p, i, chart)).join('');
  palaceDetailName = null;
}
document.addEventListener('click', e => {
  const c = e.target.closest('[data-palace]');
  if(c && !e.target.closest('[data-star]')) glossary('palace', c.dataset.palace);
});

/* ---------- 13维解读：按当前命盘在本地生成 ---------- */
function readingKeyOf(chart, input){
  const bi=chart.birthInfo;
  const settings = [
    !!(input && input.trueSolar), !!(input && input.lateZiNextDay),
    input && input.longitude != null ? input.longitude : null,
    input && input.shichen != null ? input.shichen : null,
    input && input.exHour != null ? input.exHour : null,
    input && input.exMin != null ? input.exMin : null,
    input && input.province || '',
    chart.sihuaTable || (input && input.sihuaTable) || null
  ];
  return bi.year+'-'+pad2(bi.month)+'-'+pad2(bi.day)+'-'+bi.hour+'-'+bi.gender+'-'+encodeURIComponent(JSON.stringify(settings));
}
/* 按当前命盘实时生成 13 个主题的本地解读 */
const LOCAL_READING_PALACES = {
  overview: ['命宫'], personality: ['命宫'],
  love: ['夫妻宫', '命宫', '福德宫'], career: ['官禄宫', '命宫', '财帛宫'],
  wealth: ['财帛宫', '命宫', '福德宫'], health: ['疾厄宫', '命宫', '福德宫'],
  family: ['父母宫', '田宅宫', '兄弟宫'], children: ['子女宫', '命宫'],
  move: ['迁移宫', '命宫'], friends: ['交友宫', '命宫'],
  home: ['田宅宫', '命宫'], spirit: ['福德宫', '命宫'], parents: ['父母宫', '命宫'],
};
/* 双星同宫专属断语（合成化学反应），无专属词条返回空 */
function dualStarText(p){const majors=p.stars.filter(s=>s.type==='major');if(majors.length!==2)return '';return `本宫有${majors[0].name}、${majors[1].name}两颗主星。传统合参会结合两星各自象义、落宫和四化；此处先列盘面组合，不把组合直接翻译成固定性格或人生结果。`;}
/* 辅煞落关键宫的场景化短句：让煞星吉星进断语正文，而不是只罗列名字 */
const SHA_SCENE = {
  '财帛宫': {
    '地空':'财帛宫见地空：传统上可讨论预期与实际资源之间的差距。可以核对现金流、合同和支出计划；不据此推断漏财或指定投资方式。',
    '地劫':'财帛宫见地劫：可把它作为检查预算、应急储备和风险边界的提醒，不代表必然破财或遭遇欺骗。',
    '天马':'财帛宫见天马：传统取象涉及流动、跨地域或多元资源；是否适合某种收入模式要看技能、成本、市场和实际记录。',
    '禄存':'财帛宫见禄存：传统取象常谈资源保存与持续积累；不表示自带财库，仍需看收入、支出和资产负债。',
  },
  '命宫': {
    '地空':'命宫见地空：可反思抽象思考、理想与落实之间的平衡；不代表人生会“清零重来”。',
    '地劫':'命宫见地劫：传统上可讨论变化、资源分配和不确定性；结合真实经历检查风险管理，不作灾祸预言。',
    '擎羊':'命宫见擎羊：可观察直接表达、决断和冲突处理；不是冲动或攻击性的诊断。',
    '红鸾':'命宫见红鸾：传统上常与关系、社交或喜庆主题相连；不代表桃花必旺或某人就是正缘。',
    '天喜':'命宫见天喜：传统上可关联愉悦、庆祝和关系互动；不保证好消息或特定喜事。',
  },
  '官禄宫': {
    '天马':'官禄宫见天马：可讨论工作内容的流动性、变化和跨团队协作，不据此判断应否出差或换工作。',
    '擎羊':'官禄宫见擎羊：可观察执行中的竞争、边界和决策成本；行业选择应依据能力与市场证据。',
    '禄存':'官禄宫见禄存：可讨论组织资源与稳定性；不能据此断定体制内更适合或事业有托底。',
  },
  '夫妻宫': {
    '擎羊':'夫妻宫见擎羊：可反思分歧出现时的表达方式与修复能力；不代表关系必有冲突。',
    '陀罗':'夫妻宫见陀罗：可讨论犹豫、推进节奏和未说开的议题；不代表关系注定拖延。',
    '地空':'夫妻宫见地空：可核对期待与对方真实表达之间的差异；不代表容易遇到虚假关系。',
    '地劫':'夫妻宫见地劫：可提醒关系重大决定留出沟通与冷静时间；不预测分手、闪婚或损失。',
    '红鸾':'夫妻宫见红鸾：传统关系象意之一；不能据此断“正缘”来源或相遇时间。',
    '天喜':'夫妻宫见天喜：传统上关联愉悦、庆祝等关系主题，不代表婚喜必然发生。',
  },
  '福德宫': {
    '地空':'福德宫见地空：可观察独处、想象与注意力之间的关系；若持续困扰生活，应寻求现实支持。',
    '地劫':'福德宫见地劫：可作为检查压力来源、恢复方式和支持网络的提示，不用于心理诊断。',
    '天马':'福德宫见天马：传统上可讨论兴趣、环境变化与休息方式；不代表只有旅行才能恢复。',
  },
};

function palaceTextBrief(chart, p, skipJi){
  const L = [];
  const head = `${disp(p.name)}（${ST[p.stem]}${BR[p.branch]}）`;
  const majors = p.stars.filter(s => s.type === 'major');
  /* 亮度定调：同一颗星，庙旺和落陷完全是两回事，不写就是"对不上"的主要来源 */
  const brightSay = b => '当前亮度标记为'+(b||'未标注')+'，仅对应所选传统亮度表；各派表格可能不同，不代表客观能力或现实结果。';
  if(majors.length){
    L.push(head + '主星：' + majors.map(s => `${s.name}${s.siHua ? '化' + s.siHua : ''}`).join('、') + '。');
    const dual = dualStarText(p);
    if(dual) L.push(`${majors[0].name}${majors[1].name}同宫：${dual}`);
    majors.forEach(s => { if(D.stars[s.name]) L.push(`${s.name}：${D.stars[s.name]}${brightSay(s.brightnessRaw)}`); });
  } else {
    const bstars = ((p.borrowedStars && p.borrowedStars.length) ? p.borrowedStars : []).filter(nm => (D.stars || {})[nm]);
    const bname = (p.borrowedStars && p.borrowedStars.length) ? p.borrowedStars.join('、') : '对宫';
    L.push(`${head}无主星（空宫）。按常见读法可参考对宫（${bname}）及三方四正；不同流派对借星方法有差异。空宫不代表缺陷、少主见或人生空白。`);
    bstars.forEach(nm => L.push(`借来的${nm}：${D.stars[nm]}`));
  }
  p.stars.filter(s => s.siHua).forEach(s => {
    L.push(`${s.name}化${s.siHua}在${disp(p.name)}：${safeSihuaNote(s.name,s.siHua,disp(p.name))}`);
    if(skipJi) skipJi.add(s.name + '@' + disp(p.name));
  });
  // 辅煞场景句：关键宫 × 关键辅煞星
  const sceneMap = SHA_SCENE[disp(p.name)] || {};
  p.stars.forEach(s => { if(sceneMap[s.name]) L.push(sceneMap[s.name]); });
  // 三方四正：看一宫要合看四宫
  const sf = [p.branch, (p.branch + 6) % 12, (p.branch + 4) % 12, (p.branch + 8) % 12].map(b => {
    const q = palaceByBranch(chart, b);
    const qm = q.stars.filter(s => s.type === 'major').map(s => s.name).join('') || '空';
    return `${disp(q.name)}${qm}`;
  });
  L.push(`三方四正：${sf.join(' · ')}。`);
  return L.join('\n\n');
}
/* 13维本地精编版：每个维度的总述（一句话定调） */
const LOCAL_READING_INTROS = {
  personality: '性格专题：从命宫观察传统盘面如何描述表达、决策和适应方式；它不是心理测验，也不能替代你对自身经历的判断。',
  love: '关系专题：夫妻宫是传统观察入口，合看命宫的互动方式与福德宫的情绪需求；不预测“正缘”、结婚或分手时间。',
  career: '工作专题：官禄宫结合命宫、财帛宫看传统职业取象；结论不指定职业或跳槽时机，需与能力、兴趣和市场信息交叉验证。',
  wealth: '财务专题：财帛宫合看命宫与福德宫，讨论资源、价值交换和管理习惯；不预测收入、投资结果或财务安全。',
  health: '身心专题：疾厄宫等只用于传统文化观察，不判断体质、疾病、寿命或疗效。身体不适请咨询医疗专业人员。',
  family: '家庭专题：父母、田宅、兄弟宫提供传统观察角度；现实关系需以当事人表达、边界和共同经历为准。',
  children: '子女与创造专题：子女宫在传统体系中也会延伸到作品、项目和表达；不判断生育、子女健康或亲子结果。',
  move: '迁移专题：观察外部环境、出行与适应方式的传统象意；不替代交通、签证、天气或安全信息。',
  friends: '人际专题：交友宫是团队、朋友和合作网络的传统观察入口；不推断某个人是否可信，合作仍要核实权责与条款。',
  home: '居住与资产专题：田宅宫传统上关联居所、家庭空间和资产议题；不预测房产价格、置业时机或资产回报。',
  spirit: '情绪与休息专题：福德宫用于讨论兴趣、恢复方式和内在体验的传统取象；不是心理诊断或人格量表。',
  parents: '长辈与支持专题：父母宫传统上观察长辈、师长和制度支持；不把盘面解释当作对家人的事实判断。',
};
const LOCAL_READING_GUIDANCE = {
  overview: '使用建议：先核对出生日期、时辰和排盘口径，再看十二宫事实；把象意当成提出问题的方式，而非既定人生结论。若关键出生时间未知，先保留多个可能时辰。',
  personality: '可以这样使用：挑出你认同与不认同的描述各一条，分别回想具体场景。描述不吻合时不必硬套，也不要把星曜标签当成性格诊断。',
  love: '可以这样使用：把“我期待什么、我能提供什么、哪些边界不能退让”写清楚。讨论关系时优先看尊重、安全、沟通和持续行为；不根据命盘替他人定性。',
  career: '可以这样使用：盘面只提供反思方向。列出你的技能证据、喜欢的工作内容、现金储备和岗位机会，再用访谈、作品或小项目验证职业选择。',
  wealth: '可以这样使用：用真实账目核对收入来源、固定支出、负债与应急储备。任何投资、贷款或担保，都应看合同、风险和专业意见，不用星曜决定买卖。',
  health: '可以这样使用：把睡眠、压力、运动等生活观察与专业检查分开记录。命盘不具有诊断能力；有症状或用药问题时，及时联系医生。',
  family: '可以这样使用：把“盘面象意”与家人实际说过、做过的事分开。沟通可从具体需求、分工和边界开始，不让盘面替任何家庭成员下结论。',
  children: '可以这样使用：育儿以孩子的真实需要和专业建议为准；若把这一宫用于作品或项目，可列出目标、受众、迭代反馈和资源约束。',
  move: '可以这样使用：搬迁、旅行或求学应核对预算、合同、交通、签证、当地安全与支持网络。传统象意不能预测行程结果。',
  friends: '可以这样使用：合作前明确目标、分工、权责、交付、数据边界与退出机制；不把“贵人/小人”标签套在真实的人身上。',
  home: '可以这样使用：置业和租住重点核对产权、合同、预算、利率、维护成本和家庭需求；盘面不能提供房价或回报预测。',
  spirit: '可以这样使用：记录哪些活动让你恢复、哪些情境持续消耗。若长期情绪困扰影响生活，请寻找可信赖的人或专业心理支持。',
  parents: '可以这样使用：把期待说具体、把可提供的帮助说清楚。家人关系是双方长期互动形成的，盘面不能证明某位长辈的性格或行为。',
};
/* 每个维度的时间维度：当前大限 + 今年流年，大限若落在主题宫位上则点出来 */
function topicTimeLine(chart, topicCn, palNames){
  const dx = chart.daXians[chart.currentDaXianIndex] || {};
  const dxName = disp(dx.palaceName || '');
  const context = currentLunarContext(chart);
  if(!context.valid) return '当前日期的农历换算暂不可用，暂不生成流年时间线；命盘本身仍可查看。';
  const y = context.year;
  const lp = palaceByBranch(chart, ((y - 4) % 12 + 12) % 12);
  let s = `时间维度：当前大限 ${dx.startAge || '—'}–${dx.endAge || '—'} 岁在${dxName}；${y} 年流年命宫在${disp(lp.name)}。`;
  if(palNames.includes(dxName)) s += `当前大限宫位与${topicCn}专题的取用宫位重合，可把它作为这十年的观察线索之一；不代表该主题必然出现重大事件。`;
  return s;
}
/* 每个维度的化忌功课：主题宫位里有化忌就点出来；宫位详述里已讲过的不重复 */
function topicJiLine(chart, palNames, skip){
  const hits = [];
  chart.palaces.forEach(p => p.stars.forEach(st => {
    if(st.siHua === '忌' && palNames.includes(disp(p.name)) && !(skip && skip.has(st.name + '@' + disp(p.name)))) hits.push(`${st.name}在${disp(p.name)}`);
  }));
  if(!hits.length) return '';
  return `观察线索：${hits.join('、')}化忌。化忌是传统四化标记，可用于定位反复关注的主题；不代表凶兆或必然发生的损失。可记录对应领域的具体事实、投入和可调整环节。`;
}
function buildLocalReading(chart){
  const out = {};
  const ming = chart.palaces.find(p => p.isMingGong);
  const mingMajors = ming.stars.filter(s => s.type === 'major').map(s => s.name).join('、');
  const mingSay = mingMajors ? `主星是${mingMajors}` : '无主星';
  const shen = chart.palaces.find(p => p.isShenGong);
  const jiCovered = new Set(); // 宫位详述里已用四化入宫文案讲过的化忌，功课题里不再重复
  Object.keys(D.datasetTopics).forEach(topic => {
    const parts = [];
    const palNames = LOCAL_READING_PALACES[topic] || ['命宫'];
    const topicCn = D.datasetTopics[topic];
    if(topic === 'overview'){
      parts.push(`盘面事实：命宫${mingSay}，五行局为${chart.wuxingJuName}；身宫在${shen ? disp(shen.name) : '—'}。传统解读会把命宫、身宫用于观察自我定位和行动落点，但不存在一个固定年龄后才“进入身宫”的统一规则。`);
      try{
        const dx = chart.daXians[chart.currentDaXianIndex] || {};
        const context = currentLunarContext(chart);
        if(context.valid){
          const y = context.year, lp = palaceByBranch(chart, ((y - 4) % 12 + 12) % 12);
          parts.push(`时间盘面：当前大限显示为${dx.startAge || '—'}–${dx.endAge || '—'}岁，落${disp(dx.palaceName || '')}；农历${y}年流年命宫落${disp(lp.name)}。这是按当前排盘规则得到的位置，不是事件预测。`);
        }else parts.push('当前日期的农历换算暂不可用，暂不显示流年时间线；命盘本身仍可查看。');
      }catch(e){}
      let pats = [];
      try{ pats = E.detectPatterns(chart).slice(0, 3); }catch(e){}
      pats.forEach(pt => {
        const v2=(window.GXG_PATTERNS_V2||{})[pt.name];
        parts.push(`${pt.name}：检测到本站规则定义的传统组合标签（${v2&&v2.condition?v2.condition:'可在格局说明中查看识别条件'}）。该标签不表示人生等级或必然结果。`);
      });
    } else if(LOCAL_READING_INTROS[topic]){
      parts.push(LOCAL_READING_INTROS[topic]);
    }
    palNames.forEach(pn => {
      const p = palaceByName(chart, pn);
      if(p) parts.push(palaceTextBrief(chart, p, jiCovered));
    });
    if(topic !== 'overview'){
      parts.push(topicTimeLine(chart, topicCn, palNames));
      const ji = topicJiLine(chart, palNames, jiCovered);
      if(ji) parts.push(ji);
    } else {
      parts.push(LOCAL_READING_GUIDANCE.overview);
    }
    if(LOCAL_READING_GUIDANCE[topic]) parts.push(LOCAL_READING_GUIDANCE[topic]);
    out[topic] = parts.join('\n\n');
  });
  return out;
}
let readingTopic = 'overview';
function renderReadingTabs(){
  const picker = $('#reading-topic');
  if(!picker) return;
  picker.innerHTML = Object.entries(D.datasetTopics).map(([k, v]) =>
    `<option value="${esc(k)}">${esc(v)}</option>`).join('');
  picker.value = readingTopic;
}
document.addEventListener('change', e => {
  if(e.target && e.target.id === 'reading-topic'){
    readingTopic = e.target.value;
    renderReadingBody();
  }
});
function md2html(md){
  return esc(md)
    .replace(/^### (.*)$/gm, '<h4>$1</h4>')
    .replace(/^## (.*)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
}
function setReadingStep(t){ $('#reading-status').innerHTML = t; }
async function renderReading(){
  const rec = cur();
  if(!rec){ $('#reading-status').textContent = '先排一张盘，才能看深度解读。'; $('#reading-body').innerHTML = ''; return; }
  renderReadingTabs();
  // 所有解读均依据当前命盘在本地生成，免费解锁后展开 13 个主题的行动清单
  const setStep = setReadingStep;
  try{
    const localData = buildLocalReading(rec.chart);
    window.GXG_READING = localData;
    window.GXG_READING_LOCAL = true;
    renderReadingBody();
  }catch(e){
    $('#reading-status').textContent = '解读生成失败，请稍后重试。';
    $('#reading-body').innerHTML = '';
    return;
  }
  setStep('本地解读 · 已按你的排盘口径生成');
  const key = readingKeyOf(rec.chart, rec.input);
  if(isUnlocked(key)) tryLoadFull(rec);
  else setStep('本地解读已按你的排盘设置生成 <button class="link-btn" data-unlock-free>一键免费展开 13 个主题 →</button>');
}
function tryLoadFull(rec){
  if(!rec) return;
  window.GXG_READING = buildLocalReading(rec.chart);
  window.GXG_READING_LOCAL = true;
  renderReadingBody();
  setReadingStep('已解锁 13 个主题的现实核对与行动清单');
}
const LOCAL_READING_EXPANSIONS = {
  overview: ['把本次排盘口径记下来：出生地、时区、是否采用真太阳时、晚子时规则与四化设定；口径变化时先比较盘面差异。','从命宫、身宫和本次解读引用的宫位中，各挑一条与你近三年经历相符、一条不相符的描述，避免只记住命中的部分。','写下当前最想解决的一个现实问题，并列出可验证的信息来源与下一步行动。'],
  personality: ['记录一个最近真实发生的选择：当时看重什么、依据是什么、结果如何；用行为记录代替固定性格标签。','找一位熟悉你的同事或朋友核对：哪些描述符合具体情境，哪些只是泛化印象。','选一个想改善的行为，设定一周内可观察的指标，例如完成次数、沟通时长或休息时间。'],
  love: ['回想一次近期沟通：双方各自表达了什么需求，哪些信息被假设而没有确认？','把关系里的期待改写成可以直接讨论的请求，并为双方保留拒绝、协商和调整的空间。','遇到安全、控制或持续伤害问题时，以现实支持和专业帮助为先，不用命盘替代判断。'],
  career: ['列出当前岗位的核心任务、可迁移技能、可证明成果和仍需补足的能力，分别用事实核对。','把职业选择拆成可比较条件：职责、成长、收入、团队、地点和风险承受度，再决定下一步访谈或尝试。','为未来两周设一个低成本验证动作，例如完成作品样例、约一次信息访谈或测试一个新流程。'],
  wealth: ['先盘点现金流、固定支出、债务和近期目标；本命盘不含这些现实数据，不能据此判断财务结果。','将想做的财务决定写成假设，核对合同、费用、期限、最坏情景与退出条件；不因吉凶标记下注。','若涉及投资、税务或借贷，使用合规公开信息并咨询相应专业人士。'],
  health: ['记录睡眠、活动、压力和症状的实际变化及发生时间，避免用星曜推断病因。','把需要解决的健康问题整理成清单，向医疗专业人员描述症状、持续时间、用药和既往检查。','若出现急性或持续不适，及时寻求医疗帮助；本解读不提供诊断、治疗或预后。'],
  family: ['挑一个近期家庭议题，分别写下事实、各方需求、资源限制和仍需确认的信息。','将“应该怎样”换成可以协商的安排：谁负责、何时完成、如何复盘，以及出现变化时如何调整。','涉及财产、照护或法律责任时，核对文件与现实条件，必要时咨询专业人士。'],
  children: ['把对子女或照护对象的观察聚焦在具体需要、兴趣和支持条件，不用命盘给孩子贴固定标签。','如果主题指向创作或项目，列出当前阶段、资源缺口与下一步可完成的小成果。','涉及生育、发育或教育决策时，以当事人意愿、专业意见和实际信息为依据。'],
  move: ['列出迁居或出行的真实约束：时间、预算、证件、工作、照护责任与备选方案。','先做可逆的小验证，例如短住、实地考察或试运行，再评估适配度和成本。','涉及签证、合同、保险或安全时，逐项核对官方与专业信息；命盘不预测迁动结果。'],
  friends: ['回顾最近一次合作：目标、分工、交付标准、沟通频率和退出条件是否明确？','区分对方的实际行为与自己对“贵人/小人”的预设，用证据和边界处理合作。','对重要合作留下可追溯的书面约定，并在阶段节点复盘。'],
  home: ['把居住或家庭资源议题拆成预算、位置、时间、产权/租约、维护成本和家庭成员需求。','在购买、租赁、装修或搬迁前，对照合同与现金流，核验信息来源并预留应急方案。','命盘不能判断房产涨跌、继承或家庭事件；重大决定以法律、财务和现场信息为准。'],
  spirit: ['记录哪些活动确实让你恢复精力，哪些只是暂时转移注意力，并观察一周后的状态。','为休息安排具体时段和边界，减少把持续疲惫解释成命盘定论。','若情绪困扰持续影响生活或安全，尽早联系可信任的人或专业支持。'],
  parents: ['回顾与长辈或制度资源有关的具体经历，区分已经发生的事实、个人感受和未核实的猜测。','把需要沟通的事项整理成清楚的问题、所需材料与可接受的边界。','涉及医疗、财务、法律或照护安排时，确认当事人意愿并寻求相应专业支持。']
};
function renderUnlockedExpansion(topic){
  const items = LOCAL_READING_EXPANSIONS[topic] || LOCAL_READING_EXPANSIONS.overview;
  return '<section class="reading-personal-expansion"><h3>完整版 · 现实复盘与行动清单</h3><p class="hint">下面不是额外的命理断语，而是把本主题转成可核对、可执行的问题。本主题正文依据当前命盘整理；本清单是通用的现实核对与行动提示，不是命理断语。</p><ol>'+items.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ol><p class="hint">建议保留“盘面依据—现实证据—待确认问题—下一步行动”四栏记录；不吻合的内容也要记下，避免只挑符合预期的部分。</p></section>';
}
function renderReadingBody(){
  const data = window.GXG_READING; if(!data) return;
  const text = data[readingTopic] || '本主题暂无可显示内容。';
  const paras = text.split(/\n\n+/);
  const rec = cur();
  const key = rec ? readingKeyOf(rec.chart, rec.input) : '';
  const unlocked = !!(key && isUnlocked(key));
  const expansionHtml = unlocked ? renderUnlockedExpansion(readingTopic) : '';
  const upsell = unlocked ? '' :
    '<div class="unlock-card"><div><b>免费解锁 13 个主题的现实行动手册</b><br><span class="hint">解锁后会在当前主题下增加现实核对与行动清单，不隐藏盘面正文。所有内容在本地生成，出生资料不会上传。</span></div><button class="btn-primary" data-unlock-free>免费解锁完整版</button></div>';
  $('#reading-body').innerHTML = paras.map(p => '<p>'+md2html(p)+'</p>').join('') + expansionHtml + upsell +
  '<div class="hint" style="margin-top:16px">本地生成：依据当前命盘、排盘规则和本主题对应宫位整理，可离线查看；不调用远程解读语料，也不上传出生信息。</div><div class="reading-scope-note">紫微斗数属于传统文化取象。排盘展示规则计算结果，文字内容用于整理问题与自我复盘，不是经过临床、心理、金融或预测准确率验证的结论。重大健康、财务、法律和人生决定请结合现实证据及专业意见。</div>';
}
function unlockFreeReading(){
  const rec=cur();
  if(!rec){ nav('input'); return; }
  const key=readingKeyOf(rec.chart, rec.input);
  store.set('gxg_unlock_'+key,true);
  tryLoadFull(rec);
}
document.addEventListener('click', e => {
  if(e.target.closest('[data-unlock-free]')){ unlockFreeReading(); return; }
});
document.addEventListener('click', e => {
  const f = e.target.closest('[data-fav]');
  if(f){
    const [topic, idx] = f.dataset.fav.split(':');
    const data = window.GXG_READING; if(!data) return;
    const text = data[topic].split(/\n\n+/)[+idx];
    const rec = cur();
    favs.unshift({ id: uid(), chartId: rec ? rec.id : '', chartName: rec ? rec.name : '',
      topic: D.datasetTopics[topic] || topic, text: text.slice(0, 300), ts: Date.now() });
    store.set('gxg_favs', favs);
    f.textContent = '★';
  }
});
/* ---------- 新手导览 ---------- */
const GUIDE6_FALLBACK = [
  ['先核对出生资料','确认使用公历还是农历、日期、时辰、出生地与时区；接近换日或节气边界时，查看本站排盘口径和备选时辰。'],
  ['看命宫与身宫','先读盘面位置和星曜，再把传统象意与自己的真实经历对照；身宫没有统一的“某岁后才生效”界线。'],
  ['合看三方四正','观察本宫、对宫和三合宫的关系。只看一颗星或一个宫位容易过度简化。'],
  ['再看四化与时间层','分清生年、大限、流年、流月所用天干及规则。禄权科忌是传统符号，不直接等同获利、权力、考试成功或灾祸。'],
  ['读十二宫专题','关系、工作、财务、健康等内容是传统问题框架；每个主题都要回到当事人和现实证据。'],
  ['把结论变成可验证问题','记录事实、反例与下一步行动。不用命盘诊断疾病、判断他人、替代合同审查或作重大人生决定。'],
];
function renderGuide(){
  const steps = GUIDE6_FALLBACK.map((s, i) => {
    const t = s.t || s[0], d = s.d || s[1];
    return [String(i+1), t, d];
  });
  $('#guide-steps').innerHTML = steps.map(([n,t,d]) =>
    `<div class="card"><span class="step-n">${n}</span><b>${esc(t)}</b><p style="margin:10px 0 0;color:var(--muted)">${esc(d)}</p></div>`).join('');
}

/* ---------- 大限/流年 整盘叠视图 ---------- */
function renderOverlayGrid(chart, ov){
  const wrap = $('#overlay-grid-wrap'), grid = $('#overlay-grid');
  if(!wrap || !ov || ov.hlBranch == null || ov.hlBranch < 0){ wrap.hidden = true; return; }
  const pre = luckMode === 'daxian' ? '大限' : luckMode === 'liunian' ? '流年' : '流';
  const ovSi = {};
  if(ov.sihua) [['lu','禄'],['quan','权'],['ke','科'],['ji','忌']].forEach(([k, cn]) => { if(ov.sihua[k]) ovSi[ov.sihua[k]] = cn; });
  const order = [5,6,7,8, 4,-1,-1,9, 3,-1,-1,10, 2,1,0,11];
  let h = '';
  order.forEach(b => {
    if(b === -1){ h += '<div class="cell oc center-dup"></div>'; return; }
    const p = palaceByBranch(chart, b);
    const ovName = overlayPalaceAt(ov.hlBranch, b).replace('宫','');
    const isOvMing = ovName === '命';
    const stars = p.stars.filter(s => s.type === 'major' || ovSi[s.name]).map(s =>
      `<span class="star-chip">${esc(s.name)}${ovSi[s.name] ? shBadge(ovSi[s.name]) : ''}</span>`).join('') || '<span class="hint">—</span>';
    h += `<div class="cell oc${ov.hlBranch === b ? ' hl' : ''}" data-branch="${b}">` +
      (isOvMing ? '<span class="tag">' + pre + '命</span>' : '') +
      `<div class="pname sm">${pre}${ovName}</div><div class="gz">${disp(p.name).replace('宫','')} · ${ST[p.stem]}${BR[p.branch]}</div>` +
      `<div class="stars">${stars}</div></div>`;
  });
  grid.innerHTML = h;
  wrap.querySelector('.sec-mini').textContent = `${pre}盘叠加 · 大字为${pre}宫位，星曜挂${pre}四化`;
  wrap.hidden = false;
}
/* ---------- 流月日历热力图 ---------- */
/* 农历月初一的公历日期（按年缓存）。首次定位约需几十次引擎查询——分片异步执行，不冻结页面 */
/* 30 支签：克制白话+古风意象，不做宿命断言。同一张盘（或无盘）同一天抽同一支，明早自动换。 */
/* ---------- 人生时间轴：大限主题 + 换挡流年 ---------- */
function yearSay(o){const notes=[];if(o.isMark)notes.push('流年命宫进入本命重点主题宫位');if(o.jiHit)notes.push('化忌落本命命宫三方四正');if(o.luPal)notes.push('化禄对应本命'+o.luPal);return notes.length?notes.join(' · '):'未触发以上标记';}
/* 逐年断语：把换挡/费心/顺风拼成一句人话（时间轴与全景共用） */
function yearStory(o){const parts=[`流年命宫落${disp(o.liuPal.name)}`];if(o.jiPal)parts.push(`流年化忌对应本命${o.jiPal}，可作为复盘时关注反复投入与沟通成本的提示`);if(o.luPal)parts.push(`流年化禄对应本命${o.luPal}，可观察资源与回应如何流动`);if(o.isMark)parts.push('该年流年命宫进入本命命、官、财、夫主题宫位之一');return parts.join('；')+'。以上为规则位置说明，不是吉凶或事件预测。'}
const DX_THEME = {
  '命宫':'以自我定位与个人选择为复盘主题','兄弟宫':'以同辈、手足与协作关系为复盘主题','夫妻宫':'以亲密关系、承诺与沟通为复盘主题',
  '子女宫':'以创作、项目与照护责任为复盘主题','财帛宫':'以收入结构、资源安排与价值交换为复盘主题','疾厄宫':'以身心照护与生活节律为传统主题；不作健康判断',
  '迁移宫':'以外部环境、迁动与对外协作为复盘主题','交友宫':'以社群、人际网络与合作边界为复盘主题','官禄宫':'以工作角色、组织协作与职业选择为复盘主题',
  '田宅宫':'以居住环境、家庭资源与空间安排为复盘主题','福德宫':'以休息方式、兴趣与内在体验为复盘主题','父母宫':'以长辈互动、教育经历与制度资源为复盘主题',
};
/* 大限十年成色：宫位强度 + 限禄权科入命三方加分、限忌入命三方减分 */
function decadeQuality(chart, i, dx){
  const pal = palaceByBranch(chart, dx.palaceBranch);
  let sh = null;
  try{ sh = normSihua(E.getDaXianSiHua(chart, i)); }catch(e){}
  return { sh, pal, lvl: '主题观察' };
}
function renderTimelineCard(chart){
  const card = $('#timeline-card'), body = $('#timeline-body');
  if(!card) return;
  const birthY = chart.birthInfo.year;
  const currentContext=currentLunarContext(chart);
  if(!currentContext.valid){card.hidden=false;body.innerHTML='<p class="hint">当前日期的农历换算暂不可用，流年时间轴已暂停，避免生成错误年份；命盘本身仍可查看。</p>';return;}
  const nowY = currentContext.year;
  const keyBranches = ['命宫','官禄宫','财帛宫','夫妻宫'].map(n => palaceByName(chart, n).branch);
  const rows = chart.daXians.map((dx, i) => {
    const { sh, pal, lvl } = decadeQuality(chart, i, dx);
    const name = disp(pal.name);
    const majors = pal.stars.filter(x => x.type === 'major').map(x => x.name).join('·') || '空宫';
    const y1 = birthY + dx.startAge, y2 = birthY + dx.endAge;
    // 逐年动静（迷你柱）+ 换挡/禄忌标记
    const mingFangSet = new Set(sanfangBranches(chart.mingGongBranch));
    const dxJiPal = sh && sh.ji ? sihuaStarPalace(chart, sh.ji) : '';
    const dxLuPal = sh && sh.lu ? sihuaStarPalace(chart, sh.lu) : '';
    const years = [];
    for(let y = y1; y <= y2; y++){
      const yb = ((y - 4) % 12 + 12) % 12;
      const isMark = keyBranches.includes(yb);
      let lsh = null;
      try{ lsh = normSihua(E.getLiuNianSiHua(y)); }catch(e){}
      const luPal = lsh && lsh.lu ? sihuaStarPalace(chart, lsh.lu) : '';
      const jiPal = lsh && lsh.ji ? sihuaStarPalace(chart, lsh.ji) : '';
      const jiP = lsh && lsh.ji ? chart.palaces.find(pl => pl.stars.some(x => x.name === lsh.ji)) : null;
      const jiHit = !!(jiP && mingFangSet.has(jiP.branch));
      years.push({ y, isMark, luPal, jiPal, jiHit, liuPal: palaceByBranch(chart, yb),
        dblJi: !!(dxJiPal && jiPal === dxJiPal), jiaoZhan: !!(dxJiPal && luPal === dxJiPal) });
    }
    const marks = years.filter(o => o.isMark).map(o => o.y);
    const dblYears = years.filter(o => o.dblJi).map(o => o.y);
    const jzYears = years.filter(o => o.jiaoZhan).map(o => o.y);
    const spark = years.map(o =>
      `<i class="sp-bar${o.isMark ? ' mk' : ''}${o.jiHit ? ' ji' : ''}${o.dblJi ? ' dbl' : ''}" title="${o.y}年：流年命宫进${disp(o.liuPal.name).replace('宫','')}${o.isMark ? '；进入本命重点主题宫位' : ''}${o.dblJi ? '；流年与大限化忌对应同一宫位' : ''}${o.jiaoZhan ? '；流年禄与大限忌对应同一宫位' : ''}${o.jiHit ? '；流年化忌落本命命宫三方四正' : ''}${o.luPal ? '；流年化禄对应本命' + o.luPal : ''}。仅为位置关系，不代表吉凶。"></i>`).join('');
    const cur = i === chart.currentDaXianIndex;
    // 展开层：逐年明细
    const detail = years.map(o => {
      return `<tr${o.y === nowY ? ' class="now"' : ''}><td>${o.y}</td>` +
        `<td>${disp(o.liuPal.name).replace('宫','')}${o.isMark ? ' ◆换挡' : ''}</td>` +
        `<td>${o.luPal ? '禄→' + o.luPal : '—'}</td>` +
        `<td>${o.jiPal ? '忌→' + o.jiPal + (o.jiHit ? '（入命方）' : '') : '—'}</td>` +
        `<td>${withTerms(yearStory(o))}</td></tr>`;
    }).join('');
    return `<div class="tl-row${cur ? ' cur' : ''}" data-dx="${i}">
      <div class="tl-age">${dx.startAge}–${dx.endAge}<span>${y1}–${y2}</span></div>
      <div class="tl-body">
        <div class="tl-line1"><b>${name}</b><span class="tl-stars">${esc(majors)}</span>
          <span class="tl-lvl">${lvl}</span></div>
        <div class="tl-theme">${esc(DX_THEME[name] || '')}</div>
        <div class="tl-line2">
          ${sh && sh.lu ? `<span class="tl-sh">限禄 ${esc(sh.lu)}→${esc(sihuaStarPalace(chart, sh.lu))}</span>` : ''}
          ${sh && sh.ji ? `<span class="tl-sh ji">限忌 ${esc(sh.ji)}→${esc(sihuaStarPalace(chart, sh.ji))}</span>` : ''}
          ${marks.length ? `<span class="tl-mk">换挡 ${marks.slice(0, 3).join('、')}${marks.length > 3 ? '…' : ''}</span>` : ''}
          ${dblYears.length ? `<span class="tl-sh ji">⛔双忌 ${dblYears.slice(0, 3).join('、')}${dblYears.length > 3 ? '…' : ''}</span>` : ''}
          ${jzYears.length ? `<span class="tl-sh">⚡交战 ${jzYears.slice(0, 3).join('、')}${jzYears.length > 3 ? '…' : ''}</span>` : ''}
        </div>
        <div class="tl-spark" title="金柱＝换挡年 · 红柱＝化忌入命方 · 深红＝双忌叠压 · 蓝柱＝平稳年">${spark}</div>
        <div class="tl-expand"><table class="tl-table"><tr><th>年</th><th>流年命宫</th><th>禄</th><th>忌</th><th>这一年</th></tr>${detail}</table>
          <p class="hint">◆主题宫位＝流年命宫进入本命命、官、财、夫之一；“忌入命方”表示流年化忌落在本命命宫三方四正。两者只描述规则位置，不代表当年吉凶。</p></div>
      </div></div>`;
  }).join('');
  const curDx = chart.daXians[chart.currentDaXianIndex] || {};
  const nextMark = (() => {
    for(let y = nowY + 1; y <= (birthY + (curDx.endAge || 0)); y++){
      if(keyBranches.includes(((y - 4) % 12 + 12) % 12)) return y;
    }
    return null;
  })();
  body.innerHTML =
    `<p class="hint" style="margin:0 0 8px">时间轴列出大限宫位、对应星曜、四化落点和逐年流年命宫，供复盘与核对。金柱表示流年命宫进入本命重点主题宫位；红柱表示化忌落本命命宫三方四正；蓝柱表示未触发这两类标记。颜色只区分盘面位置，不代表吉凶或事件概率。点击各层查看逐年明细。</p>` + rows +
    `<p class="hint" style="margin:10px 0 0">当前 ${curDx.startAge || '—'}–${curDx.endAge || '—'} 岁大限落【${curDx.palaceName ? disp(curDx.palaceName) : ''}】。当前大限主题是盘面定位，不表示必然事件；未来时间节点是按规则排出的主题切换点，不宜据此单独决定工作、投资、关系或健康事项。</p>` +
    '';
  body.querySelectorAll('.tl-row').forEach(r => r.addEventListener('click', () => r.classList.toggle('open')));
  card.hidden = false;
}
/* ---------- 问运：盘面时间线与现实议题复盘 ---------- */
function currentLunarContext(chart){
  const today = bjDate();
  try{
    const gender = chart && chart.birthInfo && chart.birthInfo.gender || 'male';
    const dayChart = E.generateChart({year:today.y,month:today.m,day:today.d,hour:0,gender});
    const li = dayChart && dayChart.lunarInfo;
    if(li && Number.isInteger(li.lunarYear) && Number.isInteger(li.lunarMonth) &&
       Number.isInteger(li.lunarDay) && Number.isInteger(li.yearStem) && Number.isInteger(li.yearBranch)){
      return {year:li.lunarYear, month:li.lunarMonth, day:li.lunarDay, yearStem:li.yearStem, yearBranch:li.yearBranch, date:today, valid:true};
    }
  }catch(e){}
  return {year:null, month:null, day:null, yearStem:null, yearBranch:null, date:today, valid:false};
}
function wyYearsOf(chart, targetPalName){
  const now = currentLunarContext(chart), out = [];
  if(!now.valid) return out;
  const nowY = now.year;
  for(let y = nowY - 5; y <= nowY + 7; y++){
    let lsh = null; try{ lsh = normSihua(E.getLiuNianSiHua(y)); }catch(e){}
    if(!lsh) continue;
    const jiPal = lsh.ji ? sihuaStarPalace(chart, lsh.ji) : '';
    const luPal = lsh.lu ? sihuaStarPalace(chart, lsh.lu) : '';
    const quanPal = lsh.quan ? sihuaStarPalace(chart, lsh.quan) : '';
    const kePal = lsh.ke ? sihuaStarPalace(chart, lsh.ke) : '';
    const yb = ((y - 4) % 12 + 12) % 12;
    out.push({y,jiHit:jiPal===targetPalName,luHit:luPal===targetPalName,quanHit:quanPal===targetPalName,keHit:kePal===targetPalName,cmd:yb===chart.mingGongBranch,jiPal,luPal,quanPal,kePal});
  }
  return out;
}
function renderWenyun(){
  const rec = cur(), box = $('#answer-list');
  if(!box) return;
  if(!rec){box.innerHTML='<div class="empty">先排一张盘，问运会结合你的宫位和四化线索展开。</div>';return;}
  const chart=rec.chart, now=currentLunarContext(chart);
  if(!now.valid){box.innerHTML='<div class="empty">当前日期的农历换算暂不可用，问运内容已暂停流年与流月推算，避免显示错误年份。命盘本身仍可查看；请稍后重试。</div>';return;}
  const year=now.year;
  const lsh=normSihua(E.getLiuNianSiHua(year))||{};
  const yb=((year-4)%12+12)%12, lp=palaceByBranch(chart,yb);
  const blocks=[];
  const block=(icon,title,concl,rows,act,time)=>blocks.push(
    '<div class="ans-card wy"><div class="ans-head"><b>'+icon+' '+esc(title)+'</b></div>'+
    '<div class="wy-concl">'+withTerms(concl)+'</div>'+
    (rows.length?'<div class="wy-rows">'+rows.map(r=>'<div class="scr-row"><span class="scr-tag '+(r.cls||'')+'">'+esc(r.tag)+'</span><span class="scr-text">'+(r.html!=null?r.html:withTerms(r.text))+'</span></div>').join('')+'</div>':'')+
    (time?'<div class="wy-time">时间线索：'+withTerms(time)+'</div>':'')+
    (act&&act.length?'<div class="wy-act-title">可以带走的问题</div><ul class="wy-act">'+act.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+'</div>');
  const sihuaNames=[['lu','禄','资源与回应'],['quan','权','推动与责任'],['ke','科','表达与规范'],['ji','忌','牵挂与反复投入']];
  const palaceOfStar=star=>star?sihuaStarPalace(chart,star):'';
  const annualRows=sihuaNames.map(([k,label,meaning])=>{
    const star=lsh[k], target=palaceOfStar(star);
    return {tag:'化'+label,cls:'',text:star?'流年'+star+'化'+label+'，落在本命'+(target||'未定位')+'。传统象义可作为“'+meaning+'”的观察提示，不表示事件必然发生。':'当前规则未返回'+label+'星，建议核对流年规则设置。'};
  });
  const lpMajors=lp.stars.filter(x=>x.type==='major').map(x=>x.name).join('、')||'空宫（可合看对宫）';
  block('◉','本流年 · '+year,
    '按当前日期换算，本页使用农历'+year+'年作为流年口径。流年命宫落在本命'+disp(lp.name)+'，主星：'+lpMajors+'。这是传统盘面定位，代表观察入口，不是全年事件清单。',
    [{tag:'流年命宫',text:'本命'+disp(lp.name)+'（'+(GONG_SHORT[disp(lp.name)]||'该宫主题')+'）被放到年度观察位置。可以对照这一年真实发生的项目、关系与责任变化。'},...annualRows],
    ['今年你实际新增了哪些责任、资源或协作？哪些来自事实，哪些只是预期？','选一个可调整的小行动验证判断，不因盘面符号仓促辞职、借贷、投资或结束关系。'],
    null);
  const monthCards=[];
  for(let m=1;m<=12;m++){
    let msh=null;try{msh=now.yearStem!=null?normSihua(E.getLiuYueSiHua(now.yearStem,m)):null;}catch(e){}
    const monthPal=palaceByBranch(chart,((doujunBranch(chart,year)+m-1)%12+12)%12);
    monthCards.push({m,msh,monthPal});
  }
  const monthButtons=monthCards.map(x=>'<button type="button" class="wy-month-btn'+(x.m===now.month?' on':'')+'" data-wy-month="'+x.m+'" aria-pressed="'+(x.m===now.month?'true':'false')+'">农历'+x.m+'月</button>').join('');
  block('◷','逐月查看 · 流月四化',
    '点选月份查看传统流月干星与本命宫位的对应。月份按农历显示；闰月的流派拆分方式可能不同，本页按引擎默认规则合并为十二个序号。',
    [{tag:'月份',html:'<div class="wy-month-picker" role="group" aria-label="选择农历月份">'+monthButtons+'</div><div id="wy-month-detail" class="wy-month-detail" aria-live="polite"></div>'}],
    ['把象意当作复盘提纲：该月实际面对什么议题？有哪些客观信息可以验证？','出生日期、时辰或流派设置不同，流月解读会变化；不把“禄/忌”直接翻译成获利/损失。'],null);
  const relationship=palaceByName(chart,'夫妻宫'),relationshipMajors=relationship.stars.filter(x=>x.type==='major');
  const relationshipStem=E.getSiHuaByStem(relationship.stem)||{};
  const relationshipLine=['禄','权','科','忌'].filter(h=>relationshipStem[h]).map(h=>relationshipStem[h]+'化'+h).join('、');
  const fuqYears=wyYearsOf(chart,'夫妻宫').filter(x=>x.cmd||x.luHit||x.jiHit);
  block('♡','关系与亲密议题',
    relationshipMajors.length?'夫妻宫主星为'+relationshipMajors.map(x=>x.name+(x.brightnessRaw?'（亮度表：'+x.brightnessRaw+'）':'')).join('、')+'。传统解读会把它与命宫的相处方式、福德宫的情绪需求合看；它不能判断是否有“正缘”或何时结婚。':'夫妻宫无主星，按常见做法需参看对宫及三方四正；这不代表缺少关系机会，也不代表关系没有固定模式。',
    [{tag:'盘面依据',text:'夫妻宫宫干四化星：'+(relationshipLine||'当前未显示四化星')+'。需继续看这些星落在哪一宫、是否有同宫或会照关系。'}, {tag:'流年',text:fuqYears.length?'这些农历年出现夫妻宫主题的传统盘面触发线索：'+fuqYears.slice(0,4).map(x=>x.y).join('、')+'。它们不等于恋爱、结婚或分手年份。':'未来若未见明显触发线索，也不能据此断言关系不会变化。'}],
    ['回想近期关系中的沟通、边界和投入是否平衡；需要时直接确认对方想法。','择偶和关系决定看现实中的尊重、安全、价值观与持续行为，盘面不能替代双方沟通。'],
    '流年线索按农历年列示，仅适合作为回看问题的时间索引。');
  const wealth=palaceByName(chart,'财帛宫'),wealthMajors=wealth.stars.filter(x=>x.type==='major');
  const wealthStem=E.getSiHuaByStem(wealth.stem)||{};
  const wealthFour=['禄','权','科','忌'].filter(h=>wealthStem[h]).map(h=>wealthStem[h]+'化'+h+'飞'+palaceOfStar(wealthStem[h])).join('；');
  block('◇','收入、资源与财务习惯',
    wealthMajors.length?'财帛宫主星为'+wealthMajors.map(x=>x.name).join('、')+'。传统取象可用于讨论资源获取、价值交换和管理习惯，不是收入水平或财富结果的预测。':'财帛宫无主星，可合看对宫及三方四正；这不意味着财务能力不足或收入来源受限。',
    [{tag:'宫干四化',text:wealthFour||'财帛宫宫干四化未形成可展示的落点。可结合实际收入结构、稳定性和支出责任看。'}, {tag:'现实核对',text:'先区分现金流、资产、负债和风险承受能力。命盘不包含你的账户、合同、行业或税务信息。'}],
    ['设定应急储备和可承受损失上限；投资决策依据公开信息、风险评估与专业意见。','涉及借贷、担保、大额消费或投资时，先阅读合同并独立核实，不以“流年顺逆”作决策依据。'],
    null);
  const career=palaceByName(chart,'官禄宫'),careerMajors=career.stars.filter(x=>x.type==='major');
  const careerStem=E.getSiHuaByStem(career.stem)||{};
  const careerFour=['禄','权','科','忌'].filter(h=>careerStem[h]).map(h=>careerStem[h]+'化'+h+'飞'+palaceOfStar(careerStem[h])).join('；');
  const careerYears=wyYearsOf(chart,'官禄宫').filter(x=>x.cmd||x.luHit||x.jiHit);
  block('⌁','工作方式与职业议题',
    careerMajors.length?'官禄宫主星为'+careerMajors.map(x=>x.name).join('、')+'。本站只把传统星曜象义转成反思问题，不据此指定职业、跳槽时机或事业成败。':'官禄宫无主星，需结合对宫、三方四正及现实经历；这不代表没有职业方向。',
    [{tag:'宫干四化',text:careerFour||'官禄宫宫干四化未形成可展示的落点。'}, {tag:'年度线索',text:careerYears.length?'以下年份只表示传统盘面的主题触发：'+careerYears.slice(0,4).map(x=>x.y).join('、')+'。并非“该跳槽/该冲刺”的建议。':'当前规则未列出明显年度触发点，不代表事业静止。'}],
    ['列出你擅长、愿意持续做、市场愿意付费的交集，再用小项目或访谈验证。','跳槽、创业或谈薪以岗位信息、现金储备、合同条件、团队与家庭情况为准。'],
    null);
  box.innerHTML=blocks.join('')+
    '<div class="hint" style="margin:14px 0 0">读法说明：本页以当前本地命盘、引擎默认流年/流月规则生成传统象意线索。星曜落宫与四化计算是盘面规则结果；象意解释属于文化框架，不能验证现实事件，也没有可靠的命中率数据。大事请结合事实与专业意见。</div>';
  const drawMonth=m=>{
    const item=monthCards.find(x=>x.m===m)||monthCards[0], target=$('#wy-month-detail');
    if(!target)return;
    const names=['禄','权','科','忌'];
    const rows=names.map(name=>{
      const k={禄:'lu',权:'quan',科:'ke',忌:'ji'}[name], star=item.msh&&item.msh[k], place=palaceOfStar(star);
      return '<div class="wy-month-row"><b>化'+name+'</b><span>'+(star?esc(star)+' → 本命'+esc(place||'未定位'):'当前规则未返回对应星曜')+'</span></div>';
    }).join('');
    target.innerHTML='<b>农历'+m+'月 · 流月命宫参考落在'+esc(disp(item.monthPal.name))+'</b>'+rows+
      '<p class="hint">以上列的是传统规则对应关系，不是该月必然发生的事。闰月拆分、起月口径可能因流派而异。</p>';
  };
  box.querySelectorAll('[data-wy-month]').forEach(btn=>btn.addEventListener('click',()=>{
    const m=+btn.dataset.wyMonth;
    box.querySelectorAll('[data-wy-month]').forEach(b=>{const on=+b.dataset.wyMonth===m;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));});
    drawMonth(m);
  }));
  drawMonth(now.month||1);
}

/* 术语词典：分析句内术语可点解释（痛点：看不懂术语） */
const TERM_DICT = {
  '化禄':'四化之一。传统象义常取资源、连接、兴趣或较易获得回应的方向。它落在某宫是该宫的观察线索，不等于收入、感情或机会一定增加；需合看星曜、宫位、三方四正、时间层与流派。',
  '化权':'四化之一。传统象义常取推动、主导、责任和执行，也可能提示控制感或压力。它不是现实权力、升职或成功的保证。',
  '化科':'四化之一。传统象义常取学习、表达、规范、名誉与缓冲。它不保证考试通过、贵人出现或问题自动解决。',
  '化忌':'四化之一。传统象义常取牵挂、反复投入、受阻或需要处理的议题。不是灾祸判定；需看具体星曜、宫位、会照、时间层和所用流派。',
  '三方四正':'以一个宫位为中心，同时参考本宫、对宫和两个三合宫的星曜与四化。各家对星曜范围、权重和会照规则有差异，本站采用当前排盘规则，不代表唯一标准。',
  '大限':'按五行局、顺逆等规则划分的十年时间段。页面显示的是排盘规则下的年龄与宫位，不是十年内一定发生的事件。',
  '流年':'按年度规则观察命宫、四化等位置变化。紫微流年常按农历年干支取值；公历与农历新年交界时需明确口径。流年象意不是事件清单。',
  '流月':'按农历月份与采用的起月规则观察四化和宫位变化。闰月拆分、起月法存在流派差异；本站的月份序号是引擎默认实现。',
  '自化':'宫干使宫内星曜出现四化的盘面关系。不同流派对自化、离心/向心及飞化链的定义不完全一致，本站按当前规则展示，不把它简化成“能量漏掉”或损失。',
  '来因宫':'部分流派使用的宫位概念，常按生年天干等规则定位，并赋予个人主题解释。它不是所有紫微体系共有的核心，也不能证明人生目的。',
  '庙旺':'部分亮度体系给星曜的状态标记。亮度表的来源、适用星曜和等级划分依流派而异，不是客观能量或能力测量。',
  '落陷':'传统亮度表中的状态标记之一。不能单凭它判定星曜“无力”、人格缺点或现实不顺，需核对所用表格和全盘组合。',
  '空宫':'某宫没有主星。部分流派会借看对宫主星及三方四正；空宫不是缺陷，也不代表少主见、人生空白或没有相关主题。',
  '命宫':'紫微盘十二宫之一，是传统排盘的重要观察位。其星曜组合属于象意解释，不等同于完整人格、心理量表或人生定论。',
  '身宫':'按出生时辰等规则定位的观察宫位，传统上常用于讨论行动落点或后天关注。不存在各派都认可的固定年龄界线，也不是“中年后才生效”。',
  '五行局':'由命盘规则推得的水二局、木三局等分类，参与安星与大限起法。它是体系内部的计算参数，不是科学测得的个人属性。',
  '禄转忌':'部分飞星技法追踪化禄落点与该宫宫干再次化忌的关系。属于特定流派的推演方法，口径和成立条件应单独说明，不宜直接写成“得到必付代价”。',
  '十神':'八字体系以日主与其他天干地支的生克关系建立的分类。十神取象随性别、格局和流派有不同解法，不是稳定的人格或职业标签。',
  '日主':'八字日柱的天干，是许多八字分析的参照中心。日主五行由排盘规则决定；解读还要看月令、通根、组合与采用的流派。',
};

function withTerms(text){
  let out = esc(text);
  Object.keys(TERM_DICT).forEach(t => {
    out = out.replace(new RegExp(t, 'g'), `<span class="term" data-term="${t}">${t}</span>`);
  });
  return out;
}
document.addEventListener('click', e => {
  const t = e.target.closest('.term');
  if(t){ modal(t.dataset.term, esc(TERM_DICT[t.dataset.term] || '')); }
});
/* ---------- 飞星象义句式生成（梁派六内六外规则，白话克制版） ---------- */
const GONG_SHORT = { '命宫':'自我与活法','兄弟宫':'同辈与合伙','夫妻宫':'亲密关系','子女宫':'晚辈与作品','财帛宫':'钱与价值','疾厄宫':'身体与情绪','迁移宫':'外部世界','交友宫':'人际圈层','官禄宫':'事业','田宅宫':'家与安稳','福德宫':'精神世界','父母宫':'长辈与平台' };
const NEI6 = ['命宫','夫妻宫','财帛宫','疾厄宫','官禄宫','田宅宫']; // 六内：忌入为收藏
const SELF_HUA_SAY = {
  '禄':'传统上可观察资源如何回流、是否容易重复投入；不表示资源必然流失',
  '权':'传统上可观察主导与责任如何落在自己身上；不等于控制欲判断',
  '科':'传统上可观察表达、规范与对外呈现；不代表必须隐藏情绪',
  '忌':'传统上可观察牵挂与反复处理的议题；不是缺点或必然受阻',
};
function flySay(fromName, hua, toName){
  const A=GONG_SHORT[fromName]||fromName,B=GONG_SHORT[toName]||toName;
  const meaning={'禄':'资源、连接或回应','权':'推动、责任或主导','科':'表达、规范或认可','忌':'牵挂、反复投入或待处理议题'}[hua]||'传统象意';
  return '按本站采用的飞化规则，'+A+'相关的化'+hua+'落在'+B+'。传统解读可把它作为“'+meaning+'”的观察线索；它不说明现实中一定发生什么，需结合全盘、时间层和实际情况。';
}
function selfSay(palName, hua){
  const A=GONG_SHORT[palName]||palName;
  return A+'宫自化'+hua+'：'+(SELF_HUA_SAY[hua]||'按本站规则显示的传统象意线索')+'。不同流派定义可能不同，不能单独断吉凶。';
}
/* ---------- 择日助手：未来 30 天按事项推荐 ---------- */
const ZERI_TYPES = [
  { k:'sign', name:'签约 · 面试', good:['官禄宫','父母宫'], bad:['官禄宫'] },
  { k:'love', name:'告白 · 求婚', good:['夫妻宫','福德宫'], bad:['夫妻宫'] },
  { k:'move', name:'出行 · 搬家', good:['迁移宫','田宅宫'], bad:['迁移宫'] },
  { k:'open', name:'开业 · 启动', good:['官禄宫','财帛宫'], bad:['官禄宫','财帛宫'] },
];
function renderZeri(){
  const rec=cur(),box=$('#zeri-body');
  if(!box)return;
  if(!rec){box.innerHTML='<div class="empty">先排一张盘，再查看传统流日四化的象意日历。</div>';return;}
  const chart=rec.chart,today=bjDate();
  box.innerHTML='<p class="hint">正在生成未来 30 天的农历象意索引…</p>';
  setTimeout(()=>{
    try{
      const days=[];
      for(let offset=1;offset<=30;offset++){
        const utc=new Date(Date.UTC(today.y,today.m-1,today.d+offset));
        const y=utc.getUTCFullYear(),m=utc.getUTCMonth()+1,d=utc.getUTCDate();
        const dc=E.generateChart({year:y,month:m,day:d,hour:0,gender:'male'}),li=dc&&dc.lunarInfo;
        if(!li||!li.lunarYear||!li.lunarMonth||!li.lunarDay)continue;
        const sh=normSihua(E.getLiuRiSiHua(li.lunarYear,li.lunarMonth,li.lunarDay));
        if(!sh)continue;
        const dest={};
        [['禄','lu'],['权','quan'],['科','ke'],['忌','ji']].forEach(([name,key])=>{dest[name]=sh[key]?sihuaStarPalace(chart,sh[key]):'';});
        const dj=doujunBranch(chart,li.lunarYear);
        const focus=palaceByBranch(chart,((dj+li.lunarMonth-1+li.lunarDay-1)%12+12)%12);
        days.push({y,m,d,lm:li.lunarMonth,ld:li.lunarDay,sh,dest,focus:focus?disp(focus.name):'—'});
      }
      if(!days.length){box.innerHTML='<div class="empty">农历日期暂不可用，请稍后重试。</div>';return;}
      box.innerHTML='<label class="zeri-label" for="zeri-type">查看主题</label><select id="zeri-type">'+ZERI_TYPES.map(t=>'<option value="'+esc(t.k)+'">'+esc(t.name)+'</option>').join('')+'</select>'+
        '<p class="hint zeri-note">下面按日期排列，不评“吉日/凶日”，也不计算适合度分数。选择事项后仅提示传统流日四化落点，供文化研究和自我提问。</p><div id="zeri-out" class="zeri-calendar"></div>';
      const sel=box.querySelector('#zeri-type'),out=box.querySelector('#zeri-out');
      const draw=()=>{
        const t=ZERI_TYPES.find(x=>x.k===sel.value)||ZERI_TYPES[0],themes=t.focus||[];
        out.innerHTML=days.map(day=>{
          const date=new Date(Date.UTC(day.y,day.m-1,day.d));
          const dateLabel=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'long',day:'numeric',weekday:'short'}).format(date);
          const details=[['禄','lu'],['权','quan'],['科','ke'],['忌','ji']].map(([name,key])=>'<span><b>化'+name+'</b> '+(day.sh[key]?esc(day.sh[key])+' → '+esc(day.dest[name]||'未定位'):'未返回')).join('　');
          return '<article class="zeri-day"><header><b>'+dateLabel+'</b><span>农历'+day.lm+'月'+day.ld+'日</span></header>'+
            '<p class="zeri-focus">流日命宫参考：'+esc(day.focus)+'</p><div class="zeri-hua">'+details+'</div>'+
            '<p class="hint">所选主题：'+esc(t.name)+'；相关宫位：'+esc(themes.join('、')||'请以问题本身为准')+'。落点是传统象意，不表示该事项当天更容易成功或失败。</p></article>';
        }).join('');
      };
      sel.addEventListener('change',draw);draw();
    }catch(err){box.innerHTML='<div class="empty">日历生成暂时失败。请核对日期与流日规则设置后重试。</div>';}
  },30);
}
const SIGN_LIB = [
  { lv:'吉', t:'云开月明', s:'浮云散尽月当空，守得安静自光明。', yi:'静候 · 复盘', jie:'急事缓办，答案会自己浮上来' },
  { lv:'吉', t:'春风渡水', s:'春风不问来时路，渡水穿林自有时。', yi:'启动 · 联络', jie:'该开口的事，今天就开口' },
  { lv:'吉', t:'灯下有米', s:'灯下有米灶有烟，寻常日子最养人。', yi:'归家 · 好好吃饭', jie:'别把近处的安稳看轻了' },
  { lv:'吉', t:'星垂平野', s:'星垂平野阔，路是走宽的。', yi:'远行 · 见世面', jie:'把视野放大，事就变小' },
  { lv:'吉', t:'静水流深', s:'静水流深处，暗自用力时。', yi:'深耕 · 打磨手艺', jie:'不响，并不代表没有在涨' },
  { lv:'吉', t:'贵人指路', s:'山重水复处，恰好有人提灯来。', yi:'请教 · 合作', jie:'张口问一句，少走三天弯路' },
  { lv:'吉', t:'瓜熟蒂落', s:'瓜熟自然落，功到自然成。', yi:'收尾 · 交付', jie:'临门一脚别慌，稳稳送出去' },
  { lv:'吉', t:'旧友重逢', s:'旧友一席话，胜读十年书。', yi:'叙旧 · 道谢', jie:'有个该联系的人，今天就联系' },
  { lv:'吉', t:'月满则近', s:'月将满时最好看，事将成时最要稳。', yi:'守成 · 查漏', jie:'最后一公里，慢就是快' },
  { lv:'吉', t:'雪后初晴', s:'雪压枝头终有时，一朝晴日照新姿。', yi:'翻身 · 恢复', jie:'低谷不是句号，是逗号' },
  { lv:'中', t:'雾里看山', s:'雾里看山山不远，等风来时自分明。', yi:'观察 · 暂缓表态', jie:'看不清的事，先不急着下结论' },
  { lv:'中', t:'磨刀待时', s:'磨刀不误砍柴工，慢工细活见真章。', yi:'准备 · 学习', jie:'还没到出手的时候，先把刀磨快' },
  { lv:'中', t:'小舟过滩', s:'小舟过滩水声急，掌稳了篙不回头。', yi:'专注 · 单点突破', jie:'这段水急，别左顾右盼' },
  { lv:'中', t:'半盏茶', s:'半盏茶凉半盏温，世间事多半留一半。', yi:'降低期待 · 接受不完美', jie:'七八分好，就是很好' },
  { lv:'中', t:'移树问土', s:'移树先问土，换轨先问心。', yi:'权衡 · 调研', jie:'大动作之前，先做小调研' },
  { lv:'中', t:'补屋趁晴', s:'补屋要趁天晴时，未雨绸缪是聪明。', yi:'体检 · 排险 · 备份', jie:'顺手把隐患处理了' },
  { lv:'中', t:'同舟共渡', s:'一人摇橹慢，同舟渡水宽。', yi:'求助 · 分工', jie:'能分担的，别一个人扛' },
  { lv:'中', t:'种豆得豆', s:'种豆得豆种瓜瓜，功夫不负种田人。', yi:'投入 · 积累', jie:'今天撒的种，秋后见分晓' },
  { lv:'中', t:'借风使船', s:'好风凭借力，送我上青云。', yi:'借势 · 用工具', jie:'有现成的顺风，何必硬顶风走' },
  { lv:'中', t:'纸上行舟', s:'纸上得来终觉浅，绝知此事要躬行。', yi:'动手 · 试错', jie:'想清楚了就去试，别再纸上演算' },
  { lv:'中', t:'巷口灯昏', s:'巷口灯昏路仍明，走慢一点也到家。', yi:'休息 · 早睡', jie:'累了的信号，别用咖啡盖过去' },
  { lv:'中', t:'秤上称心', s:'人心如秤自称心，公道自在 明白人。', yi:'公正 · 说明白话', jie:'把话说清楚，误会就少一半' },
  { lv:'平', t:'逆水行舟', s:'逆水行舟用力撑，一篙松劲退千寻。', yi:'坚持 · 别松手', jie:'这段费劲，但退一步更亏' },
  { lv:'平', t:'独木桥', s:'独木桥上让三分，不是怕来是格局。', yi:'退让 · 避争', jie:'争赢一口气，输掉一局棋' },
  { lv:'平', t:'叶落知秋', s:'一叶落而知秋，见微知著早调头。', yi:'复盘 · 及时止损', jie:'坏消息越早面对，代价越小' },
  { lv:'平', t:'井底观天', s:'井底观天天亦小，出去走走再说话。', yi:'换个环境 · 换个脑子', jie:'困住你的可能是视角不是处境' },
  { lv:'平', t:'多歧路', s:'岔路多时莫赶路，坐下画张图再走。', yi:'暂停 · 理优先级', jie:'选择焦虑的解药是排序' },
  { lv:'平', t:'酒逢知己', s:'酒逢知己千杯少，话不投机半句多。', yi:'筛选社交 · 少凑热闹', jie:'无效的局，推了就推了' },
  { lv:'平', t:'悬而未决', s:'悬而未决最磨人，设个期限安己心。', yi:'给拖延的事定截止日', jie:'悬着的事，今天推它一步' },
  { lv:'平', t:'守拙', s:'藏巧于拙用处大，锋芒收在鞘中藏。', yi:'低调 · 蓄力', jie:'这一阵，让作品替你说话' },
];
const SIGN_LV_CLS = { '吉':'lv-ji', '中':'lv-zhong', '平':'lv-ping' };
const CN_NUM = ['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','二十一','二十二','二十三','二十四','二十五','二十六','二十七','二十八','二十九','三十'];
function dailySign(rec){
  const bd = bjDate();
  const seed = (rec ? rec.id : 'guest') + '|' + bd.y + '-' + bd.m + '-' + bd.d;
  const rnd = mulberry([...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7));
  const idx = Math.floor(rnd() * SIGN_LIB.length);
  return {no:'提示 '+String(idx+1).padStart(2,'0'),...SIGN_LIB[idx],lv:'行动提示',lvCls:'lv-zhong'};
}
function SIGN_LVCls(lv){ return { '吉':'lv-ji', '中':'lv-zhong', '平':'lv-ping' }[lv] || 'lv-zhong'; }
/* 今日顺时：日支的三合/六合时支（硬规则，不装神弄鬼） */
function luckyHoursToday(){
  const li = todayLunar();
  const dayGz = li && li.fourPillars && li.fourPillars[2];
  if(!dayGz) return null;
  const b = BR.indexOf(dayGz[1]);
  if(b < 0) return null;
  const liuHe = (b + 6) % 12;                       // 六合
  const groups = [[0,4,8],[1,5,9],[2,6,10],[3,7,11]]; // 三合局
  const g = groups.find(gr => gr.includes(b));
  const picks = [...new Set([liuHe, ...g.filter(x => x !== b)])];
  return picks.map(x => `${BR[x]}时（${SHICHEN[x === 0 ? 0 : x].range}）`).join(' · ');
}
/* 今日小运 · 流日定制版：流日命宫点亮本命哪一宫＋流日四化飞到哪＝每天每人都不一样 */
const DAILY_FOCUS_SAY = {
  '命宫':'今天可自问：最重要的一件事是什么？',
  '兄弟宫':'今天可自问：哪些合作需要把分工说得更清楚？',
  '夫妻宫':'今天可自问：我是否把猜测当成了对方的真实想法？',
  '子女宫':'今天可自问：是否给创作、学习或照料留出合适时间？',
  '财帛宫':'今天可自问：这项支出是否符合预算与实际需要？',
  '疾厄宫':'今天可自问：身体状态是否需要休息或专业关注？',
  '迁移宫':'今天可自问：出行与环境变化的事实条件是否核对完整？',
  '交友宫':'今天可自问：合作边界、承诺和信息是否说清楚？',
  '官禄宫':'今天可自问：当前最重要的工作目标和验收标准是什么？',
  '田宅宫':'今天可自问：家庭空间或待办事项中，什么最值得先处理？',
  '福德宫':'今天可自问：什么活动能帮助我恢复精力？',
  '父母宫':'今天可自问：与长辈或组织沟通时，需求是否表达具体？',
};
/* 今日的农历信息：借引擎排一张"今日盘"读 lunarInfo（本地计算，不存档） */
function todayLunar(){
  try{
    const bd = bjDate();
    const tc = E.generateChart({ year: bd.y, month: bd.m, day: bd.d, hour: 6, gender: 'male' });
    return (tc && tc.lunarInfo) || null;
  }catch(e){ return null; }
}
/* 按命盘定制的今日小运文本；无盘或算不出时返回 null（调用方用通用版兜底） */
function dailyFortuneFor(chart){
  if(!chart)return null;
  const li=todayLunar();if(!li||!li.lunarMonth||!li.lunarDay)return null;
  let sh=null;try{sh=normSihua(E.getLiuRiSiHua(li.lunarYear,li.lunarMonth,li.lunarDay));}catch(e){}
  if(!sh)return null;
  const dj=doujunBranch(chart,li.lunarYear);
  const branch=((dj+li.lunarMonth-1+li.lunarDay-1)%12+12)%12;
  const focus=palaceByBranch(chart,branch),focusName=focus?disp(focus.name):'命宫';
  const parts=['按当前传统流日规则，今天的观察焦点落在本命'+focusName+'；可用这个主题提出一个问题：'+(DAILY_FOCUS_SAY[focusName]||'今天哪些事实值得核对？')];
  [['禄','lu'],['权','quan'],['科','ke'],['忌','ji']].forEach(([name,key])=>{
    const star=sh[key],palace=star?sihuaStarPalace(chart,star):'';
    if(star)parts.push('流日化'+name+'为'+star+(palace?'，落本命'+palace:'')+'。这是传统符号对应，不代表当天发生好事或坏事');
  });
  return parts.join('；')+'。';
}
function renderHome(){
  // 每日复盘提示：固定行动问题；盘面部分仅呈现传统流日象意
  const bd = bjDate();
  const rec = cur();
  const custom = rec ? dailyFortuneFor(rec.chart) : null;
  const key = bd.y*372 + bd.m*31 + bd.d;
  const generic = D.dailyFortunes[key % D.dailyFortunes.length];
  const sign = dailySign(rec);
  $('#daily-kicker').textContent = rec ? `${rec.name}的每日复盘提示` : '每日复盘提示';
  $('#daily-text').innerHTML =
    `<div class="sign-head"><span class="sign-no">${sign.no}</span>` +
    `<span class="sign-lvl ${sign.lvCls}">${sign.lv}</span><span class="sign-title">${esc(sign.t)}</span></div>` +
    `<div class="sign-text">${esc(sign.s)}</div>` +
    `<p class="sign-yi" style="margin:2px 0 6px"><b>宜</b> ${esc(sign.yi)}　<b>提醒</b> ${esc(sign.jie)}</p>` +
    `<p class="hint" style="margin:6px 0 0">盘面反思线索（传统象意，不是事件预测）：${esc(custom || generic)}</p>`;
  // 今日顺时（地支三合/六合）
  const lh = luckyHoursToday();
  $('#daily-lucky-hours').textContent = lh ? `传统日支合气参考时段：${lh} ｜ 民俗象意，不代表实际事项成功率` : ''; 
  // hero 今日一行 + 犯太岁
  renderTaisuiCard();
  const li2 = todayLunar();
  const gz2 = (li2 && li2.fourPillars && li2.fourPillars[2]) ? ` · ${li2.fourPillars[2]}日` : '';
  const hnToday = $('#hn-today');
  if(hnToday) hnToday.textContent = `TODAY ${bd.y}.${pad2(bd.m)}.${pad2(bd.d)}${gz2}${rec ? ' · ' + rec.name : ''}`;
  // 首页命主画像卡：有盘才显示，复用十二宫命宫卡的画像
  const phc = $('#portrait-home-card');
  if(rec && rec.chart && typeof mingPortraitHTML === 'function'){
    const mp = mingPortraitHTML(rec.chart);
    if(mp){ phc.hidden = false; $('#portrait-home-body').innerHTML = mp; }
    else phc.hidden = true;
  } else if(phc) phc.hidden = true;
  $('#daily-date').textContent = `${bd.m} 月 ${bd.d} 日${gz2}${custom ? '' : ' · 排一张盘，签与解按你的命盘定制'}`;
  // hero 主按钮智能化：有盘→查看命盘，无盘→开始排盘
  const cta = document.querySelector('.hn-cta');
  if(cta){
    if(rec){ cta.textContent = '查看命盘 →'; cta.dataset.nav = 'chart'; }
    else { cta.textContent = '开始排盘 →'; cta.dataset.nav = 'input'; }
  }
}
/* 轻合拍：分享链接打开对方的盘时，与本机「我」的盘快评（日柱合/生肖/紫微互飞） */
const GAN5_HE = { '甲':'己','乙':'庚','丙':'辛','丁':'壬','戊':'癸','己':'甲','庚':'乙','辛':'丙','壬':'丁','癸':'戊' };
const ZHI6_HE = { '子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午' };
const ZHI3_HE = [['申','子','辰'],['寅','午','戌'],['巳','酉','丑'],['亥','卯','未']];
function heCardData(chartA, chartB, nameA, nameB){
  const gzA = chartA.lunarInfo.fourPillars[2], gzB = chartB.lunarInfo.fourPillars[2];
  const rows = []; let score = 60;
  const sA = BR.indexOf(gzA[1]), sB = BR.indexOf(gzB[1]);
  const zodiac = b => '鼠牛虎兔龙蛇马羊猴鸡狗猪'[b];
  if(GAN5_HE[gzA[0]] === gzB[0]){ score += 10; rows.push({ tag:'日干五合', cls:'lu', text:`你们日柱天干${gzA[0]}${gzB[0]}相合（天干五合）——天然互相吸引，气场对得上` }); }
  if(ZHI6_HE[gzA[1]] === gzB[1]){ score += 10; rows.push({ tag:'日支六合', cls:'lu', text:`日支${gzA[1]}${gzB[1]}六合——过日子默契度高，生活习惯容易对齐` }); }
  else if(sA === sB){ score += 5; rows.push({ tag:'同日支', cls:'', text:`两人同属${gzA[1]}日支——节奏像，但容易较着劲，谁让一步谁赢` }); }
  else if(ZHI3_HE.some(g => g.includes(gzA[1]) && g.includes(gzB[1]))){ score += 8; rows.push({ tag:'生肖三合', cls:'lu', text:`生肖${zodiac(sA)}与${zodiac(sB)}三合——相处自带润滑，圈子也合得来` }); }
  else if((sA + 6) % 12 === sB){ score -= 5; rows.push({ tag:'生肖相冲', cls:'ji', text:`生肖${zodiac(sA)}与${zodiac(sB)}相冲——吸引力强但摩擦也多，聚少离多反而是保鲜法` }); }
  // 紫微互飞：A命宫忌入B夫妻宫 / B命宫忌入A夫妻宫 / 命宫主星同
  const mingA = chartA.palaces.find(p => p.isMingGong), mingB = chartB.palaces.find(p => p.isMingGong);
  const fuA = chartA.palaces.find(p => p.name === '夫妻' || disp(p.name) === '夫妻宫');
  const fuB = chartB.palaces.find(p => p.name === '夫妻' || disp(p.name) === '夫妻宫');
  const flyJi = (from, toFu, fromName, toName) => {
    const sh = E.getSiHuaByStem(from.stem) || {};
    if(sh['忌'] && toFu.stars.some(x => x.name === sh['忌']))
      rows.push({ tag:'在意', cls:'ji', text:`${fromName}的命宫化忌飞进${toName}的夫妻宫——${fromName}对这段关系的在意是实打实的，牵挂也是` });
  };
  flyJi(mingA, fuB, nameA, nameB); flyJi(mingB, fuA, nameB, nameA);
  const mA = mingA.stars.filter(x => x.type === 'major').map(x => x.name);
  const mB = fuB.stars.filter(x => x.type === 'major').map(x => x.name);
  const same = mA.find(n => mB.includes(n));
  if(same) rows.push({ tag:'同频', cls:'lu', text:`${nameA}的命宫主星与${nameB}的夫妻宫主星都有${same}——${nameB}要的正是${nameA}身上有的` });
  const fuLu = (() => {
    const sh = E.getSiHuaByStem(mingB.stem) || {};
    if(sh['禄'] && fuA.stars.some(x => x.name === sh['禄'])) return { tag:'送禄', cls:'lu', text:`${nameB}的命宫化禄飞进${nameA}的夫妻宫——${nameB}是给这段关系带资源、带顺的那一个` };
    const sh2 = E.getSiHuaByStem(mingA.stem) || {};
    if(sh2['禄'] && fuB.stars.some(x => x.name === sh2['禄'])) return { tag:'送禄', cls:'lu', text:`${nameA}的命宫化禄飞进${nameB}的夫妻宫——${nameA}是给这段关系带资源、带顺的那一个` };
    return null;
  })();
  if(fuLu) rows.push(fuLu);
  // 日主五行关系：相生=滋养 相克=推动（克制措辞，不下判断）
  const wxA = WX_OF_STEM[ST.indexOf(gzA[0])], wxB = WX_OF_STEM[ST.indexOf(gzB[0])];
  const SHENGW = {木:'水',火:'木',土:'火',金:'土',水:'金'}, KEW = {木:'土',土:'水',水:'火',火:'金',金:'木'};
  if(SHENGW[wxA] === wxB) rows.push({ tag:'五行', cls:'lu', text:`${nameA}日主${wxA}生${nameB}日主${wxB}——${nameA}天然愿意滋养${nameB}，注意别只输出不充电` });
  else if(SHENGW[wxB] === wxA) rows.push({ tag:'五行', cls:'lu', text:`${nameB}日主${wxB}生${nameA}日主${wxA}——${nameB}是那个默默托底的人` });
  else if(KEW[wxA] === wxB) rows.push({ tag:'五行', cls:'', text:`${nameA}日主${wxA}克${nameB}日主${wxB}——${nameA}推着${nameB}成长，力度是关键` });
  else if(KEW[wxB] === wxA) rows.push({ tag:'五行', cls:'', text:`${nameB}日主${wxB}克${nameA}日主${wxA}——${nameB}对${nameA}是鞭策型存在` });
  score = Math.max(45, Math.min(95, score));
  const level = score >= 85 ? '很合拍' : score >= 72 ? '有默契' : score >= 58 ? '要磨合' : '相处靠修炼';
  return { score, level, rows: rows.slice(0, 4) };
}
function renderHeCard(){
  const rec = cur();
  const card = $('#hecard'), body = $('#he-body');
  if(!card) return;
  if(!rec || rec.tag !== '分享'){ card.hidden = true; return; }
  const mine = archive.find(a => a.tag !== '分享' && a.id !== rec.id);
  if(!mine){ card.hidden = true; return; }
  const d = heCardData(rec.chart, mine.chart, rec.name || 'TA', mine.name || '我');
  body.innerHTML =
    `<div class="wy-concl">${esc(mine.name || '我')} 与 ${esc(rec.name || 'TA')}：${d.level}（${d.score} 分段）</div>` +
    d.rows.map(r => `<div class="scr-row"><span class="scr-tag ${r.cls}">${r.tag}</span><span class="scr-text">${withTerms(r.text)}</span></div>`).join('') +
    `<p class="hint" style="margin:8px 0 0">快评只看日柱与命宫飞化，是破冰不是判决。</p>
     <button class="btn-ghost btn-block" id="btn-he-share" style="margin-top:8px">把这张盘回传给 TA →</button>`;
  card.hidden = false;
  $('#btn-he-share')?.addEventListener('click', () => openShare('link'));
}
/* 四化总纲：来因宫 + 生年忌，两句话定调（速览组顶部） */
function renderBriefCard(chart){
  const card=$('#brief-card'),body=$('#brief-body');if(!card||!body)return;
  const li=chart.lunarInfo||{},yearStem=Number.isInteger(li.yearStem)?ST[li.yearStem]:'';
  const lai=yearStem?chart.palaces.find(p=>ST[p.stem]===yearStem):null;
  const sh=Number.isInteger(li.yearStem)?(E.getSiHuaByStem(li.yearStem)||{}):{};
  const items=['禄','权','科','忌'].filter(h=>sh[h]).map(h=>{const target=chart.palaces.find(p=>p.stars.some(x=>x.name===sh[h]));return `<li>按生年天干规则，${esc(sh[h])}化${h}落在${esc(target?disp(target.name):'待核对宫位')}。这是传统盘面关系，不是人生主线或结果保证。</li>`;}).join('');
  body.innerHTML='<p style="margin:0 0 6px"><b>来因宫（部分流派术语）：</b>'+(lai?esc(disp(lai.name))+'，按本站当前规则由生年天干定位。不同派别用法不一，不表示人生目的或“绕不开”的命题。':'当前资料未能定位。')+'</p><p style="margin:0 0 6px"><b>生年四化：</b>依据本盘农历年干与当前四化表得到的盘面落点：</p><ul style="margin-top:0">'+(items||'<li>当前规则未返回可展示项目，请检查出生资料和四化设置。</li>')+'</ul><p class="hint" style="margin:0">可以把这些位置作为复盘索引：分别写下现实事实、不同解释和可验证的问题。它们不能证明命运、性格或事件因果。</p>';
  card.hidden=false;
}
/* 右栏页签与折叠记忆 */
function setRGroup(rg){
  const available = $$('#rtabs button').map(b => b.dataset.rg);
  if(!available.includes(rg)) rg = available.includes('bazi') ? 'bazi' : available[0];
  $$('#rtabs button').forEach(b => b.classList.toggle('on', b.dataset.rg === rg));
  $$('.chart-right .rgroup').forEach(g => { g.hidden = g.dataset.rg !== rg; });
  store.set('gxg_rtab_v2', rg);
}
function initRightTabs(){
  const bar = $('#rtabs');
  if(!bar || bar.dataset.init) return;
  bar.dataset.init = '1';
  bar.addEventListener('click', e => {
    const b = e.target.closest('button[data-rg]');
    if(b) setRGroup(b.dataset.rg);
  });
  setRGroup(store.get('gxg_rtab_v2', 'bazi'));
}
function applyCollapseState(){
  const open = store.get('gxg_rcards', []);
  $$('.chart-right .card.collapsible').forEach(c => c.classList.toggle('open', open.includes(c.dataset.collapse)));
}
document.addEventListener('click', e => {
  const k = e.target.closest('.card.collapsible > .card-kicker.as-btn');
  if(!k) return;
  const card = k.parentElement;
  card.classList.toggle('open');
  const set = new Set(store.get('gxg_rcards', []));
  if(card.classList.contains('open')) set.add(card.dataset.collapse); else set.delete(card.dataset.collapse);
  store.set('gxg_rcards', [...set]);
});
/* 夜幕 hero 入场（一次性 WAAPI 时间线；reduced-motion 直接跳过） */
function heroEntrance(){
  if(!document.querySelector('.hero-night')) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const q = s => document.querySelector(s);
  const rise = (sel, delay, blur) => { const el = q(sel); if(!el) return;
    el.animate([{ opacity:0, transform:'translateY(16px)', filter:`blur(${blur || 10}px)` },
                { opacity:1, transform:'none', filter:'blur(0px)' }],
      { duration: 760, delay, easing:'cubic-bezier(.22,.61,.36,1)', fill:'both' }); };
  const wm = q('.hn-wordmark');
  if(wm) wm.animate([{ opacity:0, transform:'scale(.96)', filter:'blur(18px)' },
                     { opacity:1, transform:'none', filter:'blur(0)' }],
    { duration: 950, easing:'cubic-bezier(.22,.61,.36,1)', fill:'both' });
  const mo = q('.hn-moon');
  if(mo) mo.animate([{ opacity:0 }, { opacity:.9 }], { duration: 900, delay: 150, fill:'both' });
  rise('.hn-sub', 280);
  const lb = q('.hn-kicker');
  if(lb) lb.animate([{ opacity:0, letterSpacing:'.45em' }, { opacity:1, letterSpacing:'.28em' }],
    { duration: 850, delay: 380, easing:'ease-out', fill:'both' });
  rise('.hn-cta-row', 560, 8);
  rise('.hn-today', 720, 4);
}

/* ---------- 存档 ---------- */
function renderArchive(){
  $('#archive-list').innerHTML = archive.length ? archive.map(a =>
    `<div class="arch-item"><div><div class="t">${esc(a.name)} <span class="star-chip">${esc(a.tag)}</span></div>
     <div class="s">${a.input.year}-${pad2(a.input.month)}-${pad2(a.input.day)} ${BR[a.chart.birthInfo.hour]}时 · ${a.gender==='male'?'男':'女'}${a.id===currentId?' · 当前':''}</div></div>
     <div><button data-act="open" data-id="${a.id}">打开</button><button data-act="del" data-id="${a.id}">删除</button></div></div>`
  ).join('') : '<div class="empty">还没有命盘，去排第一张吧。</div>';
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if(!b) return;
  const id = b.dataset.id;
  if(b.dataset.act === 'open'){
    currentId = id; store.set('gxg_current', id);
    luckMode = 'natal'; luckParam = null;
    renderChart(); nav('chart');
  } else if(b.dataset.act === 'del'){
    archive = archive.filter(a => a.id !== id);
    if(currentId === id){ currentId = archive.length ? archive[0].id : null; }
    store.set('gxg_archive', archive); store.set('gxg_current', currentId);
    renderArchive();
  }
});

/* ---------- 定盘辅助 ---------- */
let dpHours = [];
function renderDingpan(){
  $('#dingpan-hours').innerHTML = SHICHEN.filter(s=>s.v!==12).map(s =>
    `<button class="chip${dpHours.includes(s.v)?' on':''}" data-h="${s.v}">${s.label}</button>`).join('') +
    `<button class="chip${dpHours.includes(12)?' on':''}" data-h="12">晚子时</button>`;
  const ys = []; const thisY = bjDate().y;
  for(let y=thisY; y>=1950; y--) ys.push(y);
  $('#dp-year').innerHTML = ys.map(y=>`<option value="${y}">${y} 年</option>`).join('');
}
document.addEventListener('click', e => {
  const c = e.target.closest('#dingpan-hours .chip'); if(!c) return;
  const h = +c.dataset.h;
  dpHours = dpHours.includes(h) ? dpHours.filter(x=>x!==h) : [...dpHours, h].slice(0,3);
  renderDingpan();
});
$('#btn-dingpan-next').addEventListener('click', () => {
  if(dpHours.length < 2){ $('#dingpan-result').innerHTML = '<div class="empty">至少选 2 个候选时辰才有得比。</div>'; return; }
  $('#dingpan-step1').hidden = true; $('#dingpan-step2').hidden = false;
});
/* 候选时辰在某年的"动静"启发值：流年命宫三方四正内的四化/煞星/天马计数。
 * 纯属粗糙提示，不作定盘依据——标注清楚，不伪装成精确评分。 */
function yearActivity(chart, y){
  const yBranch = ((y - 4) % 12 + 12) % 12;
  const sfs = sanfangBranches(yBranch);
  const ySh = normSihua(E.getLiuNianSiHua(y));
  const yStars = [ySh.lu, ySh.quan, ySh.ke, ySh.ji].filter(Boolean);
  let score = 0; const hits = [];
  sfs.forEach(b => {
    const p = palaceByBranch(chart, b);
    p.stars.forEach(s => {
      if(s.siHua){ score += 2; hits.push(`${disp(p.name)}${s.name}化${s.siHua}`); }
      if(yStars.includes(s.name)){ score += 2; hits.push(`${disp(p.name)}${s.name}（流年四化到）`); }
      if(s.type === 'sha'){ score += 1; hits.push(`${disp(p.name)}${s.name}`); }
      if(s.name === '天马'){ score += 1; hits.push(`${disp(p.name)}天马`); }
    });
  });
  const level = score >= 8 ? '高' : score >= 4 ? '中' : '低';
  return { score, level, hits: [...new Set(hits)].slice(0, 6) };
}
$('#btn-dingpan-run').addEventListener('click', () => {
  const y = +$('#dp-year').value, ev = $('#dp-event').value;
  const evName = $('#dp-event').selectedOptions[0].textContent;
  const yBranch = ((y - 4) % 12 + 12) % 12;
  // 生日来源：优先当前命主的存档 input（年月日/性别/出生地/经度全套），没有才读表单
  const baseRec = cur();
  const baseInput = (baseRec && baseRec.input) ? baseRec.input : {
    name: '', gender: segVal('f-gender'),
    year: +($('#f-year').value || 1990), month: +($('#f-month').value || 1), day: +($('#f-day').value || 1),
    province: $('#f-province').value || '', city: '', longitude: null, trueSolar: false, lateZiNextDay: false,
    exHour: '', exMin: '',
  };
  const rows = dpHours.map(h => {
    // 统一走 computeChart：夏令时、真太阳时、晚子时顺延日都与正式排盘同口径
    const inp = Object.assign({}, baseInput, { shichen: h, exHour: '', exMin: '' });
    let chart;
    try{ chart = computeChart(inp).chart; }
    catch(err){ return null; }
    const ming = chart.palaces.find(p=>p.isMingGong);
    const majors = ming.stars.filter(s=>s.type==='major').map(s=>s.name).join('、') || '空宫';
    const liuPalace = palaceByBranch(chart, yBranch);
    const liuMajors = liuPalace.stars.filter(s=>s.type==='major').map(s=>s.name).join('、') || '空宫';
    const sh = normSihua(E.getLiuNianSiHua(y));
    const jiStar = sh.ji, jiPalace = chart.palaces.find(p=>p.stars.some(s=>s.name===jiStar));
    const act = yearActivity(chart, y);
    return { h, label: SHICHEN.find(s=>s.v===h).label, majors, shen: disp(chart.palaces.find(p=>p.isShenGong).name),
      liu: `${disp(liuPalace.name)}（${liuMajors}）`, ji: `${jiPalace?disp(jiPalace.name):''}${jiStar}化忌`, act };
  }).filter(Boolean);
  const allLow = rows.length && rows.every(r => r.act.level === '低');
  const baseDesc = baseRec ? `${esc(baseRec.name)}（${baseInput.year} 年 ${baseInput.month} 月 ${baseInput.day} 日生）` : `表单日期（${baseInput.year} 年 ${baseInput.month} 月 ${baseInput.day} 日）`;
  $('#dingpan-result').innerHTML =
    `<div class="card"><div class="card-kicker">验证结果 · ${y} 年 · ${evName}</div>
     <p class="hint">正在验的生日：${baseDesc}。各候选时辰的盘与正式排盘同口径（夏令时、真太阳时、晚子时顺延都算在内）。</p>
     <p class="hint">下面是各候选时辰在那一年的"动静"对照。"非稽其已往，无以测其将来"——哪张盘和你记忆里那年的动静最对得上，哪个时辰就更可能是你的。但这只是验证的起点，不是结论。</p>
     ${rows.map(r=>`<div class="arch-item"><div><div class="t">${r.label} <span class="star-chip">吻合启发：${r.act.level}</span></div>
       <div class="s">命宫：${esc(r.majors)} · 身宫在${esc(r.shen)}<br>流年命宫：${esc(r.liu)}<br>流年化忌：${esc(r.ji)}${r.act.hits.length?`<br>当年动静：${esc(r.act.hits.join('、'))}`:''}</div></div></div>`).join('')}
     <p class="hint">「吻合启发」只是一个粗糙的动静计数（流年命宫三方内的四化/煞星/天马），不能当作定盘依据。真正有用的是你自己的记忆：那年有没有大事、动静大不大。</p>
     ${allLow ? `<div class="card" style="border:2px solid var(--gold)"><div class="card-kicker">证伪出口</div><p style="margin:0">几个候选时辰在这一年都没什么动静——那很可能<strong>候选时辰都不对</strong>。建议扩大候选范围（比如把相邻时辰也加进来），或找人工命理师当面定盘。不要硬选一个"最高分"当答案，硬凑比不知道更有害。</p></div>` : ''}
    </div>`;
});
// 进定盘页时初始化
const _nav3 = nav;
nav = function(name){ _nav3(name); if(name==='dingpan'){ dpHours=[]; $('#dingpan-step1').hidden=false; $('#dingpan-step2').hidden=true; $('#dingpan-result').innerHTML=''; renderDingpan(); } };

/* ---------- 分享图 ---------- */
let shareKind = 'chart';
/* 链接分享：生日编码进 URL，对方点开自动排盘（纯前端，不经过服务器） */
function shareLinkOf(rec){
  const i = rec.input || {};
  const p = { y: i.year, m: i.month, d: i.day, h: i.shichen, g: i.gender === 'female' ? 'f' : 'm',
    n: (i.name || '').slice(0, 12), ts: i.trueSolar ? 1 : 0, lz: i.lateZiNextDay ? 1 : 0,
    ln: (i.longitude != null && isFinite(i.longitude)) ? Math.round(i.longitude * 100) / 100 : '', pv: i.province || '', ct: i.city || '' };
  const b = btoa(unescape(encodeURIComponent(JSON.stringify(p)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return location.origin + location.pathname + '?b=' + b;
}
function setShareMode(k){
  const isLink = k === 'link';
  $('#share-canvas').hidden = isLink;
  $('#btn-save-img').hidden = isLink;
  $('#share-link-box').hidden = !isLink;
  if(isLink){
    const rec = cur();
    if(rec){
      const url = shareLinkOf(rec);
      $('#share-link-input').value = url;
      const hint = $('#copy-link-hint'); hint.textContent = '';
    }
  }
}
$('#share-tabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  shareKind = b.dataset.k;
  $$('#share-tabs button').forEach(x => x.classList.toggle('on', x===b));
  setShareMode(shareKind);
  drawShare();
});
document.addEventListener('click', async e => {
  if(!e.target.closest('#btn-copy-link')) return;
  const url = $('#share-link-input').value, hint = $('#copy-link-hint');
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){ await navigator.clipboard.writeText(url); }
    else { const ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
    hint.textContent = '已复制，去发给朋友吧 ✦';
  }catch(err){ hint.textContent = '复制失败，请手动全选复制。'; }
});
document.addEventListener('click', e => {
  if(e.target.closest('[data-share-sign]')) openShare('sign');
});
$('#share-x').addEventListener('click', () => $('#share-modal').hidden = true);
function openShare(kind){
  shareKind = kind || 'chart';
  if(shareKind !== 'sign' && !cur()){ nav('input'); return; }
  $$('#share-tabs button').forEach(x => x.classList.toggle('on', x.dataset.k===shareKind));
  $('#share-modal').hidden = false;
  setShareMode(shareKind);
  drawShare();
}
/* 星空底纹：深空渐变 + 星野 + 月相 + 金线双框（分享图命盘专用） */
function drawCelestialBG(ctx, W, H, rnd){
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#221B44'); g.addColorStop(.55, '#372A63'); g.addColorStop(1, '#4E3A7D');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 星野
  for(let i = 0; i < 110; i++){
    const x = rnd() * W, y = rnd() * H, r = .8 + rnd() * 2.4;
    const gold = rnd() > .82;
    ctx.fillStyle = gold ? `rgba(221,189,119,${.25 + rnd() * .5})` : `rgba(216,201,245,${.15 + rnd() * .45})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  // 月相（右上角，大而淡，不压标题）
  const mx = W - 110, my = 110, mr = 70;
  const mg = ctx.createRadialGradient(mx, my, mr * .4, mx, my, mr * 2.2);
  mg.addColorStop(0, 'rgba(245,239,224,.20)'); mg.addColorStop(1, 'rgba(245,239,224,0)');
  ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr * 2.2, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(245,239,224,.5)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(245,239,224,.10)';
  ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.fill();
  // 金线双框
  ctx.strokeStyle = 'rgba(221,189,119,.55)'; ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.strokeStyle = 'rgba(221,189,119,.28)'; ctx.lineWidth = 1;
  ctx.strokeRect(52, 52, W - 104, H - 104);
}
/* 夜卡共用底：深空渐变 + 星点 + 光斑 + 暗角 */
function drawNightBG(ctx, W, H, rnd){
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#070B1E'); g.addColorStop(.5, '#131A44'); g.addColorStop(.82, '#2C2557'); g.addColorStop(1, '#453260');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for(let i = 0; i < 130; i++){
    const x = rnd() * W, y = rnd() * H, r = .7 + rnd() * 2.2;
    ctx.fillStyle = rnd() > .8 ? `rgba(160,131,255,${.2 + rnd() * .5})` : `rgba(223,227,251,${.18 + rnd() * .55})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  const bloom = (x, y, r, c) => { const rg = ctx.createRadialGradient(x, y, r * .2, x, y, r);
    rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  bloom(W * .16, H * .34, 300, 'rgba(214,120,170,.20)');
  bloom(W * .85, H * .42, 280, 'rgba(230,168,94,.14)');
  bloom(W * .5, H * .24, 340, 'rgba(134,162,255,.14)');
}
/* 印章（canvas 版） */
function drawSeal(ctx, x, y, size, text){
  ctx.save(); ctx.translate(x + size / 2, y + size / 2); ctx.rotate(-4 * Math.PI / 180);
  ctx.fillStyle = '#B0523A';
  roundRect(ctx, -size / 2, -size / 2, size, size, size * .12); ctx.fill();
  ctx.strokeStyle = 'rgba(251,246,234,.6)'; ctx.lineWidth = 3;
  roundRect(ctx, -size / 2 + 5, -size / 2 + 5, size - 10, size - 10, size * .1); ctx.stroke();
  ctx.fillStyle = '#FBF6EA'; ctx.font = `700 ${size * .34}px "Songti SC","Noto Serif SC",serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const chars = [...text];
  chars.forEach((ch, i) => ctx.fillText(ch, 0, (i - (chars.length - 1) / 2) * size * .4));
  ctx.restore();
}
/* 竖排签文卡 */
function drawSignCard(){
  const rec = cur();
  const sign = dailySign(rec);
  const cv = $('#share-canvas'), ctx = cv.getContext('2d');
  const W = 1080, H = 1440;
  const rnd = mulberry((sign.no + sign.t).length * 7919 + 13);
  ctx.textAlign = 'center';
  drawNightBG(ctx, W, H, rnd);
  ctx.fillStyle = '#B9C4EA'; ctx.font = '30px "IBM Plex Mono","PingFang SC",monospace';
  ctx.fillText('每日复盘提示 · 问星', W / 2, 130);
  ctx.strokeStyle = 'rgba(132,146,255,.4)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W / 2 - 150, 165); ctx.lineTo(W / 2 + 150, 165); ctx.stroke();
  // 签号 + 级别
  ctx.fillStyle = '#F5F2EA'; ctx.font = '600 46px "Songti SC","Noto Serif SC",serif';
  ctx.fillText(`${sign.no} · ${sign.lv}`, W / 2, 232);
  // 竖排签题（右起第一列，字大）
  const titleChars = [...sign.t];
  ctx.font = '700 66px "Songti SC","Noto Serif SC",serif';
  const tX = W / 2 + 150, tY0 = 330;
  titleChars.forEach((ch, i) => { ctx.fillStyle = '#E9DFC8'; ctx.fillText(ch, tX, tY0 + i * 86); });
  // 竖排签文（两列，右起）："，"分句
  const parts = sign.s.split(/[，。；]/).filter(Boolean);
  ctx.font = '600 44px "Songti SC","Noto Serif SC",serif';
  parts.slice(0, 3).forEach((part, col) => {
    const x = W / 2 + 40 - col * 130;
    [...part].forEach((ch, i) => { ctx.fillStyle = '#DFE3FB'; ctx.fillText(ch, x, 330 + i * 62); });
  });
  // 宜 / 提醒
  ctx.fillStyle = '#B9C4EA'; ctx.font = '26px "IBM Plex Mono","PingFang SC",monospace';
  ctx.fillText(`宜  ${sign.yi}`, W / 2, 1030);
  ctx.fillStyle = '#9AA5D6';
  wrapText(ctx, `提醒：${sign.jie}`, W / 2, 1082, 700, 40);
  // 印章 + 落款
  drawSeal(ctx, W - 170, H - 210, 92, '問星');
  ctx.fillStyle = '#E9DFC8'; ctx.font = '600 34px "Songti SC","Noto Serif SC",serif';
  ctx.fillText('✦ 问星 · 紫微斗数在线排盘', W / 2, H - 110);
  ctx.fillStyle = 'rgba(154,165,214,.8)'; ctx.font = '24px "IBM Plex Mono",monospace';
  ctx.fillText('rhinocount.cn/builds/ziwei/', W / 2, H - 66);
}
/* 主星人格卡 */
function drawPersonaCard(rec){
  const cv = $('#share-canvas'), ctx = cv.getContext('2d');
  const W = 1080, H = 1440;
  const chart = rec.chart;
  const ming = chart.palaces.find(p => p.isMingGong);
  const majors = ming.stars.filter(s => s.type === 'major');
  const rnd = mulberry((rec.id + 'persona').length * 7919 + 7);
  ctx.textAlign = 'center';
  drawNightBG(ctx, W, H, rnd);
  ctx.fillStyle = '#B9C4EA'; ctx.font = '30px "IBM Plex Mono","PingFang SC",monospace';
  ctx.fillText('PALACE NOTES · 命宫结构参考', W / 2, 150);
  ctx.strokeStyle = 'rgba(132,146,255,.4)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W / 2 - 200, 186); ctx.lineTo(W / 2 + 200, 186); ctx.stroke();
  const name = majors.length ? majors.map(s => s.name).join(' · ') : '空 宫';
  ctx.fillStyle = '#F5F2EA';
  ctx.font = `900 ${majors.length > 1 ? 150 : 190}px "Songti SC","Noto Serif SC",serif`;
  ctx.shadowColor = 'rgba(7,11,30,.85)'; ctx.shadowBlur = 30;
  ctx.fillText(name, W / 2, 460);
  ctx.shadowBlur = 0;
  // 人设标签（STAR_GIFT 第一条）
  const gift = majors.length && STAR_GIFT[majors[0].name] ? STAR_GIFT[majors[0].name][1] : '先从自己的真实经历和反馈中寻找可验证的线索';
  const outer = majors.length ? '传统象意观察：'+(D.stars[majors[0].name]||'以命宫主星作为讨论线索，不单独判断性格或人生结果') : '命宫无主星；可结合对宫和三方四正查看盘面结构';
  ctx.fillStyle = '#DFE3FB'; ctx.font = '600 40px "Songti SC","Noto Serif SC",serif';
  wrapText(ctx, `在外人眼里：${outer}`, W / 2, 640, 780, 66);
  ctx.fillStyle = '#E9DFC8'; ctx.font = '600 38px "Songti SC","Noto Serif SC",serif';
  wrapText(ctx, gift, W / 2, 810, 800, 66);
  ctx.fillStyle = '#7583BD'; ctx.font = '26px "IBM Plex Mono","PingFang SC",monospace';
  ctx.fillText(`${rec.name} · 命宫传统象意参考`, W / 2, 1080);
  drawSeal(ctx, W - 170, H - 210, 92, '問星');
  ctx.fillStyle = '#E9DFC8'; ctx.font = '600 34px "Songti SC","Noto Serif SC",serif';
  ctx.fillText('✦ 问星 · 紫微斗数在线排盘', W / 2, H - 110);
  ctx.fillStyle = 'rgba(154,165,214,.8)'; ctx.font = '24px "IBM Plex Mono",monospace';
  ctx.fillText('rhinocount.cn/builds/ziwei/', W / 2, H - 66);
}
function drawShare(){
  if(shareKind === 'sign'){ drawSignCard(); return; }
  const rec = cur(); if(!rec) return;
  if(shareKind === 'persona'){ drawPersonaCard(rec); return; }
  const cv = $('#share-canvas'), ctx = cv.getContext('2d');
  const W = 1080, H = 1440;
  const rnd = mulberry(rec.id.length * 7919 + shareKind.length);
  try{ ctx.letterSpacing = '4px'; }catch(e){}
  ctx.textAlign = 'center';
  const chart = rec.chart;
  const ming = chart.palaces.find(p=>p.isMingGong);
  const majors = ming.stars.filter(s=>s.type==='major').map(s=>s.name).join(' ');
  if(shareKind === 'chart'){
    // 深空星野底
    drawCelestialBG(ctx, W, H, rnd);
    const bi = chart.birthInfo;
    // 标题区
    ctx.fillStyle = '#F5EFE0'; ctx.font = '600 76px "Songti SC","Noto Serif SC",serif';
    const shareTitle = /^命盘\d+$/.test(rec.name) ? rec.name : rec.name + '的命盘';
    ctx.fillText(shareTitle, W/2, 170);
    ctx.fillStyle = '#B9A8D9'; ctx.font = '34px sans-serif';
    try{ ctx.letterSpacing = '2px'; }catch(e){}
    ctx.fillText(`${bi.year}年${bi.month}月${bi.day}日 · ${BR[bi.hour]}时 · ${chart.wuxingJuName}`, W/2, 232);
    // 金线分隔
    ctx.strokeStyle = 'rgba(221,189,119,.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W/2 - 180, 272); ctx.lineTo(W/2 + 180, 272); ctx.stroke();
    ctx.fillStyle = 'rgba(221,189,119,.9)'; ctx.font = '28px sans-serif';
    ctx.fillText('✦', W/2, 282);
    // 命宫主星
    ctx.fillStyle = '#E8D9B8'; ctx.font = '600 46px "Songti SC","Noto Serif SC",serif';
    try{ ctx.letterSpacing = '4px'; }catch(e){}
    ctx.fillText('命宫 ' + (majors || '空宫'), W/2, 350);
    // 十二宫 3×4（卡宽 280，左右留白 90）
    const mingBranch = chart.mingGongBranch;
    PALACE_ORDER.forEach((pn, i) => {
      const p = palaceByName(chart, pn);
      const ms = p.stars.filter(s=>s.type==='major').map(s=>s.name).join('') || '—';
      const x = 230 + (i%3)*310, y = 470 + Math.floor(i/3)*200;
      const isMing = p.branch === mingBranch;
      ctx.fillStyle = isMing ? 'rgba(221,189,119,.14)' : 'rgba(255,255,255,.055)';
      roundRect(ctx, x-140, y-78, 280, 156, 18); ctx.fill();
      ctx.strokeStyle = isMing ? 'rgba(221,189,119,.8)' : 'rgba(255,255,255,.16)';
      ctx.lineWidth = isMing ? 2 : 1;
      roundRect(ctx, x-140, y-78, 280, 156, 18); ctx.stroke();
      ctx.fillStyle = '#F5EFE0'; ctx.font = '600 34px "Songti SC","Noto Serif SC",serif';
      ctx.fillText(pn, x, y-28);
      ctx.fillStyle = '#D9C9F5'; ctx.font = '30px sans-serif';
      ctx.fillText(ms, x, y+22);
      ctx.fillStyle = 'rgba(185,168,217,.85)'; ctx.font = '24px sans-serif';
      ctx.fillText(`${ST[p.stem]}${BR[p.branch]}`, x, y+58);
    });
    // 落款
    ctx.strokeStyle = 'rgba(221,189,119,.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W/2 - 140, H-196); ctx.lineTo(W/2 + 140, H-196); ctx.stroke();
    ctx.fillStyle = '#E8D9B8'; ctx.font = '600 38px "Songti SC","Noto Serif SC",serif';
    try{ ctx.letterSpacing = '6px'; }catch(e){}
    ctx.fillText('✦ 问星 · 紫微斗数在线排盘', W/2, H-140);
    ctx.fillStyle = 'rgba(185,168,217,.8)'; ctx.font = '28px sans-serif';
    try{ ctx.letterSpacing = '2px'; }catch(e){}
    ctx.fillText('rhinocount.cn/builds/ziwei/', W/2, H-92);
    try{ ctx.letterSpacing = '0px'; }catch(e){}
    return;
  }
  // 落款
  ctx.fillStyle = '#5E4B8B'; ctx.font = '700 40px sans-serif';
  ctx.fillText('✦ 问星 · 紫微斗数在线排盘', W/2, H-140);
  ctx.fillStyle = '#8A7BA8'; ctx.font = '30px sans-serif';
  ctx.fillText('rhinocount.cn/builds/ziwei/', W/2, H-90);
}
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function wrapText(ctx, text, x, y, maxW, lh){
  const chars = text.split(''); let line = '', yy = y;
  for(const ch of chars){
    if(ctx.measureText(line+ch).width > maxW){ ctx.fillText(line, x, yy); line = ch; yy += lh; }
    else line += ch;
  }
  ctx.fillText(line, x, yy);
}
$('#btn-save-img').addEventListener('click', () => {
  const a = document.createElement('a');
  a.download = '问星-' + shareKind + '.png';
  a.href = $('#share-canvas').toDataURL('image/png');
  a.click();
});

document.addEventListener('click', e => {
  if(e.target.closest('[data-share-chart]')) openShare('chart');
});

function renderUnifiedReading(){
  renderWenyun();
  renderReading();
  renderPalaceCards();
  renderZeri();
}

/* ---------- 免责声明接入 ---------- */
function wireDisclaimer(){
  const G = window.GXG_DISCLAIMER;
  if(G){
    if(G.full) $('#reading-disclaimer').textContent = G.full;
    if(G.short){ const f = $('#footer-disclaimer'); if(f) f.textContent = G.short; }
  }
}

/* ---------- 分享链接解析：?b=… 打开即自动排盘 ---------- */
function openSharedChart(){
  const q = new URLSearchParams(location.search);
  const b = q.get('b');
  if(!b) return false;
  try{
    const norm = b.replace(/-/g, '+').replace(/_/g, '/');
    const pad = norm + '='.repeat((4 - norm.length % 4) % 4);
    const p = JSON.parse(decodeURIComponent(escape(atob(pad))));
    if(!p || !p.y || !p.m || !p.d || p.h == null) return false;
    const input = {
      name: p.n || '', gender: p.g === 'f' ? 'female' : 'male',
      year: +p.y, month: +p.m, day: +p.d, shichen: +p.h,
      exHour: '', exMin: '',
      province: p.pv || '', city: p.ct || '',
      longitude: (p.ln !== '' && p.ln != null && isFinite(p.ln)) ? +p.ln : null,
      trueSolar: !!p.ts && p.ln !== '' && p.ln != null,
      lateZiNextDay: !!p.lz,
      tag: '分享',
      sihuaTable: getStoredSihuaTable(),
    };
    const { chart, note } = computeChart(input);
    const rec = { id: uid(), name: input.name || '分享的盘', tag: '分享', gender: input.gender,
      input, chart, note, createdAt: Date.now() };
    archive.unshift(rec);
    if(archive.length > 20) archive.length = 20;
    store.set('gxg_archive', archive);
    currentId = rec.id; store.set('gxg_current', currentId);
    luckMode = 'natal'; luckParam = null;
    renderChart();
    nav('chart');
    try{ history.replaceState(null, '', location.pathname); }catch(e){} // 清参，避免刷新重复入档
    return true;
  }catch(e){ return false; }
}

/* ---------- 启动 ---------- */
initForm();
renderSihuaSettings();
wireDisclaimer();
if(currentId && !cur()){ currentId = archive.length ? archive[0].id : null; store.set('gxg_current', currentId); } // 自愈：current 指向已删存档
renderHome();
heroEntrance();
initRightTabs();
if(!openSharedChart() && currentId && cur()){ renderChart(); }
if('serviceWorker' in navigator){ addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); }); }
})();
