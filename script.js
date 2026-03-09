// ═══════════════════════════════════════
// PAGE ROUTER
// ═══════════════════════════════════════
let currentPage = 'auth';
let currentBooking = {};
let tempBookings = [], bookingCounter = 0;
let searchResultDest = null;
let activePayMethod = 'upi';
let selectedAppleIdx = 0;
let captchaChecked = true;

function goTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  currentPage = page;
  window.scrollTo(0,0);
  const nav = document.getElementById('mainNav');
  nav.style.display = page === 'auth' ? 'none' : 'flex';
  document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === page));
  if(page === 'pkg') renderPkgGrid(packages);
  if(page === 'pay') setupPayPage();
  if(page === 'conf') setupConfPage();
}

// ═══════════════════════════════════════
// AUTH
// ═══════════════════════════════════════
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((b,i) => b.classList.toggle('active', (i===0&&tab==='signup')||(i===1&&tab==='login')));
  document.getElementById('auth-signup').classList.toggle('active', tab==='signup');
  document.getElementById('auth-login').classList.toggle('active', tab==='login');
  captchaChecked = true;
  document.querySelectorAll('.ferr').forEach(e=>e.classList.remove('show'));
  document.querySelectorAll('.finvalid').forEach(e=>e.classList.remove('finvalid'));
  document.querySelectorAll('.fvalid').forEach(e=>e.classList.remove('fvalid'));
  const _ab = document.getElementById('authErrBanner'); if(_ab) _ab.style.display='none';
}

function vf(id, type, force) {
  const el = document.getElementById(id);
  if(!el) return false;
  const err = document.getElementById('ferr-' + id);
  const val = el.value;
  const trimmed = val.trim();
  const empty = trimmed.length === 0;
  let valid = false;
  if(type==='name')     valid = trimmed.length >= 2;
  else if(type==='email')    valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  else if(type==='password') valid = val.length >= 8;
  else if(type==='req')      valid = trimmed.length > 0;
  const showErr = !valid && (force || val.length > 0);
  el.classList.toggle('finvalid', showErr);
  el.classList.toggle('fvalid', valid);
  if(err) {
    if(showErr) {
      if(empty) {
        if(type==='name')          err.textContent = '⚠️ Please enter your full name.';
        else if(type==='email')    err.textContent = '⚠️ Please enter your email address.';
        else if(type==='password') err.textContent = '⚠️ Please enter a password (min. 8 characters).';
        else                       err.textContent = '⚠️ This field is required.';
      } else {
        if(type==='email')         err.textContent = '⚠️ Please enter a valid email (e.g. you@example.com).';
        else if(type==='password') err.textContent = '⚠️ Password must be at least 8 characters.';
        else                       err.textContent = '⚠️ Please check this field.';
      }
    }
    err.classList.toggle('show', showErr);
  }
  return valid;
}

function shakeEl(el) {
  if(!el) return;
  el.style.animation = 'none';
  void el.offsetHeight;
  el.style.animation = 'wlShake 0.45s ease';
}

function checkStrength() {
  const p = document.getElementById('su-pass').value;
  const wrap = document.getElementById('strengthWrap');
  const fill = document.getElementById('strengthFill');
  const lbl = document.getElementById('strengthLabel');
  if(!p){wrap.classList.remove('show');return}
  wrap.classList.add('show');
  let s=0; if(p.length>=8)s++; if(/[A-Z]/.test(p))s++; if(/[0-9]/.test(p))s++; if(/[^A-Za-z0-9]/.test(p))s++;
  const lbls=['','Weak','Fair','Strong','Very Strong'];
  const cols=['','#e74c3c','#f39c12','#3498db','#2ecc71'];
  fill.style.width=(s*25)+'%'; fill.style.background=cols[s]||'#e74c3c';
  lbl.style.color=cols[s]||'#e74c3c'; lbl.textContent='Strength: '+(lbls[s]||'Weak');
}

function togglePw(id, btn) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
  btn.style.color = el.type === 'text' ? 'var(--gold)' : 'var(--muted)';
}

function toggleCaptcha() { captchaChecked = true; }

function showAuthErr(msg) {
  const b = document.getElementById('authErrBanner');
  if(!b) return;
  document.getElementById('authErrMsg').textContent = msg;
  b.style.display = 'flex';
  clearTimeout(window._authErrTimer);
  window._authErrTimer = setTimeout(()=>{ b.style.display='none'; }, 4500);
}

function doSignup() {
  const n = vf('su-name',  'name',     true);
  const e = vf('su-email', 'email',    true);
  const p = vf('su-pass',  'password', true);
  if(!n) shakeEl(document.getElementById('su-name'));
  if(!e) shakeEl(document.getElementById('su-email'));
  if(!p) shakeEl(document.getElementById('su-pass'));
  if(!n || !e || !p) {
    const missing = [];
    if(!n) missing.push('Full Name');
    if(!e) missing.push('Email Address');
    if(!p) missing.push('Password (min. 8 chars)');
    showAuthErr('Please fill in: ' + missing.join(', '));
    return;
  }
  const name  = document.getElementById('su-name').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const btn = document.getElementById('signupBtn');
  if(btn){ btn.textContent='✓ Creating Account…'; btn.disabled=true; }
  setTimeout(() => {
    try {
      const users = JSON.parse(localStorage.getItem('wl_users')||'[]');
      if(!users.find(u=>u.email===email))
        users.push({name, email, joinedAt:new Date().toISOString(), trips:0, spent:0});
      localStorage.setItem('wl_users', JSON.stringify(users));
    } catch(ex){}
    setUser(name, email);
    if(btn){ btn.textContent='Create Account'; btn.disabled=false; }
    goTo('home');
  }, 500);
}

function doLogin() {
  const e = vf('li-email', 'email', true);
  const p = vf('li-pass',  'req',   true);
  if(!e) shakeEl(document.getElementById('li-email'));
  if(!p) shakeEl(document.getElementById('li-pass'));
  if(!e || !p) {
    const missing = [];
    if(!e) missing.push('Email Address');
    if(!p) missing.push('Password');
    showAuthErr('Please fill in: ' + missing.join(' and '));
    return;
  }
  const email = document.getElementById('li-email').value.trim();
  const pass  = document.getElementById('li-pass').value.trim();
  if(email === 'admin@wanderlust.com' && pass === 'admin123') {
    if(typeof admEnter === 'function') admEnter();
    return;
  }
  const btn = document.querySelector('#auth-login .submit-btn');
  if(btn){ btn.textContent='✓ Signing In…'; btn.disabled=true; }
  setTimeout(() => {
    const namePart = email.split('@')[0].replace(/[._\-]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    setUser(namePart||'Traveller', email);
    if(btn){ btn.textContent='Sign In →'; btn.disabled=false; }
    goTo('home');
  }, 500);
}

function setUser(name, email) {
  const now = new Date();
  const loginTime = now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) + ' · ' + now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  localStorage.setItem('wl_user', JSON.stringify({name, email, loginTime}));
  try {
    const users = JSON.parse(localStorage.getItem('wl_users')||'[]');
    if(!users.find(u=>u.email===email))
      users.push({name, email, joinedAt:new Date().toISOString(), trips:0, spent:0});
    localStorage.setItem('wl_users', JSON.stringify(users));
  } catch(ex){}
  document.getElementById('navUserName').textContent = name.split(' ')[0];
  document.getElementById('navUserAvatar').textContent = name[0].toUpperCase();
  document.getElementById('pdAvatarBig').textContent = name[0].toUpperCase();
  document.getElementById('pdName').textContent = name;
  document.getElementById('pdEmail').textContent = email;
  const llEl = document.getElementById('pdLastLogin');
  if(llEl) llEl.textContent = loginTime;
  const trips = parseInt(localStorage.getItem('wl_trips')||'0');
  document.getElementById('pdTrips').textContent = trips;
  document.getElementById('pdPoints').textContent = 500 + trips * 150;
}
function toggleProfileDropdown(e) {
  e.stopPropagation();
  document.getElementById('profileDropdown').classList.toggle('open');
}
function closeProfileDropdown() {
  document.getElementById('profileDropdown').classList.remove('open');
}
function doLogout() {
  localStorage.removeItem('wl_user');
  closeProfileDropdown();
  goTo('auth');
}
document.addEventListener('click', function(e) {
  const dd = document.getElementById('profileDropdown');
  const wrap = document.getElementById('navUserWrap');
  if(dd && wrap && !wrap.contains(e.target)) dd.classList.remove('open');
});

// Google / Apple accounts
const googleAccs = [
  {name:'Arjun Sharma',  email:'arjun.sharma@gmail.com',    av:'AS', col:'#4285F4'},
  {name:'Priya Menon',   email:'priya.menon2024@gmail.com', av:'PM', col:'#EA4335'},
  {name:'Rahul Verma',   email:'rahul.v.work@gmail.com',    av:'RV', col:'#34A853'},
];
const appleAccs = [
  {name:'Arjun Sharma', email:'arjun.sharma@icloud.com', av:'AS'},
  {name:'Priya Menon',  email:'p.menon@me.com',          av:'PM'},
];

