import { NextResponse } from 'next/server'
import { serializeBigInt } from '@/utils/helper'
import { getGeneratedMediaByUser } from '@/lib/supabase-db'

export async function GET() {
  try {
    // Get all generated media (for demo purposes, showing all to all users)
    // In production, you might want to filter by user
    const outputs = await getGeneratedMediaByUser(null) // null means get all
    const serializedOutputs = serializeBigInt(outputs)
    return NextResponse.json({ files: serializedOutputs })
  } catch (error) {
    console.error('Error listing output files:', error)
    return NextResponse.json({ error: 'Failed to list output files' }, { status: 500 })
  }
}
