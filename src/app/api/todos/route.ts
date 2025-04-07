import { NextResponse } from 'next/server';
import { dbOperations } from '@/lib/dbOperations';
import { Todo } from '@/types/timeline';

function validateTodo(todo: Partial<Todo>): string | null {
  if (!todo.id) return 'Todo ID is required';
  if (!todo.nodeId) return 'Node ID is required';
  if (!todo.text || typeof todo.text !== 'string') return 'Valid text is required';
  if (typeof todo.completed !== 'boolean') return 'Completed status must be a boolean';
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId');
    
    if (!nodeId) {
      return NextResponse.json({ error: 'Node ID is required' }, { status: 400 });
    }

    const todos = dbOperations.getTodosByNodeId(nodeId);
    return NextResponse.json(todos);
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const todo = await request.json();
    const validationError = validateTodo(todo);
    
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const createdTodo = dbOperations.createTodo(todo as Todo);
    return NextResponse.json(createdTodo);
  } catch (error) {
    console.error('Failed to create todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const todo = await request.json();
    const validationError = validateTodo(todo);
    
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const updatedTodo = dbOperations.updateTodo(todo as Todo);
    return NextResponse.json(updatedTodo);
  } catch (error) {
    console.error('Failed to update todo:', error);
    return NextResponse.json(
      { error: 'Failed to update todo', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Todo ID is required' }, { status: 400 });
    }

    dbOperations.deleteTodo(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete todo:', error);
    return NextResponse.json(
      { error: 'Failed to delete todo', details: (error as Error).message },
      { status: 500 }
    );
  }
} 