'use client'
import { useEffect, useState } from 'react'

export default function ProgressLoader({
  progress,
  isIndeterminate = false,
  size = 'medium',
  color = 'blue',
}) {
  const [dots, setDots] = useState('.')

  // For the animated dots when in indeterminate mode
  useEffect(() => {
    if (!isIndeterminate) return

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '.'
        return prev + '.'
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isIndeterminate])

  // Size variants
  const sizeClasses = {
    small: 'w-16 h-1',
    medium: 'w-32 h-2',
    large: 'w-48 h-3',
    full: 'w-full h-2',
  }

  // Color variants
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
  }

  const trackColor = {
    blue: 'bg-blue-200',
    green: 'bg-green-200',
    purple: 'bg-purple-200',
    red: 'bg-red-200',
  }

  if (isIndeterminate) {
    return (
      <div className="flex flex-col items-center space-y-2">
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${trackColor[color]}`}>
          <div className={`h-full animate-indeterminate-progress ${colorClasses[color]}`}></div>
        </div>
        <div className="text-sm text-gray-500">Loading{dots}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative w-full">
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${trackColor[color]}`}>
          <div
            className={`h-full transition-all ease-out duration-300 ${colorClasses[color]}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      {progress !== undefined && (
        <div className="text-sm text-gray-500">{progress.toFixed(0)}% Complete</div>
      )}
    </div>
  )
}
