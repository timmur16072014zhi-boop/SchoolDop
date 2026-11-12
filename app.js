const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uah=n=>Math.round(Number(n))+' ₴';
/* аватарка: перша буква ника на детермінованому кольорі */
const AV=['#FFD60A','#9bd1ff','#8ee3a7','#ffd6a5','#f9a1bc','#c5b3ff','#a7e8d0'];
const hash=s=>[...(s||'')].reduce((a,c)=>a+c.charCodeAt(0),0);
const av=(n,u,prem,big)=>{const c=`av${prem?' prem':''}${big?' big':''}`;return u?`<img class="${c}" src="${esc(u)}" alt="" loading="lazy">`:`<span class="${c}" style="background:${AV[hash(n)%AV.length]}">${esc((n||'?')[0].toUpperCase())}</span>`};
/* кольори статусів */
const COLORS=[{k:'yellow',v:'#FFD60A'},{k:'blue',v:'#9bd1ff'},{k:'green',v:'#8ee3a7'},{k:'orange',v:'#ffd6a5'},{k:'pink',v:'#f9a1bc'},{k:'purple',v:'#c5b3ff'},{k:'mint',v:'#a7e8d0'}];
/* стилі додатку ('' = стандартний жовтий; p:1 — тільки Преміум) */
const ACCENTS=[{k:'',v:'#FFD60A',n:'Жовтий',p:0},{k:'ocean',v:'#7cc4ff',n:'Океан',p:1},{k:'rose',v:'#ff9dbb',n:'Вишня',p:1},{k:'grape',v:'#c5b3ff',n:'Виноград',p:1},{k:'gold',v:'#ffd60a',n:'Золото 👑',p:1},{k:'fire',v:'#fb7185',n:'Вогонь 🔥',p:1}];

/* --- купівля Преміума: оплата адміну -> код -> активація --- */
function premiumModal(){
  const T=[{k:'Тиждень',d:7,p:15},{k:'Місяць',d:30,p:40},{k:'Рік',d:365,p:250}];
  const CARD='5168 7520 2669 2791';
  let ti=1;
  const m=modal(`<h3>Преміум 👑</h3>
  <p class="mut" style="margin-bottom:6px">Що дає Преміум:</p>
  <ul class="rules" style="margin-bottom:4px">
   <li>🥇 Золотий нік і сяйво аватарки скрізь</li>
   <li>📌 Твої замовлення — зверху ленти, у золотій рамці</li>
   <li>🚦 5 активних замовлень замість 3</li>
   <li>🔴 Жива лента — нові замовлення з'являються самі</li>
   <li>🎨 Ексклюзивні стилі: Золото, Вогонь, Океан, Вишня, Виноград</li>
   <li>👑 Корона в рейтингу</li>
  </ul>
  <div class="chips" style="margin:10px 0">${T.map((t,i)=>`<button type="button" class="chip${i===ti?' on':''}" data-pt="${i}">${t.k} · ${t.p} ₴</button>`).join('')}</div>
  <div class="mrules">
   <p><b>1.</b> Оплати <b id="pSum">${T[ti].p} ₴</b> на картку ПриватБанку:</p>
   <div class="code-big" style="font-size:1.3rem;letter-spacing:.05em;padding:9px">${CARD}</div>
   <button class="btn full" id="pCopy">📋 Копіювати картку</button>
   <p style="margin-top:8px">✍️ <b>У коментарі до переказу обов'язково напиши свій нік і клас</b> — так я зрозумію, що це саме ти.</p>
   <p style="margin-top:8px"><b>2.</b> Напиши адміну — код активації прийде <b>протягом 24 годин</b>: <a href="https://t.me/Timmur3477" target="_blank" rel="noopener" style="color:inherit;font-weight:700">@Timmur3477</a></p>
  </div>
  <input id="pcode" maxlength="12" placeholder="XXXXXX" style="text-transform:uppercase;margin:10px 0;text-align:center;font-weight:800;letter-spacing:.25em">
  <div class="mrow"><button class="btn full" id="mOk">Активувати</button><button class="btn alt full" id="mNo">Скасувати</button></div>`);
  m.querySelectorAll('[data-pt]').forEach(b=>b.onclick=()=>{ti=+b.dataset.pt;m.querySelectorAll('[data-pt]').forEach(x=>x.classList.toggle('on',x===b));m.querySelector('#pSum').textContent=T[ti].p+' ₴'});
  m.querySelector('#pCopy').onclick=async()=>{try{await navigator.clipboard.writeText(CARD);toast('Картку скопійовано ✅')}catch(e){toast('Скопіюй вручну: '+CARD)}};
  m.querySelector('#mNo').onclick=()=>m.remove();
  m.querySelector('#mOk').onclick=async()=>{
    const code=m.querySelector('#pcode').value.trim().toUpperCase();
    if(!code)return toast('Введи код');
    const r=await sb.rpc('redeem_premium',{p_code:code});
    if(r.error)return err(r.error);
    m.remove();toast('Преміум активовано 👑');
    const {data:{user}}=await sb.auth.getUser();
    const {data:p}=await sb.from('profiles').select('*').eq('id',user.id).single();
    if(p){me=p;meView()}else render();
  };
}
/* рівні за кількістю виконаних замовлень */
const LVL=[[0,'Новачок'],[3,'Кур’єр'],[7,'Профі'],[15,'Майстер'],[30,'Легенда школи']];
const lvl=d=>LVL.filter(l=>d>=l[0]).pop();
/* досягнення */
const ACH=[
 {i:'🎯',n:'Перша справа',d:'виконати 1 замовлення',ok:s=>s.done>=1},
 {i:'🔥',n:'П’ятірка',d:'виконати 5 замовлень',ok:s=>s.done>=5},
 {i:'🚀',n:'Десятка',d:'виконати 10 замовлень',ok:s=>s.done>=10},
 {i:'⭐',n:'Надійний',d:'рейтинг 4.8+ при 3+ замовленнях',ok:s=>s.done>=3&&Number(s.avg_rating||0)>=4.8},
 {i:'💰',n:'Сотня',d:'заробити 100 ₴',ok:s=>Number(s.earned||0)>=100},
 {i:'🏆',n:'Легенда',d:'виконати 30 замовлень',ok:s=>s.done>=30}];
