'use client';

import { useState } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { Todo } from '@/types/timeline';

export function GlobalProgress() {
  const { nodes, updateTodo } = useTimelineStore();
  const [detailType, setDetailType] = useState<string | null>(null);

  const allTodos = nodes.flatMap((node) => node.todos);
  const completedTodos = allTodos.filter((todo) => todo.completed);
  const uncompletedTodos = allTodos.filter((todo) => !todo.completed);
  const progress = allTodos.length
    ? (completedTodos.length / allTodos.length) * 100
    : 0;

  const getProgressColor = () => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 100) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleToggleTodo = async (todo: Todo) => {
    try {
      await updateTodo({
        ...todo,
        completed: !todo.completed,
      });
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const renderDetailList = () => {
    let todos: Todo[] = [];
    let title = '';
    
    switch (detailType) {
      case 'all':
        todos = allTodos;
        title = '全部任务';
        break;
      case 'completed':
        todos = completedTodos;
        title = '已完成任务';
        break;
      case 'uncompleted':
        todos = uncompletedTodos;
        title = '未完成任务';
        break;
      case 'nodes':
        return (
          <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">所有节点</h3>
              <button onClick={() => setDetailType(null)} className="text-gray-900 hover:text-gray-700">
                ×
              </button>
            </div>
            <ul className="divide-y divide-gray-200">
              {nodes.map((node) => (
                <li key={node.id} className="py-2">
                  <div className="flex justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{node.title}</span>
                      <span className="ml-2 text-sm text-gray-900">{node.date.split('T')[0]}</span>
                    </div>
                    <div className="text-sm text-gray-900">
                      {node.todos.filter(t => t.completed).length}/{node.todos.length} 已完成
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      default:
        return null;
    }

    return (
      <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button onClick={() => setDetailType(null)} className="text-gray-900 hover:text-gray-700">
            ×
          </button>
        </div>
        <ul className="divide-y divide-gray-200">
          {todos.length > 0 ? (
            todos.map((todo) => (
              <li key={todo.id} className="py-2">
                <div className="flex items-center">
                  {!todo.completed ? (
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => handleToggleTodo(todo)}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="mr-2 text-green-500">✓</span>
                  )}
                  <span className={todo.completed ? 'text-gray-400 line-through' : 'text-gray-900'}>
                    {todo.text}
                  </span>
                  <span className="ml-2 text-xs text-gray-900">
                    {nodes.find(n => n.id === todo.nodeId)?.title || '未知节点'}
                  </span>
                </div>
              </li>
            ))
          ) : (
            <li className="py-4 text-center text-gray-900">没有任务</li>
          )}
        </ul>
      </div>
    );
  };

  return (
    <div className="mt-6 rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">项目总进度</h2>
        <span className="text-sm font-medium text-gray-900">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full ${getProgressColor()} transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-4 grid grid-cols-4 gap-4">
        <div 
          className="rounded-lg bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setDetailType('all')}
        >
          <div className="text-sm font-medium text-gray-900">总任务数</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {allTodos.length}
          </div>
        </div>
        <div 
          className="rounded-lg bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setDetailType('completed')}
        >
          <div className="text-sm font-medium text-gray-900">已完成</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {completedTodos.length}
          </div>
        </div>
        <div 
          className="rounded-lg bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setDetailType('uncompleted')}
        >
          <div className="text-sm font-medium text-gray-900">未完成</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">
            {uncompletedTodos.length}
          </div>
        </div>
        <div 
          className="rounded-lg bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setDetailType('nodes')}
        >
          <div className="text-sm font-medium text-gray-900">节点数</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {nodes.length}
          </div>
        </div>
      </div>
      
      {detailType && renderDetailList()}
    </div>
  );
} 