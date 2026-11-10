export interface Idol {
  id: string;
  name: string;
  nickname: string;
  groupName: string;
  postUrl: string;
  birthMonth: number;
  birthDay: number;
  photoId: string | null;
  notificationEnabled: boolean;
  preNotificationEnabled: boolean;
  exactNotificationEnabled: boolean;
  notificationLeadMinutes: number;
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

export interface RegistrationDraft {
  name: string;
  nickname: string;
  groupName: string;
  postUrl: string;
  birthMonth: number;
  birthDay: number;
  notificationEnabled: boolean;
  notificationLeadMinutes: number;
  photoId: string | null;
  preNotificationEnabled: boolean;
  exactNotificationEnabled: boolean;
}
