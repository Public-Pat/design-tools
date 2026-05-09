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

function measureChars(text: string, fontSize: number, fontFamily: string): number[] {
  const ctx = document.createElement('canvas').getContext('2d')!
  ctx.font = `${fontSize}px ${fontFamily}`
  return text.split('').map((ch) => ctx.measureText(ch).width)
}

function wordFontSize(word: string, wordIndex: number, baseFontSize: number, variance: number): number {
  if (variance === 0) return baseFontSize
  let hash = 0
  for (let i = 0; i < word.length; i++) hash = (hash * 31 + word.charCodeAt(i)) & 0x7fffffff
  hash = Math.abs(hash ^ (wordIndex * 1234567)) % 1000
  const t = hash / 1000
  const lo = baseFontSize * (1 - variance * 0.5)
  const hi = baseFontSize * (1 + variance * 0.5)
  return Math.max(4, Math.round(lo + t * (hi - lo)))
}

interface Ring {
  text: string
  radius: number
  rotationOffset: number
  visible: boolean
  color: string
  fontSize: number
  sizeVariance: number
  tracking: number
  wordGap: number
}

function CircularRing({ text, radius, rotationDeg, color, fontSize, sizeVariance, fontFamily, tracking, wordGap }: {
  text: string; radius: number; rotationDeg: number; color: string
  fontSize: number; sizeVariance: number; fontFamily: string; tracking: number; wordGap: number
}) {
  if (!text || radius < 5) return null
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return null

  const fontSizes = words.map((w, i) => wordFontSize(w, i, fontSize, sizeVariance))
  const wordAngles = words.map((w, i) => {
    const fs = fontSizes[i]
    return measureChars(w, fs, fontFamily).reduce((sum, cw) => sum + cw * tracking / radius, 0)
  })
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
      const word = words[wi]
      const fs = fontSizes[wi]
      const charWidths = measureChars(word, fs, fontFamily).map((cw) => cw * tracking / radius)
      for (let ci = 0; ci < word.length; ci++) {
        const mid = angle + charWidths[ci] / 2
        if (mid >= endAngle) break outer
        chars.push({ ch: word[ci], angleDeg: mid * (180 / Math.PI), size: fs })
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
            fontFamily={fontFamily}
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

const CircularTypeCanvas = forwardRef<CircularTypeHandle, { rings: Ring[]; globalRotation: number; bgColor: string }>(
  ({ rings, globalRotation, bgColor }, ref) => {
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
        style={{ display: 'block', width: '100%', height: 'auto' }}
      >
        <rect width={SVG_SIZE} height={SVG_SIZE} fill={bgColor} />
        {rings.map((ring, i) =>
          ring.visible ? (
            <CircularRing
              key={i}
              text={ring.text}
              radius={ring.radius}
              rotationDeg={globalRotation + ring.rotationOffset}
              color={ring.color}
              fontSize={ring.fontSize}
              sizeVariance={ring.sizeVariance}
              fontFamily={FONT_FAMILY}
              tracking={ring.tracking}
              wordGap={ring.wordGap}
            />
          ) : null
        )}
      </svg>
    )
  }
)

export default function TypeTool() {
  const [rotation, setRotation] = useState([0])
  const [paletteIdx, setPaletteIdx] = useState(0)
  const palette = COLOR_PALETTES[paletteIdx]

  const [r1, setR1] = useState([80])
  const [r2, setR2] = useState([110])
  const [r3, setR3] = useState([140])
  const [r4, setR4] = useState([170])

  const [t1, setT1] = useState('BK143 KY235 GN54')
  const [t2, setT2] = useState('GN54 GW71 ML83')
  const [t3, setT3] = useState('GN54 GW71 ML83 GN80')
  const [t4, setT4] = useState('GN54 GW71 ML83 GN80 BK143 KY235')

  const [v1, setV1] = useState(true)
  const [v2, setV2] = useState(true)
  const [v3, setV3] = useState(true)
  const [v4, setV4] = useState(true)

  const [tracking, setTracking] = useState([1.3])
  const [fontSize, setFontSize] = useState([28])
  const [sizeVariance, setSizeVariance] = useState([1])
  const [wordGap, setWordGap] = useState([8])

  const canvasRef = useRef<CircularTypeHandle>(null)

  const rings: Ring[] = [
    { text: t1, radius: r1[0], rotationOffset: 0, visible: v1, color: palette.text, fontSize: fontSize[0], sizeVariance: sizeVariance[0], tracking: tracking[0], wordGap: wordGap[0] },
    { text: t2, radius: r2[0], rotationOffset: 0, visible: v2, color: palette.text, fontSize: fontSize[0], sizeVariance: sizeVariance[0], tracking: tracking[0], wordGap: wordGap[0] },
    { text: t3, radius: r3[0], rotationOffset: 0, visible: v3, color: palette.text, fontSize: fontSize[0], sizeVariance: sizeVariance[0], tracking: tracking[0], wordGap: wordGap[0] },
    { text: t4, radius: r4[0], rotationOffset: 0, visible: v4, color: palette.text, fontSize: fontSize[0], sizeVariance: sizeVariance[0], tracking: tracking[0], wordGap: wordGap[0] },
  ]

  const randomize = useCallback(() => {
    setPaletteIdx(Math.floor(Math.random() * COLOR_PALETTES.length))
    setRotation([Math.floor(Math.random() * 360)])
    setR1([Math.floor(Math.random() * 180) + 30])
    setR2([Math.floor(Math.random() * 180) + 80])
    setR3([Math.floor(Math.random() * 180) + 150])
    setR4([Math.floor(Math.random() * 100) + 260])
    setV1(Math.random() > 0.2)
    setV2(Math.random() > 0.2)
    setV3(Math.random() > 0.2)
    setV4(Math.random() > 0.2)
    setTracking([Math.round((0.8 + Math.random() * 0.6) * 100) / 100])
    setFontSize([Math.floor(Math.random() * 20) + 10])
    setSizeVariance([Math.round(Math.random() * 100) / 100])
    setWordGap([Math.floor(Math.random() * 20)])
  }, [])

  const layers = [
    { label: 'Circle 1 (inner)', vis: v1, setVis: setV1, val: r1, set: setR1 },
    { label: 'Circle 2', vis: v2, setVis: setV2, val: r2, set: setR2 },
    { label: 'Circle 3', vis: v3, setVis: setV3, val: r3, set: setR3 },
    { label: 'Circle 4 (outer)', vis: v4, setVis: setV4, val: r4, set: setR4 },
  ]

  const textInputs = [
    { label: 'TEXT: Circle 1 (inner)', value: t1, set: setT1 },
    { label: 'TEXT: Circle 2', value: t2, set: setT2 },
    { label: 'TEXT: Circle 3', value: t3, set: setT3 },
    { label: 'TEXT: Circle 4 (outer)', value: t4, set: setT4 },
  ]

  return (
    <div className="h-screen bg-black flex flex-col md:flex-row overflow-hidden">
      {/* Preview */}
      <div className="flex-none md:flex-1 flex items-center justify-center p-4 min-w-0 order-1 md:order-2" style={{ height: '45vw', maxHeight: '60vh' }}>
        <div className="h-full aspect-square max-w-full">
          <CircularTypeCanvas ref={canvasRef} rings={rings} globalRotation={rotation[0]} bgColor={palette.bg} />
        </div>
      </div>

      {/* Controls */}
      <div className="w-full md:w-64 flex-shrink-0 flex-1 md:flex-none overflow-y-auto px-[26px] pt-[26px] pb-[26px] flex flex-col gap-6 order-2 md:order-1">
        <div className="h-6 flex items-center">
          <Link to="/" className="text-white hover:text-gray-300 text-xs underline">← Home</Link>
        </div>

        {/* Layer Visibility */}
        <div className="flex flex-col gap-1">
          <label className="block mb-0 text-xs text-white">Layer Visibility</label>
          <div className="flex flex-col gap-1 mt-3">
            {layers.map(({ label, vis, setVis }) => (
              <button
                key={label}
                onClick={() => setVis(!vis)}
                className={`w-full flex items-center justify-between p-[7px] border text-xs focus:outline-none transition-colors ${vis ? 'border-white bg-white text-black' : 'border-gray-700 bg-transparent text-gray-500 hover:border-gray-400'}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-none" style={{ background: vis ? palette.text : '#4b5563' }} />
                  <span>{label}</span>
                </div>
                <span className="text-[9px] opacity-60 tracking-[0.167px]">{vis ? 'on' : 'off'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Circle Size */}
        <div className="flex flex-col gap-[8px]">
          <label className="block text-xs text-white">Circle Size</label>
          {layers.map(({ label, val, set }) => (
            <div key={label} className="flex flex-col gap-1">
              <label className="block text-xs text-white">{label}: {val[0]}px</label>
              <Slider value={val} onChange={set} min={20} max={380} step={1} />
            </div>
          ))}
        </div>

        {/* Positioning */}
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

        {/* Color Scheme */}
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

        {/* Text Inputs */}
        <div className="flex flex-col gap-2">
          {textInputs.map(({ label, value, set }) => (
            <div key={label} className="flex flex-col gap-1">
              <label className="block text-xs text-white">{label}</label>
              <textarea
                value={value}
                onChange={(e) => set(e.target.value)}
                className="w-full p-1.5 border border-white bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-white text-xs placeholder-gray-500"
                rows={2}
              />
            </div>
          ))}
        </div>

        {/* Actions */}
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
