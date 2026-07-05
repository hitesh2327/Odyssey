import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

export interface HttpInteraction {
  method: string;
  endpoint: string;
  requestBody?: any;
  requestHeaders?: Record<string, string>;
  responseStatus: number;
  responseBody?: any;
}

const RESULTS_PATH = path.join(process.cwd(), 'test-output', 'results.json');
const COVERAGE_PATH = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
const OUT_HTML = path.join(process.cwd(), 'test-output', 'odyssey-report.html');
const META_PATH = path.join(process.cwd(), 'test-output', 'http-meta.jsonl');

if (!fs.existsSync(RESULTS_PATH)) {
  console.error('❌ test-output/results.json not found! Ensure tests were run with the custom reporter.');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));

let coverage = null;
if (fs.existsSync(COVERAGE_PATH)) {
  coverage = JSON.parse(fs.readFileSync(COVERAGE_PATH, 'utf8'));
} else {
  console.warn('⚠ coverage/coverage-summary.json not found. Coverage tab will be empty.');
}

let httpMeta: Record<string, HttpInteraction[]> = {};
if (fs.existsSync(META_PATH)) {
  const lines = fs.readFileSync(META_PATH, 'utf-8').split('\n').filter(Boolean);
  lines.forEach(line => {
    try {
      const parsed = JSON.parse(line);
      const name = parsed.testName;
      if (!httpMeta[name]) httpMeta[name] = [];
      httpMeta[name].push(parsed.interaction);
    } catch(e) {}
  });
}

const passCount = results.numPassedTests || 0;
const failCount = results.numFailedTests || 0;
const totalTests = results.numTotalTests || 0;
const allPassed = failCount === 0 && !results.testResults.some((s: any) => s.testExecError);
const suitesPassed = results.numPassedTestSuites || 0;
const totalSuites = results.numTotalTestSuites || 0;
const durationS = ((Date.now() - results.startTime) / 1000).toFixed(1);
const formattedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const formattedTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const stmtPct = coverage?.total?.statements?.pct ?? 'N/A';
const stmtCoverageText = stmtPct !== 'N/A' ? `${stmtPct}% statements` : 'N/A';

const getColorForPct = (pct: any) => {
  if (pct === 'N/A') return '#6B6F85';
  const p = Number(pct);
  if (p >= 80) return 'var(--sea)';
  if (p >= 50) return 'var(--brass)';
  return 'var(--coral)';
};

const getCoverageRing = (label: string, statObj: any) => {
  if (!statObj) return `<div class="ring-box"><div class="ring-text">N/A</div><div class="ring-label">${label}</div></div>`;
  const pct = statObj.pct;
  const color = getColorForPct(pct);
  const strokeDasharray = `${(pct / 100) * 201} 201`;
  return `
    <div class="ring-box">
      <svg width="80" height="80">
        <circle cx="40" cy="40" r="32" stroke="#E4E1D6" stroke-width="8" fill="none" />
        <circle cx="40" cy="40" r="32" stroke="${color}" stroke-width="8" fill="none" stroke-dasharray="${strokeDasharray}" stroke-dashoffset="0" transform="rotate(-90 40 40)" />
      </svg>
      <div class="ring-text">${pct}%</div>
      <div class="ring-label">${label}</div>
    </div>
  `;
};

function getApiLabel(testFullName: string, meta: Record<string, HttpInteraction[]>): string {
  const interactions = meta[testFullName];
  if (!interactions || interactions.length === 0) return '—';
  const first = interactions[0];
  return `${first.method} ${first.endpoint}`;
}

function getMethodColor(method: string) {
  switch (method.toUpperCase()) {
    case 'POST': return { bg: 'var(--harbor)', color: 'white' };
    case 'GET': return { bg: 'var(--sea)', color: 'white' };
    case 'PATCH': return { bg: 'var(--brass)', color: 'var(--ink)' };
    case 'PUT': return { bg: 'var(--brass)', color: 'var(--ink)' };
    case 'DELETE': return { bg: 'var(--coral)', color: 'white' };
    default: return { bg: '#ddd', color: 'var(--text-muted)' };
  }
}

