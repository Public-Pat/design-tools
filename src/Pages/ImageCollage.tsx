import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { Link } from 'react-router-dom'

type MaskType = 'none' | 'cross' | 'circle' | 'triptych' | 'letter'

const W = 800
const H = 800

const IMG_W = 90, IMG_H = 118
const CROSS_V_SPACING = 70, CROSS_H_SPACING = 69
const JITTER = 10, ROT_MAX = 0.12
const SCALE_MIN = 0.82, SCALE_MAX = 1.22
const CIRCLE_R = 260, CIRCLE_W = 115, CIRCLE_H = 87
const CIRCLE_JX = 20, CIRCLE_JY = 14
const CIRCLE_SCALE_MIN = 0.72, CIRCLE_SCALE_MAX = 1.38
const TRIPTYCH_W = 360, TRIPTYCH_X = (W - TRIPTYCH_W) / 2

const LETTER_BITMAPS: Record<string, string[]> = {
  A: ['01110','10001','10001','11111','10001','10001','10001'],
  B: ['11110','10001','10001','11110','10001','10001','11110'],
  C: ['01110','10001','10000','10000','10000','10001','01110'],
  D: ['11110','10001','10001','10001','10001','10001','11110'],
  E: ['11111','10000','10000','11100','10000','10000','11111'],
  F: ['11111','10000','10000','11100','10000','10000','10000'],
  G: ['01110','10001','10000','10011','10001','10001','01110'],
  H: ['10001','10001','10001','11111','10001','10001','10001'],
  I: ['11111','00100','00100','00100','00100','00100','11111'],
  J: ['00111','00001','00001','00001','10001','10001','01110'],
  K: ['10001','10010','10100','11000','10100','10010','10001'],
  L: ['10000','10000','10000','10000','10000','10000','11111'],
  M: ['10001','11011','10101','10001','10001','10001','10001'],
  N: ['10001','11001','10101','10011','10001','10001','10001'],
  O: ['01110','10001','10001','10001','10001','10001','01110'],
  P: ['11110','10001','10001','11110','10000','10000','10000'],
  Q: ['01110','10001','10001','10001','10101','10010','01101'],
  R: ['11110','10001','10001','11110','10100','10010','10001'],
  S: ['01110','10001','10000','01110','00001','10001','01110'],
  T: ['11111','00100','00100','00100','00100','00100','00100'],
  U: ['10001','10001','10001','10001','10001','10001','01110'],
  V: ['10001','10001','10001','10001','01010','01010','00100'],
  W: ['10001','10001','10001','10101','10101','11011','10001'],
  X: ['10001','01010','01010','00100','01010','01010','10001'],
  Y: ['10001','01010','01010','00100','00100','00100','00100'],
  Z: ['11111','00010','00100','01000','01000','10000','11111'],
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function rand(lo: number, hi: number) { return lo + Math.random() * (hi - lo) }

interface ImageSlot { x: number; y: number; w: number; h: number; rot: number; imgIdx: number }

function crossLayout(count: number): ImageSlot[] {
  if (count === 0) return []
  const cx = W / 2, cy = H / 2
  const vCount = Math.ceil(count / 2), hCount = count - vCount
  const slots: ImageSlot[] = []
  const indices = shuffle(Array.from({ length: count }, (_, i) => i))
  for (let i = 0; i < vCount; i++) {
    const s = rand(SCALE_MIN, SCALE_MAX)
    slots.push({ x: cx + rand(-JITTER, JITTER), y: cy + (i - (vCount - 1) / 2) * CROSS_V_SPACING + rand(-JITTER * 0.5, JITTER * 0.5), rot: rand(-ROT_MAX, ROT_MAX), w: IMG_W * s, h: IMG_H * s, imgIdx: indices[i] })
  }
  for (let i = 0; i < hCount; i++) {
    const s = rand(SCALE_MIN, SCALE_MAX)
    slots.push({ x: cx + (i - (hCount - 1) / 2) * CROSS_H_SPACING + rand(-JITTER * 0.5, JITTER * 0.5), y: cy + rand(-JITTER, JITTER), rot: rand(-ROT_MAX, ROT_MAX), w: IMG_W * s, h: IMG_H * s, imgIdx: indices[vCount + i] })
  }
  return shuffle(slots)
}

function circleLayout(count: number): ImageSlot[] {
  if (count === 0) return []
  const cx = W / 2, cy = H / 2
  const indices = shuffle(Array.from({ length: count }, (_, i) => i))
  const slots = indices.map((imgIdx, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2
    const jx = rand(-CIRCLE_JX, CIRCLE_JX), jy = rand(-CIRCLE_JY, CIRCLE_JY)
    const r = CIRCLE_R + jx
    const s = rand(CIRCLE_SCALE_MIN, CIRCLE_SCALE_MAX)
    return {
      x: cx + Math.cos(angle) * r - Math.sin(angle) * jy,
      y: cy + Math.sin(angle) * r + Math.cos(angle) * jy,
      rot: angle + Math.PI / 2,
      w: CIRCLE_W * s, h: CIRCLE_H * s,
      imgIdx,
    }
  })
  return shuffle(slots)
}

function letterLayout(letter: string, count: number): ImageSlot[] {
  if (count === 0) return []
  const bitmap = LETTER_BITMAPS[letter.toUpperCase()]
  if (!bitmap) return []
  const rows = bitmap.length
  const cols = bitmap[0].length
  const cells: { row: number; col: number }[] = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (bitmap[r][c] === '1') cells.push({ row: r, col: c })
  if (cells.length === 0) return []
  const PAD = 80
  const cellW = (W - PAD * 2) / cols
  const cellH = (H - PAD * 2) / rows
  return shuffle(cells).map((cell, i) => ({
    x: PAD + (cell.col + 0.5) * cellW + rand(-cellW * 0.08, cellW * 0.08),
    y: PAD + (cell.row + 0.5) * cellH + rand(-cellH * 0.08, cellH * 0.08),
    rot: rand(-ROT_MAX * 0.6, ROT_MAX * 0.6),
    w: cellW * 0.9 * rand(0.92, 1.08),
    h: cellH * 0.9 * rand(0.92, 1.08),
    imgIdx: i % count,
  }))
}

function drawImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, rot: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.beginPath()
  ctx.rect(-w / 2, -h / 2, w, h)
  ctx.clip()
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const sw = img.naturalWidth * scale, sh = img.naturalHeight * scale
  ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh)
  ctx.restore()
}

