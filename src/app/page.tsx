'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSummary, getTasks, getTaskDetail, getAgentsSummary, getTaskAgentRuns, getLogs, testAuth, setToken, clearToken, hasToken } from '@/lib/api';
import { Task, Summary } from '@/lib/types';
import { fmtDate, timeAgo, elapsed, statusClass, rowClass, badgeClass, truncate } from '@/lib/utils';

type View = 'cards' | 'table';
type Filter = 'all' | 'active' | 'completed' | 'standby' | 'failed';
type Page = 'dashboard' | 'agents' | 'logs';

export default function Dashboard() {
  const [authed, setAuthed] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [page, setPage] = useState<Page>('dashboard');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedTask, setSelectedTask] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [taskRuns, setTaskRuns] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [agents, setAgents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<View>('cards');
  const [filter, setFilter] = useState<Filter>('all');
  const [clock, setClock] = useState('');
  const [loading, setLoading] = useState(false);

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  // Check existing token
  useEffect(() => {
    if (hasToken()) {
      testAuth().then(ok => { if (ok) setAuthed(true); });
    }
  }, []);

  // Data fetch
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [s, t] = await Promise.all([getSummary(), getTasks()]);
      setSummary(s);
      setTasks(t);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchData();
    const i = setInterval(fetchData, 10000);
    return () => clearInterval(i);
  }, [authed, fetchData]);

  // Auth handler
  const handleLogin = async () => {
    setAuthError('');
    setToken(tokenInput);
    const ok = await testAuth();
    if (ok) setAuthed(true);
    else { setAuthError('INVALID TOKEN — ACCESS DENIED'); clearToken(); }
  };

  // Filter tasks
  const filterTasks = (f: Filter): Task[] => {
    if (!tasks) return [];
    switch (f) {
      case 'active': return tasks.filter(t => ['InProgress','Queued'].includes(t.status));
      case 'completed': return tasks.filter(t => ['Completed','Deployed','Finished'].includes(t.status));
      case 'standby': return tasks.filter(t => ['Received','Pending'].includes(t.status));
      case 'failed': return tasks.filter(t => ['Failed','Escalated','Rejected'].includes(t.status));
      default: return tasks;
    }
  };

  // Task detail handler
  const openTask = async (taskId: number) => {
    try {
      const detail = await getTaskDetail(taskId);
      setSelectedTask(detail);
      const runs = await getTaskAgentRuns(taskId);
      setTaskRuns(Array.isArray(runs) ? runs : []);
    } catch (e) { console.error(e); }
  };

  // Agents fetch
  const fetchAgents = async () => {
    try { const a = await getAgentsSummary(); setAgents(Array.isArray(a) ? a : []); } catch (e) { console.error(e); }
  };

  // Logs fetch
  const fetchLogs = async () => {
    try { const l = await getLogs(); setLogs(Array.isArray(l) ? l : []); } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (page === 'agents') fetchAgents();
    if (page === 'logs') fetchLogs();
  }, [page]);

  const activeTasks = tasks.filter(t => ['InProgress','Queued'].includes(t.status));
  const completedTasks = tasks.filter(t => ['Completed','Deployed','Finished'].includes(t.status));
  const standbyTasks = tasks.filter(t => ['Received','Pending'].includes(t.status));
  const failedTasks = tasks.filter(t => ['Failed','Escalated','Rejected'].includes(t.status));

  // ============ AUTH SCREEN ============
  if (!authed) {
    return (
      <div className="auth-wrap">
        <div className="auth-box">
          <h1>C3PO MONITOR</h1>
          <div className="subtitle">◈ MISSION CONTROL TERMINAL ◈</div>
          <input
            type="password"
            placeholder="◈ ENTER ACCESS TOKEN..."
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <button onClick={handleLogin}>AUTHENTICATE</button>
          {authError && <div className="error">{authError}</div>}
        </div>
      </div>
    );
  }

  const displayed = filter === 'all' ? null : filterTasks(filter);

  // ============ CARD RENDERER ============
  const renderCard = (task: Task) => (
    <div key={task.task_id} className={`card ${statusClass(task.status)}`} onClick={() => openTask(task.task_id)} style={{cursor:'pointer'}}>
      <div className="card-head">
        <div className="card-title">{truncate(task.subject, 40)}</div>
        <span className={`badge ${badgeClass(task.status)}`}>{task.status}</span>
      </div>
      <div className="card-project">↳ {task.project_name}</div>
      {task.staging_url && (
        <a className="card-link" href={task.staging_url} target="_blank" rel="noopener noreferrer">
          ◈ {task.staging_url.replace('https://', '')}
        </a>
      )}
      {task.production_url && (
        <a className="card-link" href={task.production_url} target="_blank" rel="noopener noreferrer">
          ◈ {task.production_url.replace('https://', '')}
        </a>
      )}
      <div className="card-desc">
        Agent: {task.pm_agent_name || '—'} · Attempts: {task.attempts}
      </div>
      <div className="card-foot">
        <span>{fmtDate(task.created_at)}</span>
        <span className="card-agent">⚡ {task.pm_agent_name || 'unassigned'}</span>
      </div>
    </div>
  );

  // ============ TABLE RENDERER ============
  const renderTable = (taskList: Task[]) => (
    <table className="task-table">
      <thead>
        <tr>
          <th style={{width: 4, padding: 0}}></th>
          <th>ID</th>
          <th>Subject</th>
          <th>Project</th>
          <th>Status</th>
          <th>Agent</th>
          <th>Elapsed</th>
          <th>Updated</th>
          <th>Links</th>
        </tr>
      </thead>
      <tbody>
        {taskList.map(task => (
          <tr key={task.task_id} className={rowClass(task.status)} onClick={() => openTask(task.task_id)} style={{cursor:'pointer'}}>
            <td className="row-indicator"></td>
            <td style={{color: 'var(--cyan)'}}>{task.task_id}</td>
            <td className="subj">{truncate(task.subject, 45)}</td>
            <td>{task.project_name}</td>
            <td><span className={`badge ${badgeClass(task.status)}`}>{task.status}</span></td>
            <td className="agent">{task.pm_agent_name || '—'}</td>
            <td>{fmtDate(task.created_at)}</td>
            <td>{fmtDate(task.updated_at)}</td>
            <td>
              {task.staging_url && <a className="url-link" href={task.staging_url} target="_blank" rel="noopener noreferrer">STG</a>}
              {task.staging_url && task.production_url && ' · '}
              {task.production_url && <a className="url-link" href={task.production_url} target="_blank" rel="noopener noreferrer">PROD</a>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // ============ SECTION RENDERER ============
  const renderSection = (title: string, taskList: Task[], countLabel?: string) => {
    if (taskList.length === 0) return null;
    return (
      <>
        <div className="section-hdr">
          <span>◈ {title}</span>
          <span className="count">{taskList.length} {countLabel || 'OPS'}</span>
        </div>
        {view === 'cards' ? (
          <div className="card-grid">{taskList.map(renderCard)}</div>
        ) : (
          renderTable(taskList)
        )}
      </>
    );
  };

  return (
    <>
      {/* TOP BAR */}
      <div className="topbar">
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <h1>MISSION CONTROL <span className="dim">| C3PO Monitor v1.0</span></h1>
        </div>
        <div className="right">
          <span>SWATS PERSONNEL ONLY</span>
          <span>{clock}</span>
          <span><span className="live-dot"></span>LIVE</span>
          <button
            onClick={() => { clearToken(); setAuthed(false); }}
            style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-dim)', fontFamily: 'inherit', fontSize: 10, padding: '3px 10px', cursor: 'pointer', letterSpacing: 1 }}
          >
            LOGOUT
          </button>
        </div>
      </div>

      <div className="layout">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="section-label">◈ Navigation</div>
          {(['all','active','completed','standby','failed'] as Filter[]).map(f => (
            <button
              key={f}
              className={`nav-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'ALL TASKS' : f === 'active' ? 'ACTIVE OPS' : f === 'completed' ? 'COMPLETED' : f === 'standby' ? 'STANDBY' : 'FAILED / ESCALATED'}
            </button>
          ))}

          <div className="section-label" style={{marginTop: 20}}>◈ View</div>
          <button className={`nav-btn ${view === 'cards' ? 'active' : ''}`} onClick={() => setView('cards')}>◈ CARD VIEW</button>
          <button className={`nav-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>◈ TABLE VIEW</button>

          <div className="section-label" style={{marginTop: 20}}>◈ Pages</div>
          <button className={`nav-btn ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>DASHBOARD</button>
          <button className={`nav-btn ${page === 'agents' ? 'active' : ''}`} onClick={() => setPage('agents')}>AGENTS</button>
          <button className={`nav-btn ${page === 'logs' ? 'active' : ''}`} onClick={() => setPage('logs')}>LOGS</button>

          <div className="clearance">
            <div style={{color: 'var(--text-dim)'}}>SYS: <span className="user">C-3PO</span></div>
            <div style={{color: 'var(--text-dim)'}}>CLEARANCE: LEVEL 5</div>
            <div style={{color: 'var(--text-dim)'}}>MODE: OPERATIONAL</div>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          {/* STATS */}
          {summary && (
            <div className="stats-grid">
              <div className="stat-box">
                <div className="label">Active Ops</div>
                <div className="value green">{summary.open_tasks || 0}</div>
              </div>
              <div className="stat-box">
                <div className="label">Total Tasks</div>
                <div className="value green">{summary.total_tasks}</div>
              </div>
              <div className="stat-box">
                <div className="label">On Going</div>
                <div className="value cyan">{summary.ongoing_tasks || 0}</div>
              </div>
              <div className="stat-box">
                <div className="label">Completed</div>
                <div className="value cyan">{summary.completed_tasks}</div>
              </div>
              <div className="stat-box">
                <div className="label">Failed</div>
                <div className="value red">{summary.failed_tasks}</div>
              </div>
              <div className="stat-box">
                <div className="label">Escalated</div>
                <div className="value amber">{summary.escalated_tasks}</div>
              </div>
            </div>
          )}

          {/* FILTERED VIEW */}
          {/* ===== DASHBOARD PAGE ===== */}
          {page === 'dashboard' && (
            <>
              {displayed ? (
                <>
                  <div className="section-hdr">
                    <span>◈ {filter.toUpperCase()} TASKS</span>
                    <span className="count">{displayed.length} OPS</span>
                  </div>
                  {view === 'cards' ? (
                    <div className="card-grid">{displayed.map(renderCard)}</div>
                  ) : (
                    renderTable(displayed)
                  )}
                  {displayed.length === 0 && <div className="empty-section">◈ NO TASKS IN THIS CATEGORY ◈</div>}
                </>
              ) : (
                <>
                  {renderSection('ACTIVE OPERATIONS', activeTasks)}
                  {renderSection('MISSION COMPLETE', completedTasks)}
                  {renderSection('STANDBY QUEUE', standbyTasks)}
                  {renderSection('FAILED / ESCALATED', failedTasks)}
                  {tasks.length === 0 && !loading && (
                    <div className="empty-section">◈ NO ACTIVE OPERATIONS — ALL CLEAR ◈</div>
                  )}
                </>
              )}
            </>
          )}

          {/* ===== AGENTS PAGE ===== */}
          {page === 'agents' && (
            <>
              <div className="section-hdr">
                <span>◈ OPERATIONAL AGENTS</span>
                <span className="count">{agents.length} AGENTS</span>
              </div>
              <div className="card-grid">
                {agents.map((agent, i) => (
                  <div key={i} className="card s-active">
                    <div className="card-head">
                      <div className="card-title">{String(agent.agent_name || '').toUpperCase()}</div>
                      <span className="badge badge-active">AGENT</span>
                    </div>
                    <div className="card-desc" style={{maxHeight: 'none', color: 'var(--text-faint)', lineHeight: 2}}>
                      <div>Total Runs: <span style={{color: 'var(--glow)'}}>{agent.total_runs ?? 0}</span></div>
                      <div>Active Runs: <span style={{color: 'var(--cyan)'}}>{agent.active_runs ?? 0}</span></div>
                      <div>Completed: <span style={{color: 'var(--cyan)'}}>{agent.completed_runs ?? 0}</span></div>
                      <div>Failed: <span style={{color: 'var(--red)'}}>{agent.failed_runs ?? 0}</span></div>
                      <div>Escalated: <span style={{color: 'var(--amber)'}}>{agent.escalated_runs ?? 0}</span></div>
                      {agent.total_tokens != null && <div>Tokens: <span style={{color: 'var(--glow)'}}>{agent.total_tokens}</span></div>}
                      {agent.total_duration_seconds != null && <div>Duration: <span style={{color: 'var(--glow)'}}>{Math.round(agent.total_duration_seconds / 60)}m</span></div>}
                    </div>
                  </div>
                ))}
              </div>
              {agents.length === 0 && <div className="empty-section">◈ NO AGENTS REGISTERED ◈</div>}
            </>
          )}

          {/* ===== LOGS PAGE ===== */}
          {page === 'logs' && (
            <>
              <div className="section-hdr">
                <span>◈ SYSTEM LOGS</span>
                <span className="count">{logs.length} ENTRIES</span>
              </div>
              {logs.length > 0 ? (
                <table className="task-table">
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Timestamp</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={i}>
                        <td>
                          <span className={`badge ${String(log.level) === 'ERROR' || String(log.level) === 'CRITICAL' ? 'badge-failed' : String(log.level) === 'WARNING' ? 'badge-queued' : 'badge-active'}`}>
                            {String(log.level)}
                          </span>
                        </td>
                        <td>{log.created_at ? fmtDate(String(log.created_at)) : '—'}</td>
                        <td style={{color: 'var(--text-faint)'}}>{String(log.message)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-section">◈ NO LOG ENTRIES ◈</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== TASK DETAIL MODAL ===== */}
      {selectedTask && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: 40
        }} onClick={() => setSelectedTask(null)}>
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--glow)',
            boxShadow: '0 0 40px rgba(51,255,51,0.15)',
            width: '100%', maxWidth: 700, maxHeight: '85vh', overflowY: 'auto',
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: '24px 28px 18px', borderBottom: '1px solid var(--border)'
            }}>
              <div>
                <div style={{fontSize: 18, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--glow)', textShadow: '0 0 10px var(--glow)'}}>
                  {selectedTask.subject}
                </div>
                <div style={{fontSize: 11, color: 'var(--text-dim)', marginTop: 4}}>
                  Task #{selectedTask.task_id} · {selectedTask.project_name}
                </div>
              </div>
              <button onClick={() => setSelectedTask(null)} style={{
                background: 'none', border: '1px solid var(--border)', color: 'var(--text-dim)',
                fontFamily: 'inherit', fontSize: 14, padding: '4px 12px', cursor: 'pointer', letterSpacing: 1
              }}>✕</button>
            </div>

            {/* Modal body */}
            <div style={{padding: '24px 28px'}}>
              {/* Status + badges */}
              <div style={{display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap'}}>
                <span className={`badge ${badgeClass(selectedTask.status)}`}>{selectedTask.status}</span>
                {selectedTask.staging_url && <span className="badge badge-active">STAGING</span>}
                {selectedTask.production_url && <span className="badge badge-completed">PRODUCTION</span>}
              </div>

              {/* Fields */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20}}>
                {[
                  ['Sender', selectedTask.sender],
                  ['Agent', selectedTask.pm_agent_name || '—'],
                  ['Attempts', selectedTask.attempts],
                  ['Created', selectedTask.created_at ? fmtDate(selectedTask.created_at) : '—'],
                  ['Updated', selectedTask.updated_at ? fmtDate(selectedTask.updated_at) : '—'],
                  ['Elapsed', selectedTask.created_at ? elapsed(selectedTask.created_at) : '—'],
                ].map(([label, val]) => (
                  <div key={String(label)}>
                    <div style={{fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 3}}>{label}</div>
                    <div style={{fontSize: 13, color: 'var(--text)'}}>{String(val)}</div>
                  </div>
                ))}
              </div>

              {/* URLs */}
              {selectedTask.staging_url && (
                <div style={{marginBottom: 12}}>
                  <div style={{fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', marginBottom: 3}}>STAGING URL</div>
                  <a href={selectedTask.staging_url} target="_blank" rel="noopener noreferrer" className="card-link">{selectedTask.staging_url}</a>
                </div>
              )}
              {selectedTask.production_url && (
                <div style={{marginBottom: 12}}>
                  <div style={{fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', marginBottom: 3}}>PRODUCTION URL</div>
                  <a href={selectedTask.production_url} target="_blank" rel="noopener noreferrer" className="card-link">{selectedTask.production_url}</a>
                </div>
              )}

              {/* Status History */}
              {selectedTask.status_history && selectedTask.status_history.length > 0 && (
                <>
                  <div style={{borderTop: '1px solid var(--border)', margin: '20px 0'}}></div>
                  <div style={{fontSize: 10, letterSpacing: 2, color: 'var(--text-dim)', marginBottom: 12}}>◈ STATUS HISTORY</div>
                  {selectedTask.status_history
                    .sort((a: Record<string,string>, b: Record<string,string>) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime())
                    .map((h: Record<string, string>, i: number) => (
                    <div key={i} style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, fontSize: 11}}>
                      <span style={{color: 'var(--text-dim)', width: 140, flexShrink: 0}}>{h.changed_at ? fmtDate(h.changed_at) : ''}</span>
                      <span style={{color: 'var(--text-faint)'}}>{h.from_status || '—'}</span>
                      <span style={{color: 'var(--glow)'}}>→</span>
                      <span className={`badge ${badgeClass(h.to_status)}`}>{h.to_status}</span>
                      <span style={{color: 'var(--cyan)', fontSize: 10}}>{h.actor}</span>
                    </div>
                  ))}
                </>
              )}

              {/* Agent Runs */}
              {taskRuns.length > 0 && (
                <>
                  <div style={{borderTop: '1px solid var(--border)', margin: '20px 0'}}></div>
                  <div style={{fontSize: 10, letterSpacing: 2, color: 'var(--text-dim)', marginBottom: 12}}>◈ AGENT RUNS</div>
                  {taskRuns.map((run, i) => (
                    <div key={i} style={{
                      border: '1px solid var(--border)', background: 'var(--bg)',
                      padding: 14, marginBottom: 8, fontSize: 11
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
                        <span style={{color: 'var(--cyan)'}}>{run.agent_name}</span>
                        <span className={`badge ${run.execution_status === 'dispatched' ? 'badge-active' : run.execution_status === 'failed' ? 'badge-failed' : 'badge-completed'}`}>
                          {run.execution_status}
                        </span>
                      </div>
                      <div style={{color: 'var(--text-dim)'}}>
                        {run.notes && <div>{run.notes}</div>}
                        <div>Started: {run.started_at ? fmtDate(run.started_at) : '—'}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
