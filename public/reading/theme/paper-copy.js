/* ==========================================================================
   SkinkEBravia Paper Reader — Markdown-Compatible LaTeX Copy
   1. Intercepts Ctrl/Cmd+C selections containing MathML and emits clean
      Markdown ($...$ inline, $$...$$ / aligned display) using LaTeXML's
      embedded <annotation encoding="application/x-tex"> source.
   2. Adds a quiet, accessible copy-as-LaTeX button to display equations
      using Invoker Commands (with click fallback) & Async Clipboard API.
   ========================================================================== */

(() => {
  'use strict';

  const BLOCK_TAGS = new Set([
    'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DD', 'DETAILS', 'DIV', 'DL',
    'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'H1', 'H2', 'H3', 'H4',
    'H5', 'H6', 'HEADER', 'HR', 'LI', 'MAIN', 'NAV', 'OL', 'P', 'PRE',
    'SECTION', 'TABLE', 'UL',
  ]);

  const timers = new WeakMap();
  let lastAnnouncement = '';
  let generatedIdSeq = 0;

  /** Extract raw TeX from a <math> element's x-tex annotation (or alttext). */
  function extractMathTex(mathEl) {
    const ann = mathEl.querySelector('annotation[encoding="application/x-tex"]');
    let tex = (ann ? ann.textContent : mathEl.getAttribute('alttext')) ?? '';
    tex = tex.replace(/\s+/g, ' ').trim();
    // Strip LaTeXML's injected leading \displaystyle for cleaner Markdown/KaTeX
    tex = tex.replace(/^\\displaystyle(?:\s+|(?=[^a-zA-Z]))/, '').trim();
    return tex;
  }

  /** Normalize equation tag text such as "(4)" or "(1a)" -> "4" or "1a". */
  function extractEqTag(container) {
    const tagEl = container.querySelector('.ltx_tag_equation');
    if (!tagEl) return '';
    return tagEl.textContent.replace(/\s+/g, ' ').trim().replace(/^\((.*)\)$/, '$1');
  }

  /** Format a single equation row (tr.ltx_equation) into aligned TeX cells. */
  function formatEquationRow(rowEl) {
    const mathNodes = Array.from(rowEl.querySelectorAll('math.ltx_Math'));
    if (mathNodes.length === 0) return { tex: '', tag: '' };

    const cells = mathNodes.map(extractMathTex).filter(Boolean);
    if (cells.length === 0) return { tex: '', tag: '' };

    let line = cells[0];
    for (let i = 1; i < cells.length; i++) {
      const cell = cells[i];
      // Standard LaTeX align convention: &= when right column starts with relation
      if (/^[=<>]|^\\(?:approx|equiv|sim|simeq|propto|le|leq|ge|geq|ne|neq|to|mapsto|implies|iff|in|subset|subseteq|coloneqq)\b/.test(cell)) {
        line += ` &${cell}`;
      } else {
        line += ` & ${cell}`;
      }
    }
    return { tex: line, tag: extractEqTag(rowEl) };
  }

  /** Format a display equation table (.ltx_equation or .ltx_equationgroup) as $$...$$. */
  function formatDisplayEquation(tableEl) {
    const rows = Array.from(tableEl.querySelectorAll('tr.ltx_equation'));
    if (rows.length === 0) {
      const maths = Array.from(tableEl.querySelectorAll('math.ltx_Math'));
      const raw = maths.map(extractMathTex).filter(Boolean).join(' ');
      if (!raw) return '';
      const tag = extractEqTag(tableEl);
      const body = tag ? `${raw} \\tag{${tag}}` : raw;
      return `$$\n${body}\n$$`;
    }

    const parsed = rows.map(formatEquationRow).filter((r) => r.tex);
    if (parsed.length === 0) return '';

    if (parsed.length === 1) {
      const { tex, tag } = parsed[0];
      const hasAmp = tex.includes('&');
      const inner = hasAmp ? `\\begin{aligned}\n${tex}\n\\end{aligned}` : tex;
      const body = tag ? `${inner} \\tag{${tag}}` : inner;
      return `$$\n${body}\n$$`;
    }

    const taggedCount = parsed.filter((r) => r.tag).length;
    const lines = parsed.map(({ tex, tag }) => {
      if (tag && taggedCount > 1) {
        return `${tex} \\quad\\text{(${tag})}`;
      }
      return tex;
    });

    const singleTag = taggedCount === 1 ? parsed.find((r) => r.tag)?.tag ?? '' : '';
    const suffix = singleTag ? ` \\tag{${singleTag}}` : '';
    return `$$\n\\begin{aligned}\n${lines.join(' \\\\\n')}\n\\end{aligned}${suffix}\n$$`;
  }

  /** Walk a DOM node/fragment and serialize it into clean Markdown text. */
  function serializeNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue ?? '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      return '';
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      // Skip injected UI controls and screen-reader status bubbles
      if (node.matches('.sk-eq-copy, .sk-copy-tip, .sk-source-bar, script, style')) {
        return '';
      }
      if (node.matches('table.ltx_equationgroup, table.ltx_equation')) {
        const eq = formatDisplayEquation(node);
        return eq ? `\n\n${eq}\n\n` : '';
      }
      if (node.matches('tr.ltx_equation')) {
        const { tex, tag } = formatEquationRow(node);
        if (!tex) return '';
        const body = tag ? `${tex} \\tag{${tag}}` : tex;
        return `\n\n$$\n${body}\n$$\n\n`;
      }
      if (node.matches('math.ltx_Math')) {
        const tex = extractMathTex(node);
        if (!tex) return '';
        const isDisplay = node.getAttribute('display') === 'block' && !node.closest('p.ltx_p');
        return isDisplay ? `\n\n$$\n${tex}\n$$\n\n` : `$${tex}$`;
      }
      if (node.tagName === 'BR') {
        return '\n';
      }
    }

    let out = '';
    for (const child of node.childNodes) {
      out += serializeNode(child);
    }

    if (node.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has(node.tagName)) {
      if (node.matches('p, li, h1, h2, h3, h4, h5, h6, blockquote, pre')) {
        return `\n\n${out.trim()}\n\n`;
      }
    }
    return out;
  }

  /** Normalize whitespace in serialized Markdown output without harming $$ blocks. */
  function cleanMarkdown(raw) {
    const parts = raw.split(/(\$\$[\s\S]*?\$\$)/g);
    const cleaned = parts
      .map((part, idx) => {
        if (idx % 2 === 1) return part; // preserve display math block verbatim
        return part
          .replace(/[ \t]+\n/g, '\n')
          .replace(/\n[ \t]+/g, '\n')
          .replace(/[ \t]{2,}/g, ' ')
          .replace(/\n{3,}/g, '\n\n');
      })
      .join('');
    return cleaned.replace(/\n{3,}/g, '\n\n').trim();
  }

  /** Expand a Range so partial selections inside <math> or display equations capture intact TeX. */
  function expandMathRange(origRange) {
    const range = origRange.cloneRange();
    const closestEl = (n, sel) => {
      const el = n.nodeType === Node.ELEMENT_NODE ? n : n.parentElement;
      return el ? el.closest(sel) : null;
    };

    const startMath = closestEl(range.startContainer, 'math.ltx_Math');
    if (startMath) range.setStartBefore(startMath);
    const endMath = closestEl(range.endContainer, 'math.ltx_Math');
    if (endMath) range.setEndAfter(endMath);

    // If selection lies completely inside a single equation table and spans most of it,
    // keep table row structure intact when cloning.
    const commonEq = closestEl(range.commonAncestorContainer, 'table.ltx_equationgroup, table.ltx_equation');
    if (commonEq && startMath && endMath) {
      const allMaths = commonEq.querySelectorAll('math.ltx_Math');
      if (allMaths.length > 0 && startMath === allMaths[0] && endMath === allMaths[allMaths.length - 1]) {
        range.selectNode(commonEq);
      }
    }
    return range;
  }

  /** Convert current window selection to Markdown if it contains any MathML. */
  function selectionToMarkdown(selection) {
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;

    let hasMath = false;
    const chunks = [];
    for (let i = 0; i < selection.rangeCount; i++) {
      const expanded = expandMathRange(selection.getRangeAt(i));
      const frag = expanded.cloneContents();
      if (frag.querySelector('math.ltx_Math, table.ltx_equation, table.ltx_equationgroup, tr.ltx_equation')) {
        hasMath = true;
      }
      chunks.push(serializeNode(frag));
    }

    if (!hasMath) return null;
    const md = cleanMarkdown(chunks.join('\n\n'));
    return md || null;
  }

  /* ------------------------------------------------ Native Ctrl/Cmd+C hook */
  document.addEventListener('copy', (event) => {
    const selection = window.getSelection();
    const md = selectionToMarkdown(selection);
    if (!md) return;
    if (event.clipboardData) {
      event.clipboardData.setData('text/plain', md);
      event.preventDefault();
    }
  });

  /* ------------------------------------------ Display-equation Copy Button */
  function legacyCopy(text) {
    const previousFocus = document.activeElement;
    const field = Object.assign(document.createElement('textarea'), { value: text });
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
    document.body.append(field);
    field.select();
    try {
      return document.execCommand('copy');
    } finally {
      field.remove();
      previousFocus?.focus?.({ preventScroll: true });
    }
  }

  function report(button, ok) {
    const tip = button.nextElementSibling;
    if (!tip) return;
    clearTimeout(timers.get(button));
    button.removeAttribute('data-copied');
    button.removeAttribute('data-failed');

    let message = ok ? 'Copied $TeX$' : 'Copy failed';
    if (message === lastAnnouncement) message += '\u00A0';
    lastAnnouncement = message;

    tip.textContent = '';
    void button.offsetWidth;
    button.setAttribute(ok ? 'data-copied' : 'data-failed', '');
    requestAnimationFrame(() => {
      tip.textContent = message;
    });

    timers.set(
      button,
      setTimeout(() => {
        button.removeAttribute('data-copied');
        button.removeAttribute('data-failed');
        tip.textContent = '';
      }, 2000),
    );
  }

  async function copyEquation(button, target) {
    const text = formatDisplayEquation(target);
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else if (!legacyCopy(text)) {
        throw new Error('Copy failed');
      }
      report(button, true);
    } catch {
      if (legacyCopy(text)) {
        report(button, true);
      } else {
        report(button, false);
      }
    }
  }

  // Invoker Commands (Baseline Dec 2025) with progressive click fallback
  if ('CommandEvent' in window) {
    document.addEventListener(
      'command',
      (event) => {
        if (event.command === '--copy-tex') {
          copyEquation(event.source, event.target);
        }
      },
      true,
    );
  } else {
    document.addEventListener('click', (event) => {
      if (event.defaultPrevented) return;
      const button = event.target.closest('button[command="--copy-tex"]');
      if (!button) return;
      const target = document.getElementById(button.getAttribute('commandfor') ?? '');
      if (target) copyEquation(button, target);
    });
  }

  /** Wrap top-level display equations with a hover/focus copy-as-TeX control. */
  function attachEquationButtons() {
    const tables = document.querySelectorAll(
      'article.ltx_document table.ltx_equationgroup, article.ltx_document table.ltx_equation',
    );
    for (const table of tables) {
      // Skip nested tables inside another equationgroup or figure/table cell
      if (table.parentElement?.closest('table.ltx_equationgroup, table.ltx_equation, .ltx_figure, .ltx_td')) {
        continue;
      }
      if (!table.querySelector('math.ltx_Math')) continue;

      if (!table.id) {
        table.id = `sk-eq-${++generatedIdSeq}`;
      }

      const wrap = document.createElement('div');
      wrap.className = 'sk-eq-wrap';
      table.parentNode.insertBefore(wrap, table);
      wrap.append(table);

      const control = document.createElement('span');
      control.className = 'sk-eq-copy';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sk-copy-btn';
      btn.setAttribute('command', '--copy-tex');
      btn.setAttribute('commandfor', table.id);
      const tag = extractEqTag(table);
      btn.setAttribute(
        'aria-label',
        tag ? `Copy equation (${tag}) as Markdown LaTeX` : 'Copy equation as Markdown LaTeX',
      );
      btn.innerHTML =
        '<svg class="sk-ico sk-ico-copy" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
        '<rect x="5.5" y="5.5" width="8" height="8" rx="1"/>' +
        '<path d="M10.5 5.5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2"/>' +
        '</svg>' +
        '<svg class="sk-ico sk-ico-check" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
        '<path d="M3 8.5l3.2 3.2L13 4.8"/>' +
        '</svg>';

      const tip = document.createElement('span');
      tip.className = 'sk-copy-tip';
      tip.setAttribute('role', 'status');

      control.append(btn, tip);
      wrap.append(control);
    }
  }

  // Expose helper for automated testing & console debugging
  window.__skPaperCopy = { formatDisplayEquation, selectionToMarkdown };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachEquationButtons, { once: true });
  } else {
    attachEquationButtons();
  }
})();
