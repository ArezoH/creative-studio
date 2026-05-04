export interface Widget {
  id: string;
  type: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  data?: any;
  ownerId?: string;
  isShared?: boolean;
  sharedAt?: number;
  sharedWith: [];
}

export interface WidgetType {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultSize: { width: number; height: number };
}

export interface DragPreview {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isVisible: boolean;
}

export interface DashboardLayout {
  userId?: string;
  widgets: Widget[];
  timestamp: number;
  expiresAt?: number;
}
