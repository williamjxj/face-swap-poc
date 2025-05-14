import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET single generated media
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const generatedMedia = await prisma.generatedMedia.findUnique({
      where: { id },
      include: {
        author: true,
        targetTemplate: true,
        faceSource: true
      }
    });
    
    if (!generatedMedia) {
      return NextResponse.json({ error: 'Generated media not found' }, { status: 404 });
    }
    
    return NextResponse.json(generatedMedia);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT (update) generated media
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    
    const updatedGeneratedMedia = await prisma.generatedMedia.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        tempPath: data.tempPath,
        filePath: data.filePath,
        thumbnailPath: data.thumbnailPath,
        fileSize: data.fileSize,
        isPaid: data.isPaid,
        playCount: data.playCount,
        downloadCount: data.downloadCount,
        isActive: data.isActive
      }
    });
    
    return NextResponse.json(updatedGeneratedMedia);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE generated media
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Soft delete by setting isActive to false
    const deletedGeneratedMedia = await prisma.generatedMedia.update({
      where: { id },
      data: { isActive: false }
    });
    
    return NextResponse.json(deletedGeneratedMedia);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}