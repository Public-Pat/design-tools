import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Link } from 'react-router-dom'
import Slider from '../components/Slider'

const COLOR_PALETTES = [
  { bg: '#65151b', text: '#f9ba79' },
  { bg: '#052A4C', text: '#FFA600' },
  { bg: '#91BBDF', text: '#FFE76E' },
  { bg: '#5cbb7d', text: '#bc4a64' },
  { bg: '#343440', text: '#aaa6b1' },
]

const SVG_SIZE = 800
const CX = SVG_SIZE / 2
const CY = SVG_SIZE / 2
const FONT_FAMILY = "'Stardos Stencil', 'Allerta Stencil', sans-serif"

let _measureCtx: CanvasRenderingContext2D | null = null
function measureChars(text: string, fontSize: number, fontFamily: string): number[] {
  if (!_measureCtx) _measureCtx = document.createElement('canvas').getContext('2d')!
  _measureCtx.font = `${fontSize}px ${fontFamily}`
  return text.split('').map((ch) => _measureCtx!.measureText(ch).width)
}

function wordFontSize(word: string, wordIndex: number, baseFontSize: number, variance: number): number {
  if (variance === 0) return baseFontSize
  let hash = 0
  for (let i = 0; i < word.length; i++) hash = (hash * 31 + word.charCodeAt(i)) & 0x7fffffff
  hash = Math.abs(hash ^ (wordIndex * 1234567)) % 1000
  const lo = baseFontSize * (1 - variance * 0.5)
  const hi = baseFontSize * (1 + variance * 0.5)
  return Math.max(4, Math.round(lo + (hash / 1000) * (hi - lo)))
}

interface RingConfig {
  label: string
  text: string
  radius: number
  visible: boolean
}

interface RingProps {
  text: string
  radius: number
  color: string
  fontSize: number
  sizeVariance: number
  tracking: number
  wordGap: number
  rotationDeg: number
}

const INITIAL_RINGS: RingConfig[] = [
  { label: 'Circle 1 (inner)', text: 'BK143 KY235 GN54', radius: 80, visible: true },
  { label: 'Circle 2', text: 'GN54 GW71 ML83', radius: 110, visible: true },
  { label: 'Circle 3', text: 'GN54 GW71 ML83 GN80', radius: 140, visible: true },
  { label: 'Circle 4 (outer)', text: 'GN54 GW71 ML83 GN80 BK143 KY235', radius: 170, visible: true },
]

const RAND_RADIUS_BASE = [30, 80, 150, 260]
const RAND_RADIUS_RANGE = [180, 180, 180, 100]

function CircularRing({ text, radius, rotationDeg, color, fontSize, sizeVariance, tracking, wordGap }: RingProps) {
  if (!text || radius < 5) return null
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return null

  const fontSizes = words.map((w, i) => wordFontSize(w, i, fontSize, sizeVariance))
  const wordCharWidths = words.map((w, i) =>
    measureChars(w, fontSizes[i], FONT_FAMILY).map((cw) => cw * tracking / radius)
  )
  const wordAngles = wordCharWidths.map((cws) => cws.reduce((sum, cw) => sum + cw, 0))
  const gapAngle = wordGap * (Math.PI / 180)
  const totalAngle = wordAngles.reduce((s, a) => s + a, 0) + gapAngle * words.length
  if (totalAngle <= 0) return null

  const startAngle = (rotationDeg - 90) * (Math.PI / 180)
  const endAngle = startAngle + Math.PI * 2
  const chars: { ch: string; angleDeg: number; size: number }[] = []
  let angle = startAngle
  let iter = 0

  outer: while (angle < endAngle && iter < 200) {
    iter++
    for (let wi = 0; wi < words.length; wi++) {
      const charWidths = wordCharWidths[wi]
      for (let ci = 0; ci < words[wi].length; ci++) {
        const mid = angle + charWidths[ci] / 2
        if (mid >= endAngle) break outer
        chars.push({ ch: words[wi][ci], angleDeg: mid * (180 / Math.PI), size: fontSizes[wi] })
        angle += charWidths[ci]
      }
      angle += gapAngle
      if (angle >= endAngle) break outer
    }
    if (totalAngle >= Math.PI * 2) break
  }

  return (
    <g>
      {chars.map(({ ch, angleDeg, size }, i) => (
        <g key={i} transform={`rotate(${angleDeg}, ${CX}, ${CY})`}>
          <text
            x={CX}
            y={CY - radius}
            textAnchor="middle"
            dominantBaseline="auto"
            fill={color}
            fontSize={`${size}px`}
            fontFamily={FONT_FAMILY}
            style={{ userSelect: 'none' }}
          >
            {ch}
          </text>
        </g>
      ))}
    </g>
  )
}

