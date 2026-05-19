
(function () {
  const NOTIF_SCHEDULE_KEY = 'monkeytype_goals_notif_schedule';

  function loadSchedule() {
    try { return JSON.parse(localStorage.getItem(NOTIF_SCHEDULE_KEY)) || null; }
    catch { return null; }
  }

  function saveSchedule(schedule) {
    localStorage.setItem(NOTIF_SCHEDULE_KEY, JSON.stringify(schedule));
  }

  function parseCustomInterval(str) {
    const match = str.trim().match(/^(\d+)(d|h|m)$/i);
    if (!match) return null;
    const num = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    if (num <= 0) return null;
    const msMap = { d: 86400000, h: 3600000, m: 60000 };
    return { ms: num * msMap[unit], label: `Every ${num} ${unit === 'd' ? 'day' : unit === 'h' ? 'hour' : 'minute'}${num !== 1 ? 's' : ''}`, raw: str.trim() };
  }

  function show(onSave) {
    const existing = document.getElementById('notif-popup-overlay');
    if (existing) existing.remove();

    const current = loadSchedule();

    const overlay = document.createElement('div');
    overlay.id = 'notif-popup-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '999999',
      animation: 'notifFadeIn 0.15s ease',
      fontFamily: "'Roboto Mono', monospace",
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes notifFadeIn { from { opacity:0; } to { opacity:1; } }
      @keyframes notifBoxIn { from { opacity:0; transform: translateY(-8px); } to { opacity:1; transform: translateY(0); } }
      #notif-popup-box { animation: notifBoxIn 0.18s ease; }
      .notif-option-btn {
        background: rgba(255,255,255,0.07);
        border: 2px solid transparent;
        border-radius: 8px;
        color: rgba(255,255,255,0.75);
        font-family: 'Roboto Mono', monospace;
        font-size: 0.85rem;
        padding: 10px 14px;
        cursor: pointer;
        text-align: left;
        transition: background 0.15s, border-color 0.15s, color 0.15s;
        width: 100%;
      }
      .notif-option-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
      .notif-option-btn.selected { border-color: #e2b714; color: #e2b714; background: rgba(226,183,20,0.08); }
      #notif-custom-input {
        background: rgba(255,255,255,0.07);
        border: 1.5px solid rgba(255,255,255,0.18);
        border-radius: 6px;
        color: #fff;
        font-family: 'Roboto Mono', monospace;
        font-size: 0.85rem;
        padding: 9px 12px;
        outline: none;
        width: 100%;
        transition: border-color 0.15s;
        margin-top: 8px;
        box-sizing: border-box;
      }
      #notif-custom-input:focus { border-color: #e2b714; }
      #notif-custom-input::placeholder { color: rgba(255,255,255,0.3); }
      #notif-custom-hint {
        font-size: 0.72rem;
        color: rgba(255,255,255,0.35);
        margin-top: 5px;
      }
      #notif-custom-error {
        font-size: 0.72rem;
        color: #ff6b6b;
        margin-top: 5px;
        min-height: 16px;
      }
      #notif-save-btn {
        background: #e2b714;
        border: none;
        border-radius: 6px;
        color: #1a1a1a;
        font-family: 'Roboto Mono', monospace;
        font-size: 0.85rem;
        font-weight: 700;
        padding: 10px 22px;
        cursor: pointer;
        transition: background 0.15s;
      }
      #notif-save-btn:hover { background: #f0c71e; }
      #notif-cancel-btn {
        background: rgba(255,255,255,0.08);
        border: none;
        border-radius: 6px;
        color: rgba(255,255,255,0.6);
        font-family: 'Roboto Mono', monospace;
        font-size: 0.85rem;
        padding: 10px 18px;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }
      #notif-cancel-btn:hover { background: rgba(255,255,255,0.14); color: #fff; }
    `;
    document.head.appendChild(style);

    const box = document.createElement('div');
    box.id = 'notif-popup-box';
    Object.assign(box.style, {
      background: '#2b2d31',
      borderRadius: '12px',
      padding: '26px 24px 22px',
      maxWidth: '380px',
      width: 'calc(100% - 40px)',
      color: '#fff',
      boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
    });

    box.innerHTML = `
      <div style="font-size:1rem;font-weight:600;margin-bottom:6px;color:#fff;">Notification schedule</div>
      <div style="font-size:0.78rem;color:rgba(255,255,255,0.45);margin-bottom:18px;">How often should we remind you of a goal?</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
        <button class="notif-option-btn${current && current.type === 'never' ? ' selected' : ''}" data-type="never">🔕 Never</button>
        <button class="notif-option-btn${!current || current.type === 'everyday' ? ' selected' : ''}" data-type="everyday">📅 Everyday</button>
        <button class="notif-option-btn${current && current.type === 'every2' ? ' selected' : ''}" data-type="every2">📆 Every 2 days</button>
        <button class="notif-option-btn${current && current.type === 'custom' ? ' selected' : ''}" data-type="custom">⚙️ Custom</button>
      </div>
      <div id="notif-custom-section" style="display:${current && current.type === 'custom' ? 'block' : 'none'};margin-bottom:10px;">
        <input id="notif-custom-input" type="text" placeholder="e.g. 3d, 5h, 2m" maxlength="10" value="${current && current.type === 'custom' ? (current.raw || '') : ''}" />
        <div id="notif-custom-hint">3d = every 3 days &nbsp;|&nbsp; 5h = every 5 hours &nbsp;|&nbsp; 2m = every 2 minutes</div>
        <div id="notif-custom-error"></div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">
        <button id="notif-cancel-btn">Cancel</button>
        <button id="notif-save-btn">Save</button>
      </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    let selectedType = current ? current.type : 'everyday';

    const optionBtns = box.querySelectorAll('.notif-option-btn');
    const customSection = box.querySelector('#notif-custom-section');
    const customInput = box.querySelector('#notif-custom-input');
    const customError = box.querySelector('#notif-custom-error');

    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        selectedType = btn.dataset.type;
        optionBtns.forEach(b => b.classList.toggle('selected', b === btn));
        customSection.style.display = selectedType === 'custom' ? 'block' : 'none';
        if (selectedType === 'custom') customInput.focus();
      });
    });

    box.querySelector('#notif-cancel-btn').addEventListener('click', () => {
      overlay.remove();
    });

    box.querySelector('#notif-save-btn').addEventListener('click', () => {
      customError.textContent = '';
      let schedule;
      if (selectedType === 'never') {
        schedule = { type: 'never', ms: null };
      } else if (selectedType === 'everyday') {
        schedule = { type: 'everyday', ms: 86400000 };
      } else if (selectedType === 'every2') {
        schedule = { type: 'every2', ms: 172800000 };
      } else {
        const parsed = parseCustomInterval(customInput.value);
        if (!parsed) {
          customError.textContent = 'Invalid format. Try something like 3d, 5h, or 2m.';
          customInput.focus();
          return;
        }
        schedule = { type: 'custom', ms: parsed.ms, raw: parsed.raw, label: parsed.label };
      }
      saveSchedule(schedule);
      overlay.remove();
      if (onSave) onSave(schedule);
    });

    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.remove();
    });

    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); }
    });
  }

  function getSchedule() { return loadSchedule(); }
  function saveSchedulePublic(s) { saveSchedule(s); }

  window.NotifPopup = { show, getSchedule, saveSchedule: saveSchedulePublic, parseCustomInterval };
})();
