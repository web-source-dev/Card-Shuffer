export interface CardImage {
  _id: string;      // MongoDB uses _id by default
  name: string;
  imageUrl: string;
  link: string;
  createdAt: number; // Timestamp for sorting
}

export const STORAGE_KEY = "cardShufflerData"
