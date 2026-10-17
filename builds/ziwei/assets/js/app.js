/* 紫微小馆 · 应用主逻辑 */
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
let archive = store.get('gxg_archive', []);   // [{id, name, tag, gender, input, chart, createdAt}]
let favs = store.get('gxg_favs', []);         // [{id, chartId, topic, text, ts}]
let currentId = store.get('gxg_current', null);
const uid = () => 'c' + Date.now().toString(36) + Math.floor(Math.random()*1e4).toString(36);
const cur = () => archive.find(a => a.id === currentId) || null;

/* ---------- 导航 ---------- */
const VIEWS = ['home','input','chart','palaces','reading','topics','guide','archive','compare','dingpan','favorites'];
function nav(name){
  if(!VIEWS.includes(name)) return;
  $$('.view').forEach(v => v.classList.remove('active'));
  $('#view-'+name).classList.add('active');
  $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.nav === name));
  window.scrollTo({top:0});
  if(name==='home') renderHome();
  if(name==='archive') renderArchive();
  if(name==='favorites') renderFavs();
  if(name==='palaces') renderPalaceCards();
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
function glossary(kind, name){
  let text = '';
  if(kind==='star') text = D.stars[name] || '这颗星的信息正在整理中。';
  else if(kind==='sihua') text = D.sihua[name] || '';
  else if(kind==='pattern') text = D.patterns[name] || (window.GXG_PATTERNS||{})[name] || D.patternDefault;
  else if(kind==='brightness') text = D.brightness[name] || '';
  else if(kind==='palace'){
    const p = D.palaces.find(p => p.name === name);
    text = p ? `<b>${p.modern}</b> · ${p.keywords}<br><br>${p.desc}` : '';
  }
  modal(name, esc(text).replace(/\n/g,'<br>'));
}

/* ---------- 表单初始化 ---------- */
function fillSelect(sel, items, placeholder){
  sel.innerHTML = '';
  if(placeholder){ const o = document.createElement('option'); o.value=''; o.textContent = placeholder; sel.appendChild(o); }
  items.forEach(([v,t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); });
}
function initForm(){
  const nowY = new Date().getFullYear();
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
  $('#birth-form').addEventListener('submit', onSubmit);
  $('#f-unknown-hour').addEventListener('change', e => {
    if(e.target.checked){ nav('dingpan'); e.target.checked = false; }
  });
}
function updateDstHint(){
  const y = +$('#f-year').value, m = +$('#f-month').value, d = +$('#f-day').value;
  const hint = $('#dst-hint');
  if(y && m && d && E.isChinaDST(y,m,d)){
    hint.textContent = '注意：你出生在 1986–1991 年夏令时期间，当时时钟拨快了 1 小时，排盘会自动扣回。';
  } else hint.textContent = '';
}
function segVal(id){ const b = document.querySelector('#'+id+' button.on'); return b ? b.dataset.v : null; }

/* ---------- 排盘管线 ---------- */
function shiftDate(y,m,d,offset){
  const dt = new Date(y, m-1, d + offset);
  return { y: dt.getFullYear(), m: dt.getMonth()+1, d: dt.getDate() };
}
function computeChart(input){
  // input: {name, gender, year, month, day, shichen(0-12), exHour, exMin, province, city, longitude, trueSolar}
  let clockHour, clockMinute;
  if(input.exHour !== '' && input.exHour != null){
    clockHour = +input.exHour; clockMinute = +(input.exMin || 0);
  } else {
    [clockHour, clockMinute] = SHICHEN_MID[input.shichen];
  }
  let branch, dayOffset = 0, note = [];
  const shichenBranch = input.shichen === 12 ? 0 : input.shichen; // 晚子时=子
  if(input.trueSolar && input.longitude != null){
    let ch = clockHour, cm = clockMinute;
    if(E.isChinaDST(input.year, input.month, input.day)){ cm -= 60; note.push('已按夏令时扣回 1 小时'); }
    const solar = E.calculateTrueSolarTime({ year: input.year, month: input.month, day: input.day, clockHour: ch, clockMinute: cm, longitude: input.longitude });
    branch = solar.branch;
    dayOffset = E.resolveZiweiDayOffset(solar, 'next-day');
    const corrMin = Math.round(solar.totalCorrectionMinutes);
    note.push('真太阳时校正 ' + (corrMin>=0?'+':'') + corrMin + ' 分钟');
    if(solar.dayOffset !== 0) note.push('真太阳时跨日，已顺延');
  } else {
    branch = shichenBranch;
    if(input.shichen === 12){ dayOffset = 1; note.push('晚子时，按次日排盘'); }
  }
  const pd = shiftDate(input.year, input.month, input.day, dayOffset);
  if(dayOffset !== 0 && input.shichen !== 12 && input.trueSolar) note.push('排盘日顺延至 ' + pd.m + '月' + pd.d + '日');
  const chart = E.generateChart({
    year: pd.y, month: pd.m, day: pd.d, hour: branch, gender: input.gender,
    name: input.name || undefined,
    province: input.province || undefined, city: input.city || undefined,
    longitude: input.longitude,
    origInput: { year: input.year, month: input.month, day: input.day, clockHour, clockMinute },
  });
  return { chart, note };
}
function onSubmit(e){
  e.preventDefault();
  const err = $('#form-error'); err.textContent = '';
  const y = +$('#f-year').value, m = +$('#f-month').value, d = +$('#f-day').value;
  const shichen = $('#f-hour').value === '' ? null : +$('#f-hour').value;
  if(!y || !m || !d){ err.textContent = '请把生日选完整。'; return; }
  if(shichen == null){ err.textContent = '请选择出生时辰（实在不知道可以去定盘辅助）。'; return; }
  const cityVal = $('#f-city').value;
  const longitude = cityVal ? parseFloat(cityVal.split('|')[1]) : null;
  const input = {
    name: $('#f-name').value.trim(),
    gender: segVal('f-gender') || 'male',
    year: y, month: m, day: d, shichen,
    exHour: '', exMin: '',
    province: $('#f-province').value || '',
    city: cityVal ? cityVal.split('|')[0] : '',
    longitude,
    trueSolar: $('#f-true-solar').checked && longitude != null,
    tag: segVal('f-tag') || '我',
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
    err.textContent = '排盘失败：' + (ex.message || '日期无效');
  }
}

