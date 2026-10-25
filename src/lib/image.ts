export async function compressPhoto(file: File, maxWidth = 1600, quality = 0.78): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file
  const bitmap = await createImageBitmap(file)
  const ratio = Math.min(1, maxWidth / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio))
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio))
  const context = canvas.getContext('2d')
  if (!context) return file
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', quality))
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}
