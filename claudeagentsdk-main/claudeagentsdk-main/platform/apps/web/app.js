// Minimal chat UI client.
// Phase 2 scope: one tenant active at a time (default acme-test, switchable
// via ?tenant=<slug> URL param), one OS active at a time, one session open at
// a time. Sessions list in the sidebar, clickable. Multi-tenant Stytch B2B
// auth lands in Phase 5; until then the URL param is the dev switch.

const TENANT = (() => {
  try {
    const t = new URL(window.location.href).searchParams.get("tenant");
    return (t && /^[a-z0-9][a-z0-9-]*$/i.test(t)) ? t : "acme-test";
  } catch { return "acme-test"; }
})();
let currentOS = "sales";
let currentSession = null;
let currentView = "chat";           // "chat" | "dashboard" | "demo"
let pollTimer = null;
let dashTimer = null;
let opTimer = null;
let lastMessageTs = null;
const renderedIds = new Set();      // dedupe: message.id's already rendered

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------------- boot ----------------
async function boot() {
  const me = await fetch(`/api/me?tenant=${TENANT}`).then(r => r.json());

  $("#brand-name").textContent = me.branding?.platform_name || "Platform";
  $("#tenant-switcher").textContent = me.display_name || me.tenant_id;
  $("#tagline").textContent = me.branding?.tagline || "Your AI operations layer";
  $("#greeting").textContent = `Good day, ${me.display_name || me.tenant_id}.`;
  if (me.sandbox_enabled) $("#sandbox-badge").hidden = false;
  if (me.branding?.primary_color) {
    document.documentElement.style.setProperty("--teal", me.branding.primary_color);
  }

  // Demo + Operator panes are dev-only. Hide their nav items in production.
  if (me.app_env === "prod") {
    document.querySelectorAll('[data-view="demo"], [data-view="operator"]')
      .forEach(el => { el.hidden = true; });
  }

  // Render OS list — hidden entirely when the tenant has only one workspace.
  // The main-header "current OS" label is also hidden in that case (it's a
  // workspace disambiguator, meaningless when there's nothing to disambiguate).
  const osList = $("#os-list");
  const osListTitle = $("#os-list-title");
  const currentOsLabel = $("#current-os-label");
  osList.innerHTML = "";
  const entitled = me.entitled_oses || [];
  const showList = entitled.length > 1;
  osList.hidden = !showList;
  if (osListTitle) osListTitle.hidden = !showList;
  if (currentOsLabel) currentOsLabel.hidden = !showList;
  for (const os of entitled) {
    if (showList) {
      const el = document.createElement("div");
      el.className = "os-item" + (os.name === currentOS ? " active" : "");
      el.textContent = os.display_name;
      el.addEventListener("click", () => selectOS(os.name, os.display_name));
      osList.appendChild(el);
    }
    if (os.name === currentOS && currentOsLabel) currentOsLabel.textContent = os.display_name;
  }

  await refreshSessions();
  bindComposer();
  bindNewChat();
  bindQuickActions();
  bindViewSwitcher();
  bindDashboardRefresh();
  bindOperatorRefresh();
  bindTenantSwitcher();
  bindEditConfig();
  renderQuickActions();
  // Pre-load the operator pitch count so the sidebar pill is correct without
  // the user having to open the operator view first.
  loadOperatorPitchCount();
  // Auto-fire the onboarding wizard if this OS has never been configured.
  // First-time landing on a fresh OS = the wizard renders inline; the
  // sales-flavored quick actions don't even get a chance to look wrong.
  await maybeAutoFireWizard();
}

async function bindTenantSwitcher() {
  const btn = $("#tenant-switcher");
  const menu = $("#tenant-menu");
  if (!btn || !menu) return;
  let tenants = [];
  try {
    const data = await fetch("/api/tenants").then(r => r.json());
    tenants = data.tenants || [];
  } catch (e) { return; }
  if (tenants.length <= 1) {
    // Single-tenant deploy — no need for the switcher affordance.
    btn.classList.add("brand-tenant-static");
    return;
  }
  // Build the menu lazily; show on click.
  menu.innerHTML = tenants.map(t => `
    <a class="tenant-menu-item${t.tenant_id === TENANT ? " active" : ""}"
       href="?tenant=${encodeURIComponent(t.tenant_id)}">
       ${escapeHtml(t.display_name)}
       <span class="tenant-menu-slug">${escapeHtml(t.tenant_id)}</span>
    </a>
  `).join("");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });
  document.addEventListener("click", () => { menu.hidden = true; });
}

async function loadOperatorPitchCount() {
  try {
    const d = await fetch(`/api/operator/pitches`).then(r => r.json());
    updateOperatorPitchPill(d.pitch_count || 0);
  } catch (e) { /* silent — sidebar pill is decorative */ }
}

async function selectOS(name, displayName) {
  currentOS = name;
  $$("#os-list .os-item").forEach(el => el.classList.toggle("active", el.textContent === displayName));
  $("#current-os-label").textContent = displayName;
  currentSession = null;
  clearMessages();
  await refreshSessions();
  renderQuickActions();
  await maybeAutoFireWizard();
}

// Render the onboarding wizard inline if `currentOS` has no active config.
// Cheap one-shot check: GET /api/wizards/{os}/schema includes `active_version`;
// null means the tenant has never saved this OS's config. We fire the wizard
// in chat (creating a session lazily on the user's first interaction with it).
let _autoWizardFiredFor = new Set();
async function maybeAutoFireWizard() {
  if (currentSession) return;                           // user is mid-conversation
  if (_autoWizardFiredFor.has(currentOS)) return;       // already fired this load
  try {
    const schema = await fetch(
      `/api/wizards/${currentOS}/schema?tenant=${TENANT}`
    ).then(r => r.ok ? r.json() : null);
    if (!schema) return;
    if (schema.active_version != null) return;          // already configured
    _autoWizardFiredFor.add(currentOS);

    // Show the wizard inline as the welcome surface for this OS.
    switchView("chat");
    showMessagesPane();
    const intro = document.createElement("div");
    intro.className = "msg assistant";
    intro.innerHTML = `<div class="bubble">Welcome to <strong>${escapeHtml(schema.title)}</strong>. A few quick answers and you're set.</div>`;
    $("#messages").appendChild(intro);

    const wrap = document.createElement("div");
    wrap.className = "msg system";
    wrap.appendChild(renderWizardCard(schema));
    $("#messages").appendChild(wrap);
    wrap.scrollIntoView({ behavior: "smooth", block: "end" });
  } catch (e) {
    console.warn("auto-wizard check failed", e);
  }
}

