'use client'

import { useState, useEffect } from 'react'

export default function InputDebugger() {
  const [logs, setLogs] = useState([])
  const [visible, setVisible] = useState(false)
  
  useEffect(() => {
    // Keep track of input events for debugging
    const originalConsoleLog = console.log
    
    console.log = (...args) => {
      // Only track input-related logs
      const logStr = args.join(' ')
      if (logStr.includes('input') || 
          logStr.includes('focus') || 
          logStr.includes('click') || 
          logStr.includes('change') || 
          logStr.includes('submit')) {
        setLogs(prev => [{ time: new Date().toLocaleTimeString(), message: logStr }, ...prev].slice(0, 20))
      }
      originalConsoleLog(...args)
    }
    
    // Cleanup
    return () => {
      console.log = originalConsoleLog
    }
  }, [])
  
  return (
    <>
      <button
        onClick={() => setVisible(!visible)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 9999,
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '5px 10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        {visible ? 'Hide' : 'Show'} Debug
      </button>
      
      {visible && (
        <div
          style={{
            position: 'fixed',
            bottom: '50px',
            right: '10px',
            width: '400px',
            maxHeight: '300px',
            overflowY: 'auto',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '4px',
            zIndex: 9998,
            fontSize: '12px',
            fontFamily: 'monospace'
          }}
        >
          <h3 style={{ margin: '0 0 10px' }}>Input Debug Logs</h3>
          {logs.length === 0 && <p>No input events captured yet...</p>}
          {logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '5px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '5px' }}>
              <span style={{ color: '#a0aec0' }}>{log.time}: </span>
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