const IC={feed:'<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',new:'<path d="M5 12h14M12 5v14"/>',mine:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',top:'<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 16 20.24 16 22M18 2H6v7a6 6 0 0 0 12 0z"/>',me:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',admin:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',theme:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'};
const svg=k=>`<svg viewBox="0 0 24 24">${IC[k]}</svg>`;
const FEE=0;
let sb,me=null,tab='feed',authMode='login',adminStudents=[],mineOrders=[],feedFilter='',isPrem=false;

function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2800)}
const err=e=>toast(({bad_invite:'Невірний код запрошення',banned:'Акаунт заблоковано'})[e?.message]||e?.message||'Помилка');
function stagger(){document.querySelectorAll('#view .rv').forEach((el,i)=>el.style.setProperty('--i',Math.min(i,10)))}
function setView(h){$('#view').innerHTML=h;stagger()}

/* --- модальне вікно підтвердження (захист від обману) --- */
function modal(inner){
  const o=document.createElement('div');o.id='modal';
  o.innerHTML=`<div class="mcard rv">${inner}</div>`;
  document.body.appendChild(o);
  o.addEventListener('click',e=>{if(e.target===o)o.remove()});
  return o;
}
function takeModal(id,card){
  const title=card.querySelector('h3')?.textContent||'';
  const fee=Number(card.querySelector('.price')?.dataset?.net||0);
  const m=modal(`<h3>Береш замовлення?</h3>
  <p class="mut">«${esc(title)}» · отримаєш <b>${uah(fee)}</b> готівкою після виконання</p>
  <p class="mut" style="font-size:.85rem;margin-top:6px">Заборонені речі не можна · за обман — бан</p>
  <div class="mrow"><button class="btn full" id="mYes">Так, беру</button><button class="btn alt full" id="mNo">Скасувати</button></div>`);
  m.querySelector('#mNo').onclick=()=>m.remove();
  m.querySelector('#mYes').onclick=async()=>{
    m.remove();
    const r=await sb.rpc('take_order',{oid:+id});
    if(r.error)err(r.error);else toast('Замовлення твоє! Берися до справи 🙂');
    render();
  };
}

/* --- виконавець відмічає виконання секретним кодом передачі --- */
function codeModal(oid){
  const m=modal(`<h3>Ти виконав замовлення? ✅</h3>
  <p class="mut">Введи 4-значний код передачі — його сказав замовник під час отримання.</p>
  <input id="mcode" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="0000" style="text-align:center;font-size:1.8rem;font-weight:900;letter-spacing:.5em;margin:8px 0">
  <div class="mrow"><button class="btn full" id="mOk">Я виконав замовлення</button><button class="btn alt full" id="mNo">Скасувати</button></div>`);
  m.querySelector('#mNo').onclick=()=>m.remove();
  m.querySelector('#mOk').onclick=async()=>{
    const code=m.querySelector('#mcode').value.trim();
    if(!/^\d{4}$/.test(code))return toast('Код — 4 цифри');
    const r=await sb.rpc('mark_done',{oid:+oid,code});
    if(r.error)return err(r.error);
    m.remove();toast('Чекаємо підтвердження від замовника ✅');render();
  };
}

/* --- замовник підтверджує: одна кнопка + зірки за бажанням --- */
function confirmModal(oid){
  let r=5;
  const m=modal(`<h3>Підтвердити замовлення? 🤝</h3>
  <p class="mut">Гроші вже віддав виконавцю особисто — підтверджуй.</p>
  <div class="stars" style="margin:10px 0">${[1,2,3,4,5].map(n=>`<button data-r="${n}" class="${n<=5?'on':''}" aria-label="${n}">★</button>`).join('')}</div>
  <input id="cfrev" maxlength="120" placeholder="Відгук виконавцю (не обов'язково)">
  <div class="mrow"><button class="btn full" id="cfOk">✅ Підтвердити</button><button class="btn alt full" id="cfNo">Ще не отримав</button></div>`);
  m.querySelector('.stars').onclick=e=>{const b=e.target.closest('button[data-r]');if(!b)return;r=+b.dataset.r;m.querySelectorAll('.stars button').forEach(x=>x.classList.toggle('on',+x.dataset.r<=r))};
  m.querySelector('#cfNo').onclick=()=>m.remove();
  m.querySelector('#cfOk').onclick=async()=>{
    const rev=(m.querySelector('#cfrev').value||'').trim().slice(0,120)||null;
    const res=await sb.rpc('finish_order',{oid:+oid,r,rev});
    if(res.error)return err(res.error);
    m.remove();toast('Готово, дякую! 🤝');render();
  };
}

/* --- оплата винагороди: реквізити виконавця + банка адміна для комісії --- */
function payModal(o){
  const m=modal(`<h3>Винагорода виконавцю</h3>
  <p class="mut">«${esc(o.title)}» · виконавець ${esc(o.t?.nick||'—')} має отримати <b>${uah(o.price-o.fee)}</b></p>
  ${o.t?.payout?`<div class="code-big" style="font-size:1.25rem;letter-spacing:0;padding:10px">${esc(o.t.payout)}</div><button class="btn full" id="mCopy">📋 Копіювати реквізити</button>`:`<p class="mut">Виконавець не вказав реквізити для переказу — віддай винагороду готівкою при зустрічі.</p>`}
  <div class="mrow"><button class="btn alt full" id="mNo">Закрити</button></div>`);
  m.querySelector('#mNo').onclick=()=>m.remove();
  if(o.t?.payout)m.querySelector('#mCopy').onclick=async()=>{try{await navigator.clipboard.writeText(o.t.payout);toast('Реквізити скопійовано ✅')}catch(e){toast('Скопіюй вручну: '+o.t.payout)}};
}

/* --- підтримка: телеграм + картка адміна --- */
function supportModal(){
  const CARD='5168 7520 2669 2791';
  const m=modal(`<h3>Підтримка ✈️</h3>
  <p class="mut">Питання, проблеми, спори, оплати — пиши адміну:</p>
  <a class="btn full" style="margin-top:8px;text-align:center;text-decoration:none;display:block" href="https://t.me/Timmur3477" target="_blank" rel="noopener">Telegram @Timmur3477</a>
  <p class="mut" style="margin-top:12px">Оплата Преміума (ПриватБанк):</p>
  <div class="code-big" style="font-size:1.3rem;letter-spacing:.05em;padding:9px">${CARD}</div>
  <button class="btn full" id="sCopy">📋 Копіювати картку</button>
  <div class="mrow"><button class="btn alt full" id="sNo">Закрити</button></div>`);
  m.querySelector('#sCopy').onclick=async()=>{try{await navigator.clipboard.writeText(CARD);toast('Картку скопійовано ✅')}catch(e){toast('Скопіюй вручну: '+CARD)}};
  m.querySelector('#sNo').onclick=()=>m.remove();
}

