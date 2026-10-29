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
let archive = store.get('gxg_archive', []);   // [{id, name, tag, gender, input, chart, createdAt}]
archive.forEach(r => { if(r && r.chart && r.chart.palaces) attachSelfSihua(r.chart); }); // 存量盘补挂自化
let currentId = store.get('gxg_current', null);
const uid = () => 'c' + Date.now().toString(36) + Math.floor(Math.random()*1e4).toString(36);
const cur = () => archive.find(a => a.id === currentId) || null;

/* ---------- 导航 ---------- */
const VIEWS = ['home','input','chart','menu','palaces','reading','answer','life','sihuapan','guide','archive','dingpan'];
function nav(name){
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
  if(name==='palaces') renderPalaceCards();
  if(name==='menu') renderMenu();
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
  const m = /^(.{2})化(禄|权|科|忌)入(命|迁|官|财|身|福|夫|疾)$/.exec(name || '');
  if(!m) return null;
  const star = m[1], hua = m[2], pal = { '命': '命宫', '迁': '迁移宫', '官': '官禄宫', '财': '财帛宫', '身': '身宫', '福': '福德宫', '夫': '夫妻宫', '疾': '疾厄宫' }[m[3]];
  const huaSay = { '禄': '得到与顺遂的力', '权': '掌控与扛事的力', '科': '名声与贵人的力', '忌': '在意与执念的课题' }[hua];
  const palSay = { '命': '在你这个人本身', '迁': '在你外出与对外的场合', '官': '在你的事业上', '财': '在你的钱财上', '身': '在你后半程的重心上', '福': '在你的内心状态上', '夫': '在你的感情关系里', '疾': '在你的身体课题上' }[m[3]];
  return {
    text: `${star}化${hua}落${pal}：${star}带着${huaSay}，落在${palSay}。具体怎么应，合看${pal}的主星庙旺与三方四正。`,
    condition: `生年${star}化${hua}飞入${pal}`,
    breaker: hua === '忌' ? '若该宫再见煞星或主星落陷，课题更明显，宜提前留预案' : '若该宫见煞忌同宫，则这份力要费些周折才拿得稳',
    source: '本馆白话转述',
    caution: '仍须合看宫内主星与三方四正',
  };
}
function glossary(kind, name){
  let html = '', isHtml = false;
  if(kind==='star') html = esc(D.stars[name] || '这颗星的信息正在整理中。');
  else if(kind==='sihua'){
    html = esc(D.sihua[name] || '');
    if(window.GXG_SIHUA_WUXING) html += '<br>' + esc(window.GXG_SIHUA_WUXING);
  }
  else if(kind==='pattern'){
    const v2 = (window.GXG_PATTERNS_V2 || {})[name] || patternFamilyText(name);
    if(v2){
      html = `<b>${esc(v2.text)}</b><br><br>成立条件：${esc(v2.condition || '—')}` +
        (v2.breaker ? `<br><br>破格提醒：${esc(v2.breaker)}` : '') +
        `<br><br>出处：${esc(v2.source || '本馆白话转述')}` +
        (v2.caution ? `<br><br>${esc(v2.caution)}` : '');
      isHtml = true;
    } else {
      html = esc(D.patterns[name] || (window.GXG_PATTERNS||{})[name] || D.patternDefault);
    }
  }
  else if(kind==='brightness') html = esc(D.brightness[name] || '');
  else if(kind==='palace'){
    const p = D.palaces.find(p => p.name === name);
    html = p ? `<b>${esc(p.modern)}</b> · ${esc(p.keywords)}<br><br>${esc(p.desc)}` : '';
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
      const SP = window.GXG_SIHUA_PALACE || {};
      const hits = pl ? pl.stars.filter(s => s.siHua).map(s => {
        const say = (SP[s.siHua] || {})[name];
        return say ? `${esc(s.name)}化${esc(s.siHua)}：${esc(say)}` : '';
      }).filter(Boolean) : [];
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
      else note.push('晚子时不换日（与多数排盘工具一致；换日派可勾选对应开关）');
    }
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
  attachSelfSihua(chart);
  return { chart, note };
}
/* 引擎 generateChart 不挂自化，这里统一补上：buildAllSelfSihua 返回 {branch:[{siHua,starName}]} */
function attachSelfSihua(chart){
  try{
    const all = E.buildAllSelfSihua(chart) || {};
    chart.palaces.forEach(p => { p.selfSihua = all[p.branch] || []; });
  }catch(e){ chart.palaces.forEach(p => { if(!p.selfSihua) p.selfSihua = []; }); }
}
function onSubmit(e){
  e.preventDefault();
  const err = $('#form-error'); err.textContent = '';
  const y = +$('#f-year').value, m = +$('#f-month').value, d = +$('#f-day').value;
  const shichen = $('#f-hour').value === '' ? null : +$('#f-hour').value;
  if(!y || !m || !d){ err.textContent = '请把生日选完整。'; return; }
  // 防止 new Date 静默滚日（如 2 月 30 日变成 3 月 2 日）：先验日期真实存在
  const chk = new Date(y, m - 1, d);
  if(chk.getFullYear() !== y || chk.getMonth() !== m - 1 || chk.getDate() !== d){
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
    gender: segVal('f-gender') || 'male',
    year: y, month: m, day: d, shichen,
    exHour: exHour === '' ? '' : exHour, exMin: exMin === '' ? '' : exMin,
    province: $('#f-province').value || '',
    city: cityVal ? cityVal.split('|')[0] : '',
    longitude,
    trueSolar: $('#f-true-solar').checked && longitude != null,
    lateZiNextDay: $('#f-latezi-next').checked,
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

function starHtml(s){
  const sihua = s.siHua ? shBadge(s.siHua) : '';
  const br = s.brightnessRaw ? `<span class="br br-${s.brightnessRaw}">${s.brightnessRaw}</span>` : '';
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
  const chart = rec.chart;
  sanfangBranch = null;
  const ming = palaceByBranch(chart, chart.mingGongBranch);
  const mingMajors = ming.stars.filter(s=>s.type==='major').map(s=>s.name).join('、') || '（空宫）';
  const bi = chart.birthInfo;
  $('#chart-head').innerHTML =
    `<h3>${esc(rec.name)}的命盘</h3>
     <div class="meta">公历 ${bi.year} 年 ${bi.month} 月 ${bi.day} 日 · ${BR[bi.hour]}时 · ${bi.gender==='male'?'男':'女'} · ${esc(chart.wuxingJuName)} · 命主${esc(chart.mingZhu||'')} / 身主${esc(chart.shenZhu||'')}</div>
     <div class="meta">命宫主星：${esc(mingMajors)}${rec.note && rec.note.length ? ' · ' + esc(rec.note.join('；')) : ''}</div>`;
  renderLuckPicker();
  renderChartBody();
  renderRetroCard();
  $('#chart-palaces').innerHTML = D.palaces.map((p, i) => palaceCardHTML(p, i, chart)).join('');
}
/* ---------- 过往流年回溯卡：用已发生的年份锚定信任 ---------- */
function retroYears(chart){
  const nowY = new Date().getFullYear();
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
    if(ySh.ji && natalJiStar && ySh.ji === natalJiStar){ score += 3; reasons.push(`流年化忌与你的本命化忌同为${ySh.ji}，双忌同星、引动更明显`); }
    if(liuP){
      const ln = disp(liuP.name);
      if(ln === '命宫'){ score += 2; reasons.push('流年命宫回到你的本命命宫，是重新洗牌、变动多的一年'); }
      else if(KEY.includes(ln)){ score += 2; reasons.push(`流年命宫踩进你的【${ln}】，全年重心压在这里`); }
    }
    if(score >= 3 && reasons.length) out.push({ y, score, text: reasons.slice(0, 2).join('；') });
  }
  out.sort((a, b) => b.score - a.score || b.y - a.y);
  return out.slice(0, 2).sort((a, b) => a.y - b.y);
}
function renderRetroCard(){
  const rec = cur(); const box = $('#retro-card');
  if(!rec){ box.hidden = true; return; }
  const years = retroYears(rec.chart);
  if(!years.length){ box.hidden = true; return; }
  const done = store.get('gxg_retro_' + rec.id, '');
  box.hidden = false;
  box.innerHTML = `<div class="card-kicker">先验准不准 · 过往应期回溯</div>
    <p style="margin:0 0 8px">不用先信。回想一下这两年——按你的盘，这两年流年四化引动了关键宫位，大概率不太平静：</p>
    ${years.map(it => `<p style="margin:0 0 6px"><b>${it.y} 年</b>：${esc(it.text)}。</p>`).join('')}
    ${done === 'hit' ? '<p class="hint" style="margin:8px 0 0">✓ 你标记过「对上了」。今年的流年叠盘在命盘上方「流年」页签里，13 维解读也有逐年拆解。</p>'
      : done === 'miss' ? '<p class="hint" style="margin:8px 0 0">你标记过「不太准」。如果大事年份确实对不上，多半是出生时辰卡在了交界——可以去定盘辅助核对一下。</p>'
      : `<div style="display:flex;gap:10px;margin-top:10px">
           <button class="btn-primary" id="btn-retro-hit" style="flex:1">🎯 对上了，看今年</button>
           <button class="btn-ghost" id="btn-retro-miss" style="flex:1;margin-top:0">🤔 不太准，去校准</button>
         </div>`}`;
  const hit = $('#btn-retro-hit'), miss = $('#btn-retro-miss');
  if(hit) hit.addEventListener('click', () => {
    store.set('gxg_retro_' + rec.id, 'hit');
    luckMode = 'liunian'; luckParam = new Date().getFullYear();
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
    const thisY = new Date().getFullYear();
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
  const fp = (li.fourPillars || []).join(' ');
  return `<div class="cell sp-hub">${ring}<div class="hub-core">
    <div class="hub-brand">✦ 问星</div>
    <div class="hub-stars">${esc(majors)}</div>
    <div class="hub-name">${esc(rec.name)} · ${bi.gender === 'male' ? '男命' : '女命'}</div>
    <div class="hub-meta">${bi.year}.${String(bi.month).padStart(2, '0')}.${String(bi.day).padStart(2, '0')} · ${BR[bi.hour]}时</div>
    ${lx ? `<div class="hub-meta">${esc(lx)} · ${esc(chart.wuxingJuName || '')}</div>` : ''}
    ${fp ? `<div class="hub-meta gz">${esc(fp)}</div>` : ''}
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
  // 桌面 4x4
  const grid = $('#chart-grid');
  // 传统田字格：巳午未申 / 辰··酉 / 卯··戌 / 寅丑子亥（子=0…亥=11）
  const order = [5,6,7,8, 4,-1,-1,9, 3,-1,-1,10, 2,1,0,11];
  let h = '';
  let centerDone = false;
  order.forEach(b => {
    if(b === -1){
      // 中枢信息卡只渲染一次，第二个占位 div 隐藏（保持自动流占位）
      if(centerDone){ h += '<div class="cell center-dup"></div>'; return; }
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
    const ovNameG = ov.hlBranch != null ? overlayPalaceAt(ov.hlBranch, b) : '';
    const ovTagG = ovNameG && ['命宫','官禄宫','财帛宫','夫妻宫'].includes(ovNameG)
      ? `<span class="ov-tag">${LUCK_PREFIX[luckMode] || '流'}${ovNameG.replace('宫','')}</span>` : '';
    h += `<div class="cell${hl}${sf}" data-branch="${b}">${tags.join('')}${ovTagG}
      <div class="pname">${disp(p.name)}</div><div class="gz">${ST[p.stem]}${BR[p.branch]}</div>
      <div class="stars">${palaceStarsHtml(p)}</div>
      ${p.daXianAge ? `<div class="dx">大限 ${p.daXianAge[0]}–${p.daXianAge[1]}</div>` : ''}</div>`;
  });
  grid.innerHTML = h;
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
      <div class="palace-row-body">${palaceStarsHtml(p)}
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
  const V2 = window.GXG_PATTERNS_V2 || {};
  // 破格成色：命宫三方四正的煞星数，吉格的光芒要打折扣看
  const mingP0 = chart.palaces.find(p => p.isMingGong);
  let shaCount = 0;
  if(mingP0) sanfangBranches(mingP0.branch).forEach(b => {
    palaceByBranch(chart, b).stars.forEach(s => { if(s.type === 'sha') shaCount++; });
  });
  const chengse = shaCount >= 4 ? '命宫三方煞星比较集中，吉格的光芒要打些折扣看，课题也会更明显。'
    : shaCount >= 2 ? '命宫三方有煞星同行，吉格的发挥会打些折扣。' : '';
  $('#pattern-list').innerHTML =
    (chengse ? `<p class="hint" style="margin:0 0 8px">破格检查：${esc(chengse)}</p>` : '') +
    (pats.length ? pats.map(pt => {
      const v2 = V2[pt.name];
      const txt = v2 ? v2.text : (D.patterns[pt.name] || pt.description || D.patternDefault);
      const src = v2 && v2.source ? `<div class="hint">出处：${esc(v2.source)}</div>` : '';
      return `<div class="pat" data-pattern="${esc(pt.name)}"><h5>${esc(pt.name)}<span class="lvl ${pt.level}">${{excellent:'上佳',good:'吉利',neutral:'中性',caution:'留意'}[pt.level]||''}</span></h5><p>${esc(txt)}</p>${src}</div>`;
    }).join('') : '<div class="empty">这张盘没有触发常见格局——无格局也是一种格局，日子照样过。');
  // 当前解读上下文
  window.GXG_CTX = { chart, rec };
  renderShengongCard(chart);
  renderWuxingjuCard(chart);
  renderHuajiCard(chart);
  renderBaziCard(chart);
  renderDayunCard(chart);
  renderTimelineCard(chart);
  renderFeixingCard(chart);
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
  out.items.push({ k:'值太岁', branches:[yb], say:'本命年，民俗里宜拜太岁、穿红、多行善事——当作"这一年多留一分心"的自我提醒就好' });
  out.items.push({ k:'冲太岁', branches:[(yb + 6) % 12], say:'与太岁相冲，民俗认为变动较多：搬迁、换工作这类大事，多备一手方案' });
  const xg = XING_GROUPS.find(g => g.includes(yb));
  const xb = xg ? xg.filter(x => x !== yb) : (ZIXING.includes(yb) ? [yb] : []);
  if(xb.length) out.items.push({ k:'刑太岁', branches:xb, say:'民俗称"刑"为磨合与纠缠：人际关系里少较劲，法务合约类多看两遍' });
  const hai = (HAI_PAIRS.find(p => p.includes(yb)) || []).filter(x => x !== yb);
  if(hai.length) out.items.push({ k:'害太岁', branches:hai, say:'民俗称"害"为暗损：少掺和是非，健康上别拖小病' });
  return out;
}
function renderTaisuiCard(){
  const card = $('#taisui-card'), body = $('#taisui-body');
  if(!card) return;
  const year = new Date().getFullYear();
  const ts = taisuiOf(year);
  const rec = cur();
  let mine = '';
  if(rec){
    const myB = ((rec.chart.birthInfo.year - 4) % 12 + 12) % 12;
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
const RI_ZHU_SAY = {
  '甲':'参天大树——正直有担当，吃软不吃硬，认准的路不轻易回头',
  '乙':'藤蔓花草——柔韧务实，借力生长，适应力是最好的武器',
  '丙':'太阳之火——光明外放，热情坦荡，存在感藏不住',
  '丁':'灯烛之火——细腻专注，静水深流，暗处也能发光',
  '戊':'高山城墙——厚重可靠，说到做到，是朋友的定心丸',
  '己':'田园湿土——包容务实，擅长默默积累，慢就是你的快',
  '庚':'刀剑顽金——讲义气、行动快，磨过之后才见锋芒',
  '辛':'珠玉之金——精致敏锐，自尊心强，细节里见真章',
  '壬':'江河之水——聪明善变通，格局大，闲不住',
  '癸':'雨露之水——心思细腻，共情力强，润物无声',
};
const SHI_SHEN_GROUP = { '比肩':'比劫','劫财':'比劫','食神':'食伤','伤官':'食伤','偏财':'财星','正财':'财星','七杀':'官杀','正官':'官杀','偏印':'印星','正印':'印星' };
const SHI_SHEN_SAY = {
  '比劫':'自我与同伴的能量旺——主意自己拿，但也容易倔；合作时分清账',
  '食伤':'表达与创造的能量旺——点子多、才华藏不住，适合靠专业吃饭',
  '财星':'与钱打交道的能量旺——对数字和机会敏感，实务型选手',
  '官杀':'规则与责任的能量旺——自我要求高，适合有章法的环境',
  '印星':'学习与庇护的能量旺——爱读书、有贵人缘，想得多是天赋也是功课',
};
const WX_FAVOR_SAY = {
  '金':'金','木':'木','水':'水','火':'火','土':'土',
};
/* 宫位三档评级：palaceStrength 归一化（结构提示，非吉凶分数） */
function palaceVerdicts(chart){
  const list = PALACE_ORDER.map(n => ({ n, raw: palaceStrength(chart, palaceByName(chart, n)) }));
  const vals = list.map(x => x.raw), lo = Math.min(...vals), hi = Math.max(...vals);
  list.forEach(x => { x.score = Math.round(18 + (x.raw - lo) / Math.max(0.01, hi - lo) * 78); });
  return list;
}
function verdictBadge(score){
  const lv = score >= 70 ? { t: '有底气', c: 'pd-hi' } : score >= 40 ? { t: '有底色', c: 'pd-mid' } : { t: '是功课', c: 'pd-lo' };
  return `<span class="pal-badge ${lv.c}" title="按主星庙旺＋四化＋辅煞三方合参的结构强弱，相对本盘而言">${lv.t}</span>`;
}
function renderBaziCard(chart){
  const card = $('#bazi-card'), body = $('#bazi-body');
  const fp = chart.lunarInfo && chart.lunarInfo.fourPillars;
  if(!fp || fp.length !== 4){ card.hidden = true; return; }
  const cols = fp.map(gz => ST.indexOf(gz[0]) !== -1 ? { s: ST.indexOf(gz[0]), b: BR.indexOf(gz[1]) } : null);
  if(cols.some(c => c == null || c.s < 0 || c.b < 0)){ card.hidden = true; return; }
  const dayS = cols[2].s;
  const pillarNames = ['年柱','月柱','日柱','时柱'];
  let h = '<table class="bazi-table"><tr><th></th>' + pillarNames.map(n => `<th>${n}</th>`).join('') + '</tr>';
  h += '<tr><td class="lab">天干</td>' + cols.map((c, i) =>
    `<td><b class="gz-b">${fp[i][0]}</b><span class="ss">${i === 2 ? '日主' : shiShen(dayS, c.s)}</span></td>`).join('') + '</tr>';
  h += '<tr><td class="lab">地支</td>' + cols.map((c, i) =>
    `<td><b class="gz-b">${fp[i][1]}</b><span class="ss">${shiShen(dayS, HIDDEN_MAIN[c.b])}</span></td>`).join('') + '</tr>';
  h += '<tr><td class="lab">纳音</td>' + cols.map((c, i) =>
    `<td><span class="ny">${NA_YIN[Math.floor(gz60(c.s, c.b) / 2)]}</span></td>`).join('') + '</tr></table>';
  // 五行分布：四柱八字（干 + 支本气）
  const wx = {金:0, 木:0, 水:0, 火:0, 土:0};
  cols.forEach(c => { wx[WX_OF_STEM[c.s]]++; wx[WX_OF_STEM[HIDDEN_MAIN[c.b]]]++; });
  const total = 8, WXC = {金:'#8C6D3F', 木:'#75855F', 水:'#5F6E7A', 火:'#B0523A', 土:'#8B8477'};
  h += `<div class="wx-bars">` + Object.keys(wx).map(k =>
    `<div class="wx-row"><span class="wx-name">${k}</span><div class="wx-track"><div class="wx-fill" style="width:${wx[k] / total * 100}%;background:${WXC[k]}"></div></div><span class="wx-n">${wx[k]}</span></div>`).join('') + '</div>';
  // 日主人话
  const dzName = fp[2][0];
  h += `<div class="bz-sec">日主 · 你是什么底色</div>`;
  h += `<p class="p-say" style="margin:4px 0"><b>${dzName}（${WX_OF_STEM[dayS]}）</b>：${RI_ZHU_SAY[dzName] || ''}。</p>`;
  // 十神分布（8 字各字相对日主）
  const sgCount = {};
  cols.forEach((c, i) => {
    const t = i === 2 ? '日主' : shiShen(dayS, c.s);
    if(t !== '日主') sgCount[SHI_SHEN_GROUP[t]] = (sgCount[SHI_SHEN_GROUP[t]] || 0) + 1;
  });
  const sgKeys = ['比劫','食伤','财星','官杀','印星'];
  const topG = sgKeys.slice().sort((a, b) => (sgCount[b] || 0) - (sgCount[a] || 0))[0];
  h += `<div class="bz-sec">十神分布 · 能量都点在哪</div>`;
  h += `<div class="wx-bars">` + sgKeys.map(k => {
    const n = sgCount[k] || 0;
    return `<div class="wx-row"><span class="wx-name" style="width:32px">${k}</span><div class="wx-track"><div class="wx-fill" style="width:${n / 7 * 100}%;background:#5F74C4"></div></div><span class="wx-n">${n}</span></div>`;
  }).join('') + '</div>';
  h += `<p class="p-say" style="margin:4px 0">${topG && sgCount[topG] ? `最旺的是<b>${topG}</b>：${SHI_SHEN_SAY[topG]}` : '十神分布均匀——能量不偏科，路子宽'}</p>`;
  // 五行强弱 → 喜忌粗断（身强喜克泄耗，身弱喜生扶）
  const dayW = WX_OF_STEM[dayS];
  const SHENG = {木:'水',火:'木',土:'火',金:'土',水:'金'}, KE = {木:'土',土:'水',水:'火',火:'金',金:'木'}, KE_BY = {木:'金',金:'火',火:'水',水:'土',土:'木'};
  const sameW = wx[dayW], oppW = (wx[KE_BY[dayW]] || 0) + (wx[SHENG[dayW]] || 0) + (wx[KE[dayW]] || 0);
  const strong = sameW >= 4 && sameW > oppW;
  const favor = strong ? [KE[dayW], KE_BY[dayW]] : [SHENG[dayW], dayW];
  h += `<div class="bz-sec">五行喜忌 · 粗断参考</div>`;
  h += `<p class="p-say" style="margin:4px 0">日主${dayW}得${sameW}字、异类${oppW}字——偏${strong ? '强' : '弱'}。粗断喜<b>${favor[0]}、${favor[1]}</b>${strong ? `（旺者宜${KE[dayW]}克、${KE_BY[dayW]}耗，收敛锋芒）` : `（弱者宜${SHENG[dayW]}生、同类帮扶，借势而上）`}。真正的用神要看月令与全局，此条只当方向感。</p>`;
  h += `<p class="hint" style="margin:10px 0 0">紫微看宫位格局，八字看干支生克，两张盘互相印证着看。</p>`;
  body.innerHTML = h;
  card.hidden = false;
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
      `<p class="hint" style="margin:10px 0 0">看法：A 宫天干让某星化禄、该星落在 B 宫，就是「A 宫把禄送给 B 宫」——A 的人事给 B 那边送顺、送资源；忌是牵挂与较真的流向，权是掌控、科是名声。例：夫妻宫化忌飞入命宫，感情上的在意直接落在你身上。自化（宫干化在本宫）已在各宫标注。</p>`;
    card.hidden = false;
  }catch(e){ card.hidden = true; }
}
/* 本次排盘口径：把已有的 note + 历法信息整理成固定尾注块 */
function renderKoujingCard(rec){
  const card = $('#koujing-card'), body = $('#koujing-body');
  if(!rec){ card.hidden = true; return; }
  const chart = rec.chart, li = chart.lunarInfo || {};
  const inp = rec.input || {};
  const items = [];
  if(rec.note && rec.note.length) items.push(rec.note.join('；'));
  items.push((inp.lateZiNextDay ? '晚子时按次日排盘（换日派）' : '晚子时不换日（与多数排盘工具一致）')
    + (li.isLeapMonth ? '；闰月按十五分界（十五及以前归本月，之后归下月）' : ''));
  items.push('大限起法：按五行局对应岁数起运，阳男阴女顺行、阴男阳女逆行');
  items.push('与其他工具排盘对不上时先核对三处：①是否开启真太阳时校正（本站默认关闭，与测测/问真等一致；开启后只定时辰、排盘日仍按公历出生日）②晚子时是否换日 ③闰月口径是否一致');
  body.innerHTML = items.map(esc).join('<br>');
  card.hidden = false;
}
/* 身宫卡 */
function renderShengongCard(chart){
  const card = $('#mingshen-card'), body = $('#shengong-body');
  const G = window.GXG_SHENGONG;
  const sp = chart.palaces.find(p => p.isShenGong);
  if(!sp || !G){ if(body) body.innerHTML = ''; syncMingshenCard(); return; }
  const name = disp(sp.name);
  body.innerHTML = `<p class="bz-sec" style="margin-top:0">身宫 · 后半程的发力点</p><p style="margin:0 0 6px">${esc(G.intro || '')}</p>
    <p style="margin:0"><b>你的身宫在${esc(name)}</b>：${esc((G.palaces || {})[name] || '')}</p>`;
  syncMingshenCard();
}
function syncMingshenCard(){
  const card = $('#mingshen-card');
  if(!card) return;
  const a = $('#shengong-body')?.innerHTML.trim(), b = $('#wuxingju-body')?.innerHTML.trim();
  card.hidden = !(a || b);
}
/* 五行局卡 */
function renderWuxingjuCard(chart){
  const body = $('#wuxingju-body');
  const G = window.GXG_WUXINGJU;
  if(!G || !chart.wuxingJuName){ if(body) body.innerHTML = ''; syncMingshenCard(); return; }
  body.innerHTML = `<p class="bz-sec" style="margin-top:10px">五行局 · 你的节奏单位</p><p style="margin:0 0 6px">${esc(G.intro || '')}</p>
    <p style="margin:0"><b>你是${esc(chart.wuxingJuName)}</b>：${esc((G.jus || {})[chart.wuxingJuName] || '')}</p>`;
  syncMingshenCard();
}
/* 化忌化解卡 */
function renderHuajiCard(chart){
  const card = $('#huaji-card'), body = $('#huaji-body');
  const G = window.GXG_HUAJI;
  const natal = natalSihuaMap(chart);
  const jiList = natal['忌'] || [];
  if(!G || !jiList.length){ card.hidden = true; return; }
  const jiDesc = jiList.map(e => `${e.star}在${e.palace}`).join('、');
  const starSays = {
    '太阳':'容易对「付出没被看见」格外在意——把期待值调低半档，付出本身就有价值；与男性长辈、上级的磨合多让半步',
    '太阴':'夜里容易想太多、和「钱与安全感」较劲——睡前不谈钱不做决定；安全感一半来自余额，一半来自规律作息',
    '廉贞':'感情与规则容易撞车——桃花和是非都从「边界不清」来，把界限画清楚就化解了大半',
    '巨门':'口舌是非是主战场——少接话茬、不传话，白纸黑字替代口头承诺',
    '天机':'想太多、计划赶不上变化——把大计划拆成小步子，走一步验一步',
    '文曲':'容易被「说错话、被误解」困扰——重要沟通落在文字里，情绪上头时不开口',
    '天同':'舒服日子里有隐形焦虑——别用「再玩一天」拖延，把享受放在完成之后',
    '文昌':'文书合同是雷区——签字前多读一遍，考试证件类提前核对',
    '武曲':'与钱的拉扯最直接——现金流留出六个月缓冲，别碰杠杆',
    '贪狼':'欲望多线作战容易全落空——一段时间只追一个目标，戒多策略戒上头',
  };
  const myJi = jiList[0] ? jiList[0].star : '';
  const mySay = starSays[myJi];
  body.innerHTML = `<p style="margin:0 0 8px">${esc(G.intro || '')}</p>
    <p style="margin:0 0 8px">你的本命化忌：<b>${esc(jiDesc)}</b></p>
    ${mySay ? `<p class="p-say" style="margin:0 0 8px"><b>针对你的解法</b>：${withTerms(mySay)}</p>` : ''}
    <div class="hint" style="margin-bottom:6px">化解思路（不代表能"改命"，只是把功课做顺的姿势）：</div>
    <ul style="margin:0;padding-left:20px;font-size:14px">${(G.resolves || []).map(r => `<li>${esc(r)}</li>`).join('')}</ul>
    <div class="hint" style="margin:8px 0 4px">操作原则：</div>
    <ul style="margin:0;padding-left:20px;font-size:14px">${(G.principles || []).map(r => `<li>${esc(r)}</li>`).join('')}</ul>`;
  card.hidden = false;
}
// 点击星/格局/宫：解释弹窗
document.addEventListener('click', e => {
  const s = e.target.closest('[data-star]');
  if(s){ glossary('star', s.dataset.star); return; }
  const p = e.target.closest('[data-pattern]');
  if(p && !e.target.closest('[data-star]')){ glossary('pattern', p.dataset.pattern); return; }
  const pd = e.target.closest('[data-palace-detail]');
  if(pd){ showPalaceDetail(pd.dataset.palaceDetail); return; }
  const sfb2 = e.target.closest('[data-sanfang]');
  if(sfb2){
    const b = +sfb2.dataset.sanfang;
    sanfangBranch = (sanfangBranch === b) ? null : b;
    renderChartBody();
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
  '紫微': ['天生的组织者和定盘的人，适合当主心骨', '往管理、平台、能说了算的位置走'],
  '天机': ['脑子快、点子多，适合谋划和参谋', '往策划、咨询、技术型路线走'],
  '太阳': ['发光体，适合需要露脸、带团队的事', '往外走、往高处走，名声就是资产'],
  '武曲': ['执行力强，对钱和资源敏感', '往实业、金融、能直接看到结果的事走'],
  '天同': ['亲和力强，适合让人舒服的事', '往与人打交道、偏安稳可持续的路线走'],
  '廉贞': ['魅力与原则并存，适合需要个人风格的事', '往有发挥空间、能建立个人品牌的领域走'],
  '天府': ['守成与整合的高手，适合管钱管事', '往稳定平台、资源整合型位置走'],
  '太阴': ['细腻周到，适合幕后、财务、服务', '往需要耐心和审美的领域走，细水长流'],
  '贪狼': ['欲望即动力，适合开拓、社交、跨界', '往人多的地方走，舞台越大越来劲'],
  '巨门': ['嘴和脑子是武器，适合表达、研究、深挖', '往内容、表达、专业深耕的路线走'],
  '天相': ['天生的协调者，适合当关键的二把手', '往平台型、服务型位置走，辅佐也能成事'],
  '天梁': ['老成持重，适合需要经验和公信力的事', '往专业、公益、越老越吃香的路线走'],
  '七杀': ['开路先锋，适合攻坚、开拓、从零到一', '往有挑战、能独立负责的领域走'],
  '破军': ['破局者，适合变革、创新、不走寻常路', '往变化快、能折腾的领域走，安稳反而埋没你'],
};
const SIHUA_GIFT = {
  '禄': '化禄在命宫：天生的福气，来财和机会相对顺，适合把"顺"变成积累',
  '权': '化权在命宫：能扛事、说了算，一生多半有实权或主导权',
  '科': '化科在命宫：名声和专业是你的护城河，适合把本事变成招牌',
  '忌': '化忌在命宫：这辈子有个反复要做的功课，多半和"放不下"有关，看清它就过了一半',
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
  const ming = chart.palaces.find(p => p.isMingGong);
  const shen = chart.palaces.find(p => p.isShenGong);
  const majors = ming.stars.filter(s => s.type === 'major');
  const L = [];
  // 一、外人眼里的你：命宫（人设）+ 迁移宫（在外表现）
  let outer;
  if(majors.length){
    outer = `你的命宫是${majors.map(s => s.name).join('、')}——${STAR_OUTER[majors[0].name] || ''}`;
    const traps = majors.filter(s => s.brightnessRaw === '陷');
    if(traps.length) outer += `（${traps.map(s => s.name).join('、')}落陷，这份外相打了些折扣，没看上去那么稳）`;
    else if(majors.every(s => s.brightnessRaw === '庙' || s.brightnessRaw === '旺')) outer += '，主星庙旺，这份气场是实打实的';
  } else {
    outer = `你的命宫无主星，没有固定的外在标签——什么环境就长成什么样，适应力就是你的人设`;
  }
  const qian = palaceByName(chart, '迁移宫');
  const qm = qian ? qian.stars.filter(s => s.type === 'major') : [];
  if(qm.length && STAR_OUTER[qm[0].name]) outer += `；走出去到【迁移宫】，${qm[0].name}让你${STAR_OUTER[qm[0].name]}`;
  L.push(`<p class="p-say"><b>外人眼里的你：</b>${esc(outer)}。</p>`);
  // 二、关起门来的你：福德宫（内心世界）
  const fu = palaceByName(chart, '福德宫');
  const fm = fu ? fu.stars.filter(s => s.type === 'major') : [];
  let inner;
  if(fm.length && STAR_INNER[fm[0].name]) inner = `你的【福德宫】是${fm.map(s => s.name).join('、')}——${STAR_INNER[fm[0].name]}`;
  else inner = '你的【福德宫】无主星，内心世界随际遇走，年轻时起伏大些，年岁渐长反而越活越明白';
  L.push(`<p class="p-say"><b>关起门来的你：</b>${esc(inner)}。</p>`);
  // 三、最拧巴的软肋：生年化忌落宫
  const natal = natalSihuaMap(chart);
  const ji = (natal['忌'] || [])[0];
  if(ji && JI_SOFTSPOT[ji.palace]) L.push(`<p class="p-say"><b>最拧巴的软肋：</b>生年${esc(ji.star)}化忌落在${esc(ji.palace)}——${esc(JI_SOFTSPOT[ji.palace])}。这不是缺陷，是你这辈子反复要修的一课。</p>`);
  // 四、天赋与方向（原画像精华收束）
  const gifts = [];
  ming.stars.forEach(s => { if(s.siHua && SIHUA_GIFT[s.siHua]) gifts.push(SIHUA_GIFT[s.siHua].replace('在命宫', `（${s.name}化${s.siHua}）`)); });
  let pats = []; try{ pats = E.detectPatterns(chart).slice(0, 2); }catch(e){}
  if(pats.length){
    const v2 = (window.GXG_PATTERNS_V2 || {})[pats[0].name] || patternFamilyText(pats[0].name);
    const say = v2 ? v2.text.split('。')[0] : '';
    gifts.push(`格局加持：${pats.map(p => p.name).join('、')}${say ? '——' + say : ''}`);
  }
  if(majors.length && STAR_GIFT[majors[0].name]) gifts.push(`方向感：事业上${STAR_GIFT[majors[0].name][1]}`);
  if(shen){
    const sg = (window.GXG_SHENGONG && window.GXG_SHENGONG.palaces && window.GXG_SHENGONG.palaces[disp(shen.name)]) || '';
    if(sg) gifts.push(`身宫在${disp(shen.name)}：${sg}`);
  }
  if(gifts.length) L.push(`<p class="p-say"><b>天赋与方向：</b>${esc(gifts.map(g => g.replace(/。+$/, '')).join('；'))}。</p>`);
  if(!L.length) return '';
  return `<div class="portrait-card"><div class="p-sec">✦ 命主画像</div>${L.join('')}</div>`;
}
/* 十二宫阅读卡：单列排版，命盘页与十二宫页复用 */
function palaceCardHTML(p, i, chart){
  const SP = window.GXG_SIHUA_PALACE || {};
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
  const vds = palaceVerdicts(chart).find(x => x.n === p.name);
  const vBadge = vds ? verdictBadge(vds.score) : '';
  const majors = pl.stars.filter(s => s.type === 'major');
  const minors = pl.stars.filter(s => s.type !== 'major');
  const dx = pl.daXianAge ? ` · 大限 ${pl.daXianAge[0]}–${pl.daXianAge[1]} 岁` : '';
  let h = `<div class="palace-card" data-palace="${p.name}" style="--i:${i}">`
    + `<div class="p-top"><h4>${p.name}</h4>${tags}${vBadge}<span class="p-gz">${ST[pl.stem]}${BR[pl.branch]}${dx}</span></div>`
    + (pl.isMingGong ? mingPortraitHTML(chart) : '')
    + `<div style="margin:2px 0 4px"><span class="modern">${p.modern}</span></div>`;
  // 疾厄宫专属：体质一句话
  if(p.name === '疾厄宫' && majors.length){
    const JIE_SAY = {
      '紫微':'体质底子不差，但容易「过劳而不自知」——别把身体当永动机','天机':'思虑型体质：脑子累比身体累更明显——睡眠是第一养生',
      '太阳':'能量外放耗得快——眼睛与心血管要留意，晒太阳反而补你','武曲':'行动型体质：硬扛是习惯——呼吸道与筋骨劳损要早防',
      '天同':'福气型体质底子好——怕的是太安逸，代谢类问题靠动起来','廉贞':'情绪直接影响身体——压力最先写在皮肤和睡眠上',
      '天府':'底盘稳——但管住嘴比进补重要，脾胃是你的镜子','太阴':'阴柔体质：眼睛、情绪、内分泌是三关——夜熬不得',
      '贪狼':'欲望型消耗——肝胆与作息是主战场，少酒少夜','巨门':'消化道是晴雨表——情绪化进食要留意，细嚼慢咽养你',
      '天相':'自律型体质，整体平稳——保持规律就赢过大多数人','天梁':'底子厚实，恢复力强——小病别拖，老来更健旺',
      '七杀':'冲劲型体质：外伤与炎症比慢性病更需要防','破军':'消耗型体质——透支后恢复慢，把休息排进日程表',
    };
    const say0 = JIE_SAY[majors[0].name];
    if(say0) h += `<p class="p-say"><b>体质提示</b>：${esc(say0)}。</p>`;
  }
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
  // 四化入宫断语（取前两条）
  const says = pl.stars.filter(s => s.siHua).map(s => {
    const say = (SP[s.siHua] || {})[p.name];
    return say ? `<p class="p-say"><b>化${esc(s.siHua)}在${esc(p.name)}</b>：${esc(say)}</p>` : '';
  }).filter(Boolean).slice(0, 2).join('');
  h += says;
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

/* ---------- 13维解读（v4.0 数据集按需加载，走自建 CDN 月包，双镜像） ---------- */
const DATA_MIRRORS = [
  'https://cdn.jsdelivr.net/gh/zjeep-arch/ziwei-data@main/data',
  'https://cdn.statically.io/gh/zjeep-arch/ziwei-data@main/data',
];
const ZSTD_MIRRORS = [
  ['https://cdn.jsdelivr.net/npm/@bokuweb/zstd-wasm@0.0.27/dist/esm/index.web.js',
   'https://cdn.jsdelivr.net/npm/@bokuweb/zstd-wasm@0.0.27/dist/esm/zstd.wasm'],
  ['https://unpkg.com/@bokuweb/zstd-wasm@0.0.27/dist/esm/index.web.js',
   'https://unpkg.com/@bokuweb/zstd-wasm@0.0.27/dist/esm/zstd.wasm'],
];
/* 解锁码：SALT|chartKey 的 SHA-256 取 8 位数字。SALT 公开在前端，仅防君子（0.9 元内容此强度足够）。 */
const GXG_UNLOCK_SALT = 'ae8f94fe28773c4be2cf110caac7f535';
const GXG_CONTACT = ''; // 站长微信（用户提供后填入，解锁弹窗第 2 步会显示）
/* 公众号口令解锁：用户关注后回复「解锁」获取口令。只存 SHA-256 哈希比对，不落明文。 */
const GXG_KOULING_HASH = '5d0f8482808c7fc8d94274191ca8356608ee4d88ba041fcf51d1c61ab9a60478';
async function verifyKouling(code){
  const norm = String(code).replace(/\s+/g,'');
  if(!norm) return false;
  try{ return (await sha256hex(norm)) === GXG_KOULING_HASH; }catch(e){ return false; }
}
/* 卡密体系（发卡平台全自动）：WX- + 6位序列 + 2位校验，可离线验证，不依赖服务端 */
const GXG_KAMI_URL = ''; // 发卡平台商品链接（用户提供后填入）
const GXG_KAMI_SECRET = 'e957886927d41e3bd32c6531cb687e02';
const GXG_KAMI_ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
async function verifyKami(code){
  const m = /^WX-([A-Z2-9]{6})([A-Z2-9]{2})$/.exec(String(code).trim().toUpperCase());
  if(!m) return false;
  const h = await sha256hex(GXG_KAMI_SECRET + '|' + m[1]);
  const b0 = parseInt(h.slice(0, 2), 16), b1 = parseInt(h.slice(2, 4), 16);
  return GXG_KAMI_ABC[b0 % GXG_KAMI_ABC.length] + GXG_KAMI_ABC[b1 % GXG_KAMI_ABC.length] === m[2];
}
function readingKeyOf(chart){
  const bi = chart.birthInfo;
  return `${bi.year}-${pad2(bi.month)}-${pad2(bi.day)}-${bi.hour}-${bi.gender}`;
}
async function sha256hex(s){
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function makeUnlockCode(key){
  const h = await sha256hex(GXG_UNLOCK_SALT + '|' + key);
  return (h.replace(/\D/g, '') + '00000000').slice(0, 8);
}
async function verifyUnlockCode(key, code){
  return (String(code).trim() === await makeUnlockCode(key));
}
function isUnlocked(key){ return !!store.get('gxg_unlock_' + key, false); }
let zstdApi = null, readingCache = {}; // key -> {topic: text}
async function getZstd(){
  if(zstdApi) return zstdApi;
  let last = null;
  for(const [esmUrl, wasmUrl] of ZSTD_MIRRORS){
    try{
      const mod = await import(esmUrl);
      await mod.init(wasmUrl);
      zstdApi = mod; // { decompress }
      return zstdApi;
    }catch(e){ last = e; }
  }
  throw last || new Error('解压组件加载失败');
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
/* 多镜像轮询下载：一个 CDN 不通自动换下一个 */
async function fetchFirst(urls, tries, onStep){
  let last = null;
  for(let u = 0; u < urls.length; u++){
    for(let i = 0; i < tries; i++){
      try{
        if(onStep) onStep(`正在下载解读数据（约 2MB）${urls.length > 1 ? ' · 线路' + (u + 1) : ''}…`);
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 20000);
        const res = await fetch(urls[u], { signal: ctl.signal });
        clearTimeout(timer);
        if(!res.ok) throw new Error('数据文件加载失败（' + res.status + '）');
        return res;
      }catch(e){ last = e; await new Promise(r => setTimeout(r, 700)); }
    }
  }
  throw last;
}
async function loadReading(chart, onStep){
  const bi = chart.birthInfo;
  const key = readingKeyOf(chart);
  if(readingCache[key]) return { key, data: readingCache[key], local: false };
  const cached = store.get('gxg_reading_' + key, null);
  if(cached){ readingCache[key] = cached; return { key, data: cached, local: false }; }
  const urls = DATA_MIRRORS.map(m => `${m}/${bi.year}/${pad2(bi.month)}.jsonl.zst`);
  const res = await fetchFirst(urls, 2, onStep);
  const buf = new Uint8Array(await res.arrayBuffer());
  if(onStep) onStep('下载完成，正在解压并匹配你的命盘…');
  const zstd = await getZstd();
  const raw = zstd.decompress(buf);
  const lineBytes = findLineBytes(raw, new TextEncoder().encode(`"k":"${key}"`));
  if(!lineBytes) throw new Error('这张盘暂无深度解读数据');
  const rec = JSON.parse(new TextDecoder().decode(lineBytes));
  readingCache[key] = rec.c;
  store.set('gxg_reading_' + key, rec.c);
  return { key, data: rec.c, local: false };
}
/* 本地精编版：远程语料库加载失败时的兜底，按命主命盘实时生成 13 维解读 */
const LOCAL_READING_PALACES = {
  overview: ['命宫'], personality: ['命宫'],
  love: ['夫妻宫', '命宫', '福德宫'], career: ['官禄宫', '命宫', '财帛宫'],
  wealth: ['财帛宫', '命宫', '福德宫'], health: ['疾厄宫', '命宫', '福德宫'],
  family: ['父母宫', '田宅宫', '兄弟宫'], children: ['子女宫', '命宫'],
  move: ['迁移宫', '命宫'], friends: ['交友宫', '命宫'],
  home: ['田宅宫', '命宫'], spirit: ['福德宫', '命宫'], parents: ['父母宫', '命宫'],
};
/* 双星同宫专属断语（合成化学反应），无专属词条返回空 */
function dualStarText(p){
  const majors = p.stars.filter(s => s.type === 'major');
  if(majors.length !== 2) return '';
  const T = window.GXG_DUAL_STAR || {};
  return T[majors[0].name + majors[1].name] || T[majors[1].name + majors[0].name] || '';
}
/* 辅煞落关键宫的场景化短句：让煞星吉星进断语正文，而不是只罗列名字 */
const SHA_SCENE = {
  '财帛宫': {
    '地空': '财帛宫见地空：账面来钱不慢，但存钱罐容易漏，突发人情和冲动消费是常见漏口，适合钱一到账就转定期或换成实物资产。',
    '地劫': '财帛宫见地劫：最怕熟人画饼和一时上头的投入，大额支出先过夜再决定。',
    '天马': '财帛宫见天马：钱要动起来才生钱，适合异地、线上、出差跑动型的收入。',
    '禄存': '财帛宫见禄存：自带存钱罐，财上有托底，越稳越能滚大。',
  },
  '命宫': {
    '地空': '命宫见地空：想法不走寻常路，得失心放淡一点，反而走得更远。',
    '地劫': '命宫见地劫：人生容易有"忽然清零重来"的段落，老本别全押在一处。',
    '擎羊': '命宫见擎羊：自带锋芒、行动力强，是你的武器；硬碰硬之前先算代价。',
    '红鸾': '命宫见红鸾：人缘与桃花都旺，第一印象天然加分。',
    '天喜': '命宫见天喜：自带喜气，亲和力强，适合站在人前。',
  },
  '官禄宫': {
    '天马': '官禄宫见天马：事业带奔波属性，动中求发展，坐办公室坐不住反而对。',
    '擎羊': '官禄宫见擎羊：适合竞争激烈的赛道，拼劲就是你的入场券。',
    '禄存': '官禄宫见禄存：事业上有稳定的资源托底，适合在体制或大平台里滚雪球。',
  },
  '夫妻宫': {
    '擎羊': '夫妻宫见擎羊：感情里摩擦来得快，冷静期是刚需，别在气头上定去留。',
    '陀罗': '夫妻宫见陀罗：感情容易拖和磨，问题别攒着，定期摊开说。',
    '地空': '夫妻宫见地空：容易把对方理想化，落差大时先看事实、再下结论。',
    '地劫': '夫妻宫见地劫：感情里防"忽然清零"式的冲动决定，分手/闪婚都先过夜。',
    '红鸾': '夫妻宫见红鸾：正缘信号强，多从熟人圈和正式场合出现。',
    '天喜': '夫妻宫见天喜：喜事临门的配置，相处里笑声多，矛盾也化得快。',
  },
  '福德宫': {
    '地空': '福德宫见地空：精神世界丰富，也容易想太多，留一个能固定放空的爱好很有用。',
    '地劫': '福德宫见地劫：心里容易忽然空一下，情绪低谷时别做重大决定。',
    '天马': '福德宫见天马：闲不下来的命，旅行和移动本身就是你的充电方式。',
  },
};
function palaceTextBrief(chart, p, skipJi){
  const SP = window.GXG_SIHUA_PALACE || {};
  const L = [];
  const head = `${disp(p.name)}（${ST[p.stem]}${BR[p.branch]}）`;
  const majors = p.stars.filter(s => s.type === 'major');
  /* 亮度定调：同一颗星，庙旺和落陷完全是两回事，不写就是"对不上"的主要来源 */
  const brightSay = b => {
    if(b === '庙' || b === '旺') return '这颗星在你盘里是庙旺状态，能量足，上面的特质会表现得更明显。';
    if(b === '陷') return '这颗星在你盘里落陷，能量偏弱，上面的优点要打折看，短板那面更容易冒头——后天的选择比先天更重要。';
    return '这颗星在你盘里能量中平，特质发挥得温和，关键看组合与后天。';
  };
  if(majors.length){
    L.push(head + '主星：' + majors.map(s => `${s.name}${s.siHua ? '化' + s.siHua : ''}`).join('、') + '。');
    const dual = dualStarText(p);
    if(dual) L.push(`${majors[0].name}${majors[1].name}同宫：${dual}`);
    majors.forEach(s => { if(D.stars[s.name]) L.push(`${s.name}：${D.stars[s.name]}${brightSay(s.brightnessRaw)}`); });
  } else {
    const bstars = ((p.borrowedStars && p.borrowedStars.length) ? p.borrowedStars : []).filter(nm => (D.stars || {})[nm]);
    const bname = (p.borrowedStars && p.borrowedStars.length) ? p.borrowedStars.join('、') : '对宫';
    L.push(`${head}无主星（空宫），借对宫（${bname}）来看，力量打些折扣。空宫的体感是：这一块没有出厂预设，容易被环境和身边人带着走，早年可能迷茫，但换个角度看，可塑性也是最强的——别人被星定死了，你还有得选。`);
    bstars.forEach(nm => L.push(`借来的${nm}：${D.stars[nm]}`));
  }
  p.stars.filter(s => s.siHua).forEach(s => {
    const say = (SP[s.siHua] || {})[disp(p.name)];
    if(say){
      L.push(`${s.name}化${s.siHua}在${disp(p.name)}：${say}`);
      if(skipJi) skipJi.add(s.name + '@' + disp(p.name));
    }
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
  personality: '性格看命宫：命宫是你的出厂设置，身宫是你后半程想成为的样子。两宫一起看，才是完整的你。',
  love: '感情看夫妻宫，合看命宫（你的相处打法）和福德宫（你的精神底色）。',
  career: '事业看官禄宫，合看命宫（你的打法）和财帛宫（回报）。',
  wealth: '财运看财帛宫，合看命宫和福德宫：怎么赚钱、怎么花钱、存不存得住。',
  health: '健康看疾厄宫，合看命宫（体质底子）和福德宫（压力与恢复节奏）。只提示倾向，不做医疗判断。',
  family: '家庭看三宫：父母宫（原生关系）、田宅宫（安稳基地）、兄弟宫（同辈缘）。',
  children: '子女宫看孩子，也看你的作品、表达与创造力投射。',
  move: '迁移宫看你和外部世界的关系：异地、外出、发展环境。',
  friends: '交友宫看你的社交圈：朋友、团队、人际资源。',
  home: '田宅宫是你的安稳基地：家庭、房产、居住环境。',
  spirit: '福德宫是精神宫：快乐来源、内在电量、兴趣所向。',
  parents: '父母宫看你与长辈的关系：支持方式、期待与课题。',
};
/* 每个维度的时间维度：当前大限 + 今年流年，大限若落在主题宫位上则点出来 */
function topicTimeLine(chart, topicCn, palNames){
  const dx = chart.daXians[chart.currentDaXianIndex] || {};
  const dxName = disp(dx.palaceName || '');
  const y = new Date().getFullYear();
  const lp = palaceByBranch(chart, ((y - 4) % 12 + 12) % 12);
  let s = `时间维度：当前大限 ${dx.startAge || '—'}–${dx.endAge || '—'} 岁在${dxName}；${y} 年流年命宫在${disp(lp.name)}。`;
  if(palNames.includes(dxName)) s += `大限正好走在${topicCn}相关的宫位上，这十年这个主题的动静会比较大，大限的四化值得细看。`;
  return s;
}
/* 每个维度的化忌功课：主题宫位里有化忌就点出来；宫位详述里已讲过的不重复 */
function topicJiLine(chart, palNames, skip){
  const hits = [];
  chart.palaces.forEach(p => p.stars.forEach(st => {
    if(st.siHua === '忌' && palNames.includes(disp(p.name)) && !(skip && skip.has(st.name + '@' + disp(p.name)))) hits.push(`${st.name}在${disp(p.name)}`);
  }));
  if(!hits.length) return '';
  const intro = (window.GXG_HUAJI || {}).intro || '';
  return `功课题：${hits.join('、')}化忌。${intro}`;
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
      parts.push(`你的命宫${mingSay}，${chart.wuxingJuName}。命宫定一生的底色，身宫（在${shen ? disp(shen.name) : '—'}）定中年后发力的方向。`);
      try{
        const dx = chart.daXians[chart.currentDaXianIndex] || {};
        const y = new Date().getFullYear();
        const lp = palaceByBranch(chart, ((y - 4) % 12 + 12) % 12);
        parts.push(`时间上：当前大限 ${dx.startAge || '—'}–${dx.endAge || '—'} 岁（${disp(dx.palaceName || '')}）是这十年的大背景；${y} 年流年命宫在${disp(lp.name)}。大限定调子，流年看动静。`);
      }catch(e){}
      let pats = [];
      try{ pats = E.detectPatterns(chart).slice(0, 3); }catch(e){}
      pats.forEach(pt => {
        const v2 = (window.GXG_PATTERNS_V2 || {})[pt.name];
        parts.push(`${pt.name}：${v2 ? v2.text : (pt.description || '')}`);
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
      parts.push('以上是本地精编版：根据你的命盘实时生成，离线可用。完整版（三万字语料库解读）在有网络时会自动加载。命理说的是概率性倾向，约六七成或然律，地图不是导航。');
    }
    out[topic] = parts.join('\n\n');
  });
  return out;
}
/* 上游语料去绝对化：人格类绝对断语是"一望即知真假"的高危区，转为外界视角+或然表述。
   只作用于完整版（上游预生成语料），本地版文案已按此标准写。规则按用户反馈持续加。 */
const GXG_SOFTEN = [
  [/麻烦的是脾气硬、爱争，情绪起伏大/g, '要留意的是，在不熟的人眼里，你容易显得脾气硬、爱争，情绪起伏也不小'],
  [/压力一来或者感情出事，反应容易走极端，不是爆发就是把自己整个关起来/g, '压力一大或感情出状况、情绪上头时，反应容易偏极端——要么爆发，要么把自己关起来'],
  [/你脾气硬/g, '外人容易觉得你脾气硬'],
  [/脾气臭/g, '外人容易觉得你脾气急'],
  [/你就是个急脾气/g, '外人看你是个急脾气'],
];
function softenFullText(t){
  if(!t) return t;
  let s = t;
  for(const [re, rep] of GXG_SOFTEN) s = s.replace(re, rep);
  return s;
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
function setReadingStep(t){ $('#reading-status').innerHTML = t; }
async function renderReading(){
  const rec = cur();
  if(!rec){ $('#reading-status').textContent = '先排一张盘，才能看深度解读。'; $('#reading-body').innerHTML = ''; return; }
  renderReadingTabs();
  // 本地优先：先瞬间渲染本地精编版（离线可用），完整版在后台静默尝试
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
  setStep('本地精编版 · 已按你的命盘生成');
  const key = readingKeyOf(rec.chart);
  if(isUnlocked(key)) tryLoadFull(rec);
  else setStep('本地精编版 · 已按你的命盘生成 <button class="link-btn" data-unlock-open>免费解锁 3 万字完整版 →</button>');
}
async function tryLoadFull(rec){
  const setStep = setReadingStep;
  const key = readingKeyOf(rec.chart);
  setStep('本地精编版 · 已按你的命盘生成 <span class="hint">· 正在加载完整版…</span>');
  try{
    const { data } = await loadReading(rec.chart, null);
    window.GXG_READING = data;
    window.GXG_READING_LOCAL = false;
    renderReadingBody();
    setStep('已加载完整版 · 命宫主星' + esc(rec.chart.palaces.find(p=>p.isMingGong).stars.filter(s=>s.type==='major').map(s=>s.name).join('、') || '（空宫）'));
  }catch(err){
    setStep('本地精编版 · 已按你的命盘生成 <span class="hint">· 完整版加载失败（' + esc(String(err && err.message || err)).slice(0, 60) + '）</span> <button class="link-btn" id="reading-retry">点此重试</button>');
  }
}
function renderReadingBody(){
  const data = window.GXG_READING; if(!data) return;
  const rawText = data[readingTopic] || '暂无';
  const text = window.GXG_READING_LOCAL ? rawText : softenFullText(rawText);
  const paras = text.split(/\n\n+/);
  const rec = cur();
  const key = rec ? readingKeyOf(rec.chart) : '';
  const unlocked = key && isUnlocked(key);
  const upsell = (!window.GXG_READING_LOCAL || unlocked) ? '' :
    `<div class="unlock-card"><div><b>想要更详细的完整版？</b><br>
     <span class="hint">67.5 万张命盘语料库 · 13 个维度 · 全文约 3 万字，关注公众号免费解锁，永久可看。</span></div>
     <button class="btn-primary" data-unlock-open>免费解锁</button></div>`;
  $('#reading-body').innerHTML = paras.map((p, i) =>
    `<p>${md2html(p)}</p>`
  ).join('') + upsell +
  `<div class="hint" style="margin-top:16px">${
    window.GXG_READING_LOCAL
      ? '本地精编版：按你的命盘实时生成，离线可用。'
      : '完整版解读数据：紫微斗数开源解读数据集 v4.0（CC BY 4.0），已获解锁。'
  }</div>`;
}
/* ---------- 解锁弹窗 ---------- */
function openUnlock(){
  if(!cur()){ nav('input'); return; }
  $('#unlock-code').value = '';
  $('#unlock-err').textContent = '';
  $('#unlock-modal').hidden = false;
}
document.addEventListener('click', async e => {
  if(e.target.closest('#reading-retry')){ const rec = cur(); if(rec) tryLoadFull(rec); return; }
  if(e.target.closest('[data-unlock-open]')){ openUnlock(); return; }
  if(e.target.closest('[data-unlock-close]')){ $('#unlock-modal').hidden = true; return; }
  if(e.target.closest('#unlock-copy')){
    try{ await navigator.clipboard.writeText($('#unlock-key').textContent); $('#unlock-copy').textContent = '已复制'; }
    catch(err){ $('#unlock-copy').textContent = '长按复制'; }
    return;
  }
  if(e.target.closest('#unlock-verify')){
    const rec = cur(); if(!rec) return;
    const key = readingKeyOf(rec.chart);
    const code = $('#unlock-code').value.replace(/\s+/g,'');
    let ok = await verifyUnlockCode(key, code) || await verifyKouling(code);
    let kamiKey = '';
    if(!ok && await verifyKami(code)){
      kamiKey = 'gxg_kami_used_' + code.toUpperCase();
      const usedFor = store.get(kamiKey, null);
      ok = !usedFor || usedFor === key; // 同一卡密在本机只解一张盘
    }
    if(ok){
      store.set('gxg_unlock_' + key, true);
      if(kamiKey) store.set(kamiKey, key);
      $('#unlock-modal').hidden = true;
      renderReading();
    } else {
      $('#unlock-err').textContent = '口令不对，请检查后重试。';
    }
  }
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
// 进入解读页时加载
const _nav = nav;
nav = function(name){
  _nav(name);
  if(name === 'reading') renderReading();
  if(name === 'answer'){ renderWenyun(); renderZeri(); }
  if(name === 'life') renderLifeView();
  if(name === 'sihuapan') renderSihuaPan();
};

/* ---------- 新手导览 ---------- */
const GUIDE6_FALLBACK = [
  ['命身为本', '先看命宫定你是什么人，再看身宫定你后半程想成为什么人。'],
  ['三方四正', '看任何一宫，都要合看它的对宫和三合两宫，四宫一起看才完整。'],
  ['庙旺辅煞', '星有亮度（庙旺利陷），还有辅星帮忙、煞星捣乱，组合才决定吉凶。'],
  ['四化飞动', '禄是得到、权是掌控、科是名声、忌是功课。四化落在哪宫，哪宫就有动静。'],
  ['逐宫细看', '十二宫是人生的 12 个领域，一个一个看，每个宫都有白话解释。'],
  ['格局总览', '最后看格局：它是整张盘的总结标签，接近某格就说"带有某格意味"。'],
];
function renderGuide(){
  const steps = (window.GXG_GUIDE6 || GUIDE6_FALLBACK).map((s, i) => {
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
function lunarMonthStartsAsync(year, onProgress){
  return new Promise(resolve => {
    const key = 'gxg_lunar_' + year;
    const cached = store.get(key, null);
    if(cached && cached.length){ resolve(cached.map(Number).map(t => new Date(t))); return; }
    const infoOf = d => E.generateChart({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: 0, gender: 'male' }).lunarInfo;
    const starts = [];
    let probe = null, scanned = 0;
    const step = () => {
      const t0 = Date.now();
      while(Date.now() - t0 < 55){
        if(!probe){
          if(!starts.length){
            if(scanned >= 40) break;
            probe = { phase: 1, d: new Date(year, 0, 21 + scanned) }; scanned++;
          } else if(starts.length < 12){
            probe = { phase: 2, base: starts[starts.length - 1], d: new Date(+starts[starts.length - 1] + 29 * 864e5) };
          } else break;
        }
        const li = infoOf(probe.d);
        if(probe.phase === 1){
          if(li.lunarYear === year && li.lunarMonth === 1 && li.lunarDay === 1 && !li.isLeapMonth) starts.push(probe.d);
          probe = null;
        } else if(li.lunarDay === 1 && !li.isLeapMonth){
          starts.push(probe.d); probe = null;
        } else {
          // 逐日找月首；若踩到闰月初一，直接跳过整个闰月（至少 29 天）
          probe = { phase: 2, base: probe.base, d: new Date(+probe.d + ((li.lunarDay === 1 && li.isLeapMonth) ? 29 : 1) * 864e5) };
        }
      }
      if(onProgress) onProgress(Math.min(.95, (scanned + starts.length * 4) / 55));
      if(starts.length >= 12 || scanned >= 40){
        if(starts.length >= 12) store.set(key, starts.map(x => +x));
        if(onProgress) onProgress(1);
        resolve(starts);
        return;
      }
      setTimeout(step, 0);
    };
    setTimeout(step, 0);
  });
}
/* 30 支签：克制白话+古风意象，不做宿命断言。同一张盘（或无盘）同一天抽同一支，明早自动换。 */
/* ---------- 十二宫强度量化：把庙旺/四化/辅煞折成分数，三方四正加权 ---------- */
const BRIGHT_SCORE = { '庙':3, '旺':2.5, '得':2, '得地':2, '利益':1.5, '利':1.5, '平和':1, '平':1, '不':0.5, '陷':-1 };
const SHA_LIST = ['擎羊','陀罗','火星','铃星','地空','地劫','天刑'];
const LUCKY6 = ['左辅','右弼','天魁','天钺','文昌','文曲'];
function palaceScore(p){
  let s = 0;
  const majors = p.stars.filter(x => x.type === 'major');
  if(!majors.length) s -= 1.5; // 空宫减分（借对宫力量已含在三方加权里）
  majors.forEach(m => { s += BRIGHT_SCORE[m.brightnessRaw] != null ? BRIGHT_SCORE[m.brightnessRaw] : 0.5; });
  p.stars.forEach(st => {
    if(st.siHua) s += ({ '禄':2, '权':1.5, '科':1, '忌':-2 })[st.siHua] || 0;
    if(SHA_LIST.includes(st.name)) s += (st.name === '地空' || st.name === '地劫') ? -1.2 : -0.8;
    if(LUCKY6.includes(st.name)) s += 0.8;
    if(st.name === '禄存') s += 1.2;
    if(st.name === '天马') s += 0.3;
  });
  (p.selfSihua || []).forEach(x => { s += x.siHua === '忌' ? -1 : 0.5; });
  return s;
}
function palaceStrength(chart, p){
  const self = palaceScore(p);
  const opp = palaceScore(palaceByBranch(chart, (p.branch + 6) % 12));
  const t1 = palaceScore(palaceByBranch(chart, (p.branch + 4) % 12));
  const t2 = palaceScore(palaceByBranch(chart, (p.branch + 8) % 12));
  return self + 0.3 * opp + 0.2 * t1 + 0.2 * t2; // 看一宫要合看三方四正
}
/* ---------- 人生时间轴：大限主题 + 换挡流年 ---------- */
function yearSay(o){
  if(o.isMark && o.jiHit) return '换挡＋忌入命方，大事费心';
  if(o.isMark) return '换挡 · 主题切换';
  if(o.jiHit) return '忌入命方 · 费心之年';
  if(o.luPal) return '禄落' + o.luPal + ' · 有顺风';
  return '平稳';
}
/* 逐年断语：把换挡/费心/顺风拼成一句人话（时间轴与全景共用） */
function yearStory(o){
  const parts = [];
  if(o.isMark) parts.push(`主题切到「${GONG_SHORT[disp(o.liuPal.name)] || ''}」`);
  else parts.push(`流年命宫进${disp(o.liuPal.name).replace('宫','')}`);
  if(o.jiHit) parts.push(`${o.jiPal ? o.jiPal.replace('宫','') + '上的事' : '命宫三方'}要费心，少做不可逆决定`);
  if(o.luPal) parts.push(`${o.luPal.replace('宫','')}有顺风${o.jiHit ? '可以对冲一半' : ''}`);
  if(!o.jiHit && !o.luPal && !o.isMark) parts.push('平稳过渡，适合练内功');
  return parts.join('；');
}
/* 逐年断语：把换挡/费心/顺风拼成一句人话（时间轴与全景共用） */
function yearStory(o){
  const parts = [];
  if(o.isMark) parts.push(`主题切到「${GONG_SHORT[disp(o.liuPal.name)] || ''}」`);
  else parts.push(`流年命宫进${disp(o.liuPal.name).replace('宫','')}`);
  if(o.jiHit) parts.push(`${o.jiPal ? o.jiPal.replace('宫','') + '上的事' : '命宫三方'}要费心，少做不可逆决定`);
  if(o.luPal && (!o.jiHit || true)) parts.push(`${o.luPal.replace('宫','')}有顺风${o.jiHit ? '可以对冲一半' : ''}`);
  if(!o.jiHit && !o.luPal && !o.isMark) parts.push('平稳过渡，适合练内功');
  return parts.join('；');
}
const DX_THEME = {
  '命宫':'做自己、立人设的十年', '兄弟宫':'同辈与合伙的十年', '夫妻宫':'感情与深度绑定的十年',
  '子女宫':'作品与下一代的十年', '财帛宫':'赚钱与花钱方式升级的十年', '疾厄宫':'身体亮牌、调整作息的十年',
  '迁移宫':'往外走、见世面的十年', '交友宫':'人脉圈层洗牌的十年', '官禄宫':'事业主战场、最出成绩的十年',
  '田宅宫':'安家置业的十年', '福德宫':'向内修、攒后劲的十年', '父母宫':'与长辈和平台打交道的十年',
};
/* 大限十年成色：宫位强度 + 限禄权科入命三方加分、限忌入命三方减分 */
function decadeQuality(chart, i, dx){
  const pal = palaceByBranch(chart, dx.palaceBranch);
  let s = palaceStrength(chart, pal);
  let sh = null;
  try{ sh = normSihua(E.getDaXianSiHua(chart, i)); }catch(e){}
  const mingFang = new Set(sanfangBranches(chart.mingGongBranch));
  if(sh){
    ['lu','quan','ke'].forEach(k => {
      const p = chart.palaces.find(pl => pl.stars.some(x => x.name === sh[k]));
      if(p && mingFang.has(p.branch)) s += 1.2;
    });
    const jiP = chart.palaces.find(pl => pl.stars.some(x => x.name === sh.ji));
    if(jiP && mingFang.has(jiP.branch)) s -= 1.5;
  }
  return { s, sh, pal, lvl: s > 4 ? '旺限' : s > 1.5 ? '平顺' : '辛劳' };
}
function renderTimelineCard(chart){
  const card = $('#timeline-card'), body = $('#timeline-body');
  if(!card) return;
  const birthY = chart.birthInfo.year;
  const nowY = new Date().getFullYear();
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
      `<i class="sp-bar${o.isMark ? ' mk' : ''}${o.jiHit ? ' ji' : ''}${o.dblJi ? ' dbl' : ''}" title="${o.y}：流年命宫进${disp(o.liuPal.name).replace('宫','')}${o.isMark ? '，换挡之年' : ''}${o.dblJi ? '，双忌叠压，最要稳' : ''}${o.jiaoZhan ? '，禄忌交战' : ''}${o.jiHit ? '，化忌入命方，费心' : ''}${o.luPal ? '，' + o.luPal.replace('宫','') + '有顺风' : ''}"></i>`).join('');
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
          <span class="tl-lvl lv-${lvl === '旺限' ? 'hi' : lvl === '平顺' ? 'mid' : 'lo'}">${lvl}</span></div>
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
          <p class="hint">◆换挡＝流年命宫踩进命/官/财/夫；"忌入命方"＝流年化忌落本命命宫三方四正，该年功课重。</p></div>
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
    `<p class="hint" style="margin:0 0 8px">柱状是这一年忙什么：<b style="color:#D9B36A">金柱＝换挡年</b>（十年主题切换）、<b style="color:#E09B7E">红柱＝化忌入你命宫三方</b>（费心之年）、蓝柱＝平稳年。悬停柱子看那年的具体事项，点每一层展开逐年明细。</p>` + rows +
    `<p class="hint" style="margin:10px 0 0">当前 ${curDx.startAge || '—'}–${curDx.endAge || '—'} 岁走【${curDx.palaceName ? disp(curDx.palaceName) : ''}】大限${nextMark ? `，下一个换挡年是 <b style="color:#D9B36A">${nextMark} 年</b>` : ''}。走势是"动静与主题"，不是吉凶判决。</p>` +
    `<button class="btn-ghost btn-block" data-nav="life" style="margin-top:12px">展开人生全景 · 十二层＋流年热力 →</button>`;
  body.querySelectorAll('.tl-row').forEach(r => r.addEventListener('click', () => r.classList.toggle('open')));
  card.hidden = false;
}
/* ---------- 人生全景：十二层全展开 + 120 年流年热力 + 年份联动 ---------- */
function jumpToYear(y){
  if(!y || y < 1900 || y > 2200) return;
  luckMode = 'liunian'; luckParam = y;
  nav('chart');
}
function lifeYearsOf(chart, dx, keyBranches, mingFangSet, dxSh){
  const birthY = chart.birthInfo.year;
  const y1 = birthY + dx.startAge, y2 = birthY + dx.endAge;
  const years = [];
  for(let y = y1; y <= y2; y++){
    const yb = ((y - 4) % 12 + 12) % 12;
    let lsh = null;
    try{ lsh = normSihua(E.getLiuNianSiHua(y)); }catch(e){}
    const jiP = lsh && lsh.ji ? chart.palaces.find(pl => pl.stars.some(x => x.name === lsh.ji)) : null;
    const luPal = lsh && lsh.lu ? sihuaStarPalace(chart, lsh.lu) : '';
    const jiPal = lsh && lsh.ji ? sihuaStarPalace(chart, lsh.ji) : '';
    const dxJiPal = dxSh && dxSh.ji ? sihuaStarPalace(chart, dxSh.ji) : '';
    const dxLuPal = dxSh && dxSh.lu ? sihuaStarPalace(chart, dxSh.lu) : '';
    years.push({
      y,
      isMark: keyBranches.includes(yb),
      luPal,
      jiPal,
      jiHit: !!(jiP && mingFangSet.has(jiP.branch)),
      liuPal: palaceByBranch(chart, yb),
      dblJi: !!(dxJiPal && jiPal === dxJiPal),
      jiaoZhan: !!(dxJiPal && luPal === dxJiPal),
      dblLu: !!(dxLuPal && luPal === dxLuPal),
    });
  }
  return years;
}
function renderLifeView(){
  const rec = cur();
  const box = $('#life-body');
  if(!box) return;
  if(!rec){ box.innerHTML = '<div class="empty">先排一张盘，再看人生全景。</div>'; return; }
  const chart = rec.chart;
  const birthY = chart.birthInfo.year;
  const nowY = new Date().getFullYear();
  const keyBranches = ['命宫','官禄宫','财帛宫','夫妻宫'].map(n => palaceByName(chart, n).branch);
  const mingFangSet = new Set(sanfangBranches(chart.mingGongBranch));
  // 顶部：120 年流年热力（行=大限，列=年）
  let heat = '', sections = '';
  chart.daXians.forEach((dx, i) => {
    const { sh, pal, lvl } = decadeQuality(chart, i, dx);
    const name = disp(pal.name);
    const majors = pal.stars.filter(x => x.type === 'major').map(x => x.name).join('·') || '空宫';
    const years = lifeYearsOf(chart, dx, keyBranches, mingFangSet, sh);
    const marks = years.filter(o => o.isMark).map(o => o.y);
    const dblYears = years.filter(o => o.dblJi).map(o => o.y);
    const jzYears = years.filter(o => o.jiaoZhan).map(o => o.y);
    heat += `<div class="ly-row${i === chart.currentDaXianIndex ? ' cur' : ''}"><span class="ly-lab">${dx.startAge}–${dx.endAge}</span><div class="ly-cells">` +
      years.map(o => `<button class="ly-cell${o.isMark ? ' mk' : ''}${o.jiHit ? ' ji' : ''}${o.dblJi ? ' dbl' : ''}${o.y === nowY ? ' now' : ''}" data-year="${o.y}" title="${o.y}：流年命宫进${disp(o.liuPal.name).replace('宫','')}${o.isMark ? '，换挡之年' : ''}${o.dblJi ? '，与大限忌同宫——双忌叠压，最要稳的一年' : ''}${o.jiaoZhan ? '，禄忌交战——机会与牵扯同来' : ''}${o.jiHit ? '，化忌入命方，费心' : ''}${o.luPal ? '，' + o.luPal.replace('宫','') + '有顺风' : ''}">${String(o.y).slice(2)}</button>`).join('') +
      '</div></div>';
    const spark = years.map(o =>
      `<i class="sp-bar${o.isMark ? ' mk' : ''}${o.jiHit ? ' ji' : ''}" title="${o.y}：流年命宫进${disp(o.liuPal.name).replace('宫','')}${o.isMark ? '，换挡之年' : ''}${o.jiHit ? '，化忌入命方，费心' : ''}${o.luPal ? '，' + o.luPal.replace('宫','') + '有顺风' : ''}"></i>`).join('');
    const detail = years.map(o =>
      `<tr${o.y === nowY ? ' class="now"' : ''}><td class="ly-y" data-year="${o.y}">${o.y}</td>` +
      `<td>${disp(o.liuPal.name).replace('宫','')}${o.isMark ? ' ◆换挡' : ''}${o.dblJi ? ' ⛔双忌' : ''}${o.jiaoZhan ? ' ⚡交战' : ''}</td>` +
      `<td>${o.luPal ? '禄→' + o.luPal : '—'}</td>` +
      `<td>${o.jiPal ? '忌→' + o.jiPal + (o.jiHit ? '（命方）' : '') : '—'}</td>` +
      `<td>${withTerms(yearStory(o))}</td>` +
      `<td><button class="link-btn" data-year="${o.y}">看流年盘 →</button></td></tr>`).join('');
    sections += `<div class="tl-row open${i === chart.currentDaXianIndex ? ' cur' : ''}">
      <div class="tl-age">${dx.startAge}–${dx.endAge}<span>${birthY + dx.startAge}–${birthY + dx.endAge}</span></div>
      <div class="tl-body">
        <div class="tl-line1"><b>${name}</b><span class="tl-stars">${esc(majors)}</span>
          <span class="tl-lvl lv-${lvl === '旺限' ? 'hi' : lvl === '平顺' ? 'mid' : 'lo'}">${lvl}</span></div>
        <div class="tl-theme">${esc(DX_THEME[name] || '')}</div>
        <div class="tl-line2">
          ${sh && sh.lu ? `<span class="tl-sh">限禄 ${esc(sh.lu)}→${esc(sihuaStarPalace(chart, sh.lu))}</span>` : ''}
          ${sh && sh.ji ? `<span class="tl-sh ji">限忌 ${esc(sh.ji)}→${esc(sihuaStarPalace(chart, sh.ji))}</span>` : ''}
          ${marks.length ? `<span class="tl-mk">换挡 ${marks.slice(0, 3).join('、')}${marks.length > 3 ? '…' : ''}</span>` : ''}
        </div>
        <div class="tl-spark">${spark}</div>
        <div class="tl-expand"><table class="tl-table"><tr><th>年</th><th>流年命宫</th><th>禄</th><th>忌</th><th>这一年</th><th></th></tr>${detail}</table></div>
      </div></div>`;
  });
  const curDx = chart.daXians[chart.currentDaXianIndex] || {};
  let nextMark = null;
  for(let y = nowY + 1; y <= birthY + (curDx.endAge || 0); y++){
    if(keyBranches.includes(((y - 4) % 12 + 12) % 12)){ nextMark = y; break; }
  }
  box.innerHTML =
    `<div class="card"><div class="card-kicker">120 年流年热力</div>` +
    `<div class="ly-heat">${heat}</div>` +
    `<div class="heat-legend"><span>静</span><i style="background:#262F5E"></i><i style="background:#5F74C4"></i><i style="background:#C9A96A"></i><span>动</span>` +
    `<span class="hint" style="margin-left:8px">描边=换挡年 · 红=忌入命方 · 深红=双忌叠压 · 点年份直达流年盘</span></div></div>` +
    `<div class="card"><div class="card-kicker">十二层 · 全展开</div>` +
    `<p class="hint" style="margin:0 0 6px">当前 ${curDx.startAge || '—'}–${curDx.endAge || '—'} 岁走【${curDx.palaceName ? disp(curDx.palaceName) : ''}】大限${nextMark ? `，下一个换挡年是 <b style="color:#D9B36A">${nextMark} 年</b>` : ''}。</p>` +
    sections + `</div>`;
}
/* ---------- 问运：今年运势 / 感情 / 财运 / 事业（先结论后依据，全部盘面实算） ---------- */
function wyYearsOf(chart, targetPalName){
  const nowY = new Date().getFullYear(), out = [];
  for(let y = nowY - 5; y <= nowY + 7; y++){
    let lsh = null; try{ lsh = normSihua(E.getLiuNianSiHua(y)); }catch(e){}
    if(!lsh) continue;
    const jiP = lsh.ji ? chart.palaces.find(pl => pl.stars.some(x => x.name === lsh.ji)) : null;
    const luP = lsh.lu ? chart.palaces.find(pl => pl.stars.some(x => x.name === lsh.lu)) : null;
    const yb = ((y - 4) % 12 + 12) % 12;
    out.push({ y, jiHit: !!(jiP && disp(jiP.name) === targetPalName), luHit: !!(luP && disp(luP.name) === targetPalName), cmd: yb === chart.mingGongBranch });
  }
  return out;
}
function renderWenyun(){
  const rec = cur();
  const box = $('#answer-list');
  if(!box) return;
  if(!rec){ box.innerHTML = '<div class="empty">先排一张盘，问运按你的盘面作答。</div>'; return; }
  const chart = rec.chart;
  const year = new Date().getFullYear();
  const yb = ((year - 4) % 12 + 12) % 12;
  const lsh = normSihua(E.getLiuNianSiHua(year)) || {};
  const lp = palaceByBranch(chart, yb);
  const blocks = [];
  const block = (icon, title, concl, rows, act, time) => blocks.push(
    `<div class="ans-card wy"><div class="ans-head"><b>${icon} ${title}</b></div>` +
    `<div class="wy-concl">${withTerms(concl)}</div>` +
    (rows.length ? `<div class="wy-rows">${rows.map(r => `<div class="scr-row"><span class="scr-tag ${r.cls || ''}">${r.tag}</span><span class="scr-text">${r.html != null ? r.html : withTerms(r.text)}</span></div>`).join('')}</div>` : '') +
    (time ? `<div class="wy-time">⏳ ${withTerms(time)}</div>` : '') +
    (act && act.length ? `<ul class="wy-act">${act.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : '') +
    `</div>`);
  const luTo = lsh.lu ? sihuaStarPalace(chart, lsh.lu) : '';
  const jiTo = lsh.ji ? sihuaStarPalace(chart, lsh.ji) : '';
  const lpMajors = lp.stars.filter(x => x.type === 'major').map(x => x.name).join('·') || '空宫（借对宫看）';
  // ① 今年运势
  // 逐月：流月命宫 + 流月禄忌引动
  const yStemLunar = chart.lunarInfo.yearStem;
  const dj = doujunBranch(chart, year);
  const mfSetW = new Set(sanfangBranches(chart.mingGongBranch));
  const monthCells = [], hotMonths = [];
  for(let m = 1; m <= 12; m++){
    let msh = null; try{ msh = E.getLiuYueSiHua(yStemLunar, m); }catch(e){}
    const mJi = msh && msh.ji ? chart.palaces.find(pl => pl.stars.some(x => x.name === msh.ji)) : null;
    const mLu = msh && msh.lu ? chart.palaces.find(pl => pl.stars.some(x => x.name === msh.lu)) : null;
    const mJiPal = msh && msh.ji ? sihuaStarPalace(chart, msh.ji) : '';
    const mLuPal = msh && msh.lu ? sihuaStarPalace(chart, msh.lu) : '';
    const mJiHit = !!(mJi && mfSetW.has(mJi.branch));
    const mLuHit = !!(mLu && mfSetW.has(mLu.branch));
    const hot = mJiHit ? 'ji' : mLuHit ? 'lu' : '';
    if(mJiHit) hotMonths.push({ m, pal: mJiPal });
    monthCells.push(`<i class="mo-cell ${hot}" title="农历${m}月${mJiPal ? ' · 忌落' + mJiPal + (mJiHit ? '（入命方）' : '') : ''}${mLuPal ? ' · 禄落' + mLuPal : ''}">${m}</i>`);
  }
  const hotLine = hotMonths.length
    ? `${hotMonths.map(o => o.m + '月').join('，')}流忌引动命宫三方${hotMonths.some(o => o.pal === '财帛宫' || o.pal === '官禄宫') ? '（含财官，钱与工作的事多留心）' : ''}——这几月节奏放慢、少做不可逆决定`
    : '全年无流忌引动命宫方——节奏平顺的一年，适合把基础打厚';
  block('🌤', `今年运势 · ${year}`,
    `今年你忙【${disp(lp.name).replace('宫','')}】——${GONG_SHORT[disp(lp.name)] || ''}是全年的主旋律`,
    [
      { tag: '顺', cls: 'lu', text: luTo ? `流年${lsh.lu}化禄落【${luTo}】——${GONG_SHORT[luTo] || ''}上有顺风，主动一点能拿到` : '今年流禄未入十二宫主星，顺风在暗处，稳着走' },
      { tag: '卡', cls: 'ji', text: jiTo ? `流年${lsh.ji}化忌落【${jiTo}】——${JI_SOFTSPOT[jiTo] || '这一块要多费心'}（费心≠坏事，是今年的功课）` : '今年没有流忌压宫，节奏偏平——适合蓄力，不适合豪赌' },
      { tag: '放大', cls: '', text: `流年命宫落在本命【${disp(lp.name)}】，主星${lpMajors}——这一宫的主题会被放大一整年` },
      { tag: '逐月', cls: '', html: `<span class="mo-strip">${monthCells.join('')}</span><br>${withTerms(hotLine)}` },
    ],
    [jiTo ? `把${GONG_SHORT[jiTo] || ''}相关的事提前列预案，别等出状况再补` : '平年宜蓄力：把基础打厚，来年好发力', `顺着${GONG_SHORT[luTo] || '顺风'}的方向多走一步，机会是动出来的`],
    null);
  // ② 感情
  const fuq = palaceByName(chart, '夫妻宫');
  const fuqMajors = fuq.stars.filter(x => x.type === 'major');
  const fuqSh = E.getSiHuaByStem(fuq.stem) || {};
  const jiToFuq = fuqSh['忌'] ? chart.palaces.find(pl => pl.stars.some(x => x.name === fuqSh['忌'])) : null;
  const hongLuan = chart.palaces.find(p => p.stars.some(x => x.name === '红鸾' || x.name === '天喜'));
  const fuqYears = wyYearsOf(chart, '夫妻宫').filter(o => o.cmd || o.jiHit);
  block('💜', '感情 · 正缘与剧本',
    fuqMajors.length ? `你的感情剧本：${fuqMajors.map(x => x.name + (x.brightnessRaw ? '【' + x.brightnessRaw + '】' : '')).join('·')}坐守夫妻宫——${fuqMajors.length > 1 ? '双星同宫，感情浓度高' : '这一星定基调'}` : '夫妻宫无主星——感情上没有固定模板，遇什么人、成什么形，选人比努力重要',
    [
      ...(jiToFuq ? [{ tag: '执念', cls: 'ji', text: `夫妻宫${fuqSh['忌']}化忌飞入${disp(jiToFuq.name)}——${flySay(disp(fuq.name), '忌', disp(jiToFuq.name))}` }] : []),
      ...(hongLuan ? [{ tag: '桃花', cls: 'lu', text: `红鸾天喜坐【${disp(hongLuan.name)}】——${GONG_SHORT[disp(hongLuan.name)] || ''}场合最容易遇到对的人` }] : []),
    ],
    ['感情里先把自己调稳，再谈绑定', '重要决定（表白/分手/结婚）别在情绪峰值时做'],
    fuqYears.length ? `流年命宫踩进夫妻宫或引动它的年份：${fuqYears.slice(0, 3).map(o => o.y + (o.cmd ? '（换挡）' : '')).join('、')}——婚恋大事多发生在附近` : null);
  // ③ 财运
  const cai = palaceByName(chart, '财帛宫');
  const caiMajors = cai.stars.filter(x => x.type === 'major');
  const caiSh = E.getSiHuaByStem(cai.stem) || {};
  const jiToCai = caiSh['忌'] ? chart.palaces.find(pl => pl.stars.some(x => x.name === caiSh['忌'])) : null;
  const caiYears = wyYearsOf(chart, '财帛宫');
  const lossYears = caiYears.filter(o => o.jiHit).slice(0, 3), gainYears = caiYears.filter(o => o.luHit).slice(0, 3);
  const caiHua = ['禄','权','科','忌'].filter(h => caiSh[h]).map(h => caiSh[h] + h).join('');
  block('💰', '财运 · 来路与去处',
    caiMajors.length ? `你的来财方式：${caiMajors.map(x => x.name).join('·')}坐财帛——${STAR_GIFT[caiMajors[0].name] ? STAR_GIFT[caiMajors[0].name][0] : '靠本事换钱'}` : '财帛宫无主星——来财方式不固定，多渠道更稳',
    [
      { tag: '模式', cls: '', text: caiHua ? `财帛宫生年四化（${caiHua}）——这四化定你与钱的相处模式` : '财帛宫无生年四化——财上平淡是真，稳字当头' },
      ...(jiToCai ? [{ tag: '流向', cls: 'ji', text: `财帛宫${caiSh['忌']}化忌飞入${disp(jiToCai.name)}——${flySay(disp(cai.name), '忌', disp(jiToCai.name))}` }] : []),
    ],
    ['大额支出先过夜再决定', gainYears.length ? `${gainYears.map(o => o.y).join('、')}年流禄入财——进攻的好年份` : '来财靠积累，别指望暴击'],
    lossYears.length ? `破财预警年（流忌入财帛）：${lossYears.map(o => o.y).join('、')}——大额投入格外谨慎` : null);
  // ④ 事业
  const guan = palaceByName(chart, '官禄宫');
  const guanMajors = guan.stars.filter(x => x.type === 'major');
  const guanGift = guanMajors.length && STAR_GIFT[guanMajors[0].name] ? STAR_GIFT[guanMajors[0].name][1] : '方向感靠试出来，多轮岗多试错';
  const guanYears = wyYearsOf(chart, '官禄宫').filter(o => o.cmd || o.luHit);
  block('🧭', '事业 · 方向与时机',
    guanMajors.length ? `事业底色：${guanMajors.map(x => x.name).join('·')}坐官禄——${guanGift}` : '官禄宫无主星——事业方向不设限，环境造就你',
    [
      { tag: '方向', cls: '', text: guanMajors.length && STAR_GIFT[guanMajors[0].name] ? `天赋指向：${STAR_GIFT[guanMajors[0].name][0]}` : '先在真实项目里试，方向是做出来的不是想出来的' },
      { tag: '今年', cls: 'lu', text: `今年流年命宫进【${disp(lp.name).replace('宫','')}】${disp(lp.name) === '官禄宫' ? '——正踩在事业宫上，是该冲的一年' : '——事业是配菜，今年主线在' + (GONG_SHORT[disp(lp.name)] || '')}` },
    ],
    ['跳槽时机看两点：换挡年（主题切换）＋流禄入官禄——两者重叠的年份最值得动', '能力升级永远不亏：化科/文昌强的人考证比硬跳划算'],
    guanYears.length ? `事业换挡/顺风年：${guanYears.slice(0, 3).map(o => o.y + (o.cmd ? '（换挡）' : '')).join('、')}` : null);
  box.innerHTML =
    blocks.join('') +
    `<p class="hint" style="margin:12px 0 0">以上全部由盘面四化与宫位实算生成：先结论、后依据。命理是概率性描述（约六七成或然律），地图不是导航。</p>`;
}
const LAIYIN_SAY = {
  '命宫':'这一生的主轴是「把自己活明白」：身份、形象、活法，都是从自己开始长出来的',
  '兄弟':'带着同辈的缘分而来：兄弟姐妹、朋友合伙人，是你今生的重要课题与资源',
  '夫妻':'带着感情婚姻的命题而来：亲密关系会深刻塑造你这一生的走向',
  '子女':'带着创造与传承的命题而来：孩子、作品、学生，都是你的延续',
  '财帛':'带着钱与价值的命题而来：赚钱、花钱、价值感，是你反复修的功课',
  '疾厄':'带着身体与习气的命题而来：健康、作息、情绪惯性要多上心',
  '迁移':'带着外部世界的命题而来：远方、变动、大环境，是你一生的舞台',
  '交友':'带着人际圈层的命题而来：众生缘、人脉组织，是你的道场',
  '官禄':'带着事业成就的命题而来：做事、成就、社会位置，是主旋律',
  '田宅':'带着安身立命的命题而来：家、房子、内心的安稳，是此生主线之一',
  '福德':'带着精神世界的命题而来：快乐、爱好、福分深浅，向内求',
  '父母':'带着长辈缘的命题而来：父母、师长、权威与平台，关系一生走向',
}

/* 术语词典：分析句内术语可点解释（痛点：看不懂术语） */
const TERM_DICT = {
  '化禄':'天干给星曜加的「顺风」标记：主资源、机会、来财——飞到哪宫，哪宫得利',
  '化权':'「掌控」标记：主能力、话语权、压力——落在哪宫，哪宫有得拼',
  '化科':'「名声」标记：主贵人、考试、体面——落点常是雪中送炭的力量',
  '化忌':'「功课」标记：主在意、执着、亏欠——不是凶，是你这辈子花心血最多的地方',
  '三方四正':'看任何一个宫，都要把它自己＋对宫＋两个三合宫一起看——四宫合参才作数',
  '大限':'十年运势段，约每十年换一宫——定这十年的大主题',
  '流年':'某一年的运势——大限定调子，流年看动静',
  '流月':'某一年的农历各月细分——看节奏什么时候快什么时候慢',
  '自化':'宫自己的天干又化到本宫的星——能量「漏」出去了，得到的不太守得住',
  '来因宫':'生年天干所在的宫——你「为什么而来」的命题宫，北派立命第一把钥匙',
  '庙旺':'星曜处在能量最强的状态——优点发挥得充分',
  '落陷':'星曜能量最弱的状态——优点打折、短板易冒头',
  '空宫':'宫里没有主星——借对宫的星来看，可塑性强但少主见',
  '命宫':'整张盘的核心：你的性格、活法与人生主轴',
  '身宫':'后天发力点：约35岁后越来越像身宫的样子',
  '五行局':'由命宫干支定的节奏单位（水二局/木三局…），也决定几岁起大限',
  '禄转忌':'飞星技法：A宫化禄→禄星落B宫→B宫干再化忌——看「得到的东西最终代价记在哪」',
  '十神':'八字术语：日主与其他字的生克关系名——比劫/食伤/财星/官杀/印星，代表你的能量分布',
  '日主':'八字日柱的天干——就是「你自己」的五行属性',
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
  '禄':'得到的不太守得住——来得快散得也快，落袋为安最实在',
  '权':'容易自作主张、用力过猛，事后常觉得没必要',
  '科':'习惯报喜不报忧，把体面留在外面，压力自己咽',
  '忌':'自己跟自己较劲——想到就做、不管后果，是漏也是功课',
};
function flySay(fromName, hua, toName){
  const nei = NEI6.includes(toName);
  const A = GONG_SHORT[fromName] || fromName, B = GONG_SHORT[toName] || toName;
  if(fromName === toName) return hua === '忌'
    ? `这份${A}的在意全压在本宫——想放放不下，是这一宫最重的功课`
    : hua === '禄' ? `这份${A}的福气在本宫坐拥——得到不难，守住才见本事` : `这份${A}的能量在本宫自我加强`;
  if(hua === '忌') return nei
    ? `这份${A}的在意，最后落在自己的${B}上——操心是操心，但都记在自己账上，付出有数`
    : `这份${A}的牵挂流向${B}——容易为${B}的人与事费心，付出未必记着回报`;
  if(hua === '禄') return nei
    ? `${A}的福气会流回自己${B}——越经营越顺，机会愿意找你`
    : `${A}的机会撒向${B}——要主动去接，坐等不来`;
  if(hua === '权') return nei
    ? `在${B}这件事上你天生想说了算——是掌控力，也容易用力过猛`
    : `你的${A}会去主导${B}——能量外放，注意分寸`;
  return `在${B}上你习惯留体面、给台阶——贵人和好名声藏在细节里`;
}
function selfSay(palName, hua){
  const A = GONG_SHORT[palName] || palName;
  return `${A}上${SELF_HUA_SAY[hua].split('——')[0]}——${SELF_HUA_SAY[hua].split('——')[1]}`;
}
function renderSihuaPan(){
  const rec = cur();
  const box = $('#sihuapan-body');
  if(!box) return;
  if(!rec){ box.innerHTML = '<div class="empty">先排一张盘，四化盘才有得看。</div>'; return; }
  const chart = rec.chart;
  const yStem = chart.lunarInfo.yearStem;
  const yGan = ST[yStem];
  const ySh = E.getSiHuaByStem(yStem) || {};
  const natal = natalSihuaMap(chart);
  // 来因宫：生年干所落之宫（可能有两个，取先出现的）
  const laiyins = chart.palaces.filter(p => ST[p.stem] === yGan);
  const laiyin = laiyins[0];
  // 生年四化星 → 落宫
  const starPal = {};
  ['禄','权','科','忌'].forEach(h => {
    const p = chart.palaces.find(pl => pl.stars.some(s => s.name === ySh[h]));
    starPal[h] = { star: ySh[h], pal: p ? disp(p.name) : '' };
  });
  // 生年四化落宫图（4x4）
  const order = [5,6,7,8, 4,-1,-1,9, 3,-1,-1,10, 2,1,0,11];
  const bornCells = new Set();
  Object.values(starPal).forEach(v => { if(v.pal) bornCells.add(v.pal); });
  let grid = '', spCenterDone = false;
  order.forEach(b => {
    if(b === -1){
      grid += spCenterDone ? '<div class="cell center-dup"></div>' : hubHTML(chart, rec, 'sihua', ySh);
      spCenterDone = true;
      return;
    }
    const p = palaceByBranch(chart, b);
    const nm = disp(p.name);
    const isBorn = bornCells.has(nm);
    const isLaiyin = laiyin && p.branch === laiyin.branch;
    const tags = (p.isMingGong ? '<span class="tag">命</span>' : '') + (p.isShenGong ? '<span class="tag">身</span>' : '');
    grid += `<div class="cell sp-cell${isBorn ? ' born' : ''}${isLaiyin ? ' laiyin' : ''}" data-branch="${b}">${tags}
      <div class="pname">${nm}${isLaiyin ? '<span class="sp-lai">来因</span>' : ''}</div>
      <div class="gz">${ST[p.stem]}${BR[p.branch]}</div>
      <div class="stars">${p.stars.filter(s => s.type === 'major').map(s =>
        `<span class="star-chip" data-star="${esc(s.name)}">${esc(s.name)}${s.siHua ? shBadge(s.siHua) : ''}</span>`).join('') || '<span class="hint">空宫</span>'}</div>
    </div>`;
  });
  // 宫干四化矩阵（全四化）
  const findPal = star => { const q = chart.palaces.find(pl => pl.stars.some(s => s.name === star)); return q ? disp(q.name).replace('宫','') : '命外'; };
  const matrixRows = chart.palaces.map(p => {
    const sh = E.getSiHuaByStem(p.stem) || {};
    const cell = (star, hua, cls) => star ? `${findPal(star)}<span class="fx-star ${cls || ''}">${star}${hua}</span>` : '—';
    return `<tr><td class="fx-g"><b>${disp(p.name).replace('宫','')}</b><span class="fx-gz">${ST[p.stem]}</span></td>` +
      `<td>${cell(sh['禄'],'禄')}</td><td>${cell(sh['权'],'权','fx-quan')}</td><td>${cell(sh['科'],'科','fx-ke')}</td><td>${cell(sh['忌'],'忌','fx-ji')}</td></tr>`;
  }).join('');
  // 禄转忌链：命宫三方四正默认，展开全部
  const mingP = chart.palaces.find(p => p.isMingGong);
  const coreBranches = sanfangBranches(mingP.branch);
  const shenP = chart.palaces.find(p => p.isShenGong);
  if(shenP && !coreBranches.includes(shenP.branch)) coreBranches.push(shenP.branch);
  const chainOf = p => {
    const sh1 = E.getSiHuaByStem(p.stem) || {};
    const lu = sh1['禄'];
    if(!lu) return null;
    const luPal = chart.palaces.find(pl => pl.stars.some(s => s.name === lu));
    if(!luPal) return null;
    const sh2 = E.getSiHuaByStem(luPal.stem) || {};
    const ji = sh2['忌'];
    const jiPal = ji ? chart.palaces.find(pl => pl.stars.some(s => s.name === ji)) : null;
    const same = jiPal && jiPal.branch === luPal.branch;
    const luName = disp(luPal.name).replace('宫',''), jiName = jiPal ? disp(jiPal.name).replace('宫','') : '';
    const say = same
      ? `福气流向【${luName}】又记在同一处——禄忌同宫，得到与代价绑在一起，拿的时候多留一分清醒`
      : `福气流向【${luName}】（${esc(DX_THEME[disp(luPal.name)] || '')}），而账记在【${jiName}】（${esc(DX_THEME[jiPal ? disp(jiPal.name) : ''] || '')}）`;
    return { from: p, lu, luName, ji, jiName, same, say };
  };
  const chainRow = c => c ? `<div class="chain-row">
      <div class="chain-head"><b>${disp(c.from.name).replace('宫','')}</b><span class="chain-gz">${ST[c.from.stem]}干</span>
        <span class="chain-flow">${esc(c.lu)}禄→${esc(c.luName)}　⇢　${esc(c.ji)}忌→${esc(c.jiName)}</span></div>
      <div class="chain-say">${c.say}</div></div>` : '';
  const coreChains = coreBranches.map(b => chainOf(palaceByBranch(chart, b))).filter(Boolean);
  const allChains = chart.palaces.map(chainOf).filter(Boolean);
  box.innerHTML = `
    <div class="card"><div class="card-kicker">生年四化落宫</div>
      <p class="hint" style="margin:0 0 8px">${yGan}干四化：<b>禄·${starPal['禄'].star}（${starPal['禄'].pal}）</b>｜<b>权·${starPal['权'].star}（${starPal['权'].pal}）</b>｜<b>科·${starPal['科'].star}（${starPal['科'].pal}）</b>｜<b>忌·${starPal['忌'].star}（${starPal['忌'].pal}）</b>——金框宫是四化落点，四化是这张盘的"总开关"。</p>
      <div class="sp-grid">${grid}</div>
    </div>
    <div class="card"><div class="card-kicker">宫位剧本 · 选一宫读它的四化故事</div>
      <div class="scr-chips">${chart.palaces.map(p =>
        `<button class="chip${p.isMingGong ? ' on' : ''}" data-scr="${p.branch}">${disp(p.name).replace('宫','')}</button>`).join('')}</div>
      <div id="scr-body"></div>
    </div>
    <div class="card"><div class="card-kicker">来因宫</div>
      <p style="margin:0 0 6px">你的来因宫是 <b style="color:#D9B36A">${laiyin ? disp(laiyin.name) : ''}（${laiyin ? ST[laiyin.stem] + BR[laiyin.branch] : ''}）</b>——生年${yGan}干落在此宫。</p>
      <p class="p-say" style="margin:0">${esc(LAIYIN_SAY[laiyin ? disp(laiyin.name).replace('宫','') : ''] || '')}。来因宫是北派立命的第一把钥匙：看这一生"为什么而来"，先从来因宫的星曜和它的四化读起。</p>
    </div>
    <div class="card"><div class="card-kicker">宫干四化矩阵 · 十二宫全览</div>
      <details class="chain-more" open><summary>展开 / 收起对照表</summary>
        <table class="fx-table" style="margin-top:8px"><tr><th>宫（干）</th><th>禄</th><th>权</th><th>科</th><th>忌</th></tr>${matrixRows}</table>
      </details>
      <p class="hint" style="margin:8px 0 0">读法：行是"谁在飞"（宫干），格子里是"飞到哪宫、哪颗星"。想看某一宫的完整剧本，用上面的「宫位剧本」。</p>
    </div>
    <div class="card"><div class="card-kicker">禄转忌 · 因果链（命宫三方四正）</div>
      <p class="hint" style="margin:0 0 8px">北派看"得到的背后要还什么"：A 宫化禄→禄星落 B 宫→B 宫干再化忌＝这笔福气的代价记在哪。</p>
      ${coreChains.map(chainRow).join('') || '<p class="hint">这几宫的干未飞禄或禄星未入十二宫，无链可转。</p>'}
      <details class="chain-more"><summary>展开全部十二宫因果链</summary>${allChains.map(chainRow).join('')}</details>
    </div>`;
  const renderScript = b => {
    const p = palaceByBranch(chart, b);
    box.querySelectorAll('.scr-chips .chip').forEach(c => c.classList.toggle('on', +c.dataset.scr === b));
    const name = disp(p.name);
    const sh = E.getSiHuaByStem(p.stem) || {};
    const vds = palaceVerdicts(chart).find(x => x.n === name);
    const rows = [];
    const born = ['禄','权','科','忌'].filter(h => chart.palaces.find(pl2 => pl2.branch === p.branch && pl2.stars.some(st => st.name === ySh[h])));
    if(born.length) rows.push({ tag:'先天', cls:'born', text:`生年${born.map(h => ySh[h] + h).join('、')}坐${name}——${GONG_SHORT[name] || name}是你先天注定要面对的场域，躲不掉；化忌也意味着最深的功课修完最值钱` });
    if(vds) rows.unshift({ tag:'评级', cls: vds.score >= 70 ? 'lu' : vds.score >= 40 ? '' : 'ji', text:`这一宫在你盘里属于「${vds.score >= 70 ? '有底气' : vds.score >= 40 ? '有底色' : '是功课'}」——按主星庙旺＋四化＋辅煞三方合参的相对结构，不判吉凶` });
    if(sh['忌']){ const to = chart.palaces.find(pl => pl.stars.some(st => st.name === sh['忌']));
      if(to) rows.push({ tag:'执念', cls:'ji', text:`${name}的${sh['忌']}化忌飞入${disp(to.name)}——${flySay(name, '忌', disp(to.name))}` }); }
    if(sh['禄']){ const to = chart.palaces.find(pl => pl.stars.some(st => st.name === sh['禄']));
      if(to) rows.push({ tag:'机会', cls:'lu', text:`${name}的${sh['禄']}化禄飞入${disp(to.name)}——${flySay(name, '禄', disp(to.name))}` }); }
    const qk = [];
    if(sh['权']){ const to = chart.palaces.find(pl => pl.stars.some(st => st.name === sh['权'])); if(to) qk.push(`${sh['权']}权→${disp(to.name).replace('宫','')}`); }
    if(sh['科']){ const to = chart.palaces.find(pl => pl.stars.some(st => st.name === sh['科'])); if(to) qk.push(`${sh['科']}科→${disp(to.name).replace('宫','')}`); }
    if(qk.length){ const wTo = chart.palaces.find(pl => pl.stars.some(st => st.name === sh['权']));
      rows.push({ tag:'助力', cls:'', text:`${qk.join('，')}——${flySay(name, '权', disp(wTo.name))}` }); }
    (p.selfSihua || []).forEach(x => rows.push({ tag:'自化', cls:'ji', text:`${name}${x.starName}自化${x.siHua}——${selfSay(name, x.siHua)}` }));
    chart.palaces.forEach(src => {
      if(src.branch === p.branch) return;
      const ssh = E.getSiHuaByStem(src.stem) || {};
      if(ssh['忌'] && p.stars.some(st => st.name === ssh['忌'])){
        rows.push({ tag:'压力', cls:'', text:`${disp(src.name)}的${ssh['忌']}化忌飞进${name}——${GONG_SHORT[disp(src.name)] || ''}上的牵扯，会直接搅动你的${GONG_SHORT[name] || name}` });
      }
    });
    $('#scr-body').innerHTML =
      `<div class="scr-title">${name}<span>${ST[p.stem]}${BR[p.branch]} · ${GONG_SHORT[name] || ''}</span>${vds ? verdictBadge(vds.score) : ''}</div>` +
      rows.map(r => `<div class="scr-row"><span class="scr-tag ${r.cls}">${r.tag}</span><span class="scr-text">${withTerms(r.text)}</span></div>`).join('') +
      `<p class="hint" style="margin:8px 0 0">忌＝在意与功课，不是判决。飞星说的是能量流向，怎么做仍是你的事。</p>`;
  };
  box.addEventListener('click', e => {
    const scr = e.target.closest('[data-scr]');
    if(scr) renderScript(+scr.dataset.scr);
    const t = e.target.closest('[data-year]');
    if(t) jumpToYear(+t.dataset.year);
  });
  renderScript(chart.mingGongBranch);
}

/* ---------- 择日助手：未来 30 天按事项推荐 ---------- */
const ZERI_TYPES = [
  { k:'sign', name:'签约 · 面试', good:['官禄宫','父母宫'], bad:['官禄宫'] },
  { k:'love', name:'告白 · 求婚', good:['夫妻宫','福德宫'], bad:['夫妻宫'] },
  { k:'move', name:'出行 · 搬家', good:['迁移宫','田宅宫'], bad:['迁移宫'] },
  { k:'open', name:'开业 · 启动', good:['官禄宫','财帛宫'], bad:['官禄宫','财帛宫'] },
];
function solarToLunarIn(dateMs, starts){
  const d = new Date(dateMs);
  for(let i = starts.length - 1; i >= 0; i--){
    const diff = Math.floor((d - starts[i]) / 864e5);
    if(diff >= 0){
      const len = i + 1 < starts.length ? Math.floor((starts[i + 1] - starts[i]) / 864e5) : 30;
      if(diff < len) return { lm: i + 1, ld: diff + 1 };
    }
  }
  return null;
}
function renderZeri(){
  const rec = cur();
  const box = $('#zeri-body');
  if(!box) return;
  if(!rec){ box.innerHTML = '<div class="empty">先排一张盘，择日按你的命盘算。</div>'; return; }
  const chart = rec.chart;
  const year = new Date().getFullYear();
  box.innerHTML = '<p class="hint">正在按农历推日…</p>';
  setTimeout(async () => {
    const starts = await lunarMonthStartsAsync(year, p => { box.innerHTML = `<p class="hint">推算农历月界… ${Math.round(p * 100)}%</p>`; });
    if(!starts.length){ box.innerHTML = '<div class="empty">农历数据暂缺，稍后再试。</div>'; return; }
    box.innerHTML = `<select id="zeri-type">${ZERI_TYPES.map(t => `<option value="${t.k}">${t.name}</option>`).join('')}</select><div id="zeri-out"></div>`;
    const sel = box.querySelector('#zeri-type'), out = box.querySelector('#zeri-out');
    const draw = () => {
      const t = ZERI_TYPES.find(x => x.k === sel.value) || ZERI_TYPES[0];
      const goodB = t.good.map(n => palaceByName(chart, n).branch);
      const badB = t.bad.map(n => palaceByName(chart, n).branch);
      const mingB = chart.mingGongBranch;
      const dj = doujunBranch(chart, year);
      const days = [];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      for(let i = 1; i <= 30; i++){
        const dm = +today + i * 864e5;
        const ll = solarToLunarIn(dm, starts);
        if(!ll) continue;
        let sh = null; try{ sh = E.getLiuRiSiHua(year, ll.lm, ll.ld); }catch(e){ sh = null; }
        if(!sh) continue;
        const starPal = k => { const pal = chart.palaces.find(p => p.stars.some(s => s.name === sh[k])); return pal ? pal.branch : -1; };
        let sc = 0; const why = [];
        const luB = starPal('lu');
        if(luB >= 0 && goodB.includes(luB)){ sc += 3; why.push('流日禄入' + t.good[goodB.indexOf(luB)]); }
        const keB = starPal('ke');
        if(keB >= 0 && goodB.includes(keB)){ sc += 1.5; why.push('科入关键宫'); }
        const jiB = starPal('ji');
        if(jiB >= 0 && badB.includes(jiB)){ sc -= 3; why.push('忌落' + t.bad[badB.indexOf(jiB)]); }
        if(jiB >= 0 && jiB === (mingB + 6) % 12){ sc -= 2; why.push('忌冲命宫'); }
        const hl = ((dj + ll.lm - 1 + ll.ld - 1) % 12 + 12) % 12;
        if(goodB.includes(hl)){ sc += 1; why.push('流日命宫行至关键宫'); }
        days.push({ dm: new Date(dm), lm: ll.lm, ld: ll.ld, sc, why: why.slice(0, 2) });
      }
      days.sort((a, b) => b.sc - a.sc);
      const top = days.slice(0, 3), worst = days.slice(-3).filter(d => d.sc < 0).slice(0, 2);
      const fmtD = d => `${d.getMonth() + 1}月${d.getDate()}日`;
      out.innerHTML =
        `<div class="zeri-block"><b class="z-title ok">优先考虑</b>` + top.map(d =>
          `<div class="z-row"><span class="z-date">${fmtD(d.dm)}</span><span class="z-lunar">农历${d.lm}月${d.ld}</span><span class="z-why">${d.why.join('，') || '综合平稳'}</span></div>`).join('') + '</div>' +
        (worst.length ? `<div class="zeri-block"><b class="z-title bad">缓一缓</b>` + worst.map(d =>
          `<div class="z-row"><span class="z-date">${fmtD(d.dm)}</span><span class="z-lunar">农历${d.lm}月${d.ld}</span><span class="z-why">${d.why.join('，') || '杂事多'}</span></div>`).join('') + '</div>' : '') +
        `<p class="hint" style="margin:8px 0 0">按流日四化落入事项相关宫位、忌冲命宫与流日命宫行止打分。择日是挑顺风，不是成败开关。</p>`;
    };
    sel.addEventListener('change', draw);
    draw();
  }, 30);
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
  return { no: '第' + CN_NUM[idx] + '签', ...SIGN_LIB[idx], lvCls: SIGN_LVCls(SIGN_LIB[idx].lv) };
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
  '命宫': '今天是你自己的主场，适合主动推进重要的事',
  '兄弟宫': '今天适合跟朋友、同辈多走动，有人能搭把手',
  '夫妻宫': '今天感情和人际的事会被放大，对人多点耐心',
  '子女宫': '今天适合陪孩子/晚辈，也适合给创意留点时间',
  '财帛宫': '今天和钱有关的事多留一眼，进出都算清楚点',
  '疾厄宫': '今天身体在说话，别硬扛，早点休息不丢人',
  '迁移宫': '今天适合出门、见人、换个环境，动起来有收获',
  '交友宫': '今天人脉有动静，主动组个局、回个人情',
  '官禄宫': '今天正事运在线，最重要的事排在最前面',
  '田宅宫': '今天适合处理家里、房子、家人的事，宜安内',
  '福德宫': '今天给自己留点空白，别把日程排太满',
  '父母宫': '今天适合跟长辈、上级通个气，开口比想的顺',
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
  if(!chart) return null;
  const li = todayLunar(); if(!li || !li.lunarMonth || !li.lunarDay) return null;
  let sh = null;
  try{ sh = normSihua(E.getLiuRiSiHua(li.lunarYear, li.lunarMonth, li.lunarDay)); }catch(e){}
  if(!sh) return null;
  const dj = doujunBranch(chart, li.lunarYear);
  const hl = (((dj + (li.lunarMonth - 1) + (li.lunarDay - 1)) % 12) + 12) % 12;
  const focusP = palaceByBranch(chart, hl);
  const focusName = disp(focusP.name);
  let focusSay = DAILY_FOCUS_SAY[focusName] || '今天这块多分一点注意力';
  if(focusP.isMingGong){
    const ms = focusP.stars.filter(s => s.type === 'major').map(s => s.name).join('、') || '空宫';
    focusSay = `流日命宫回到你的命宫（${ms}坐镇），${DAILY_FOCUS_SAY['命宫']}`;
  }
  const natal = natalSihuaMap(chart);
  const natalJiPal = (natal['忌'] || []).map(e => e.palace);
  const parts = [`今天流日命宫点亮你的【${focusName}】：${focusSay}`];
  const luPal = sh.lu ? sihuaStarPalace(chart, sh.lu) : '';
  const jiPal = sh.ji ? sihuaStarPalace(chart, sh.ji) : '';
  if(luPal) parts.push(`流日化禄在【${luPal}】，这块有小顺风，适合把好事往前推`);
  if(jiPal){
    const dbl = natalJiPal.includes(jiPal) ? '，又和你的本命化忌叠在一处，今天这块别硬扛' : '';
    parts.push(`要留神的是流日化忌在【${jiPal}】${dbl}，慢半拍、留余地`);
  }
  return parts.join('；') + '。';
}
function renderHome(){
  // 每日一签：同盘同日固定一支，明早自动换；有盘附流日小运作"解曰"
  const bd = bjDate();
  const rec = cur();
  const custom = rec ? dailyFortuneFor(rec.chart) : null;
  const key = bd.y*372 + bd.m*31 + bd.d;
  const generic = D.dailyFortunes[key % D.dailyFortunes.length];
  const sign = dailySign(rec);
  $('#daily-kicker').textContent = rec ? `${rec.name}的每日一签` : '每日一签';
  $('#daily-text').innerHTML =
    `<div class="sign-head"><span class="sign-no">${sign.no}</span>` +
    `<span class="sign-lvl ${sign.lvCls}">${sign.lv}</span><span class="sign-title">${esc(sign.t)}</span></div>` +
    `<div class="sign-text">${esc(sign.s)}</div>` +
    `<p class="sign-yi" style="margin:2px 0 6px"><b>宜</b> ${esc(sign.yi)}　<b>提醒</b> ${esc(sign.jie)}</p>` +
    `<p class="hint" style="margin:6px 0 0">解曰：${esc(custom || generic)}</p>`;
  // 今日顺时（地支三合/六合）
  const lh = luckyHoursToday();
  $('#daily-lucky-hours').textContent = lh ? `今日顺时：${lh} ｜ 按日支合气推的顺时，供参考` : '';
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
  // 十二宫预览：有盘则每张小卡填上该盘的主星，没盘保持通用版
  $('#palace-preview').innerHTML = D.palaces.map((p, i) => {
    let starsLine = '';
    if(rec && rec.chart){
      const pl = palaceByName(rec.chart, p.name);
      if(pl){
        const tags = (pl.isMingGong ? '<span class="p-tag sm">命</span>' : '')
          + (pl.isShenGong ? '<span class="p-tag sm">身</span>' : '');
        const majors = pl.stars.filter(s => s.type === 'major');
        const ms = majors.length
          ? majors.map(s => `${esc(s.name)}${s.siHua ? shBadge(s.siHua) : ''}`).join(' ')
          : '<span class="hint">空宫</span>';
        starsLine = `<div class="pv-head"><h4>${p.name}</h4>${tags}</div><div class="pv-stars">${ms}</div>`;
      }
    }
    if(!starsLine) starsLine = `<h4>${p.name}</h4>`;
    return `<div class="palace-card" data-palace="${p.name}"><span class="num">${i+1}</span>${starsLine}`
      + `<div><span class="modern">${p.modern}</span></div><div class="kw">${p.keywords}</div></div>`;
  }).join('');
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
  const card = $('#brief-card'), body = $('#brief-body');
  if(!card) return;
  const li = chart.lunarInfo || {};
  const yGan = ST[li.yearStem];
  const laiyin = chart.palaces.find(p => ST[p.stem] === yGan);
  const ySh = E.getSiHuaByStem(li.yearStem) || {};
  const jiPal = chart.palaces.find(p => p.stars.some(x => x.name === ySh['忌']));
  const jiName = jiPal ? disp(jiPal.name) : '';
  body.innerHTML =
    `<p style="margin:0 0 6px">你带着「<b>${esc(GONG_SHORT[laiyin ? disp(laiyin.name) : ''] || '')}</b>」的命题而来（来因宫${laiyin ? ' ' + ST[laiyin.stem] + BR[laiyin.branch] : ''}）——这一生的主线绕不开它。</p>` +
    (jiName ? `<p style="margin:0">生年<b>${esc(ySh['忌'])}忌</b>落在<b>${esc(jiName)}</b>：${esc(JI_SOFTSPOT[jiName] || '这一块是你这辈子的功课')}。看清它，功课就过了一半。</p>` : '');
  card.hidden = false;
}
/* 右栏页签与折叠记忆 */
function setRGroup(rg){
  $$('#rtabs button').forEach(b => b.classList.toggle('on', b.dataset.rg === rg));
  $$('.chart-right .rgroup').forEach(g => { g.hidden = g.dataset.rg !== rg; });
  store.set('gxg_rtab', rg);
}
function initRightTabs(){
  const bar = $('#rtabs');
  if(!bar || bar.dataset.init) return;
  bar.dataset.init = '1';
  bar.addEventListener('click', e => {
    const b = e.target.closest('button[data-rg]');
    if(b) setRGroup(b.dataset.rg);
  });
  setRGroup(store.get('gxg_rtab', 'overview'));
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
    name: '', gender: segVal('f-gender') || 'male',
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
  ctx.fillText('每日一签 · 问星', W / 2, 130);
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
  ctx.fillText('YOUR PALACE PERSONA · 命宫主星人格', W / 2, 150);
  ctx.strokeStyle = 'rgba(132,146,255,.4)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W / 2 - 200, 186); ctx.lineTo(W / 2 + 200, 186); ctx.stroke();
  const name = majors.length ? majors.map(s => s.name).join(' · ') : '空 宫';
  ctx.fillStyle = '#F5F2EA';
  ctx.font = `900 ${majors.length > 1 ? 150 : 190}px "Songti SC","Noto Serif SC",serif`;
  ctx.shadowColor = 'rgba(7,11,30,.85)'; ctx.shadowBlur = 30;
  ctx.fillText(name, W / 2, 460);
  ctx.shadowBlur = 0;
  // 人设标签（STAR_GIFT 第一条）
  const gift = majors.length && STAR_GIFT[majors[0].name] ? STAR_GIFT[majors[0].name][0] : '没有固定的外在标签——什么环境就长成什么样，可塑性就是你的出厂设置';
  const outer = majors.length && STAR_OUTER[majors[0].name] ? STAR_OUTER[majors[0].name] : '让人捉摸不透，也让人过目不忘';
  ctx.fillStyle = '#DFE3FB'; ctx.font = '600 40px "Songti SC","Noto Serif SC",serif';
  wrapText(ctx, `在外人眼里：${outer}`, W / 2, 640, 780, 66);
  ctx.fillStyle = '#E9DFC8'; ctx.font = '600 38px "Songti SC","Noto Serif SC",serif';
  wrapText(ctx, gift, W / 2, 810, 800, 66);
  ctx.fillStyle = '#7583BD'; ctx.font = '26px "IBM Plex Mono","PingFang SC",monospace';
  ctx.fillText(`${rec.name} · 命宫主星人格卡`, W / 2, 1080);
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

const MENU_ITEMS = [
  { k: 'palaces', t: '十二宫解读', d: '十二宫结合你的命盘，一宫一卡：星曜、四化、干支大限全填上', need: true },
  { k: 'reading', t: '13维深度解读', d: '67.5 万张命盘语料库 · 每盘三万字长解读：性格、事业、感情……共十三维度，关注公众号免费解锁', need: true },
  { k: 'answer', t: '问运 · 今年/感情/财/事业', d: '按你盘面直接回答最常问的四件事：今年忙什么、感情剧本、财来财去、事业时机', need: true },
  { k: 'life', t: '人生全景 · 时间轴', d: '十二层大限全展开：十年成色、限四化流向、逐年明细与 120 年流年热力，点年份直达流年盘', need: true },
  { k: 'sihuapan', t: '四化盘 · 北派飞星', d: '生年四化落宫、来因宫、十二宫干四化矩阵、禄转忌因果链——四化派看盘主线', need: true },
  { k: 'share', t: '生成分享图', d: '命盘图、签文卡，带问星落款，保存发朋友圈', need: true },
];
function renderMenu(){
  const rec = cur();
  const head = rec
    ? `<div class="card" style="margin-bottom:12px"><div class="card-kicker">当前命盘</div><p style="margin:0">${esc(rec.name)} · 命宫${esc(rec.chart.palaces.find(p=>p.isMingGong).stars.filter(s=>s.type==='major').map(s=>s.name).join('、') || '空宫')} · <button class="btn-ghost" data-nav="chart" style="padding:4px 10px">查看命盘 →</button> <button class="btn-ghost" data-nav="archive" style="padding:4px 10px">换一张</button></p></div>`
    : `<div class="card" style="margin-bottom:12px"><div class="card-kicker">先排一张盘</div><p style="margin:0 0 10px">下面的解读都要基于你的命盘，先花 1 分钟排一张。</p><button class="btn-primary" data-nav="input">去排盘 →</button></div>`;
  $('#menu-list').innerHTML = head + MENU_ITEMS.map((m, i) =>
    `<div class="card menu-item" data-menu="${m.k}" style="cursor:pointer;--i:${i}">
       <div style="display:flex;justify-content:space-between;align-items:center">
         <b style="font-size:16px">${m.t}</b><span style="color:var(--muted)">→</span>
       </div>
       <p class="hint" style="margin:6px 0 0">${m.d}</p>
     </div>`
  ).join('');
}
document.addEventListener('click', e => {
  const m = e.target.closest('[data-menu]');
  if(!m) return;
  const k = m.dataset.menu;
  const needChart = (MENU_ITEMS.find(x => x.k === k) || {}).need;
  if(needChart && !cur()){ nav('input'); return; }
  if(k === 'palaces') nav('palaces');
  else if(k === 'answer') nav('answer');
  else if(k === 'life') nav('life');
  else if(k === 'sihuapan') nav('sihuapan');
  else if(k === 'reading') nav('reading');
  else if(k === 'share') openShare('chart');
});

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
wireDisclaimer();
renderHome();
heroEntrance();
initRightTabs();
if(!openSharedChart() && currentId && cur()){ renderChart(); }
if('serviceWorker' in navigator){ addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); }); }
})();