/* ---------- 命盘渲染 ---------- */
let luckMode = 'natal', luckParam = null; // natal | daxian(idx) | liunian(year) | liuyue({y,lm}) | liuri({y,lm,ld})

function palaceByName(chart, name){ return chart.palaces.find(p => p.name === name || disp(p.name) === name); }
function palaceByBranch(chart, b){ return chart.palaces.find(p => p.branch === ((b%12)+12)%12); }

function starHtml(s){
  const sihua = s.siHua ? `<span class="sihua">(${s.siHua})</span>` : '';
  const br = s.brightnessRaw ? `<span class="br">${s.brightnessRaw}</span>` : '';
  return `<span class="star-chip" data-star="${esc(s.name)}">${esc(s.name)}${sihua}${br}</span>`;
}
function palaceStarsHtml(p){
  const majors = p.stars.filter(s => s.type==='major');
  const others = p.stars.filter(s => s.type!=='major');
  let h = majors.map(starHtml).join('');
  if(others.length) h += '<br>' + others.map(starHtml).join('');
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

function renderChart(){
  const rec = cur(); if(!rec){ nav('input'); return; }
  const chart = rec.chart;
  const ming = palaceByBranch(chart, chart.mingGongBranch);
  const mingMajors = ming.stars.filter(s=>s.type==='major').map(s=>s.name).join('、') || '（空宫）';
  const bi = chart.birthInfo;
  $('#chart-head').innerHTML =
    `<h3>${esc(rec.name)} 的命盘</h3>
     <div class="meta">公历 ${bi.year} 年 ${bi.month} 月 ${bi.day} 日 · ${BR[bi.hour]}时 · ${bi.gender==='male'?'男':'女'} · ${esc(chart.wuxingJuName)} · 命主${esc(chart.mingZhu||'')} / 身主${esc(chart.shenZhu||'')}</div>
     <div class="meta">命宫主星：${esc(mingMajors)}${rec.note && rec.note.length ? ' · ' + esc(rec.note.join('；')) : ''}</div>`;
  renderLuckPicker();
  renderChartBody();
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
    const thisY = new Date().getFullYear();
    for(let y = thisY - 60; y <= thisY + 30; y++){
      const o = document.createElement('option'); o.value = y; o.textContent = y + ' 年';
      if(y === luckParam) o.selected = true; sel.appendChild(o);
    }
    if(luckParam == null){ luckParam = thisY; sel.value = thisY; }
    sel.addEventListener('change', () => { luckParam = +sel.value; renderChartBody(); });
    box.appendChild(sel);
  } else if(luckMode === 'liuyue' || luckMode === 'liuri'){
    const y = new Date().getFullYear();
    if(!luckParam) luckParam = luckMode==='liuyue' ? {y, lm: 6} : {y, lm: 6, ld: 1};
    const mk = (id, opts, val) => {
      const sel = document.createElement('select'); sel.id = id;
      opts.forEach(([v,t]) => { const o = document.createElement('option'); o.value=v; o.textContent=t; if(v==val) o.selected=true; sel.appendChild(o); });
      return sel;
    };
    const lmSel = mk('lm', Array.from({length:12},(_,i)=>[i+1,'农历'+(i+1)+'月']), luckParam.lm);
    box.appendChild(lmSel);
    let ldSel = null;
    if(luckMode === 'liuri'){
      ldSel = mk('ld', Array.from({length:30},(_,i)=>[i+1,'初'+(i+1)]), luckParam.ld);
      box.appendChild(ldSel);
    }
    const upd = () => {
      luckParam = luckMode==='liuyue' ? {y, lm:+lmSel.value} : {y, lm:+lmSel.value, ld:+ldSel.value};
      renderChartBody();
    };
    lmSel.addEventListener('change', upd); if(ldSel) ldSel.addEventListener('change', upd);
  }
}
$('#luck-tabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  luckMode = b.dataset.mode; luckParam = null;
  renderLuckPicker(); renderChartBody();
});

