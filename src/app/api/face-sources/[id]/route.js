import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET single face source
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const faceSource = await prisma.faceSource.findUnique({
      where: { id },
      include: { author: true }
    });
    
    if (!faceSource) {
      return NextResponse.json({ error: 'Face source not found' }, { status: 404 });
    }
    
    return NextResponse.json(faceSource);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT (update) face source
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    
    const updatedFaceSource = await prisma.faceSource.update({
      where: { id },
      data: {
        name: data.name,
        filePath: data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        usageCount: data.usageCount,
        lastUsedAt: data.lastUsedAt,
        isActive: data.isActive
      }
    });
    
    return NextResponse.json(updatedFaceSource);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE face source
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Soft delete by setting isActive to false
    const deletedFaceSource = await prisma.faceSource.update({
      where: { id },
      data: { isActive: false }
    });
    
    return NextResponse.json(deletedFaceSource);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}