// ---------------- sessions ----------------
async function refreshSessions() {
  const data = await fetch(`/api/tenants/${TENANT}/os/${currentOS}/sessions`).then(r => r.json());
  const list = $("#sessions-list");
  list.innerHTML = "";
  for (const s of (data.sessions || [])) {
    const el = document.createElement("div");
    el.className = "session-item" + (currentSession === s.id ? " active" : "");
    el.textContent = s.title || "Untitled";
    el.title = new Date(s.last_active_at).toLocaleString();
    el.addEventListener("click", () => openSession(s.id, s.title));
    list.appendChild(el);
  }
}

async function openSession(sessionId, title) {
  currentSession = sessionId;
  lastMessageTs = null;
  $$(".session-item").forEach(el => el.classList.toggle("active", el.textContent === title));
  clearMessages();
  const data = await fetch(`/api/sessions/${sessionId}/messages`).then(r => r.json());
  for (const m of data.messages) appendMessageEl(m);
  showMessagesPane();
  startPolling();
}

async function newSession() {
  const data = await fetch(`/api/tenants/${TENANT}/os/${currentOS}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "New chat" }),
  }).then(r => r.json());
  await refreshSessions();
  openSession(data.id, data.title || "New chat");
}

function bindNewChat() {
  // Lazy: don't hit the DB here. Just reset UI state and wait for the user
  // to actually type something — sendMessage / openWizardInChat / etc. will
  // call newSession() on demand. Prevents empty "New chat" rows from piling
  // up in the sidebar every time someone clicks the button and walks away.
  $("#new-chat").addEventListener("click", () => {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    currentSession = null;
    lastMessageTs = null;
    clearMessages();
    $$(".session-item").forEach(el => el.classList.remove("active"));
    switchView("chat");
    showEmpty();
    const input = $("#input");
    if (input) { input.value = ""; input.focus(); }
  });
}

// ---------------- messages ----------------
function clearMessages() {
  $("#messages").innerHTML = "";
  renderedIds.clear();
  lastMessageTs = null;
  hideTypingIndicator();
}

// ---------------- "Working…" indicator ----------------
function showTypingIndicator() {
  if ($("#typing-indicator")) return;
  const wrap = document.createElement("div");
  wrap.id = "typing-indicator";
  wrap.className = "msg assistant";
  wrap.innerHTML = `
    <div class="typing">
      <span class="label">Working</span>
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    </div>`;
  $("#messages").appendChild(wrap);
  wrap.scrollIntoView({ behavior: "smooth", block: "end" });
  const send = $("#send");
  if (send) send.classList.add("busy");
}
function hideTypingIndicator() {
  const el = document.getElementById("typing-indicator");
  if (el) el.remove();
  const send = $("#send");
  if (send) send.classList.remove("busy");
}

function showMessagesPane() {
  $("#empty-state").hidden = true;
  $("#messages").hidden = false;
}
function showEmpty() {
  $("#empty-state").hidden = false;
  $("#messages").hidden = true;
}

function appendMessageEl(m) {
  // Dedupe — polls, the initial session fetch, and the post-send "late poll"
  // can all arrive with overlapping rows. Render each message at most once.
  if (m.id && renderedIds.has(m.id)) {
    // Still advance lastMessageTs so subsequent polls move forward.
    if (m.created_at && (!lastMessageTs || m.created_at > lastMessageTs)) {
      lastMessageTs = m.created_at;
    }
    return;
  }
  if (m.id) renderedIds.add(m.id);

  // Collapse consecutive identical tool traces. If the previous rendered
  // message was a tool trace with the same human label (e.g. "Updating a
  // lead's details" fired three times in a row while enriching a batch),
  // just bump a count badge on the existing row instead of spamming the
  // chat with duplicates.
  if (m.role === "tool") {
    const label = (m.content || "").trim();
    const msgs = $("#messages");
    // Last real message node, skipping the typing indicator if present.
    let prev = msgs.lastElementChild;
    while (prev && prev.id === "typing-indicator") prev = prev.previousElementSibling;
    if (prev && prev.classList.contains("tool") && prev.dataset.label === label) {
      let count = parseInt(prev.dataset.count || "1", 10) + 1;
      prev.dataset.count = String(count);
      let badge = prev.querySelector(".trace-count");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "trace-count";
        prev.querySelector(".bubble")?.appendChild(badge);
      }
      badge.textContent = ` ×${count}`;
      if (m.created_at) lastMessageTs = m.created_at;
      return;
    }
  }

  const el = document.createElement("div");
  el.className = `msg ${m.role}`;
  if (m.role === "tool") {
    el.dataset.label = (m.content || "").trim();
    el.dataset.count = "1";
  }

  // If this message carries an inline-widget attachment (wizard), render the
  // form directly and skip the bubble.
  const attachments = Array.isArray(m.attachments) ? m.attachments : [];
  const inlineWidget = attachments.find(a => a && a.kind === "inline-widget");
  if (inlineWidget && inlineWidget.widget_type === "wizard") {
    el.appendChild(renderWizardCard(inlineWidget.schema, inlineWidget.message_id || m.id));
  } else {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = m.content || "";
    el.appendChild(bubble);
  }
  $("#messages").appendChild(el);
  // Keep the typing indicator anchored at the bottom while it's visible —
  // otherwise user/tool/assistant messages appended later land ABOVE it.
  const typing = document.getElementById("typing-indicator");
  if (typing) $("#messages").appendChild(typing);
  el.scrollIntoView({ behavior: "smooth", block: "end" });
  if (m.created_at) lastMessageTs = m.created_at;
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    if (!currentSession) return;
    const url = `/api/sessions/${currentSession}/messages`
      + (lastMessageTs ? `?after=${encodeURIComponent(lastMessageTs)}` : "");
    const data = await fetch(url).then(r => r.json());
    for (const m of (data.messages || [])) appendMessageEl(m);
  }, 1500);
}

// ---------------- composer ----------------
function bindComposer() {
  $("#composer").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("#input");
    const text = input.value.trim();
    if (!text) return;
    if (!currentSession) await newSession();
    input.value = "";
    $("#send").disabled = true;
    showMessagesPane();
    await sendMessage(text);
    $("#send").disabled = false;
    input.focus();
  });
}

// Per-OS quick-action chips for the empty state. Keyed by OS technical id.
// Each entry: {label: shown on the chip, prompt: text injected into the composer}.
const QUICK_ACTIONS = {
  sales: [
    { label: "Outreach to top 2",
      prompt: "Score my enriched leads and send outreach to the top 2." },
    { label: "What's pending this week?",
      prompt: "What's pending in my pipeline this week?" },
    { label: "Source fintech VP Sales",
      prompt: "Source 3 VP Sales leads at UK fintechs and run the full pipeline." },
  ],
  brief: [
    { label: "Today's brief",
      prompt: "Give me today's brief." },
    { label: "Email me a morning brief",
      prompt: "Email me a morning brief." },
    { label: "Summarize my pipeline",
      prompt: "Summarize what's happening across the platform right now." },
  ],
};

function renderQuickActions() {
  const el = $("#quick-actions");
  if (!el) return;
  const actions = QUICK_ACTIONS[currentOS] || [];
  el.innerHTML = actions.map(a =>
    `<button class="quick" data-prompt="${escapeHtml(a.prompt)}">${escapeHtml(a.label)}</button>`
  ).join("");
}

function bindQuickActions() {
  // Delegate to the container so re-rendering on OS-switch keeps the binding.
  const el = $("#quick-actions");
  if (!el) return;
  el.addEventListener("click", (e) => {
    const btn = e.target.closest(".quick");
    if (!btn) return;
    $("#input").value = btn.dataset.prompt;
    $("#input").focus();
  });
}

async function sendMessage(content) {
  // Clear the composer input (the demo-step path calls sendMessage directly,
  // bypassing the composer submit handler that would otherwise clear it).
  const input = $("#input");
  if (input) input.value = "";
  // Show the typing indicator right away so the user sees progress while the
  // orchestrator is thinking. `appendMessageEl` will remove it the moment the
  // first non-user message lands; as a safety net we also clear it in finally.
  showTypingIndicator();
  try {
    const resp = await fetch(`/api/sessions/${currentSession}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!resp.body) return;

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        handleSseFrame(raw);
      }
    }
    // After the stream ends, one final poll for any late-persisted rows.
    const late = await fetch(
      `/api/sessions/${currentSession}/messages` +
        (lastMessageTs ? `?after=${encodeURIComponent(lastMessageTs)}` : "")
    ).then(r => r.json());
    for (const m of (late.messages || [])) appendMessageEl(m);
    // Refresh the sidebar so a newly-graduated session (created lazily this
    // turn, now renamed from its first brief) shows up with its real title.
    refreshSessions();
  } finally {
    hideTypingIndicator();
  }
}