/* --- баг-репорт / ідея: пишеться прямо в базу, адмін бачить в адмінці --- */
function feedbackModal(){
  let k='idea';
  const m=modal(`<h3>Баг чи ідея? 💬</h3>
  <div class="chips" style="margin:10px 0"><button type="button" class="chip on" data-k="idea">💡 Ідея</button><button type="button" class="chip" data-k="bug">🐞 Баг</button></div>
  <textarea id="fbtxt" rows="4" maxlength="500" placeholder="Напиши детально: що зламалося або що хочеш додати…"></textarea>
  <div class="mrow"><button class="btn full" id="fbOk">Надіслати</button><button class="btn alt full" id="fbNo">Скасувати</button></div>
  <p class="mut" style="margin-top:8px">Термінова проблема (аккаунт, оплата) — одразу пиши адміну: <a href="https://t.me/Timmur3477" target="_blank" rel="noopener" style="color:inherit;font-weight:700">@Timmur3477</a></p>`);
  m.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{k=b.dataset.k;m.querySelectorAll('[data-k]').forEach(x=>x.classList.toggle('on',x===b))});
  m.querySelector('#fbNo').onclick=()=>m.remove();
  m.querySelector('#fbOk').onclick=async()=>{
    const body=(m.querySelector('#fbtxt').value||'').trim();
    if(body.length<5)return toast('Опиши детальніше (від 5 символів)');
    const r=await sb.from('feedback').insert({uid:me.id,kind:k,body});
    if(r.error)return err(r.error);
    m.remove();toast(k==='bug'?'Дякую! Подивлюся найближчим часом 🐞':'Дякую за ідею! 💡');
  };
}

/* --- міні-профіль учня по тапу на ім'я --- */
async function userModal(uid){
  const [lb,pr,rv,ds]=await Promise.all([
    sb.from('leaderboard').select('*').eq('id',uid).maybeSingle(),
    sb.from('profiles').select('nick,avatar,class,status,status_color,premium_until').eq('id',uid).maybeSingle(),
    sb.from('orders').select('review,rating,done_at,c:creator(nick)').eq('taker',uid).not('review','is',null).order('done_at',{ascending:false}).limit(3),
    sb.from('orders').select('done_at').eq('taker',uid).eq('status','done')]);
  const p=pr.data,l=lb.data,st=l||{done:0,earned:0};
  const stk=calcStreak(ds.data||[]);
  const prem=p?.premium_until&&new Date(p.premium_until)>new Date();
  const L=lvl(st.done||0);
  const revs=(rv.data||[]).map(x=>`<p style="margin-top:6px">«${esc(x.review)}» <span class="mut">— ${esc(x.c?.nick||'?')} ${'★'.repeat(x.rating||0)}</span></p>`).join('');
  const m=modal(`<h3>${av(p?.nick||'?',p?.avatar,prem,1)} ${esc(p?.nick||'Учень')}${p?.status?` <span class="lvl st ${p.status_color||'yellow'}">${esc(p.status)}</span>`:''}${prem?' 👑':''}</h3>
  <p class="mut">Клас ${esc(p?.class||'—')} · <span class="lvl">${L[1]}</span>${stk>1?` · <span class="lvl">🔥 ${stk} дн</span>`:''}</p>
  <div class="stat" style="margin-top:10px"><div class="card"><b>${st.done||0}</b>виконано</div><div class="card"><b>${uah(st.earned||0)}</b>зароблено</div><div class="card"><b>${st.avg_rating?Number(st.avg_rating).toFixed(1):'—'}</b>рейтинг</div><div class="card"><b>${ACH.filter(a=>a.ok(st)).length}/${ACH.length}</b>досягнення</div></div>
  ${revs?`<h3 style="margin-top:12px">Відгуки</h3>${revs}`:''}
  <div class="mrow"><button class="btn alt full" id="uNo">Закрити</button></div>`);
  m.querySelector('#uNo').onclick=()=>m.remove();
}

/* --- адмін: видати/зняти/продовжити Преміум --- */
function adminPremModal(x){
  const prem=x.premium_until&&new Date(x.premium_until)>new Date();
  const m=modal(`<h3>Преміум · ${esc(x.nick)}</h3>
  ${prem?`<p class="mut">👑 Активний до ${new Date(x.premium_until).toLocaleDateString('uk-UA')}</p>
  <div class="mrow"><button class="btn bad full" id="apRev">🚫 Забрати Преміум</button></div>
  <p class="mut" style="margin-top:10px">або продовжити на:</p>`:`<p class="mut">Видати Преміум на:</p>`}
  <div class="mrow" style="grid-template-columns:1fr 1fr 1fr"><button class="btn alt" id="ap7">7 дн</button><button class="btn alt" id="ap30">30 дн</button><button class="btn alt" id="ap365">рік</button></div>
  <button class="btn full" id="apC" style="margin-top:8px">Свої дні…</button>
  <div class="mrow"><button class="btn alt full" id="apNo">Закрити</button></div>`);
  const grant=async d=>{const r=await sb.rpc('grant_premium',{uid:x.id,days:d});if(r.error)return err(r.error);m.remove();toast('Преміум видано 👑');render()};
  const q=s=>m.querySelector(s);
  q('#apNo').onclick=()=>m.remove();
  q('#ap7').onclick=()=>grant(7);
  q('#ap30').onclick=()=>grant(30);
  q('#ap365').onclick=()=>grant(365);
  q('#apC').onclick=()=>{const dv=prompt('На скільки днів?','14');if(dv)grant(Math.max(1,+dv||14))};
  if(prem)q('#apRev').onclick=async()=>{const r=await sb.rpc('revoke_premium',{uid:x.id});if(r.error)return err(r.error);m.remove();toast('Преміум знято');render()};
}

/* --- статус від адміна: текст + колір з палітри --- */
function statusModal(x){
  let color=x.status_color||'yellow';
  const m=modal(`<h3>Статус для ${esc(x.nick)}</h3>
  <input id="stTxt" maxlength="24" value="${esc(x.status||'')}" placeholder="наприклад, Перевірений" style="margin:10px 0">
  <div class="swatches">${COLORS.map(c=>`<button type="button" class="sw${color===c.k?' on':''}" data-c="${c.k}" style="background:${c.v}" aria-label="${c.k}"></button>`).join('')}</div>
  <div class="mrow"><button class="btn full" id="mOk">Зберегти</button><button class="btn alt full" id="mNo">Скасувати</button></div>`);
  m.querySelectorAll('.sw').forEach(b=>b.onclick=()=>{color=b.dataset.c;m.querySelectorAll('.sw').forEach(s=>s.classList.toggle('on',s===b))});
  m.querySelector('#mNo').onclick=()=>m.remove();
  m.querySelector('#mOk').onclick=async()=>{
    const txt=m.querySelector('#stTxt').value.trim().slice(0,24)||null;
    const r=await sb.from('profiles').update({status:txt,status_color:txt?color:null}).eq('id',x.id);
    if(r.error)return err(r.error);
    m.remove();toast('Статус оновлено ✅');render();
  };
}

