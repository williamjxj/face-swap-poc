import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET all guidelines
export async function GET() {
  try {
    const guidelines = await prisma.guideline.findMany()

    if (!guidelines || guidelines.length === 0) {
      return NextResponse.json({ message: 'No guidelines found' }, { status: 404 })
    }

    // Convert BigInt to String during serialization
    const sanitizedGuidelines = JSON.parse(
      JSON.stringify(guidelines, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    )

    return NextResponse.json(sanitizedGuidelines)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
