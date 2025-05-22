import { NextResponse } from 'next/server'
import { optimizeVideo, analyzeVideo } from '@/utils/videoOptimizer'
import path from 'path'
import fs from 'fs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/services/auth'

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request data
    const data = await request.json()
    const { videoPath, options } = data

    if (!videoPath) {
      return NextResponse.json(
        {
          error: 'Missing videoPath parameter',
        },
        { status: 400 }
      )
    }

    // Normalize file path
    const publicDir = path.join(process.cwd(), 'public')
    const videoPathWithoutLeadingSlash = videoPath.startsWith('/')
      ? videoPath.substring(1)
      : videoPath
    const fullVideoPath = path.join(publicDir, videoPathWithoutLeadingSlash)

    // Check if file exists
    if (!fs.existsSync(fullVideoPath)) {
      return NextResponse.json(
        {
          error: 'Video file not found',
        },
        { status: 404 }
      )
    }

    // Analyze video first
    const videoInfo = await analyzeVideo(fullVideoPath)

    // Set up optimization options
    const defaultOptions = {
      width: 720,
      preset: 'veryfast', // Default to fast encoding
      crf: 23, // Default quality
      keyframeInterval: 2,
      generateThumbnail: true,
    }

    // Merge options with defaults
    const optimizationOptions = { ...defaultOptions, ...options }

    // Prepare output path in public folder
    const fileName = path.basename(videoPathWithoutLeadingSlash)
    const fileExt = path.extname(fileName)
    const baseName = path.basename(fileName, fileExt)

    const outputDir = path.join(publicDir, 'outputs', 'optimized')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const outputFileName = `${baseName}_opt${fileExt}`
    const outputPath = path.join(outputDir, outputFileName)

    // Run optimization
    const result = await optimizeVideo(fullVideoPath, {
      ...optimizationOptions,
      outputPath,
    })

    // Format response paths to be relative to public folder
    const relativePath = result.outputPath.replace(publicDir, '')
    const relativeThumbnailPath = result.thumbnailPath
      ? result.thumbnailPath.replace(publicDir, '')
      : null

    // Analyze optimized video to get statistics
    const optimizedInfo = await analyzeVideo(result.outputPath)

    // Calculate size reduction percentage
    const originalSize = videoInfo.size
    const optimizedSize = optimizedInfo.size
    const sizeReduction =
      originalSize > 0 ? ((originalSize - optimizedSize) / originalSize) * 100 : 0

    return NextResponse.json({
      success: true,
      original: {
        path: videoPath,
        ...videoInfo,
      },
      optimized: {
        path: relativePath.startsWith('/') ? relativePath : `/${relativePath}`,
        thumbnailPath: relativeThumbnailPath
          ? relativeThumbnailPath.startsWith('/')
            ? relativeThumbnailPath
            : `/${relativeThumbnailPath}`
          : null,
        ...optimizedInfo,
      },
      stats: {
        sizeReduction: sizeReduction.toFixed(2),
        originalSize: originalSize,
        optimizedSize: optimizedSize,
      },
    })
  } catch (error) {
    console.error('Video optimization error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Video optimization failed',
      },
      { status: 500 }
    )
  }
}
