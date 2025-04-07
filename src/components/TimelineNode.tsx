'use client';

import { useState, useRef, useEffect } from 'react';
import { ProjectNode } from '@/types/timeline';
import { motion } from 'framer-motion';
import { TodoList } from '@/components/TodoList';
import { NodeEditDialog } from '@/components/NodeEditDialog';
import { useTimelineStore } from '@/store/timelineStore';

interface TimelineNodeProps {
  node: ProjectNode;
  position: number;
}

export function TimelineNode({ node, position }: TimelineNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDraggingTitle, setIsDraggingTitle] = useState(false);
  // 记录原始位置，用于判断是否有变化
  const initialOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const [titleOffset, setTitleOffset] = useState(() => {
    // 优先使用localStorage中的位置信息
    let initialOffset = { x: 0, y: 0 };
    if (node.id) {
      const savedPosition = localStorage.getItem(`node-position-${node.id}`);
      if (savedPosition) {
        try {
          initialOffset = JSON.parse(savedPosition);
        } catch (e) {
          console.error('Failed to parse saved position:', e);
        }
      } else if (node.titleOffset) {
        initialOffset = node.titleOffset;
      }
    }
    // 保存初始位置用于比较
    initialOffsetRef.current = initialOffset;
    return initialOffset;
  });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [positionChanged, setPositionChanged] = useState(false); // 标记位置是否已改变但未保存到服务器
  const nodeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  // 添加SVG折线的引用
  const lineSvgRef = useRef<SVGSVGElement>(null);
  const { updateNode, deleteNode } = useTimelineStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // 如果点击的是 TodoList 内部，不关闭
      const todoList = document.querySelector('.todo-list-container');
      if (todoList?.contains(target)) {
        return;
      }
      
      // 如果点击的是节点内部，不关闭
      if (nodeRef.current?.contains(target)) {
        return;
      }
      
      // 如果点击的是编辑对话框内部，不关闭
      const editDialog = document.querySelector('.node-edit-dialog');
      if (editDialog?.contains(target)) {
        return;
      }
      
      // 如果点击的是 TodoList 的按钮或输入框，不关闭
      const isTodoListButton = (target as HTMLElement).closest('button');
      const isTodoListInput = (target as HTMLElement).closest('input');
      if (isTodoListButton || isTodoListInput) {
        return;
      }
      
      setIsExpanded(false);
      setIsEditing(false);
    };

    // 只在节点展开时添加事件监听器
    if (isExpanded || isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, isEditing]);

  // 更新连接线路径
  useEffect(() => {
    // 计算连接线的路径
    const updateConnectionLine = () => {
      if (!nodeRef.current || !titleRef.current || !lineSvgRef.current) return;

      // 获取节点和标题卡片的位置和尺寸
      // 同时支持普通节点和里程碑节点
      const nodeElement = nodeRef.current.querySelector('.node-circle') || 
                          nodeRef.current.querySelector('div[role="node"]');
      const nodeRect = nodeElement?.getBoundingClientRect();
      const titleRect = titleRef.current.getBoundingClientRect();
      const svgRect = lineSvgRef.current.getBoundingClientRect();

      if (!nodeRect) return;

      // 计算相对于SVG的坐标
      const nodeX = nodeRect.left + nodeRect.width / 2 - svgRect.left;
      const nodeY = nodeRect.top + nodeRect.height / 2 - svgRect.top;
      
      // 根据标题卡片的位置计算连接线的终点
      let titleX, titleY, bendX, bendY;
      
      // 计算标题卡片中心点
      const titleCenterX = titleRect.left + titleRect.width / 2 - svgRect.left;
      const titleCenterY = titleRect.top + titleRect.height / 2 - svgRect.top;
      
      // 标题卡片在节点上方
      if (titleRect.bottom < nodeRect.top) {
        // 计算标题底部中心点
        titleX = titleCenterX;
        titleY = titleRect.bottom - svgRect.top;
        // 第一段保持垂直，但不直接连到标题底部
        bendX = nodeX;
        // 将折弯点设置在节点和标题卡片之间的位置，确保第二段为斜线
        bendY = nodeY - (nodeY - titleY) * 0.7; // 在距离节点70%处折弯，延长第一段
      } 
      // 标题卡片在节点下方
      else if (titleRect.top > nodeRect.bottom) {
        // 计算标题顶部中心点
        titleX = titleCenterX;
        titleY = titleRect.top - svgRect.top;
        // 第一段保持垂直，但不直接连到标题顶部
        bendX = nodeX;
        // 将折弯点设置在节点和标题卡片之间的位置，确保第二段为斜线
        bendY = nodeY + (titleY - nodeY) * 0.7; // 在距离节点70%处折弯，延长第一段
      }
      // 标题卡片在节点左侧
      else if (titleRect.right < nodeRect.left) {
        // 计算标题右侧中心点
        titleX = titleRect.right - svgRect.left;
        titleY = titleCenterY;
        // 第一段保持水平，但不直接连到标题右侧
        bendY = nodeY;
        // 将折弯点设置在节点和标题卡片之间的位置，确保第二段为斜线
        bendX = nodeX - (nodeX - titleX) * 0.7; // 在距离节点70%处折弯，延长第一段
      }
      // 标题卡片在节点右侧
      else {
        // 计算标题左侧中心点
        titleX = titleRect.left - svgRect.left;
        titleY = titleCenterY;
        // 第一段保持水平，但不直接连到标题左侧
        bendY = nodeY;
        // 将折弯点设置在节点和标题卡片之间的位置，确保第二段为斜线
        bendX = nodeX + (titleX - nodeX) * 0.7; // 在距离节点70%处折弯，延长第一段
      }

      // 构建两段折线路径 (只有一次折弯)
      const path = `M ${nodeX} ${nodeY} L ${bendX} ${bendY} L ${titleX} ${titleY}`;
      
      // 更新SVG路径
      const pathElement = lineSvgRef.current.querySelector('path');
      if (pathElement) {
        pathElement.setAttribute('d', path);
      }
    };

    // 初始更新和窗口大小变化时更新
    updateConnectionLine();
    window.addEventListener('resize', updateConnectionLine);

    // 当拖动标题时也要更新连接线
    if (isDraggingTitle) {
      const handleDragMove = () => {
        requestAnimationFrame(updateConnectionLine);
      };
      document.addEventListener('mousemove', handleDragMove);
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('resize', updateConnectionLine);
      };
    }

    return () => {
      window.removeEventListener('resize', updateConnectionLine);
    };
  }, [isDraggingTitle, titleOffset]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingTitle) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // 更新位置时不要立即标记为已更改，等待鼠标释放时再判断
      setTitleOffset((prev: { x: number; y: number }) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDraggingTitle(false);
      
      // 检查位置是否有实际变化（与初始位置对比）
      if (node.id && initialOffsetRef.current) {
        // 检查当前位置与初始位置是否有明显差别（超过5像素视为有效拖动）
        const dx = Math.abs(titleOffset.x - initialOffsetRef.current.x);
        const dy = Math.abs(titleOffset.y - initialOffsetRef.current.y);
        const hasSignificantChange = dx > 5 || dy > 5;
          
        if (hasSignificantChange) {
          console.log('卡片位置发生明显变化，保存到localStorage');
          // 只有当位置发生明显变化时，才保存到localStorage并标记变化
          localStorage.setItem(`node-position-${node.id}`, JSON.stringify(titleOffset));
          setPositionChanged(true);
        } else {
          // 如果移动很小，恢复到原始位置
          setTitleOffset(initialOffsetRef.current);
        }
      }
    };

    if (isDraggingTitle) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    // 使用原始值而不是复杂对象
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraggingTitle, dragStart.x, dragStart.y, titleOffset.x, titleOffset.y, node.id]);

  // 当位置改变时延迟保存到服务器，避免频繁请求
  useEffect(() => {
    // 我们不再使用自动延迟保存到服务器，仅在本地保存位置
    // 这样避免频繁的API调用和页面刷新
    
    // 如果没有位置变化，则不执行任何操作
    if (!positionChanged) return;
    
    // 仅在localStorage中保存位置信息，不向服务器发送请求
    if (node.id) {
      localStorage.setItem(`node-position-${node.id}`, JSON.stringify(titleOffset));
    }
    
    // 不再需要返回清理函数
  }, [positionChanged, node.id, titleOffset.x, titleOffset.y]);

  // 当用户离开页面或组件将要卸载时，如果位置已更改，则保存到服务器
  useEffect(() => {
    const savePositionToServer = () => {
      // 仅在实际需要离开页面时才保存到服务器
      if (positionChanged && node.id) {
        try {
          // 使用同步localStorage保存，确保在离开前能保存
          localStorage.setItem(`node-position-${node.id}`, JSON.stringify(titleOffset));
          
          // 在此处不使用异步API调用，避免导致刷新或阻塞离开
          // 不再调用updateNode API
        } catch (error) {
          console.error('保存位置失败:', error);
        }
      }
    };

    // 只在组件卸载时保存
    return () => {
      savePositionToServer();
    };
    // 不要在依赖数组中使用完整对象或函数引用，只使用必要的原始值
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionChanged, node.id, titleOffset.x, titleOffset.y]);

  const progress = node.todos.length
    ? (node.todos.filter((todo) => todo.completed).length / node.todos.length) * 100
    : 0;

  const getProgressColor = () => {
    // 如果没有待办事项，返回绿色（已完成）
    if (node.todos.length === 0) return 'bg-green-500';
    
    // 如果有任何未完成的待办事项，返回黄色（未完成）
    if (node.todos.some(todo => !todo.completed)) return 'bg-yellow-500';
    
    // 如果所有待办事项都完成，返回绿色（已完成）
    return 'bg-green-500';
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleUpdateNode = async (nodeData: Omit<ProjectNode, 'id' | 'todos'>) => {
    try {
      const currentOffset = titleOffset; // 捕获当前的偏移值
      
      // 只有当节点内容发生变化时，才发送请求到服务器
      const hasContentChanges = 
        nodeData.title !== node.title ||
        nodeData.date !== node.date ||
        nodeData.type !== node.type ||
        nodeData.description !== node.description;
        
      if (hasContentChanges) {
        // 保存内容变更
        await updateNode({
          ...node,
          ...nodeData,
          titleOffset: currentOffset  // 确保更新节点时包含当前的位置偏移
        });
      } else {
        // 没有内容变更，不调用API
        console.log('节点内容未变化，不更新服务器数据');
      }
      
      // 无论如何都更新 localStorage
      if (node.id) {
        localStorage.setItem(`node-position-${node.id}`, JSON.stringify(currentOffset));
      }
      
      // 重置位置变化标志
      setPositionChanged(false);
      setIsEditing(false);
    } catch (error) {
      console.error('更新节点失败:', error);
      // 出错时也关闭编辑对话框
      setIsEditing(false);
    }
  };

  const handleDeleteNode = async () => {
    try {
      if (!node.id) {
        console.error('Node ID is missing');
        return;
      }
      await deleteNode(node.id);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to delete node:', error);
      alert('删除节点失败，请稍后重试');
    }
  };

  const handleTitleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingTitle(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  return (
    <motion.div
      ref={nodeRef}
      className="absolute top-1/2 -translate-x-1/2"
      style={{ left: `${position}%` }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-nodeid={node.id}
    >
      {/* SVG连接线 */}
      <svg
        ref={lineSvgRef}
        className="absolute left-0 top-0 pointer-events-none"
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'absolute', 
          zIndex: -1,
          overflow: 'visible'
        }}
      >
        <path
          d=""
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
      </svg>

      {/* 节点 */}
      {node.type === 'milestone' ? (
        // 里程碑节点 - 星形图标
        <div
          role="node"
          className="relative h-8 w-8 cursor-pointer transition-transform duration-200 hover:scale-110 z-10 flex items-center justify-center"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            className={`h-8 w-8 filter drop-shadow-md ${progress === 100 ? 'text-green-500' : 'text-yellow-500'}`}
            fill="currentColor"
            style={{
              color: progress === 100 ? '#10b981' : undefined // 使用与bg-green-500相同的绿色
            }}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <div
            className={`absolute inset-0 flex items-center justify-center ${progress === 100 ? 'text-green-700' : 'text-yellow-800'}`}
            style={{ 
              opacity: progress / 100,
              color: progress === 100 ? '#047857' : undefined // 使用与bg-green-700相同的深绿色
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              className="h-8 w-8"
              fill="currentColor"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        </div>
      ) : (
        // 普通节点 - 圆形
        <div
          className="node-circle relative h-5 w-5 cursor-pointer rounded-full border-2 border-gray-300 transition-transform duration-200 hover:scale-110 z-10"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div
            className={`absolute inset-0 rounded-full ${getProgressColor()}`}
            style={{ opacity: node.todos.length === 0 ? 1 : 1 }}
          />
        </div>
      )}

      {/* 标题标签 */}
      <div
        ref={titleRef}
        onMouseDown={handleTitleMouseDown}
        className={`absolute left-1/2 -translate-x-1/2 cursor-move select-none z-10 ${node.type === 'milestone' ? 'font-bold' : ''}`}
        style={{
          transform: `translate(${titleOffset.x}px, ${titleOffset.y}px)`,
          transition: isDraggingTitle ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <div 
          className={`group relative rounded px-2 py-1 text-sm font-medium text-gray-900 shadow-sm whitespace-nowrap ${
            node.type === 'milestone' 
              ? progress === 100
                ? 'bg-green-50 ring-2 ring-green-300'
                : 'bg-yellow-50 ring-2 ring-yellow-300' 
              : 'bg-white ring-1 ring-gray-200'
          }`}
        >
          <div className="flex flex-col items-center">
            <span>{node.title}</span>
            <span className="text-xs text-gray-900">{node.date.split('T')[0]}</span>
          </div>
          <button
            onClick={handleEdit}
            className="absolute -right-2 -top-2 hidden text-gray-400 hover:text-gray-600 group-hover:block"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 展开的待办事项列表 */}
      {isExpanded && (
        <TodoList
          nodeId={node.id}
          todos={node.todos}
          onClose={() => setIsExpanded(false)}
        />
      )}

      {/* 编辑对话框 */}
      <NodeEditDialog
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSubmit={handleUpdateNode}
        onDelete={handleDeleteNode}
        initialData={{
          id: node.id,
          title: node.title,
          date: node.date,
          type: node.type,
          description: node.description || '',
        }}
      />
    </motion.div>
  );
} 