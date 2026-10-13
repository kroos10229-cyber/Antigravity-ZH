(() => {
  'use strict';

  const translations = __ANTIGRAVITY_TRANSLATIONS__;
  const detailTranslations = __ANTIGRAVITY_DETAIL_TRANSLATIONS__;
  const templates = __ANTIGRAVITY_TEMPLATES__;
  const templatePatterns = Object.entries(templates).sort(([a], [b]) => b.length - a.length).map(([source, target]) => {
    const ids = [];
    const parts = source.split(/(\{\d+\})/g);
    const pattern = parts.map(part => {
      if (/^\{\d+\}$/.test(part)) { ids.push(part); return '(.+?)'; }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('');
    return {pattern: new RegExp('^' + pattern + '$'), target, ids};
  });
  if (window.__ANTIGRAVITY_ZH__?.version === '0.4.12' && window.__ANTIGRAVITY_ZH__?.setTranslations) {
    window.__ANTIGRAVITY_ZH__.setTranslations(translations, detailTranslations);
    window.__ANTIGRAVITY_ZH__.translate();
    return ({ installed: true, translated: window.__ANTIGRAVITY_ZH__.translatedCount });
  }
  if (window.__ANTIGRAVITY_ZH__) {
    if (!window.__ANTIGRAVITY_ZH__.dispose) {
      window.__ANTIGRAVITY_ZH__.setTranslations(translations, detailTranslations);
      window.__ANTIGRAVITY_ZH__.translate();
      return ({ installed: true, restartRequired: true });
    }
    window.__ANTIGRAVITY_ZH__.dispose();
    delete window.__ANTIGRAVITY_ZH__;
  }
  let dictionary = {...detailTranslations, ...translations};
  function normalizeDictionary(entries) {
    const result = Object.create(null);
    for (const [key, value] of Object.entries(entries)) {
      const normalized = key.replace(/\s+/g, ' ').trim();
      result[normalized] = value;
      const cleanKey = key.replace(/^\[![A-Z]+\]\s*/, '').replace(/(?:\r?\n\s*\*)+$/g, '').replace(/\s+/g, ' ').trim();
      if (cleanKey !== normalized) result[cleanKey] = value.replace(/^\[！?[^\]]+\]\s*/, '').replace(/(?:\r?\n\s*\*)+$/g, '');
      // GFM turns bare URLs into links; those link boundaries split text nodes.
      const urls = /https?:\/\/[^\s)\]}>）。，"'`]+/g;
      const sourceParts = key.split(urls);
      const targetParts = value.split(urls);
      if (sourceParts.length > 1 && sourceParts.length === targetParts.length) {
        sourceParts.forEach((part, index) => {
          const fragment = part.replace(/\s+/g, ' ').trim();
          if (fragment.length >= 12 && /[A-Za-z]{2,}.*\s.*[A-Za-z]{2,}/.test(fragment)) result[fragment] = targetParts[index].trim();
        });
      }
      if (/^".*"$/.test(normalized)) result[normalized.slice(1, -1).replace(/\.$/, '')] = value.replace(/^[“"]|[”"]$/g, '');
    }
    return result;
  }
  let normalizedDictionary = normalizeDictionary(dictionary);
  let phrases = Object.entries(translations)
    // Phrase replacement is reserved for descriptive UI copy. Short labels
    // continue to use exact matching, reducing accidental changes to names.
    .filter(([source, target]) => source !== target && source.length >= 12 && /\s|[.,:;]/.test(source))
    .sort(([left], [right]) => right.length - left.length);
  const protectedSelector = [
    'code', 'pre', 'kbd', 'samp', 'script', 'style', 'textarea',
    '[contenteditable="true"]', '.cm-content', '.monaco-editor',
    '[data-testid*="terminal" i]', '[data-testid*="chat-message" i]', '[data-quotable="true"]'
  ].join(',');
  // Editable field labels can be localized without touching their contents.
  const protectedAttributeSelector = protectedSelector.replace('textarea,', '').replace('[contenteditable="true"],', '').replace(',[data-quotable="true"]', '');
  const attributes = ['aria-label', 'title', 'placeholder'];
  const dynamicReplacements = [
    [/^Opens external link:\s*(.+)$/, '打开外部链接：$1'],
    [/^(?:More actions|更多操作) for (.+)$/, '$1 的更多操作'],
    [/^Global: Installed in (.+)$/, '全局：安装于 $1'],
    [/^See (\d+) more skills and rules$/, '查看更多技能和规则（$1 项）'],
    [/^Filter skills and rules:\s*(.+)$/, (_, current) => '筛选技能和规则：' + (Object.hasOwn(dictionary, current) ? dictionary[current] : current)],
    [/^See more in\s+(.+)$/, '展开更多：$1'],
    [/^See less in\s+(.+)$/, '收起：$1'],
    [/^Permanently delete\s+(.+?)\s+including\s+(\d+)\s+active conversations\.?$/, '永久删除 $1，包括其中 $2 个活跃对话。'],
    [/^(\d+) days?, (\d+) hours?\.?$/, '$1天$2小时。'],
    [/^Install (.+)$/, '安装 $1'],
    [/^Show (\d+) breakdowns?$/, '显示 $1 项明细'],
    [/^See (\d+) more$/, '查看更多（$1 项）'],
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
    const parent = node.parentElement;
    const boundary = parent?.closest(protectedSelector);
    if (!boundary) return false;
    if (boundary.matches('pre') && parent.closest('button,[role="button"]')) return false;
    if (boundary.matches('[data-quotable="true"][role="article"]') && parent.closest('button,[role="button"],[role="alert"]')) return false;
    return true;
  }

  function replace(value) {
    const normalized = value.trim();
    if (/^(?:[\w.-]+\/)*[\w.-]+\.(?:md|json|ya?ml|toml|py|[cm]?js|tsx?|jsx|sh|cmd|swift|html|css)$/i.test(normalized)
      || /^(?:https?:\/\/|file:\/\/)[^\s]+$/.test(normalized)) return null;
    const exact = (Object.hasOwn(dictionary, normalized) ? dictionary[normalized] : undefined) || normalizedDictionary[normalized.replace(/\s+/g, ' ')];
    if (exact) {
      if (exact === normalized) return null;
      return value.slice(0, value.indexOf(normalized)) + exact + value.slice(value.indexOf(normalized) + normalized.length);
    }
    for (const [pattern, replacement] of dynamicReplacements) {
      if (pattern.test(normalized)) {
        const localized = normalized.replace(pattern, replacement);
        const prefix = value.slice(0, value.indexOf(normalized));
        const suffix = value.slice(value.indexOf(normalized) + normalized.length);
        return prefix + localized + suffix;
      }
    }
    for (const {pattern, target, ids} of templatePatterns) {
      const match = normalized.match(pattern);
      if (match) {
        const result = target.replace(/\{\d+\}/g, marker => match[ids.indexOf(marker) + 1] ?? marker);
        return value.slice(0, value.indexOf(normalized)) + result + value.slice(value.indexOf(normalized) + normalized.length);
      }
    }
    const replacement = Object.hasOwn(dictionary, normalized) ? dictionary[normalized] : undefined;
    if (replacement && replacement !== normalized) {
      const prefix = value.slice(0, value.indexOf(normalized));
      const suffix = value.slice(value.indexOf(normalized) + normalized.length);
      return prefix + replacement + suffix;
    }
    let partial = value;
    for (const [source, target] of phrases) partial = partial.replaceAll(source, () => target);
    partial = partial.replace(/\b(\d+) (days?|hours?|minutes?|seconds?)\b/g, (_, count, unit) => count + ({day:'天',hour:'小时',minute:'分钟',second:'秒'})[unit.replace(/s$/, '')]);
    if (partial === value) return null;
    return partial;
  }

  function translateElement(element) {
    if (!(element instanceof Element)) return;
    const boundary = element.closest(protectedAttributeSelector);
    if (boundary && !(boundary.matches('pre') && element.closest('button,[role="button"]'))) return;
    for (const descendant of element.querySelectorAll('[aria-label],[title],[placeholder]')) {
      if (descendant.closest(protectedAttributeSelector)) continue;
      for (const name of attributes) {
        if (!descendant.hasAttribute(name)) continue;
        const localized = replace(descendant.getAttribute(name));
        if (localized && localized !== descendant.getAttribute(name)) {
          descendant.setAttribute(name, localized);
          translated++;
        }
      }
    }
    for (const name of attributes) {
      if (!element.hasAttribute(name)) continue;
      const replacement = replace(element.getAttribute(name));
      if (replacement && replacement !== element.getAttribute(name)) {
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
      if (replacement && replacement !== node.nodeValue) {
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
        if (record.type === 'characterData' && record.target.parentElement) translateElement(record.target.parentElement);
        if (record.type === 'attributes') translateElement(record.target);
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) translateElement(node);
          if (node.nodeType === Node.TEXT_NODE && node.parentElement) translateElement(node.parentElement);
        }
      }
    });
    window.__ANTIGRAVITY_ZH__ = {
      version: '0.4.12',
      dispose() { observer.disconnect(); },
      translate,
      setTranslations(next, details = {}) {
        dictionary = {...details, ...next};
        normalizedDictionary = normalizeDictionary(dictionary);
        phrases = Object.entries(next)
          .filter(([source, target]) => source !== target && source.length >= 12 && /\s|[.,:;]/.test(source))
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