function showGooglePopup() {
  document.getElementById('gAccounts').innerHTML = googleAccs.map((a,i) => `
    <div class="g-account-item" onclick="selectGoogle(${i})">
      <div class="g-avatar" style="background:${a.col}">${a.av}</div>
      <div><div class="g-name">${a.name}</div><div class="g-email">${a.email}</div></div>
    </div>`).join('');
  document.getElementById('googleOverlay').classList.add('open');
}
function selectGoogle(i) {
  const a = googleAccs[i];
  setUser(a.name, a.email);
  document.getElementById('googleOverlay').classList.remove('open');
  goTo('home');
}
function useAnotherGoogle() {
  const email = prompt('Enter your Google email:');
  if(email && email.includes('@')) {
    const name = email.split('@')[0].replace(/[._]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    setUser(name, email);
    document.getElementById('googleOverlay').classList.remove('open');
    goTo('home');
  }
}
function closeGooglePopup() { document.getElementById('googleOverlay').classList.remove('open'); }

function showApplePopup() {
  document.getElementById('appleAccounts').innerHTML = appleAccs.map((a,i) => `
    <div class="apple-account-item ${i===selectedAppleIdx?'selected':''}" onclick="selApple(${i})">
      <div class="apple-avatar">${a.av}</div>
      <div><div class="apple-name">${a.name}</div><div class="apple-email">${a.email}</div></div>
      ${i===selectedAppleIdx?'<div class="apple-check">✓</div>':''}
    </div>`).join('');
  document.getElementById('appleOverlay').classList.add('open');
}
function selApple(i) { selectedAppleIdx=i; showApplePopup(); }
function continueApple() {
  const a = appleAccs[selectedAppleIdx];
  setUser(a.name, a.email);
  document.getElementById('appleOverlay').classList.remove('open');
  goTo('home');
}
function closeApplePopup() { document.getElementById('appleOverlay').classList.remove('open'); }

// ═══════════════════════════════════════
// DESTINATIONS
// ═══════════════════════════════════════
const knownDests = ['kerala','ooty','manali','agra','jaipur','andaman','ladakh','darjeeling','goa'];
const destInfo = {
  kerala:     {name:'Kerala',     emoji:'🌴', state:"God's Own Country",       tags:['Backwaters','Houseboat','Spices'],   price:'₹18,500'},
  ooty:       {name:'Ooty',       emoji:'🌿', state:'Nilgiris, Tamil Nadu',     tags:['Tea Gardens','Toy Train'],           price:'₹12,800'},
  manali:     {name:'Manali',     emoji:'❄️', state:'Himachal Pradesh',         tags:['Snow','Adventure','Trekking'],        price:'₹22,000'},
  agra:       {name:'Agra',       emoji:'🕌', state:'Uttar Pradesh',            tags:['Taj Mahal','Heritage'],               price:'₹9,500'},
  jaipur:     {name:'Jaipur',     emoji:'🏰', state:'Rajasthan',                tags:['Pink City','Royalty'],                price:'₹13,500'},
  andaman:    {name:'Andaman',    emoji:'🏝️', state:'Islands',                  tags:['Beaches','Scuba','Diving'],           price:'₹28,000'},
  ladakh:     {name:'Ladakh',     emoji:'⛰️', state:'J&K',                      tags:['High Altitude','Monasteries'],        price:'₹32,000'},
  darjeeling: {name:'Darjeeling', emoji:'☕', state:'West Bengal',              tags:['Tea','Kangchenjunga'],                price:'₹15,500'},
  goa:        {name:'Goa',        emoji:'🌊', state:'Goa',                      tags:['Beaches','Nightlife'],                price:'₹14,000'},
};
const gradients = {kerala:'#1a4a2e,#2d7a4f',ooty:'#1e3a1e,#4a7c35',manali:'#1a2a4a,#3a5a8c',agra:'#3a2a1a,#8c6a3a',jaipur:'#4a1a0a,#c05a20',andaman:'#0a2a4a,#1a6a8c',ladakh:'#1a1a3a,#4a4a7c',darjeeling:'#1a2e1a,#3a6a3a',goa:'#0a2a3a,#1a7a6a'};

let activeCat = 'all', activeCont = 'all';
let searchTimer;

function handleDestSearch(val) {
  clearTimeout(searchTimer);
  document.getElementById('searchClearBtn').style.display = val ? 'flex' : 'none';
  searchTimer = setTimeout(()=>doDestSearch(val), 300);
}
function doDestSearch(val) {
  const q = val.trim().toLowerCase();
  const box = document.getElementById('searchResultBox');
  const cards = document.querySelectorAll('.dest-card');
  if(!q) { box.classList.remove('visible'); cards.forEach(c=>c.classList.remove('d-hidden')); return; }
  const matched = knownDests.find(d=>d.includes(q)||q.includes(d));
  if(matched) {
    cards.forEach(c=>c.classList.toggle('d-hidden', !c.dataset.dest.includes(matched)));
    box.classList.remove('visible');
    searchResultDest = matched;
  } else {
    cards.forEach(c=>c.classList.add('d-hidden'));
    const cap = val.trim().charAt(0).toUpperCase()+val.trim().slice(1);
    const prices = [8500,11000,14500,17000,21000];
    const price = prices[Math.floor(Math.random()*prices.length)];
    document.getElementById('rEmoji').textContent = '🗺️';
    document.getElementById('rName').textContent = cap;
    document.getElementById('rMeta').textContent = `📍 India · Explore the wonderful destination of ${cap}!`;
    document.getElementById('rTags').innerHTML = ['Sightseeing','Culture','Local Cuisine','Photography'].map(t=>`<span class="r-tag">${t}</span>`).join('');
    document.getElementById('rPrice').innerHTML = `₹${price.toLocaleString('en-IN')}<span>per person</span>`;
    searchResultDest = val.trim();
    box.classList.add('visible');
  }
}
function clearDestSearch() {
  document.getElementById('destSearch').value = '';
  document.getElementById('searchClearBtn').style.display = 'none';
  document.getElementById('searchResultBox').classList.remove('visible');
  document.querySelectorAll('.dest-card').forEach(c=>c.classList.remove('d-hidden'));
  searchResultDest = null;
}
function filterDestCat(cat, btn) {
  activeCat = cat;
  document.querySelectorAll('#catPills .filter-pill').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  clearDestSearch();
  applyDestFilters();
}
function filterDestCont(cont, btn) {
  activeCont = cont;
  document.querySelectorAll('#contPills .filter-pill').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  clearDestSearch();
  applyDestFilters();
}
function applyDestFilters() {
  document.querySelectorAll('.dest-card').forEach(c=>{
    const catOk  = activeCat  === 'all' || c.dataset.cat.includes(activeCat);
    const contOk = activeCont === 'all' || c.dataset.continent === activeCont;
    c.classList.toggle('d-hidden', !(catOk && contOk));
  });
}
function goToPkgFromSearch() {
  const name = document.getElementById('rName').textContent;
  const priceText = document.getElementById('rPrice').textContent.replace(/[^0-9]/g,'');
  const price = parseInt(priceText) || 12000;
  bookingCounter++;
  const bookingId = 'BK'+Date.now().toString().slice(-5);
  const customPkg = {
    id:'custom-'+bookingCounter, dest:'custom', name:name,
    title:name+' Explorer Tour',
    desc:'Curated tour package for '+name+'. Our travel experts will craft a personalised itinerary for you.',
    tags:['Sightseeing','Culture','Local Cuisine'],
    duration:'5 Days', people:'2–8',
    features:['Expert Guide','Hotel Stay','Local Cuisine'],
    price:price, seats:10, maxSeats:10,
    bookingId, tempId:bookingCounter, isCustom:true
  };
  tempBookings.push(customPkg);
  goTo('pkg');
  setTimeout(()=>{ renderTempCards(); renderPkgGrid(packages); showToast('✈️ '+name+' added to your itinerary!'); }, 300);
}
function goToPkg(dest) { currentBooking.dest = dest; goTo('pkg'); }

// ═══════════════════════════════════════
// PACKAGES DATA
// ═══════════════════════════════════════
const packages = [
  {id:1,dest:'kerala',    name:'Kerala',    title:'Backwaters & Spice Trail',      desc:'Drift through lush emerald backwaters on a houseboat, explore spice plantations and witness Kathakali at sunset.',          tags:['Houseboat','Wildlife','Culture'],          duration:'6 Days',people:'2–8', features:['Houseboat Stay','Ayurvedic Spa','Spice Tour'],        price:18500,seats:12,maxSeats:20},
  {id:2,dest:'ooty',      name:'Ooty',      title:'Nilgiri Hills Escape',           desc:'Ride the iconic toy train through rolling tea estates, wake up to cool mountain mist in the Blue Mountains.',              tags:['Hill Station','Nature','Tea Garden'],      duration:'4 Days',people:'2–6', features:['Toy Train Ride','Tea Factory','Botanical Garden'],    price:12800,seats:8, maxSeats:15},
  {id:3,dest:'manali',    name:'Manali',    title:'Himalayan Snow Adventure',       desc:'Conquer the Rohtang Pass, camp under a blanket of stars and feel the rush of river rafting in the icy Beas.',             tags:['Snow','Adventure','Trekking'],            duration:'7 Days',people:'2–10',features:['River Rafting','Snow Activities','Rohtang Pass'],   price:22000,seats:0, maxSeats:12},
  {id:4,dest:'agra',      name:'Agra',      title:'Mughal Grandeur Tour',           desc:"Stand in awe before the Taj Mahal at sunrise, wander Agra Fort's labyrinthine halls and discover Fatehpur Sikri.",       tags:['Heritage','History','Architecture'],      duration:'3 Days',people:'2–8', features:['Taj Mahal Sunrise','Agra Fort','Fatehpur Sikri'],    price:9500, seats:5, maxSeats:20},
  {id:5,dest:'jaipur',    name:'Jaipur',    title:'Pink City Royal Expedition',     desc:"Ride an elephant to Amber Fort, browse the dazzling bazaars and watch the sunset over Nahargarh's ramparts.",           tags:['Royalty','Culture','Shopping'],           duration:'4 Days',people:'2–12',features:['Elephant Ride','City Palace','Camel Safari'],        price:13500,seats:18,maxSeats:25},
  {id:6,dest:'andaman',   name:'Andaman',   title:'Island Paradise Getaway',        desc:'Snorkel through world-class coral reefs, laze on powdery white beaches and explore the haunting Cellular Jail.',          tags:['Beach','Scuba Diving','Islands'],          duration:'6 Days',people:'2–6', features:['Scuba Diving','Glass Bottom Boat','Ross Island'],    price:28000,seats:0, maxSeats:10},
  {id:7,dest:'ladakh',    name:'Ladakh',    title:'Roof of the World Odyssey',      desc:'Traverse moonscapes at 17,000 ft, meditate in ancient cliff monasteries and camp beside Pangong Tso.',                   tags:['High Altitude','Monasteries','Offbeat'],  duration:'8 Days',people:'2–8', features:['Pangong Lake Camp','Monastery Tour','Zanskar Valley'],price:32000,seats:4,maxSeats:10},
  {id:8,dest:'darjeeling',name:'Darjeeling',title:'Tea & Peaks Retreat',            desc:'Sip first-flush Darjeeling tea while Kangchenjunga glows at dawn, ride the beloved toy train.',                          tags:['Tea','Mountain View','Heritage'],         duration:'5 Days',people:'2–6', features:['Tea Plantation Walk','Toy Train','Tiger Hill Sunrise'],price:15500,seats:10,maxSeats:16},
  {id:9,dest:'goa',       name:'Goa',       title:'Sun, Sand & Spice',              desc:'Party at beach shacks, explore Portuguese churches at dawn and cruise through mangroves with dolphins.',                   tags:['Beach','Nightlife','Culture'],            duration:'5 Days',people:'2–10',features:['Beach Shacks','Water Sports','Old Goa Churches'],    price:14000,seats:3, maxSeats:20},
];

function seatsInfo(s, m) {
  if(s===0) return {col:'red',lbl:'Sold Out'};
  if(s/m<=0.3) return {col:'yellow',lbl:`${s} seat${s>1?'s':''} left`};
  return {col:'green',lbl:`${s} seats left`};
}

function getPriceComparison(dest, basePrice) {
  const seed = basePrice % 7;
  const mmtMult   = 1.08 + (seed * 0.005);
  const ctMult    = 1.06 + (seed * 0.004);
  const yatraMult = 1.10 + (seed * 0.006);
  const mmtPrice   = Math.round(basePrice * mmtMult   / 100) * 100;
  const ctPrice    = Math.round(basePrice * ctMult    / 100) * 100;
  const yatraPrice = Math.round(basePrice * yatraMult / 100) * 100;
  return [
    {name:'MakeMyTrip', tagline:"India's largest travel site", logo:'M', bg:'#d63031', fg:'#fff', price:mmtPrice,   diff:Math.round((mmtMult-1)*100),   url:'https://www.makemytrip.com/holidays-india/'},
    {name:'Cleartrip',  tagline:'Simple, fast booking',        logo:'C', bg:'#0066cc', fg:'#fff', price:ctPrice,    diff:Math.round((ctMult-1)*100),    url:'https://www.cleartrip.com/holidays/'},
    {name:'Yatra',      tagline:'Travel made easy',            logo:'Y', bg:'#ff6600', fg:'#fff', price:yatraPrice, diff:Math.round((yatraMult-1)*100), url:'https://www.yatra.com/tours/'},
  ];
}

function renderPkgGrid(list) {
  const grid = document.getElementById('pkgGrid');
  document.getElementById('pkgMeta').innerHTML = `Showing <strong>${list.length}</strong> of <strong>${packages.length}</strong> packages`;
  if(!list.length) { grid.innerHTML = '<div class="pkg-no-results">No packages found. Try a different search or region.</div>'; return; }
  grid.innerHTML = list.map(p => {
    const si = seatsInfo(p.seats, p.maxSeats);
    const bg = `url('images/${p.dest}.jpg'),linear-gradient(135deg,${gradients[p.dest]||'#1a1a2e,#2a2a4e'})`;
    const comp = getPriceComparison(p.dest, p.price);
    return `<div class="pkg-card${p.seats===0?' sold-out':''}" id="pkg-${p.id}">
      <div class="pkg-card-img" style="background-image:${bg}">
        <div class="sold-out-overlay"><div class="sold-out-badge">Sold Out</div></div>
        <div class="seats-pill"><div class="sdot ${si.col}"></div>${si.lbl}</div>
        <div class="pkg-dest-name">${p.name}</div>
      </div>
      <div class="pkg-card-body">
        <div class="pkg-tags">${p.tags.map(t=>`<span class="pkg-tag">${t}</span>`).join('')}</div>
        <div class="pkg-card-title">${p.title}</div>
        <div class="pkg-card-desc">${p.desc}</div>
        <div class="pkg-feats">${p.features.map(f=>`<div class="pkg-feat"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${f}</div>`).join('')}</div>
        <div class="pkg-card-footer">
          <div class="pkg-price-block"><div class="per">Per person from</div><div class="amount"><span>₹</span>${p.price.toLocaleString('en-IN')}</div></div>
          <button class="pkg-book-btn" onclick="bookNow(${p.id})" ${p.seats===0?'disabled':''}>${p.seats===0?'Unavailable':'Book Now'}</button>
        </div>
        <div class="price-compare-wrap">
          <div class="price-compare-title">🔍 Compare Prices</div>
          <div class="pc-row wl-best" onclick="bookNow(${p.id})">
            <div class="pc-brand"><div class="pc-logo" style="background:linear-gradient(135deg,var(--gold),#a8822a);color:#09080A">W</div><div><div class="pc-name">WanderLust</div><div style="font-size:10px;color:var(--muted)">Best deal guaranteed</div></div></div>
            <div class="pc-price-col"><div class="pc-price best">₹${p.price.toLocaleString('en-IN')}</div><span class="pc-badge best-badge">✦ Best Price</span></div>
          </div>
          ${comp.map(r=>`<a class="pc-row" href="${r.url}" target="_blank" rel="noopener">
            <div class="pc-brand"><div class="pc-logo" style="background:${r.bg};color:${r.fg}">${r.logo}</div><div><div class="pc-name">${r.name}</div><div style="font-size:10px;color:var(--muted)">${r.tagline}</div></div></div>
            <div class="pc-price-col"><div class="pc-price">₹${r.price.toLocaleString('en-IN')}</div><span class="pc-badge higher">+${r.diff}% higher</span></div>
          </a>`).join('')}
        </div>
      </div>
    </div>`;
  }).join('');
}

let activePkgCont = 'all';
function filterPkgCont(cont, btn) {
  activePkgCont = cont;
  document.querySelectorAll('#pkgContPills .filter-pill').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  applyPkgFilters();
}
const pkgContMap = {kerala:'south',ooty:'south',manali:'north',agra:'north',jaipur:'north',andaman:'islands',ladakh:'north',darjeeling:'east',goa:'west'};

function applyPkgFilters() {
  const q    = document.getElementById('pkgSearch').value.toLowerCase().trim();
  const sort = document.getElementById('pkgSort').value;
  let list = packages.filter(p => {
    const matchQ    = p.name.toLowerCase().includes(q)||p.title.toLowerCase().includes(q)||p.dest.toLowerCase().includes(q)||p.tags.some(t=>t.toLowerCase().includes(q));
    const matchCont = activePkgCont==='all' || pkgContMap[p.dest]===activePkgCont;
    return matchQ && matchCont;
  });
  if(sort==='price-asc')  list.sort((a,b)=>a.price-b.price);
  else if(sort==='price-desc') list.sort((a,b)=>b.price-a.price);
  else if(sort==='seats-asc')  list.sort((a,b)=>a.seats-b.seats);
  renderPkgGrid(list);
}

function bookNow(pkgId) {
  const pkg = packages.find(p=>p.id===pkgId);
  if(!pkg||pkg.seats===0) return;
  bookingCounter++;
  const bookingId = 'BK'+Date.now().toString().slice(-5);
  tempBookings.push({...pkg, bookingId, tempId:bookingCounter});
  renderTempCards();
  showToast('✈️ '+pkg.name+' added to your itinerary!');
  const card = document.getElementById('pkg-'+pkgId);
  if(card){card.style.borderColor='var(--gold)';card.style.boxShadow='0 0 0 2px rgba(201,168,76,0.4)';setTimeout(()=>{card.style.borderColor='';card.style.boxShadow='';},1800);}
}

function renderTempCards() {
  const sec = document.getElementById('tempSection');
  const con = document.getElementById('tempCards');
  if(!tempBookings.length){sec.classList.remove('active');return}
  sec.classList.add('active');
  con.innerHTML = tempBookings.map(b=>`
    <div class="temp-card" id="tmp-${b.tempId}">
      <div class="temp-badge">New</div>
      <button class="temp-remove-btn" onclick="removeTemp(${b.tempId})">×</button>
      <h4>${b.title}</h4>
      <div class="temp-dest-tag">📍 ${b.name}</div>
      <div class="temp-meta-row">
        <div class="temp-meta-item"><strong>${b.duration}</strong>Duration</div>
        <div class="temp-meta-item"><strong>${b.people}</strong>People</div>
        <div class="temp-meta-item"><strong>${b.bookingId}</strong>Ref ID</div>
      </div>
      <div class="temp-price-row">
        <div class="temp-price">₹${b.price.toLocaleString('en-IN')}<span>/person</span></div>
        <button class="temp-confirm-btn" onclick="confirmBooking(${b.tempId})">Confirm →</button>
      </div>
    </div>`).join('');
}

function removeTemp(id){tempBookings=tempBookings.filter(b=>b.tempId!==id);renderTempCards();}

function confirmBooking(id) {
  const b = tempBookings.find(t=>t.tempId===id);
  if(!b) return;
  currentBooking = {dest:b.dest, destName:b.name, pkg:b.title+' · '+b.duration, price:b.price, people:2, method:'upi'};
  removeTemp(id);
  goTo('pay');
}

// ═══════════════════════════════════════
// PAYMENT
// ═══════════════════════════════════════
function setupPayPage() {
  const b = currentBooking;
  const destEmojis={kerala:'🌴',ooty:'🌿',manali:'❄️',agra:'🕌',jaipur:'🏰',andaman:'🏝️',ladakh:'⛰️',darjeeling:'☕',goa:'🌊'};
  const dest   = b.destName || 'Kerala';
  const emoji  = destEmojis[(b.dest||'').toLowerCase()] || '🗺️';
  const price  = b.price  || 18500;
  const people = b.people || 2;
  const sub    = price * people;
  const tax    = Math.round(sub * 0.05);
  const total  = sub + tax;
  currentBooking.total = total;
  document.getElementById('sumEmoji').textContent   = emoji;
  document.getElementById('sumDest').textContent    = dest;
  document.getElementById('sumPkg').textContent     = b.pkg || 'Tour Package';
  document.getElementById('sumBase').textContent    = '₹'+price.toLocaleString('en-IN');
  document.getElementById('sumPeople').textContent  = people+' person'+(people>1?'s':'');
  document.getElementById('sumSub').textContent     = '₹'+sub.toLocaleString('en-IN');
  document.getElementById('sumTax').textContent     = '₹'+tax.toLocaleString('en-IN');
  document.getElementById('sumTotal').textContent   = '₹'+total.toLocaleString('en-IN');
  document.getElementById('upiId').value='';
  document.getElementById('nbUser').value='';
  document.getElementById('nbPass').value='';
  ['upiPerr','nbUserErr','nbPassErr'].forEach(id=>document.getElementById(id).classList.remove('show'));
  document.getElementById('payBookBtn').classList.remove('loading');
}

function switchPayMethod(method, tab) {
  document.querySelectorAll('.method-tab').forEach(t=>t.classList.remove('active'));
  tab.classList.add('active');
  document.querySelectorAll('.pay-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('pp-'+method).classList.add('active');
  activePayMethod = method;
}
function selUPI(el){document.querySelectorAll('.upi-option').forEach(o=>o.classList.remove('selected'));el.classList.add('selected');}
function selBank(el){document.querySelectorAll('.bank-card').forEach(c=>c.classList.remove('selected'));el.classList.add('selected');}

function processPayment() {
  let valid = true;
  if(activePayMethod==='upi') {
    const upi=document.getElementById('upiId').value.trim();
    const err=document.getElementById('upiPerr');
    const inp=document.getElementById('upiId');
    if(!upi||!upi.includes('@')){err.classList.add('show');inp.classList.add('pinvalid');valid=false;}
    else{err.classList.remove('show');inp.classList.remove('pinvalid');}
  } else {
    const uid=document.getElementById('nbUser').value.trim();
    const pass=document.getElementById('nbPass').value.trim();
    if(!uid){document.getElementById('nbUserErr').classList.add('show');document.getElementById('nbUser').classList.add('pinvalid');valid=false;}
    else{document.getElementById('nbUserErr').classList.remove('show');document.getElementById('nbUser').classList.remove('pinvalid');}
    if(!pass){document.getElementById('nbPassErr').classList.add('show');document.getElementById('nbPass').classList.add('pinvalid');valid=false;}
    else{document.getElementById('nbPassErr').classList.remove('show');document.getElementById('nbPass').classList.remove('pinvalid');}
  }
  if(!valid) return;
  currentBooking.method = activePayMethod;
  document.getElementById('payBookBtn').classList.add('loading');
  setTimeout(()=>goTo('conf'), 2200);
}

// ═══════════════════════════════════════
// CONFIRMATION
// ═══════════════════════════════════════
function setupConfPage() {
  const b = currentBooking;
  const destEmojis={kerala:'🌴',ooty:'🌿',manali:'❄️',agra:'🕌',jaipur:'🏰',andaman:'🏝️',ladakh:'⛰️',darjeeling:'☕',goa:'🌊'};
  const ref   = 'WL-'+Math.random().toString(36).substring(2,8).toUpperCase();
  const today = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  document.getElementById('bcEmoji').textContent  = destEmojis[(b.dest||'').toLowerCase()]||'🗺️';
  document.getElementById('bcDest').textContent   = b.destName||'Destination';
  document.getElementById('bcPkg').textContent    = b.pkg||'Tour Package';
  document.getElementById('bcRef').textContent    = ref;
  document.getElementById('bcPeople').textContent = (b.people||2)+' Person'+(b.people>1?'s':'');
  document.getElementById('bcMethod').textContent = b.method==='netbank'?'Net Banking':'UPI';
  document.getElementById('bcDate').textContent   = today;
  document.getElementById('bcTotal').textContent  = b.total?'₹'+b.total.toLocaleString('en-IN'):'—';
  // Save booking
  try {
    const allB = JSON.parse(localStorage.getItem('wl_allBookings')||'[]');
    const userRaw = localStorage.getItem('wl_user');
    const userObj = userRaw ? JSON.parse(userRaw) : {name:'Guest', email:'guest@wanderlust.com'};
    const pkgData = packages.find(p=>p.dest===b.dest) || {};
    const richBooking = {
      ref, destName:b.destName, dest:b.dest,
      pkg:b.pkg, total:b.total,
      emoji:destEmojis[(b.dest||'').toLowerCase()]||'✈️',
      userName: userObj.name, userEmail: userObj.email,
      duration: pkgData.duration || '5 Days',
      people: b.people || 2,
      payMethod: b.method === 'netbank' ? 'Net Banking' : 'UPI',
      date: today, bookedAt: new Date().toISOString(),
      status: 'confirmed',
      tags: pkgData.tags || ['Sightseeing']
    };
    allB.unshift(richBooking);
    localStorage.setItem('wl_allBookings', JSON.stringify(allB));
    // Update user stats
    const users = JSON.parse(localStorage.getItem('wl_users')||'[]');
    const ui = users.findIndex(u=>u.email===userObj.email);
    if(ui !== -1){ users[ui].trips = (users[ui].trips||0)+1; users[ui].spent = (users[ui].spent||0)+(b.total||0); }
    else { users.push({name:userObj.name,email:userObj.email,joinedAt:new Date().toISOString(),trips:1,spent:b.total||0}); }
    localStorage.setItem('wl_users', JSON.stringify(users));
    const trips = parseInt(localStorage.getItem('wl_trips')||'0');
    localStorage.setItem('wl_trips', trips+1);
    document.getElementById('pdTrips').textContent  = trips+1;
    document.getElementById('pdPoints').textContent = 500+(trips+1)*150;
  } catch(ex){}
  launchConfetti();
}

function launchConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const cols = ['#C9A84C','#F0D080','#4CAF82','#60A5FA','#F472B6','#fff','#FF6B6B'];
  const pieces = [];
  for(let i=0;i<120;i++){
    pieces.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height-canvas.height,r:Math.random()*5+2,d:Math.random()*8+4,color:cols[Math.floor(Math.random()*cols.length)],ta:0,tai:Math.random()*0.07+0.05,shape:Math.random()>0.5?'rect':'circle'});
  }
  let frame=0;
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p=>{
      ctx.fillStyle=p.color;
      if(p.shape==='rect'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.ta);ctx.fillRect(-p.r/2,-p.r/2,p.r*2,p.r);ctx.restore();}
      else{ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,2*Math.PI);ctx.fill();}
      p.ta+=p.tai; p.y+=Math.cos(frame/60)+2+p.r/4; p.x+=Math.sin(frame/80)*2;
      if(p.y>canvas.height+20){p.y=-20;p.x=Math.random()*canvas.width;}
    });
    frame++;
    if(frame<300) requestAnimationFrame(draw);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  draw();
}

