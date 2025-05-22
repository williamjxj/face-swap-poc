import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function DELETE(request) {
  try {
    const { filename } = await request.json()

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), 'public', 'outputs', filename)

    try {
      // Check if file exists before deleting
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      } else {
        console.warn(`Warning: File not found for deletion: ${filePath}`)
      }
    } catch (error) {
      console.warn('Warning: Could not delete output file:', error)
      // Continue with operation even if file deletion fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting output file:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
