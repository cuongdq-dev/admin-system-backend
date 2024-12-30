export enum TypeEnum {
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM',
  COMMENT = 'COMMENT',
  ORDER = 'ORDER',
  DELIVERY = 'DELIVERY',
  PROMOTION = 'PROMOTION', // Sales or discount notifications
  PAYMENT = 'PAYMENT', // Payment-related updates
  REFUND = 'REFUND', // Refund processing notifications
  FEEDBACK = 'FEEDBACK', // Feedback requests or updates
  REMINDER = 'REMINDER', // Scheduled reminders
  ACCOUNT = 'ACCOUNT', // Account-related notifications
}

export enum StatusEnum {
  NEW = 'NEW', // Just created
  RECEIVED = 'RECEIVED', // Acknowledged by the system
  READED = 'READED', // Marked as read by the user
  PENDING = 'PENDING', // Queued but not yet delivered
  FAILED = 'FAILED', // Delivery failed
  ARCHIVED = 'ARCHIVED', // Archived for reference
}
export type TableMetaData = {
  filter?: Record<string, any>;
  sortBy?: [string, 'ASC' | 'DESC'][];
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
};

export type NotificationItem = {
  id?: string;
  created_at: Date;
  updated_at: Date;
  title?: string;
  message?: string;
  status: StatusEnum;
  type?: TypeEnum;
  meta_data: string;
  user_id: string;
  user?: Record<string, any>;
};

export type IStoreList = {
  fetchOn?: Date;
  isFetching?: boolean;
  refreshNumber?: number;
  isLoading?: boolean;
  data?: Record<string, any>;
  meta?: TableMetaData;
};
export type IStoreDetail = {
  refreshNumber?: number;
  isFetching?: boolean;
  isLoading?: boolean;
  data?: Record<string, any>;
  fetchOn?: Date;
};

export type ISocketMessage = {
  type: 'MESSAGE';
  notify: INotify;
  message: Record<string, any>;
};

export type ISocketNotify = {
  type: 'NOTIFY';
  notify: INotify;
  notification: NotificationItem;
};
export type ISocketStore = {
  type: 'STORE';
  notify: INotify;
  storeName: string;
  detail?: IStoreDetail;
  list?: IStoreList;
};

export type ISocket = ISocketNotify | ISocketMessage | ISocketStore;

// NOTIFY
declare type BaseVariant = 'default' | 'error' | 'success' | 'warning' | 'info';

export type INotify = {
  key?: string;
  title?: string;
  dismissAction?: boolean;
  options?: { variant: BaseVariant } | any;
};
