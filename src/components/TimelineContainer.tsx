'use client';

import { useEffect } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { TimelineNode } from '@/components/TimelineNode';
import dayjs from 'dayjs';

export function TimelineContainer() {
  const { nodes, loading, error, fetchNodes, startDate, endDate } = useTimelineStore();

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  // 生成每天的时间标记
  const generateDailyTimeMarkers = () => {
    const markers = [];
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const totalDays = end.diff(start, 'day');
    
    // 根据总天数确定显示频率 (避免太多标记重叠)
    let frequency = 1; // 默认每天显示
    if (totalDays > 60) frequency = 7; // 超过60天，每周显示
    else if (totalDays > 30) frequency = 3; // 超过30天，每3天显示
    
    for (let i = 0; i <= totalDays; i += frequency) {
      const currentDate = start.add(i, 'day');
      const position = (i / totalDays) * 100;
      
      markers.push(
        <div 
          key={`marker-${i}`} 
          className="absolute" 
          style={{ left: `${position}%`, top: '50%' }}
        >
          {/* 向上的短线段 - 更短 */}
          <div className="h-1 w-0.5 bg-gray-400 mx-auto -mt-1"></div>
          
          {/* 日期标记，在时间线下方 */}
          <div className="text-xs text-gray-500 -translate-x-1/2 whitespace-nowrap mt-1">
            {currentDate.format('MM/DD')}
          </div>
        </div>
      );
    }
    
    return markers;
  };

  return (
    <div className="relative min-h-[400px] w-full rounded-lg bg-white shadow-sm">
      {/* 时间线 */}
      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-300" />
      
      {/* 时间标记 */}
      {generateDailyTimeMarkers()}
      
      {/* 节点 */}
      {nodes.map((node, index) => (
        <TimelineNode 
          key={node.id || `node-${index}-${node.date}-${node.title}`} 
          node={node} 
          position={getNodePosition(node.date, startDate, endDate)} 
        />
      ))}
    </div>
  );
}

function getNodePosition(dateStr: string, startDate: Date, endDate: Date): number {
  const date = dayjs(dateStr);
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  
  const totalDuration = end.diff(start);
  const nodePosition = date.diff(start);
  
  return (nodePosition / totalDuration) * 100;
} 