/**
 * Bulletproof Universal Browser File Downloader
 * Ensures downloaded files ALWAYS preserve their intended human-readable filename 
 * and exact file extension (.pdf, .xlsx, .docx, .csv, etc.).
 * 
 * Prevents Chrome / Edge from saving downloads as raw UUIDs without extensions
 * by embedding File metadata, enforcing explicit MIME types, and triggering 
 * standard MouseEvent clicks.
 */
export const downloadBlob = (data, defaultFilename, fallbackMimeType) => {
  if (!data) {
    console.error('downloadBlob: No data provided');
    return;
  }

  let filename = (defaultFilename || 'download').trim();
  
  // Clean invalid filename characters
  filename = filename.replace(/[\\/:*?"<>|]/g, '_');

  let mimeType = fallbackMimeType;

  // Infer MIME type if not explicitly supplied
  if (!mimeType) {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.xlsx')) {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (lower.endsWith('.docx')) {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (lower.endsWith('.pdf')) {
      mimeType = 'application/pdf';
    } else if (lower.endsWith('.csv')) {
      mimeType = 'text/csv;charset=utf-8;';
    } else if (lower.endsWith('.png')) {
      mimeType = 'image/png';
    } else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    } else {
      mimeType = 'application/octet-stream';
    }
  }

  // Guarantee correct extension based on MIME type
  const lowerMime = (mimeType || '').toLowerCase();
  const lowerName = filename.toLowerCase();

  if (lowerMime.includes('spreadsheetml') || lowerMime.includes('excel')) {
    if (!lowerName.endsWith('.xlsx')) filename += '.xlsx';
    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else if (lowerMime.includes('wordprocessingml') || lowerMime.includes('msword')) {
    if (!lowerName.endsWith('.docx')) filename += '.docx';
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if (lowerMime.includes('pdf')) {
    if (!lowerName.endsWith('.pdf')) filename += '.pdf';
    mimeType = 'application/pdf';
  } else if (lowerMime.includes('csv')) {
    if (!lowerName.endsWith('.csv')) filename += '.csv';
    mimeType = 'text/csv;charset=utf-8;';
  }

  // Always re-wrap in a Blob with the explicit MIME type so the browser doesn't treat it as opaque binary
  const blob = new Blob([data], { type: mimeType });

  // Wrap in a File object if supported so filename metadata is directly attached
  let fileOrBlob = blob;
  try {
    fileOrBlob = new File([blob], filename, { type: mimeType, lastModified: Date.now() });
  } catch (e) {
    fileOrBlob = blob;
  }

  const url = window.URL.createObjectURL(fileOrBlob);
  
  const link = document.createElement('a');
  link.style.position = 'fixed';
  link.style.top = '-9999px';
  link.style.left = '-9999px';
  link.style.opacity = '0';
  link.href = url;
  link.download = filename;
  link.setAttribute('download', filename);
  link.setAttribute('target', '_self');
  document.body.appendChild(link);
  
  // Trigger browser download via native click activation
  link.click();
  
  // Remove link from DOM after short delay
  setTimeout(() => {
    try {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    } catch (e) {
      // Ignore cleanup error
    }
  }, 500);

  // Retain object URL in memory for 30 seconds so browser download manager has completed
  setTimeout(() => {
    try {
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // Ignore cleanup error
    }
  }, 30000);
};
