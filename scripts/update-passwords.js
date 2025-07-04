// Script to update user passwords
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updatePasswords() {
  try {
    // Generate hash for 'William1!'
    const password = 'William1!'
    const passwordHash = await bcrypt.hash(password, 10)

    console.log('Generated hash for "William1!":', passwordHash)

    // Update all @2925.com users
    const { data, error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .like('email', '%@2925.com')
      .select()

    if (error) {
      console.error('Error updating passwords:', error)
      return
    }

    console.log(
      'Updated passwords for users:',
      data.map(u => u.email)
    )
    console.log('Total users updated:', data.length)
  } catch (error) {
    console.error('Script error:', error)
  }
}

updatePasswords()
