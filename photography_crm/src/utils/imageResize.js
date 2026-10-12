// Photos are stored in Firestore as JPEG data URLs, so they are shrunk before saving
// (a Firestore document is limited to 1 MB).
export const MAX_PHOTO_SIDE = 1400
export const MAX_PHOTO_CHARS = 700_000

// New width/height so the longer side is at most `maxSide` (never enlarges)
export function scaleToFit(width, height, maxSide = MAX_PHOTO_SIDE) {
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('לא ניתן לקרוא את התמונה'))
    img.src = src
  })
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

// Resizes an image file (or blob) to a JPEG data URL under MAX_PHOTO_CHARS,
// lowering the quality and then the size until it fits.
export async function resizeImage(file) {
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    let maxSide = MAX_PHOTO_SIDE
    for (let attempt = 0; attempt < 6; attempt++) {
      const { width, height } = scaleToFit(img.naturalWidth, img.naturalHeight, maxSide)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff' // transparent PNGs get a white background instead of black
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      for (const quality of [0.85, 0.75, 0.65]) {
        const data = canvas.toDataURL('image/jpeg', quality)
        if (data.length <= MAX_PHOTO_CHARS) return data
      }
      maxSide = Math.round(maxSide * 0.75)
    }
    throw new Error('התמונה גדולה מדי')
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