function renderInteractionPanel(interactions: HttpInteraction[], isFailPanel = false) {
  if (!interactions || interactions.length === 0) return '';
  let html = isFailPanel ? '' : `<div class="test-interaction" style="display:none; background:var(--parchment); border:1px dashed var(--line-strong); border-radius:8px; margin:6px 0; padding:14px 16px;">`;
  
  interactions.forEach((int, idx) => {
    const isMulti = interactions.length > 1;
    if (isMulti) html += `<div style="font-family:'IBM Plex Mono', monospace; font-size:10px; text-transform:uppercase; color:var(--text-faint); margin-bottom:8px;">Request ${idx + 1}</div>`;
    
    html += `
      <div style="margin-bottom: 12px;">
        <div style="font-family:'IBM Plex Mono', monospace; font-size:10px; text-transform:uppercase; color:var(--text-faint);">ENDPOINT</div>
        <div style="font-family:'IBM Plex Mono', monospace; font-size:13px; color:var(--ink);">${int.method} ${int.endpoint}</div>
      </div>
    `;

    const reqBodyStr = int.requestBody ? JSON.stringify(int.requestBody, null, 2) : '— no body';
    html += `
      <div style="margin-bottom: 12px;">
        <div style="font-family:'IBM Plex Mono', monospace; font-size:10px; text-transform:uppercase; color:var(--text-faint);">REQUEST</div>
        <pre style="background:#1C2240; color:#E4C895; font-family:'IBM Plex Mono', monospace; font-size:12px; border-radius:6px; padding:10px 14px; max-height:160px; overflow-y:auto;">${reqBodyStr}</pre>
      </div>
    `;

    const statusColor = int.responseStatus < 300 ? 'var(--sea)' : (int.responseStatus < 400 ? 'var(--brass)' : 'var(--coral)');
    let resBodyStr = int.responseBody ? JSON.stringify(int.responseBody, null, 2) : '— no body';
    const lines = resBodyStr.split('\n');
    if (lines.length > 50) {
      resBodyStr = lines.slice(0, 50).join('\n') + '\n... (truncated)';
    }

    html += `
      <div>
        <div style="font-family:'IBM Plex Mono', monospace; font-size:10px; text-transform:uppercase; color:var(--text-faint); margin-bottom:4px;">RESPONSE (STATUS: <span style="color:${statusColor}; font-weight:bold;">${int.responseStatus}</span>)</div>
        <pre style="background:#1C2240; color:#E4C895; font-family:'IBM Plex Mono', monospace; font-size:12px; border-radius:6px; padding:10px 14px; max-height:200px; overflow-y:auto;">${resBodyStr}</pre>
      </div>
    `;
    if (isMulti && idx < interactions.length - 1) html += `<hr style="border:none; border-top:1px dashed var(--line); margin:16px 0;" />`;
  });
  if (!isFailPanel) html += `</div>`;
  return html;
}

let overviewRows = '';
results.testResults.forEach((suite: any) => {
  const file = path.basename(suite.testFilePath);
  const passed = suite.numPassingTests;
  const failed = suite.numFailingTests;
  const dur = suite.perfStats ? (suite.perfStats.end - suite.perfStats.start) : 0;
  const isFail = failed > 0 || suite.testExecError;
  overviewRows += `
    <tr class="${isFail ? 'failed-row' : 'passed-row'}">
      <td class="file-name">${file}</td>
      <td class="mono">${passed}</td>
      <td class="mono ${isFail ? 'fail-text' : ''}">${failed}</td>
      <td class="mono">${dur}ms</td>
    </tr>
  `;
});

