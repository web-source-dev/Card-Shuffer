import { type CardImage, STORAGE_KEY } from "./types"

// Maximum size for localStorage (in bytes)
const MAX_STORAGE_SIZE = 4 * 1024 * 1024 // 4MB

// Compress image to reduce storage size
export const compressImage = async (dataUrl: string, quality = 0.7, maxWidth = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Scale down if larger than maxWidth
        if (width > maxWidth) {
          height = Math.floor(height * (maxWidth / width))
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert to WebP if supported for better compression
        const format = "image/jpeg"
        const compressedDataUrl = canvas.toDataURL(format, quality)
        resolve(compressedDataUrl)
      }

      img.onerror = () => {
        reject(new Error("Failed to load image"))
      }

      img.src = dataUrl
    } catch (error) {
      reject(error)
    }
  })
}

// Check if storage is available
export const isStorageAvailable = (): boolean => {
  try {
    const test = "__storage_test__"
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (e) {
    console.error("Error checking storage availability:", e)
    return false
  }
}

// Get all cards from localStorage
export const getCards = (): CardImage[] => {
  if (!isStorageAvailable()) {
    console.warn("localStorage is not available")
    return []
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error loading cards from localStorage:", error)
    return []
  }
}

// Save cards to localStorage with size check
export const saveCards = (cards: CardImage[]): boolean => {
  if (!isStorageAvailable()) {
    console.warn("localStorage is not available")
    return false
  }

  try {
    const dataString = JSON.stringify(cards)

    // Check if data exceeds storage limit
    if (dataString.length > MAX_STORAGE_SIZE) {
      console.error("Data exceeds storage limit")
      return false
    }

    localStorage.setItem(STORAGE_KEY, dataString)
    return true
  } catch (error) {
    console.error("Error saving cards to localStorage:", error)
    return false
  }
}

// Add a new card with compression
export const addCard = async (card: Omit<CardImage, "id" | "createdAt">): Promise<CardImage[] | null> => {
  try {
    const cards = getCards()

    // Compress image if it's a data URL
    let imageUrl = card.imageUrl
    if (imageUrl.startsWith("data:image")) {
      imageUrl = await compressImage(imageUrl)
    }

    const newCard: CardImage = {
      ...card,
      imageUrl,
      id: Date.now().toString(),
      createdAt: Date.now(),
    }

    const updatedCards = [...cards, newCard]
    const success = saveCards(updatedCards)

    return success ? updatedCards : null
  } catch (error) {
    console.error("Error adding card:", error)
    return null
  }
}

// Update an existing card
export const updateCard = async (
  id: string,
  updatedData: Partial<Omit<CardImage, "id" | "createdAt">>,
): Promise<CardImage[] | null> => {
  try {
    const cards = getCards()
    const cardIndex = cards.findIndex((card) => card.id === id)

    if (cardIndex === -1) {
      return null
    }

    // Compress image if it's a data URL and different from the existing one
    let imageUrl = updatedData.imageUrl
    if (imageUrl && imageUrl.startsWith("data:image") && imageUrl !== cards[cardIndex].imageUrl) {
      imageUrl = await compressImage(imageUrl)
      updatedData.imageUrl = imageUrl
    }

    const updatedCards = [...cards]
    updatedCards[cardIndex] = {
      ...updatedCards[cardIndex],
      ...updatedData,
    }

    const success = saveCards(updatedCards)
    return success ? updatedCards : null
  } catch (error) {
    console.error("Error updating card:", error)
    return null
  }
}

// Delete a card by ID
export const deleteCard = (id: string): CardImage[] | null => {
  try {
    const cards = getCards()
    const updatedCards = cards.filter((card) => card.id !== id)
    const success = saveCards(updatedCards)
    return success ? updatedCards : null
  } catch (error) {
    console.error("Error deleting card:", error)
    return null
  }
}

// Clear all cards
export const clearAllCards = (): boolean => {
  try {
    return saveCards([])
  } catch (error) {
    console.error("Error clearing cards:", error)
    return false
  }
}