// ═══════════════════════════════════════
// PROFILE PAGE
// ═══════════════════════════════════════
function openProfilePage(tab) {
  closeProfileDropdown();
  const saved = localStorage.getItem('wl_user');
  if(saved) {
    try {
      const u = JSON.parse(saved);
      document.getElementById('profileName').textContent   = u.name  || 'Traveller';
      document.getElementById('profileEmail').textContent  = u.email || '';
      document.getElementById('profileAvatar').textContent = (u.name||'T')[0].toUpperCase();
      document.getElementById('editName').value  = u.name  || '';
      document.getElementById('editEmail').value = u.email || '';
    } catch(ex){}
  }
  const trips = parseInt(localStorage.getItem('wl_trips')||'0');
  document.getElementById('profileTrips').textContent  = trips;
  document.getElementById('profilePoints').textContent = 500 + trips * 150;
  const allBookings = JSON.parse(localStorage.getItem('wl_allBookings')||'[]');
  const bl = document.getElementById('bookingsList');
  if(allBookings.length) {
    bl.innerHTML = allBookings.map(b=>`
      <div style="background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:20px;display:flex;align-items:center;gap:16px;margin-bottom:12px">
        <div style="font-size:36px">${b.emoji||'✈️'}</div>
        <div style="flex:1">
          <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:700;margin-bottom:2px">${b.destName||'Destination'}</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:6px">${b.pkg||'Tour Package'}</div>
          <div style="display:inline-flex;align-items:center;gap:4px;background:rgba(76,175,130,0.1);border:1px solid rgba(76,175,130,0.25);border-radius:20px;padding:2px 10px;font-size:11px;color:var(--green)">✅ Confirmed</div>
        </div>
        <div style="text-align:right"><div style="font-family:'Cormorant Garamond',serif;font-size:20px;color:var(--gold);font-weight:700">${b.total?'₹'+b.total.toLocaleString('en-IN'):'—'}</div><div style="font-size:11px;color:var(--muted)">${b.ref||''}</div></div>
      </div>`).join('');
  }
  goTo('profile');
  switchProfileTab(tab||'profile');
}