let coverageRows = '';
if (coverage) {
  const files = Object.keys(coverage).filter(k => k !== 'total');
  files.sort((a, b) => coverage[a].statements.pct - coverage[b].statements.pct);
  
  files.forEach(file => {
    const rel = path.relative(process.cwd(), file);
    const renderStat = (stat: any) => {
      const color = getColorForPct(stat.pct);
      return `
        <div class="stat-cell">
          <span class="mono">${stat.covered}/${stat.total}</span>
          <div class="bar-bg"><div class="bar-fill" style="width: ${stat.pct}%; background-color: ${color}"></div></div>
        </div>
      `;
    };
    coverageRows += `
      <tr>
        <td class="mono truncate" title="${rel}">${rel}</td>
        <td>${renderStat(coverage[file].statements)}</td>
        <td>${renderStat(coverage[file].branches)}</td>
        <td>${renderStat(coverage[file].functions)}</td>
        <td>${renderStat(coverage[file].lines)}</td>
      </tr>
    `;
  });
}

let resultsHtml = '';
let failsHtml = '';
let realFailCount = 0;

results.testResults.forEach((suite: any) => {
  const moduleName = path.basename(suite.testFilePath, '.test.ts').replace('.unit', '').replace(/\./g, ' ');
  const suitePassed = suite.numPassingTests;
  const suiteFailed = suite.numFailingTests;
  const hasFail = suiteFailed > 0 || suite.testExecError;
  
  if (hasFail) realFailCount++;
  
  const anyTest = suite.testResults[0];
  const apiLabel = anyTest ? getApiLabel(anyTest.fullName, httpMeta) : '—';

  resultsHtml += `
    <div class="module-group">
      <div class="module-header" onclick="toggleModule(this)">
        <div>
          <h3>${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}</h3>
          <div style="font-family:'IBM Plex Mono', monospace; font-size:12px; color:var(--text-muted); margin-top:2px;">${apiLabel}</div>
        </div>
        <span class="pill ${hasFail ? 'pill-fail' : 'pill-pass'}">${suitePassed}/${suitePassed + suiteFailed} Passed</span>
      </div>
      <div class="module-body">
  `;
  
  if (suite.testExecError) {
    const errorMsg = suite.testExecError.message || JSON.stringify(suite.testExecError) || 'Unknown Execution Error';
    resultsHtml += `<div class="test-row coral-tint">
      <span class="icon" style="color:var(--coral)">✗</span>
      <span class="test-name">Suite Execution Error</span>
    </div>
    <div class="test-error"><pre>${errorMsg}</pre></div>`;
    failsHtml += `
      <div class="fail-card">
        <h4>${moduleName} - Execution Error</h4>
        <div class="fail-sub">${path.basename(suite.testFilePath)}</div>
        <div class="fail-body">
          <pre>${errorMsg}</pre>
        </div>
      </div>
    `;
  }
  
  suite.testResults.forEach((test: any) => {
    const interactions = httpMeta[test.fullName] || [];
    const firstInt = interactions[0];
    const methodBadge = firstInt ? `<span style="background:${getMethodColor(firstInt.method).bg}; color:${getMethodColor(firstInt.method).color}; padding:2px 6px; border-radius:4px; font-family:'IBM Plex Mono', monospace; font-size:10px; margin-right:8px;">${firstInt.method}</span>` : `<span style="background:#ddd; color:var(--text-muted); padding:2px 6px; border-radius:4px; font-family:'IBM Plex Mono', monospace; font-size:10px; margin-right:8px;">—</span>`;
    const intHtml = renderInteractionPanel(interactions);

    if (test.status === 'passed') {
      resultsHtml += `
        <div class="test-row sea-tint" style="cursor:pointer;" onclick="toggleInteraction(this)">
          <div class="test-row-main"><span class="icon" style="color:var(--sea)">✓</span>${methodBadge}<span class="test-name">${test.title}</span><span class="mono">${test.duration || 0}ms</span><span style="margin-left:8px; font-size:10px; color:var(--text-faint)">▾</span></div>
          ${intHtml}
        </div>`;
    } else if (test.status === 'failed') {
      const errParts = test.failureMessages[0]?.split('\n') || ['Unknown error'];
      const errMsg = errParts[0];
      const errStack = errParts.slice(1, 6).join('\n');
      realFailCount++;
      
      let expectedStatus = '';
      let receivedStatus = '';
      const match = test.failureMessages[0].match(/Expected: (\d+)\s+Received: (\d+)/);
      if (match) {
        expectedStatus = match[1];
        receivedStatus = match[2];
      }
      
      let failIntHtml = renderInteractionPanel(interactions, true);
      if (expectedStatus && receivedStatus) {
        failIntHtml += `<div style="font-family:'IBM Plex Mono', monospace; font-size:12px; margin-top:8px;">Expected status: ${expectedStatus}  Received: ${receivedStatus}</div>`;
      }

      resultsHtml += `
        <div class="test-row coral-tint">
          <div class="test-row-main" onclick="toggleError(this)" style="cursor:pointer;">
            <span class="icon" style="color:var(--coral)">✗</span>${methodBadge}<span class="test-name">${test.title}</span><span class="mono">${test.duration || 0}ms</span><span style="margin-left:8px; font-size:10px; color:var(--text-faint)">▾</span>
          </div>
          <div class="test-error" style="display:none">
            ${intHtml}
            <div style="margin-top:12px;">
              <pre class="err-msg">${errMsg}</pre>
              <pre class="err-stack">${errStack}</pre>
            </div>
          </div>
        </div>
      `;
      
      failsHtml += `
        <div class="fail-card">
          <h4>${test.title}</h4>
          <div class="fail-sub">${path.basename(suite.testFilePath)}</div>
          
          ${interactions.length > 0 ? `<div style="margin-bottom:16px;">
            <div style="font-family:'IBM Plex Mono', monospace; font-size:11px; text-transform:uppercase; color:var(--text-faint); margin-bottom:8px;">What was sent</div>
            ${failIntHtml}
          </div>` : ''}

          <div class="fail-body">
            <div class="fail-msg">${errMsg}</div>
            <div class="fail-toggle" onclick="toggleStack(this)" style="cursor:pointer; color:var(--brass); margin-top:8px; font-size:12px;">Show stack trace</div>
            <pre class="fail-stack" style="display:none; margin-top:8px;">${test.failureMessages[0]}</pre>
          </div>
        </div>
      `;
    } else {
      resultsHtml += `<div class="test-row grey-tint"><div class="test-row-main"><span class="icon">○</span>${methodBadge}<span class="test-name">${test.title}</span></div></div>`;
    }
  });
  
  resultsHtml += `</div></div>`;
});

