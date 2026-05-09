import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Slider from '../components/Slider'

const FLOWER_CENTER = 22.7025
const BONE_CENTER_X = 5.2615
const BONE_CENTER_Y = 22.8933
const SHAPE_SCALE = 212
const SPIKE_WIDTH = 46
const HIGHLIGHT_RADIUS = 148
const HIGHLIGHT_SIZE = 18
const OUTER_RADIUS = 248
const OUTER_DOT_SIZE = 42
const TAU = Math.PI * 2

const ICON_SCALE_FLOWER = 30 / FLOWER_CENTER
const ICON_SCALE_BONE = 30 / BONE_CENTER_Y
const MAIN_SCALE_FLOWER = SHAPE_SCALE / FLOWER_CENTER
const MAIN_SCALE_BONE = SHAPE_SCALE / BONE_CENTER_Y
const SPIKE_W = SPIKE_WIDTH * 0.78

const FLOWER_PATH = 'M18.498 6.91549C17.0961 3.76264 19.3448 0 22.7952 0C26.2036 0 28.4504 3.675 27.1189 6.81252C25.1068 11.5539 22.8939 17.8674 22.8939 22.7025C22.8939 27.5376 25.1068 33.8512 27.1189 38.5925C28.4504 41.73 26.2036 45.405 22.7952 45.405C19.3448 45.405 17.0961 41.6424 18.498 38.4895C20.601 33.76 22.8939 27.5027 22.8939 22.7025C22.8939 17.9023 20.601 11.645 18.498 6.91549Z'
const BONE_PATH = 'M0.285812 7.18466C-0.872352 3.74223 1.62947 0 5.2615 0C8.86837 0 11.3671 3.69207 10.2477 7.12087C8.69674 11.8721 7.02585 18.1024 7.02585 22.8933C7.02585 27.6842 8.69674 33.9144 10.2477 38.6657C11.3671 42.0945 8.86837 45.7866 5.2615 45.7866C1.62947 45.7866 -0.872353 42.0443 0.285812 38.6019C1.88158 33.8588 3.59186 27.6628 3.59186 22.8933C3.59186 18.1238 1.88158 11.9278 0.285812 7.18466Z'

function spikePath(size: number, width: number) {
  return `M0,${-size}L${width},0L0,${size}L${-width},0Z`
}

function star4Path(r: number) {
  const inner = r * 0.4
  return Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4 - Math.PI / 2
    const radius = i % 2 === 0 ? r : inner
    return `${i === 0 ? 'M' : 'L'}${(radius * Math.cos(angle)).toFixed(2)},${(radius * Math.sin(angle)).toFixed(2)}`
  }).join('') + 'Z'
}

function plusPath(r: number) {
  const t = r * 0.32
  return `M${-t},${-r}L${t},${-r}L${t},${-t}L${r},${-t}L${r},${t}L${t},${t}L${t},${r}L${-t},${r}L${-t},${t}L${-r},${t}L${-r},${-t}L${-t},${-t}Z`
}

type PrimaryShape = 'flower' | 'bone' | 'spike'
type HighlightShape = 'star4' | 'dots' | 'plus' | 'circle'

const PRIMARY_SHAPES: PrimaryShape[] = ['flower', 'bone', 'spike']
const HIGHLIGHT_SHAPES: HighlightShape[] = ['star4', 'dots', 'plus', 'circle']
const LAYER_NAMES = ['Primary shapes', 'Highlight ring', 'Outer circles']

// Icon always shows 4 petals to preview the full shape
function PrimaryShapeIcon({ shape, color }: { shape: PrimaryShape; color: string }) {
  return (
    <svg viewBox="-30 -30 60 60" className="w-full h-full">
      {[0, 45, 90, 135].map((deg) => (
        <g key={deg} transform={`rotate(${deg})`}>
          {shape === 'flower' && (
            <g transform={`scale(${ICON_SCALE_FLOWER}) translate(-${FLOWER_CENTER},-${FLOWER_CENTER})`}>
              <path d={FLOWER_PATH} fill={color} />
            </g>
          )}
          {shape === 'bone' && (
            <g transform={`scale(${ICON_SCALE_BONE}) translate(-${BONE_CENTER_X},-${BONE_CENTER_Y})`}>
              <path d={BONE_PATH} fill={color} />
            </g>
          )}
          {shape === 'spike' && <path d={spikePath(24, 8)} fill={color} />}
        </g>
      ))}
    </svg>
  )
}