function renderChartBody(){
  const rec = cur(); if(!rec) return;
  const chart = rec.chart;
  const ov = luckOverlay(chart);
  $('#sihua-strip').innerHTML = (ov.label ? `<div class="hint" style="margin-bottom:6px">${esc(ov.label)}</div>` : '') + sihuaStripHtml(ov.sihua);
  // 桌面 4x4
  const grid = $('#chart-grid');
  // 传统田字格：巳午未申 / 辰··酉 / 卯··戌 / 寅丑子亥（子=0…亥=11）
  const order = [5,6,7,8, 4,-1,-1,9, 3,-1,-1,10, 2,1,0,11];
  let h = '';
  order.forEach(b => {
    if(b === -1){ h += '<div class="cell center"><div style="font-size:40px">✦</div><div class="gz">紫微小馆</div></div>'; return; }
    const p = palaceByBranch(chart, b);
    const tags = [];
    if(p.isMingGong) tags.push('<span class="tag">命</span>');
    if(p.isShenGong) tags.push('<span class="tag">身</span>');
    const hl = ov.hlBranch === b ? ' hl' : '';
    h += `<div class="cell${hl}" data-branch="${b}">${tags.join('')}
      <div class="pname">${disp(p.name)}</div><div class="gz">${ST[p.stem]}${BR[p.branch]}</div>
      <div>${palaceStarsHtml(p)}</div>
      ${p.daXianAge ? `<div class="dx">大限 ${p.daXianAge[0]}–${p.daXianAge[1]}</div>` : ''}</div>`;
  });
  grid.innerHTML = h;
  // 移动列表（十二宫顺序）
  const list = $('#chart-list');
  list.innerHTML = PALACE_ORDER.map(name => {
    const p = palaceByName(chart, name);
    const hl = ov.hlBranch === p.branch ? ' style="border:2px solid var(--primary)"' : '';
    const tags = (p.isMingGong?'命':'') + (p.isShenGong?'身':'');
    return `<div class="palace-row"${hl} data-branch="${p.branch}">
      <div class="palace-row-head"><div><span class="t">${disp(p.name)}</span>${tags?` <span class="star-chip">${tags}宫</span>`:''}
        <div class="s">${ST[p.stem]}${BR[p.branch]}${p.daXianAge?` · 大限${p.daXianAge[0]}–${p.daXianAge[1]}`:''}</div></div>
        <span class="arrow">›</span></div>
      <div class="palace-row-body">${palaceStarsHtml(p)}
        ${p.selfSihua && p.selfSihua.length ? `<div class="hint">自化：${p.selfSihua.map(s=>s.starName+s.siHua).join('、')}</div>` : ''}
        <div style="margin-top:8px"><button class="btn-ghost" data-palace-detail="${esc(disp(p.name))}">看${esc(disp(p.name))}解读 →</button></div>
      </div></div>`;
  }).join('');
  // 格局
  let pats = [];
  try{ pats = E.detectPatterns(chart); }catch(e){}
  window.GXG_PATTERNS = {};
  pats.forEach(pt => { if(pt.description) window.GXG_PATTERNS[pt.name] = pt.description; });
  $('#pattern-list').innerHTML = pats.length ? pats.map(pt =>
    `<div class="pat" data-pattern="${esc(pt.name)}"><h5>${esc(pt.name)}<span class="lvl ${pt.level}">${{excellent:'上佳',good:'吉利',neutral:'中性',caution:'留意'}[pt.level]||''}</span></h5><p>${esc(pt.description||'')}</p></div>`
  ).join('') : '<div class="empty">这张盘没有触发常见格局——无格局也是一种格局，日子照样过。</div>';
  // 当前解读上下文
  window.GXG_CTX = { chart, rec };
}
// 点击星/格局/宫：解释弹窗
document.addEventListener('click', e => {
  const s = e.target.closest('[data-star]');
  if(s){ glossary('star', s.dataset.star); return; }
  const p = e.target.closest('[data-pattern]');
  if(p && !e.target.closest('[data-star]')){ glossary('pattern', p.dataset.pattern); return; }
  const pd = e.target.closest('[data-palace-detail]');
  if(pd){ showPalaceDetail(pd.dataset.palaceDetail); return; }
  const row = e.target.closest('.palace-row-head');
  if(row){ row.parentElement.classList.toggle('open'); return; }
  const cell = e.target.closest('.cell[data-branch]');
  if(cell && !e.target.closest('[data-star]')){
    const rec = cur(); const pl = palaceByBranch(rec.chart, +cell.dataset.branch);
    modal(disp(pl.name), `<b>${ST[pl.stem]}${BR[pl.branch]}</b><br><br>${palaceStarsHtml(pl)}<br><br><button class="btn-ghost" data-palace-detail="${esc(disp(pl.name))}">看${esc(disp(pl.name))}解读 →</button>`);
    return;
  }
  const lv = e.target.closest('.lvl');
  if(lv){ /* 级别标签不弹窗 */ return; }
});
function showPalaceDetail(name){
  $('#modal').hidden = true;
  palaceDetailName = name;
  renderPalaceCards();
  nav('palaces');
}
let palaceDetailName = null;
$('#btn-share').addEventListener('click', () => { openShare('chart'); });

