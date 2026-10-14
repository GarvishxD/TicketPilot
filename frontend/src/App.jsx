import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const API = '/api/v1/tickets';

const iconPaths = {
  inbox: <><path d="M4 4h16v12h-5l-2 3h-2l-2-3H4z"/><path d="M4 12h4l2 2h4l2-2h4"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  check: <><path d="m5 12 4 4L19 6"/></>,
  alert: <><path d="M10.3 4.3 2.8 17.2A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.8L13.7 4.3a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 3h.01"/></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4 4"/></>,
  plus: <path d="M12 5v14m-7-7h14"/>,
  refresh: <><path d="M20 7v5h-5"/><path d="M4.9 9A7.5 7.5 0 0 1 18 6.5L20 12M4 17v-5h5"/><path d="M19.1 15A7.5 7.5 0 0 1 6 17.5L4 12"/></>,
  trash: <><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5m4-5v5"/></>,
  doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8m-8 4h8"/></>,
  close: <><path d="m18 6-12 12M6 6l12 12"/></>,
  arrow: <><path d="M5 12h14m-7-7 7 7-7 7"/></>,
  spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 16 .9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16Z"/></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
};

function Icon({ name, size = 18, className = '' }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

function safeDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? 'Date unavailable' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

function readableError(error) {
  if (error instanceof TypeError) return 'Could not reach the support service. Check that the application is running and try again.';
  return error.message || 'Something went wrong. Please try again.';
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'The request could not be completed. Please try again.');
  return data;
}

function StatusBadge({ status }) {
  const ready = status === 'Ready';
  return <span className={`badge ${ready ? 'badge-ready' : 'badge-review'}`}><span className="badge-dot" />{ready ? 'Ready' : 'Needs review'}</span>;
}

function PriorityBadge({ priority }) {
  return <span className={`priority priority-${String(priority || '').toLowerCase()}`}>{priority} priority</span>;
}

function EmptyState({ search, onCreate }) {
  return <div className="empty-state">
    <div className="empty-art"><Icon name={search ? 'search' : 'inbox'} size={25} /></div>
    <h3>{search ? 'No tickets match those filters' : 'Your ticket desk is clear'}</h3>
    <p>{search ? 'Try another search term, category, or status.' : 'When a customer needs help, create a ticket to get a suggested category and response.'}</p>
    {!search && <button className="button button-primary button-small" onClick={onCreate}><Icon name="plus" size={15} /> Create first ticket</button>}
  </div>;
}

