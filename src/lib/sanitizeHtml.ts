// Sanitizador de HTML por lista de permissão (sem dependências).
// Usado nas descrições de tarefa: o texto digitado vira HTML, então scripts e handlers (onerror, onclick...)
// precisam ser removidos antes de ir para o DOM de outros usuários.

const ALLOWED_TAGS = new Set([
  'a', 'b', 'i', 'em', 'strong', 'strike', 's', 'del', 'br', 'div', 'span', 'p', 'pre', 'code',
  'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'img',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  '*': new Set(['class']),
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'style']),
};

const SAFE_LINK = /^(https?:|mailto:|tel:|#|\/)/i;
const SAFE_IMAGE = /^(https?:|\/|data:image\/(png|jpe?g|gif|webp);base64,)/i;
// style só é aceito em <img>, e sem nada que carregue recursos ou execute
const SAFE_STYLE = /^[\w\s:;.,%#()-]*$/;

const cleanNode = (node: Node, doc: Document): void => {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) return;
    if (child.nodeType !== Node.ELEMENT_NODE) {
      node.removeChild(child);
      return;
    }
    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      // Tags perigosas somem com o conteúdo; as demais são "desembrulhadas" mantendo o texto
      if (['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'svg', 'math', 'form', 'template'].includes(tag)) {
        node.removeChild(el);
      } else {
        cleanNode(el, doc);
        while (el.firstChild) node.insertBefore(el.firstChild, el);
        node.removeChild(el);
      }
      return;
    }

    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const allowed = ALLOWED_ATTRS['*'].has(name) || ALLOWED_ATTRS[tag]?.has(name);
      const value = attr.value.trim();
      let ok = allowed;
      if (ok && name === 'href') ok = SAFE_LINK.test(value);
      if (ok && name === 'src') ok = SAFE_IMAGE.test(value);
      if (ok && name === 'style') ok = SAFE_STYLE.test(value) && !/url\(|expression|javascript/i.test(value);
      if (!ok) el.removeAttribute(attr.name);
    });

    if (tag === 'a') {
      // Links externos nunca recebem acesso ao window.opener
      if (el.getAttribute('target') === '_blank') el.setAttribute('rel', 'noopener noreferrer');
      else el.removeAttribute('target');
    }

    cleanNode(el, doc);
  });
};

export const sanitizeHtml = (html: string = ''): string => {
  if (!html) return '';
  if (typeof DOMParser === 'undefined') {
    // Sem DOM (ex.: SSR): escapa tudo em vez de arriscar
    return html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  cleanNode(doc.body, doc);
  return doc.body.innerHTML;
};