/* ---------- 十二宫卡片 ---------- */
function renderPalaceCards(){
  const rec = cur();
  const chart = rec ? rec.chart : null;
  $('#palace-cards').innerHTML = D.palaces.map((p, i) => {
    let starsLine = '';
    if(chart){
      const pl = palaceByName(chart, p.name);
      const majors = pl.stars.filter(s=>s.type==='major').map(s=>esc(s.name)+(s.siHua?`<span class="sihua">(${s.siHua})</span>`:'')).join(' ');
      starsLine = `<div class="stars-line">${majors || '（空宫）'}</div>`;
    }
    const open = palaceDetailName === p.name ? ' data-open="1"' : '';
    return `<div class="palace-card" data-palace="${p.name}"${open}>
      <span class="num">${i+1}</span><h4>${p.name}</h4>
      <div><span class="modern">${p.modern}</span></div>
      <div class="kw">${p.keywords}</div>${starsLine}
      <div class="kw" style="margin-top:8px">${p.desc}</div>
    </div>`;
  }).join('');
  palaceDetailName = null;
}
document.addEventListener('click', e => {
  const c = e.target.closest('[data-palace]');
  if(c && !e.target.closest('[data-star]')) glossary('palace', c.dataset.palace);
});

/* ---------- 13维解读（v4.0 数据集按需加载） ---------- */
const RELEASE_BASE = 'https://github.com/Renhuai123/ziwei-doushu/releases/download/v4.0-13d';
const ZSTD_ESM = 'https://cdn.jsdelivr.net/npm/@bokuweb/zstd-wasm@0.0.27/dist/esm/index.web.js';
const ZSTD_WASM = 'https://cdn.jsdelivr.net/npm/@bokuweb/zstd-wasm@0.0.27/dist/esm/zstd.wasm';
let zstdApi = null, readingCache = {}; // key -> {topic: text}
async function getZstd(){
  if(zstdApi) return zstdApi;
  const mod = await import(ZSTD_ESM);
  await mod.init(ZSTD_WASM);
  zstdApi = mod; // { decompress }
  return zstdApi;
}
/* 在字节层面找 key，避免把 700MB+ 全转成 JS 字符串（省一半内存） */
function findLineBytes(raw, needleBytes){
  const n = raw.length, m = needleBytes.length;
  outer: for(let i = 0; i <= n - m; i++){
    if(raw[i] !== needleBytes[0]) continue;
    for(let j = 1; j < m; j++){ if(raw[i+j] !== needleBytes[j]) continue outer; }
    let s = i; while(s > 0 && raw[s-1] !== 10) s--;
    let e = i + m; while(e < n && raw[e] !== 10) e++;
    return raw.slice(s, e);
  }
  return null;
}
async function loadReading(chart){
  const bi = chart.birthInfo;
  const key = `${bi.year}-${pad2(bi.month)}-${pad2(bi.day)}-${bi.hour}-${bi.gender}`;
  if(readingCache[key]) return { key, data: readingCache[key] };
  const cached = store.get('gxg_reading_' + key, null);
  if(cached){ readingCache[key] = cached; return { key, data: cached }; }
  const url = `${RELEASE_BASE}/year-${bi.year}.jsonl.zst`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('数据文件加载失败（' + res.status + '）');
  const buf = new Uint8Array(await res.arrayBuffer());
  const zstd = await getZstd();
  // 注意：年份文件解压后约 700MB，手机上可能吃紧；失败会走降级提示
  const raw = zstd.decompress(buf);
  const lineBytes = findLineBytes(raw, new TextEncoder().encode(`"k":"${key}"`));
  if(!lineBytes) throw new Error('这张盘暂无深度解读数据');
  const rec = JSON.parse(new TextDecoder().decode(lineBytes));
  readingCache[key] = rec.c;
  store.set('gxg_reading_' + key, rec.c);
  return { key, data: rec.c };
}
let readingTopic = 'overview';
function renderReadingTabs(){
  $('#reading-tabs').innerHTML = Object.entries(D.datasetTopics).map(([k, v]) =>
    `<button data-t="${k}" class="${k===readingTopic?'on':''}">${v}</button>`).join('');
}
$('#reading-tabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  readingTopic = b.dataset.t; renderReadingTabs(); renderReadingBody();
});
function md2html(md){
  return esc(md)
    .replace(/^### (.*)$/gm, '<h4>$1</h4>')
    .replace(/^## (.*)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
}
async function renderReading(){
  const rec = cur();
  if(!rec){ $('#reading-status').textContent = '先排一张盘，才能看深度解读。'; $('#reading-body').innerHTML = ''; return; }
  renderReadingTabs();
  $('#reading-status').textContent = '正在按出生年份加载解读数据（约 2MB，只下一次）…';
  $('#reading-body').innerHTML = '<div class="empty">星星正在排版…</div>';
  try{
    const { data } = await loadReading(rec.chart);
    window.GXG_READING = data;
    $('#reading-status').textContent = '已加载 · 命宫主星' + esc(rec.chart.palaces.find(p=>p.isMingGong).stars.filter(s=>s.type==='major').map(s=>s.name).join('、') || '（空宫）');
    renderReadingBody();
  }catch(err){
    $('#reading-status').textContent = '深度解读暂时加载不出来（' + err.message + '），可以先看十二宫和格局，换个网络再试。';
    $('#reading-body').innerHTML = '';
  }
}
function renderReadingBody(){
  const data = window.GXG_READING; if(!data) return;
  const text = data[readingTopic] || '暂无';
  const paras = text.split(/\n\n+/);
  $('#reading-body').innerHTML = paras.map((p, i) =>
    `<button class="fav-btn" data-fav="${readingTopic}:${i}" title="收藏这段">☆</button><p>${md2html(p)}</p>`
  ).join('') +
  `<div class="hint" style="margin-top:16px">点 ☆ 收藏打动你的段落。解读数据：紫微斗数开源解读数据集 v4.0（CC BY 4.0）。</div>`;
}
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
// 进入解读页时加载
const _nav = nav;
nav = function(name){
  _nav(name);
  if(name === 'reading') renderReading();
  if(name === 'topics') renderTopics();
};

/* ---------- 一键专题 ---------- */
const topicState = { cur: 'career' };
function renderTopics(){
  const rec = cur();
  $('#topic-tabs').innerHTML = Object.entries(D.topics).map(([k, v]) =>
    `<button data-k="${k}" class="${k===topicState.cur?'on':''}">${v.title.replace('专题','')}</button>`).join('');
  if(!rec){ $('#topic-body').innerHTML = '<div class="empty">先排一张盘，才能生成专题报告。</div>'; return; }
  renderTopicBody();
}
$('#topic-tabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  topicState.cur = b.dataset.k; renderTopics();
});
function renderTopicBody(){
  const rec = cur(); const chart = rec.chart;
  const cfg = D.topics[topicState.cur];
  const blocks = cfg.palaces.map(pn => {
    const p = palaceByName(chart, pn);
    const majors = p.stars.filter(s=>s.type==='major');
    const line = majors.map(s => `${s.name}${s.siHua?'（化'+s.siHua+'）':''}${s.brightnessRaw||''}`).join('、') || '空宫';
    const others = p.stars.filter(s=>s.type!=='major').slice(0,4).map(s=>s.name).join('、');
    return `<h4>${disp(pn)}（${ST[p.stem]}${BR[p.branch]}）</h4><p>主星：${esc(line)}${others?`<br>辅星：${esc(others)}`:''}</p>`;
  }).join('');
  const pats = E.detectPatterns(chart).slice(0, 4);
  const patHtml = pats.length ? `<h4>相关格局</h4>` + pats.map(pt =>
    `<p><b>${esc(pt.name)}</b>：${esc(D.patterns[pt.name] || pt.description || '')}</p>`).join('') : '';
  // 跨宫四化提示
  const sihuaHits = [];
  chart.palaces.forEach(p => p.stars.forEach(s => {
    if(s.siHua && cfg.palaces.includes(disp(p.name))) sihuaHits.push(`${disp(p.name)}${s.name}化${s.siHua}`);
  }));
  $('#topic-body').innerHTML =
    `<h4>${cfg.title}</h4><p class="hint">${cfg.desc}</p>${blocks}${patHtml}
     ${sihuaHits.length?`<h4>四化落点</h4><p>${sihuaHits.map(esc).join('；')}</p>`:''}
     <div class="hint" style="margin-top:14px">专题为跨宫位综合判读，仅供参考。想看完整论述，去「13维深度解读」。`;
}

/* ---------- 新手导览 ---------- */
function renderGuide(){
  const steps = [
    ['1', '先认宫位', '十二宫是人生的 12 个领域：命宫是我是谁，财帛宫管搞钱，夫妻宫管感情，官禄宫管事业……先记住每个宫"管什么"，再看星。'],
    ['2', '再看星曜', '每颗星有自己的脾气：紫微要面子、天机爱琢磨、武曲能动手。点命盘上任何一颗星，都有白话解释。'],
    ['3', '四化是钥匙', '禄（得到）、权（掌控）、科（名声）、忌（功课）。四化落在哪宫，哪宫就是这辈子用力最深的地方。'],
  ];
  $('#guide-steps').innerHTML = steps.map(([n,t,d]) =>
    `<div class="card"><span class="step-n">${n}</span><b>${t}</b><p style="margin:10px 0 0;color:var(--muted)">${d}</p></div>`).join('');
}

/* ---------- 首页 ---------- */
function renderHome(){
  // 每日小运（按北京时间日期确定性轮换）
  const bd = bjDate();
  const key = bd.y*372 + bd.m*31 + bd.d;
  $('#daily-text').textContent = '☾ ' + D.dailyFortunes[key % D.dailyFortunes.length];
  $('#daily-date').textContent = `${bd.y} 年 ${bd.m} 月 ${bd.d} 日`;
  // 十二宫预览
  $('#palace-preview').innerHTML = D.palaces.map((p, i) =>
    `<div class="palace-card" data-palace="${p.name}"><span class="num">${i+1}</span><h4>${p.name}</h4>
     <div><span class="modern">${p.modern}</span></div><div class="kw">${p.keywords}</div></div>`).join('');
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
    favs = favs.filter(f => f.chartId !== id);
    if(currentId === id){ currentId = archive.length ? archive[0].id : null; }
    store.set('gxg_archive', archive); store.set('gxg_favs', favs); store.set('gxg_current', currentId);
    renderArchive();
  }
});

