'use client'

export default function PlainForm() {
  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    console.log('Plain form submission:', data)
    alert(`Submitted: ${JSON.stringify(data)}`)
  }
  
  return (
    <div style={{
      marginTop: '1.5rem',
      width: '100%'
    }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        color: '#1e293b',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>Simple HTML Form</h2>
      
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <div style={{
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <label htmlFor="html-email" style={{
            fontSize: '0.875rem',
            marginBottom: '0.5rem',
            color: '#4b5563',
            fontWeight: 500,
            display: 'inline-block'
          }}>Email Address</label>
          <input 
            id="html-email"
            name="email"
            type="email" 
            placeholder="your@email.com" 
            required
            onFocus={() => console.log('HTML Email field focused')}
            onChange={(e) => console.log('HTML Email changed:', e.target.value)}
            onInput={(e) => console.log('HTML Email input:', e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              backgroundColor: '#f8fafc'
            }}
          />
        </div>
        
        <div style={{
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <label htmlFor="html-password" style={{
            fontSize: '0.875rem',
            marginBottom: '0.5rem',
            color: '#4b5563',
            fontWeight: 500,
            display: 'inline-block'
          }}>Password</label>
          <input 
            id="html-password"
            name="password"
            type="password" 
            placeholder="Your password" 
            required
            onFocus={() => console.log('HTML Password field focused')}
            onChange={(e) => console.log('HTML Password changed:', e.target.value.length + ' chars')}
            onInput={(e) => console.log('HTML Password input:', e.target.value.length + ' chars')}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              backgroundColor: '#f8fafc'
            }}
          />
        </div>
        
        <button 
          type="submit" 
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '0.5rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Submit Plain Form
        </button>
      </form>
    </div>
  )
}