interface CircularTypeHandle {
  exportAsJPG: () => void
}

const CircularTypeCanvas = forwardRef<CircularTypeHandle, { rings: RingConfig[]; globalRotation: number; bgColor: string; color: string } & Pick<RingProps, 'fontSize' | 'sizeVariance' | 'tracking' | 'wordGap'>>(
  ({ rings, globalRotation, bgColor, color, fontSize, sizeVariance, tracking, wordGap }, ref) => {
    const svgRef = useRef<SVGSVGElement>(null)

    useImperativeHandle(ref, () => ({
      exportAsJPG: () => {
        const svg = svgRef.current
        if (!svg) return
        const serialized = new XMLSerializer().serializeToString(svg)
        const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = SVG_SIZE * 4
          canvas.height = SVG_SIZE * 4
          const ctx = canvas.getContext('2d')!
          ctx.scale(4, 4)
          ctx.drawImage(img, 0, 0, SVG_SIZE, SVG_SIZE)
          URL.revokeObjectURL(url)
          const a = document.createElement('a')
          a.download = 'circular_type.jpg'
          a.href = canvas.toDataURL('image/jpeg', 0.95)
          a.click()
        }
        img.src = url
      },
    }))

    return (
      <svg
        ref={svgRef}
        width={SVG_SIZE}
        height={SVG_SIZE}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <rect width={SVG_SIZE} height={SVG_SIZE} fill={bgColor} />
        {rings.map((ring, i) =>
          ring.visible ? (
            <CircularRing
              key={i}
              text={ring.text}
              radius={ring.radius}
              rotationDeg={globalRotation}
              color={color}
              fontSize={fontSize}
              sizeVariance={sizeVariance}
              tracking={tracking}
              wordGap={wordGap}
            />
          ) : null
        )}
      </svg>
    )
  }
)

