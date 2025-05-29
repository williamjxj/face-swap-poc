import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    
    console.log(`[DOWNLOAD] Attempting to download file: ${filename}`)

    if (!filename) {
      console.log('[DOWNLOAD] Error: Filename parameter is missing')
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    try {
      // Check if the video exists in the database
      const media = await db.generatedMedia.findUnique({
        where: { name: filename },
      })

      console.log(`[DOWNLOAD] Database lookup result: ${media ? 'Found' : 'Not found'}`)

      // Remove the paid check to allow all media to be downloaded
      // if (!media.isPaid) {
      //   console.log(`[DOWNLOAD] Media is not paid: ${filename}`)
      //   return NextResponse.json({ error: 'Media is not paid for' }, { status: 403 })
      // }

      const filePath = path.join(process.cwd(), 'public', 'outputs', filename)
      console.log(`[DOWNLOAD] Checking file at path: ${filePath}`)

      if (!fs.existsSync(filePath)) {
        console.log(`[DOWNLOAD] File not found at path: ${filePath}`)
        return NextResponse.json({ 
          error: 'File not found on server',
          details: `The file ${filename} does not exist at ${filePath}`
        }, { status: 404 })
      }

      console.log(`[DOWNLOAD] Reading file: ${filePath}`)
      const fileBuffer = fs.readFileSync(filePath)

      console.log(`[DOWNLOAD] File read successfully, size: ${fileBuffer.length} bytes`)
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': media?.mimeType || 'video/mp4',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } catch (dbError) {
      console.error('[DOWNLOAD] Database error:', dbError)
      
      // Even if DB lookup fails, try to serve the file if it exists
      try {
        console.log('[DOWNLOAD] Attempting to serve file directly without DB validation')
        const filePath = path.join(process.cwd(), 'public', 'outputs', filename)
        
        if (fs.existsSync(filePath)) {
          console.log(`[DOWNLOAD] File exists, serving directly: ${filePath}`)
          const fileBuffer = fs.readFileSync(filePath)
          
          return new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': 'video/mp4', // Default to video/mp4
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          })
        } else {
          console.log(`[DOWNLOAD] File not found in fallback check: ${filePath}`)
          return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }
      } catch (fileError) {
        console.error('[DOWNLOAD] File system error in fallback:', fileError)
        return NextResponse.json({ 
          error: 'Failed to access file',
          details: fileError.message
        }, { status: 500 })
      }
    }
  } catch (error) {
    console.error('[DOWNLOAD] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Failed to download media',
      details: error.message
    }, { status: 500 })
  }
}
