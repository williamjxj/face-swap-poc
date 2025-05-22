'use client'

export default function CloseButton({ onClick, variant = 'default', size = 'medium' }) {
  // Base style from face-fusion/page.jsx
  const baseStyle =
    'w-8 h-8 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full flex items-center justify-center cursor-pointer'

  // Different styling variants
  const styles = {
    // All variants now use the exact same style as face-fusion/page.jsx
    default: baseStyle,
    light: baseStyle,
    dark: baseStyle,
    gallery: baseStyle,
  }

  // Size variants for the × character
  const sizeStyles = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl',
  }

  return (
    <button onClick={onClick} className={styles[variant]} aria-label="Close">
      {/* Use the × character instead of the X component for consistency */}
      <span className={`${sizeStyles[size]} pointer-events-none`}>×</span>
    </button>
  )
}
