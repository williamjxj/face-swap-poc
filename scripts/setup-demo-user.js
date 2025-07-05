#!/usr/bin/env node

/**
 * Setup Demo User Script
 * Creates the demo user account for testing purposes
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const DEMO_USER = {
  email: 'demo@example.com',
  password: '123456',
  name: 'Demo User',
}

async function setupDemoUser() {
  try {
    console.log('🚀 Setting up demo user...')

    // Check if demo user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', DEMO_USER.email)
      .single()

    if (existingUser) {
      console.log('✅ Demo user already exists:', existingUser.email)
      return existingUser
    }

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(DEMO_USER.password, 10)

    // Create demo user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          id: uuidv4(),
          email: DEMO_USER.email,
          name: DEMO_USER.name,
          password_hash: passwordHash,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (createError) {
      throw createError
    }

    console.log('✅ Demo user created successfully!')
    console.log('📧 Email:', DEMO_USER.email)
    console.log('🔑 Password:', DEMO_USER.password)
    console.log('👤 Name:', DEMO_USER.name)

    return newUser
  } catch (error) {
    console.error('❌ Error setting up demo user:', error)
    process.exit(1)
  }
}

// Run the setup
setupDemoUser()
  .then(() => {
    console.log('🎉 Demo user setup completed!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Setup failed:', error)
    process.exit(1)
  })