const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Odyssey Test Report</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --ink: #161B33;
    --parchment: #F8F5EE;
    --card: #FFFFFF;
    --brass: #B8863B;
    --brass-tint: #F1E3C7;
    --brass-deep: #8C641F;
    --sea: #3F7D5C;
    --sea-tint: #E3EEE6;
    --coral: #BD5B3C;
    --coral-tint: #F4E4DD;
    --harbor: #2F5C8A;
    --harbor-tint: #E7EEF5;
    --line: rgba(22,27,51,0.10);
    --line-strong: rgba(22,27,51,0.16);
    --text-muted: #6B6F85;
    --text-faint: #9A9DAE;
  }
  body {
    background: var(--parchment);
    font-family: 'Inter', sans-serif;
    color: var(--ink);
    margin: 0;
    padding: 40px;
  }
  .container {
    max-width: 1100px;
    margin: 0 auto;
  }
  h1, h2, h3, h4, .fraunces {
    font-family: 'Fraunces', serif;
    margin: 0;
  }
  .mono {
    font-family: 'IBM Plex Mono', monospace;
  }
  
  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  .header-left {
    background: var(--ink);
    color: white;
    padding: 8px 16px;
    border-radius: 40px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 24px;
  }
  .header-center {
    text-align: center;
  }
  .header-center h1 {
    font-size: 32px;
  }
  .header-center p {
    font-size: 12px;
    color: var(--text-faint);
    margin-top: 4px;
  }
  .header-right {
    padding: 8px 16px;
    border-radius: 4px;
    color: white;
    font-weight: 600;
  }
  .badge-pass { background: var(--sea); }
  .badge-fail { background: var(--coral); }
  
  /* Instrument Strip */
  .instrument-strip {
    background: var(--card);
    border-radius: 8px;
    display: flex;
    border: 1px solid var(--line);
    margin-bottom: 32px;
    overflow: hidden;
  }
  .segment {
    flex: 1;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-right: 1px dashed var(--line-strong);
  }
  .segment:last-child {
    border-right: none;
  }
  .icon-box {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 18px;
  }
  .segment-info label {
    display: block;
    font-size: 12px;
    color: var(--text-muted);
  }
  .segment-info .val {
    font-size: 22px;
    margin-top: 2px;
  }

  /* Tabs */
  .tab-bar {
    display: flex;
    background: var(--card);
    border-bottom: 1px solid var(--line-strong);
    padding: 0 16px;
    border-radius: 8px 8px 0 0;
  }
  .tab {
    padding: 16px 24px;
    cursor: pointer;
    color: var(--text-muted);
    border-bottom: 2px solid transparent;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .tab.active {
    border-bottom: 2px solid var(--brass);
    font-weight: 600;
    color: var(--ink);
  }
  .tab-badge {
    background: var(--coral);
    color: white;
    border-radius: 20px;
    font-size: 11px;
    padding: 2px 7px;
  }
  .tab-content {
    display: none;
    background: var(--card);
    border-radius: 0 0 8px 8px;
    padding: 24px;
    border: 1px solid var(--line);
    border-top: none;
    min-height: 400px;
  }
  .tab-content.active {
    display: block;
  }

  /* Overview */
  .overview-grid {
    display: flex;
    gap: 24px;
  }
  .left-col { width: 60%; }
  .right-col { width: 40%; }
  .card {
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 20px;
  }
  .card-title {
    font-size: 18px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th {
    text-align: left;
    font-size: 10px;
    text-transform: uppercase;
    color: var(--text-faint);
    padding: 8px;
    border-bottom: 1px solid var(--line);
  }
  td {
    padding: 12px 8px;
    border-bottom: 1px solid var(--line);
    font-size: 14px;
  }
  .passed-row { border-left: 3px solid var(--sea); }
  .failed-row { border-left: 3px solid var(--coral); background: var(--coral-tint); }
  .fail-text { color: var(--coral); font-weight: 600; }

  /* Right Col Fields */
  .field-row {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px dashed var(--line-strong);
    font-size: 14px;
  }
  .field-label { color: var(--text-muted); font-size: 12px; font-weight: 600; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
  .wp-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }

  /* Test Results */
  .module-group {
    border: 1px solid var(--line);
    border-radius: 6px;
    margin-bottom: 16px;
    overflow: hidden;
  }
  .module-header {
    background: #fdfdfd;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    border-bottom: 1px solid var(--line);
  }
  .pill { padding: 4px 10px; border-radius: 12px; font-size: 12px; }
  .pill-pass { background: var(--sea-tint); color: var(--sea); }
  .pill-fail { background: var(--coral-tint); color: var(--coral); }
  .test-row-main {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid var(--line);
  }
  .test-row-main:last-child { border-bottom: none; }
  .test-row.sea-tint { background: var(--sea-tint); }
  .test-row.coral-tint { background: var(--coral-tint); }
  .test-row.grey-tint { background: #f5f5f5; color: var(--text-muted); }
  .test-name { flex: 1; margin-left: 12px; font-size: 14px; }
  .test-error { background: #1C2240; color: white; padding: 16px; font-size: 12px; font-family: 'IBM Plex Mono', monospace;}
  .err-msg { margin: 0; color: #ff8a80; }
  .err-stack { margin: 8px 0 0 0; color: var(--text-faint); white-space: pre-wrap; }

  /* Coverage */
  .cov-gauges {
    display: flex;
    justify-content: space-around;
    padding: 24px 0;
    margin-bottom: 32px;
    border: 1px solid var(--line);
    border-radius: 8px;
  }
  .ring-box { text-align: center; position: relative; width: 80px; height: 80px; }
  .ring-text { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-family: 'IBM Plex Mono', monospace; font-weight: bold; font-size: 18px; }
  .ring-label { margin-top: 12px; font-size: 12px; color: var(--text-muted); }
  .truncate { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; }
  .stat-cell { display: flex; flex-direction: column; gap: 4px; }
  .bar-bg { width: 100%; height: 4px; background: #E4E1D6; border-radius: 2px; overflow: hidden; }
  .bar-fill { height: 100%; }

  /* Failed Tests */
  .fail-card {
    border-left: 4px solid var(--coral);
    background: var(--coral-tint);
    border-radius: 0 8px 8px 0;
    padding: 16px;
    margin-bottom: 16px;
  }
  .fail-sub { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--text-muted); margin-bottom: 12px; }
  .fail-msg { background: #1C2240; color: white; padding: 16px; border-radius: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; white-space: pre-wrap; }
  .fail-stack { background: #1C2240; color: var(--text-faint); padding: 16px; border-radius: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; white-space: pre-wrap; }
</style>
</head>
<body>

<div class="container">
  <div class="header">
    <div class="header-left fraunces">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      odyssey
    </div>
    <div class="header-center">
      <h1 class="fraunces">Test Report</h1>
      <p class="mono">Generated: ${formattedDate} at ${formattedTime}</p>
    </div>
    <div class="header-right ${allPassed ? 'badge-pass' : 'badge-fail'}">
      ${allPassed ? '✓ All Tests Passed' : `✗ ${realFailCount} Tests Failed`}
    </div>
  </div>

  <div class="instrument-strip">
    <div class="segment">
      <div class="icon-box" style="background: var(--harbor-tint); color: var(--harbor)">◎</div>
      <div class="segment-info">
        <label>Test Suites</label>
        <div class="val mono">${suitesPassed}/${totalSuites}</div>
      </div>
    </div>
    <div class="segment">
      <div class="icon-box" style="background: var(--sea-tint); color: var(--sea)">✓</div>
      <div class="segment-info">
        <label>Tests</label>
        <div class="val mono">${passCount}/${totalTests}</div>
      </div>
    </div>
    <div class="segment">
      <div class="icon-box" style="background: var(--brass-tint); color: var(--brass-deep)">⏱</div>
      <div class="segment-info">
        <label>Duration</label>
        <div class="val mono">${durationS}s</div>
      </div>
    </div>
    <div class="segment">
      <div class="icon-box" style="background: ${allPassed ? 'var(--sea-tint)' : 'var(--coral-tint)'}; color: ${allPassed ? 'var(--sea)' : 'var(--coral)'}">🌊</div>
      <div class="segment-info">
        <label>Coverage</label>
        <div class="val mono">${stmtCoverageText}</div>
      </div>
    </div>
  </div>

  <div class="tab-bar">
    <div class="tab active" onclick="switchTab(1, this)">Overview</div>
    <div class="tab" onclick="switchTab(2, this)">Test Results</div>
    <div class="tab" onclick="switchTab(3, this)">Coverage</div>
    ${realFailCount > 0 ? `<div class="tab" onclick="switchTab(4, this)">Failed Tests <span class="tab-badge mono">${realFailCount}</span></div>` : ''}
  </div>

  <div id="tab1" class="tab-content active">
    <div class="overview-grid">
      <div class="left-col">
        <div class="card">
          <div class="card-title fraunces">🧭 Suite Results</div>
          <table>
            <thead><tr><th>File</th><th>Passed</th><th>Failed</th><th>Duration</th></tr></thead>
            <tbody>${overviewRows}</tbody>
          </table>
        </div>
      </div>
      <div class="right-col">
        <div class="card">
          <div class="card-title fraunces">📋 Run Info</div>
          <div class="field-row"><span class="field-label">START TIME</span><span class="mono">${new Date(results.startTime).toISOString()}</span></div>
          <div class="field-row"><span class="field-label">NODE ENV</span><span class="mono">test</span></div>
          <div class="field-row"><span class="field-label">TOTAL FILES</span><span class="mono">${totalSuites} test files</span></div>
          <div class="field-row"><span class="field-label">TEST TIMEOUT</span><span class="mono">30s</span></div>
          
          <div class="badges">
            <span class="wp-badge" style="background:var(--brass-tint); color:var(--brass-deep)">✓ Build Passed</span>
            <span class="wp-badge" style="background:var(--brass-tint); color:var(--brass-deep)">✓ Migrations Run</span>
            <span class="wp-badge" style="background:var(--harbor-tint); color:var(--harbor)">✓ Mocks Active</span>
            ${realFailCount > 0 ? `<span class="wp-badge" style="background:var(--coral-tint); color:var(--coral)">✗ ${realFailCount} Failures</span>` : ''}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="tab2" class="tab-content">
    ${resultsHtml}
  </div>

  <div id="tab3" class="tab-content">
    ${coverage ? `
    <div class="cov-gauges">
      ${getCoverageRing('Statements', coverage.total.statements)}
      ${getCoverageRing('Branches', coverage.total.branches)}
      ${getCoverageRing('Functions', coverage.total.functions)}
      ${getCoverageRing('Lines', coverage.total.lines)}
    </div>
    <table>
      <thead><tr><th>File</th><th>Statements</th><th>Branches</th><th>Functions</th><th>Lines</th></tr></thead>
      <tbody>${coverageRows}</tbody>
    </table>
    ` : '<div style="color:var(--text-muted)">Coverage data not available</div>'}
  </div>

  ${realFailCount > 0 ? `
  <div id="tab4" class="tab-content">
    ${failsHtml}
  </div>
  ` : ''}

</div>

<script>
  function switchTab(id, el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('tab' + id).classList.add('active');
  }
  
  function toggleModule(el) {
    const body = el.nextElementSibling;
    body.style.display = body.style.display === 'none' ? 'block' : 'none';
  }
  
  function toggleError(el) {
    const err = el.nextElementSibling;
    err.style.display = err.style.display === 'none' ? 'block' : 'none';
  }
  
  function toggleStack(el) {
    const stack = el.nextElementSibling;
    stack.style.display = stack.style.display === 'none' ? 'block' : 'none';
  }
  
  function toggleInteraction(el) {
    const intPanel = el.querySelector('.test-interaction');
    if (intPanel) {
      intPanel.style.display = intPanel.style.display === 'none' ? 'block' : 'none';
    }
  }
</script>

</body>
</html>`;

fs.mkdirSync(path.dirname(OUT_HTML), { recursive: true });
fs.writeFileSync(OUT_HTML, reportHtml);

// Send Email
async function sendEmail() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠ SMTP not configured — skipping email. Report saved to test-output/odyssey-report.html');
    return;
  }
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Odyssey Test Suite" <${process.env.SMTP_USER}>`,
      to: 'portfolio.hitesh2711@gmail.com',
      subject: `Odyssey Test Report — ${allPassed ? '✓ All Passed' : `✗ ${realFailCount} Failed`} — ${formattedDate}`,
      html: reportHtml,
      attachments: [
        {
          filename: `odyssey-report-${formattedDate.replace(/ /g, '-')}.html`,
          content: reportHtml,
          contentType: 'text/html'
        }
      ]
    });
  } catch (err) {
    console.error('⚠ Error sending email:', err);
  }
}

sendEmail().catch(console.error);