function CreateTicketDialog({ open, onClose, onCreated, notify }) {
  const [ticketId, setTicketId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement;
    closeButtonRef.current?.focus();
    const onKey = event => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  async function submit(event) {
    event.preventDefault();
    if (!ticketId.trim() || !message.trim()) {
      setError('Add a ticket ID and the customer’s message to continue.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const created = await apiRequest(API, { method: 'POST', body: JSON.stringify({ ticket_id: ticketId.trim(), message: message.trim() }) });
      setTicketId('');
      setMessage('');
      onCreated(created);
      onClose();
      notify('Ticket created. It is waiting for a human review.');
    } catch (requestError) {
      setError(readableError(requestError));
    } finally {
      setBusy(false);
    }
  }

  return <div className="dialog-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="create-title" aria-describedby="create-description">
      <div className="dialog-head">
        <div><div className="dialog-kicker">New customer request</div><h2 id="create-title">Create a ticket</h2><p id="create-description">We’ll suggest a category and draft reply for your team to review.</p></div>
        <button ref={closeButtonRef} className="icon-button" aria-label="Close dialog" onClick={onClose}><Icon name="close" /></button>
      </div>
      <form onSubmit={submit}>
        <div className="dialog-body">
          <label className="form-label" htmlFor="ticket-id">Ticket ID</label>
          <input id="ticket-id" className="input" autoFocus maxLength={64} value={ticketId} onChange={event => setTicketId(event.target.value)} placeholder="For example, CASE-1042" pattern="[A-Za-z0-9][A-Za-z0-9._-]*" required />
          <span className="form-help">Use letters, numbers, dots, underscores, or hyphens.</span>
          <label className="form-label message-label" htmlFor="ticket-message">What does the customer need help with?</label>
          <textarea id="ticket-message" className="textarea" maxLength={5000} value={message} onChange={event => setMessage(event.target.value)} placeholder="Paste or summarize the customer's message…" rows={5} required />
          <span className="form-help">Keep private information to a minimum. The draft will not be sent automatically.</span>
          {error && <div className="form-error" role="alert">{error}</div>}
        </div>
        <div className="dialog-actions"><button className="button button-quiet" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy} type="submit">{busy ? 'Creating…' : 'Create ticket'} <Icon name="arrow" size={15} /></button></div>
      </form>
    </section>
  </div>;
}

function CreateTicketPage({ onCreated, onCancel, notify }) {
  const [ticketId, setTicketId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const created = await apiRequest(API, { method: 'POST', body: JSON.stringify({ ticket_id: ticketId.trim(), message: message.trim() }) });
      notify('Ticket created. It is waiting for a human review.');
      onCreated(created);
    } catch (requestError) {
      setError(readableError(requestError));
    } finally {
      setBusy(false);
    }
  }

  return <section className="create-page" aria-labelledby="create-page-title">
    <div className="create-page-heading"><div><div className="eyebrow">NEW CUSTOMER REQUEST</div><h1 id="create-page-title">Create a ticket</h1><p>Enter the customer’s message to generate a category, priority, summary, and draft reply for review.</p></div></div>
    <form className="create-form" onSubmit={submit}>
      <label className="form-label" htmlFor="page-ticket-id">Ticket ID</label>
      <input id="page-ticket-id" className="input" maxLength={64} value={ticketId} onChange={event => setTicketId(event.target.value)} placeholder="For example, CASE-1042" pattern="[A-Za-z0-9][A-Za-z0-9._-]*" required />
      <span className="form-help">Use letters, numbers, dots, underscores, or hyphens.</span>
      <label className="form-label message-label" htmlFor="page-ticket-message">Customer message</label>
      <textarea id="page-ticket-message" className="textarea" maxLength={5000} value={message} onChange={event => setMessage(event.target.value)} placeholder="Paste or summarize the customer’s message…" rows={8} required />
      <span className="form-help">The suggested reply is a draft and will not be sent automatically.</span>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="create-actions"><button className="button button-quiet" type="button" onClick={onCancel}>Cancel</button><button className="button button-primary" disabled={busy} type="submit">{busy ? 'Creating…' : 'Create ticket'} <Icon name="arrow" size={15} /></button></div>
    </form>
  </section>;
}

