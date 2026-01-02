// utils/uploadGuard.js



// utils/uploadGuard.js
import { fileTypeFromBuffer } from 'file-type'; // ✅ correct for v18+

const MAX_SCAN = 5 * 1024 * 1024;

function looksEncryptedPdf(buf) {
  const head = buf.slice(0, Math.min(buf.length, MAX_SCAN)).toString('latin1').toLowerCase();
  return head.includes('/encrypt') || (head.includes('/filter') && head.includes('/standard'));
}



function hasPdfScriptMarkers(buf) {
  const text = buf.slice(0, Math.min(buf.length, MAX_SCAN)).toString('latin1').toLowerCase();
  const bad = [
    '/js',            // embedded JS objects
    '/javascript',    // explicit JavaScript name
    '/aa',            // additional actions
    '/openaction',    // run on open
    '/launch',        // launch action
    'javascript:',    // url scheme
  ];
  return bad.some(p => text.includes(p));
}




function hasGenericActiveContent(buf) {
  const text = buf.slice(0, Math.min(buf.length, MAX_SCAN)).toString('latin1').toLowerCase();
  const generic = ['<script','onerror=','onload=','data:text/html','eval(','alert(','<iframe','<embed','<object','<svg','<?xml'];
  return generic.some(p => text.includes(p));
}

export async function storedXSS_validation(file) {
  if (!file?.buffer) throw new Error('Empty file');

  const ft = await fileTypeFromBuffer(file.buffer).catch(() => null);
  const mime = ft?.mime || file.mimetype;

//  const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
//   if (!allowed.includes(mime)) throw new Error('Invalid file type');



  const allowedPrefixes = ['image/', 'audio/', 'video/'];
const allowedExact = ['application/pdf'];

const isAllowed =
  allowedPrefixes.some(prefix => mime.startsWith(prefix)) ||
  allowedExact.includes(mime);

if (!isAllowed) {
  throw new Error('Invalid file type');
}


  if (mime === 'application/pdf') {
    if (looksEncryptedPdf(file.buffer)) throw new Error('Encrypted PDFs are not allowed');
    if (hasPdfScriptMarkers(file.buffer) || hasGenericActiveContent(file.buffer)) {
      throw new Error('PDF appears to contain active content');
    }
  }
  return true;
}

