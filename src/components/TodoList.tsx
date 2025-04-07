'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Todo } from '@/types/timeline';
import { useTimelineStore } from '@/store/timelineStore';

interface TodoListProps {
  nodeId: string;
  todos: Todo[];
  onClose: () => void;
}

export function TodoList({ nodeId, todos, onClose }: TodoListProps) {
  const [newTodoText, setNewTodoText] = useState('');
  const { addTodo, updateTodo, deleteTodo } = useTimelineStore();
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [error, setError] = useState<string | null>(null);
  const sourceNodeRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    const getSourcePosition = () => {
      try {
        const nodeElements = document.querySelectorAll('.node-circle, div[role="node"]');
        for (let i = 0; i < nodeElements.length; i++) {
          const node = nodeElements[i] as HTMLElement;
          
          const parentElement = node.closest(`div[data-nodeid="${nodeId}"]`);
          if (parentElement) {
            const rect = node.getBoundingClientRect();
            sourceNodeRef.current = node;
            
            // 计算位置，确保不会超出视口
            const top = Math.min(
              rect.bottom + window.scrollY + 16,
              window.innerHeight - 400 // 假设最大高度为400px
            );
            
            const left = Math.min(
              Math.max(rect.left + rect.width / 2 + window.scrollX, 200), // 最小左边距
              window.innerWidth - 200 // 最大右边距
            );
            
            setPosition({ top, left });
            break;
          }
        }
      } catch (error) {
        console.error('Failed to calculate position:', error);
        setError('无法计算待办事项列表位置');
      }
    };
    
    getSourcePosition();
    
    // 移除全局点击事件监听器，改为使用事件委托
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // 如果点击的是 TodoList 内部或源节点，不关闭
      if (containerRef.current?.contains(target) || sourceNodeRef.current?.contains(target)) {
        return;
      }
      
      // 如果点击的是关闭按钮，不关闭
      const closeButton = (event.target as HTMLElement).closest('button');
      if (closeButton?.textContent === '×') {
        return;
      }
      
      onClose();
    };
    
    // 使用事件委托，将事件监听器添加到 document.body
    document.body.addEventListener('mousedown', handleClick, true);
    
    return () => {
      document.body.removeEventListener('mousedown', handleClick, true);
      setMounted(false);
    };
  }, [nodeId, onClose]);

  const handleAddTodo = async () => {
    if (!newTodoText.trim()) return;

    try {
      setError(null);
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        nodeId,
        text: newTodoText.trim(),
        completed: false,
      };

      await addTodo(nodeId, newTodo);
      setNewTodoText('');
    } catch (error) {
      console.error('Failed to add todo:', error);
      setError('添加待办事项失败');
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    try {
      setError(null);
      await updateTodo({
        ...todo,
        completed: !todo.completed,
      });
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      setError('更新待办事项状态失败');
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      setError(null);
      await deleteTodo(todoId);
    } catch (error) {
      console.error('Failed to delete todo:', error);
      setError('删除待办事项失败');
    }
  };

  const todoListContent = (
    <div 
      ref={containerRef}
      className="absolute w-96 rounded-lg bg-white p-4 shadow-xl border border-gray-200 z-[999999] todo-list-container"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        maxHeight: '400px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">待办事项</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClose();
          }}
          className="text-gray-900 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
            placeholder="添加新的待办事项..."
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleAddTodo();
            }}
            className="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600"
          >
            添加
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`flex items-center justify-between rounded p-2 ${
              todo.completed ? 'bg-gray-50' : 'bg-yellow-50'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleToggleTodo(todo);
                }}
                className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span
                className={`text-sm ${
                  todo.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                }`}
              >
                {todo.text}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleDeleteTodo(todo.id);
              }}
              className="text-gray-900 hover:text-red-500"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return mounted ? createPortal(todoListContent, document.body) : null;
} 