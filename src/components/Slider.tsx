import * as RadixSlider from '@radix-ui/react-slider'

interface SliderProps {
  value: number[]
  onChange: (v: number[]) => void
  min: number
  max: number
  step: number
}

export default function Slider({ value, onChange, min, max, step }: SliderProps) {
  return (
    <RadixSlider.Root
      value={value}
      onValueChange={onChange}
      min={min}
      max={max}
      step={step}
      className="relative flex items-center w-full h-4 cursor-pointer select-none"
    >
      <RadixSlider.Track className="relative flex-1 h-[2px] bg-gray-700 rounded-full">
        <RadixSlider.Range className="absolute h-full bg-white rounded-full" />
      </RadixSlider.Track>
      <RadixSlider.Thumb className="block w-3 h-3 bg-white border border-white rounded-full focus:outline-none" />
    </RadixSlider.Root>
  )
}
