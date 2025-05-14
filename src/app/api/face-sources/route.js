import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import db from '@/lib/db';
import { serializeBigInt } from '@/utils/helper';

const prisma = new PrismaClient();

// Helper function to handle BigInt serialization
const sanitizeBigInt = (data) => {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

// GET all face sources
export async function GET() {
  try {
    const sources = await db.faceSource.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    const serializedSources = serializeBigInt(sources);
    return NextResponse.json({ files: serializedSources });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST new face source
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = path.extname(originalName);
    const filename = `${timestamp}_${uuidv4()}${extension}`;

    // Ensure the sources directory exists
    const sourcesDir = path.join(process.cwd(), 'public', 'sources');
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Process image with Sharp
    const image = sharp(fileBuffer);
    const metadata = await image.metadata();
    
    // Save the processed image
    await image.toFile(path.join(sourcesDir, filename));

    // Get file metadata
    const filePath = `/sources/${filename}`;
    const fileSize = file.size;
    const mimeType = file.type;

    // Create record in database
    const faceSource = await prisma.faceSource.create({
      data: {
        filename,
        filePath,
        fileSize: BigInt(fileSize),
        mimeType,
        width: metadata.width || 0,
        height: metadata.height || 0,
        isActive: true
      }
    });

    const sanitizedSource = sanitizeBigInt(faceSource);

    return NextResponse.json({
      id: sanitizedSource.id,
      filename: sanitizedSource.filename,
      filePath: sanitizedSource.filePath,
      width: sanitizedSource.width,
      height: sanitizedSource.height,
      fileSize: sanitizedSource.fileSize
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE face source
export async function DELETE(request) {
  try {
    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Find the face source record
    const faceSource = await prisma.faceSource.findFirst({
      where: {
        filename: filename,
        isActive: true
      }
    });

    if (!faceSource) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.faceSource.update({
      where: {
        id: faceSource.id
      },
      data: {
        isActive: false
      }
    });

    // Delete physical file
    const filePath = path.join(process.cwd(), 'public', faceSource.filePath);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Warning: Could not delete physical file:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting source:', error);
    return NextResponse.json(
      { error: 'Failed to delete source' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}