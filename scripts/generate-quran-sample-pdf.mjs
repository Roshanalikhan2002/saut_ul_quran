import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const text = readFileSync(resolve(root, 'src/data/quran.sample.import.txt'), 'utf8')
const lines = text
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))

/** PDF string with UTF-16BE BOM so pdf.js can extract Arabic. */
function pdfUtf16String(s) {
  const bytes = [0xfe, 0xff]
  for (const ch of s) {
    const cp = ch.codePointAt(0)
    if (cp > 0xffff) {
      const v = cp - 0x10000
      const hi = 0xd800 + (v >> 10)
      const lo = 0xdc00 + (v & 0x3ff)
      bytes.push((hi >> 8) & 0xff, hi & 0xff, (lo >> 8) & 0xff, lo & 0xff)
    } else {
      bytes.push((cp >> 8) & 0xff, cp & 0xff)
    }
  }
  return (
    '(' +
    bytes.map((b) => '\\' + b.toString(8).padStart(3, '0')).join('') +
    ')'
  )
}

const contentOps = []
let y = 780
for (const line of lines) {
  contentOps.push(`BT /F1 8 Tf 36 ${y} Td ${pdfUtf16String(line)} Tj ET`)
  y -= 11
}
const stream = contentOps.join('\n')

const parts = [
  '%PDF-1.4\n',
  '1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n',
  '2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n',
  '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n',
  `4 0 obj<< /Length ${Buffer.byteLength(stream, 'utf8')} >>stream\n${stream}\nendstream\nendobj\n`,
  '5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n',
]

let body = ''
const offsets = [0]
for (const part of parts) {
  offsets.push(Buffer.byteLength(body, 'utf8'))
  body += part
}
const xrefPos = Buffer.byteLength(body, 'utf8')
let xref = `xref\n0 ${parts.length}\n0000000000 65535 f \n`
for (let i = 1; i < parts.length; i++) {
  xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
}
body +=
  xref +
  `trailer<< /Size ${parts.length} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`

mkdirSync(resolve(root, 'public'), { recursive: true })
writeFileSync(resolve(root, 'public/quran.sample.import.txt'), text)
writeFileSync(resolve(root, 'public/quran.sample.import.pdf'), body)
console.log(`Wrote sample with ${lines.length} lines`)
