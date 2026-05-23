'use client'
import { useState } from 'react'
import { ImageOff } from 'lucide-react'

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0)
  const has = images.length > 0

  return (
    <div>
      <div className="aspect-square bg-panel border border-line rounded-lg overflow-hidden flex items-center justify-center">
        {has ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={images[active]} alt={name} className="w-full h-full object-cover" />
        ) : (
          <ImageOff className="w-10 h-10 text-line" />
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-3">
          {images.map((url, i) => (
            <button
              key={url}
              onClick={() => setActive(i)}
              className={`w-16 h-16 rounded border overflow-hidden ${i === active ? 'border-amber' : 'border-line'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
