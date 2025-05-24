export default function Loading() {
  return (
    <div className="inline-flex items-center gap-2">
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        className="animate-spin"
      >
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round"
        >
          <animate
            attributeName="stroke-dasharray"
            values="0,100;100,0"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  )
}