function switchProfileTab(tab) {
  document.querySelectorAll('.profile-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.profile-panel').forEach(p=>p.classList.remove('active'));
  const tabEl   = document.getElementById('tab-'+tab);
  const panelEl = document.getElementById('panel-'+tab);
  if(tabEl)   tabEl.classList.add('active');
  if(panelEl) panelEl.classList.add('active');
}

// ═══════════════════════════════════════
// TOAST
// ═══════════════════════════════════════
let toastTimer;
function showToast(msg){
  const t=document.getElementById('toast');
  document.getElementById('toastText').textContent=msg;
  t.classList.add('show'); clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove('show'),3000);
}

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════
(function(){
  // Particles
  const c=document.getElementById('authParticles');
  for(let i=0;i<25;i++){
    const p=document.createElement('div'); p.className='particle';
    p.style.cssText=`left:${Math.random()*100}%;--d:${6+Math.random()*10}s;--delay:${Math.random()*8}s;width:${1+Math.random()*3}px;height:${1+Math.random()*3}px`;
    c.appendChild(p);
  }
  // Restore user session
  const saved = localStorage.getItem('wl_user');
  if(saved) {
    try {
      const u = JSON.parse(saved);
      setUser(u.name, u.email);
      if(u.loginTime) {
        const llEl = document.getElementById('pdLastLogin');
        if(llEl) llEl.textContent = u.loginTime;
      }
    } catch(ex){}
  }
  // App last updated
  const appUpdated = new Date('2025-01-14T10:30:00');
  const appUpdatedStr = appUpdated.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) + ' · ' + appUpdated.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  const auEl = document.getElementById('appLastUpdated');
  if(auEl) auEl.textContent = appUpdatedStr;
})();



