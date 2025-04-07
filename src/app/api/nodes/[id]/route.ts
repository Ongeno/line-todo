import { NextResponse } from 'next/server';
import { dbOperations } from '@/lib/dbOperations';

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // 确保先await params
    const params = await context.params;
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Node ID is required' },
        { status: 400 }
      );
    }

    dbOperations.deleteNode(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete node:', error);
    return NextResponse.json(
      { error: 'Failed to delete node' },
      { status: 500 }
    );
  }
} 