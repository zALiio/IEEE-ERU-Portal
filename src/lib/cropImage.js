export default function getCroppedBlob(imageSrc, cropPixels) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.src = imageSrc
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = cropPixels.width
      canvas.height = cropPixels.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        image,
        cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
        0, 0, cropPixels.width, cropPixels.height
      )
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Crop failed')); return }
        resolve(blob)
      }, 'image/jpeg', 0.9)
    }
    image.onerror = reject
  })
}
