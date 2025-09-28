document.addEventListener('DOMContentLoaded', () => {
  fetch('data.json', { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      // zapamti globalno ako zatreba
      window.__INVITE_DATA = data;

      // 1) Ukloni uvodni <h2 class="poruka"> ako nema poruke u JSON-u
      const porukaEl = document.querySelector('h2.poruka');
      if (porukaEl) {
        if (data.poruka && data.poruka.trim()) {
          porukaEl.innerHTML = data.poruka;
        } else {
          porukaEl.remove();
        }
      }

      // 2) Imena i slika
      const imenaEl = document.querySelector('h1.imepara');
      if (imenaEl && data.imePara) imenaEl.innerHTML = data.imePara;
// POSLE: if (imenaEl && data.imePara) imenaEl.innerHTML = data.imePara;
const el = document.getElementById('ime-para');
if (el && el.innerHTML.includes('&')) {
  // pretvori "Ana <br> & <br> Marko" u strukturisane spanove
  el.innerHTML = el.innerHTML.replace(
    /^\s*([^<]+)\s*<br\s*\/?>\s*&\s*<br\s*\/?>\s*([^<]+)\s*$/i,
    '<span class="name">$1</span><span class="amp">&</span><span class="name">$2</span>'
  );
}

      const slikaEl = document.getElementById('par');
      if (slikaEl && data.slikaPara) slikaEl.src = data.slikaPara;

      // 3) Tekst pozivnice
      const pozivnicaP = document.querySelector('#pozivnica .pozivnica-tekst p');
      if (pozivnicaP && data.pozivnicaTekst) pozivnicaP.innerHTML = data.pozivnicaTekst;

      // 4) ORGANIZACIJA (naslovi)
      const orgHead = document.querySelector('.h1-organizacija')?.parentElement;
      if (orgHead) {
        const orgDate = orgHead.querySelector('.fs-4.fw-bold');
        const orgMeet = orgHead.querySelector('.fs-5.fw-bold');
        if (orgDate && data.organizacijaDatum) orgDate.textContent = data.organizacijaDatum;
        if (orgMeet && data.organizacijaOkupljanje) orgMeet.textContent = data.organizacijaOkupljanje;
      }

      // 5) Lokacije: izbaci <iframe> i dodaj "Pogledaj na mapi"
      const boxes = document.querySelectorAll('.org-box');
      if (boxes && data.lokacije && data.lokacije.length) {
        data.lokacije.slice(0, boxes.length).forEach((loc, i) => {
          const box = boxes[i];
          if (!box) return;

          // Naslovi / tekstovi
          const h2 = box.querySelector('h2');             if (h2 && loc.naslov) h2.textContent = loc.naslov;
          const ps = box.querySelectorAll('p.cormorant');
          if (ps[0] && loc.mesto)  ps[0].textContent = loc.mesto;
          if (ps[1] && loc.adresa) ps[1].textContent = loc.adresa;

          const vreme = box.querySelector('p.text-end.fw-bold');
          if (vreme && loc.vreme)  vreme.innerHTML = '&#8594; ' + loc.vreme;

          // Ukloni mapu ako postoji
          const ratio = box.querySelector('.ratio');
          if (ratio) ratio.remove();

          // Dodaj link "Pogledaj na mapi"
          const mapsUrl = buildMapsUrl(loc); // gradi search URL iz mesta + adrese
          const linkP = document.createElement('p');
          linkP.className = 'text-end mb-0';
          const a = document.createElement('a');
          a.href = mapsUrl;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = 'Pogledaj na mapi';
          linkP.appendChild(a);
          // ubaci odmah ispod reda sa vremenom
          if (vreme && vreme.parentNode) {
            vreme.parentNode.insertBefore(linkP, vreme.nextSibling);
          } else {
            box.appendChild(linkP);
          }
        });
      }

      // 6) RSVP
      const rsvpH3 = document.querySelector('.forma h3.text-center');
      if (rsvpH3 && data.rsvpRok) rsvpH3.textContent = data.rsvpRok;
      const rsvpForm = document.getElementById('rsvp-form') || document.querySelector('.forma form');
      if (rsvpForm && data.rsvpEmail) {
        rsvpForm.action = 'https://formsubmit.co/' + data.rsvpEmail;
        rsvpForm.method = 'POST';
      }

      // 7) COUNTDOWN (stil kao na slici)
      const orgContainer = document.querySelector('.h1-organizacija')?.closest('.container');
      if (orgContainer) insertCountdown(orgContainer, data.countdown);
    })
    .catch(err => console.error('Greška pri učitavanju data.json:', err));
});