interface CollageHandle { randomize: () => void; exportAsJPG: () => void }

const CollageCanvas = forwardRef<CollageHandle, {
  images: HTMLImageElement[]
  maskType: MaskType
  typeText: string
  letterChoice: string
}>(({ images, maskType, typeText, letterChoice }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const slotsRef = useRef<ImageSlot[]>([])
  const defaultPositionsRef = useRef<{ x: number; y: number; rotation: number; scale: number }[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
  }, [])

  function randomizePositions() {
    const count = images.length
    slotsRef.current = maskType === 'cross' ? crossLayout(count)
      : maskType === 'circle' ? circleLayout(count)
      : maskType === 'letter' ? letterLayout(letterChoice, count)
      : []
    defaultPositionsRef.current = images.map(() => ({
      x: 100 + Math.random() * (W - 200),
      y: 80 + Math.random() * (H - 160),
      rotation: (Math.random() - 0.5) * 0.5,
      scale: 0.85 + Math.random() * 0.3,
    }))
  }

  function redraw() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = 'rgb(245,245,245)'
    ctx.fillRect(0, 0, W, H)

    if (maskType === 'cross' || maskType === 'circle' || maskType === 'letter') {
      for (const slot of slotsRef.current) {
        drawImage(ctx, images[slot.imgIdx], slot.x, slot.y, slot.w, slot.h, slot.rot)
      }
    } else if (maskType === 'triptych') {
      const stripH = H / 3
      images.slice(0, 3).forEach((img, i) => {
        drawImage(ctx, img, TRIPTYCH_X + TRIPTYCH_W / 2, i * stripH + stripH / 2, TRIPTYCH_W, stripH, 0)
      })
    } else {
      defaultPositionsRef.current.forEach((pos, i) => {
        if (images.length === 0) return
        const img = images[i % images.length]
        const maxDim = 120
        const p = maxDim / Math.max(img.naturalWidth, img.naturalHeight) * pos.scale
        const iw = img.naturalWidth * p, ih = img.naturalHeight * p
        ctx.save()
        ctx.translate(pos.x, pos.y)
        ctx.rotate(pos.rotation)
        ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih)
        ctx.restore()
      })
    }

    const text = (typeText ?? '').trim()
    if (text) {
      ctx.save()
      const maxWidth = W * 0.9
      let fontSize = 120
      ctx.font = `${fontSize}px 'New Rocker', cursive`
      const measured = ctx.measureText(text).width
      if (measured > maxWidth) fontSize = Math.floor(fontSize * (maxWidth / measured))
      ctx.font = `${fontSize}px 'New Rocker', cursive`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(160,160,160,0.82)'
      ctx.fillText(text, W / 2, H / 2)
      ctx.restore()
    }
  }

  useImperativeHandle(ref, () => ({
    randomize: () => { randomizePositions(); redraw() },
    exportAsJPG: () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const a = document.createElement('a')
      a.download = 'image_collage.jpg'
      a.href = canvas.toDataURL('image/jpeg', 1.0)
      a.click()
    },
  }))

  useEffect(() => {
    randomizePositions()
    redraw()
  }, [maskType])

  useEffect(() => {
    if (maskType !== 'letter') return
    randomizePositions()
    redraw()
  }, [letterChoice])

  useEffect(() => {
    if (images.length === 0) {
      const canvas = canvasRef.current
      if (canvas) {
        const dpr = window.devicePixelRatio || 1
        const ctx = canvas.getContext('2d')!
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.fillStyle = 'rgb(245,245,245)'
        ctx.fillRect(0, 0, W, H)
      }
      return
    }
    randomizePositions()
    redraw()
  }, [images])

  useEffect(() => { redraw() }, [typeText])

  return <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block', width: '100%', height: '100%' }} />
})

