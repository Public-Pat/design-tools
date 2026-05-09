import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'

type MaskType = 'none' | 'cross' | 'circle' | 'triptych'

const CANVAS_SIZE = 800

function drawCollage(
  canvas: HTMLCanvasElement,
  images: HTMLImageElement[],
  maskType: MaskType,
  typeText: string
) {
  const ctx = canvas.getContext('2d')!
  const s = CANVAS_SIZE
  ctx.clearRect(0, 0, s, s)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, s, s)

  function drawImg(img: HTMLImageElement, x: number, y: number, w: number, h: number) {
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
    const sw = img.naturalWidth * scale
    const sh = img.naturalHeight * scale
    const sx = x + (w - sw) / 2
    const sy = y + (h - sh) / 2
    ctx.drawImage(img, sx, sy, sw, sh)
  }

  if (images.length === 0) return

  if (maskType === 'cross' && images.length >= 1) {
    const third = s / 3
    ctx.save()
    const path = new Path2D()
    path.rect(third, 0, third, s)
    path.rect(0, third, s, third)
    ctx.clip(path)
    drawImg(images[0], 0, 0, s, s)
    ctx.restore()
  } else if (maskType === 'circle' && images.length >= 1) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2)
    ctx.clip()
    drawImg(images[0], 0, 0, s, s)
    ctx.restore()
  } else if (maskType === 'triptych' && images.length >= 1) {
    const gap = 8
    const w = (s - gap * 2) / 3
    for (let i = 0; i < 3; i++) {
      const img = images[Math.min(i, images.length - 1)]
      ctx.save()
      ctx.beginPath()
      ctx.rect(i * (w + gap), 0, w, s)
      ctx.clip()
      drawImg(img, i * (w + gap), 0, w, s)
      ctx.restore()
    }
  } else {
    drawImg(images[0], 0, 0, s, s)
  }

  if (typeText) {
    ctx.font = `bold ${s * 0.12}px "Inter", sans-serif`
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.globalAlpha = 0.85
    ctx.fillText(typeText, s / 2, s / 2)
    ctx.globalAlpha = 1
  }
}

export default function ImageCollage() {
  const [images, setImages] = useState<HTMLImageElement[]>([])
  const [maskType, setMaskType] = useState<MaskType>('none')
  const [typeEnabled, setTypeEnabled] = useState(false)
  const [typeText, setTypeText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const loadFiles = useCallback((files: File[]) => {
    const toLoad = maskType === 'triptych' ? files.slice(0, 3) : files
    const imgs: HTMLImageElement[] = []
    let loaded = 0
    toLoad.forEach((file, i) => {
      const img = new Image()
      img.onload = () => {
        imgs[i] = img
        loaded++
        if (loaded === toLoad.length) {
          setImages(imgs)
          requestAnimationFrame(() => {
            if (canvasRef.current) drawCollage(canvasRef.current, imgs, maskType, typeEnabled ? typeText : '')
          })
        }
      }
      img.src = URL.createObjectURL(file)
    })
  }, [maskType, typeEnabled, typeText])

  const redraw = useCallback((imgs: HTMLImageElement[], mask: MaskType, text: string) => {
    if (canvasRef.current) drawCollage(canvasRef.current, imgs, mask, text)
  }, [])

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) loadFiles(Array.from(e.target.files))
  }

  const setMask = (m: MaskType) => {
    const next = maskType === m ? 'none' : m
    setMaskType(next)
    redraw(images, next, typeEnabled ? typeText : '')
  }

  const exportJPG = () => {
    if (!canvasRef.current) return
    const a = document.createElement('a')
    a.download = 'image_collage.jpg'
    a.href = canvasRef.current.toDataURL('image/jpeg', 0.95)
    a.click()
  }

  const clear = () => {
    setImages([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')!
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    }
  }

  const layouts: { key: MaskType; label: string }[] = [
    { key: 'cross', label: 'Cross' },
    { key: 'circle', label: 'Circle' },
    { key: 'triptych', label: 'Triptych' },
  ]

  return (
    <div className="h-screen bg-black flex flex-col md:flex-row overflow-hidden">
      {/* Preview */}
      <div className="flex-none md:flex-1 flex items-center justify-center p-4 min-w-0 order-1 md:order-2" style={{ height: '45vw', maxHeight: '60vh' }}>
        <div className="h-full aspect-square max-w-full relative overflow-hidden">
          {images.length === 0 && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer z-10 bg-white"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="w-10 h-10" fill="none" viewBox="0 0 40 40">
                <path d="M20 8v24M8 20h24" stroke="#D1D5DC" strokeLinecap="round" strokeWidth="2" />
              </svg>
              <p className="text-xs text-gray-400">Click to upload images</p>
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{ width: '100%', height: '100%', display: images.length === 0 ? 'none' : 'block' }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="w-full md:w-64 flex-shrink-0 flex-1 md:flex-none overflow-y-auto px-[26px] pt-[26px] pb-[26px] flex flex-col gap-6 order-2 md:order-1">
        <div className="h-6 flex items-center">
          <Link to="/" className="text-white hover:text-gray-300 text-xs underline">← Home</Link>
        </div>

        <div className="flex flex-col gap-1">
          <label className="block text-xs text-white">Layout</label>
          <div className="flex flex-col gap-1 mt-3">
            {layouts.map(({ key, label }) => {
              const active = maskType === key
              return (
                <button
                  key={key}
                  onClick={() => setMask(key)}
                  className={`w-full flex items-center justify-between p-[7px] border text-xs focus:outline-none transition-colors ${active ? 'border-white bg-white text-black' : 'border-gray-700 bg-transparent text-gray-500 hover:border-gray-400'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-none" style={{ background: active ? '#030213' : '#4b5563' }} />
                    <span>{label}</span>
                  </div>
                  <span className="text-[9px] opacity-60">{active ? 'on' : 'off'}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs text-white">Type overlay</label>
            <button
              onClick={() => {
                const next = !typeEnabled
                setTypeEnabled(next)
                redraw(images, maskType, next ? typeText : '')
              }}
              className={`text-[9px] px-2 py-0.5 border focus:outline-none transition-colors ${typeEnabled ? 'border-white bg-white text-black' : 'border-gray-700 text-gray-500'}`}
            >
              {typeEnabled ? 'on' : 'off'}
            </button>
          </div>
          {typeEnabled && (
            <input
              type="text"
              value={typeText}
              onChange={(e) => {
                setTypeText(e.target.value)
                redraw(images, maskType, e.target.value)
              }}
              className="w-full p-1.5 border border-white bg-transparent text-white focus:outline-none text-xs"
              placeholder="Enter text..."
            />
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          className="hidden"
        />

        <div className="flex flex-col gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-1.5 bg-transparent border border-white text-white hover:bg-white hover:text-black focus:outline-none text-xs transition-colors"
          >
            Upload Images
          </button>
          <button
            onClick={exportJPG}
            className="w-full p-1.5 bg-white border border-white text-black hover:bg-gray-200 focus:outline-none text-xs"
          >
            Export JPG
          </button>
          <button
            onClick={clear}
            className="w-full p-1.5 bg-transparent border border-gray-700 text-gray-500 hover:border-gray-400 focus:outline-none text-xs transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