/* ---------- 双人合盘 ---------- */
function renderCompare(){
  const opts = archive.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('');
  $('#cmp-a').innerHTML = opts || '<option value="">（先去排盘）</option>';
  $('#cmp-b').innerHTML = opts || '<option value="">（先去排盘）</option>';
  if(archive[1]) $('#cmp-b').value = archive[1].id;
}
$('#btn-compare').addEventListener('click', () => {
  const a = archive.find(x => x.id === $('#cmp-a').value);
  const b = archive.find(x => x.id === $('#cmp-b').value);
  if(!a || !b || a.id === b.id){ $('#compare-result').innerHTML = '<div class="empty">选两张不同的盘。</div>'; return; }
  const pa = a.chart.palaces.find(p=>p.isMingGong), pb = b.chart.palaces.find(p=>p.isMingGong);
  const ma = pa.stars.filter(s=>s.type==='major').map(s=>s.name).join('、')||'空宫';
  const mb = pb.stars.filter(s=>s.type==='major').map(s=>s.name).join('、')||'空宫';
  const wa = palaceByName(a.chart,'夫妻宫'), wb = palaceByName(b.chart,'夫妻宫');
  const notes = [];
  notes.push(`${esc(a.name)}的夫妻宫主星：${esc(wa.stars.filter(s=>s.type==='major').map(s=>s.name).join('、')||'空宫')}；${esc(b.name)}的夫妻宫主星：${esc(wb.stars.filter(s=>s.type==='major').map(s=>s.name).join('、')||'空宫')}`);
  const juSame = a.chart.wuxingJuName === b.chart.wuxingJuName;
  notes.push(`五行局：${esc(a.chart.wuxingJuName)} vs ${esc(b.chart.wuxingJuName)}${juSame?'——同局，节奏同频':'——不同局，一个求稳一个求变，互补但要磨合'}`);
  $('#compare-result').innerHTML =
    `<div class="vs-row"><div class="vs-col"><b>${esc(a.name)}</b><br>命宫：${esc(ma)}<br>${esc(a.chart.wuxingJuName)}</div>
     <div class="vs-col"><b>${esc(b.name)}</b><br>命宫：${esc(mb)}<br>${esc(b.chart.wuxingJuName)}</div></div>
     ${notes.map(n=>`<div class="card"><p style="margin:0">${n}</p></div>`).join('')}
     <p class="hint">合盘看的是互动模式，不是分数。真正在一起过日子，看的还是两个人的选择。娱乐参考。</p>`;
});
// 每次进合盘页刷新选项
const _nav2 = nav;
nav = function(name){ _nav2(name); if(name==='compare') renderCompare(); };

