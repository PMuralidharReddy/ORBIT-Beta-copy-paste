// ==UserScript==
// @name         ORBIT-Beta Snapshot Copy-Paste
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  Snapshot & paste annotation fields for duplicate chats in ORBIT-Beta
// @author       pmred
// @match        *://orbit-beta.beta.harmony.a2z.com/*
// @match        *://orbit-beta.beta.harmony.a2z.com/
// @exclude      *://orbit-gamma*
// @exclude      *://*orbit-gamma*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
  'use strict';

  // ============================================================
  // STATE
  // ============================================================
  let lastAnnotation = null;

  // ============================================================
  // FIELD DEFINITIONS
  // ============================================================
  const DROPDOWNS   = [
    'hva-category-select',
    'interaction-type-select',
    'static-response-type-select',
    'cs-routing-select'
  ];
  const RADIO_NAME  = 'response-accurate';
  const TEXT_INPUTS = ['custom-hva-input'];
  const TEXTAREAS   = ['expected-response', 'observations'];

  // ============================================================
  // STYLES
  // ============================================================
  GM_addStyle(`
    #orbit-beta-panel {
      position: fixed;
      top: 48px;
      left: 18px;
      z-index: 999999;
      background: #1a1a2e;
      border: 2px solid #f59e0b;
      border-radius: 9px;
      padding: 8px;
      width: 200px;
      font-family: Arial, sans-serif;
      box-shadow: 0 3px 16px rgba(0,0,0,0.6);
      transition: box-shadow 0.2s ease;
      user-select: none;
    }

    /* Dragging state */
    #orbit-beta-panel.ob-dragging {
      box-shadow: 0 8px 32px rgba(245,158,11,0.4);
      opacity: 0.92;
      transition: none;
    }

    /* Collapsed */
    #orbit-beta-panel.collapsed {
      width: 28px;
      height: 28px;
      padding: 0;
      border-radius: 6px;
      overflow: hidden;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #orbit-beta-panel.collapsed .ob-inner { display: none; }

    #ob-collapse-icon {
      display: none;
      font-size: 14px;
      color: #f59e0b;
      user-select: none;
    }

    #orbit-beta-panel.collapsed #ob-collapse-icon { display: block; }

    /* Header — drag handle */
    #ob-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      border-bottom: 1px solid #374151;
      padding-bottom: 5px;
      cursor: grab;
    }

    #ob-header:active { cursor: grabbing; }

    #ob-drag-hint {
      font-size: 7px;
      color: #4b5563;
      letter-spacing: 0.3px;
      margin-right: 4px;
      user-select: none;
    }

    #ob-title {
      color: #fcd34d;
      font-size: 10px;
      font-weight: bold;
      letter-spacing: 0.3px;
      flex: 1;
    }

    #ob-toggle-btn {
      background: none;
      border: none;
      color: #fcd34d;
      font-size: 12px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    #ob-toggle-btn:hover { color: #fff; }

    /* Copy section */
    #ob-copy-section {
      margin-bottom: 4px;
      border: 1px solid #2d2d45;
      border-radius: 6px;
      overflow: hidden;
    }

    /* Save button */
    #ob-save-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: 100%;
      padding: 4px 0;
      border: none;
      border-bottom: 1px solid #2d2d45;
      background: #1a2535;
      color: #60a5fa;
      font-size: 9px;
      font-weight: 700;
      cursor: pointer;
      letter-spacing: 0.3px;
      transition: background 0.15s;
      box-sizing: border-box;
    }

    #ob-save-btn:hover { background: #1e3050; }

    /* Preview */
    #ob-snap-preview {
      padding: 4px 6px;
      font-size: 8px;
      color: #6b7280;
      background: #252535;
      line-height: 1.6;
      min-height: 20px;
      word-break: break-word;
      border-bottom: 1px solid #2d2d45;
    }

    #ob-snap-preview.has-data { color: #9ca3af; }

    #ob-snap-preview span {
      display: inline-block;
      background: #374151;
      border-radius: 3px;
      padding: 0 3px;
      margin: 1px;
      font-size: 7.5px;
      color: #d1d5db;
    }

    /* Paste button */
    #ob-paste-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: 100%;
      padding: 5px 0;
      border: none;
      background: #252535;
      color: #6b7280;
      font-size: 9.5px;
      font-weight: 700;
      cursor: not-allowed;
      letter-spacing: 0.3px;
      transition: all 0.15s;
      box-sizing: border-box;
      opacity: 0.5;
    }

    #ob-paste-btn.ready {
      color: #fbbf24;
      cursor: pointer;
      opacity: 1;
      background: #2a2010;
    }

    #ob-paste-btn.ready:hover { background: #3a2e10; }
    #ob-paste-btn.ready:active { transform: scale(0.97); }

    /* Status */
    #ob-status {
      margin-top: 5px;
      font-size: 9px;
      min-height: 12px;
      text-align: center;
      border-top: 1px solid #374151;
      padding-top: 4px;
      color: #86efac;
    }

    /* Confirm overlay */
    #ob-confirm-box {
      display: none;
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15,15,25,0.96);
      border-radius: 9px;
      z-index: 10;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
      box-sizing: border-box;
      gap: 8px;
    }

    #ob-confirm-box.show { display: flex; }

    #ob-confirm-text {
      font-size: 9.5px;
      color: #e5e7eb;
      text-align: center;
      line-height: 1.5;
    }

    #ob-confirm-text strong { color: #fbbf24; }

    .ob-confirm-btns {
      display: flex;
      gap: 6px;
      width: 100%;
    }

    .ob-confirm-btns button {
      flex: 1;
      padding: 5px 0;
      border: none;
      border-radius: 5px;
      font-size: 9.5px;
      font-weight: 700;
      cursor: pointer;
    }

    #ob-confirm-yes { background: #f59e0b; color: #1a1a2e; }
    #ob-confirm-yes:hover { background: #fbbf24; }
    #ob-confirm-no  { background: #374151; color: #d1d5db; }
    #ob-confirm-no:hover { background: #4b5563; }
  `);

  // ============================================================
  // BUILD PANEL
  // ============================================================
  const panel = document.createElement('div');
  panel.id = 'orbit-beta-panel';

  // Collapse icon
  const collapseIcon = document.createElement('span');
  collapseIcon.id = 'ob-collapse-icon';
  collapseIcon.textContent = '📎';
  panel.appendChild(collapseIcon);

  // Inner wrapper
  const inner = document.createElement('div');
  inner.className = 'ob-inner';
  inner.style.position = 'relative';

  // Header (drag handle)
  const header = document.createElement('div');
  header.id = 'ob-header';

  const dragHint = document.createElement('span');
  dragHint.id = 'ob-drag-hint';
  dragHint.textContent = '⠿';
  dragHint.title = 'Drag to move';

  const titleEl = document.createElement('span');
  titleEl.id = 'ob-title';
  titleEl.textContent = '📎 Beta Copy-Paste';

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'ob-toggle-btn';
  toggleBtn.title = 'Collapse';
  toggleBtn.textContent = '—';

  header.appendChild(dragHint);
  header.appendChild(titleEl);
  header.appendChild(toggleBtn);
  inner.appendChild(header);

  // Copy section
  const copySection = document.createElement('div');
  copySection.id = 'ob-copy-section';

  const saveBtn = document.createElement('button');
  saveBtn.id = 'ob-save-btn';
  saveBtn.innerHTML = '📋 Save Current as Snapshot';
  saveBtn.title = 'Save all current field values as a snapshot to paste later';
  saveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const snap = captureSnapshot();
    const count = Object.keys(snap).length;
    if (!count) {
      setStatus('⚠️ Nothing to save — form is empty', '#fbbf24');
      return;
    }
    updateSnapshot(snap);
    setStatus(`📋 Snapshot saved! (${count} fields)`, '#60a5fa');
  });
  copySection.appendChild(saveBtn);

  const snapPreview = document.createElement('div');
  snapPreview.id = 'ob-snap-preview';
  snapPreview.textContent = 'No snapshot saved yet';
  copySection.appendChild(snapPreview);

  const pasteBtn = document.createElement('button');
  pasteBtn.id = 'ob-paste-btn';
  pasteBtn.innerHTML = '⎘ Paste Snapshot to This Chat';
  pasteBtn.title = 'Save a snapshot first using the button above';
  pasteBtn.disabled = true;
  pasteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (lastAnnotation) showConfirm();
  });
  copySection.appendChild(pasteBtn);
  inner.appendChild(copySection);

  // Confirm overlay
  const confirmBox = document.createElement('div');
  confirmBox.id = 'ob-confirm-box';
  confirmBox.innerHTML = `
    <div id="ob-confirm-text">
      This will <strong>overwrite</strong> all current fields
      with the saved snapshot.<br>Are you sure?
    </div>
    <div class="ob-confirm-btns">
      <button id="ob-confirm-yes">✓ Yes, Paste</button>
      <button id="ob-confirm-no">✗ Cancel</button>
    </div>
  `;
  inner.appendChild(confirmBox);

  // Status bar
  const statusEl = document.createElement('div');
  statusEl.id = 'ob-status';
  inner.appendChild(statusEl);

  panel.appendChild(inner);
  document.body.appendChild(panel);

  // ============================================================
  // RESTORE SAVED POSITION
  // ============================================================
  const savedX = GM_getValue('ob_panel_x', null);
  const savedY = GM_getValue('ob_panel_y', null);

  if (savedX !== null && savedY !== null) {
    panel.style.left = savedX + 'px';
    panel.style.top  = savedY + 'px';
    panel.style.right = 'auto';
  }

  // ============================================================
  // DRAG LOGIC
  // ============================================================
  let isDragging  = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  function startDrag(e) {
    // Only drag from header or collapsed icon — not from buttons
    if (e.target === toggleBtn) return;

    isDragging = true;
    panel.classList.add('ob-dragging');

    const rect = panel.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    e.preventDefault();
  }

  function onDrag(e) {
    if (!isDragging) return;

    let newX = e.clientX - dragOffsetX;
    let newY = e.clientY - dragOffsetY;

    // Keep panel fully within viewport bounds
    const maxX = window.innerWidth  - panel.offsetWidth;
    const maxY = window.innerHeight - panel.offsetHeight;
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    panel.style.left  = newX + 'px';
    panel.style.top   = newY + 'px';
    panel.style.right = 'auto';
  }

  function stopDrag() {
    if (!isDragging) return;
    isDragging = false;
    panel.classList.remove('ob-dragging');

    // Save position so it persists across page reloads
    const rect = panel.getBoundingClientRect();
    GM_setValue('ob_panel_x', Math.round(rect.left));
    GM_setValue('ob_panel_y', Math.round(rect.top));
  }

  // Attach drag listeners to header and collapsed icon
  header.addEventListener('mousedown', startDrag);
  collapseIcon.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);

  // ============================================================
  // COLLAPSE TOGGLE
  // ============================================================
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.add('collapsed');
  });

  collapseIcon.addEventListener('click', (e) => {
    // Only expand on click, not after a drag
    if (!isDragging) panel.classList.remove('collapsed');
  });

  // ============================================================
  // SHOW CONFIRM
  // ============================================================
  function showConfirm() {
    confirmBox.classList.add('show');
  }

  // Wire confirm buttons
  document.getElementById('ob-confirm-yes').addEventListener('click', () => {
    confirmBox.classList.remove('show');
    applySnapshot(lastAnnotation);
  });
  document.getElementById('ob-confirm-no').addEventListener('click', () => {
    confirmBox.classList.remove('show');
    setStatus('Paste cancelled', '#6b7280');
  });

  // ============================================================
  // CAPTURE SNAPSHOT
  // ============================================================
  function captureSnapshot() {
    const snap = {};

    DROPDOWNS.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value && el.value !== '') snap[id] = el.value;
    });

    TEXT_INPUTS.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value.trim()) snap[id] = el.value.trim();
    });

    const r = document.querySelector(`input[name="${RADIO_NAME}"]:checked`);
    if (r) snap[RADIO_NAME] = r.id;

    TEXTAREAS.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value.trim()) snap[id] = el.value.trim();
    });

    return snap;
  }

  // ============================================================
  // UPDATE SNAPSHOT PREVIEW
  // ============================================================
  function updateSnapshot(snap) {
    lastAnnotation = snap;
    pasteBtn.disabled = false;
    pasteBtn.classList.add('ready');
    pasteBtn.title = 'Paste saved snapshot to this chat';

    snapPreview.innerHTML = '';
    snapPreview.classList.add('has-data');

    const labels = {
      'hva-category-select':         'HVA',
      'custom-hva-input':            'CustomHVA',
      'interaction-type-select':     'IntType',
      'static-response-type-select': 'StaticRT',
      'cs-routing-select':           'CSRoute',
      [RADIO_NAME]:                  'RespAcc',
      'expected-response':           'ExpResp',
      'observations':                'Obs'
    };

    Object.entries(snap).forEach(([k, v]) => {
      const s = document.createElement('span');
      const label   = labels[k] || k;
      const display = v.length > 16 ? v.substring(0, 14) + '…' : v;
      s.textContent = `${label}: ${display}`;
      s.title = `${label}: ${v}`;
      snapPreview.appendChild(s);
    });
  }

  // ============================================================
  // APPLY SNAPSHOT
  // ============================================================
  function applySnapshot(snap) {
    if (!snap) return;
    let count = 0;

    DROPDOWNS.forEach(id => {
      if (snap[id] === undefined) return;
      const el = document.getElementById(id);
      if (!el) return;
      el.value = snap[id];
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      count++;
      if (id === 'hva-category-select' && snap[id] === '__custom__') {
        const box = document.getElementById('custom-hva-box');
        if (box) box.style.display = 'block';
      }
    });

    TEXT_INPUTS.forEach(id => {
      if (snap[id] === undefined) return;
      const el = document.getElementById(id);
      if (!el) return;
      el.value = snap[id];
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      count++;
    });

    if (snap[RADIO_NAME]) {
      const radio = document.getElementById(snap[RADIO_NAME]);
      if (radio) {
        radio.checked = true;
        radio.click();
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        count++;
      }
    }

    TEXTAREAS.forEach(id => {
      if (snap[id] === undefined) return;
      const el = document.getElementById(id);
      if (!el) return;
      el.value = snap[id];
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      count++;
    });

    setStatus(`⎘ Pasted ${count} field${count !== 1 ? 's' : ''}!`, '#f59e0b');
  }

  // ============================================================
  // STATUS BAR
  // ============================================================
  function setStatus(msg, color) {
    statusEl.style.color = color || '#86efac';
    statusEl.textContent = msg;
    setTimeout(() => { statusEl.textContent = ''; }, 2500);
  }

})();
