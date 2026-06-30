const MARKDOWN_INLINE_RULES = [
  { pattern: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },
  { pattern: /`([^`]+)`/g, replacement: '<code>$1</code>' }
];

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInlineMarkdown(value) {
  return MARKDOWN_INLINE_RULES.reduce(
    (text, rule) => text.replace(rule.pattern, rule.replacement),
    escapeHtml(value)
  );
}

export function parseMarkdownToSafeHtml(text) {
  if (!text) return '';

  const lines = String(text).split(/\r?\n/);
  const html = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    html.push(`<ul>${listItems.map(item => `<li>${item}</li>`).join('')}</ul>`);
    listItems = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushList();
      const level = heading[1].length + 1;
      html.push(`<h${level}>${formatInlineMarkdown(heading[2])}</h${level}>`);
      return;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      listItems.push(formatInlineMarkdown(bullet[1]));
      return;
    }

    flushList();
    html.push(`<p>${formatInlineMarkdown(line)}</p>`);
  });

  flushList();
  return html.join('');
}

export function sanitizeTemplateHtml(html = '') {
  if (!html) return '';

  return String(html)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\shref=(["'])javascript:[\s\S]*?\1/gi, ' href="#"')
    .replace(/\ssrc=(["'])javascript:[\s\S]*?\1/gi, ' src=""');
}