async function boot(){
  $('#themeBtn').innerHTML=svg('theme');
  $('#themeBtn').onclick=()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;try{localStorage.setItem('theme',t)}catch(e){}};
  if(!CFG.SUPABASE_URL||!CFG.SUPABASE_KEY){setView('<div class="card rv"><h3>Потрібно підключити базу</h3><p>Відкрий <b>config.js</b> і встав SUPABASE_URL та SUPABASE_KEY. Інструкція в README.md.</p></div>');return done()}
  sb=supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_KEY);
  const {data:{session}}=await sb.auth.getSession();
  if(session)await enter();else authView();
  sb.channel('orders').on('postgres_changes',{event:'*',schema:'public',table:'orders'},()=>{if(me&&(tab==='feed'||tab==='mine')&&!document.activeElement.matches('input,textarea,select'))render()}).subscribe();
  done()
}
function done(){setTimeout(()=>$('#pre').classList.add('gone'),900)}

/* --- push-повідомлення --- */
const b64url=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function saveSub(s){const {error}=await sb.from('push_subscriptions').upsert({user_id:me.id,sub:s});if(!error)try{localStorage.setItem('pushOn','1')}catch(e){}}
async function enablePush(){
  if(!('PushManager' in window)||!('serviceWorker' in navigator))return toast('Браузер не підтримує повідомлення');
  try{
    const perm=await Notification.requestPermission();
    if(perm!=='granted')return toast('Дозвіл не надано');
    const reg=await navigator.serviceWorker.ready;
    let s=await reg.pushManager.getSubscription();
    if(!s)s=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64url(CFG.VAPID_PUBLIC)});
    await saveSub(s);toast('Повідомлення увімкнено 🔔');
  }catch(e){toast('Не вийшло увімкнути повідомлення')}
}

async function enter(){
  const {data:{user}}=await sb.auth.getUser();
  const {data:p}=await sb.from('profiles').select('*').eq('id',user.id).single();
  if(!p){await sb.auth.signOut();return authView()}
  me=p;
  if(p.banned){
    $('#top').hidden=true;$('#nav').hidden=true;
    setView(`<h1 class="rv">🚫 Акаунт заблоковано</h1>
    <div class="card rv"><p>Твій акаунт заблокував адміністратор за порушення правил.</p>
    <p class="mut" style="margin-top:6px">Вважаєш, що це помилка — напиши адміну:</p>
    <a class="btn full" style="margin-top:10px;text-align:center;text-decoration:none;display:block" href="https://t.me/Timmur3477" target="_blank" rel="noopener">✈️ @Timmur3477</a></div>
    <button class="btn alt full rv" id="lo">Вийти</button>`);
    $('#lo').onclick=async()=>{await sb.auth.signOut();authMode='login';authView()};
    return done();
  }
  $('#top').hidden=false;$('#nav').hidden=false;
  const tabs=[['feed','Замовлення'],['new','Створити'],['mine','Мої'],['top','Рейтинг'],['me','Профіль']];
  if(me.is_admin)tabs.push(['admin','Адмін']);
  $('#nav').innerHTML=tabs.map(([k,l])=>`<button data-t="${k}">${svg(k)}${l}</button>`).join('');
  $('#nav').onclick=e=>{const b=e.target.closest('button');if(b){tab=b.dataset.t;render()}};
  render()
}

function authView(){
  me=null;$('#top').hidden=true;$('#nav').hidden=true;
  const reg=authMode==='reg';
  setView(`<h1 class="rv">${reg?'Реєстрація':'Вхід'}</h1>
  <div class="card rv"><form id="af">
   <label>Email</label><input name="email" type="email" required autocomplete="email">
   <label>Пароль (від 6 символів)</label><input name="password" type="password" minlength="6" required autocomplete="${reg?'new-password':'current-password'}">
   ${reg?`<label>Нік (його побачать усі)</label><input name="nick" minlength="3" maxlength="20" required>
   <label>Клас</label><input name="cls" maxlength="10" placeholder="наприклад, 9-Б" required>
   <label>Код запрошення (запитай у школі)</label><input name="invite" required>
   <label class="chk"><input type="checkbox" required> Я прочитав(ла) правила та зобов’язуюсь їх дотримуватися</label>`:''}
   <button class="btn full" style="margin-top:16px">${reg?'Зареєструватися':'Увійти'}</button>
  </form></div>
  <button class="btn alt full rv" id="sw">${reg?'У мене вже є акаунт':'Створити акаунт'}</button>`);
  $('#sw').onclick=()=>{authMode=reg?'login':'reg';authView()};
  $('#af').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
    const b=e.target.querySelector('button');b.disabled=true;
    const r=reg?await sb.auth.signUp({email:f.email,password:f.password,options:{data:{nick:f.nick,class:f.cls,invite:f.invite}}}):await sb.auth.signInWithPassword({email:f.email,password:f.password});
    b.disabled=false;
    if(r.error)return err(r.error);
    if(!r.data.session)return toast('Підтверди пошту та увійди');
    enter()}
}

function render(){
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));
  ({feed:feedView,new:newView,mine:mineView,top:topView,me:meView,admin:adminView})[tab]();
  window.scrollTo(0,0)
}

