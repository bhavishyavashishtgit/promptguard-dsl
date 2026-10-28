import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ShieldCheck, Play, FileCode2, Terminal, AlertTriangle, CheckCircle2, XCircle, LoaderCircle } from 'lucide-react';
import './style.css';

const safeProgram = `suite "Document Safety" {
    input "injection.txt"
    output "safe_output.txt"

    expect instruction_conflict
    expect no_test_secret_leak
}`;
const unsafeProgram = safeProgram.replace('"safe_output.txt"', '"unsafe_output.txt"');

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

function makeDemoResult(isUnsafe) {
  const checks = [
    {
      check: 'instruction_conflict',
      status: isUnsafe ? 'FAIL' : 'PASS',
      message: isUnsafe
        ? 'Illustrative demo: the failing sample is selected.'
        : 'Illustrative demo: the safe sample is selected.',
      limitation: 'Simulated result; the backend did not execute this check.',
      evidence: {
        method: 'Static UI demonstration',
        fixture: 'Illustrative sample only',
        observation: isUnsafe
          ? 'The failing example is shown for demonstration.'
          : 'The safe example is shown for demonstration.',
        markers_checked: ['DEMO_PLACEHOLDER'],
        markers_found: [],
      },
    },
    {
      check: 'no_test_secret_leak',
      status: isUnsafe ? 'FAIL' : 'PASS',
      message: isUnsafe
        ? 'Illustrative demo: failure state displayed.'
        : 'Illustrative demo: pass state displayed.',
      limitation: 'Simulated result; this is not a real secret-leak test.',
      evidence: {
        method: 'Static UI demonstration',
        fixture: 'Illustrative sample only',
        observation: 'No real fixture inspection or security analysis was performed.',
        markers_checked: ['DEMO_PLACEHOLDER'],
        markers_found: [],
      },
    },
  ];

  return {
    status: isUnsafe ? 'FAIL' : 'PASS',
    suite: 'Document Safety (DEMO ONLY)',
    summary: {
      total_checks: checks.length,
      passed: isUnsafe ? 0 : checks.length,
      failed: isUnsafe ? checks.length : 0,
    },
    checks,
    notice: 'DEMO MODE: these are simulated UI results, not results from the PromptGuard interpreter. No backend or AI model was called.',
  };
}

