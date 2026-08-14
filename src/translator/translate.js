(() => {
  'use strict';

  const translations = __ANTIGRAVITY_TRANSLATIONS__;
  if (window.__ANTIGRAVITY_ZH__?.setTranslations) {
    window.__ANTIGRAVITY_ZH__.setTranslations(translations);
    window.__ANTIGRAVITY_ZH__.translate();
    return ({ installed: true, translated: window.__ANTIGRAVITY_ZH__.translatedCount });
  }
  let dictionary = translations;
  let phrases = Object.entries(dictionary)
    // Phrase replacement is reserved for descriptive UI copy. Short labels
    // continue to use exact matching, reducing accidental changes to names.
    .filter(([source]) => source.length >= 12 && /\s|[.,:;]/.test(source))
    .sort(([left], [right]) => right.length - left.length);
  const protectedSelector = [
    'code', 'pre', 'kbd', 'samp', 'script', 'style', 'textarea',
    '[contenteditable="true"]', '.cm-content', '.monaco-editor',
    '[data-testid*="terminal" i]', '[data-testid*="chat-message" i]'
  ].join(',');
  const attributes = ['aria-label', 'title', 'placeholder'];
  const dynamicReplacements = [
    [/^Worked for\s+(.+)$/, '已工作 $1'],
    [/^Error ID:\s*(.+)$/, '错误 ID：$1']
  ];
  let translated = 0;

  function isProtected(node) {
    return node.parentElement?.closest(protectedSelector) != null;
  }

  function replace(value) {
    const normalized = value.trim();
    for (const [pattern, replacement] of dynamicReplacements) {
      if (pattern.test(normalized)) {
        const localized = normalized.replace(pattern, replacement);
        const prefix = value.slice(0, value.indexOf(normalized));
        const suffix = value.slice(value.indexOf(normalized) + normalized.length);
        return prefix + localized + suffix;
      }
    }
    const replacement = dictionary[normalized];
    if (replacement && replacement !== normalized) {
      const prefix = value.slice(0, value.indexOf(normalized));
      const suffix = value.slice(value.indexOf(normalized) + normalized.length);
      return prefix + replacement + suffix;
    }
    let partial = value;
    for (const [source, target] of phrases) partial = partial.replaceAll(source, target);
    if (partial === value) return null;
    return partial;
  }

  function translateElement(element) {
    if (!(element instanceof Element) || element.closest(protectedSelector)) return;
    for (const name of attributes) {
      if (!element.hasAttribute(name)) continue;
      const replacement = replace(element.getAttribute(name));
      if (replacement) {
        element.setAttribute(name, replacement);
        translated++;
      }
    }
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (isProtected(node)) continue;
      const replacement = replace(node.nodeValue || '');
      if (replacement) {
        node.nodeValue = replacement;
        translated++;
      }
    }
  }

  function translate(root = document.body) {
    if (!root) return;
    translateElement(root);
  }

  if (!window.__ANTIGRAVITY_ZH__) {
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'attributes') translateElement(record.target);
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) translateElement(node);
          if (node.nodeType === Node.TEXT_NODE && node.parentElement) translateElement(node.parentElement);
        }
      }
    });
    window.__ANTIGRAVITY_ZH__ = {
      version: '0.1.0',
      translate,
      setTranslations(next) {
        dictionary = next;
        phrases = Object.entries(dictionary)
          .filter(([source]) => source.length >= 12 && /\s|[.,:;]/.test(source))
          .sort(([left], [right]) => right.length - left.length);
      },
      get translatedCount() { return translated; }
    };
    translate();
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: attributes
    });
  } else {
    window.__ANTIGRAVITY_ZH__.translate();
  }
  ({ installed: true, translated: window.__ANTIGRAVITY_ZH__.translatedCount });
})();
