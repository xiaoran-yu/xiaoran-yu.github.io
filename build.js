// Build script: Obsidian vault → static site
// Run: node build.js
// Converts .md articles from Obsidian to .html files in articles/

const fs = require('fs');
const path = require('path');

const VAULT = 'D:/Users/yuxr/Desktop/Obsidian Vaults/大鲸鱼';
const SITE  = __dirname;
const ARTICLES_DIR = path.join(SITE, 'articles');

// Article mapping: vault path → site slug
const ARTICLES = [
  {
    vault: '大鲸鱼的记忆篇/会计思考文章集/文学史上的会计.md',
    slug: 'lit-accountants',
    title: '文学史上的会计',
    date: '2026-05-28',
    desc: '虚构作品中的算账人——固定类型、跨文化一致、不是写会计而是借用会计',
    tag: '跨学科',
  },
  {
    vault: '大鲸鱼的记忆篇/让我们回归现金流.md',
    slug: 'cashflow',
    title: '让我们回归现金流',
    date: '2026-05-25',
    desc: '利润可以是观点，现金流才是事实',
    tag: '财务分析',
  },
  {
    vault: '专业知识大集锦/0.一些实务问题/研发支出费用化后作价入股的会计分析.md',
    slug: 'rd-capitalization',
    title: '研发费用化后作价入股：一个会计矛盾',
    date: '2026-05-22',
    desc: '费用化的研发支出，能否在出资时"复活"为资产？',
    tag: '会计准则',
  },
];