const LAYOUTS: { key: MaskType; label: string }[] = [
  { key: 'cross', label: 'Cross' },
  { key: 'circle', label: 'Circle' },
  { key: 'triptych', label: 'Triptych' },
  { key: 'letter', label: 'Letter' },
]

export default function ImageCollage() {
  const [images, setImages] = useState<HTMLImageElement[]>([])
  const [maskType, setMaskType] = useState<MaskType>('none')
  const [typeEnabled, setTypeEnabled] = useState(false)
  const [typeText, setTypeText] = useState('')
  const [letterChoice, setLetterChoice] = useState('A')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const collageRef = useRef<CollageHandle>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const { width } = el.getBoundingClientRect()
      if (width) setScale(width / W)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  async function loadFiles(files: File[]) {
    const toLoad = maskType === 'triptych' ? files.slice(0, 3) : files
    const loaded: HTMLImageElement[] = []
    for (const file of toLoad) {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const el = new Image()
            el.onload = () => resolve(el)
            el.onerror = reject
            el.src = e.target!.result as string
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        loaded.push(img)
      } catch { /* skip failed images */ }
    }
    setImages(loaded)
  }

  const toggleMask = (m: MaskType) => setMaskType((prev) => prev === m ? 'none' : m)

  const clear = () => {
    setImages([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col md:flex-row overflow-hidden">
      <div className="flex-none h-[100vw] md:flex-1 md:h-auto flex items-center justify-center p-4 min-w-0 order-1 md:order-2">
        <div ref={containerRef} className="h-full aspect-square max-w-full relative overflow-hidden">
          {images.length === 0 && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer z-10 bg-white"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="w-10 h-10" fill="none" viewBox="0 0 40 40">
                <path d="M20 8V28M20 8L13 15M20 8L27 15" stroke="#D1D5DC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <path d="M6 30V33.3333C6 34.8061 7.19391 36 8.66667 36H31.3333C32.8061 36 34 34.8061 34 33.3333V30" stroke="#D1D5DC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <p className="text-xs text-gray-400">Click to upload images</p>
            </div>
          )}
          <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, transformOrigin: 'top left', transform: `scale(${scale})` }}>
            <CollageCanvas ref={collageRef} images={images} maskType={maskType} typeText={typeEnabled ? typeText : ''} letterChoice={letterChoice} />
          </div>
        </div>
      </div>

      <div className="w-full md:w-64 md:flex-shrink-0 flex-1 min-h-0 md:flex-none overflow-y-auto px-[26px] pt-[26px] pb-[26px] flex flex-col gap-6 order-2 md:order-1">
        <div className="h-6 flex items-center">
          <Link to="/" className="text-white hover:text-gray-300 text-xs underline">← Home</Link>
        </div>

        <div className="flex flex-col gap-1">
          <label className="block text-xs text-white">Layout</label>
          <div className="flex flex-col gap-1 mt-3">
            {LAYOUTS.map(({ key, label }) => {
              const active = maskType === key
              return (
                <button key={key} onClick={() => toggleMask(key)} className={`w-full flex items-center justify-between p-[7px] border text-xs focus:outline-none transition-colors ${active ? 'border-white bg-white text-black' : 'border-gray-700 bg-transparent text-gray-500 hover:border-gray-400'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-none" style={{ background: active ? '#030213' : '#4b5563' }} />
                    <span>{label}</span>
                  </div>
                  <span className="text-[9px] opacity-60">{active ? 'on' : 'off'}</span>
                </button>
              )
            })}
          </div>
          {maskType === 'letter' && (
            <div className="mt-3">
              <label className="text-xs text-white block mb-2">Choose letter</label>
              <div className="flex flex-wrap gap-1">
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => (
                  <button
                    key={l}
                    onClick={() => setLetterChoice(l)}
                    className={`w-7 h-7 text-xs flex items-center justify-center border focus:outline-none transition-colors ${letterChoice === l ? 'border-white bg-white text-black' : 'border-gray-700 bg-transparent text-gray-500 hover:border-gray-400'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="block text-xs text-white">Type Overlay</label>
          <div className="flex flex-col gap-1 mt-3">
            <button onClick={() => setTypeEnabled((v) => !v)} className={`w-full flex items-center justify-between p-[7px] border text-xs focus:outline-none transition-colors ${typeEnabled ? 'border-white bg-white text-black' : 'border-gray-700 bg-transparent text-gray-500 hover:border-gray-400'}`}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-none" style={{ background: typeEnabled ? '#030213' : '#4b5563' }} />
                <span>Type</span>
              </div>
              <span className="text-[9px] opacity-60">{typeEnabled ? 'on' : 'off'}</span>
            </button>
          </div>
          {typeEnabled && (
            <div className="flex flex-col gap-1 mt-2">
              <label className="text-xs text-white">Overlay text</label>
              <div className="flex gap-1 items-start">
                <textarea
                  value={typeText}
                  onChange={(e) => setTypeText(e.target.value)}
                  placeholder="Enter text…"
                  className="flex-1 p-1.5 border border-white bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-white text-xs placeholder-gray-500"
                  rows={2}
                />
                {typeText && (
                  <button onClick={() => setTypeText('')} className="text-gray-500 hover:text-white text-xs pt-1.5 focus:outline-none">✕</button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <button onClick={() => fileInputRef.current?.click()} className="w-full p-1.5 bg-white border border-white text-black hover:bg-gray-200 focus:outline-none text-xs h-[30px] flex items-center justify-center">
            Upload Images
          </button>
          <button onClick={() => collageRef.current?.randomize()} disabled={images.length === 0} className="w-full p-1.5 bg-white border border-white text-black hover:bg-gray-200 focus:outline-none text-xs h-[30px] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed">
            Randomise
          </button>
          <button onClick={() => collageRef.current?.exportAsJPG()} disabled={images.length === 0} className="w-full p-1.5 bg-white border border-white text-black hover:bg-gray-200 focus:outline-none text-xs h-[30px] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed">
            Share with the World
          </button>
          <button onClick={clear} disabled={images.length === 0} className="w-full p-1.5 bg-white border border-white text-black hover:bg-gray-200 focus:outline-none text-xs h-[30px] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed">
            Clear All
          </button>
        </div>

        <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={(e) => { if (e.target.files) loadFiles(Array.from(e.target.files)) }} className="hidden" />
      </div>
    </div>
  )
}
