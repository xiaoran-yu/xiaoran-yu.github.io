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
    vault: '大鲸鱼的记忆篇/会计思考文章集/Published - 我给国家大基金算个账.md',
    slug: 'big-fund',
    title: '我给国家大基金算个账',
    date: '2026-05-29',
    desc: '三期基金、超千亿持仓、退出时间表——大基金的收益账与退出压力',
    tag: '投资分析',
  },
  {
    vault: '大鲸鱼的记忆篇/会计思考文章集/文学史上的会计.md',
    slug: 'lit-accountants',
    title: '文学史上的会计',
    date: '2026-05-28',
    desc: '虚构作品中的算账人——固定类型、跨文化一致、不是写会计而是借用会计',
    tag: '跨学科',
  },
  {
    vault: '大鲸鱼的记忆篇/会计思考文章集/Published- 让我们回归现金流.md',
    slug: 'cashflow',
    title: '让我们回归现金流',
    date: '2026-05-25',
    desc: '利润可以是观点，现金流才是事实',
    tag: '财务分析',
  },
  {
    vault: '大鲸鱼的记忆篇/会计思考文章集/Published - 利润表的改头换面.md',
    slug: 'cas30-reform',
    title: '利润表要改头换面了，而你还没注意到',
    date: '2026-06-01',
    desc: 'CAS 30修订与IFRS 18趋同：利润表从分步式变分类式，对投资者意味着什么',
    tag: '会计准则',
  },
  {
    vault: '大鲸鱼的记忆篇/会计思考文章集/Published - 新私募18条-让我来吐个槽.md',
    slug: 'pe18-rant',
    title: '私募18条：让我吐个槽',
    date: '2026-06-08',
    desc: '国办函54号深度拆解：财政部门出资人能力、5000万红线与PE/VC的现实矛盾',
    tag: '投资分析',
  },
  {
    vault: '大鲸鱼的记忆篇/会计思考文章集/补偿性资产-19号解释.md',
    slug: 'cas19-compensatory',
    title: '并购中的"兜底条款"，如何走入报表里',
    date: '2026-06-09',
    desc: '企业会计准则解释第19号深度拆解：补偿性资产的会计处理、对商誉和投资损益的影响',
    tag: '会计准则',
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
  :root { --bg:#0B1120; --text:#F1F5F9; --text2:#94A3B8; --border:rgba(148,163,184,0.1); --accent:#3D1E2A; --sidebar-w:220px; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'幼圆','YouYuan','Source Han Sans CN','PingFang SC',-apple-system,sans-serif; background:var(--bg); color:var(--text); font-size:19px; line-height:1.95; display:flex; min-height:100vh; }
  .sidebar { width:var(--sidebar-w); background:linear-gradient(180deg,rgba(18,25,45,0.97),rgba(22,32,58,0.97),rgba(18,25,45,0.97)); position:fixed; top:0; left:0; bottom:0; display:flex; flex-direction:column; border-right:1px solid var(--border); }
  .sidebar-logo { padding:28px 24px; border-bottom:1px solid var(--border); }
  .sidebar-logo a { color:#fff; text-decoration:none; font-size:20px; font-weight:700; letter-spacing:1px; background:linear-gradient(90deg,#4CAF50,#FFEB3B,#F44336,#9C27B0,#3F51B5,#00BCD4); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .sidebar-footer { margin-top:auto; padding:20px 24px; border-top:1px solid var(--border); font-size:13px; color:rgba(255,255,255,0.3); }
  .main { margin-left:var(--sidebar-w); flex:1; max-width:800px; padding:60px 48px 80px 56px; }
  header a { color:var(--text2); text-decoration:none; font-size:16px; font-weight:500; transition:color 0.3s; }
  header a:hover { color:#60A5FA; }
  h1 { font-size:42px; font-weight:700; margin:24px 0 10px; letter-spacing:-0.5px; background:linear-gradient(90deg,#4CAF50,#FFEB3B,#F44336,#9C27B0,#3F51B5,#00BCD4); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .date { font-size:16px; color:var(--text2); }
  article { margin-top:40px; }
  article h2 { font-size:26px; font-weight:700; margin:48px 0 16px; color:#F1F5F9; }
  article h3 { font-size:20px; font-weight:700; margin:32px 0 12px; }
  article p { margin:18px 0; }
  article ul, article ol { margin:16px 0; padding-left:24px; }
  article li { margin:8px 0; }
  article strong { font-weight:700; color:#E8ECF4; }
  article blockquote { border-left:3px solid rgba(56,189,248,0.4); margin:24px 0; padding:12px 24px; color:var(--text2); font-size:17px; background:rgba(255,255,255,0.02); border-radius:0 10px 10px 0; }
  article code { background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:5px; font-size:0.9em; }
  article pre { background:rgba(0,0,0,0.3); color:#CBD5E1; padding:20px 24px; border-radius:12px; overflow-x:auto; font-size:15px; line-height:1.7; margin:20px 0; border:1px solid var(--border); }
  article pre code { background:transparent; padding:0; color:inherit; }
  footer { margin-top:80px; padding-top:24px; border-top:1px solid var(--border); font-size:14px; color:var(--text2); }
  footer a { color:var(--text2); text-decoration:none; }
  footer a:hover { color:#60A5FA; }
  @media (max-width:750px) { .sidebar { width:56px; } .sidebar-logo a { font-size:14px; } .sidebar-footer { display:none; } .main { margin-left:56px; padding:32px 20px 48px 28px; } h1 { font-size:30px; } }
</style>
</head>
<body>
<div class="sidebar"><div class="sidebar-logo"><a href="../index.html">大鲸鱼</a></div><div class="sidebar-footer">&copy; 2026</div></div>
<div class="main">
<header><a href="../index.html">← 返回首页</a><h1>${escapeHtml(title)}</h1><div class="date">${date}</div></header>
<article>
${body}
</article>
<footer>&copy; 2026 大鲸鱼</footer>
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

// Build index page — update Module 4 article list
function buildIndex(articles) {
  let items = articles.map(a =>
    `      <li><a href="articles/${a.slug}.html" style="color:#94A3B8;text-decoration:none" onmouseover="this.style.color='#FF9800'" onmouseout="this.style.color='#94A3B8'">${escapeHtml(a.title)}</a> <span style="font-size:12px;color:#64748B">${a.date}</span></li>`
  ).join('\n');

  let index = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');

  // Replace content between <ul class="items"> in Module 4 and its closing </ul>
  index = index.replace(
    /(<ul class="items">)[\s\S]*?(<\/ul>\s*\n\s*<div class="tag-row">)/,
    '$1\n' + items + '\n    $2'
  );

  fs.writeFileSync(path.join(SITE, 'index.html'), index, 'utf8');
  console.log('  Updated index.html (Module 4 articles)');
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