function handleSseFrame(raw) {
  let event = "message";
  let data = null;
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) {
      try { data = JSON.parse(line.slice(5).trim()); } catch { data = null; }
    }
  }
  if (event === "end" || !data) return;
  // The orchestrator persists messages to DB; poll picks them up. We could
  // also render inline here, but relying on poll keeps one source of truth.
}

// ==================== Dashboard view ====================
function bindViewSwitcher() {
  $$(".view-item").forEach(el => {
    el.addEventListener("click", () => switchView(el.dataset.view));
  });
}
function bindDashboardRefresh() {
  const btn = $("#dash-refresh");
  if (btn) btn.addEventListener("click", () => loadDashboard());
}

function switchView(view) {
  currentView = view;
  $$(".view-item").forEach(el =>
    el.classList.toggle("active", el.dataset.view === view));
  document.body.classList.toggle("dashboard-active", view === "dashboard");
  document.body.classList.toggle("demo-active",      view === "demo");
  document.body.classList.toggle("operator-active",  view === "operator");
  $("#dashboard-pane").hidden = view !== "dashboard";
  const demoEl = $("#demo-pane");
  if (demoEl) demoEl.hidden = view !== "demo";
  const opEl = $("#operator-pane");
  if (opEl) opEl.hidden = view !== "operator";

  if (view === "dashboard") {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    loadDashboard();
    if (dashTimer) clearInterval(dashTimer);
    dashTimer = setInterval(loadDashboard, 5000);
  } else if (view === "demo") {
    if (pollTimer)  { clearInterval(pollTimer);  pollTimer  = null; }
    if (dashTimer)  { clearInterval(dashTimer);  dashTimer  = null; }
    renderDemo();
  } else if (view === "operator") {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (dashTimer) { clearInterval(dashTimer); dashTimer = null; }
    loadOperator();
    if (opTimer) clearInterval(opTimer);
    opTimer = setInterval(loadOperator, 8000);
  } else {
    if (dashTimer) { clearInterval(dashTimer); dashTimer = null; }
    if (opTimer)   { clearInterval(opTimer);   opTimer   = null; }
    if (currentSession) showMessagesPane(); else showEmpty();
  }
}

async function loadDashboard() {
  try {
    const d = await fetch(`/api/tenants/${TENANT}/os/${currentOS}/dashboard`)
      .then(r => r.json());
    renderDashboard(d);
  } catch (e) {
    console.error("dashboard load failed", e);
  }
}

// ==================== Operator view ====================
async function loadOperator() {
  try {
    // No tenant filter — show pitches across every tenant the operator runs.
    const d = await fetch(`/api/operator/pitches`).then(r => r.json());
    renderOperator(d);
    updateOperatorPitchPill(d.pitch_count || 0);
  } catch (e) {
    console.error("operator load failed", e);
  }
}

function updateOperatorPitchPill(count) {
  const pill = $("#op-pitch-pill");
  if (!pill) return;
  if (count > 0) {
    pill.textContent = String(count);
    pill.hidden = false;
  } else {
    pill.hidden = true;
  }
}