const net=p=>p-Math.round(p*FEE)/100;
function orderCard(o,act=''){
  const who=o.c?.nick||'—';
  return `<div class="card rv${o.c?.premium?' prem-card':''}"><div class="row"><h3>${esc(o.title)}</h3><span class="price" data-net="${o.price-o.fee}">${uah(o.price)}</span></div>
  ${o.description?`<p>${esc(o.description)}</p>`:''}
  ${o.due?`<p class="mut" style="margin-top:4px">⏰ ${esc(o.due)}</p>`:''}
  <p class="mut">${o.place?'📍 '+esc(o.place)+' · ':''}від <button class="ulink" data-user="${o.creator||o.c?.id||''}">${av(o.c?.nick,o.c?.avatar,o.c?.premium)}<b class="${o.c?.premium?'gold':''}">${esc(who)}</b></button>${o.c?.status?` <span class="lvl st ${o.c.status_color||'yellow'}">${esc(o.c.status)}</span>`:''}${o.t?.nick?` · бере <button class="ulink" data-user="${o.taker||o.t?.id||''}">${av(o.t.nick,o.t.avatar,o.t.premium)}<b class="${o.t.premium?'gold':''}">${esc(o.t.nick)}</b></button>${o.t.status?` <span class="lvl st ${o.t.status_color||'yellow'}">${esc(o.t.status)}</span>`:''}`:''}</p>
  <div style="margin-top:8px"><span class="tag ${o.status}">${({open:'відкритий',taken:'в роботі',review:'на підтвердженні',done:'виконано',cancelled:'скасовано'})[o.status]}</span></div>${act}</div>`
}
const Q='*, c:creator(id,nick,avatar,status,status_color), t:taker(id,nick,avatar,status,status_color,payout)';
const premMap=async()=>{const {data}=await sb.from('leaderboard').select('id,premium');return Object.fromEntries((data||[]).map(x=>[x.id,x.premium]))};
const tagPrem=(d,pm)=>d.forEach(o=>{if(o.c)o.c.premium=pm[o.creator];if(o.t)o.t.premium=pm[o.taker]});

async function feedView(){
  const [{data,error},pm]=await Promise.all([sb.from('orders').select(Q).eq('status','open').order('created_at',{ascending:false}),premMap()]);
  if(error)return err(error);
  tagPrem(data||[],pm);
  const pushBar=(!('PushManager' in window)||!CFG.VAPID_PUBLIC)?'':(localStorage.getItem('pushOn')?'':`<div class="card pbar rv" id="pushBar"><div class="row"><span>🔔 Повідомлення про нові замовлення?</span><button class="btn" data-push="1">Увімкнути</button></div></div>`);
  const classes=[...new Set(data.map(o=>o.c?.class).filter(Boolean))];
  const chips=classes.length>1?`<div class="chips rv" style="margin-bottom:10px">${['',...classes].map(c=>`<button class="chip${feedFilter===c?' on':''}" data-fc="${c||'all'}">${c?esc(c):'Всі'}</button>`).join('')}</div>`:'';
  const shown=data.filter(o=>!feedFilter||o.c?.class===feedFilter)
    .sort((a,b)=>((b.c?.premium?1:0)-(a.c?.premium?1:0))||0); // замовлення Преміум-учнів — зверху ленти
  setView(`<h1 class="rv">Відкриті замовлення${isPrem?' <span class="mut" style="font-size:.85rem">· 🔴 жива</span>':''}</h1>${pushBar}${chips}`+(shown.length?shown.map(o=>orderCard(o,o.creator===me.id?`<button class="btn alt full" style="margin-top:10px" data-c="${o.id}">Скасувати моє замовлення</button>`:`<button class="btn full" style="margin-top:10px" data-take="${o.id}">Взяти замовлення</button>`)).join(''):'<div class="empty rv">Поки замовлень немає.<br>Створи перше!</div>'));
  bindActions();
  // Преміум: жива лента — сама підхоплює нові замовлення кожні 15 секунд
  clearTimeout(feedTimer);
  if(isPrem)feedTimer=setTimeout(feedView,15000);
}
let feedTimer=0;
function bindActions(){
  $('#view').onclick=async e=>{const b=e.target.closest('button');if(!b)return;
    const d=b.dataset;let r;
    if(d.take){return takeModal(d.take,b.closest('.card'))}
    else if(d.push){return enablePush()}
    else if(d.user){return userModal(d.user)}
    else if(d.release){if(!confirm('Відмовитися від замовлення? Воно повернеться в ленту.'))return;r=await sb.rpc('release_order',{oid:+d.release});if(!r.error)toast('Замовлення повернено в ленту')}
    else if(d.fc!==undefined){feedFilter=d.fc==='all'?'':d.fc;feedView();return}
    else if(d.due){const i=$('#nf [name=due]');if(i)i.value=d.due;return}
    else if(d.c){if(!confirm('Скасувати замовлення?'))return;r=await sb.rpc('cancel_order',{oid:+d.c})}
    else if(d.cf){return confirmModal(d.cf)}
    else if(d.mdone){return codeModal(d.mdone)}
    else if(d.rep){const why=prompt('Що сталося?');if(!why)return;r=await sb.from('reports').insert({order_id:+d.rep,reason:why.slice(0,300)});if(!r.error)toast('Скаргу надіслано')}
    else if(d.ban){r=await sb.from('profiles').update({banned:d.ban==='1'}).eq('id',d.id)}
    else if(d.del){if(!confirm('Видалити замовлення?'))return;r=await sb.from('orders').delete().eq('id',+d.del)}
    else if(d.place){const i=$('#nf [name=place]');if(i)i.value=d.place;return}
    else if(d.delshop){r=await sb.from('shops').delete().eq('id',+d.delshop)}
    else if(d.delfb){r=await sb.from('feedback').delete().eq('id',+d.delfb)}
    else if(d.status){const x=adminStudents.find(p=>p.id===d.id);if(x)return statusModal(x);return}
    else if(d.prem){const x=adminStudents.find(p=>p.id===d.id);if(x)return adminPremModal(x);return}
    else if(d.delcode){r=await sb.from('premium_codes').delete().eq('code',d.delcode)}
    else if(d.pay){const o=mineOrders.find(x=>x.id===+d.pay);if(o)return payModal(o);return}
    else return;
    if(r.error)err(r.error);render()}
}

