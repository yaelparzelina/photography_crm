// Opens the browser print dialog for a single element (user can "Save as PDF").
// The iframe's <title> becomes the suggested PDF file name.
export function printElement(element, title) {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0'
  document.body.appendChild(iframe)

  const styles = [...document.querySelectorAll('link[rel="stylesheet"], style')]
    .map((n) => n.outerHTML).join('\n')
  const doc = iframe.contentDocument
  doc.open()
  doc.write(`<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8">
<base href="${document.baseURI}"><title>${escapeHtml(title)}</title>${styles}
<style>@page{margin:12mm}body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style>
</head><body>${element.outerHTML}</body></html>`)
  doc.close()

  const pending = [
    ...[...doc.images].filter((img) => !img.complete),
    ...[...doc.querySelectorAll('link[rel="stylesheet"]')].filter((l) => !l.sheet),
  ]
  Promise.all(pending.map((n) => new Promise((r) => { n.onload = n.onerror = r })))
    .then(() => {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
      setTimeout(() => iframe.remove(), 1000)
    })
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
}