function renderOperator(d) {
  const tilesEl = $("#operator-tiles");
  if (tilesEl) {
    const tiles = [
      { label: "Open pitches", value: d.pitch_count ?? 0 },
      { label: "Tenants in scope", value: d.tenant_count ?? 0 },
    ];
    tilesEl.innerHTML = tiles.map(t => `
      <div class="tile">
        <div class="tile-label">${t.label}</div>
        <div class="tile-value">${escapeHtml(String(t.value))}</div>
      </div>
    `).join("");
  }

  const el = $("#operator-pitches");
  if (!el) return;
  const pitches = d.pitches || [];
  if (!pitches.length) {
    el.innerHTML = `<div class="dash-empty">
      No open pitches. Click <strong>↻ Re-scan all tenants</strong> to refresh, or wait for the daily scheduler.
    </div>`;
    return;
  }

  // Group pitches by tenant for the cross-tenant story.
  const byTenant = {};
  for (const p of pitches) {
    const k = p.tenant_id;
    (byTenant[k] = byTenant[k] || { tenant_id: k, tenant_display: p.tenant_display, items: [] })
      .items.push(p);
  }

  el.innerHTML = Object.values(byTenant).map(group => `
    <div class="op-tenant-group">
      <h3 class="op-tenant-name">${escapeHtml(group.tenant_display)}
        <span class="op-tenant-slug">${escapeHtml(group.tenant_id)}</span></h3>
      ${group.items.map(p => {
        const created = p.created_at ? new Date(p.created_at).toLocaleString() : "";
        const candidate = p.candidate_os
          ? `<span class="op-pill op-pill-${escapeHtml(p.candidate_status || "available")}">${escapeHtml(p.candidate_os)}</span>`
          : "";
        const leads = p.active_leads != null
          ? `<span class="op-meta">${p.active_leads} active leads</span>` : "";
        return `
          <div class="opp-card severity-${p.severity || "info"} op-card">
            <div class="opp-head">
              <div>
                <div class="opp-headline">${escapeHtml(p.headline || "")}</div>
                ${p.body ? `<div class="opp-body">${escapeHtml(p.body)}</div>` : ""}
                <div class="op-card-meta">${candidate} ${leads}
                  <span class="op-meta">${escapeHtml(created)}</span></div>
              </div>
              <button class="opp-dismiss" data-ack="${p.id}" title="Mark as pitched">×</button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `).join("");

  // Reuse the existing acknowledge endpoint — same shape as customer dashboards.
  $$("#operator-pitches .opp-dismiss").forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      await fetch(`/api/opportunities/${btn.dataset.ack}/acknowledge`,
                  { method: "POST" });
      loadOperator();
    });
  });
}

function bindOperatorRefresh() {
  const btn = $("#operator-refresh");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Scanning…";
    try {
      await fetch(`/api/operator/scan`, { method: "POST" });
      await loadOperator();
    } finally {
      btn.disabled = false;
      btn.textContent = "↻ Re-scan all tenants";
    }
  });
}

function renderDashboard(d) {
  const osName = d.os?.name;
  if (osName === "brief") {
    renderBriefDashboard(d);
    return;
  }
  renderTiles(d);
  renderOpportunities(d.opportunities || []);
  renderGoals(d.goals || []);
  renderBudgets(d.budgets || []);
  renderTopScored(d.top_scored || []);
  renderScheduledCadence(d.scheduled_cadence || []);
  renderRecentInbound(d.recent_inbound || []);
  renderRecentOutreach(d.recent_outreach || []);
}

// ---------- Brief OS dashboard (small, demo-grade) ----------
function renderBriefDashboard(d) {
  // Tiles tailored to the brief OS payload shape.
  renderBriefTiles(d.tiles || {});
  // Reuse the cross-OS opportunities card.
  renderOpportunities(d.opportunities || []);
  // Empty out the sales-only sections so a sales→brief switch doesn't leave
  // stale lead rows on screen.
  ["dash-goals", "dash-budgets", "dash-top", "dash-cadence",
   "dash-inbound", "dash-recent"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });
  renderRecentBriefs(d.recent_briefs || []);
}

function renderBriefTiles(tiles) {
  const last = tiles.last_generated_at
    ? new Date(tiles.last_generated_at).toLocaleString()
    : "—";
  const cards = [
    { label: "Briefs generated", value: tiles.total_briefs ?? 0 },
    { label: "Last brief",       value: last,                    small: true },
    { label: "Emailed (recent)", value: tiles.emailed_recent ?? 0,
      sub: "out of last 5" },
  ];
  const el = $("#dash-tiles");
  el.innerHTML = cards.map(t => `
    <div class="tile">
      <div class="tile-label">${t.label}</div>
      <div class="tile-value${t.small ? " tile-value-small" : ""}">${escapeHtml(String(t.value))}</div>
      ${t.sub ? `<div class="tile-sub">${escapeHtml(t.sub)}</div>` : ""}
    </div>
  `).join("");
}

function renderRecentBriefs(items) {
  // Repurpose the dash-recent slot that Sales OS uses for outreach.
  const el = $("#dash-recent");
  if (!el) return;
  if (!items.length) {
    el.innerHTML = `<h3>Recent briefs</h3>
      <div class="dash-empty">No briefs yet — type "give me today's brief" to generate the first one.</div>`;
    return;
  }
  el.innerHTML = `
    <h3>Recent briefs (${items.length})</h3>
    ${items.map(b => {
      const when = new Date(b.generated_at).toLocaleString();
      const sections = (b.sections || []).join(" · ");
      const emailNote = b.emailed_to
        ? `<span class="brief-emailed" title="Emailed to ${escapeHtml(b.emailed_to)}">✉</span>`
        : "";
      return `
        <div class="brief-row">
          <div class="brief-when">${escapeHtml(when)} ${emailNote}</div>
          <div class="brief-sections">${escapeHtml(sections)}</div>
          <div class="brief-preview">${escapeHtml(b.preview || "")}</div>
        </div>
      `;
    }).join("")}
  `;
}

function renderScheduledCadence(items) {
  const el = $("#dash-cadence");
  if (!items.length) { el.innerHTML = ""; return; }
  const patternLabel = { bump: "Bump", value: "Value", break_up: "Break-up" };
  el.innerHTML = `
    <h3>Scheduled follow-ups (${items.length})</h3>
    ${items.map(s => {
      const when = new Date(s.scheduled_for);
      const nowish = Math.round((when - new Date()) / 36e5);
      const whenTxt = nowish >= 24
        ? `in ${Math.round(nowish/24)} day${Math.round(nowish/24)===1?"":"s"}`
        : nowish > 0 ? `in ${nowish}h` : "due now";
      const name = s.lead_name || "(unknown lead)";
      const co = s.lead_company ? ` @ ${escapeHtml(s.lead_company)}` : "";
      const label = patternLabel[s.pattern] || s.pattern;
      return `
        <div class="lead-row" style="grid-template-columns: 30px 2fr 1fr 100px">
          <div style="font-weight:600;color:var(--ink-soft)">#${s.touch_number}</div>
          <div><strong>${escapeHtml(name)}</strong>${co}</div>
          <div class="lead-company">${escapeHtml(label)} · ${escapeHtml(s.channel)}</div>
          <div style="font-size:11px;color:var(--ink-soft);text-align:right">${whenTxt}</div>
        </div>
      `;
    }).join("")}
  `;
}

function renderTiles(d) {
  const f = d.lead_funnel || {};
  const total = Object.values(f).reduce((a, b) => a + (b || 0), 0);
  const tiles = [
    { label: "Total leads",    value: total },
    { label: "Contacted",      value: f.contacted || 0 },
    { label: "Inbound replies",value: d.inbound_total || 0, sub: "lifetime" },
    { label: "Replied",        value: f.replied || 0 },
    { label: "Meetings booked",value: f.meeting_booked || 0, sub: "lifetime" },
    { label: "Disqualified",   value: f.disqualified || 0 },
  ];
  const el = $("#dash-tiles");
  el.innerHTML = tiles.map(t => `
    <div class="tile">
      <div class="tile-label">${t.label}</div>
      <div class="tile-value">${t.value}</div>
      ${t.sub ? `<div class="tile-sub">${t.sub}</div>` : ""}
    </div>
  `).join("");
}

function renderOpportunities(opps) {
  const el = $("#dash-opps");
  if (!opps.length) { el.innerHTML = ""; return; }
  el.innerHTML = opps.map(o => {
    const remedies = (o.payload?.remedies || []);
    return `
      <div class="opp-card severity-${o.severity || "info"}">
        <div class="opp-head">
          <div>
            <div class="opp-headline">${escapeHtml(o.headline || "")}</div>
            ${o.body ? `<div class="opp-body">${escapeHtml(o.body)}</div>` : ""}
          </div>
          <button class="opp-dismiss" data-ack="${o.id}" title="Dismiss">×</button>
        </div>
        <div class="opp-actions">
          ${remedies.map((r, i) => `
            <button class="opp-action-btn ${i === 0 ? "primary" : ""}"
                    data-opp-id="${o.id}"
                    data-remedy="${escapeHtml(JSON.stringify(r))}">${escapeHtml(r.label || r.action || "Action")}</button>
          `).join("")}
          ${remedies.length === 0
            ? `<button class="opp-action-btn primary" data-opp-id="${o.id}"
                       data-prompt="${escapeHtml(o.headline || "")}">Ask the chat about this</button>`
            : ""}
        </div>
      </div>
    `;
  }).join("");

  // Wire dismiss + action clicks
  $$("#dash-opps .opp-dismiss").forEach(btn => {
    btn.addEventListener("click", async () => {
      await fetch(`/api/opportunities/${btn.dataset.ack}/acknowledge`, { method: "POST" });
      loadDashboard();
    });
  });
  $$("#dash-opps .opp-action-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const prompt = btn.dataset.prompt || remedyToPrompt(btn.dataset.remedy, btn.textContent);
      if (!prompt) return;
      // Flip to chat, ensure a session, send the message.
      switchView("chat");
      if (!currentSession) await newSession();
      $("#input").value = prompt;
      $("#composer").dispatchEvent(new Event("submit"));
      // Optimistically ack the opportunity now
      if (btn.dataset.oppId) {
        fetch(`/api/opportunities/${btn.dataset.oppId}/acknowledge`, { method: "POST" });
      }
    });
  });
}

function remedyToPrompt(rawJson, fallback) {
  // Translate a structured remedy into a natural-language chat message.
  try {
    const r = JSON.parse(rawJson);
    const action = r.action || "";
    if (action === "increase_daily_pace") return "Push outreach harder this week — boost the daily pace by ~50%.";
    if (action === "adjust_goal") return "Revisit the goal — it's looking unrealistic. Lower it based on current pace.";
    if (action === "pause_outreach") return "Pause non-essential outreach for this tenant until I say resume.";
    if (action === "shift_channel") {
      const away = r.args?.away_from || "the current channel";
      return `We're running out of ${away}. Shift focus to other channels — prioritize what's still available.`;
    }
    if (action === "override_pacing_once") return "Override pacing for this run — push through the throttle.";
    if (action === "open_url") return null;       // don't trigger a chat for pure links
    return fallback ? `Handle this: ${fallback}` : null;
  } catch {
    return null;
  }
}

function renderGoals(goals) {
  const el = $("#dash-goals");
  if (!goals.length) { el.innerHTML = ""; return; }
  el.innerHTML = `
    <h3>Goals & pacing</h3>
    ${goals.map(g => {
      const status = g.status || "on_pace";
      const progress = g.target_value > 0 ? (g.current_value / g.target_value) * 100 : 0;
      return `
        <div class="goal-row">
          <div class="goal-label">
            <strong>${escapeHtml(g.metric_name)}</strong>
            — ${Math.round(g.current_value)} / ${Math.round(g.target_value)}
            (${progress.toFixed(0)}%)
            ${g.days_remaining != null ? ` · ${g.days_remaining} day${g.days_remaining===1?"":"s"} left` : ""}
          </div>
          <div class="goal-status ${status}">${status.replace(/_/g, " ")}</div>
        </div>
      `;
    }).join("")}
  `;
}

function renderBudgets(budgets) {
  const el = $("#dash-budgets");
  if (!budgets.length) { el.innerHTML = ""; return; }
  el.innerHTML = `
    <h3>External budgets (this period)</h3>
    ${budgets.map(b => {
      const pct = (b.pct || 0) * 100;
      const cls = pct >= 90 ? "crit" : (pct >= 80 ? "warn" : "");
      return `
        <div class="budget-row">
          <div class="budget-name">${escapeHtml(b.resource_key)} <span style="color:var(--ink-soft);font-size:11px">(${b.period})</span></div>
          <div class="budget-bar-outer">
            <div class="budget-bar-inner ${cls}" style="width: ${Math.min(100, pct)}%"></div>
          </div>
          <div class="budget-pct">${Math.round(b.consumed)} / ${Math.round(b.limit_value)}</div>
        </div>
      `;
    }).join("")}
  `;
}

function renderTopScored(leads) {
  const el = $("#dash-top");
  if (!leads.length) { el.innerHTML = ""; return; }
  el.innerHTML = `
    <h3>Top-scored leads</h3>
    ${leads.map(l => `
      <div class="lead-row">
        <div class="lead-name">${escapeHtml(l.name || "?")}</div>
        <div class="lead-company">${escapeHtml(l.company || "")}</div>
        <div class="lead-score">${l.score != null ? l.score : "—"}</div>
        <div class="lead-status ${l.status}">${escapeHtml((l.status||"").replace(/_/g, " "))}</div>
      </div>
    `).join("")}
  `;
}

function renderRecentInbound(items) {
  const el = $("#dash-inbound");
  if (!items.length) { el.innerHTML = ""; return; }
  el.innerHTML = `
    <h3>Recent inbound</h3>
    ${items.map(o => `
      <div class="outreach-row">
        <div>${escapeHtml((o.channel || "").toUpperCase())}</div>
        <div><strong>${escapeHtml(o.original_target || "?")}</strong>  <span class="outreach-target">${escapeHtml((o.subject || "").slice(0, 60))}</span></div>
        <div style="font-size:11px;color:var(--ink-soft)">${new Date(o.ts).toLocaleString()}</div>
        <div class="outreach-status ${o.status}">${escapeHtml(o.status || "")}</div>
      </div>
    `).join("")}
  `;
}

function renderRecentOutreach(items) {
  const el = $("#dash-recent");
  // filter OUT inbound — inbound has its own section
  items = items.filter(o => (o.direction || "outbound") !== "inbound");
  if (!items.length) { el.innerHTML = ""; return; }
  el.innerHTML = `
    <h3>Recent outreach</h3>
    ${items.map(o => {
      const targetNote = o.sandbox
        ? `→ ${escapeHtml(o.dispatched_to || "")} <span class="outreach-target">(sandbox; real: ${escapeHtml(o.original_target || "—")})</span>`
        : `→ ${escapeHtml(o.dispatched_to || "")}`;
      return `
        <div class="outreach-row">
          <div>${escapeHtml((o.channel || "").toUpperCase())}</div>
          <div>${targetNote}</div>
          <div style="font-size:11px;color:var(--ink-soft)">${new Date(o.ts).toLocaleString()}</div>
          <div class="outreach-status ${o.status}">${escapeHtml(o.status || "")}</div>
        </div>
      `;
    }).join("")}
  `;
}

// ==================== Inline wizard (config edit in chat) ====================
function bindEditConfig() {
  const btn = $("#edit-config");
  if (btn) btn.addEventListener("click", async () => openWizardInChat());
}

async function openWizardInChat() {
  // Ensure we have a session to anchor the wizard message to.
  if (!currentSession) await newSession();
  // Force chat view
  switchView("chat");
  showMessagesPane();

  const schema = await fetch(`/api/wizards/${currentOS}/schema?tenant=${TENANT}`)
    .then(r => r.json());

  // Render the wizard inline as an ephemeral (not-yet-persisted) message.
  // On submit we save it, and the server posts the confirmation message.
  const el = document.createElement("div");
  el.className = "msg system";
  el.appendChild(renderWizardCard(schema));
  $("#messages").appendChild(el);
  el.scrollIntoView({ behavior: "smooth", block: "end" });
}

function renderWizardCard(schema, anchorId = null) {
  // Working copy of current values — starts from schema.current_values.
  // Form inputs mutate this object directly.
  const working = structuredClone(schema.current_values || {});

  const card = document.createElement("div");
  card.className = "wizard-card";

  const header = document.createElement("h3");
  header.textContent = schema.active_version
    ? `Edit ${schema.title}  (active: v${schema.active_version})`
    : `Set up ${schema.title}`;
  card.appendChild(header);

  for (const step of schema.steps || []) {
    const section = document.createElement("div");
    section.className = "wizard-step";
    const h4 = document.createElement("h4");
    h4.textContent = step.title;
    section.appendChild(h4);

    // Scratch-pad for this step's values
    working[step.id] = working[step.id] || {};
    const stepVals = working[step.id];

    for (const f of step.fields_basic || []) {
      section.appendChild(renderField(f, stepVals));
    }
    if ((step.fields_advanced || []).length) {
      const adv = document.createElement("div");
      adv.className = "wiz-advanced";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "wiz-advanced-toggle";
      toggle.textContent = `▸ ${step.fields_advanced.length} advanced field${step.fields_advanced.length!==1?"s":""}`;
      const body = document.createElement("div");
      body.style.display = "none";
      for (const f of step.fields_advanced) body.appendChild(renderField(f, stepVals));
      toggle.addEventListener("click", () => {
        const open = body.style.display === "none";
        body.style.display = open ? "" : "none";
        toggle.textContent = (open ? "▾ " : "▸ ")
          + `${step.fields_advanced.length} advanced field${step.fields_advanced.length!==1?"s":""}`;
      });
      adv.appendChild(toggle);
      adv.appendChild(body);
      section.appendChild(adv);
    }
    card.appendChild(section);
  }

  const errors = document.createElement("div");
  errors.className = "wiz-errors";
  errors.hidden = true;
  card.appendChild(errors);

  const actions = document.createElement("div");
  actions.className = "wiz-actions";
  const cancel = document.createElement("button");
  cancel.className = "opp-action-btn";
  cancel.type = "button";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", () => card.remove());
  const save = document.createElement("button");
  save.className = "opp-action-btn primary";
  save.type = "button";
  save.textContent = "Save as new version";
  save.addEventListener("click", async () => {
    save.disabled = true;
    errors.hidden = true;
    // The auto-fired wizard (no session yet) needs one for the submit endpoint.
    // Lazily create on save so abandoning the form doesn't litter the sidebar.
    if (!currentSession) await newSession();
    const resp = await fetch(`/api/sessions/${currentSession}/wizard/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        os_name: schema.os_name,
        values:  working,
        change_note: "Edit via chat wizard",
      }),
    }).then(r => r.json());
    if (resp.ok === false) {
      errors.innerHTML = "<ul>" + resp.errors.map(e =>
        `<li><strong>${escapeHtml(e.loc)}</strong> — ${escapeHtml(e.msg)}</li>`).join("") + "</ul>";
      errors.hidden = false;
      save.disabled = false;
      return;
    }
    // Saved. Card becomes read-only; confirmation message lands via polling.
    card.style.opacity = "0.6";
    save.textContent = `Saved as v${resp.version_number}`;
    cancel.hidden = true;
  });
  actions.appendChild(cancel);
  actions.appendChild(save);
  card.appendChild(actions);

  return card;
}