/* ---------- 定盘辅助 ---------- */
let dpHours = [];
function renderDingpan(){
  $('#dingpan-hours').innerHTML = SHICHEN.filter(s=>s.v!==12).map(s =>
    `<button class="chip${dpHours.includes(s.v)?' on':''}" data-h="${s.v}">${s.label}</button>`).join('') +
    `<button class="chip${dpHours.includes(12)?' on':''}" data-h="12">晚子时</button>`;
  const ys = []; const thisY = new Date().getFullYear();
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
$('#btn-dingpan-run').addEventListener('click', () => {
  const y = +$('#dp-year').value, ev = $('#dp-event').value;
  const evName = $('#dp-event').selectedOptions[0].textContent;
  const yBranch = ((y - 4) % 12 + 12) % 12;
  const rows = dpHours.map(h => {
    const hh = h === 12 ? 0 : h;
    // 用一个代表生日（取当前选中的表单日期，或默认 1990-01-01）拼出各时辰的盘
    const fy = +($('#f-year').value || 1990), fm = +($('#f-month').value || 1), fd = +($('#f-day').value || 1);
    const g = (document.querySelector('#f-gender button.on')||{}).dataset?.v || 'male';
    let chart;
    try{ chart = E.generateChart({ year: fy, month: fm, day: fd, hour: hh, gender: g }); }
    catch(err){ return null; }
    const ming = chart.palaces.find(p=>p.isMingGong);
    const majors = ming.stars.filter(s=>s.type==='major').map(s=>s.name).join('、') || '空宫';
    const liuPalace = palaceByBranch(chart, yBranch);
    const liuMajors = liuPalace.stars.filter(s=>s.type==='major').map(s=>s.name).join('、') || '空宫';
    const sh = normSihua(E.getLiuNianSiHua(y));
    const jiStar = sh.ji, jiPalace = chart.palaces.find(p=>p.stars.some(s=>s.name===jiStar));
    return { h, label: SHICHEN.find(s=>s.v===h).label, majors, shen: disp(chart.palaces.find(p=>p.isShenGong).name),
      liu: `${disp(liuPalace.name)}（${liuMajors}）`, ji: `${jiPalace?disp(jiPalace.name):''}${jiStar}化忌` };
  }).filter(Boolean);
  $('#dingpan-result').innerHTML =
    `<div class="card"><div class="card-kicker">对照 ${y} 年 · ${evName}</div>
     <p class="hint">那年流年命宫与化忌落点如下。哪张盘的"大事年份"最有动静，哪个时辰就更像你的——再结合命宫主星的气质二选一。</p>
     ${rows.map(r=>`<div class="arch-item"><div><div class="t">${r.label}</div>
       <div class="s">命宫：${esc(r.majors)} · 身宫在${esc(r.shen)}<br>流年命宫：${esc(r.liu)}<br>流年化忌：${esc(r.ji)}</div></div></div>`).join('')}
    </div>`;
});
// 进定盘页时初始化
const _nav3 = nav;
nav = function(name){ _nav3(name); if(name==='dingpan'){ dpHours=[]; $('#dingpan-step1').hidden=false; $('#dingpan-step2').hidden=true; $('#dingpan-result').innerHTML=''; renderDingpan(); } };

/* ---------- 收藏 ---------- */
function renderFavs(){
  $('#fav-list').innerHTML = favs.length ? favs.map(f =>
    `<div class="card"><div class="card-kicker">${esc(f.topic)} · ${esc(f.chartName||'')}</div>
     <p style="margin:0 0 8px">${esc(f.text)}${f.text.length>=300?'…':''}</p>
     <button class="btn-ghost" data-unfav="${f.id}">取消收藏</button></div>`
  ).join('') : '<div class="empty">还没有收藏。在 13 维解读里点 ☆ 收藏打动你的段落。</div>';
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-unfav]'); if(!b) return;
  favs = favs.filter(f => f.id !== b.dataset.unfav);
  store.set('gxg_favs', favs); renderFavs();
});

