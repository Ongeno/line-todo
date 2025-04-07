import { NextResponse } from 'next/server';
import { dbOperations } from '@/lib/dbOperations';

export async function GET() {
  try {
    const nodes = dbOperations.getAllNodes();
    return NextResponse.json(nodes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch nodes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const node = await request.json();
    const createdNode = dbOperations.createNode(node);
    return NextResponse.json(createdNode);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create node' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const node = await request.json();
    const updatedNode = dbOperations.updateNode(node);
    return NextResponse.json(updatedNode);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update node' }, { status: 500 });
  }
} 