function renderField(f, values) {
  const wrap = document.createElement("div");
  wrap.className = "wiz-field";

  const label = document.createElement("label");
  label.textContent = f.title + (f.required ? " *" : "");
  wrap.appendChild(label);
  if (f.help) {
    const h = document.createElement("div");
    h.className = "help";
    h.textContent = f.help;
    wrap.appendChild(h);
  }

  const current = values[f.name] !== undefined ? values[f.name] : f.default;

  switch (f.widget) {
    case "text":
    case "url":
    case "image-upload":
    case "voice-record": {
      const i = document.createElement("input");
      i.type = f.widget === "url" ? "url" : "text";
      i.value = current ?? "";
      if (f.examples?.length) i.placeholder = String(f.examples[0]);
      i.addEventListener("input", () => values[f.name] = i.value || null);
      wrap.appendChild(i);
      break;
    }
    case "number": {
      const i = document.createElement("input");
      i.type = "number";
      if (current !== null && current !== undefined) i.value = current;
      i.addEventListener("input", () => {
        values[f.name] = i.value === "" ? null
          : (f.type === "int" ? parseInt(i.value, 10) : parseFloat(i.value));
      });
      wrap.appendChild(i);
      break;
    }
    case "toggle": {
      const i = document.createElement("input");
      i.type = "checkbox";
      i.checked = !!current;
      i.style.width = "auto";
      i.addEventListener("change", () => values[f.name] = i.checked);
      wrap.appendChild(i);
      break;
    }
    case "select": {
      const s = document.createElement("select");
      const blank = document.createElement("option");
      blank.value = ""; blank.textContent = "— pick one —";
      s.appendChild(blank);
      for (const opt of (f.options || [])) {
        const o = document.createElement("option");
        o.value = opt; o.textContent = opt;
        if (opt === current) o.selected = true;
        s.appendChild(o);
      }
      s.addEventListener("change", () => values[f.name] = s.value || null);
      wrap.appendChild(s);
      break;
    }
    case "multi-select": {
      const checks = document.createElement("div");
      checks.className = "checks";
      const cur = new Set(Array.isArray(current) ? current : []);
      for (const opt of (f.options || [])) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "check" + (cur.has(opt) ? " on" : "");
        b.textContent = opt;
        b.addEventListener("click", () => {
          if (cur.has(opt)) cur.delete(opt); else cur.add(opt);
          b.classList.toggle("on");
          values[f.name] = [...cur];
        });
        checks.appendChild(b);
      }
      // Ensure initial value is set even without clicks
      values[f.name] = [...cur];
      wrap.appendChild(checks);
      break;
    }
    case "tag-list":
    case "link-list": {
      const chips = document.createElement("div");
      chips.className = "chips";
      const list = Array.isArray(current) ? [...current] : [];
      values[f.name] = list;

      const renderChips = () => {
        chips.innerHTML = "";
        list.forEach((v, idx) => {
          const c = document.createElement("span");
          c.className = "chip";
          c.innerHTML = `${escapeHtml(v)} <span class="remove" title="remove">×</span>`;
          c.querySelector(".remove").addEventListener("click", () => {
            list.splice(idx, 1);
            values[f.name] = list;
            renderChips();
          });
          chips.appendChild(c);
        });
        const input = document.createElement("input");
        input.className = "chip-input";
        input.placeholder = f.examples?.length ? `e.g. ${f.examples[0]}` : "type + Enter";
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || (e.key === "," && f.widget === "tag-list")) {
            e.preventDefault();
            const v = input.value.trim();
            if (v) { list.push(v); values[f.name] = list; input.value = ""; renderChips(); input.focus(); }
          }
        });
        chips.appendChild(input);
      };
      renderChips();
      wrap.appendChild(chips);
      break;
    }
    default: {
      const d = document.createElement("div");
      d.textContent = `(unsupported widget: ${f.widget})`;
      d.style.color = "var(--ink-soft)";
      wrap.appendChild(d);
    }
  }

  return wrap;
}

