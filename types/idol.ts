export interface Idol {
  id: string;
  name: string;
  groupName: string;
  birthMonth: number;
  birthDay: number;
  photoId: string | null;
  notificationEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  notificationLeadMinutes: number;
  notificationsEnabled: boolean;
  timezone: 'local';
}

export type AlarmType = 'pre' | 'exact';

export interface FavoriteEvent {
  at: Date;
  type: AlarmType;
  idols: Idol[];
}
