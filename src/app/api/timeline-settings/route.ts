import { NextResponse } from 'next/server';
import { dbOperations } from '@/lib/dbOperations';

export async function GET() {
  try {
    const settings = dbOperations.getTimelineSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch timeline settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { startDate, endDate } = await request.json();
    
    // 验证日期数据
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' }, 
        { status: 400 }
      );
    }
    
    // 保存设置
    const savedSettings = dbOperations.saveTimelineSettings(
      new Date(startDate),
      new Date(endDate)
    );
    
    return NextResponse.json(savedSettings);
  } catch {
    return NextResponse.json(
      { error: 'Failed to save timeline settings' }, 
      { status: 500 }
    );
  }
} 