// ==================== Guided demo ====================
// Step catalog. `kind` determines how the runner executes:
//   "api"  → POST to /api/demo/<endpoint> with a body
//   "chat" → open/create a session, send a brief, wait for result
//   "note" → show an instruction; user marks done manually
const DEMO_STEPS = [
  // ── A. Start fresh ───────────────────────────────────────────────────
  { id: "a1", category: "Start fresh",
    title: "Reset the tenant",
    detail: "Wipes leads, chat, events, alerts. Preserves config + audit_events. Destructive — double-click to confirm.",
    kind: "api", endpoint: "/api/demo/reset",
    body: () => ({ tenant: TENANT, confirm: true }),
    btn: "Reset", btnClass: "danger", needsConfirm: true },

  { id: "a2", category: "Start fresh",
    title: "Seed 3 enriched leads",
    detail: "Inserts Alex, Priya, Nathan with rich enrichment. Idempotent (clear+insert).",
    kind: "api", endpoint: "/api/demo/seed",
    body: () => ({ tenant: TENANT, clear: true }),
    btn: "Seed" },

  // ── B. First end-to-end run ──────────────────────────────────────────
  { id: "b1", category: "First end-to-end run",
    title: "Score + send outreach to top 2",
    detail: "Classifier routes to lead_scorer → bdr_outbound. Real emails go to avifszt@gmail.com (sandboxed).",
    kind: "chat",
    brief: "Score my enriched leads. Then send outreach to the top 2.",
    btn: "Run" },

  { id: "b2", category: "First end-to-end run",
    title: "Check the Dashboard",
    detail: "Open Dashboard view — tiles update, cadence queued (6 entries), outreach rows with sandbox flag.",
    kind: "note",
    action: () => switchView("dashboard"),
    btn: "Open" },

  // ── C. Customize via inline wizard ───────────────────────────────────
  { id: "c1", category: "Customize",
    title: "Edit config in chat",
    detail: "Opens the wizard inline as a chat message. Change tone or ICP, click 'Save as new version'.",
    kind: "note",
    action: () => openWizardInChat(),
    btn: "Open wizard" },

  // ── D. Inbound reply loop ────────────────────────────────────────────
  { id: "d1", category: "Inbound reply loop",
    title: "Simulate a positive reply from Alex",
    detail: "POST to /api/webhooks/inbound. SDR qualifies, drafts a reply, and Alex flips to meeting_booked. His pending follow-ups get auto-cancelled.",
    kind: "api", endpoint: "/api/demo/inbound-sample",
    body: () => ({ tenant: TENANT, lead_name: "Alex", positive: true }),
    btn: "Send reply" },

  { id: "d2", category: "Inbound reply loop",
    title: "Simulate a negative reply from Priya",
    detail: "Objection-style reply. SDR handles gracefully (no re-pitch), marks Priya disqualified-for-now, cancels cadence.",
    kind: "api", endpoint: "/api/demo/inbound-sample",
    body: () => ({ tenant: TENANT, lead_name: "Priya", positive: false }),
    btn: "Send reply" },

  // ── E. Meta-OS signals ────────────────────────────────────────────
  { id: "e1", category: "Meta-OS signals",
    title: "Run opportunity digest",
    detail: "Fires the 4 built-in pattern scanners. Any new opportunities appear as cards on the Dashboard + in the orchestrator's next chat reply.",
    kind: "api", endpoint: "/api/demo/meta-digest",
    body: () => ({ tenant: TENANT }),
    btn: "Run digest" },

  // ── F. Phase 3 deep dive ─────────────────────────────────────────
  { id: "f1", category: "Phase 3: pre-classifier",
    title: "Info-only brief → no subagents",
    detail: "Classifier recognizes pure info questions and answers directly from state, without dispatching subagents.",
    kind: "chat",
    brief: "How many contacted leads do I have in the pipeline?",
    btn: "Run" },

  { id: "f2", category: "Phase 3: pre-classifier",
    title: "Ambiguous brief → clarification",
    detail: "Classifier detects ambiguity and asks ONE question back. No expensive orchestrator run.",
    kind: "chat",
    brief: "Do something useful with my pipeline.",
    btn: "Run" },

  { id: "f3", category: "Phase 3: voice + channel picker",
    title: "Voice outbound via LiveKit",
    detail: "BDR calls pick_channel first (phone present + US geo → voice). place_call creates a LiveKit room + warm-dial URL.",
    kind: "chat",
    brief: "Take a VP Sales lead named Nicholas Reynolds, phone +15551239999, email nick@acmepay.io, location San Francisco, company AcmePay. Source, score, and voice-call him.",
    btn: "Run" },

  // ── G. Snapshot ──────────────────────────────────────────────────
  { id: "g1", category: "Snapshot",
    title: "Export tenant state as JSON",
    detail: "Writes ./snapshots/<tenant>-<ts>.json with leads, chat, outreach, budgets, configs. Downloadable.",
    kind: "api", endpoint: "/api/demo/snapshot",
    body: () => ({ tenant: TENANT }),
    btn: "Snapshot" },
];

