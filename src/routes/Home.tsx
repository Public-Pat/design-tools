import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div
      className="bg-black relative w-full min-h-screen overflow-hidden"
      style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 900,
        fontStyle: 'normal',
        fontSize: 'clamp(26px, 4.72vw, 68px)',
        lineHeight: 1,
        letterSpacing: '0.4218px',
        color: 'white',
      }}
    >
      <p className="absolute whitespace-pre" style={{ left: 'clamp(16px, 4vw, 32px)', top: '27px' }}>
        {'Public Websites  '}
        <br />
        Design Tools
      </p>

      <div
        className="absolute flex flex-col items-start"
        style={{ left: 'clamp(16px, 4vw, 32px)', bottom: '32px', gap: '16px' }}
      >
        <Link
          to="/type-tool"
          className="whitespace-nowrap hover:opacity-70 transition-opacity"
          style={{ color: 'white', textDecoration: 'none' }}
        >
          Type Tool 0.1.0 →
        </Link>
        <Link
          to="/image-collage"
          className="whitespace-nowrap hover:opacity-70 transition-opacity"
          style={{ color: 'white', textDecoration: 'none' }}
        >
          Image Collage Test 0.1.0 →
        </Link>
        <Link
          to="/shape-tool"
          className="whitespace-nowrap hover:opacity-70 transition-opacity"
          style={{ color: 'white', textDecoration: 'none' }}
        >
          Shape Tool 0.1.0 →
        </Link>
      </div>
    </div>
  )
}