function newView(){
  sb.from('shops').select('*').order('id').then(({data:shops})=>{
    if(!shops?.length)return;
    const ch=document.createElement('div');ch.className='chips rv';
    ch.innerHTML=`<span class="mut">Де брати:</span>`+shops.map(s=>`<button type="button" class="chip" data-place="${esc(s.name)}">${esc(s.emoji)} ${esc(s.name)}</button>`).join('');
    const lbl=[...document.querySelectorAll('#nf label')].find(l=>l.textContent.includes('Куди'));
    if(lbl)lbl.parentNode.insertBefore(ch,lbl);
  });
  setView(`<h1 class="rv">Нове замовлення</h1><div class="card rv"><form id="nf">
  <label>Що потрібно зробити</label><input name="title" minlength="3" maxlength="80" required placeholder="Принести піцу в 9-Б">
  <label>Подробиці</label><textarea name="description" rows="3" maxlength="500"></textarea>
  <label>Куди / де</label><input name="place" maxlength="80" placeholder="Кабінет 204">
  <div class="chips" style="margin:8px 0 2px">${['На 1-й перерві','До обіду','До кінця дня','До завтра'].map(t=>`<button type="button" class="chip" data-due="${t}">⏰ ${t}</button>`).join('')}</div>
  <label>Коли потрібно (не обов'язково)</label><input name="due" maxlength="40" placeholder="Наприклад: до 3-ї перемени">
  <label>Винагорода виконавцю, ₴ (10–1000)</label><input name="price" type="number" min="10" max="1000" required>
  <button class="btn full" style="margin-top:14px">Опублікувати</button></form></div>
  <p class="mut rv">Оплата готівкою після виконання. Правила — у профілі.</p>`);
  const f=$('#nf');
  f.onsubmit=async e=>{e.preventDefault();const v=Object.fromEntries(new FormData(f));v.price=+v.price;v.due=(v.due||'').trim().slice(0,40)||null;
    const {data,error}=await sb.from('orders').insert({title:v.title,description:v.description,place:v.place,due:v.due,price:v.price}).select().single();if(error)return err(error);
    const {data:c}=await sb.from('order_codes').select('code').eq('order_id',data.id).single();
    tab='mine';
    const m=modal(`<h3>Замовлення опубліковано ✅</h3>
    <p class="mut">Код передачі — скажи його виконавцю вголос, коли віддаси замовлення. Він введе цей код, щоб відмітити виконання.</p>
    <div class="code-big">${esc(c?.code||'')}</div>
    <p class="mut" style="margin-top:8px">Після передачі винагороди натисни «Підтвердити» в «Моїх замовленнях».</p>
    <div class="mrow"><button class="btn full" id="mOk">Зрозуміло</button></div>`);
    m.querySelector('#mOk').onclick=()=>{m.remove();render()}}
}

async function mineView(){
  const [{data,error},pm]=await Promise.all([sb.from('orders').select(Q).or(`creator.eq.${me.id},taker.eq.${me.id}`).order('created_at',{ascending:false}),premMap()]);
  if(error)return err(error);
  tagPrem(data||[],pm);
  const mk=o=>{let a='';
    if(o.creator===me.id&&o.status==='taken')a=`<p class="mut" style="margin-top:8px">⏳ Виконується…</p>`;
    if(o.creator===me.id&&o.status==='review')a=`<button class="btn full" style="margin-top:10px" data-cf="${o.id}">✅ Підтвердити виконання</button><p class="mut" style="margin-top:6px">Після передачі винагороди особисто.</p>`;
    if(o.creator===me.id&&o.status==='open')a=`<button class="btn alt full" style="margin-top:10px" data-c="${o.id}">Скасувати</button>`;
    if(o.taker===me.id&&o.status==='taken')a=`<button class="btn full" style="margin-top:10px" data-mdone="${o.id}">Я виконав замовлення</button><button class="btn alt full" style="margin-top:8px" data-release="${o.id}">↩️ Відмовитися</button>`;
    if(o.status==='taken'||o.status==='review')a+=`<button class="btn alt full" style="margin-top:8px" data-rep="${o.id}">Поскаржитися</button>`;
    if(o.status==='done'&&o.rating)a=`<p class="mut" style="margin-top:6px">Оцінка: ${'★'.repeat(o.rating)}${o.review?` · «${esc(o.review)}»`:''}</p>`;
    return orderCard(o,a)};
  const mine=data.filter(o=>o.creator===me.id),took=data.filter(o=>o.taker===me.id);
  mineOrders=data;
  setView(`<button class="btn alt" id="bkMe" style="margin-bottom:12px">← Профіль</button><h1 class="rv">Мої замовлення</h1><h2 class="rv">Я замовив</h2>${mine.map(mk).join('')||'<p class="empty rv">Порожньо</p>'}<h2 class="rv">Я виконую</h2>${took.map(mk).join('')||'<p class="empty rv">Порожньо</p>'}`);
  $('#bkMe').onclick=()=>{tab='me';render()};
  bindActions()
}

async function topView(){
  const [lb,wo]=await Promise.all([
    sb.from('leaderboard').select('*').gt('done',0).order('avg_rating',{ascending:false}).order('done',{ascending:false}).limit(30),
    sb.from('orders').select('price,taker,t:taker(nick,avatar)').eq('status','done').gte('done_at',mondayKyiv())]);
  const {data,error}=lb;if(error)return err(error);
  const wk={};(wo.data||[]).forEach(o=>{if(!o.taker)return;wk[o.taker]=wk[o.taker]||{nick:o.t?.nick||'?',avatar:o.t?.avatar,sum:0};wk[o.taker].sum+=Number(o.price)});
  const premOf=id=>data.find(x=>x.id===id)?.premium||false;
  const top=Object.entries(wk).map(([id,v])=>({id,...v})).sort((a,b)=>b.sum-a.sum).slice(0,3);
  const weekHtml=top.length?`<div class="card rv" style="border-color:color-mix(in srgb,var(--y) 45%,var(--line))"><h3>⚡ Топ тижня</h3>${top.map((u,i)=>{const p=premOf(u.id);return `<div class="row" style="margin-top:8px">${['🥇','🥈','🥉'][i]} ${av(u.nick,u.avatar,p)}<b class="${p?'gold':''}">${esc(u.nick)}</b>${i===0?' 👑':''}<span class="price" style="font-size:.95rem">${uah(u.sum)}</span></div>`}).join('')}<p class="mut" style="margin-top:8px">Зароблено з понеділка. Лідер тижня — легенда перерви 😎</p></div>`:'';
  setView(`<h1 class="rv">Рейтинг</h1>${weekHtml}`+(data.length?data.map((u,i)=>{const L=lvl(u.done),m=i<3?['🥇','🥈','🥉'][i]+' ':'';
    return `<div class="card rv"><div class="row"><h3>${i+1}. ${m}${av(u.nick,u.avatar,u.premium)}<b class="${u.premium?'gold':''}">${esc(u.nick)}</b>${u.premium?' 👑':''}${u.status?` <span class="lvl st ${u.status_color||'yellow'}">${esc(u.status)}</span>`:''}</h3><span class="price">★ ${Number(u.avg_rating||0).toFixed(1)}</span></div><p class="mut"><span class="lvl">${L[1]}</span> · виконано замовлень: ${u.done} · зароблено ${uah(u.earned)}</p></div>`}).join(''):'<div class="empty rv">Рейтинг з’явиться після перших виконаних замовлень.</div>'))
}
/* початок поточного тижня (понеділок, Київ) */
function mondayKyiv(){
  const s=new Date().toLocaleDateString('sv',{timeZone:'Europe/Kyiv'});
  const k=new Date(s+'T00:00:00');
  k.setDate(k.getDate()-((k.getDay()+6)%7));
  return k.toISOString().slice(0,10)+'T00:00:00';
}