function demoProgressKey() { return `demo_progress_v1:${TENANT}:${currentOS}`; }
function loadDemoState() {
  try { return JSON.parse(localStorage.getItem(demoProgressKey()) || "{}"); }
  catch { return {}; }
}
function saveDemoState(s) { localStorage.setItem(demoProgressKey(), JSON.stringify(s)); }
function clearDemoState() { localStorage.removeItem(demoProgressKey()); }

function refreshDemoProgressPill() {
  const state = loadDemoState();
  const done = DEMO_STEPS.filter(s => (state[s.id] || {}).status === "done").length;
  const pill = $("#demo-progress-pill");
  if (!pill) return;
  if (done > 0) { pill.textContent = `${done}/${DEMO_STEPS.length}`; pill.hidden = false; }
  else pill.hidden = true;
}

function renderDemo() {
  const el = $("#demo-steps");
  if (!el) return;
  const state = loadDemoState();
  el.innerHTML = "";
  let lastCat = null;
  DEMO_STEPS.forEach((s, idx) => {
    if (s.category !== lastCat) {
      const h = document.createElement("div");
      h.className = "demo-category";
      h.textContent = s.category;
      el.appendChild(h);
      lastCat = s.category;
    }
    const row = document.createElement("div");
    const st = (state[s.id] || {}).status || "pending";
    row.className = `demo-step status-${st}`;
    const badgeSymbol = st === "done" ? "✓" : st === "running" ? "⟳" : st === "failed" ? "!" : String(idx + 1);
    const resultHtml = (state[s.id] && state[s.id].note)
      ? `<div class="result">${escapeHtml(state[s.id].note)}</div>` : "";
    row.innerHTML = `
      <div class="demo-badge">${badgeSymbol}</div>
      <div>
        <div class="title">${escapeHtml(s.title)}</div>
        <div class="detail">${escapeHtml(s.detail)}</div>
        ${resultHtml}
      </div>
      <div>
        <button class="demo-run-btn ${s.btnClass || ''}" data-step="${s.id}" ${st==='running'?'disabled':''}>
          ${st === "done" ? "Rerun" : (s.btn || "Run")}
        </button>
      </div>
    `;
    el.appendChild(row);
  });
  // Wire clicks
  for (const btn of $$(".demo-run-btn[data-step]")) {
    btn.addEventListener("click", () => runDemoStep(btn.dataset.step, btn));
  }
  // Progress bar
  const done = DEMO_STEPS.filter(s => (state[s.id] || {}).status === "done").length;
  const pct = Math.round((done / DEMO_STEPS.length) * 100);
  $("#demo-progress-fill").style.width = `${pct}%`;
  refreshDemoProgressPill();
}

