export interface CardImage {
  _id: string;      // MongoDB uses _id by default
  name: string;
  imageUrl: string;
  link: string;
  createdAt: number; // Timestamp for sorting
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  version: number;
}

export interface Setting {
  key: string;
  value: any;
  updatedAt?: number;
}

export interface ShuffleSpeedSetting {
  key: string;
  value: number; // 1-100 value representing shuffle speed
  updatedAt?: number;
}

export const STORAGE_KEY = "cardShufflerData";
export const SETTINGS_KEY = "cardShufflerSettings";
export const SHUFFLE_SPEED_KEY = "shuffleSpeed";
export const CACHE_VERSION = 1; // Increment when data structure changes
export const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