function TicketDetail({ ticket, onApprove, reviewer, setReviewer, approving, notify }) {
  const [error, setError] = useState('');
  if (!ticket) return <div className="detail-placeholder">
    <div className="placeholder-icon"><Icon name="doc" size={24} /></div>
    <h3>Choose a ticket to review</h3>
    <p>Select a request from the list to see its details, triage suggestion, and draft reply.</p>
  </div>;

  const confidence = Math.max(0, Math.min(100, Math.round((ticket.confidence || 0) * 100)));
  const ready = ticket.review_status === 'Ready';

  async function approve() {
    if (reviewer.trim().length < 2) {
      setError('Enter your name so the review is recorded.');
      return;
    }
    setError('');
    const result = await onApprove(ticket.ticket_id, reviewer.trim());
    if (!result) setError('Approval could not be saved. Please try again.');
  }

  return <div className="detail-content">
    <div className="detail-id-row"><span className="ticket-id-label">{ticket.ticket_id}</span><span className="detail-date">Received {safeDate(ticket.created_at)}</span></div>
    <h2 className="detail-title">{ticket.summary || 'Support request'}</h2>
    <p className="assigned-line">Suggested team <strong>{ticket.assigned_team}</strong></p>
    <div className="detail-badges"><span className="category-badge">{ticket.category}</span><PriorityBadge priority={ticket.priority} /><StatusBadge status={ticket.review_status} /></div>

    <section className="detail-section"><h3 className="section-heading">Customer message</h3><div className="message-card">{ticket.message}</div></section>

    <section className="detail-section"><h3 className="section-heading">Triage suggestion</h3><div className="triage-grid">
      <div className="triage-cell"><span>Category</span><strong>{ticket.category}</strong></div>
      <div className="triage-cell"><span>Assigned team</span><strong>{ticket.assigned_team}</strong></div>
    </div><div className="confidence-row"><span>Classifier confidence</span><strong>{confidence}%</strong></div><div className="confidence-track"><div className="confidence-value" style={{ width: `${confidence}%` }} /></div><p className="confidence-note">A simple keyword estimate, not a guarantee. Please check the suggestion.</p></section>

    <section className="detail-section"><h3 className="section-heading response-heading"><span>Suggested reply</span><span className="draft-label">DRAFT</span></h3><div className="response-card">{ticket.suggested_response}</div></section>

    {ready ? <div className="approved-card"><span className="approved-icon"><Icon name="check" size={16} /></span><div><strong>Reviewed and marked ready</strong><p>{ticket.reviewed_by ? `Approved by ${ticket.reviewed_by}` : 'A reviewer approved this draft'}{ticket.reviewed_at ? ` · ${safeDate(ticket.reviewed_at)}` : ''}. No reply was sent.</p></div></div> : <div className="approval-card">
      <div className="approval-heading"><Icon name="shield" size={17} /><strong>Take a moment to review</strong></div>
      <p>Check the suggested reply before marking this ticket ready. You can still edit the response later in your support workflow.</p>
      <label className="form-label" htmlFor="reviewer-name">Your name</label>
      <div className="approval-row"><input id="reviewer-name" className="input" maxLength={100} value={reviewer} onChange={event => { setReviewer(event.target.value); setError(''); }} placeholder="Enter reviewer name" /><button className="button button-approve" disabled={approving} onClick={approve}>{approving ? 'Saving…' : 'Approve draft'} <Icon name="check" size={15} /></button></div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="no-send-note"><Icon name="shield" size={13} /> Approval changes the ticket status only. It never sends a message.</div>
    </div>}
  </div>;
}

