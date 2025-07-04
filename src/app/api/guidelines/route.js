import { NextResponse } from 'next/server'
import { getGuidelines } from '@/lib/supabase-db'

// GET all guidelines from the proper guidelines table
export async function GET() {
  try {
    // Get guidelines from the guidelines table
    const guidelines = await getGuidelines()

    if (!guidelines || guidelines.length === 0) {
      return NextResponse.json({ message: 'No guidelines found' }, { status: 404 })
    }

    // Format guidelines for UI (they already have the correct structure)
    const formattedGuidelines = guidelines.map(guideline => ({
      id: guideline.id,
      filename: guideline.filename,
      title: guideline.filename, // Use filename as title for compatibility
      width: guideline.width,
      height: guideline.height,
      fileType: guideline.fileType,
      fileSize: guideline.fileSize,
      filePath: guideline.filePath,
      imagePath: guideline.filePath, // Use filePath as imagePath for UI
      isAllowed: guideline.isAllowed,
      createdAt: guideline.createdAt,
      updatedAt: guideline.updatedAt,
    }))

    return NextResponse.json(formattedGuidelines)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
