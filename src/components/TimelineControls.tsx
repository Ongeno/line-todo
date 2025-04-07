'use client';

import { useState, useEffect } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { NodeEditDialog } from '@/components/NodeEditDialog';
import { ProjectNode } from '@/types/timeline';
import dayjs from 'dayjs';

export function TimelineControls() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { addNode, setDateRange, startDate, endDate, loadSettings } = useTimelineStore();

  // 组件加载时加载时间轴设置
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleAddNode = async (nodeData: Omit<ProjectNode, 'id' | 'todos'>) => {
    try {
      const newNode: ProjectNode = {
        id: Date.now().toString(),
        ...nodeData,
        todos: [],
        titleOffset: { x: 0, y: 0 }
      };
      await addNode(newNode);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to add node:', error);
    }
  };

  const handleStartDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = new Date(e.target.value);
    await setDateRange(newStartDate, endDate);
  };

  const handleEndDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = new Date(e.target.value);
    await setDateRange(startDate, newEndDate);
  };

  // 格式化日期为YYYY-MM-DD格式，用于日期选择器
  const formatDateForInput = (date: Date) => {
    return dayjs(date).format('YYYY-MM-DD');
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsDialogOpen(true)}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          添加节点
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-900">开始日期:</span>
          <input
            type="date"
            value={formatDateForInput(startDate)}
            onChange={handleStartDateChange}
            className="rounded border border-gray-300 p-1 text-sm text-gray-900"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-900">结束日期:</span>
          <input
            type="date"
            value={formatDateForInput(endDate)}
            onChange={handleEndDateChange}
            className="rounded border border-gray-300 p-1 text-sm text-gray-900"
          />
        </div>
      </div>

      <NodeEditDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleAddNode}
        onDelete={() => {}}
        initialData={{
          title: '新节点',
          date: new Date().toISOString(),
          type: 'normal',
          description: '',
        }}
      />
    </div>
  );
} 