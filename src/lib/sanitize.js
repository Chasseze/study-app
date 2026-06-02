import DOMPurify from 'dompurify';

// Thin wrapper around DOMPurify so the rest of the app can rely on a single
// exported function. This centralizes configuration and makes tests easier.
export default function sanitize(htmlString) {
  if (!htmlString) return '';
  try {
    // Configure DOMPurify conservatively: allow common formatting and basic
    // anchors/images but disallow event handlers/styles that could include JS.
    return DOMPurify.sanitize(htmlString, {
      ALLOWED_TAGS: ['a','b','blockquote','br','code','div','em','h1','h2','h3','h4','h5','h6','hr','i','img','li','ol','p','pre','span','strong','sub','sup','table','tbody','td','th','thead','tr','ul'],
      // Allow `style` but let DOMPurify filter any unsafe CSS. This keeps
      // color styling from the editor's preview while avoiding inline JS.
      ALLOWED_ATTR: ['href','src','alt','title','style','class'],
      // Allow embedded images from local uploads (data:image/...) while keeping
      // URI handling strict for other tags.
      ADD_DATA_URI_TAGS: ['img'],
      RETURN_TRUSTED_TYPE: false
    });
  } catch (e) {
    return '';
  }
}