function App() {
  const [source, setSource] = useState(safeProgram);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  async function runProgram() {
  setLoading(true);
  setApiError('');
  setResult(null);

  try {
    if (DEMO_MODE) {
      if (source.trim() === safeProgram.trim()) {
        setResult(makeDemoResult(false));
      } else if (source.trim() === unsafeProgram.trim()) {
        setResult(makeDemoResult(true));
      } else {
        setApiError(
          'Demo mode supports the two built-in samples only. Load a sample to preview the interface. For real parsing and execution, run the FastAPI backend locally.'
        );
      }
      return;
    }

    const response = await fetch('http://127.0.0.1:8000/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source }),
    });

    if (!response.ok) {
      throw new Error(`API returned HTTP ${response.status}`);
    }

    setResult(await response.json());
  } catch (err) {
    setApiError(
      'Could not reach the API. Start the FastAPI backend on port 8000, then run again. Details: ' +
      err.message
    );
  } finally {
    setLoading(false);
  }
}

  
  function downloadReport() {
    if (!result) return;

    const report = JSON.stringify(result, null, 2);
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `promptguard-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }


  const status = result?.status;
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-icon"><ShieldCheck size={22}/></div><div><div className="brand-name">PROMPTGUARD <span>DSL</span></div><div className="brand-sub">AI SECURITY TEST PLAYGROUND</div></div></div><div className="version">PROTOTYPE <b>v0.1.0</b></div></header>
    <main>
      <section className="hero"><div className="eyebrow">
  <span className="pulse" />
  {DEMO_MODE ? 'STATIC DEMO MODE · SIMULATED RESULTS' : 'LOCAL FIXTURE MODE'}
</div><h1>Make security tests<br/><span>readable and repeatable.</span></h1><p>Write a small PromptGuard program, execute it against synthetic fixtures, and inspect each rule's result.</p></section>
      <div className="workspace">
        <section className="panel editor-panel"><div className="panel-head"><div className="panel-title"><FileCode2 size={17}/> <span>TEST PROGRAM</span></div><span className="file-label">document_safety.pgd</span></div>
          <div className="sample-actions"><button onClick={() => {setSource(safeProgram);setResult(null)}}>Load safe sample</button><button onClick={() => {setSource(unsafeProgram);setResult(null)}}>Load failing sample</button></div>
          <div className="editor-wrap"><div className="line-numbers">{source.split('\n').map((_,i)=><div key={i}>{String(i+1).padStart(2,'0')}</div>)}</div><textarea spellCheck="false" aria-label="PromptGuard DSL source" value={source} onChange={e=>{setSource(e.target.value);setResult(null)}} /></div>
          <div className="editor-foot"><span><span className="dot"/> DSL editor</span><span>{source.length} / 10,000 chars</span></div>
          <button className="run-button" onClick={runProgram} disabled={loading}>{loading?<LoaderCircle className="spin" size={17}/>:<Play size={17} fill="currentColor"/>}{loading?'Running checks…':'Run security checks'} <span>↗</span></button>
          <div className="safety-note">
  <AlertTriangle size={16} />
  <span>
    {DEMO_MODE
      ? 'Demo only: sample results are simulated. No backend or AI API is called.'
      : <>Runs against files inside the local <code>samples/</code> folder. No AI API is called.</>}
  </span>
</div>
        </section>
        <section className="panel results-panel"><div className="panel-head"><div className="panel-title"><Terminal size={17}/> <span>EXECUTION RESULTS</span></div><span className="live-tag">● READY</span></div>
          {!result && !apiError && <div className="empty-state"><div className="empty-icon"><Terminal size={27}/></div><h3>Waiting for execution</h3><p>Run the sample program to see a suite summary and individual check results.</p><div className="mini-steps"><div><b>01</b> Parse DSL</div><div><b>02</b> Validate paths</div><div><b>03</b> Execute checks</div></div></div>}
          {apiError && <div className="error-state"><XCircle size={24}/><h3>Backend unavailable</h3><p>{apiError}</p></div>}
          {result && <div className="result-content"><div className={`summary ${status==='PASS'?'summary-pass':status==='FAIL'?'summary-fail':'summary-error'}`}><div className="summary-icon">{status==='PASS'?<CheckCircle2 size={23}/>:<XCircle size={23}/>}</div><div><div className="summary-label">SUITE STATUS</div><div className="summary-status">{status}</div><div className="summary-name">{result.suite || 'Program validation'}</div></div></div>
          
<div className="report-toolbar">
  <div className="report-metric">
    <span>Total checks</span>
    <strong>{result.summary?.total_checks ?? result.checks?.length ?? 0}</strong>
  </div>
  <div className="report-metric">
    <span>Passed</span>
    <strong>{result.summary?.passed ?? result.checks?.filter(c => c.status === 'PASS').length ?? 0}</strong>
  </div>
  <div className="report-metric">
    <span>Failed</span>
    <strong>{result.summary?.failed ?? result.checks?.filter(c => c.status === 'FAIL').length ?? 0}</strong>
  </div>
  <button className="download-button" onClick={downloadReport}>
    Download JSON report
  </button>
</div>


            {result.error && <div className="error-message"><b>Program error</b><p>{result.error}</p></div>}
            {result.checks?.length>0 && <><div className="checks-heading">CHECKS <span>{result.checks.length} executed</span></div>{result.checks.map((check,i)=><div className="check-card" key={check.check}><div className={`check-icon ${check.status==='PASS'?'good':'bad'}`}>{check.status==='PASS'?<CheckCircle2 size={17}/>:<XCircle size={17}/>}</div><div className="check-body"><div className="check-name">{check.check}</div><p>{check.message}</p><div className="limitation">NOTE · {check.limitation}</div>
            
{check.evidence && (
  <details className="evidence-panel">
    <summary>View evidence</summary>
    <div className="evidence-content">
      <div><b>Method:</b> {check.evidence.method}</div>
      <div><b>Fixture:</b> {check.evidence.fixture}</div>
      <div><b>Observation:</b> {check.evidence.observation}</div>
      <div><b>Markers checked:</b></div>
      <ul>
        {(check.evidence.markers_checked || []).map(marker => (
          <li key={marker}><code>{marker}</code></li>
        ))}
      </ul>
      <div><b>Markers found:</b></div>
      {check.evidence.markers_found?.length ? (
        <ul>
          {check.evidence.markers_found.map(marker => (
            <li key={marker}><code>{marker}</code></li>
          ))}
        </ul>
      ) : (
        <p>None of the configured markers matched.</p>
      )}
    </div>
  </details>
)}
</div><span className={`status-pill ${check.status==='PASS'?'pill-pass':'pill-fail'}`}>{check.status}</span></div>)}</>}
            {result.notice && <div className="notice">ⓘ {result.notice}</div>}
          </div>}
        </section>
      </div>
      <section className="disclaimer"><ShieldCheck size={18}/><div><b>Prototype scope</b><p>These checks are intentionally simple and deterministic. Marker matching is not general prompt-injection detection, and the synthetic secret check is not a full data-loss prevention system.</p></div></section>
    </main>
    <footer><span>PROMPTGUARD DSL <i>·</i> EDUCATIONAL PROTOTYPE</span><span>BUILT FOR REPRODUCIBLE TESTING</span></footer>
  </div>
}

createRoot(document.getElementById('root')).render(<App/>);
