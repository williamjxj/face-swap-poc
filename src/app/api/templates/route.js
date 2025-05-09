import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all templates
export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      where: { isActive: true },
      include: { author: true }
    });
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST new template
export async function POST(request) {
  try {
    const data = await request.json();
    const template = await prisma.template.create({
      data: {
        name: data.name,
        type: data.type,
        filePath: data.filePath,
        thumbnailPath: data.thumbnailPath,
        fileSize: data.fileSize,
        duration: data.duration,
        mimeType: data.mimeType,
        authorId: data.authorId,
      }
    });
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}