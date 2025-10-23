// Lightweight sanitizer: removes disallowed tags and attributes.
// Not a full substitute for DOMPurify, but provides a safer default without external deps.

const ALLOWED_TAGS = new Set([
  'a','b','strong','i','em','u','code','pre','p','h1','h2','h3','ul','ol','li','img','br','span'
]);

const ALLOWED_ATTRS = new Set(['href','src','alt','title','style', 'target', 'rel']);

function sanitizeAttributes(node) {
  if (!node.attributes) return;
  // iterate attributes in reverse since removal affects NamedNodeMap
  const attrs = Array.from(node.attributes);
  for (const attr of attrs) {
    const name = attr.name.toLowerCase();
    if (!ALLOWED_ATTRS.has(name)) {
      node.removeAttribute(attr.name);
      continue;
    }

    // Basic URL validation for href/src
    if ((name === 'href' || name === 'src') && attr.value) {
      const val = attr.value.trim();
      // allow relative URLs and http(s)
      if (!val.startsWith('#') && !val.startsWith('/') && !/^https?:\/\//i.test(val)) {
        node.removeAttribute(attr.name);
      }
    }

    // For target and rel ensure safe values
    if (name === 'target') {
      if (attr.value !== '_blank' && attr.value !== '_self') node.removeAttribute(attr.name);
    }

    if (name === 'rel') {
      // enforce noopener noreferrer when target=_blank
      // if present, strip unsafe words
      const allowed = attr.value.split(/\s+/).filter(Boolean).filter(v => ['noopener','noreferrer','nofollow'].includes(v.toLowerCase()));
      if (allowed.length) {
        node.setAttribute('rel', allowed.join(' '));
      } else {
        node.removeAttribute('rel');
      }
    }

    // Strip style attributes that contain 'expression' or 'url(javascript:'
    if (name === 'style') {
      const v = attr.value || '';
      if (/expression\(|javascript:/i.test(v)) {
        node.removeAttribute('style');
      }
    }
  }
}

function sanitizeNode(node) {
  if (node.nodeType === 3) return; // text node is safe
  if (node.nodeType !== 1) return node.remove();

  const tag = node.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) {
    // unwrap the node: replace it with its children
    const parent = node.parentNode;
    while (node.firstChild) parent.insertBefore(node.firstChild, node);
    parent.removeChild(node);
    return;
  }

  sanitizeAttributes(node);

  // recurse children
  const childNodes = Array.from(node.childNodes);
  for (const child of childNodes) sanitizeNode(child);
}

export default function sanitize(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const body = doc.body;
  const children = Array.from(body.childNodes);
  for (const child of children) sanitizeNode(child);
  return body.innerHTML;
}
