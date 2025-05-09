import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET single face swap
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const faceSwap = await prisma.faceSwap.findUnique({
      where: { id: parseInt(id) },
      include: {
        faceSource: true,
        template: true,
        generatedMedia: true
      }
    });
    
    if (!faceSwap) {
      return NextResponse.json({ error: 'Face swap not found' }, { status: 404 });
    }
    
    return NextResponse.json(faceSwap);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT (update) face swap
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    
    const updatedFaceSwap = await prisma.faceSwap.update({
      where: { id: parseInt(id) },
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
    
    return NextResponse.json(updatedFaceSwap);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE face swap
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const deletedFaceSwap = await prisma.faceSwap.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json(deletedFaceSwap);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}