const TEMPLATE = (title, date, body, slug) => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="description" content="${escapeHtml(title)} · 大鲸鱼">
<title>${escapeHtml(title)} · 大鲸鱼</title>
<style>
  :root { --bg:#FBF8F4; --text:#1E293B; --text2:#64748B; --border:#E2E8F0; --accent:#3D1E2A; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Source Han Sans CN','Noto Sans SC','PingFang SC',-apple-system,sans-serif; background:var(--bg); color:var(--text); font-size:17px; line-height:1.85; display:flex; min-height:100vh; }
  .accent-bar { width:6px; background:var(--accent); position:fixed; top:0; left:0; bottom:0; }
  .main { margin-left:6px; flex:1; max-width:760px; padding:60px 36px 80px 48px; }
  header { margin-bottom:40px; }
  header a { color:var(--text2); text-decoration:none; font-size:15px; font-weight:500; }
  header a:hover { color:#3B82F6; }
  h1 { font-size:38px; font-weight:700; margin:20px 0 8px; letter-spacing:-0.5px; }
  .date { font-size:15px; color:var(--text2); }
  article { margin-top:36px; }
  article h2 { font-size:24px; font-weight:700; margin:44px 0 14px; }
  article h3 { font-size:19px; font-weight:700; margin:30px 0 10px; }
  article p { margin:16px 0; }
  article ul, article ol { margin:14px 0; padding-left:24px; }
  article li { margin:8px 0; }
  article strong { font-weight:700; }
  article em { font-style:italic; }
  article blockquote { border-left:3px solid var(--accent); margin:20px 0; padding:10px 22px; color:var(--text2); font-size:16px; background:#fff; border-radius:0 8px 8px 0; }
  article code { background:#F1F5F9; padding:2px 6px; border-radius:4px; font-size:0.9em; }
  article pre { background:#1E293B; color:#E2E8F0; padding:18px 22px; border-radius:12px; overflow-x:auto; font-size:14px; line-height:1.6; margin:18px 0; }
  article pre code { background:transparent; padding:0; color:inherit; }
  footer { margin-top:80px; padding-top:24px; border-top:1px solid var(--border); font-size:14px; color:var(--text2); }
  footer a { color:var(--text2); text-decoration:none; border-bottom:1px solid var(--border); }
  footer a:hover { color:#3B82F6; }
  @media (max-width:660px) { .accent-bar { width:4px; } .main { margin-left:4px; padding:32px 18px 48px 28px; } h1 { font-size:28px; } }
</style>
</head>
<body>
<div class="accent-bar"></div>
<div class="main">
<header><a href="../index.html">← 大鲸鱼</a><h1>${escapeHtml(title)}</h1><div class="date">${date}</div></header>
<article>
${body}
</article>
<footer>&copy; 2026 大鲸鱼 · <a href="../index.html">返回首页</a></footer>
</div>
</body>
</html>`;

function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// Simple markdown → HTML (handles common patterns)
function mdToHtml(md) {
  let lines = md.split('\n');
  let result = '';
  let inCode = false, codeBuf = '', codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code block fence
    if (line.startsWith('```')) {
      if (inCode) {
        result += `<pre><code>${escapeHtml(codeBuf.trim())}</code></pre>\n`;
        codeBuf = ''; inCode = false;
      } else {
        inCode = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }
    if (inCode) { codeBuf += line + '\n'; continue; }

    // Skip YAML frontmatter
    if (i === 0 && line === '---') {
      while (i + 1 < lines.length && lines[i + 1] !== '---') i++;
      i += 1; // skip closing ---
      continue;
    }

    // Headings
    if (line.startsWith('### ')) { result += `<h3>${line.slice(4)}</h3>\n`; continue; }
    if (line.startsWith('## ')) { result += `<h2>${line.slice(3)}</h2>\n`; continue; }
    if (line.startsWith('# ')) { result += `<h2>${line.slice(2)}</h2>\n`; continue; }

    // Horizontal rule
    if (line.trim() === '---' || line.trim() === '***') { result += '<hr style="border:none;border-top:1px solid var(--border);margin:32px 0">\n'; continue; }

    // Blockquote
    if (line.startsWith('> ')) { result += `<blockquote>${inlineMd(line.slice(2))}</blockquote>\n`; continue; }

    // Unordered list
    if (line.match(/^[\-\*] /)) { result += `<ul><li>${inlineMd(line.slice(2))}</li></ul>\n`; continue; }
    // Ordered list
    if (line.match(/^\d+\. /)) { result += `<ol><li>${inlineMd(line.replace(/^\d+\. /,''))}</li></ol>\n`; continue; }

    // Empty line
    if (line.trim() === '') { result += '\n'; continue; }

    // Paragraph
    result += `<p>${inlineMd(line)}</p>\n`;
  }

  // Merge consecutive <ul> / <ol>
  result = result.replace(/<\/ul>\n<ul>/g, '\n');
  result = result.replace(/<\/ol>\n<ol>/g, '\n');

  return result;
}

function inlineMd(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

// Build index page
function buildIndex(articles) {
  const tagMap = {
    'lit-accountants': 'tag-essay',    '跨学科': 'tag-essay',
    'cashflow': 'tag-finance',         '财务分析': 'tag-finance',
    'rd-capitalization': 'tag-fdd',    '会计准则': 'tag-fdd',
    'default': 'tag-model'
  };

  let items = articles.map((a, i) => {
    let tag = a.tag || Object.keys(tagMap).find(k => a.slug.includes(k)) || 'default';
    let tagClass = tagMap[tag] || tagMap['default'];
    return `  <a href="articles/${a.slug}.html" class="article-card">
    <div class="card-title">${escapeHtml(a.title)}</div>
    <div class="card-desc">${escapeHtml(a.desc)}</div>
    <div class="card-meta">
      <span class="card-date">${a.date}</span>
      <span class="card-tag ${tagClass}">${escapeHtml(tag)}</span>
    </div>
  </a>`;
  }).join('\n');

  let index = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
  index = index.replace(
    /(<div class="article-grid">)[\s\S]*?(<\/div>\s*\n\s*<div class="section-title" id="about")/,
    '$1\n' + items + '\n</div>\n\n<div class="section-title" id="about"'
  );
  fs.writeFileSync(path.join(SITE, 'index.html'), index, 'utf8');
  console.log('  Updated index.html');
}

// Main
console.log('Building site...\n');

let articleList = [];
for (let a of ARTICLES) {
  let vaultPath = path.join(VAULT, a.vault);
  if (!fs.existsSync(vaultPath)) {
    console.log(`  [SKIP] ${a.slug} — file not found in vault`);
    continue;
  }
  let md = fs.readFileSync(vaultPath, 'utf8');
  let body = mdToHtml(md);
  let html = TEMPLATE(a.title, a.date, body, a.slug);
  let outPath = path.join(ARTICLES_DIR, a.slug + '.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`  [OK] ${a.slug}.html (${Math.round(html.length / 1024)}kb)`);
  articleList.push(a);
}

buildIndex(articleList);

console.log(`\nDone! ${articleList.length} articles built.`);
console.log('Run: cd yuxiaoran-site && npx serve .');
