import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all generated media
export async function GET() {
  try {
    const generatedMedia = await prisma.generatedMedia.findMany({
      where: { isActive: true },
      include: {
        author: true,
        targetTemplate: true,
        faceSource: true
      }
    });
    return NextResponse.json(generatedMedia);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST new generated media
export async function POST(request) {
  try {
    const data = await request.json();
    const generatedMedia = await prisma.generatedMedia.create({
      data: {
        name: data.name,
        type: data.type,
        tempPath: data.tempPath,
        filePath: data.filePath,
        thumbnailPath: data.thumbnailPath,
        fileSize: data.fileSize,
        authorId: data.authorId,
        templateId: data.templateId,
        faceSourceId: data.faceSourceId
      }
    });
    return NextResponse.json(generatedMedia, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}