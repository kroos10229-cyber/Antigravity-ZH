(() => {
  'use strict';

  const translations = __ANTIGRAVITY_TRANSLATIONS__;
  if (window.__ANTIGRAVITY_ZH__?.version === '0.3.1' && window.__ANTIGRAVITY_ZH__?.setTranslations) {
    window.__ANTIGRAVITY_ZH__.setTranslations(translations);
    window.__ANTIGRAVITY_ZH__.translate();
    return ({ installed: true, translated: window.__ANTIGRAVITY_ZH__.translatedCount });
  }
  if (window.__ANTIGRAVITY_ZH__) {
    if (!window.__ANTIGRAVITY_ZH__.dispose) {
      window.__ANTIGRAVITY_ZH__.setTranslations(translations);
      window.__ANTIGRAVITY_ZH__.translate();
      return ({ installed: true, restartRequired: true });
    }
    window.__ANTIGRAVITY_ZH__.dispose();
    delete window.__ANTIGRAVITY_ZH__;
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
    [/^Agent permissions preset selector, current:\s*(.+)$/, '智能体权限预设，当前：$1'],
    [/^Select project, current:\s*(.+)$/, '选择项目，当前：$1'],
    [/^Worked for\s+(.+)$/, '已工作 $1'],
    [/^Error ID:\s*(.+)$/, '错误 ID：$1'],
    [/^Select model, current:\s*(.+)$/, '选择模型，当前：$1'],
    [/^(\d+)mo$/, '$1个月'],
    [/^No more older messages, showing (\d+) of (\d+)$/, '没有更早的消息了，已显示 $1/$2 条'],
    [/^(\d+)m ago$/, '$1分钟前'],
    [/^(\d+)h ago$/, '$1小时前'],
    [/^(\d+)d ago$/, '$1天前']
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
      const text = (node.nodeValue || '').trim();
      const context = node.parentElement?.textContent || '';
      const planHint = node.parentElement?.closest('[data-testid="plan-command-fyi-alert"]');
      const fragments = planHint ? {
        'Type': '输入', 'and select': '并选择',
        'to have the agent generate a plan.': '即可让智能体生成计划。'
      } : /Google Chrome/.test(context) ? {
        'Configure the browser subagent. It requires': '配置浏览器子智能体。需要安装',
        'to be installed.': '。'
      } : {};
      if (fragments[text]) {
        node.nodeValue = node.nodeValue.replace(text, fragments[text]);
        translated++;
        continue;
      }
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
      version: '0.3.1',
      dispose() { observer.disconnect(); },
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