async function runDemoStep(stepId, btn) {
  const step = DEMO_STEPS.find(s => s.id === stepId);
  if (!step) return;
  const state = loadDemoState();

  // Destructive-step double-click confirmation
  if (step.needsConfirm && !btn.dataset.armed) {
    btn.dataset.armed = "1";
    const orig = btn.textContent;
    btn.textContent = "Click again to confirm";
    setTimeout(() => { if (btn.dataset.armed) { btn.textContent = orig; delete btn.dataset.armed; } }, 4000);
    return;
  }
  delete btn.dataset.armed;

  state[step.id] = { status: "running", note: "" };
  saveDemoState(state);
  renderDemo();

  try {
    if (step.kind === "api") {
      const resp = await fetch(step.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(step.body ? step.body() : {}),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.detail || `HTTP ${resp.status}`);
      state[step.id] = { status: "done", note: summarizeApi(step, data) };

    } else if (step.kind === "chat") {
      // Switch to chat, ensure a fresh session named after the step
      switchView("chat");
      await newSession();
      showMessagesPane();
      $("#input").value = step.brief;
      await sendMessage(step.brief);
      state[step.id] = { status: "done", note: "Brief dispatched — watch the Chat view." };

    } else if (step.kind === "note") {
      if (step.action) await step.action();
      state[step.id] = { status: "done", note: "" };
    }
  } catch (e) {
    state[step.id] = { status: "failed", note: String(e).slice(0, 300) };
  }
  saveDemoState(state);
  renderDemo();
}

function summarizeApi(step, data) {
  if (step.id === "a1") return "operational state wiped, config preserved";
  if (step.id === "a2") return `seeded ${data.seeded} leads`;
  if (step.id === "d1" || step.id === "d2") {
    return `from=${data.from} cancelled_follow_ups=${data.cancelled_follow_ups ?? 0}`;
  }
  if (step.id === "e1") return `${data.new_reports} new report(s)`;
  if (step.id === "g1") {
    const link = data.download ? ` · <a href="${data.download}" target="_blank">download</a>` : "";
    return `wrote ${data.filename} (${data.size_kb} KB); ${data.leads} leads, ${data.messages} messages${link}`;
  }
  return JSON.stringify(data).slice(0, 200);
}

function bindDemoControls() {
  $("#demo-reset-progress")?.addEventListener("click", () => {
    clearDemoState();
    renderDemo();
  });
}

bindDemoControls();
refreshDemoProgressPill();

boot();
