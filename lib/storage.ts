import { type CardImage, type CachedData, STORAGE_KEY, CACHE_VERSION, CACHE_EXPIRY } from "./types"

// Base URL for the API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Compress image to reduce size before sending to server
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

// Local storage cache management
const saveToCache = <T>(key: string, data: T): void => {
  try {
    const cacheItem: CachedData<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION
    };
    localStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.warn("Failed to save to cache:", error);
  }
};

const getFromCache = <T>(key: string): T | null => {
  try {
    const cachedItem = localStorage.getItem(key);
    if (!cachedItem) return null;
    
    const parsed = JSON.parse(cachedItem) as CachedData<T>;
    
    // Check if cache is valid (not expired and matches current version)
    if (
      parsed.version === CACHE_VERSION && 
      Date.now() - parsed.timestamp < CACHE_EXPIRY
    ) {
      return parsed.data;
    }
    
    return null;
  } catch (error) {
    console.warn("Failed to retrieve from cache:", error);
    return null;
  }
};

// Get all cards - check cache first, then API
export const getCards = async (): Promise<CardImage[]> => {
  try {
    // First try to get data from cache
    const cachedCards = getFromCache<CardImage[]>(STORAGE_KEY);
    if (cachedCards && cachedCards.length > 0) {
      console.log("Using cached cards data");
      
      // Fetch from API in background to update cache for next time
      fetchAndUpdateCache().catch(err => 
        console.warn("Background cache refresh failed:", err)
      );
      
      return cachedCards;
    }
    
    // If no cache or expired, fetch from API
    return await fetchAndUpdateCache();
  } catch (error) {
    console.error("Error loading cards:", error);
    return [];
  }
};

// Helper function to fetch from API and update cache
const fetchAndUpdateCache = async (): Promise<CardImage[]> => {
  const response = await fetch(`${API_BASE_URL}/cards`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch cards: ${response.status}`);
  }
  
  const cards = await response.json();
  
  // Update cache with fresh data
  saveToCache(STORAGE_KEY, cards);
  
  // Prefetch and cache images in background
  setTimeout(() => {
    cards.forEach((card: CardImage) => {
      if (card.imageUrl && !card.imageUrl.startsWith('data:')) {
        prefetchImage(card.imageUrl);
      }
    });
  }, 0);
  
  return cards;
};

// Prefetch images to browser cache
const prefetchImage = (url: string): void => {
  const img = new Image();
  img.src = url;
};

// Add a new card with compression
export const addCard = async (card: Omit<CardImage, "id" | "createdAt">): Promise<CardImage[] | null> => {
  try {
    // Compress image if it's a data URL
    let imageUrl = card.imageUrl;
    if (imageUrl.startsWith("data:image")) {
      imageUrl = await compressImage(imageUrl);
    }

    const response = await fetch(`${API_BASE_URL}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...card,
        imageUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add card: ${response.status}`);
    }

    // Get updated cards and update cache
    const updatedCards = await fetchAndUpdateCache();
    return updatedCards;
  } catch (error) {
    console.error("Error adding card:", error);
    return null;
  }
}

// Update an existing card
export const updateCard = async (
  id: string,
  updatedData: Partial<Omit<CardImage, "_id" | "createdAt">>,
): Promise<CardImage[] | null> => {
  try {
    if (!id) {
      console.error("No ID provided for card update");
      return null;
    }
    
    // Compress image if it's a data URL
    let imageUrl = updatedData.imageUrl;
    if (imageUrl && imageUrl.startsWith("data:image")) {
      imageUrl = await compressImage(imageUrl);
      updatedData.imageUrl = imageUrl;
    }

    const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update card: ${response.status}`);
    }

    // Return updated list of cards and update cache
    const updatedCards = await fetchAndUpdateCache();
    return updatedCards;
  } catch (error) {
    console.error("Error updating card:", error);
    return null;
  }
}

// Delete a card by ID
export const deleteCard = async (id: string): Promise<CardImage[] | null> => {
  try {
    if (!id) {
      console.error("No ID provided for card deletion");
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete card: ${response.status}`);
    }

    // Return updated list of cards and update cache
    const updatedCards = await fetchAndUpdateCache();
    return updatedCards;
  } catch (error) {
    console.error("Error deleting card:", error);
    return null;
  }
}

// Clear all cards
export const clearAllCards = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cards`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to clear cards: ${response.status}`);
    }

    // Clear the cache
    localStorage.removeItem(STORAGE_KEY);
    
    return true;
  } catch (error) {
    console.error("Error clearing cards:", error);
    return false;
  }
}

// Clear the cache manually if needed
export const clearCache = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
