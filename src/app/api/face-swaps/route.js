import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all face swaps
export async function GET() {
  try {
    const faceSwaps = await prisma.faceSwap.findMany({
      include: {
        faceSource: true,
        template: true,
        generatedMedia: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(faceSwaps);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST new face swap
export async function POST(request) {
  try {
    const data = await request.json();
    const faceSwap = await prisma.faceSwap.create({
      data: {
        faceSourceId: data.faceSourceId,
        templateId: data.templateId,
        generatedMediaId: data.generatedMediaId
      },
      include: {
        faceSource: true,
        template: true,
        generatedMedia: true
      }
    });
    return NextResponse.json(faceSwap, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}