"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { CardImage } from "@/lib/types"
import { getCards } from "@/lib/storage"
import NextImage from "next/image"

export default function CardShuffler() {
  const [cards, setCards] = useState<CardImage[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isShuffling, setIsShuffling] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const shuffleIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const shuffleHistoryRef = useRef<number[]>([])
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({})
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if we're on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    // Initial check
    checkMobile()
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // Load cards from cache/API
    loadCards()

    // Cleanup on unmount
    return () => {
      if (shuffleIntervalRef.current) {
        clearInterval(shuffleIntervalRef.current)
      }
    }
  }, [])

  // Preload images when cards change
  useEffect(() => {
    if (cards.length > 0) {
      const newImagesLoaded: Record<string, boolean> = {};

      // Track loading state for each image
      cards.forEach(card => {
        if (!card.imageUrl) return;

        const img = new globalThis.Image();
        img.onload = () => {
          setImagesLoaded(prev => ({
            ...prev,
            [card._id]: true
          }));
        };
        img.src = card.imageUrl;
        newImagesLoaded[card._id] = false;
      });

      setImagesLoaded(newImagesLoaded);
    }
  }, [cards]);

  const loadCards = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const loadedCards = await getCards()
      setCards(loadedCards)

      if (loadedCards.length > 0) {
        setCurrentCardIndex(0)
        setIsLoading(false) // Set loading to false after we have cards from cache
      }
    } catch (error) {
      console.error("Error loading cards:", error)
      setError("Failed to load cards. Please try again later.")
      setIsLoading(false)
    }
  }

  const startShuffling = () => {
    if (cards.length < 2) {
      return // Need at least 2 cards to shuffle
    }

    setIsShuffling(true)
    shuffleHistoryRef.current = [currentCardIndex]

    // Clear any existing interval
    if (shuffleIntervalRef.current) {
      clearInterval(shuffleIntervalRef.current)
    }

    // Start a new interval with rapid shuffling (30ms)
    shuffleIntervalRef.current = setInterval(() => {
      setCurrentCardIndex((prevIndex) => {
        // Get a random index that's different from the current one
        let newIndex
        do {
          newIndex = Math.floor(Math.random() * cards.length)
        } while (newIndex === prevIndex && cards.length > 1)

        // Keep track of the shuffle history
        shuffleHistoryRef.current.push(newIndex)

        return newIndex
      })
    }, 50) // Fast shuffling (30+ cards per second)
  }

  const stopShuffling = () => {
    if (shuffleIntervalRef.current) {
      clearInterval(shuffleIntervalRef.current)
      shuffleIntervalRef.current = null
    }
    setIsShuffling(false)
  }

  const currentCard = cards[currentCardIndex]

  return (
    <div className="flex flex-col items-center bg-transparent" style={{ backgroundColor: 'transparent' }}>


      {isLoading && cards.length === 0 ? (
        <div className="w-full max-w-md h-[400px] flex justify-center items-center border rounded-lg border-dashed bg-transparent">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center p-12 border rounded-lg border-dashed w-full max-w-md bg-transparent">
          <p className="text-red-500 mb-2">{error}</p>
          <Button onClick={loadCards} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center p-12 border rounded-lg border-dashed w-full max-w-md bg-transparent">
          <h2 className="text-xl font-semibold mb-2">No Cards Available</h2>
        </div>
      ) : (
        <div
  className="relative bg-transparent rounded-lg overflow-hidden border-0 shadow-0"
  style={{ 
    width: isMobile ? '280px' : '505px', 
    height: isMobile ? '393px' : '708px', 
    backgroundColor: 'transparent'
  }}
>
          {currentCard ? (
            <>
              <a href={currentCard.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative bg-transparent">
                {!imagesLoaded[currentCard._id] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-transparent">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                )}
                <NextImage
                  src={currentCard.imageUrl || "/placeholder.svg"}
                  alt={currentCard.name}
                  className={`w-full h-full object-cover transition-opacity bg-transparent duration-300 ${imagesLoaded[currentCard._id] ? 'opacity-100' : 'opacity-0'
                    }`}
                  width={isMobile ? 280 : 505}
                  height={isMobile ? 393 : 708}
                  priority={true}
                  loading="eager"
                  style={{ backgroundColor: 'transparent' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg?height=708&width=505"
                  }}
                />
              </a>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-transparent">
              <p>No image available</p>
            </div>
          )}
        </div>
      )}
      <div className="w-full max-w-md flex bg-transparent justify-between items-center mt-6" style={{ backgroundColor: 'transparent' }}>
        <div className="flex justify-center items-center w-full gap-4 bg-transparent" style={{ 
          backgroundColor: 'transparent',
          gap: isMobile ? '8px' : '16px' 
        }}>
          <Button
            onClick={startShuffling}
            disabled={isShuffling || cards.length < 2 || isLoading}
            variant="default"
            size={isMobile ? "sm" : "lg"}
            className={`rounded-[33px] bg-[#BF9792] text-black font-[Times_New_Roman] hover:bg-[#E9DED9] ${
              isMobile 
                ? "min-w-[125px] text-[12px] py-1 px-2" 
                : "min-w-[150px] text-[15px]"
            }`}
          >
            Start Shuffling
          </Button>

          <Button
            onClick={stopShuffling}
            disabled={!isShuffling}
            variant="secondary"
            size="lg"
            className="min-w-[150px] rounded-[33px] bg-[#E9DED9] text-black text-[15px] font-[Times_New_Roman] hover:bg-[#E9DED9]"
          >
            Stop Shuffling
          </Button>

        </div>
      </div>
    </div>
  )
}
