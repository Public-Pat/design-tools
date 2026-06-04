import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Slider from '../components/Slider';

export default function LogoTool() {
  const [text, setText] = useState('publiconeforever');
  const [strokeWeight, setStrokeWeight] = useState([21]);
  const [letterSpacing, setLetterSpacing] = useState([-5]);
  const [extruded, setExtruded] = useState(false);
  const [extrudeDepth, setExtrudeDepth] = useState([14]);

  const fontSize = Math.min(180, 1100 / Math.max(text.length, 1));
  const depth = extrudeDepth[0];

  const textRef = useRef<SVGTextElement>(null);
  const [charCenters, setCharCenters] = useState<number[]>([]);

  useEffect(() => {
    const measure = () => {
      const frame = requestAnimationFrame(() => {
        const el = textRef.current;
        if (!el) return;
        const str = text || 'LOGO';
        const centers: number[] = [];
        for (let i = 0; i < str.length; i++) {
          try {
            const ext = el.getExtentOfChar(i);
            centers.push(ext.x + ext.width / 2);
          } catch { /* skip unmeasurable chars */ }
        }
        setCharCenters(centers);
      });
      return frame;
    };

    const frame = measure();
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
    };
  }, [text, fontSize, letterSpacing]);

  const starY = -(fontSize * 0.68 + 14);
  const starSize = Math.min(22, Math.max(10, fontSize * 0.22));


  const sharedTextProps = useMemo(() => ({
    x: 0,
    y: 0,
    textAnchor: 'middle' as const,
    dominantBaseline: 'central' as const,
    fontFamily: "'Inter', sans-serif",
    fontWeight: 900 as const,
    fontSize,
    letterSpacing: letterSpacing[0],
  }), [fontSize, letterSpacing]);

  // Build extrude layers back-to-front so deeper layers are fully occluded by shallower ones.
  // Layer i=0 is the deepest (largest offset), i=depth-1 is the shallowest side face.
  const extrudeLayers = useMemo(() => {
    if (!extruded) return null;
    return Array.from({ length: depth }, (_, i) => {
      const offset = depth - i;
      return (
        <text
          key={i}
          {...sharedTextProps}
          transform={`translate(${offset}, ${offset})`}
          fill="black"
          stroke="#ff0000"
          strokeWidth={strokeWeight[0]}
          strokeLinejoin="round"
          paintOrder="stroke fill"
        >
          {text || 'LOGO'}
        </text>
      );
    });
  }, [extruded, depth, sharedTextProps, strokeWeight, text]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col md:flex-row overflow-hidden">
      {/* Canvas */}
      <div className="flex-none h-[100vw] md:flex-1 md:h-full flex items-center justify-center min-w-0 order-1 md:order-2 w-full md:p-4">
        <svg viewBox="-300 -300 600 600" className="w-full h-full aspect-square max-h-full max-w-full">
          <rect x="-300" y="-300" width="600" height="600" fill="black" />

          {extrudeLayers}

          {/* Front face */}
          <text
            ref={textRef}
            {...sharedTextProps}
            fill="white"
            stroke="#ff0000"
            strokeWidth={strokeWeight[0]}
            strokeLinejoin="round"
            paintOrder="stroke fill"
          >
            {text || 'LOGO'}
          </text>

          {/* Per-character stars */}
          {charCenters.map((cx, i) => (
            <text
              key={i}
              x={cx}
              y={starY}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={starSize}
              fill="white"
              fontFamily="sans-serif"
            >★</text>
          ))}
        </svg>
      </div>

      {/* Sidebar */}
      <div className="w-full md:w-64 md:flex-shrink-0 bg-black flex flex-col min-h-0 order-2 md:order-1 overflow-y-auto px-[26px] pt-[26px] pb-[26px] gap-6">
        <div className="flex flex-col gap-[8px]">
          <Link to="/" className="text-white hover:text-gray-300 text-xs underline">← Home</Link>
          <p className="text-xs text-white">Logo Tool 0.1.0</p>
        </div>

        <div className="flex flex-col gap-[8px]">
          <label className="text-xs text-white">Text</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="LOGO"
            className="w-full bg-transparent border border-gray-700 text-white text-xs px-2 py-1.5 focus:outline-none focus:border-white"
          />
        </div>

        <div className="flex flex-col gap-[8px]">
          <label className="text-xs text-white">Outline weight: {strokeWeight[0]}</label>
          <Slider value={strokeWeight} onChange={setStrokeWeight} min={0} max={30} step={0.5} />
        </div>

        <div className="flex flex-col gap-[8px]">
          <label className="text-xs text-white">Letter spacing: {letterSpacing[0]}</label>
          <Slider value={letterSpacing} onChange={setLetterSpacing} min={-10} max={60} step={1} />
        </div>

        {/* 3D Extrude */}
        <div className="flex flex-col gap-[8px]">
          <button
            onClick={() => setExtruded(v => !v)}
            className={`w-full h-[30px] flex items-center justify-between px-2 border text-xs focus:outline-none transition-colors ${
              extruded
                ? 'border-white bg-white text-black'
                : 'border-gray-700 bg-transparent text-gray-400 hover:border-gray-400 hover:text-white'
            }`}
          >
            <span>3D Extrude</span>
            <span className="text-[9px] opacity-60">{extruded ? 'on' : 'off'}</span>
          </button>

          {extruded && (
            <>
              <label className="text-xs text-white">Depth: {extrudeDepth[0]}</label>
              <Slider value={extrudeDepth} onChange={setExtrudeDepth} min={1} max={40} step={1} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
