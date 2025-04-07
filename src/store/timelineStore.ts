import { create } from 'zustand';
import { TimelineState, ProjectNode, TimelineView, Todo } from '@/types/timeline';
import dayjs from 'dayjs';

interface TimelineStore extends TimelineState {
  addNode: (node: ProjectNode) => Promise<void>;
  updateNode: (node: ProjectNode) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  addTodo: (nodeId: string, todo: Todo) => Promise<void>;
  updateTodo: (todo: Todo) => Promise<void>;
  deleteTodo: (todoId: string) => Promise<void>;
  setView: (view: TimelineView) => void;
  setScale: (scale: number) => void;
  setDateRange: (startDate: Date, endDate: Date) => Promise<void>;
  fetchNodes: () => Promise<void>;
  loadSettings: () => Promise<void>;
  setSelectedNode: (node: ProjectNode | null) => void;
}

const initialState: TimelineState = {
  nodes: [],
  view: 'week',
  selectedNode: null,
  scale: 1,
  startDate: dayjs().subtract(3, 'month').toDate(),
  endDate: dayjs().add(3, 'month').toDate(),
  loading: false,
  error: null,
};

export const useTimelineStore = create<TimelineStore>((set) => {
  // 添加节点数据缓存
  let nodesCache: ProjectNode[] | null = null;
  let lastFetchTime = 0;
  const FETCH_COOLDOWN = 30000; // 30秒冷却时间
  
  return {
    ...initialState,

    fetchNodes: async () => {
      // 检查是否需要重新获取数据（使用缓存和冷却时间）
      const now = Date.now();
      if (nodesCache && now - lastFetchTime < FETCH_COOLDOWN) {
        // 使用缓存数据，避免频繁刷新
        console.log('使用缓存的节点数据，避免频繁刷新');
        
        // 从localStorage加载位置信息更新到缓存数据
        const updatedNodes = nodesCache.map(node => {
          if (node.id) {
            const savedPosition = localStorage.getItem(`node-position-${node.id}`);
            if (savedPosition) {
              try {
                node = {
                  ...node,
                  titleOffset: JSON.parse(savedPosition)
                };
              } catch (e) {
                console.error('解析本地存储位置信息失败:', e);
              }
            }
          }
          return node;
        });
        
        set({ nodes: updatedNodes, loading: false });
        return;
      }
      
      // 需要从服务器获取数据
      set({ loading: true, error: null });
      try {
        const response = await fetch('/api/nodes');
        if (!response.ok) throw new Error('Failed to fetch nodes');
        const nodes = await response.json();
        
        // 处理节点数据，确保有效性并从localStorage加载位置信息
        const validNodes = nodes.map((node: ProjectNode) => {
          const nodeWithId = {
            ...node,
            id: node.id || crypto.randomUUID(),
          };
          
          // 获取localStorage中存储的位置信息
          if (nodeWithId.id) {
            const savedPosition = localStorage.getItem(`node-position-${nodeWithId.id}`);
            if (savedPosition) {
              try {
                // 优先使用localStorage中的位置，覆盖服务器返回的位置
                nodeWithId.titleOffset = JSON.parse(savedPosition);
              } catch (e) {
                console.error('解析本地存储位置信息失败:', e);
              }
            }
          }
          
          // 确保titleOffset始终存在
          if (!nodeWithId.titleOffset) {
            nodeWithId.titleOffset = { x: 0, y: 0 };
          }
          
          return nodeWithId;
        });
        
        // 更新缓存和获取时间
        nodesCache = validNodes;
        lastFetchTime = now;
        
        set({ nodes: validNodes, loading: false });
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
      }
    },

    loadSettings: async () => {
      try {
        const response = await fetch('/api/timeline-settings');
        if (!response.ok) throw new Error('Failed to load timeline settings');
        const settings = await response.json();
        
        // 如果有设置，更新状态
        if (settings) {
          set({ 
            startDate: new Date(settings.startDate), 
            endDate: new Date(settings.endDate) 
          });
        }
      } catch (error) {
        console.error('加载时间轴设置失败:', error);
        // 如果加载失败，使用默认设置，但不报错给用户
      }
    },

    addNode: async (node: ProjectNode) => {
      set({ loading: true, error: null });
      try {
        const newNode = {
          ...node,
          id: node.id || crypto.randomUUID(),
        };
        
        const response = await fetch('/api/nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newNode),
        });
        
        if (!response.ok) throw new Error('Failed to add node');
        const savedNode = await response.json();
        set(state => ({ nodes: [...state.nodes, savedNode], loading: false }));
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
        throw error;
      }
    },

    updateNode: async (node: ProjectNode) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch('/api/nodes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(node),
        });
        if (!response.ok) throw new Error('Failed to update node');
        const updatedNode = await response.json();
        set(state => ({
          nodes: state.nodes.map(n => (n.id === node.id ? updatedNode : n)),
          loading: false,
        }));
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
      }
    },

    deleteNode: async (id: string) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(`/api/nodes/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete node');
        set(state => ({
          nodes: state.nodes.filter(n => n.id !== id),
          loading: false,
        }));
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
      }
    },

    addTodo: async (nodeId: string, todo: Todo) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todo),
        });
        if (!response.ok) throw new Error('Failed to add todo');
        const newTodo = await response.json();
        set(state => ({
          nodes: state.nodes.map(node =>
            node.id === nodeId
              ? { ...node, todos: [...node.todos, newTodo] }
              : node
          ),
          loading: false,
        }));
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
      }
    },

    updateTodo: async (todo: Todo) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch('/api/todos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todo),
        });
        if (!response.ok) throw new Error('Failed to update todo');
        const updatedTodo = await response.json();
        set(state => ({
          nodes: state.nodes.map(node =>
            node.id === todo.nodeId
              ? {
                  ...node,
                  todos: node.todos.map(t => (t.id === todo.id ? updatedTodo : t)),
                }
              : node
          ),
          loading: false,
        }));
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
      }
    },

    deleteTodo: async (todoId: string) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(`/api/todos?id=${todoId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete todo');
        set(state => ({
          nodes: state.nodes.map(node => ({
            ...node,
            todos: node.todos.filter(t => t.id !== todoId),
          })),
          loading: false,
        }));
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
      }
    },

    setView: (view) => set({ view }),
    setScale: (scale) => set({ scale }),
    setDateRange: async (startDate, endDate) => {
      set({ startDate, endDate });
      
      try {
        // 发送请求保存日期范围
        const response = await fetch('/api/timeline-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate, endDate }),
        });
        
        if (!response.ok) {
          console.error('保存时间轴设置失败');
        }
      } catch (error) {
        console.error('保存时间轴设置出错:', error);
      }
    },
    setSelectedNode: (node) => set({ selectedNode: node }),
  };
}); 