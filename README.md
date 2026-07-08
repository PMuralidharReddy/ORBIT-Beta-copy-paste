# 📎 ORBIT-Beta Snapshot Copy-Paste

A Tampermonkey userscript that enables quick snapshot and paste of annotation fields for duplicate chats in ORBIT-Beta. Stop re-filling the same fields manually — save once, paste everywhere.

![Version](https://img.shields.io/badge/version-3.2-blue)
![Platform](https://img.shields.io/badge/platform-Tampermonkey-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

## ✨ Features

- **One-Click Snapshot** — Capture all current annotation field values instantly
- **One-Click Paste** — Apply saved snapshot to any new chat with confirmation
- **Draggable Panel** — Position the floating panel anywhere on screen; position persists across reloads
- **Collapsible UI** — Minimize to a small icon (📎) when not in use
- **Visual Preview** — See a summary of saved field values before pasting
- **Confirmation Dialog** — Prevents accidental overwrites with a clear confirm/cancel prompt
- **Persistent Position** — Panel position is saved via `GM_setValue` and restored on page reload

## 📋 Supported Fields

| Field Type | IDs Captured |
|------------|-------------|
| Dropdowns | `hva-category-select`, `interaction-type-select`, `static-response-type-select`, `cs-routing-select` |
| Radio Buttons | `response-accurate` |
| Text Inputs | `custom-hva-input` |
| Textareas | `expected-response`, `observations` |

## 🚀 Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Click **Create a new script** in the Tampermonkey dashboard
3. Copy and paste the contents of `orbit-beta-snapshot.user.js` into the editor
4. Save the script (Ctrl+S / Cmd+S)
5. Navigate to ORBIT-Beta — the panel will appear in the top-left corner

## 🎯 Usage

1. **Fill out** annotation fields on a chat as usual
2. Click **📋 Save Current as Snapshot** to capture all field values
3. Navigate to a duplicate/similar chat
4. Click **⎘ Paste Snapshot to This Chat** to apply all saved values
5. Confirm the paste action in the overlay dialog

## 🖼️ UI Overview
┌─────────────────────────┐ │ ⠿ 📎 Beta Copy-Paste — │ ← Drag handle + collapse ├─────────────────────────┤ │ 📋 Save Current as │ ← Snapshot button │ Snapshot │ ├─────────────────────────┤ │ HVA: Value | IntType:.. │ ← Preview of saved data ├─────────────────────────┤ │ ⎘ Paste Snapshot to │ ← Paste button (active │ This Chat │ after snapshot saved) ├─────────────────────────┤ │ ✓ Pasted 6 fields! │ ← Status bar └─────────────────────────┘