/* ---------- Pomocne ---------- */
function buildMapsUrl(loc){
  // otvara Google Maps pretragu na osnovu Mesto + Adresa (ne treba embed link)
  const q = [loc.mesto, loc.adresa].filter(Boolean).join(' ');
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
}

/* ---------- COUNTDOWN (stil kao na slici: sivi naslov, velike cifre, etikete) ---------- */
function insertCountdown(orgContainer, cfg = {}){
  // nađi prvi red sa naslovom Organizacionog bloka
  const headerRow = orgContainer.querySelector('.row.align-items-center');
  const wrap = document.createElement('div');
  wrap.className = 'container my-3';
  wrap.innerHTML = `
    <div class="text-center">
      <h2 class="cd2-title">${(cfg.title || 'RADUJEMO SE NAŠEM SUSRETU!')}</h2>
      <div class="cd2-grid">
        <div class="cd2-seg">
          <div id="cd2-d" class="cd2-num">00</div>
          <div id="cd2-d-lab" class="cd2-lab">Dana</div>
        </div>
        <div class="cd2-seg">
          <div id="cd2-h" class="cd2-num">00</div>
          <div class="cd2-lab">Sati</div>
        </div>
        <div class="cd2-seg">
          <div id="cd2-m" class="cd2-num">00</div>
          <div class="cd2-lab">Minuta</div>
        </div>
        <div class="cd2-seg">
          <div id="cd2-s" class="cd2-num">00</div>
          <div class="cd2-lab">Sekundi</div>
        </div>
      </div>
    </div>
  `;
  if (headerRow) headerRow.after(wrap); else orgContainer.prepend(wrap);

  injectCountdownStyles();
  const targetStr = cfg.targetISO || '2025-09-13T13:00:00+02:00';
  startCountdown(targetStr, cfg.labels);
}

function injectCountdownStyles(){
  if (document.getElementById('cd2-style')) return;
  const css = `
    .cd2-title{
      font-family: 'Playfair Display', serif;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: #2f6d41;
      font-size: clamp(1.2rem, 2.8vw, 2.2rem);
      margin-bottom: .6rem;
    }
    .cd2-grid{
      display: flex;
      gap: clamp(24px, 6vw, 80px);
      justify-content: center;
      align-items: flex-start;
    }
    .cd2-seg{ text-align: center; }
    .cd2-num{
      font-family: 'Playfair Display', serif;
      font-size: clamp(2.2rem, 7vw, 4.2rem);
      line-height: 1;
      color: #2f6d41;
    }
    .cd2-lab{
      margin-top: .35rem;
      font-family: 'Mulish', sans-serif;
      font-size: clamp(.85rem, 2vw, 1.15rem);
      color: #2f6d41;
    }
    @media (max-width: 575.98px){
      .cd2-grid{ gap: 22px; }
    }
  `;
  const style = document.createElement('style');
  style.id = 'cd2-style';
  style.textContent = css;
  document.head.appendChild(style);
}

function startCountdown(targetISO, labelsCfg){
  const dEl = document.getElementById('cd2-d');
  const hEl = document.getElementById('cd2-h');
  const mEl = document.getElementById('cd2-m');
  const sEl = document.getElementById('cd2-s');
  const dLab= document.getElementById('cd2-d-lab');

  const target = new Date(targetISO);
  if (isNaN(target.getTime())) {
    console.warn('Nevažeći datum za countdown:', targetISO);
    return;
  }

  const pad = n => (n < 10 ? '0' + n : '' + n);
  const labs = labelsCfg || {
    days:   { one: 'Dan',     many: 'Dana' },
    hours:  { one: 'Sat',     many: 'Sati' },
    minutes:{ one: 'Minut',   many: 'Minuta' },
    seconds:{ one: 'Sekunda', many: 'Sekundi' }
  };

  const dayLabel = n => (n === 1 ? labs.days.one : labs.days.many);

  function tick(){
    const now = new Date();
    let diff = target - now;
    if (diff < 0) diff = 0;

    const sec = Math.floor(diff / 1000) % 60;
    const min = Math.floor(diff / (1000*60)) % 60;
    const hrs = Math.floor(diff / (1000*60*60)) % 24;
    const day = Math.floor(diff / (1000*60*60*24));

    if (dEl) dEl.textContent = pad(day);
    if (hEl) hEl.textContent = pad(hrs);
    if (mEl) mEl.textContent = pad(min);
    if (sEl) sEl.textContent = pad(sec);
    if (dLab) dLab.textContent = dayLabel(day);

    if (diff === 0) clearInterval(intId);
  }

  tick();
  const intId = setInterval(tick, 1000);
}

