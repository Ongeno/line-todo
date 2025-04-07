import { ProjectNode, Todo } from '@/types/timeline';
import db from './db';

// 时间轴设置接口
interface TimelineSettings {
  startDate: string;
  endDate: string;
  id?: string;
}

export const dbOperations = {
  // 节点操作
  getAllNodes: () => {
    const nodes = db.prepare('SELECT * FROM nodes').all() as ProjectNode[];
    const nodesWithTodos = nodes.map(node => {
      // 如果数据库中有titleOffset字段，解析JSON字符串
      if (node.titleOffset && typeof node.titleOffset === 'string') {
        try {
          node.titleOffset = JSON.parse(node.titleOffset);
        } catch (e) {
          console.error('Failed to parse titleOffset:', e);
          node.titleOffset = { x: 0, y: 0 };
        }
      } else {
        node.titleOffset = { x: 0, y: 0 };
      }
      return {
        ...node,
        todos: dbOperations.getTodosByNodeId(node.id)
      };
    });
    return nodesWithTodos;
  },

  getNodeById: (id: string) => {
    const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id) as ProjectNode;
    if (node) {
      // 如果数据库中有titleOffset字段，解析JSON字符串
      if (node.titleOffset && typeof node.titleOffset === 'string') {
        try {
          node.titleOffset = JSON.parse(node.titleOffset);
        } catch (e) {
          console.error('Failed to parse titleOffset:', e);
          node.titleOffset = { x: 0, y: 0 };
        }
      } else {
        node.titleOffset = { x: 0, y: 0 };
      }
      node.todos = dbOperations.getTodosByNodeId(id);
    }
    return node;
  },

  createNode: (node: ProjectNode) => {
    const { id, title, date, type, description, titleOffset } = node;
    // 将titleOffset转换为JSON字符串
    const titleOffsetStr = titleOffset ? JSON.stringify(titleOffset) : JSON.stringify({ x: 0, y: 0 });
    
    db.prepare(
      'INSERT INTO nodes (id, title, date, type, description, titleOffset) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, title, date, type, description, titleOffsetStr);

    // 创建关联的待办事项
    node.todos.forEach(todo => {
      dbOperations.createTodo(todo);
    });

    return node;
  },

  updateNode: (node: ProjectNode) => {
    const { id, title, date, type, description, titleOffset } = node;
    // 将titleOffset转换为JSON字符串
    const titleOffsetStr = titleOffset ? JSON.stringify(titleOffset) : JSON.stringify({ x: 0, y: 0 });
    
    db.prepare(
      'UPDATE nodes SET title = ?, date = ?, type = ?, description = ?, titleOffset = ? WHERE id = ?'
    ).run(title, date, type, description, titleOffsetStr, id);

    // 更新待办事项
    const existingTodos = dbOperations.getTodosByNodeId(id);
    const todosToDelete = existingTodos.filter(
      existingTodo => !node.todos.find(todo => todo.id === existingTodo.id)
    );
    const todosToCreateOrUpdate = node.todos;

    // 删除不再存在的待办事项
    todosToDelete.forEach(todo => {
      dbOperations.deleteTodo(todo.id);
    });

    // 创建或更新待办事项
    todosToCreateOrUpdate.forEach(todo => {
      const exists = existingTodos.find(t => t.id === todo.id);
      if (exists) {
        dbOperations.updateTodo(todo);
      } else {
        dbOperations.createTodo(todo);
      }
    });

    return node;
  },

  deleteNode: (id: string) => {
    // 首先删除关联的待办事项
    db.prepare('DELETE FROM todos WHERE nodeId = ?').run(id);
    // 然后删除节点
    db.prepare('DELETE FROM nodes WHERE id = ?').run(id);
  },

  // 待办事项操作
  getTodosByNodeId: (nodeId: string) => {
    try {
      const todos = db.prepare('SELECT * FROM todos WHERE nodeId = ?').all(nodeId) as Todo[];
      return todos.map(todo => ({
        ...todo,
        completed: Boolean(todo.completed)
      }));
    } catch (error) {
      console.error('Failed to get todos:', error);
      return [];
    }
  },

  createTodo: (todo: Todo) => {
    try {
      const { id, nodeId, text, completed } = todo;
      db.prepare(
        'INSERT INTO todos (id, nodeId, text, completed) VALUES (?, ?, ?, ?)'
      ).run(id, nodeId, text, completed ? 1 : 0);
      return {
        ...todo,
        completed: Boolean(completed)
      };
    } catch (error) {
      console.error('Failed to create todo:', error);
      throw error;
    }
  },

  updateTodo: (todo: Todo) => {
    try {
      const { id, text, completed } = todo;
      db.prepare(
        'UPDATE todos SET text = ?, completed = ? WHERE id = ?'
      ).run(text, completed ? 1 : 0, id);
      return {
        ...todo,
        completed: Boolean(completed)
      };
    } catch (error) {
      console.error('Failed to update todo:', error);
      throw error;
    }
  },

  deleteTodo: (id: string) => {
    db.prepare('DELETE FROM todos WHERE id = ?').run(id);
  },
  
  // 时间轴设置操作
  getTimelineSettings: () => {
    const settings = db.prepare('SELECT * FROM timeline_settings WHERE id = ?').get('default') as TimelineSettings | undefined;
    if (settings) {
      return {
        startDate: new Date(settings.startDate),
        endDate: new Date(settings.endDate)
      };
    }
    return null;
  },
  
  saveTimelineSettings: (startDate: Date, endDate: Date) => {
    // 检查是否已有设置
    const exists = db.prepare('SELECT * FROM timeline_settings WHERE id = ?').get('default');
    
    if (exists) {
      // 更新设置
      db.prepare(
        'UPDATE timeline_settings SET startDate = ?, endDate = ? WHERE id = ?'
      ).run(startDate.toISOString(), endDate.toISOString(), 'default');
    } else {
      // 插入新设置
      db.prepare(
        'INSERT INTO timeline_settings (id, startDate, endDate) VALUES (?, ?, ?)'
      ).run('default', startDate.toISOString(), endDate.toISOString());
    }
    
    return { startDate, endDate };
  }
}; 