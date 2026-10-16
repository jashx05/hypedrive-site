const STATUS_ORDER = { green: 0, orange: 1, red: 2 };
const REFRESH_MS = 60_000;
const STALE_AFTER_HOURS = 36;

const usersGrid = document.getElementById('users-grid');
const refreshButton = document.getElementById('refresh-button');
const globalState = document.getElementById('global-state');
const globalStateLabel = document.getElementById('global-state-label');
const pageUpdated = document.getElementById('page-updated');

function normalizeStatus(value) {
  return ['green', 'orange', 'red'].includes(value) ? value : 'orange';
}

function worstStatus(values) {
  return values
    .map(normalizeStatus)
    .sort((a, b) => STATUS_ORDER[b] - STATUS_ORDER[a])[0] || 'orange';
}

function isStale(checkedAt) {
  if (!checkedAt) return true;
  const timestamp = Date.parse(checkedAt);
  if (Number.isNaN(timestamp)) return true;
  return (Date.now() - timestamp) > STALE_AFTER_HOURS * 60 * 60 * 1000;
}

function formatDateTime(value) {
  if (!value) return 'Mai';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data non valida';
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function serviceMeta(service) {
  if (!service) return '';

  if (Number.isFinite(service.days_until_expiry)) {
    if (service.days_until_expiry < 0) return 'Consenso scaduto';
    return `Scadenza consenso: ${service.days_until_expiry} giorni`;
  }

  if (service.last_success) {
    return `Ultimo successo: ${formatDateTime(service.last_success)}`;
  }

  if (service.detail) return service.detail;
  return '';
}

function createService(service = {}) {
  const status = normalizeStatus(service.status);
  const block = document.createElement('div');
  block.className = `service status-${status}`;

  const top = document.createElement('div');
  top.className = 'service-top';

  const label = document.createElement('span');
  label.className = 'service-label';
  label.textContent = service.label || 'Servizio';

  const dot = document.createElement('span');
  dot.className = 'service-status-dot';
  dot.setAttribute('aria-label', status);

  top.append(label, dot);

  const message = document.createElement('p');
  message.className = 'service-message';
  message.textContent = service.message || 'Nessun dettaglio disponibile.';

  block.append(top, message);

  const metaText = serviceMeta(service);
  if (metaText) {
    const meta = document.createElement('span');
    meta.className = 'service-meta';
    meta.textContent = metaText;
    block.append(meta);
  }

  return block;
}

function computedUserStatus(data) {
  const declared = normalizeStatus(data.overall);
  const serviceStatuses = Object.values(data.services || {}).map(service => service.status);
  let result = worstStatus([declared, ...serviceStatuses]);

  // Se il server non aggiorna più il JSON, il dashboard deve segnalarlo anche
  // se l'ultimo valore pubblicato era verde.
  if (isStale(data.checked_at) && result === 'green') {
    result = 'orange';
  }

  return result;
}

function createUserCard(data) {
  const status = computedUserStatus(data);
  const card = document.createElement('article');
  card.className = `user-card status-${status}`;

  const head = document.createElement('div');
  head.className = 'user-card-head';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'user-title';

  const title = document.createElement('h3');
  title.className = 'user-name';
  title.textContent = data.display_name || data.user_id || 'Ambiente';

  const message = document.createElement('p');
  message.className = 'user-message';
  message.textContent = isStale(data.checked_at)
    ? 'Stato non aggiornato di recente: controllare il monitor VPS.'
    : (data.overall_message || 'Stato disponibile.');

  titleWrap.append(title, message);

  const badge = document.createElement('span');
  badge.className = `badge status-${status}`;
  badge.textContent = status === 'green'
    ? 'Operativo'
    : status === 'red'
      ? 'Intervento'
      : 'Attenzione';

  head.append(titleWrap, badge);
  card.append(head);

  const servicesWrap = document.createElement('div');
  servicesWrap.className = 'services';

  const preferredOrder = ['hype', 'google_drive', 'monthly_export', 'automation', 'server'];
  const services = data.services || {};

  preferredOrder.forEach(key => {
    if (services[key]) servicesWrap.append(createService(services[key]));
  });

  Object.keys(services)
    .filter(key => !preferredOrder.includes(key))
    .forEach(key => servicesWrap.append(createService(services[key])));

  if (!servicesWrap.children.length) {
    servicesWrap.append(createService({
      status: 'orange',
      label: 'Monitoring',
      message: 'Nessun servizio pubblicato.',
    }));
  }

  card.append(servicesWrap);

  const footer = document.createElement('div');
  footer.className = 'user-card-footer';

  const checked = document.createElement('span');
  checked.className = 'checked-at';
  checked.textContent = `Ultimo controllo: ${formatDateTime(data.checked_at)}`;

  const sync = document.createElement('span');
  sync.className = 'sync-pill';
  const period = data.last_sync?.period ? ` · ${data.last_sync.period}` : '';
  sync.textContent = `Ultimo export: ${formatDateTime(data.last_sync?.at)}${period}`;

  footer.append(checked, sync);

  if (Array.isArray(data.alerts) && data.alerts.length) {
    const alerts = document.createElement('div');
    alerts.className = 'alert-list';

    data.alerts.forEach(item => {
      const alert = document.createElement('div');
      const severity = normalizeStatus(item.severity || 'orange');
      alert.className = `alert ${severity === 'red' ? 'severity-red' : ''}`;
      alert.textContent = item.message || 'Attenzione richiesta.';
      alerts.append(alert);
    });

    footer.append(alerts);
  }

  card.append(footer);
  return { card, status };
}

function renderSummary(statuses) {
  const totals = { green: 0, orange: 0, red: 0 };
  statuses.forEach(status => totals[normalizeStatus(status)]++);

  document.getElementById('summary-users').textContent = String(statuses.length);
  document.getElementById('summary-green').textContent = String(totals.green);
  document.getElementById('summary-orange').textContent = String(totals.orange);
  document.getElementById('summary-red').textContent = String(totals.red);

  const global = worstStatus(statuses);
  globalState.className = `global-state state-${global}`;
  globalStateLabel.textContent = global === 'green'
    ? 'Tutti i sistemi operativi'
    : global === 'red'
      ? 'Intervento richiesto'
      : 'Alcuni controlli richiedono attenzione';
}

async function fetchJson(url) {
  const separator = url.includes('?') ? '&' : '?';
  const response = await fetch(`${url}${separator}ts=${Date.now()}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function loadStatuses() {
  refreshButton.disabled = true;
  usersGrid.innerHTML = '<div class="loading-state">Caricamento stato infrastruttura…</div>';

  try {
    const index = await fetchJson('data/users.json');
    const enabledUsers = (index.users || []).filter(user => user.enabled !== false);

    if (!enabledUsers.length) {
      usersGrid.innerHTML = '<div class="empty-state">Nessun ambiente configurato.</div>';
      renderSummary([]);
      return;
    }

    const results = await Promise.all(enabledUsers.map(async user => {
      try {
        const data = await fetchJson(`data/${user.file}`);
        return { ok: true, data };
      } catch (error) {
        return {
          ok: false,
          data: {
            user_id: user.id,
            display_name: user.display_name || user.id,
            overall: 'red',
            overall_message: 'Impossibile leggere il file di stato.',
            checked_at: null,
            services: {
              monitoring: {
                status: 'red',
                label: 'Monitoring',
                message: `File di stato non disponibile: ${error.message}`,
              },
            },
            alerts: [{
              severity: 'red',
              message: 'Il monitor non sta pubblicando correttamente lo stato su GitHub.',
            }],
          },
        };
      }
    }));

    usersGrid.innerHTML = '';
    const statuses = [];

    results.forEach(result => {
      const rendered = createUserCard(result.data);
      statuses.push(rendered.status);
      usersGrid.append(rendered.card);
    });

    renderSummary(statuses);
    pageUpdated.textContent = `Dashboard aggiornata: ${formatDateTime(new Date().toISOString())}`;

  } catch (error) {
    usersGrid.innerHTML = '';
    const errorBox = document.createElement('div');
    errorBox.className = 'empty-state';
    errorBox.textContent = `Impossibile caricare l'indice di stato: ${error.message}`;
    usersGrid.append(errorBox);

    globalState.className = 'global-state state-red';
    globalStateLabel.textContent = 'Dashboard non disponibile';
    document.getElementById('summary-users').textContent = '—';
    document.getElementById('summary-green').textContent = '—';
    document.getElementById('summary-orange').textContent = '—';
    document.getElementById('summary-red').textContent = '—';
  } finally {
    refreshButton.disabled = false;
  }
}

refreshButton.addEventListener('click', loadStatuses);
loadStatuses();
setInterval(loadStatuses, REFRESH_MS);