// ══════════════════════════════════════════
// DESTINATION MODAL DATA
// ══════════════════════════════════════════
const DEST_MODAL_DATA = {
  kerala:{img:'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=85',stats:[{icon:'🌡️',label:'Climate',val:'Tropical · 25–35°C'},{icon:'✈️',label:'Nearest Airport',val:'Cochin Intl.'},{icon:'🕒',label:'Ideal Duration',val:'5–7 Days'},{icon:'⭐',label:'WL Rating',val:'4.9 / 5'}],highlights:['Alleppey Backwaters','Munnar Tea Gardens','Kovalam Beach','Periyar Wildlife Sanctuary','Kathakali Dance Show','Ayurvedic Spa Retreat'],tips:[{icon:'🛶',tip:'Book your houseboat 2 weeks ahead — they sell out fast!'},{icon:'👕',tip:'Pack light cotton clothes. Humidity is high year-round.'},{icon:'🍛',tip:'Try the Sadhya feast on a banana leaf — absolutely unmissable.'},{icon:'🚗',tip:'Hire a private cab for backwater routes; public transport is slow.'}]},
  ooty:{img:'https://images.unsplash.com/photo-1570458436416-b8fcccfe883f?w=1200&q=85',stats:[{icon:'🌡️',label:'Climate',val:'Cool · 10–20°C'},{icon:'✈️',label:'Nearest Airport',val:'Coimbatore (90 km)'},{icon:'🕒',label:'Ideal Duration',val:'3–4 Days'},{icon:'⭐',label:'WL Rating',val:'4.7 / 5'}],highlights:['Nilgiri Mountain Railway','Botanical Gardens','Doddabetta Peak','Pykara Lake & Falls','Tea Museum','Rose Garden'],tips:[{icon:'🚂',tip:'Book the toy train months ahead — one of India\'s most scenic rail journeys.'},{icon:'🧥',tip:'Evenings drop to 10°C even in summer. Pack a light jacket.'},{icon:'🌿',tip:'Visit tea estates at dawn for mist-covered, photogenic views.'},{icon:'🛍️',tip:'Buy eucalyptus oil and handmade chocolates from local shops.'}]},
  manali:{img:'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=85',stats:[{icon:'🌡️',label:'Climate',val:'Cold · -5 to 15°C'},{icon:'✈️',label:'Nearest Airport',val:'Kullu-Manali (50 km)'},{icon:'🕒',label:'Ideal Duration',val:'4–6 Days'},{icon:'⭐',label:'WL Rating',val:'4.8 / 5'}],highlights:['Rohtang Pass Snow Point','Solang Valley Skiing','Hadimba Devi Temple','Old Manali Cafes','Beas River Rafting','Jogini Waterfall Trek'],tips:[{icon:'🏔️',tip:'Rohtang Pass may close in bad weather — always have a backup plan.'},{icon:'💊',tip:'Carry altitude sickness medicine (Diamox) and rest on day one.'},{icon:'🧣',tip:'Rent snow gear on arrival — buying is expensive for a short trip.'},{icon:'🍽️',tip:'Old Manali cafes serve fantastic wood-fired pizzas and Himachali dham.'}]},
  agra:{img:'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200&q=85',stats:[{icon:'🌡️',label:'Climate',val:'Moderate · 18–28°C'},{icon:'✈️',label:'Nearest Airport',val:'Agra (12 km)'},{icon:'🕒',label:'Ideal Duration',val:'1–2 Days'},{icon:'⭐',label:'WL Rating',val:'4.9 / 5'}],highlights:['Taj Mahal at Sunrise','Agra Fort','Mehtab Bagh Moonrise View','Fatehpur Sikri','Kinari Bazaar Shopping','Mughal Heritage Walk'],tips:[{icon:'🌅',tip:'Arrive at 6 AM for the golden sunrise glow — crowds triple by 9 AM.'},{icon:'📷',tip:'Best photos from the Yamuna riverbank behind the Taj at sunset.'},{icon:'👟',tip:'Shoe covers are mandatory — wear easy slip-off footwear.'},{icon:'🛡️',tip:'Book a licensed guide; unofficial ones upsell at every corner.'}]},
  jaipur:{img:'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200&q=85',stats:[{icon:'🌡️',label:'Climate',val:'Dry · 15–30°C'},{icon:'✈️',label:'Nearest Airport',val:'Jaipur Intl. (13 km)'},{icon:'🕒',label:'Ideal Duration',val:'3–4 Days'},{icon:'⭐',label:'WL Rating',val:'4.8 / 5'}],highlights:['Amber Fort Elephant Ride','Hawa Mahal','City Palace Museum','Nahargarh Fort Sunset','Johari Bazaar Gems','Jal Mahal Water Palace'],tips:[{icon:'🐘',tip:'Book elephant rides at Amber Fort the evening before — slots fill by 7 AM.'},{icon:'🛒',tip:'Always haggle at bazaars — starting prices are typically 3× fair value.'},{icon:'🌶️',tip:'Try Laal Maas (spicy mutton curry) at a local dhaba — authentically Rajasthani.'},{icon:'🎨',tip:'Visit Blue Pottery studios in Sanganer for unique souvenirs.'}]},
  andaman:{img:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85',stats:[{icon:'🌡️',label:'Climate',val:'Tropical · 25–33°C'},{icon:'✈️',label:'Nearest Airport',val:'Port Blair Veer Savarkar'},{icon:'🕒',label:'Ideal Duration',val:'5–7 Days'},{icon:'⭐',label:'WL Rating',val:'4.9 / 5'}],highlights:['Radhanagar Beach (Asia\'s Best)','Havelock Island Diving','Neil Island Cycling','Cellular Jail Light Show','Sea Walking & Snorkeling','Mangrove Kayaking'],tips:[{icon:'🤿',tip:'PADI Open Water certification can be done here in 3 days — totally worth it.'},{icon:'🚢',tip:'Pre-book inter-island ferries; private speedboats are 5× pricier.'},{icon:'🌊',tip:'Visit Radhanagar on a weekday — weekends bring large crowds.'},{icon:'🔋',tip:'Carry a power bank; outages are common on smaller islands.'}]},
  ladakh:{img:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85',stats:[{icon:'🌡️',label:'Climate',val:'Alpine · -5 to 20°C'},{icon:'✈️',label:'Nearest Airport',val:'Kushok Bakula (4 km)'},{icon:'🕒',label:'Ideal Duration',val:'7–10 Days'},{icon:'⭐',label:'WL Rating',val:'5.0 / 5'}],highlights:['Pangong Tso Lake','Nubra Valley Camel Ride','Thiksey Monastery','Magnetic Hill','Khardung La Pass','Zanskar River Rafting'],tips:[{icon:'💊',tip:'Spend first 2 days resting in Leh — altitude acclimatization is critical.'},{icon:'📶',tip:'Only BSNL/Airtel work here. Buy a local SIM at the airport.'},{icon:'⛽',tip:'Fill fuel at every opportunity — petrol stations are 100+ km apart.'},{icon:'🧴',tip:'UV radiation is extreme at altitude. SPF 50+ sunscreen is essential.'}]},
  darjeeling:{img:'https://images.unsplash.com/photo-1544085311-11a028465b03?w=1200&q=85',stats:[{icon:'🌡️',label:'Climate',val:'Cool · 8–20°C'},{icon:'✈️',label:'Nearest Airport',val:'Bagdogra (90 km)'},{icon:'🕒',label:'Ideal Duration',val:'3–5 Days'},{icon:'⭐',label:'WL Rating',val:'4.8 / 5'}],highlights:['Tiger Hill Sunrise View','UNESCO Toy Train Ride','Happy Valley Tea Estate','Peace Pagoda','Zoo & Snow Leopard','Batasia Loop'],tips:[{icon:'🌄',tip:'Wake at 4 AM for Tiger Hill — on a clear day you\'ll see Kangchenjunga pink.'},{icon:'☕',tip:'Do a proper tea tasting at Happy Valley; the first flush is extraordinary.'},{icon:'🚕',tip:'Hire a shared jeep for sightseeing — cheap, fast, and very local.'},{icon:'🌧️',tip:'Avoid Jun–Sep monsoon; March–May shoulder season is the sweet spot.'}]},
  goa:{img:'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&q=85',stats:[{icon:'🌡️',label:'Climate',val:'Tropical · 25–35°C'},{icon:'✈️',label:'Nearest Airport',val:'Dabolim / Mopa Airport'},{icon:'🕒',label:'Ideal Duration',val:'4–6 Days'},{icon:'⭐',label:'WL Rating',val:'4.7 / 5'}],highlights:['Baga & Anjuna Beaches','Old Goa Portuguese Churches','Dudhsagar Waterfalls','Calangute Night Market','Spice Plantation Tour','Dolphin Watching Cruise'],tips:[{icon:'🛵',tip:'Rent a scooter — the best and cheapest way to beach-hop.'},{icon:'🍺',tip:'Local Feni (cashew liquor) is a must-try; ask for premium aged varieties.'},{icon:'🌅',tip:'North Goa for party vibes; South Goa for quiet, scenic beaches.'},{icon:'🎣',tip:'Visit Chapora Fort at sunset for stunning coastline views.'}]}
};

// ══════════════════════════════════════════
// WISHLIST
// ══════════════════════════════════════════
let wishlist = JSON.parse(localStorage.getItem('wl_wishlist')||'[]');

function toggleWish(dest, btn) {
  const idx = wishlist.indexOf(dest);
  if(idx === -1) {
    wishlist.push(dest);
    btn.classList.add('active');
    btn.querySelector('.heart-icon').textContent = '❤️';
    showToast('❤️ Added to Wishlist!');
  } else {
    wishlist.splice(idx, 1);
    btn.classList.remove('active');
    btn.querySelector('.heart-icon').textContent = '🤍';
    showToast('Removed from Wishlist');
  }
  localStorage.setItem('wl_wishlist', JSON.stringify(wishlist));
  updateWishlistCount();
}

function updateWishlistCount() {
  const count = wishlist.length;
  const badge = document.getElementById('wlCount');
  if(badge){badge.textContent=count;badge.classList.toggle('show',count>0);}
}

function showWishlistToast() {
  openWishlistDrawer();
}

// ── WISHLIST DRAWER LOGIC ──
const DEST_META = {
  kerala:  {img:'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80',state:"God's Own Country",price:'₹18,500',badge:'Nature · Backwaters'},
  ooty:    {img:'https://images.unsplash.com/photo-1570458436416-b8fcccfe883f?w=600&q=80',state:'Queen of Nilgiris, TN',price:'₹12,800',badge:'Hills · Tea Gardens'},
  manali:  {img:'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80',state:'Himachal Pradesh',price:'₹22,000',badge:'Adventure · Snow'},
  agra:    {img:'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80',state:'Uttar Pradesh',price:'₹9,500',badge:'Heritage · History'},
  jaipur:  {img:'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80',state:'The Pink City, Rajasthan',price:'₹13,500',badge:'Royal · Culture'},
  andaman: {img:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',state:'Andaman & Nicobar Islands',price:'₹28,000',badge:'Beach · Diving'},
  ladakh:  {img:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',state:'Roof of the World',price:'₹32,000',badge:'High Altitude · Offbeat'},
  darjeeling:{img:'https://images.unsplash.com/photo-1544085311-11a028465b03?w=600&q=80',state:'West Bengal',price:'₹15,500',badge:'Tea · Peaks'},
  goa:     {img:'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80',state:"India's Beach Paradise",price:'₹14,000',badge:'Beach · Nightlife'}
};

function openWishlistDrawer() {
  renderWishlistDrawer();
  document.getElementById('wlDrawerOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeWishlistDrawer(e) {
  if(e && e.target !== document.getElementById('wlDrawerOverlay') && !e.target.classList.contains('wl-drawer-close')) return;
  document.getElementById('wlDrawerOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function renderWishlistDrawer() {
  const body = document.getElementById('wlDrawerBody');
  const foot = document.getElementById('wlDrawerFoot');
  const countEl = document.getElementById('wlDrawerCount');
  countEl.textContent = wishlist.length ? `(${wishlist.length})` : '';

  if(wishlist.length === 0) {
    foot.style.display = 'none';
    body.innerHTML = `<div class="wl-empty">
      <div class="wl-empty-icon">🤍</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:700;color:var(--text)">Nothing saved yet</div>
      <div class="wl-empty-txt">Tap the heart on any destination card to save it here for later.</div>
      <button class="wl-empty-btn" onclick="closeWishlistDrawer({target:document.getElementById('wlDrawerOverlay')});goTo('dest')">Explore Destinations →</button>
    </div>`;
    return;
  }

  foot.style.display = 'block';
  body.innerHTML = wishlist.map(dest => {
    const m = DEST_META[dest] || {img:'',state:'India',price:'—',badge:'Destination'};
    const name = dest.charAt(0).toUpperCase() + dest.slice(1);
    return `<div class="wl-dest-card" id="wl-card-${dest}">
      <div class="wl-card-img" style="background-image:url('${m.img}')">
        <div class="wl-card-img-badge">${m.badge}</div>
        <div class="wl-card-img-name">${name}</div>
      </div>
      <div class="wl-card-body">
        <div>
          <div class="wl-card-state">${m.state}</div>
          <div class="wl-card-price">${m.price}<span> /person</span></div>
        </div>
        <div class="wl-card-actions">
          <button class="wl-book-btn" onclick="closeWishlistDrawer({target:document.getElementById('wlDrawerOverlay')});goToPkg('${dest}')">Book Now</button>
          <button class="wl-remove-btn" onclick="removeFromWishlist('${dest}')" title="Remove">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function removeFromWishlist(dest) {
  const idx = wishlist.indexOf(dest);
  if(idx !== -1) wishlist.splice(idx, 1);
  localStorage.setItem('wl_wishlist', JSON.stringify(wishlist));
  // un-heart all matching cards
  document.querySelectorAll(`.dest-card[data-dest="${dest}"] .dc-wish`).forEach(btn => {
    btn.classList.remove('active');
    btn.querySelector('.heart-icon').textContent = '🤍';
  });
  updateWishlistCount();
  renderWishlistDrawer();
  showToast('Removed from Wishlist');
}

function clearAllWishlist() {
  wishlist.forEach(dest => {
    document.querySelectorAll(`.dest-card[data-dest="${dest}"] .dc-wish`).forEach(btn => {
      btn.classList.remove('active');
      btn.querySelector('.heart-icon').textContent = '🤍';
    });
  });
  wishlist = [];
  localStorage.setItem('wl_wishlist', JSON.stringify(wishlist));
  updateWishlistCount();
  renderWishlistDrawer();
  showToast('Wishlist cleared');
}

function restoreWishlistHearts() {
  wishlist.forEach(dest=>{
    document.querySelectorAll(`.dest-card[data-dest="${dest}"] .dc-wish`).forEach(btn=>{
      btn.classList.add('active');
      btn.querySelector('.heart-icon').textContent='❤️';
    });
  });
  updateWishlistCount();
}

// ══════════════════════════════════════════
// DESTINATION MODAL
// ══════════════════════════════════════════
function openDestModal(dest, e) {
  if(e) e.stopPropagation();
  const d = DEST_MODAL_DATA[dest];
  if(!d){goToPkg(dest);return;}
  document.getElementById('dmImg').style.backgroundImage=`url('${d.img}')`;
  document.getElementById('dmTitle').textContent=dest.charAt(0).toUpperCase()+dest.slice(1);
  document.getElementById('dmGrid').innerHTML=d.stats.map(s=>`<div class="dm-stat"><div class="dm-stat-icon">${s.icon}</div><div class="dm-stat-label">${s.label}</div><div class="dm-stat-val">${s.val}</div></div>`).join('');
  document.getElementById('dmHighlights').innerHTML=d.highlights.map(h=>`<div class="dm-highlight">✦ ${h}</div>`).join('');
  document.getElementById('dmTips').innerHTML=d.tips.map(t=>`<div class="dm-tip"><span class="dm-tip-icon">${t.icon}</span><span>${t.tip}</span></div>`).join('');
  document.getElementById('dmCta').onclick=()=>{closeDestModal({target:document.getElementById('destModalOverlay')});goToPkg(dest);};
  document.getElementById('destModalOverlay').classList.add('open');
  document.body.style.overflow='hidden';
}

function closeDestModal(e) {
  if(e && e.target && e.target!==document.getElementById('destModalOverlay') && !e.target.classList.contains('dm-close')) return;
  document.getElementById('destModalOverlay').classList.remove('open');
  document.body.style.overflow='';
}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    closeDestModal({target:document.getElementById('destModalOverlay')});
    closeWishlistDrawer({target:document.getElementById('wlDrawerOverlay')});
  }
});

restoreWishlistHearts();

// ════════════════════════════════════════════════════
// ADMIN PANEL JS
// ════════════════════════════════════════════════════
const ADM_DESTS = [
  {k:'kerala',name:'Kerala',region:'South India',price:18500,max:20},
  {k:'ooty',name:'Ooty',region:'South India',price:12800,max:15},
  {k:'manali',name:'Manali',region:'North India',price:22000,max:12},
  {k:'agra',name:'Agra',region:'North India',price:9500,max:20},
  {k:'jaipur',name:'Jaipur',region:'North India',price:13500,max:25},
  {k:'andaman',name:'Andaman',region:'Islands',price:28000,max:10},
  {k:'ladakh',name:'Ladakh',region:'North India',price:32000,max:10},
  {k:'darjeeling',name:'Darjeeling',region:'East India',price:15500,max:16},
  {k:'goa',name:'Goa',region:'West India',price:14000,max:20}
];
const ADM_EMO = {kerala:'🌴',ooty:'🌿',manali:'❄️',agra:'🕌',jaipur:'🏰',andaman:'🏝️',ladakh:'⛰️',darjeeling:'☕',goa:'🌊'};
let admBkFilter = 'all';
let _admTT;

const admGetB = () => JSON.parse(localStorage.getItem('wl_allBookings')||'[]');
const admGetU = () => JSON.parse(localStorage.getItem('wl_users')||'[]');
function admGetS() {
  let s = JSON.parse(localStorage.getItem('wl_admin_seats')||'null');
  if(s) return s;
  const d = {}; ADM_DESTS.forEach(x => d[x.k] = Math.floor(x.max*0.6));
  localStorage.setItem('wl_admin_seats', JSON.stringify(d)); return d;
}
const admSaveS = s => localStorage.setItem('wl_admin_seats', JSON.stringify(s));

function admEnter() {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-admin').classList.add('active');
  const nav = document.getElementById('mainNav'); if(nav) nav.style.display='none';
  admNav('dashboard', document.querySelector('#page-admin .adm-sb-item'));
}
function admExit() {
  document.getElementById('page-admin').classList.remove('active');
  const nav = document.getElementById('mainNav'); if(nav) nav.style.display='flex';
  goTo('auth');
}
function admNav(id, btn) {
  document.querySelectorAll('#page-admin .adm-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('#page-admin .adm-sb-item').forEach(b => b.classList.remove('active'));
  const v = document.getElementById('adm-'+id); if(v) v.classList.add('active');
  if(btn) btn.classList.add('active');
  const titles = {dashboard:'Dashboard',bookings:'All Bookings',users:'Users',destinations:'Destinations',seats:'Seat Manager',reports:'Analytics',settings:'Settings'};
  document.getElementById('admPageTitle').textContent = titles[id]||id;
  admRender(id);
}
function admRefresh() {
  const a = document.querySelector('#page-admin .adm-view.active');
  if(a) admRender(a.id.replace('adm-',''));
  admToast('🔄 Refreshed');
}
function admRender(id) {
  const f = {dashboard:admDash,bookings:admRenderBk,users:admRenderUsers,destinations:admRenderDests,seats:admRenderSeats,reports:admRenderReports}[id];
  if(f) f();
}

function admDash() {
  const bks=admGetB(), users=admGetU(), seats=admGetS();
  const rev = bks.reduce((a,b)=>a+(b.total||0),0);
  const st = Object.values(seats).reduce((a,b)=>a+b,0);
  document.getElementById('admCnt').textContent = bks.length;
  document.getElementById('admKpis').innerHTML =
    `<div class="adm-kpi"><div class="adm-kpi-icon">💰</div><div class="adm-kpi-label">Total Revenue</div><div class="adm-kpi-val gold">₹${rev>=100000?(rev/100000).toFixed(1)+'L':(rev/1000).toFixed(0)+'K'}</div><div class="adm-kpi-sub">₹${rev.toLocaleString('en-IN')} lifetime</div></div>`+
    `<div class="adm-kpi"><div class="adm-kpi-icon">🎫</div><div class="adm-kpi-label">Bookings</div><div class="adm-kpi-val green">${bks.length}</div><div class="adm-kpi-sub">${bks.filter(b=>b.status==='confirmed').length} confirmed</div></div>`+
    `<div class="adm-kpi"><div class="adm-kpi-icon">👥</div><div class="adm-kpi-label">Users</div><div class="adm-kpi-val blue">${users.length}</div><div class="adm-kpi-sub">Registered members</div></div>`+
    `<div class="adm-kpi"><div class="adm-kpi-icon">💺</div><div class="adm-kpi-label">Seats Left</div><div class="adm-kpi-val red">${st}</div><div class="adm-kpi-sub">Across all destinations</div></div>`;
  const dc={};bks.forEach(b=>{const d=b.dest||'other';dc[d]=(dc[d]||0)+1;});
  const sorted=Object.entries(dc).sort((a,b)=>b[1]-a[1]).slice(0,7);
  const maxC=sorted[0]?sorted[0][1]:1;
  const cols=['#C9A84C','#60A5FA','#4CAF82','#F472B6','#F0D080','#818CF8','#34D399'];
  document.getElementById('admDestBars').innerHTML = sorted.length
    ? sorted.map((x,i)=>`<div class="adm-bar-row"><div class="adm-bar-label">${ADM_EMO[x[0]]||'🗺️'} ${x[0].charAt(0).toUpperCase()+x[0].slice(1)}</div><div class="adm-bar-track"><div class="adm-bar-fill" style="width:${(x[1]/maxC*100).toFixed(0)}%;background:${cols[i%cols.length]}"></div></div><div class="adm-bar-val">${x[1]}</div></div>`).join('')
    : '<div style="color:#4a4a50;font-size:12px;padding:10px 0">No bookings yet — click Seed Demo Data.</div>';
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const dr=Array(7).fill(0); const now=new Date();
  bks.forEach(b=>{if(!b.bookedAt)return;const d=Math.floor((now-new Date(b.bookedAt))/86400000);if(d<7)dr[6-d]+=(b.total||0);});
  const maxR=Math.max(...dr,1);
  document.getElementById('admRevBars').innerHTML = dr.map((r,i)=>`<div class="adm-rev-col"><div class="adm-rev-bar" style="height:${Math.max((r/maxR*80),3).toFixed(0)}px" title="₹${r.toLocaleString('en-IN')}"></div><div class="adm-rev-lbl">${days[i]}</div></div>`).join('');
  document.getElementById('admRevTotal').textContent = 'This week: ₹'+dr.reduce((a,b)=>a+b,0).toLocaleString('en-IN');
  document.getElementById('admRecentRows').innerHTML = bks.slice(0,5).length
    ? bks.slice(0,5).map(b=>admRowShort(b)).join('')
    : '<tr><td colspan="7" style="text-align:center;padding:32px;color:#4a4a50"><span style="font-size:28px;display:block;margin-bottom:6px">🎫</span>No bookings yet — use Seed Demo Data.</td></tr>';
}

function admSetF(f,btn) { admBkFilter=f; document.querySelectorAll('#page-admin .adm-filter').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); admRenderBk(); }
function admRenderBk() {
  const q=((document.getElementById('admBkQ')||{}).value||'').toLowerCase();
  const list=admGetB().filter(b=>{
    const mq=!q||[b.ref,b.destName,b.userName,b.userEmail].some(v=>v&&v.toLowerCase().includes(q));
    const mf=admBkFilter==='all'||(b.status||'confirmed')===admBkFilter;
    return mq&&mf;
  });
  const tbody=document.getElementById('admBkRows');
  const empty=document.getElementById('admBkEmpty');
  if(!list.length){tbody.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  tbody.innerHTML=list.map(b=>admRowFull(b)).join('');
}
function admBadge(st) {
  if(st==='confirmed') return '<span class="adm-badge ok">✅ Confirmed</span>';
  if(st==='pending') return '<span class="adm-badge warn">⏳ Pending</span>';
  return '<span class="adm-badge bad">❌ Cancelled</span>';
}
function admRowShort(b) {
  const dest=b.dest||(b.destName||'').toLowerCase();
  return `<tr onclick="admOpenBk('${encodeURIComponent(JSON.stringify(b))}')">`+
    `<td><span class="adm-mono">${b.ref||'—'}</span></td>`+
    `<td><div style="font-weight:600">${b.userName||'Guest'}</div><div style="font-size:10px;color:#4a4a50">${b.userEmail||''}</div></td>`+
    `<td><span class="adm-badge dest">${ADM_EMO[dest]||'🗺️'} ${b.destName||dest}</span></td>`+
    `<td style="color:#6a6a70;font-size:11px">${(b.pkg||'—').split(' · ')[0]}</td>`+
    `<td style="color:#6a6a70">${b.people||'—'} pax</td>`+
    `<td style="color:#C9A84C;font-weight:700">${b.total?'₹'+b.total.toLocaleString('en-IN'):'—'}</td>`+
    `<td>${admBadge(b.status||'confirmed')}</td></tr>`;
}
function admRowFull(b) {
  const dest=b.dest||(b.destName||'').toLowerCase();
  return `<tr onclick="admOpenBk('${encodeURIComponent(JSON.stringify(b))}')">`+
    `<td><span class="adm-mono">${b.ref||'—'}</span></td>`+
    `<td><div style="font-weight:600">${b.userName||'Guest'}</div><div style="font-size:10px;color:#4a4a50">${b.userEmail||''}</div></td>`+
    `<td><span class="adm-badge dest">${ADM_EMO[dest]||'🗺️'} ${b.destName||dest}</span></td>`+
    `<td><div style="font-size:12px;font-weight:500">${(b.pkg||'—').split(' · ')[0]}</div><div style="font-size:10px;color:#4a4a50">${b.duration||''}</div></td>`+
    `<td style="color:#6a6a70">${b.people||'1'} pax</td>`+
    `<td style="color:#6a6a70;font-size:11px">${b.payMethod||'UPI'}</td>`+
    `<td style="color:#6a6a70;font-size:11px">${b.date||'—'}</td>`+
    `<td style="color:#C9A84C;font-weight:700">${b.total?'₹'+b.total.toLocaleString('en-IN'):'—'}</td>`+
    `<td>${admBadge(b.status||'confirmed')}</td>`+
    `<td><button class="adm-action-btn" onclick="event.stopPropagation();admOpenBk('${encodeURIComponent(JSON.stringify(b))}')">👁 View</button></td></tr>`;
}
function admOpenBk(enc) {
  const b=JSON.parse(decodeURIComponent(enc));
  const dest=b.dest||(b.destName||'').toLowerCase();
  document.getElementById('admBkTitle').textContent=`${ADM_EMO[dest]||'🎫'} ${b.destName||'Booking'} — ${b.ref||''}`;
  document.getElementById('admBkBody').innerHTML=
    `<div class="adm-bk-field"><div class="adm-bk-lbl">Reference</div><div class="adm-bk-val" style="color:#C9A84C">${b.ref||'—'}</div></div>`+
    `<div class="adm-bk-field"><div class="adm-bk-lbl">Status</div><div class="adm-bk-val green">${(b.status||'confirmed').toUpperCase()}</div></div>`+
    `<div class="adm-bk-field"><div class="adm-bk-lbl">Traveller</div><div class="adm-bk-val">${b.userName||'—'}</div></div>`+
    `<div class="adm-bk-field"><div class="adm-bk-lbl">Email</div><div class="adm-bk-val">${b.userEmail||'—'}</div></div>`+
    `<div class="adm-bk-field"><div class="adm-bk-lbl">Destination</div><div class="adm-bk-val">${ADM_EMO[dest]||''} ${b.destName||'—'}</div></div>`+
    `<div class="adm-bk-field"><div class="adm-bk-lbl">Package</div><div class="adm-bk-val">${(b.pkg||'—').split(' · ')[0]}</div></div>`+
    `<div class="adm-bk-field"><div class="adm-bk-lbl">Duration</div><div class="adm-bk-val">${b.duration||'—'}</div></div>`+
    `<div class="adm-bk-field"><div class="adm-bk-lbl">Travellers</div><div class="adm-bk-val">${b.people||'—'} person${b.people>1?'s':''}</div></div>`+
    `<div class="adm-bk-field"><div class="adm-bk-lbl">Payment</div><div class="adm-bk-val">${b.payMethod||'UPI'}</div></div>`+
    `<div class="adm-bk-field"><div class="adm-bk-lbl">Date</div><div class="adm-bk-val">${b.date||'—'}</div></div>`+
    `<div class="adm-bk-field full"><div class="adm-bk-lbl">Total Paid</div><div class="adm-bk-val gold">${b.total?'₹'+b.total.toLocaleString('en-IN'):'—'}</div></div>`;
  document.getElementById('admBkOv').classList.add('open');
}
function admCloseBk() { document.getElementById('admBkOv').classList.remove('open'); }

function admRenderUsers() {
  const users=admGetU();
  document.getElementById('admUserSub').textContent=users.length+' user'+(users.length!==1?'s':'');
  const grid=document.getElementById('admUserGrid');
  const empty=document.getElementById('admUserEmpty');
  if(!users.length){grid.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  grid.innerHTML=users.map(u=>`<div class="adm-user-card" onclick="admNav('bookings',document.querySelectorAll('#page-admin .adm-sb-item')[1]);setTimeout(()=>{const el=document.getElementById('admBkQ');if(el){el.value='${u.email.replace(/'/g,'')}';admRenderBk();}},120)">`+
    `<div class="adm-uc-head"><div class="adm-uc-av">${(u.name||'?')[0].toUpperCase()}</div><div><div class="adm-uc-name">${u.name||'Guest'}</div><div class="adm-uc-email">${u.email||'—'}</div></div></div>`+
    `<div style="font-size:10px;color:#4a4a50;margin-bottom:9px">Joined ${u.joinedAt?new Date(u.joinedAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'}</div>`+
    `<div class="adm-uc-stats"><div><div class="adm-uc-sv">${u.trips||0}</div><div class="adm-uc-sl">Trips</div></div><div><div class="adm-uc-sv">${u.spent?'₹'+(u.spent/1000).toFixed(0)+'K':'₹0'}</div><div class="adm-uc-sl">Spent</div></div><div><div class="adm-uc-sv">4.9</div><div class="adm-uc-sl">Rating</div></div></div></div>`
  ).join('');
}

function admRenderDests() {
  const bks=admGetB(),seats=admGetS(),dc={},dr={};
  bks.forEach(b=>{const d=b.dest||'other';dc[d]=(dc[d]||0)+1;dr[d]=(dr[d]||0)+(b.total||0);});
  const maxC=Math.max(...Object.values(dc),1);
  document.getElementById('admDestRows').innerHTML=ADM_DESTS.map(d=>{
    const c=dc[d.k]||0,r=dr[d.k]||0,sl=seats[d.k]!=null?seats[d.k]:d.max;
    const sc=sl===0?'bad':sl<=3?'warn':'ok';
    return `<tr><td><div style="display:flex;align-items:center;gap:7px"><span style="font-size:17px">${ADM_EMO[d.k]}</span><span style="font-weight:600">${d.name}</span></div></td>`+
      `<td style="color:#6a6a70;font-size:11px">${d.region}</td><td style="color:#C9A84C;font-weight:600">₹${d.price.toLocaleString('en-IN')}</td>`+
      `<td><span class="adm-badge ${sc}">${sl===0?'Sold Out':sl+' left'}</span></td><td style="font-weight:600">${c}</td>`+
      `<td style="color:#C9A84C;font-weight:700">${r?'₹'+r.toLocaleString('en-IN'):'₹0'}</td>`+
      `<td><div style="display:flex;align-items:center;gap:6px"><div style="flex:1;height:5px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden"><div style="height:100%;width:${Math.round(c/maxC*100)}%;background:#C9A84C;border-radius:3px"></div></div><span style="font-size:10px;color:#4a4a50">${Math.round(c/maxC*100)}%</span></div></td>`+
      `<td><button class="adm-action-btn" onclick="admNav('seats',document.querySelectorAll('#page-admin .adm-sb-item')[4])">Seats</button></td></tr>`;
  }).join('');
}

function admRenderSeats() {
  const seats=admGetS();
  document.getElementById('admSeatGrid').innerHTML=ADM_DESTS.map(d=>{
    const av=seats[d.k]!=null?seats[d.k]:d.max;
    const booked=d.max-av,pct=Math.round(booked/d.max*100);
    const fc=av===0?'full':av<=3?'low':'ok';
    return `<div class="adm-seat-card"><div class="adm-seat-head"><div><div style="font-size:18px;margin-bottom:3px">${ADM_EMO[d.k]}</div><div class="adm-seat-name">${d.name}</div></div><div class="adm-seat-price">₹${d.price.toLocaleString('en-IN')}</div></div>`+
      `<div style="display:flex;justify-content:space-between;font-size:10px;color:#4a4a50;margin-bottom:4px"><span>${booked} booked</span><span>${av} / ${d.max} available</span></div>`+
      `<div class="adm-seat-track"><div class="adm-seat-fill ${fc}" style="width:${pct}%"></div></div>`+
      `<div class="adm-seat-ctrl"><label>Set seats:</label><input type="number" id="adms-${d.k}" value="${av}" min="0" max="${d.max}"/><button onclick="admUpdateSeat('${d.k}')">Save</button></div></div>`;
  }).join('');
}
function admUpdateSeat(k) {
  const el=document.getElementById('adms-'+k); if(!el) return;
  const v=Math.max(0,parseInt(el.value)||0);
  const s=admGetS(); s[k]=v; admSaveS(s);
  admRenderSeats(); admToast('✅ '+k.charAt(0).toUpperCase()+k.slice(1)+' seats → '+v);
}

function admRenderReports() {
  const bks=admGetB(),users=admGetU();
  const rev=bks.reduce((a,b)=>a+(b.total||0),0),avg=bks.length?Math.round(rev/bks.length):0;
  document.getElementById('admRptKpis').innerHTML=
    `<div class="adm-kpi"><div class="adm-kpi-icon">💰</div><div class="adm-kpi-label">Total Revenue</div><div class="adm-kpi-val gold">₹${rev>=100000?(rev/100000).toFixed(1)+'L':(rev/1000).toFixed(0)+'K'}</div></div>`+
    `<div class="adm-kpi"><div class="adm-kpi-icon">📊</div><div class="adm-kpi-label">Avg Booking</div><div class="adm-kpi-val green">₹${(avg/1000).toFixed(1)}K</div></div>`+
    `<div class="adm-kpi"><div class="adm-kpi-icon">👥</div><div class="adm-kpi-label">Users</div><div class="adm-kpi-val blue">${users.length}</div></div>`+
    `<div class="adm-kpi"><div class="adm-kpi-icon">🎫</div><div class="adm-kpi-label">Bookings</div><div class="adm-kpi-val red">${bks.length}</div></div>`;
  const dr2={};bks.forEach(b=>{const d=b.dest||'other';dr2[d]=(dr2[d]||0)+(b.total||0);});
  const sr=Object.entries(dr2).sort((a,b)=>b[1]-a[1]); const maxR2=sr[0]?sr[0][1]:1;
  document.getElementById('admRptBars').innerHTML=sr.length
    ?sr.map(x=>`<div class="adm-bar-row"><div class="adm-bar-label">${ADM_EMO[x[0]]||'🗺️'} ${x[0].charAt(0).toUpperCase()+x[0].slice(1)}</div><div class="adm-bar-track"><div class="adm-bar-fill" style="width:${(x[1]/maxR2*100).toFixed(0)}%;background:#C9A84C"></div></div><div class="adm-bar-val" style="width:46px;font-size:9.5px">₹${(x[1]/1000).toFixed(0)}K</div></div>`).join('')
    :'<div style="color:#4a4a50;font-size:12px">No data yet.</div>';
  const days2=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const du2=Array(7).fill(0); const now2=new Date();
  users.forEach(u=>{if(!u.joinedAt)return;const d=Math.floor((now2-new Date(u.joinedAt))/86400000);if(d<7)du2[6-d]++;});
  const maxU2=Math.max(...du2,1);
  document.getElementById('admUserBars').innerHTML=du2.map((c,i)=>`<div class="adm-rev-col"><div class="adm-rev-bar" style="height:${Math.max((c/maxU2*80),3).toFixed(0)}px;background:linear-gradient(to top,#60A5FA,rgba(96,165,250,0.3))"></div><div class="adm-rev-lbl">${days2[i]}</div></div>`).join('');
  const pm={},pr={};bks.forEach(b=>{const m=b.payMethod||'UPI';pm[m]=(pm[m]||0)+1;pr[m]=(pr[m]||0)+(b.total||0);});
  document.getElementById('admPayRows').innerHTML=Object.entries(pm).map(x=>{
    const pct=bks.length?Math.round(x[1]/bks.length*100):0;
    return `<tr><td style="font-weight:600">${x[0]}</td><td>${x[1]}</td><td style="color:#C9A84C;font-weight:700">₹${(pr[x[0]]||0).toLocaleString('en-IN')}</td><td style="color:#6a6a70">₹${Math.round((pr[x[0]]||0)/x[1]).toLocaleString('en-IN')}</td><td><div style="display:flex;align-items:center;gap:6px"><div style="flex:1;height:5px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:#C9A84C;border-radius:3px"></div></div><span style="font-size:10px;color:#4a4a50">${pct}%</span></div></td></tr>`;
  }).join('')||'<tr><td colspan="5" style="text-align:center;padding:28px;color:#4a4a50">No payment data yet.</td></tr>';
}

function admSeedData() {
  const names=['Arjun Sharma','Priya Menon','Rahul Verma','Sneha Iyer','Karthik Nair','Anjali Bose','Vikram Singh','Deepa Rao','Amit Patel','Riya Das','Sanjay Gupta','Meera Krishnan'];
  const dests=['kerala','ooty','agra','jaipur','goa','darjeeling','ladakh','manali','andaman','goa','kerala','jaipur'];
  const pkgs={kerala:'Backwaters & Spice Trail · 6 Days',ooty:'Nilgiri Hills Escape · 4 Days',manali:'Himalayan Snow Adventure · 7 Days',agra:'Mughal Grandeur Tour · 3 Days',jaipur:'Pink City Expedition · 4 Days',andaman:'Island Paradise · 6 Days',ladakh:'Roof of the World · 8 Days',darjeeling:'Tea & Peaks · 5 Days',goa:'Sun Sand & Spice · 5 Days'};
  const durs={kerala:'6 Days',ooty:'4 Days',manali:'7 Days',agra:'3 Days',jaipur:'4 Days',andaman:'6 Days',ladakh:'8 Days',darjeeling:'5 Days',goa:'5 Days'};
  const prices={kerala:18500,ooty:12800,manali:22000,agra:9500,jaipur:13500,andaman:28000,ladakh:32000,darjeeling:15500,goa:14000};
  const bks=[],usrs=[];
  names.forEach((name,i)=>{
    const dest=dests[i],email=name.toLowerCase().replace(/ /g,'.')+'@gmail.com';
    const ppl=Math.floor(Math.random()*3)+1,total=Math.round((prices[dest]||14000)*ppl*1.05);
    const dt=new Date(Date.now()-Math.floor(Math.random()*30)*86400000);
    const ref='WL-'+Math.random().toString(36).substring(2,8).toUpperCase();
    bks.push({ref,destName:dest.charAt(0).toUpperCase()+dest.slice(1),dest,pkg:pkgs[dest],total,emoji:ADM_EMO[dest]||'✈️',userName:name,userEmail:email,duration:durs[dest],people:ppl,payMethod:Math.random()>0.5?'UPI':'Net Banking',date:dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}),bookedAt:dt.toISOString(),status:'confirmed'});
    usrs.push({name,email,joinedAt:dt.toISOString(),trips:1,spent:total});
  });
  const existing=admGetB(),existingU=admGetU();
  localStorage.setItem('wl_allBookings',JSON.stringify([...bks,...existing]));
  localStorage.setItem('wl_users',JSON.stringify([...usrs,...existingU.filter(u=>!usrs.find(x=>x.email===u.email))]));
}
function admSeedPrompt() {
  if(confirm('Add 12 realistic demo bookings and users?\n\nExisting data will be kept.'))
    {admSeedData();admRefresh();admToast('✅ Demo data seeded!');}
}
function admExportCSV() {
  const bks=admGetB();if(!bks.length){admToast('⚠️ No bookings to export');return;}
  const hdr=['Ref','Name','Email','Destination','Package','Duration','People','Payment','Date','Amount','Status'];
  const rows=bks.map(b=>[b.ref||'',b.userName||'',b.userEmail||'',b.destName||b.dest||'',(b.pkg||'').split(' · ')[0],b.duration||'',b.people||'',b.payMethod||'',b.date||'',b.total||'',b.status||'confirmed'].map(v=>'"'+v+'"').join(','));
  const csv=[hdr.join(','),...rows].join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='WanderLust_Bookings.csv';a.click();admToast('✅ CSV exported!');
}
function admClearAll() {
  if(!confirm('⚠️ Delete ALL bookings and users permanently?')) return;
  localStorage.removeItem('wl_allBookings');localStorage.removeItem('wl_users');localStorage.removeItem('wl_admin_seats');
  admRefresh();admToast('🗑️ All data cleared');
}
function admToast(msg) {
  const t=document.getElementById('admToastEl');
  document.getElementById('admToastMsg').textContent=msg;
  t.classList.add('show');clearTimeout(_admTT);
  _admTT=setTimeout(()=>t.classList.remove('show'),3200);
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')admCloseBk?.();});
