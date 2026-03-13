// ═══════════════════════════════════════════════════════════════
//  Interactive Notification System
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const container = document.getElementById('notification-container');
  const activeNotifications = [];
  let totalCreated = 0;
  let totalDismissed = 0;

  // Duration (ms) mapped to priority
  const DURATION = { high: 7000, medium: 5000, low: 3000 };

  // Icons mapped to type
  const ICONS = {
    success: '\u2714',  // ✔
    error:   '\u2718',  // ✘
    info:    '\u2139',  // ℹ
    warning: '\u26A0',  // ⚠
  };

  // ── Core: create and show a notification ──────────────────
  function notify(type, title, message, priority) {
    priority = priority || 'medium';

    const el = document.createElement('div');
    el.className = `notification ${type}`;

    // Stagger delay if multiple notifications exist
    const staggerDelay = activeNotifications.length * 0.06;
    el.style.setProperty('--stagger-delay', `${staggerDelay}s`);
    el.style.setProperty('--duration', `${DURATION[priority]}ms`);

    el.innerHTML = `
      <div class="icon">${ICONS[type] || ICONS.info}</div>
      <div class="content">
        <div class="title">${escapeHtml(title)}</div>
        <div class="message">${escapeHtml(message)}</div>
      </div>
      <button class="close" title="Dismiss">&times;</button>
      <span class="priority-badge priority-badge ${priority}">${priority}</span>
      <div class="progress-bar"></div>
    `;

    container.appendChild(el);
    activeNotifications.push(el);

    totalCreated++;
    updateStats();

    // Schedule auto-dismiss
    const autoTimer = setTimeout(() => dismiss(el), DURATION[priority]);
    el._autoTimer = autoTimer;

    // Allow pause-on-hover and click-to-close
    el.addEventListener('mouseenter', () => pauseAutoDismiss(el));
    el.addEventListener('mouseleave', () => resumeAutoDismiss(el));
    el.querySelector('.close').addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss(el);
    });
    el.addEventListener('click', () => dismiss(el));
  }

  // ── Dismiss: animate out then remove ──────────────────────
  function dismiss(el) {
    if (!el || !el.parentNode || el._dismissed) return;
    el._dismissed = true;
    clearTimeout(el._autoTimer);

    const remaining = getRemainingTime(el);
    if (remaining > 0) {
      // Override progress bar to drain quickly
      const bar = el.querySelector('.progress-bar');
      if (bar) {
        bar.style.animation = 'none';
        bar.offsetHeight; // force reflow
        bar.style.animation = `progress-shrink 0.3s linear forwards`;
      }
    }

    el.style.animation = 'none';
    el.offsetHeight; // force reflow
    el.style.animation = `slide-out 0.4s cubic-bezier(0.55, 0, 1, 0.45) forwards`;

    const idx = activeNotifications.indexOf(el);
    if (idx > -1) activeNotifications.splice(idx, 1);

    el.addEventListener('animationend', () => {
      el.remove();
      // Smooth reflow: remaining notifications slide into place
      repositionNotifications();
    }, { once: true });

    if (!el._userDismissed) {
      el._userDismissed = true;
      totalDismissed++;
      updateStats();
    }
  }

  // ── Pause / Resume auto-dismiss on hover ──────────────────
  function pauseAutoDismiss(el) {
    clearTimeout(el._autoTimer);
    const bar = el.querySelector('.progress-bar');
    if (bar) bar.style.animationPlayState = 'paused';
  }

  function resumeAutoDismiss(el) {
    const remaining = getRemainingTime(el);
    if (remaining <= 0) { dismiss(el); return; }

    el._autoTimer = setTimeout(() => dismiss(el), remaining);

    const bar = el.querySelector('.progress-bar');
    if (bar) {
      // Resume progress bar for the remaining fraction
      const totalDuration = DURATION[el._priority] || DURATION.medium;
      const fraction = remaining / totalDuration;
      bar.style.animation = 'none';
      bar.offsetHeight;
      bar.style.animation = `progress-shrink ${remaining}ms linear forwards`;
    }
  }

  function getRemainingTime(el) {
    if (!el._autoTimer) return 0;
    // Use the scheduled timeout to infer remaining time — rough but effective
    clearTimeout(el._autoTimer);
    return 2000; // on manual dismiss, just use a short slide-out
  }

  // ── Smooth repositioning after removal ────────────────────
  function repositionNotifications() {
    activeNotifications.forEach((n, i) => {
      n.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
      // Each notification keeps its stack position — flexbox gap handles the rest
      n.style.transform = '';
    });
  }

  // ── Stats panel update ────────────────────────────────────
  function updateStats() {
    const a = document.getElementById('stat-active');
    const t = document.getElementById('stat-total');
    const d = document.getElementById('stat-dismissed');
    if (a) a.textContent = activeNotifications.length;
    if (t) t.textContent = totalCreated;
    if (d) d.textContent = totalDismissed;
  }

  // ── HTML escape helper ────────────────────────────────────
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Burst demo: fire multiple random notifications ────────
  function triggerBurst() {
    const types = ['success', 'error', 'info', 'warning'];
    const titles = ['Upload finished', 'New message', 'Sync started', 'Update ready', 'Backup saved'];
    const priorities = ['high', 'medium', 'low'];

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const type = types[Math.floor(Math.random() * types.length)];
        const title = titles[i % titles.length];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        notify(type, title, `This is notification #${totalCreated + 1} (priority: ${priority}).`, priority);
      }, i * 150);
    }
  }

  // ── Expose to global scope ────────────────────────────────
  window.notify = notify;
  window.triggerBurst = triggerBurst;
})();
