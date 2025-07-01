import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { serializeBigInt } from '@/utils/helper'

export async function GET() {
  try {
    const outputs = await db.generatedMedia.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    const serializedOutputs = serializeBigInt(outputs)
    return NextResponse.json({ files: serializedOutputs })
  } catch (error) {
    console.error('Error listing output files:', error)
    return NextResponse.json({ error: 'Failed to list output files' }, { status: 500 })
  }
}
