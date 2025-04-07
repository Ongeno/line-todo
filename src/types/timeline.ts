export interface Todo {
  id: string;
  nodeId: string;
  text: string;
  completed: boolean;
}

export interface ProjectNode {
  id: string;
  title: string;
  date: string;
  type: 'normal' | 'milestone';
  description?: string;
  todos: Todo[];
  titleOffset?: {
    x: number;
    y: number;
  };
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  order: number;
}

export type TimelineView = 'day' | 'week' | 'month';

export interface TimelineState {
  nodes: ProjectNode[];
  view: TimelineView;
  scale: number;
  startDate: Date;
  endDate: Date;
  loading: boolean;
  error: string | null;
  selectedNode: ProjectNode | null;
} 