function App() {
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [query, setQuery] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceOnline, setServiceOnline] = useState(null);
  const [pageError, setPageError] = useState('');
  const [approving, setApproving] = useState(false);
  const [toast, setToast] = useState('');
  const searchRef = useRef(null);
  const [activePage, setActivePage] = useState('tickets');
  const [deleting, setDeleting] = useState(false);

  const notify = useCallback(message => {
    setToast(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(''), 3500);
  }, []);

  const loadTickets = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    setPageError('');
    try {
      const [data] = await Promise.all([apiRequest(`${API}?limit=500`), apiRequest('/health')]);
      setTickets(data);
      setServiceOnline(true);
      setLoading(false);
    } catch (error) {
      setServiceOnline(false);
      setPageError(readableError(error));
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  useEffect(() => {
    const onShortcut = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setActivePage('create');
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  const selected = tickets.find(ticket => ticket.ticket_id === selectedId) || null;
  const counts = useMemo(() => ({
    all: tickets.length,
    review: tickets.filter(ticket => ticket.review_status === 'PendingReview').length,
    ready: tickets.filter(ticket => ticket.review_status === 'Ready').length,
    high: tickets.filter(ticket => ticket.priority === 'High').length,
  }), [tickets]);

  const visibleTickets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tickets.filter(ticket => {
      if (statusFilter && ticket.review_status !== statusFilter) return false;
      if (categoryFilter && ticket.category !== categoryFilter) return false;
      return !normalized || [ticket.ticket_id, ticket.message, ticket.summary, ticket.category, ticket.assigned_team].some(value => String(value || '').toLowerCase().includes(normalized));
    });
  }, [tickets, statusFilter, categoryFilter, query]);

  async function createTicket(created) {
    await loadTickets();
    setStatusFilter('');
    setCategoryFilter('');
    setQuery('');
    setSelectedId(created.ticket_id);
    setActivePage('tickets');
  }

  async function deleteSelectedTicket() {
    if (!selected || !window.confirm(`Delete ticket ${selected.ticket_id}? This action cannot be undone.`)) return;
    setDeleting(true);
    try {
      await apiRequest(`${API}/${encodeURIComponent(selected.ticket_id)}`, { method: 'DELETE' });
      setTickets(current => current.filter(ticket => ticket.ticket_id !== selected.ticket_id));
      setSelectedId(null);
      notify(`Ticket ${selected.ticket_id} deleted.`);
    } catch (error) {
      notify(readableError(error));
    } finally {
      setDeleting(false);
    }
  }

  async function approveTicket(ticketId, reviewerName) {
    setApproving(true);
    try {
      const updated = await apiRequest(`${API}/${encodeURIComponent(ticketId)}/approve`, { method: 'POST', body: JSON.stringify({ reviewer: reviewerName }) });
      setTickets(current => current.map(ticket => ticket.ticket_id === ticketId ? updated : ticket));
      notify('Approved and marked ready. No message was sent.');
      return true;
    } catch (error) {
      notify(readableError(error));
      return false;
    } finally {
      setApproving(false);
    }
  }

  function chooseFilter(status) {
    setStatusFilter(status);
    setSelectedId(null);
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <aside className="sidebar">
      <a className="brand" href="#top" aria-label="Cerevyn SupportAI home"><span className="brand-logo">c<span>.</span></span><span className="brand-wordmark">cerevyn<span>support desk</span></span></a>
      <div className="workspace-chip"><span className="workspace-avatar">S</span><span><strong>Support workspace</strong><small>Local environment</small></span><Icon name="more" size={16} /></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        <button aria-current={activePage === 'tickets' && !statusFilter ? 'page' : undefined} title="All tickets" className={`nav-link ${activePage === 'tickets' && !statusFilter ? 'active' : ''}`} onClick={() => { setActivePage('tickets'); chooseFilter(''); }}><Icon name="inbox" /><span>All tickets</span><span className="nav-count">{counts.all}</span></button>
        <button aria-current={statusFilter === 'PendingReview' ? 'page' : undefined} title="Needs review" className={`nav-link ${statusFilter === 'PendingReview' ? 'selected' : ''}`} onClick={() => chooseFilter('PendingReview')}><Icon name="clock" /><span>Needs review</span><span className="nav-count">{counts.review}</span></button>
        <button aria-current={statusFilter === 'Ready' ? 'page' : undefined} title="Ready" className={`nav-link ${statusFilter === 'Ready' ? 'selected' : ''}`} onClick={() => chooseFilter('Ready')}><Icon name="check" /><span>Ready</span><span className="nav-count">{counts.ready}</span></button>
        <button aria-current={activePage === 'create' ? 'page' : undefined} title="Create ticket" className={`nav-link ${activePage === 'create' ? 'selected' : ''}`} onClick={() => setActivePage('create')}><Icon name="plus" /><span>Create ticket</span></button>
      </nav>
      <div className="nav-label category-label">CATEGORIES</div>
      <nav className="side-nav category-nav" aria-label="Ticket categories">
        {['Billing', 'Technical', 'Access', 'General'].map((category, index) => <button title={category} aria-pressed={categoryFilter === category} className={`nav-link ${categoryFilter === category ? 'selected' : ''}`} key={category} onClick={() => { setCategoryFilter(current => current === category ? '' : category); setSelectedId(null); }}><span className={`category-dot category-dot-${index}`} /><span>{category}</span><span className="nav-count">{tickets.filter(ticket => ticket.category === category).length}</span></button>)}
      </nav>
      <div className="sidebar-spacer" />
      <a className="docs-link" href="/docs" target="_blank" rel="noreferrer"><Icon name="doc" size={16} /><span>API documentation</span><Icon name="arrow" size={13} /></a>
      <div className="sidebar-footer"><span className={`online-indicator ${serviceOnline ? 'online' : serviceOnline === false ? 'offline' : ''}`} /><span>{serviceOnline ? 'Service connected' : serviceOnline === false ? 'Service unavailable' : 'Connecting to API'}</span><span className="version">v1.0</span></div>
    </aside>

    <main className="main-area" id="main-content" tabIndex="-1">
      <header className="topbar"><div className="breadcrumb">Support workspace <span>/</span> <strong>{activePage === 'create' ? 'Create ticket' : 'Ticket desk'}</strong></div><div className="topbar-right"><div className={`connection-pill ${serviceOnline ? 'connected' : serviceOnline === false ? 'disconnected' : ''}`}><span />{serviceOnline ? 'Connected' : serviceOnline === false ? 'Offline' : 'Connecting'}</div><div className="profile-avatar" title="Support team">ST</div></div></header>

      <div className="page-content">
        {activePage === 'create' ? <CreateTicketPage onCreated={createTicket} onCancel={() => setActivePage('tickets')} notify={notify} /> : <>
        <section className="welcome-row"><div><div className="eyebrow">SUPPORT OVERVIEW</div><h1>Good day, team <span className="wave" aria-hidden="true">✳</span></h1><p>Here’s what’s happening in your support queue.</p></div><button className="button button-primary" onClick={() => setActivePage('create')}><Icon name="plus" size={17} /> New ticket <span className="shortcut-hint">Ctrl/⌘ N</span></button></section>

        <section className="stat-grid" aria-label="Ticket overview">
          <article className="stat-card"><div className="stat-top"><span>Total tickets</span><span className="stat-icon stat-icon-blue"><Icon name="inbox" size={17} /></span></div><strong>{loading ? '—' : counts.all}</strong><small>Tickets in your workspace</small></article>
          <article className="stat-card"><div className="stat-top"><span>Needs your review</span><span className="stat-icon stat-icon-amber"><Icon name="clock" size={17} /></span></div><strong>{loading ? '—' : counts.review}</strong><small>Waiting for a human decision</small></article>
          <article className="stat-card"><div className="stat-top"><span>Ready</span><span className="stat-icon stat-icon-green"><Icon name="check" size={17} /></span></div><strong>{loading ? '—' : counts.ready}</strong><small>Reviewed by your team</small></article>
          <article className="stat-card"><div className="stat-top"><span>High priority</span><span className="stat-icon stat-icon-red"><Icon name="alert" size={17} /></span></div><strong>{loading ? '—' : counts.high}</strong><small>Urgent or security signals</small></article>
        </section>

        <section className="workspace-section">
          <div className="section-intro"><div><h2>Your tickets</h2><p>Open a ticket to review its classification and reply suggestion.</p></div><button className="button button-subtle" onClick={() => loadTickets(true)} disabled={refreshing}><Icon className={refreshing ? 'spin' : ''} name="refresh" size={15} /> {refreshing ? 'Refreshing' : 'Refresh'}</button></div>
          {pageError && <div className="service-error" role="alert"><Icon name="alert" size={17} /><div><strong>We couldn’t load your tickets</strong><p>{pageError}</p></div><button className="button button-small button-subtle" onClick={() => loadTickets(true)}>Try again</button></div>}

          <div className="dashboard-grid">
            <section className="ticket-panel" aria-label="Ticket list">
              <div className="panel-toolbar"><div className="search-field"><Icon name="search" size={17} /><input ref={searchRef} aria-label="Search tickets" placeholder="Search by ID, message, or team…" value={query} onChange={event => setQuery(event.target.value)} /><kbd>Ctrl/⌘ K</kbd></div><label className="category-select-wrap"><span className="sr-only">Filter by category</span><select value={categoryFilter} onChange={event => { setCategoryFilter(event.target.value); setSelectedId(null); }}><option value="">All categories</option><option>Billing</option><option>Technical</option><option>Access</option><option>General</option></select></label></div>
              <div className="filter-tabs" aria-label="Filter tickets by status">{[{label:'All tickets',value:'',count:counts.all},{label:'Needs review',value:'PendingReview',count:counts.review},{label:'Ready',value:'Ready',count:counts.ready}].map(tab=><button aria-pressed={statusFilter===tab.value} className={`filter-tab ${statusFilter===tab.value?'is-active':''}`} key={tab.label} onClick={()=>chooseFilter(tab.value)}>{tab.label}<span>{tab.count}</span></button>)}</div>
              <div className="ticket-table-head" aria-hidden="true"><span>REQUEST</span><span>CATEGORY</span><span>PRIORITY</span><span>STATUS</span><span>RECEIVED</span></div>
              <div className="ticket-list" role="list" aria-label="Support tickets" aria-busy={loading}>
                {loading ? <div className="list-loading" role="status"><span className="loader" />Loading your tickets…</div> : visibleTickets.length ? visibleTickets.map(ticket=><button role="listitem" aria-pressed={selectedId===ticket.ticket_id} aria-label={`${ticket.ticket_id}: ${ticket.summary||'Customer request'}, ${ticket.category}, ${ticket.priority} priority, ${ticket.review_status === 'Ready' ? 'Ready' : 'Needs review'}`} key={ticket.ticket_id} className={`ticket-row ${selectedId===ticket.ticket_id?'row-selected':''}`} onClick={()=>setSelectedId(ticket.ticket_id)}>
                  <span className="request-cell"><span className="request-icon"><Icon name="doc" size={16} /></span><span className="request-text"><strong>{ticket.summary||'Customer request'}</strong><small>{ticket.ticket_id} <i>·</i> {ticket.assigned_team}</small></span></span>
                  <span className="category-cell"><span className={`category-tag category-tag-${String(ticket.category).toLowerCase()}`}>{ticket.category}</span></span>
                  <span className="priority-cell"><PriorityBadge priority={ticket.priority} /></span>
                  <span className="status-cell"><StatusBadge status={ticket.review_status} /></span>
                  <span className="date-cell">{safeDate(ticket.created_at)}</span>
                </button>) : <EmptyState search={Boolean(query||statusFilter||categoryFilter)} onCreate={()=>setActivePage('create')} />}
              </div>
              <div className="list-footer"><span>Showing <strong>{visibleTickets.length}</strong> of <strong>{tickets.length}</strong> tickets</span><span>Updates are stored in your local workspace</span></div>
            </section>

            <aside className="detail-panel" aria-label="Selected ticket details">
              <div className="detail-panel-head"><div><h2>Ticket details</h2><p>Review before marking ready</p></div><div className="detail-tools">{selected && <><button className="icon-button delete-ticket" aria-label="Delete selected ticket" title="Delete ticket" disabled={deleting} onClick={deleteSelectedTicket}><Icon name="trash" size={16} /></button><button className="icon-button detail-refresh" aria-label="Refresh tickets" onClick={()=>loadTickets(true)}><Icon name="refresh" size={16} /></button></>}</div></div>
              <TicketDetail ticket={selected} onApprove={approveTicket} reviewer={reviewer} setReviewer={setReviewer} approving={approving} notify={notify} />
            </aside>
          </div>
        </section>

        <footer className="page-footer"><span><Icon name="shield" size={14} /> Human review stays in control.</span><span>Classifier suggestions can be wrong. Check each response before approval.</span></footer>
        </>}
      </div>
    </main>

    <div className={`toast ${toast?'toast-visible':''}`} role="status" aria-live="polite">{toast}</div>
  </div>;
}

export default App;