/* ---------- 分享图 ---------- */
let shareKind = 'chart';
$('#share-tabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  shareKind = b.dataset.k;
  $$('#share-tabs button').forEach(x => x.classList.toggle('on', x===b));
  drawShare();
});
$('#share-x').addEventListener('click', () => $('#share-modal').hidden = true);
function openShare(kind){
  if(!cur()){ nav('input'); return; }
  shareKind = kind || 'chart';
  $$('#share-tabs button').forEach(x => x.classList.toggle('on', x.dataset.k===shareKind));
  $('#share-modal').hidden = false;
  drawShare();
}
function drawShare(){
  const rec = cur(); if(!rec) return;
  const cv = $('#share-canvas'), ctx = cv.getContext('2d');
  const W = 1080, H = 1440;
  // 背景
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#F5F1FA'); g.addColorStop(1,'#E9E0F5');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  // 星星
  ctx.fillStyle = 'rgba(139,122,184,.5)';
  const rnd = mulberry(rec.id.length * 7919 + shareKind.length);
  for(let i=0;i<40;i++){ const x=rnd()*W, y=rnd()*H, r=1+rnd()*2.5; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill(); }
  ctx.textAlign = 'center';
  const chart = rec.chart;
  const ming = chart.palaces.find(p=>p.isMingGong);
  const majors = ming.stars.filter(s=>s.type==='major').map(s=>s.name).join(' ');
  if(shareKind === 'chart'){
    ctx.fillStyle = '#5E4B8B'; ctx.font = '700 64px sans-serif';
    ctx.fillText(rec.name + ' 的命盘', W/2, 150);
    ctx.fillStyle = '#8A7BA8'; ctx.font = '36px sans-serif';
    ctx.fillText(`${chart.birthInfo.year}年${chart.birthInfo.month}月${chart.birthInfo.day}日 · ${chart.wuxingJuName}`, W/2, 215);
    ctx.fillStyle = '#3A2E5C'; ctx.font = '700 52px sans-serif';
    ctx.fillText('命宫 ' + (majors || '空宫'), W/2, 320);
    // 十二宫简化
    ctx.font = '30px sans-serif';
    PALACE_ORDER.forEach((pn, i) => {
      const p = palaceByName(chart, pn);
      const ms = p.stars.filter(s=>s.type==='major').map(s=>s.name).join('') || '—';
      const x = 140 + (i%3)*400, y = 420 + Math.floor(i/3)*180;
      ctx.fillStyle = '#fff';
      roundRect(ctx, x-160, y-70, 320, 140, 20); ctx.fill();
      ctx.fillStyle = '#5E4B8B'; ctx.font = '700 32px sans-serif'; ctx.fillText(pn, x, y-25);
      ctx.fillStyle = '#3A2E5C'; ctx.font = '30px sans-serif'; ctx.fillText(ms, x, y+25);
    });
  } else if(shareKind === 'quote'){
    const pats = E.detectPatterns(chart);
    const q = pats.length ? (D.patterns[pats[0].name] || pats[0].description) : D.palaces[0].desc;
    ctx.fillStyle = '#5E4B8B'; ctx.font = '700 72px sans-serif';
    ctx.fillText('✦ 今日星语 ✦', W/2, 200);
    ctx.fillStyle = '#3A2E5C'; ctx.font = '44px sans-serif';
    wrapText(ctx, q, W/2, 380, 880, 72);
    ctx.fillStyle = '#8A7BA8'; ctx.font = '36px sans-serif';
    ctx.fillText(`—— ${rec.name} · 命宫${majors || '空宫'}`, W/2, 1050);
  } else {
    const y = new Date().getFullYear();
    const yBranch = ((y - 4) % 12 + 12) % 12;
    const lp = palaceByBranch(chart, yBranch);
    ctx.fillStyle = '#5E4B8B'; ctx.font = '700 72px sans-serif';
    ctx.fillText(`${y} 年运势卡`, W/2, 200);
    ctx.fillStyle = '#3A2E5C'; ctx.font = '44px sans-serif';
    ctx.fillText(`流年命宫在${disp(lp.name)}`, W/2, 360);
    const lm = lp.stars.filter(s=>s.type==='major').map(s=>s.name).join('、') || '空宫';
    wrapText(ctx, `主星：${lm}。${(D.palaces.find(p=>p.name===disp(lp.name))||{}).desc||''}`, W/2, 480, 880, 72);
    const bd = bjDate(); const fi = D.dailyFortunes[(bd.y*372+bd.m*31+bd.d) % D.dailyFortunes.length];
    ctx.fillStyle = '#8B7AB8'; ctx.font = '40px sans-serif';
    wrapText(ctx, '☾ ' + fi, W/2, 900, 880, 68);
  }
  // 落款
  ctx.fillStyle = '#5E4B8B'; ctx.font = '700 40px sans-serif';
  ctx.fillText('✦ 紫微小馆 · 紫微斗数在线排盘', W/2, H-140);
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
  a.download = '紫微小馆-' + shareKind + '.png';
  a.href = $('#share-canvas').toDataURL('image/png');
  a.click();
});

/* ---------- 启动 ---------- */
initForm();
renderHome();
if(currentId && cur()){ renderChart(); }
})();
