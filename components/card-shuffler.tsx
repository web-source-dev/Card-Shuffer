"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink, Loader2 } from "lucide-react"
import type { CardImage } from "@/lib/types"
import { getCards } from "@/lib/storage"
import Image from "next/image"

export default function CardShuffler() {
  const [cards, setCards] = useState<CardImage[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isShuffling, setIsShuffling] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const shuffleIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const shuffleHistoryRef = useRef<number[]>([])

  useEffect(() => {
    // Load cards from API
    loadCards()

    // Cleanup on unmount
    return () => {
      if (shuffleIntervalRef.current) {
        clearInterval(shuffleIntervalRef.current)
      }
    }
  }, [])

  const loadCards = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const loadedCards = await getCards()
      setCards(loadedCards)
      
      if (loadedCards.length > 0) {
        setCurrentCardIndex(0)
      }
    } catch (error) {
      console.error("Error loading cards:", error)
      setError("Failed to load cards. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const startShuffling = () => {
    if (cards.length < 2) {
      return // Need at least 2 cards to shuffle
    }

    setIsShuffling(true)
    setShowLink(false)
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
    }, 30) // Fast shuffling (30+ cards per second)
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
    <div className="flex flex-col items-center">
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <Button
            onClick={startShuffling}
            disabled={isShuffling || cards.length < 2 || isLoading}
            variant="default"
            size="lg"
            className="min-w-[150px] bg-[#e8e59b] text-black hover:bg-[#e8e59b]/90"
          >
            Start Shuffling
          </Button>
          <Button 
            onClick={stopShuffling} 
            disabled={!isShuffling} 
            variant="secondary" 
            size="lg" 
            className="bg-[#e8e59b] min-w-[150px] text-black hover:bg-[#e8e59b]/90"
          >
            Stop Shuffling
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="w-full max-w-md h-[400px] flex justify-center items-center border rounded-lg border-dashed">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center p-12 border rounded-lg border-dashed w-full max-w-md">
          <p className="text-red-500 mb-2">{error}</p>
          <Button onClick={loadCards} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center p-12 border rounded-lg border-dashed w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2">No Cards Available</h2>
        </div>
      ) : (
        <div
          className="relative w-full max-w-md h-full aspect-[3/4] rounded-lg overflow-hidden border-0 shadow-0"
          onMouseEnter={() => !isShuffling && setShowLink(true)}
          onMouseLeave={() => setShowLink(false)}
        >
          {currentCard ? (
            <>
              <a href={currentCard.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                <Image
                  src={currentCard.imageUrl || "/placeholder.svg"}
                  alt={currentCard.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=600&width=400"
                  }}
                  width={300}
                  height={500}
                />
              </a>

              {showLink && !isShuffling && (
                <div className="absolute bottom-0 left-0 p-2 bg-black/70 text-white rounded-tr-md flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <button onClick={() => window.open(currentCard.link, "_blank")}>Open</button>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <p>No image available</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