/* стрик: підряд робочі дні з виконаними замовленнями; вихідні не рахуються і не ламають */
function calcStreak(rows){
  const tz='Europe/Kyiv',fmt=d=>d.toLocaleDateString('sv',{timeZone:tz});
  const set=new Set(rows.map(r=>fmt(new Date(r.done_at))));
  let d=new Date(),n=0;
  const w0=d.getDay();if(w0>0&&w0<6&&!set.has(fmt(d)))d.setDate(d.getDate()-1);
  for(let i=0;i<400;i++){const w=d.getDay();
    if(w===0||w===6){d.setDate(d.getDate()-1);continue}
    if(set.has(fmt(d))){n++;d.setDate(d.getDate()-1)}else break}
  return n;
}
async function meView(){
  const {data:s}=await sb.from('leaderboard').select('*').eq('id',me.id).single();
  const st=s||{done:0,earned:0,fee_total:0},L=lvl(st.done),nx=LVL[LVL.indexOf(L)+1];
  const prog=nx?`${L[1]} · ${st.done}/${nx[0]} до «${nx[1]}»`:`${L[1]} — максимум!`;
  const pu=me.premium_until?new Date(me.premium_until):null;isPrem=!!(pu&&pu>new Date());
  const {data:ds}=await sb.from('orders').select('done_at').eq('taker',me.id).eq('status','done');
  const stk=calcStreak(ds||[]);
  const cur=document.documentElement.dataset.accent||'';
  setView(`<h1 class="rv">${av(me.nick,me.avatar,isPrem,1)} ${esc(me.nick)}${me.status?` <span class="lvl st ${me.status_color||'yellow'}">${esc(me.status)}</span>`:''}</h1><p class="mut rv">Клас ${esc(me.class||'—')} · <span class="lvl">${prog}</span>${stk>1?` · <span class="lvl">🔥 ${stk} дн</span>`:''}${isPrem?' 👑':''}</p>
  <div class="stat rv" style="margin-top:12px"><div class="card"><b>${st.done||0}</b>виконано</div><div class="card"><b>${uah(st.earned||0)}</b>зароблено</div><div class="card"><b>${st.avg_rating?Number(st.avg_rating).toFixed(1):'—'}</b>рейтинг</div><div class="card"><b>${ACH.filter(a=>a.ok(st)).length}/${ACH.length}</b>досягнення</div></div>
  <div class="row rv" style="margin-top:12px;gap:8px"><button class="btn" style="flex:1" id="goMine">📦 Мої замовлення</button><button class="btn alt" style="flex:1" id="goTop">🏆 Рейтинг</button></div>  <div class="row rv" style="margin-top:8px;gap:8px"><label class="btn alt" style="flex:1;text-align:center">📷 Аватарка<input id="avf" type="file" accept="image/*" hidden></label><button class="btn alt" style="flex:1" id="sup">✈️ Підтримка</button></div>
  <button class="btn alt full rv" id="fbk" style="margin-top:8px">💬 Баг чи ідея — повідомити адміна</button>
  ${isPrem?`<p class="mut rv" style="margin-top:10px">👑 Преміум активний до ${pu.toLocaleDateString('uk-UA')}</p>`:`<button class="btn full rv" id="buyP" style="margin-top:8px">👑 Купити Преміум — стилі та бонуси</button>`}
  <details class="sec rv"><summary>⚙️ Реквізити та стиль</summary>
   <form id="pf"><label>Картка або тег для переказу (побачить замовник)</label><input name="payout" maxlength="40" value="${esc(me.payout||'')}" placeholder="4441 1111 2222 3333 або @nick"><button class="btn full" style="margin-top:10px">Зберегти</button></form>
   <div class="swatches" id="acc" style="margin-top:14px">${ACCENTS.map(a=>`<button class="sw${cur===a.k?' on':''}" data-acc="${a.k}" style="background:${a.v}" title="${a.n}${a.p&&!isPrem?' 🔒':''}">${a.p&&!isPrem?'🔒':''}</button>`).join('')}</div>
  </details>
  <details class="sec rv"><summary>🏆 Досягнення</summary><div class="ach" style="margin-top:10px">${ACH.map(a=>`<div class="badge${a.ok(st)?' on':''}" title="${a.d}">${a.ok(st)?a.i:'🔒'}<span>${a.n}</span></div>`).join('')}</div></details>
  <details class="sec rv"><summary>📜 Правила</summary><ul class="rules" style="margin-top:10px"><li>Можна: їжу з буфету та з магазинів зі списку, забуті речі, дрібні доручення.</li><li>Не можна: вейпи, алкоголь, енергетики, ліки.</li><li>Не можна: чужі домашки, контрольні, завдання проти інших.</li><li>Не можна: булінг, обман. Порушників — бан.</li><li>Їжа в класі — тільки з дозволу вчителя.</li></ul></details>
  <button class="btn alt full rv" id="lo">Вийти</button>`);
  if($('#buyP'))$('#buyP').onclick=premiumModal;
  $('#sup').onclick=supportModal;
  $('#fbk').onclick=feedbackModal;
  $('#goMine').onclick=()=>{tab='mine';render()};
  $('#goTop').onclick=()=>{tab='top';render()};
  $('#acc').onclick=e=>{const b=e.target.closest('.sw');if(!b)return;
    const a=ACCENTS.find(x=>x.k===b.dataset.acc);
    if(a.p&&!isPrem)return toast('Цей стиль — тільки для Преміум 👑');
    document.documentElement.dataset.accent=b.dataset.acc;
    try{localStorage.setItem('accent',b.dataset.acc)}catch(e){}
    meView()};
  $('#lo').onclick=async()=>{if(!confirm('Точно вийти з акаунта?'))return;await sb.auth.signOut();authMode='login';authView()}
  $('#pf').onsubmit=async e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.target));
    const p=(v.payout||'').trim().slice(0,40)||null;
    const r=await sb.from('profiles').update({payout:p}).eq('id',me.id);
    if(r.error)return err(r.error);
    me.payout=p;meView();toast(p?'Реквізити збережено ✅':'Реквізити очищено')};
  $('#avf').onchange=e=>{const f=e.target.files[0];if(!f)return;
    const img=new Image();
    img.onload=async()=>{
      try{
        const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
        const s=Math.min(img.width,img.height);
        x.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,128,128);
        const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.85));
        const path=me.id+'/avatar.jpg';
        const up=await sb.storage.from('avatars').upload(path,blob,{upsert:true,contentType:'image/jpeg'});
        if(up.error)return err(up.error);
        const {data:{publicUrl}}=sb.storage.from('avatars').getPublicUrl(path);
        const {error:ue}=await sb.from('profiles').update({avatar:publicUrl+'?v='+Date.now()}).eq('id',me.id);
        if(ue)return err(ue);
        me.avatar=publicUrl+'?v='+Date.now();meView();toast('Аватарку оновлено ✅');
      }catch(ex){toast('Не вдалося обробити фото')}
    };
    img.onerror=()=>toast('Не вдалося відкрити фото');
    img.src=URL.createObjectURL(f);
  }
}

