'use client';

import { useState } from 'react';
import { ProjectNode } from '@/types/timeline';
import dayjs from 'dayjs';

interface NodeEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ProjectNode, 'id' | 'todos'>) => void;
  onDelete: () => void;
  initialData: {
    id?: string;
    title: string;
    date: string;
    type: 'normal' | 'milestone';
    description: string;
  };
}

export function NodeEditDialog({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
}: NodeEditDialogProps) {
  const [formData, setFormData] = useState(initialData);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleDelete = () => {
    if (!initialData.id) return;
    if (confirm('确定要删除这个节点吗？')) {
      onDelete();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className={`${initialData.id ? 'w-[1600px]' : 'w-[800px]'} rounded-lg bg-white shadow-xl relative z-[10000]`}>
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {initialData.id ? '编辑节点' : '新建节点'}
              </h2>
              <p className="mt-1 text-sm text-gray-900">
                {dayjs(formData.date).format('YYYY年MM月DD日')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-900"
              >
                标题
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-900"
                >
                  日期
                </label>
                <input
                  type="date"
                  id="date"
                  value={formData.date.split('T')[0]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-900"
                >
                  类型
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as 'normal' | 'milestone' })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="normal">普通节点</option>
                  <option value="milestone">里程碑</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-900"
              >
                描述
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              {initialData.id ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  删除
                </button>
              ) : (
                <div />
              )}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 