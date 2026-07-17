import * as vscode from 'vscode'

export function showFindingWebview(finding) {
  const v = finding.vulnerability
  const o = finding.occurrence
  const score = v.score

  // Using rgba for backgrounds so they blend well on both light and dark themes
  const severityStyles = {
    critical: { bg: 'rgba(220, 38, 38, 0.1)', border: '#dc2626', text: '#fca5a5', label: 'CRITICAL' },
    high: { bg: 'rgba(217, 119, 6, 0.1)', border: '#d97706', text: '#fcd34d', label: 'HIGH' },
    moderate: { bg: 'rgba(37, 99, 235, 0.1)', border: '#2563eb', text: '#93c5fd', label: 'MODERATE' },
    low: { bg: 'rgba(22, 163, 74, 0.1)', border: '#16a34a', text: '#86efac', label: 'LOW' }
  }

  const sev = severityStyles[v.severity] ?? severityStyles.moderate

  const panel = vscode.window.createWebviewPanel(
    'vulnlensFinding',
    `VulnLens — ${o.package.name}`,
    vscode.ViewColumn.Beside,
    { enableScripts: false }
  )

  panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VulnLens Finding</title>
  <style>
    :root {
      --sev-bg: ${sev.bg};
      --sev-border: ${sev.border};
      --sev-text: ${sev.text};
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      color: var(--vscode-editor-foreground);
      background-color: var(--vscode-editor-background);
      padding: 32px;
      line-height: 1.6;
      font-size: 14px;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 1px;
      color: var(--sev-text);
      background: var(--sev-bg);
      border: 1px solid var(--sev-border);
      text-transform: uppercase;
    }
    .package-info { flex-grow: 1; }
    .package-name {
      font-size: 22px;
      font-weight: 600;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    .version {
      font-size: 13px;
      color: var(--vscode-descriptionForeground);
      font-family: var(--vscode-editor-font-family);
    }
    .score-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 12px;
      background: var(--sev-bg);
      border: 2px solid var(--sev-border);
    }
    .score-label {
      font-size: 10px;
      color: var(--sev-text);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .score-value {
      font-size: 28px;
      font-weight: 800;
      color: var(--sev-text);
      line-height: 1.2;
    }
    .section { margin-bottom: 24px; }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 10px;
    }
    .title {
      font-size: 16px;
      font-weight: 600;
      color: var(--vscode-editor-foreground);
    }
    .description {
      font-size: 14px;
      color: var(--vscode-editor-foreground);
      background: var(--vscode-textBlockQuote-background);
      border-left: 3px solid var(--vscode-textBlockQuote-border);
      padding: 16px;
      border-radius: 0 6px 6px 0;
    }
    .description h2 { font-size: 15px; font-weight: 700; margin: 16px 0 8px; color: var(--vscode-editor-foreground); }
    .description h3 { font-size: 14px; font-weight: 600; margin: 12px 0 6px; color: var(--vscode-editor-foreground); }
    .description p { margin: 8px 0; }
    .description code {
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(127, 127, 127, 0.15);
    }
    .description pre {
      margin: 12px 0;
      padding: 12px;
      border-radius: 6px;
      background: var(--vscode-textCodeBlock-background);
      overflow-x: auto;
      border: 1px solid var(--vscode-panel-border);
    }
    .description pre code {
      padding: 0;
      background: transparent;
      font-size: 13px;
      line-height: 1.5;
    }
    .description ul, .description ol { margin: 8px 0; padding-left: 24px; }
    .description li { margin: 4px 0; }
    .description strong { font-weight: 600; color: var(--vscode-editor-foreground); }
    .description a {
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
    }
    .description a:hover { text-decoration: underline; }
    .ids {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .id-tag {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-family: var(--vscode-editor-font-family);
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }
    .fix-box {
      padding: 16px 20px;
      border-radius: 8px;
      background: rgba(22, 163, 74, 0.1);
      border: 1px solid rgba(22, 163, 74, 0.4);
    }
    .fix-box .section-title { color: var(--sev-text); margin-bottom: 8px; }
    .fix-message {
      font-size: 14px;
      margin-bottom: 8px;
    }
    .fix-version {
      display: inline-block;
      font-family: var(--vscode-editor-font-family);
      font-size: 13px;
      padding: 4px 8px;
      background: rgba(0,0,0,0.2);
      border-radius: 4px;
      color: #86efac;
      border: 1px solid rgba(22, 163, 74, 0.3);
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid var(--vscode-panel-border);
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    .footer a {
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">${sev.label}</span>
      <div class="package-info">
        <div class="package-name">${escapeHtml(o.package.name)}</div>
        <div class="version">installed: ${escapeHtml(o.package.version ?? o.package.range ?? 'unknown')}</div>
      </div>
      ${score != null ? `
      <div class="score-box">
        <div class="score-label">CVSS</div>
        <div class="score-value">${score}</div>
      </div>` : ''}
    </div>

    <div class="section">
      <div class="section-title">Vulnerability</div>
      <div class="title">${escapeHtml(v.title)}</div>
    </div>

    ${v.summary ? `
    <div class="section">
      <div class="section-title">Description</div>
      <div class="description">${renderMarkdown(v.summary)}</div>
    </div>` : ''}

    ${v.ids && v.ids.length > 0 ? `
    <div class="section">
      <div class="section-title">Advisory IDs</div>
      <div class="ids">
        ${v.ids.map((id) => `<span class="id-tag">${escapeHtml(id.system.toUpperCase())}: ${escapeHtml(id.value)}</span>`).join('')}
      </div>
    </div>` : ''}

    ${finding.fix ? `
    <div class="section">
      <div class="fix-box">
        <div class="section-title">Recommended Fix</div>
        <div class="fix-message">${escapeHtml(finding.fix.message)}</div>
        ${finding.fix.suggestedVersion ? `<div class="version">→ Update to: <span class="fix-version">${escapeHtml(finding.fix.suggestedVersion)}</span></div>` : ''}
      </div>
    </div>` : ''}

    <div class="footer">
      ${v.url ? `<a class="link" href="${escapeHtml(v.url)}">View Advisory ↗</a>` : ''}
      ${v.publishedAt ? `<span>Published: ${escapeHtml(v.publishedAt)}</span>` : ''}
      <span>Scanner: ${escapeHtml(finding.scanner)}</span>
    </div>
  </div>
</body>
</html>`
}

function renderMarkdown(text) {
  if (!text) return ''
  let html = escapeHtml(text)

  html = html.replace(/\`\`\`(\w*)\n([\s\S]*?)\`\`\`/g, (_, lang, code) => `<pre><code>${code.trim()}</code></pre>`)
  html = html.replace(/\`([^\`]+)\`/g, '<code>$1</code>')
  html = html.replace(/^#### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
  html = html.replace(/\n\n/g, '</p><p>')
  html = '<p>' + html + '</p>'
  html = html.replace(/(?<!<\/pre>)\n(?!<)/g, '<br>')
  html = html.replace(/<p>\s*<\/p>/g, '')
  html = html.replace(/<p>\s*(<h[23]>)/g, '$1')
  html = html.replace(/(<\/h[23]>)\s*<\/p>/g, '$1')
  html = html.replace(/<p>\s*(<pre>)/g, '$1')
  html = html.replace(/(<\/pre>)\s*<\/p>/g, '$1')
  html = html.replace(/<p>\s*(<ul>)/g, '$1')
  html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1')

  return html
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