async function adminView(){
  const [o,ps,lb,r,cd,sh,fb]=await Promise.all([sb.from('orders').select(Q).order('created_at',{ascending:false}).limit(30),sb.from('profiles').select('id,nick,avatar,status,status_color,premium_until,class,banned').order('nick'),sb.from('leaderboard').select('id,done,earned,fee_total,premium'),sb.from('reports').select('*, f:from_user(nick)').order('created_at',{ascending:false}).limit(20),sb.from('premium_codes').select('code,days,used_by,used_at,u:used_by(nick)'),sb.from('shops').select('*').order('id'),sb.from('feedback').select('*, u:uid(nick)').order('created_at',{ascending:false}).limit(30)]);
  const st=Object.fromEntries((lb.data||[]).map(x=>[x.id,x]));
  const pm=Object.fromEntries((lb.data||[]).map(x=>[x.id,x.premium]));
  const u={data:(ps.data||[]).map(x=>({...x,done:st[x.id]?.done||0,fee_total:st[x.id]?.fee_total||0}))};
  adminStudents=u.data;
  const all=o.data||[];tagPrem(all,pm);
  setView(`<h1 class="rv">Адмін-панель</h1><div class="stat rv"><div class="card"><b>${all.length}</b>замовлень (останні)</div><div class="card"><b>${u.data.length}</b>учнів</div></div>
  <h2 class="rv">Баги та ідеї 💬</h2>${(fb.data||[]).map(x=>`<div class="card rv"><p>${x.kind==='bug'?'🐞':'💡'} ${esc(x.body)}</p><p class="mut">від ${esc(x.u?.nick||'?')} · ${new Date(x.created_at).toLocaleDateString('uk-UA')} <button class="x" data-delfb="${x.id}" aria-label="Видалити">✕</button></p></div>`).join('')||'<p class="empty rv">Немає — або тихо, або всі все влаштовує 😌</p>'}
  <h2 class="rv">Скарги</h2>${(r.data||[]).map(x=>`<div class="card rv"><p>${esc(x.reason)}</p><p class="mut">замовлення #${x.order_id} · від ${esc(x.f?.nick)}</p></div>`).join('')||'<p class="empty rv">Немає</p>'}
  <h2 class="rv">Магазини</h2><div class="card rv"><form id="sf" class="row" style="gap:8px"><input name="name" maxlength="40" minlength="2" placeholder="Назва магазину" required style="flex:1"><input name="emoji" maxlength="2" placeholder="🏪" style="width:64px"><button class="btn">Додати</button></form>
  <div class="chips" style="margin-top:10px">${(sh.data||[]).map(s=>`<span class="chip">${esc(s.emoji)} ${esc(s.name)} <button class="x" data-delshop="${s.id}" aria-label="Видалити">✕</button></span>`).join('')||'<span class="mut">Порожньо</span>'}</div></div>
  <h2 class="rv">Преміум-коди</h2><div class="card rv"><button class="btn full" id="genCode">🎁 Створити код</button>
  <div class="chips" style="margin-top:10px">${(cd.data||[]).map(c=>`<span class="chip"><b>${esc(c.code)}</b> · ${c.days} дн · ${c.used_by?'видано: '+esc(c.u?.nick||''):'вільний'}${!c.used_by?` <button class="x" data-delcode="${esc(c.code)}" aria-label="Видалити">✕</button>`:''}</span>`).join('')||'<span class="mut">Кодів ще немає</span>'}</div></div>
  <h2 class="rv">Учні</h2>${(u.data||[]).map(x=>{const prem=x.premium_until&&new Date(x.premium_until)>new Date();
    return `<div class="card rv"><div class="row"><div>${av(x.nick,x.avatar,prem)}<b>${esc(x.nick)}</b>${prem?` 👑 <span class="mut">до ${new Date(x.premium_until).toLocaleDateString('uk-UA')}</span>`:''} <span class="mut">${esc(x.class||'')}</span>${x.status?` <span class="lvl st ${x.status_color||'yellow'}">${esc(x.status)}</span>`:''}<p class="mut">виконав ${x.done} · комісія до сплати ${uah(x.fee_total)}</p></div><div class="row" style="gap:6px"><button class="btn alt" data-status="1" data-id="${x.id}" title="Статус">🏷️</button><button class="btn ${prem?'':'alt'}" data-prem="1" data-id="${x.id}" title="Видати Преміум">👑</button><button class="btn ${x.banned?'alt':'bad'}" data-ban="${x.banned?0:1}" data-id="${x.id}">${x.banned?'Розбанити':'Забанити'}</button></div></div></div>`}).join('')}
  <h2 class="rv">Замовлення</h2>${all.map(x=>orderCard(x,`<button class="btn bad full" style="margin-top:10px" data-del="${x.id}">Видалити</button>`)).join('')}`);
  bindActions();
  $('#sf').onsubmit=async e=>{e.preventDefault();const f=e.target,v=Object.fromEntries(new FormData(f));
    const {error}=await sb.from('shops').insert({name:v.name.trim(),emoji:v.emoji?.trim()||'🏪'});
    if(error)return err(error);adminView()};
  $('#genCode').onclick=async()=>{
    const dv=prompt('На скільки днів видає цей код?','30');if(!dv)return;
    const {data:code,error}=await sb.rpc('gen_premium_code',{days:Math.max(1,+dv||30)});
    if(error)return err(error);
    toast('Код створено: '+code);adminView()}
}
boot();
