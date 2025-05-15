export interface CardImage {
  id: string
  name: string
  imageUrl: string
  link: string
  createdAt: number // Timestamp for sorting
}

export const STORAGE_KEY = "cardShufflerData"
