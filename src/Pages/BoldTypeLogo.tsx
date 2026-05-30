import { useState } from 'react'
import { Link } from 'react-router-dom'
import Slider from '../components/Slider'

export default function BoldTypeLogo() {
  const [text, setText] = useState('publiconeforever')
  const [strokeWeight, setStrokeWeight] = useState([21])
  const [letterSpacing, setLetterSpacing] = useState([-5])

  const fontSize = Math.min(180, 1100 / Math.max(text.length, 1))

  return (
    <div className="fixed inset-0 bg-black flex flex-col md:flex-row overflow-hidden">
      <div className="flex-none h-[100vw] md:flex-1 md:h-full flex items-center justify-center min-w-0 order-1 md:order-2 w-full md:p-4">
        <svg viewBox="-300 -300 600 600" className="w-full h-full aspect-square max-h-full max-w-full">
          <rect x="-300" y="-300" width="600" height="600" fill="black" />
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="'Inter', sans-serif"
            fontWeight={900}
            fontSize={fontSize}
            fill="white"
            stroke="#ff0000"
            strokeWidth={strokeWeight[0]}
            strokeLinejoin="round"
            paintOrder="stroke fill"
            letterSpacing={letterSpacing[0]}
          >
            {text || 'LOGO'}
          </text>
        </svg>
      </div>

      <div className="w-full md:w-64 md:flex-shrink-0 flex-1 min-h-0 md:flex-none overflow-y-auto px-6 pt-4 pb-6 space-y-3 order-2 md:order-1">
        <Link to="/" className="block text-white hover:text-gray-300 text-xs underline">← Home</Link>
        <p className="text-xs text-white">Bold Logo Tool 0.1.0</p>

        <div>
          <label className="block mb-1 text-xs text-white">Text</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="LOGO"
            className="w-full bg-transparent border border-gray-700 text-white text-xs px-2 py-1.5 focus:outline-none focus:border-white"
          />
        </div>

        <div>
          <label className="block mb-1 text-xs text-white">Outline weight: {strokeWeight[0]}</label>
          <Slider value={strokeWeight} onChange={setStrokeWeight} min={0} max={30} step={0.5} />
        </div>

        <div>
          <label className="block mb-1 text-xs text-white">Letter spacing: {letterSpacing[0]}</label>
          <Slider value={letterSpacing} onChange={setLetterSpacing} min={-10} max={60} step={1} />
        </div>
      </div>
    </div>
  )
}
