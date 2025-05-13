import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET single template
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        author: true,
        generatedMedia: true
      }
    });
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT (update) template
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    
    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        filePath: data.filePath,
        thumbnailPath: data.thumbnailPath,
        fileSize: data.fileSize,
        duration: data.duration,
        mimeType: data.mimeType,
        usageCount: data.usageCount,
        lastUsedAt: data.lastUsedAt,
        isActive: data.isActive
      }
    });
    
    return NextResponse.json(updatedTemplate);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE template
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Soft delete by setting isActive to false
    const deletedTemplate = await prisma.template.update({
      where: { id },
      data: { isActive: false }
    });
    
    return NextResponse.json(deletedTemplate);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}