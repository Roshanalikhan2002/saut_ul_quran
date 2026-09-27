import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

/** Extract plain text from a PDF (browser). */
export async function extractTextFromPdf(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer())
  const doc = await pdfjs.getDocument({ data }).promise
  const parts: string[] = []

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()
    let line = ''
    let lastY: number | null = null

    for (const item of content.items) {
      if (!('str' in item)) continue
      const y = 'transform' in item ? Number(item.transform?.[5]) : null
      if (lastY != null && y != null && Math.abs(lastY - y) > 2) {
        parts.push(line.trim())
        line = ''
      }
      line += item.str
      if (y != null) lastY = y
    }
    if (line.trim()) parts.push(line.trim())
    parts.push('')
  }

  return parts.join('\n')
}
