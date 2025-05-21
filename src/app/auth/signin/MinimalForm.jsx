'use client'

export default function MinimalForm() {
  return (
    <div style={{
      margin: '20px auto',
      padding: '20px',
      maxWidth: '400px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '20px', 
        color: '#333' 
      }}>
        Minimal Form
      </h2>
      
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          const email = document.getElementById('minimal-email').value;
          const password = document.getElementById('minimal-password').value;
          alert(`Form submitted with: ${email} / ${password ? 'password provided' : 'no password'}`);
        }}
        style={{ width: '100%' }}
      >
        <div style={{ marginBottom: '15px' }}>
          <label 
            htmlFor="minimal-email" 
            style={{ 
              display: 'block', 
              marginBottom: '5px',
              color: '#555',
              fontSize: '14px'
            }}
          >
            Email Address
          </label>
          <input 
            type="email" 
            id="minimal-email" 
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }} 
            placeholder="your@email.com"
            required
            onClick={e => {
              e.stopPropagation();
              e.target.focus();
              console.log('Minimal email clicked');
            }}
            onFocus={() => console.log('Minimal email focused')}
            onChange={e => console.log('Minimal email changed:', e.target.value)}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label 
            htmlFor="minimal-password" 
            style={{ 
              display: 'block', 
              marginBottom: '5px',
              color: '#555',
              fontSize: '14px'
            }}
          >
            Password
          </label>
          <input 
            type="password" 
            id="minimal-password" 
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }} 
            required
            onClick={e => {
              e.stopPropagation();
              e.target.focus();
              console.log('Minimal password clicked');
            }}
            onFocus={() => console.log('Minimal password focused')}
            onChange={e => console.log('Minimal password changed:', e.target.value.length + ' chars')}
          />
        </div>
        
        <button 
          type="submit"
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Submit Minimal Form
        </button>
      </form>
    </div>
  )
}
