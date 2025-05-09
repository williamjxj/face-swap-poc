import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all face sources
export async function GET() {
  try {
    const faceSources = await prisma.faceSource.findMany({
      where: { isActive: true },
      include: { author: true }
    });
    return NextResponse.json(faceSources);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST new face source
export async function POST(request) {
  try {
    const data = await request.json();
    const faceSource = await prisma.faceSource.create({
      data: {
        name: data.name,
        filePath: data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        authorId: data.authorId,
      }
    });
    return NextResponse.json(faceSource, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}