export default function TypeTool() {
  const [rings, setRings] = useState<RingConfig[]>(INITIAL_RINGS)
  const [rotation, setRotation] = useState([0])
  const [paletteIdx, setPaletteIdx] = useState(0)
  const [tracking, setTracking] = useState([1.3])
  const [fontSize, setFontSize] = useState([28])
  const [sizeVariance, setSizeVariance] = useState([1])
  const [wordGap, setWordGap] = useState([8])
  const canvasRef = useRef<CircularTypeHandle>(null)
  const palette = COLOR_PALETTES[paletteIdx]

  function updateRing<K extends keyof RingConfig>(i: number, key: K, value: RingConfig[K]) {
    setRings((prev) => prev.map((r, j) => (j === i ? { ...r, [key]: value } : r)))
  }

  const randomize = useCallback(() => {
    setPaletteIdx(Math.floor(Math.random() * COLOR_PALETTES.length))
    setRotation([Math.floor(Math.random() * 360)])
    setRings((prev) =>
      prev.map((r, i) => ({
        ...r,
        radius: RAND_RADIUS_BASE[i] + Math.floor(Math.random() * RAND_RADIUS_RANGE[i]),
        visible: Math.random() > 0.2,
      }))
    )
    setTracking([Math.round((0.8 + Math.random() * 0.6) * 100) / 100])
    setFontSize([Math.floor(Math.random() * 20) + 10])
    setSizeVariance([Math.round(Math.random() * 100) / 100])
    setWordGap([Math.floor(Math.random() * 20)])
  }, [])

  return (
    <div className="h-[100dvh] bg-black flex flex-col md:flex-row overflow-hidden">
      <div className="flex-none h-[45vw] md:flex-1 md:h-full flex items-center justify-center min-w-0 order-1 md:order-2 w-full md:p-4">
        <div className="w-full h-full aspect-square max-h-full max-w-full">
          <CircularTypeCanvas
            ref={canvasRef}
            rings={rings}
            globalRotation={rotation[0]}
            bgColor={palette.bg}
            color={palette.text}
            fontSize={fontSize[0]}
            sizeVariance={sizeVariance[0]}
            tracking={tracking[0]}
            wordGap={wordGap[0]}
          />
        </div>
      </div>

      <div className="w-full md:w-64 flex-shrink-0 flex-1 md:flex-none overflow-y-auto px-[26px] pt-[26px] pb-[26px] flex flex-col gap-6 order-2 md:order-1">
        <div className="h-6 flex items-center">
          <Link to="/" className="text-white hover:text-gray-300 text-xs underline">← Home</Link>
        </div>

        <div className="flex flex-col gap-1">
          <label className="block text-xs text-white">Layer Visibility</label>
          <div className="flex flex-col gap-1 mt-3">
            {rings.map((ring, i) => (
              <button
                key={ring.label}
                onClick={() => updateRing(i, 'visible', !ring.visible)}
                className={`w-full flex items-center justify-between p-[7px] border text-xs focus:outline-none transition-colors ${ring.visible ? 'border-white bg-white text-black' : 'border-gray-700 bg-transparent text-gray-500 hover:border-gray-400'}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-none" style={{ background: ring.visible ? palette.text : '#4b5563' }} />
                  <span>{ring.label}</span>
                </div>
                <span className="text-[9px] opacity-60 tracking-[0.167px]">{ring.visible ? 'on' : 'off'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-[8px]">
          <label className="block text-xs text-white">Circle Size</label>
          {rings.map((ring, i) => (
            <div key={ring.label} className="flex flex-col gap-1">
              <label className="block text-xs text-white">{ring.label}: {ring.radius}px</label>
              <Slider value={[ring.radius]} onChange={(v) => updateRing(i, 'radius', v[0])} min={20} max={380} step={1} />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-[8px]">
          <label className="block text-xs text-white">Positioning Settings</label>
          <div className="flex flex-col gap-1">
            <label className="block text-xs text-white">Rotation: {rotation[0]}°</label>
            <Slider value={rotation} onChange={setRotation} min={0} max={360} step={1} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs text-white">Font size: {fontSize[0]}px</label>
            <Slider value={fontSize} onChange={setFontSize} min={6} max={48} step={1} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs text-white">
              Size variance: {Math.round(sizeVariance[0] * 100)}%
              <span className="text-gray-500"> (0 = uniform)</span>
            </label>
            <Slider value={sizeVariance} onChange={setSizeVariance} min={0} max={1} step={0.01} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs text-white">Word gap: {wordGap[0]}°</label>
            <Slider value={wordGap} onChange={setWordGap} min={0} max={45} step={0.5} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs text-white">
              Tracking: {tracking[0].toFixed(2)}×
              <span className="text-gray-500"> (1.0 = exact)</span>
            </label>
            <Slider value={tracking} onChange={setTracking} min={0.5} max={2} step={0.01} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="block text-xs text-white">Color Scheme</label>
          <div className="flex gap-2 mt-3">
            {COLOR_PALETTES.map((p, i) => (
              <button
                key={i}
                onClick={() => setPaletteIdx(i)}
                className="w-6 h-6 border-2 focus:outline-none"
                style={{ backgroundColor: p.bg, borderColor: paletteIdx === i ? '#fff' : p.bg }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {rings.map((ring, i) => (
            <div key={ring.label} className="flex flex-col gap-1">
              <label className="block text-xs text-white">TEXT: {ring.label}</label>
              <textarea
                value={ring.text}
                onChange={(e) => updateRing(i, 'text', e.target.value)}
                className="w-full p-1.5 border border-white bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-white text-xs placeholder-gray-500"
                rows={2}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => canvasRef.current?.exportAsJPG()}
            className="w-full p-1.5 bg-white border border-white text-black hover:bg-gray-200 focus:outline-none text-xs"
          >
            Export JPG
          </button>
          <button
            onClick={randomize}
            className="w-full p-1.5 bg-transparent border border-white text-white hover:bg-white hover:text-black focus:outline-none text-xs transition-colors"
          >
            Randomize
          </button>
        </div>
      </div>
    </div>
  )
}