function HighlightShapeMark({ type, size, fill }: { type: HighlightShape; size: number; fill: string }) {
  if (type === 'star4') return <path d={star4Path(size)} fill={fill} />
  if (type === 'plus') return <path d={plusPath(size)} fill={fill} />
  if (type === 'circle') return <circle r={size * 0.85} fill={fill} />
  const r = size * 0.35
  const off = size * 0.55
  return (
    <>
      {([[0, -off], [off, 0], [0, off], [-off, 0]] as [number, number][]).map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={fill} />
      ))}
    </>
  )
}

function HighlightShapeIcon({ shape, color }: { shape: HighlightShape; color: string }) {
  return (
    <svg viewBox="-30 -30 60 60" className="w-full h-full">
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (TAU / 8) * i
        return (
          <g key={i} transform={`translate(${(20 * Math.cos(angle)).toFixed(2)},${(20 * Math.sin(angle)).toFixed(2)})`}>
            <HighlightShapeMark type={shape} size={5.5} fill={color} />
          </g>
        )
      })}
    </svg>
  )
}

export default function ShapeTool() {
  const [colors, setColors] = useState(['#00D163', '#FF647B', '#A2A2FF'])
  const [primaryShape, setPrimaryShape] = useState<PrimaryShape>('flower')
  const [highlightShape, setHighlightShape] = useState<HighlightShape>('star4')
  const [count, setCount] = useState(1)
  const [highlightCount, setHighlightCount] = useState(1)
  const [layers, setLayers] = useState([true, true, true])
  const [rotation, setRotation] = useState([0])
  const svgRef = useRef<SVGSVGElement>(null)

  const toggleLayer = (i: number) => setLayers((prev) => prev.map((v, j) => (j === i ? !v : v)))
  const setColor = (i: number, val: string) => setColors((prev) => prev.map((c, j) => (j === i ? val : c)))

  const exportSVG = useCallback(() => {
    if (!svgRef.current) return
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement
    clone.setAttribute('width', '1120')
    clone.setAttribute('height', '1120')
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: 'shape_tool.svg' })
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const o = rotation[0] * Math.PI / 180
  const m = Math.PI / count

  return (
    <div className="h-screen bg-black flex flex-col md:flex-row overflow-hidden">
      <div className="flex-none md:flex-1 flex items-center justify-center min-w-0 order-1 md:order-2 w-full md:p-4 h-[100vw] md:h-full">
        <svg ref={svgRef} viewBox="-300 -300 600 600" className="w-full h-full aspect-square max-h-full max-w-full">
          <rect x="-300" y="-300" width="600" height="600" fill="black" />

          {layers[2] && Array.from({ length: count }, (_, j) => {
            const angle = TAU / count * j + o
            return <circle key={j} cx={+(OUTER_RADIUS * Math.cos(angle)).toFixed(2)} cy={+(OUTER_RADIUS * Math.sin(angle)).toFixed(2)} r={OUTER_DOT_SIZE} fill={colors[2]} />
          })}

          {layers[0] && Array.from({ length: count }, (_, j) => {
            const angleDeg = +((m * j + o) * 180 / Math.PI).toFixed(2)
            return (
              <g key={j} transform={`rotate(${angleDeg})`}>
                {primaryShape === 'flower' && (
                  <g transform={`scale(${MAIN_SCALE_FLOWER}) translate(-${FLOWER_CENTER},-${FLOWER_CENTER})`}>
                    <path d={FLOWER_PATH} fill={colors[0]} />
                  </g>
                )}
                {primaryShape === 'bone' && (
                  <g transform={`scale(${MAIN_SCALE_BONE}) translate(-${BONE_CENTER_X},-${BONE_CENTER_Y})`}>
                    <path d={BONE_PATH} fill={colors[0]} />
                  </g>
                )}
                {primaryShape === 'spike' && <path d={spikePath(SHAPE_SCALE, SPIKE_W)} fill={colors[0]} />}
              </g>
            )
          })}

          {layers[1] && Array.from({ length: highlightCount }, (_, j) => {
            const angle = TAU / highlightCount * j + o + m
            return (
              <g key={j} transform={`translate(${+(HIGHLIGHT_RADIUS * Math.cos(angle)).toFixed(2)},${+(HIGHLIGHT_RADIUS * Math.sin(angle)).toFixed(2)}) rotate(${+(angle * 180 / Math.PI).toFixed(2)})`}>
                <HighlightShapeMark type={highlightShape} size={HIGHLIGHT_SIZE} fill={colors[1]} />
              </g>
            )
          })}
        </svg>
      </div>

      <div className="w-full md:w-64 flex-shrink-0 flex-1 md:flex-none overflow-y-auto px-6 pt-4 pb-6 space-y-3 order-2 md:order-1">
        <Link to="/" className="block text-white hover:text-gray-300 text-xs underline">← Home</Link>
        <p className="text-xs text-white">Shape Tool 0.1.0</p>

        <div>
          <label className="block mb-1 text-xs text-white">Colours</label>
          <div className="flex gap-2">
            {colors.map((c, i) => (
              <label key={i} className="cursor-pointer" title={`Layer ${i + 1} colour`}>
                <input type="color" value={c} onChange={(e) => setColor(i, e.target.value)} className="sr-only" />
                <span className="block w-6 h-6 border-2" style={{ backgroundColor: c, borderColor: c }} />
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-1 text-xs text-white">Primary shapes</label>
          <div className="grid grid-cols-4 gap-1">
            {PRIMARY_SHAPES.map((s) => (
              <button key={s} onClick={() => setPrimaryShape(s)} className={`aspect-square p-1 border-2 focus:outline-none transition-colors ${primaryShape === s ? 'border-white' : 'border-gray-700 hover:border-gray-400'}`} title={s}>
                <PrimaryShapeIcon shape={s} color={colors[0]} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-1 text-xs text-white">Highlight shapes</label>
          <div className="grid grid-cols-4 gap-1">
            {HIGHLIGHT_SHAPES.map((s) => (
              <button key={s} onClick={() => setHighlightShape(s)} className={`aspect-square p-1 border-2 focus:outline-none transition-colors ${highlightShape === s ? 'border-white' : 'border-gray-700 hover:border-gray-400'}`} title={s}>
                <HighlightShapeIcon shape={s} color={colors[1]} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-1 text-xs text-white">Count: {count}</label>
          <Slider value={[count]} onChange={(v) => setCount(v[0])} min={1} max={4} step={1} />
        </div>

        <div>
          <label className="block mb-1 text-xs text-white">Highlight count: {highlightCount}</label>
          <Slider value={[highlightCount]} onChange={(v) => setHighlightCount(v[0])} min={1} max={16} step={1} />
        </div>

        <div>
          <label className="block mb-1 text-xs text-white">Layers</label>
          <div className="space-y-1">
            {LAYER_NAMES.map((name, i) => (
              <button key={name} onClick={() => toggleLayer(i)} className={`w-full flex items-center justify-between p-1.5 border text-xs focus:outline-none transition-colors ${layers[i] ? 'border-white bg-white text-black' : 'border-gray-700 bg-transparent text-gray-500 hover:border-gray-400'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-none" style={{ background: layers[i] ? colors[i] : '#4b5563' }} />
                  <span>{name}</span>
                </div>
                <span className="text-[9px] opacity-60">{layers[i] ? 'on' : 'off'}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-1 text-xs text-white">Rotation: {rotation[0]}°</label>
          <Slider value={rotation} onChange={setRotation} min={0} max={359} step={1} />
        </div>

        <button onClick={exportSVG} className="w-full p-1.5 bg-white border border-white text-black hover:bg-gray-200 focus:outline-none text-xs">
          Share with the World
        </button>
      </div>
    </div>
  )
}
