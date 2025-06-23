"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, ImagePlus, LinkIcon, Type, Edit, X, Check, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import type { CardImage } from "@/lib/types"
import { getCards, addCard, deleteCard, updateCard, clearAllCards, compressImage, getShuffleSpeed, saveShuffleSpeed } from "@/lib/storage"
import Image from "next/image"

// Convert speed value (1-100) to milliseconds for display
const formatSpeedDisplay = (speed: number): string => {
  // Same function as in card-shuffler.tsx to ensure consistency
  const minInterval = 10;   // Fastest (10ms)
  const maxInterval = 300;  // Slowest (300ms)
  const interval = Math.round(maxInterval - ((speed - 1) * (maxInterval - minInterval) / 99));
  
  return `${interval}ms`;
}

export default function ManagePage() {
  const [cards, setCards] = useState<CardImage[]>([])
  const [imageUrl, setImageUrl] = useState("")
  const [imageLink, setImageLink] = useState("")
  const [imageName, setImageName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [editingCard, setEditingCard] = useState<CardImage | null>(null)
  const [editImageUrl, setEditImageUrl] = useState("")
  const [editImageLink, setEditImageLink] = useState("")
  const [editImageName, setEditImageName] = useState("")
  const [editFile, setEditFile] = useState<File | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<{
    name?: boolean;
    image?: boolean;
    link?: boolean;
  }>({})
  const [editFormErrors, setEditFormErrors] = useState<{
    name?: boolean;
    image?: boolean;
    link?: boolean;
  }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Shuffle speed state
  const [shuffleSpeed, setShuffleSpeed] = useState(50)
  const [isLoadingSpeed, setIsLoadingSpeed] = useState(false)
  const [isSavingSpeed, setIsSavingSpeed] = useState(false)
  const [speedPreviewActive, setSpeedPreviewActive] = useState(false)
  const speedPreviewIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [previewCardIndex, setPreviewCardIndex] = useState(0)

  useEffect(() => {
    // Load cards from API and shuffle speed setting
    loadCards()
    loadShuffleSpeed()

    // Cleanup preview on unmount
    return () => {
      if (speedPreviewIntervalRef.current) {
        clearInterval(speedPreviewIntervalRef.current)
      }
    }
  }, [])

  // Start/stop preview when preview state changes
  useEffect(() => {
    if (speedPreviewActive) {
      startSpeedPreview()
    } else {
      stopSpeedPreview()
    }
  }, [speedPreviewActive, shuffleSpeed])

  const loadShuffleSpeed = async () => {
    setIsLoadingSpeed(true)
    try {
      const speed = await getShuffleSpeed()
      setShuffleSpeed(speed)
      toast({
        title: "Settings loaded",
        description: "Shuffle speed settings loaded successfully.",
      })
    } catch (error) {
      console.error("Error loading shuffle speed:", error)
      toast({
        title: "Error loading shuffle speed",
        description: "Failed to load shuffle speed setting. Using default value.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSpeed(false)
    }
  }

  const handleSpeedChange = (value: number[]) => {
    setShuffleSpeed(value[0])
    // Optional toast for immediate feedback
    if (value[0] === 1) {
      toast({
        title: "Slowest speed",
        description: "Shuffling will be set to the slowest speed."
      })
    } else if (value[0] === 100) {
      toast({
        title: "Maximum speed",
        description: "Shuffling will be set to the fastest speed."
      })
    }
  }

  const saveSpeed = async () => {
    setIsSavingSpeed(true)
    try {
      const success = await saveShuffleSpeed(shuffleSpeed)
      if (success) {
        toast({
          title: "Shuffle speed saved",
          description: `Your shuffle speed setting (${shuffleSpeed}%) has been saved successfully.`,
        })
      } else {
        throw new Error("Failed to save shuffle speed")
      }
    } catch (error) {
      console.error("Error saving shuffle speed:", error)
      toast({
        title: "Error saving shuffle speed",
        description: "Failed to save shuffle speed setting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingSpeed(false)
    }
  }

  const startSpeedPreview = () => {
    // Clear any existing interval
    if (speedPreviewIntervalRef.current) {
      clearInterval(speedPreviewIntervalRef.current)
    }

    // Convert speed to interval (same as in card-shuffler.tsx)
    const minInterval = 10;
    const maxInterval = 300;
    const interval = Math.round(maxInterval - ((shuffleSpeed - 1) * (maxInterval - minInterval) / 99));

    // Start a new interval with the current speed
    speedPreviewIntervalRef.current = setInterval(() => {
      setPreviewCardIndex((prevIndex) => {
        if (cards.length === 0) return 0;
        
        // Get a random index that's different from the current one
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * cards.length)
        } while (newIndex === prevIndex && cards.length > 1)
        
        return newIndex;
      })
    }, interval)
  }

  const stopSpeedPreview = () => {
    if (speedPreviewIntervalRef.current) {
      clearInterval(speedPreviewIntervalRef.current)
      speedPreviewIntervalRef.current = null
    }
  }

  const toggleSpeedPreview = () => {
    const newValue = !speedPreviewActive;
    setSpeedPreviewActive(newValue);
    
    if (newValue && cards.length < 2) {
      toast({
        title: "Preview unavailable",
        description: "You need at least 2 cards for preview to work.",
        variant: "destructive",
      });
    } else if (newValue) {
      toast({
        title: "Preview started",
        description: `Previewing shuffle at ${shuffleSpeed}% speed.`,
      });
    } else {
      toast({
        title: "Preview stopped",
        description: "Shuffle preview has been stopped.",
      });
    }
  }

  const loadCards = async () => {
    setIsLoadingCards(true)
    setApiError(null)
    try {
      const loadedCards = await getCards()
      setCards(loadedCards)
    } catch (error) {
      console.error("Error loading cards:", error)
      setApiError("Failed to load cards. Please try again later.")
      toast({
        title: "Error loading cards",
        description: "There was a problem loading your cards. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCards(false)
    }
  }

  const handleAddCard = async () => {
    // Reset form errors
    const errors: {
      name?: boolean;
      image?: boolean;
      link?: boolean;
    } = {};
    
    // Validate form
    if (!imageName) {
      errors.name = true;
    }
    
    if (!imageUrl && !file) {
      errors.image = true;
    }
    
    if (!imageLink) {
      errors.link = true;
    }
    
    // If there are errors, show them and return
    if (errors.name || errors.image || errors.link) {
      setFormErrors(errors);
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields highlighted in red.",
        variant: "destructive",
      })
      return;
    }

    setIsLoading(true)
    setApiError(null)
    setFormErrors({})

    try {
      let finalImageUrl = imageUrl

      if (file) {
        const reader = new FileReader()
        finalImageUrl = await new Promise((resolve, reject) => {
          reader.onload = async (e) => {
            try {
              if (typeof e.target?.result === "string") {
                // Pre-compress the image before adding
                const compressed = await compressImage(e.target.result, 0.6, 600)
                resolve(compressed)
              } else {
                reject(new Error("Failed to read file"))
              }
            } catch (error) {
              reject(error)
            }
          }
          reader.onerror = () => reject(new Error("Failed to read file"))
          reader.readAsDataURL(file)
        })
      }

      const newCard = {
        name: imageName || "Unnamed Card",
        imageUrl: finalImageUrl,
        link: imageLink,
      }

      const updatedCards = await addCard(newCard as Omit<CardImage, "id" | "createdAt">)

      if (updatedCards) {
        setCards(updatedCards)
        resetForm()
        toast({
          title: "Card added successfully",
          description: `Card "${imageName}" has been added to your collection.`,
        })
      } else {
        setApiError("Failed to save card. Server error occurred.")
        toast({
          title: "Server error",
          description: "Failed to save card. Please try again later.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding card:", error)
      toast({
        title: "Error adding card",
        description: "There was a problem adding your card. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCard = async (id: string) => {
    try {
      const updatedCards = await deleteCard(id)

      if (updatedCards) {
        setCards(updatedCards)
        toast({
          title: "Card deleted",
          description: "The card has been removed successfully",
        })
      } else {
        toast({
          title: "Error deleting card",
          description: "There was a problem deleting the card. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting card:", error)
      toast({
        title: "Error deleting card",
        description: "There was a problem deleting the card. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleClearAllCards = async () => {
    if (confirm("Are you sure you want to delete all cards? This cannot be undone.")) {
      try {
        const success = await clearAllCards()

        if (success) {
          setCards([])
          toast({
            title: "All cards deleted",
            description: "All cards have been removed successfully",
          })
        } else {
          toast({
            title: "Error clearing cards",
            description: "There was a problem clearing the cards. Please try again.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error clearing cards:", error)
        toast({
          title: "Error clearing cards",
          description: "There was a problem clearing the cards. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const openEditDialog = (card: CardImage) => {
    if (!card || !card._id) {
      toast({
        title: "Error",
        description: "Invalid card data",
        variant: "destructive",
      });
      return;
    }
    
    setEditingCard(card);
    setEditImageName(card.name);
    setEditImageUrl(card.imageUrl);
    setEditImageLink(card.link);
    setEditFile(null);

    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  }

  const closeEditDialog = () => {
    setEditingCard(null)
    setEditImageName("")
    setEditImageUrl("")
    setEditImageLink("")
    setEditFile(null)
  }

  const handleUpdateCard = async () => {
    if (!editingCard || !editingCard._id) {
      toast({
        title: "Error updating card",
        description: "Invalid card ID",
        variant: "destructive",
      });
      return;
    }

    // Reset form errors
    const errors: {
      name?: boolean;
      image?: boolean;
      link?: boolean;
    } = {};
    
    // Validate form
    if (!editImageName) {
      errors.name = true;
    }
    
    if (!editImageUrl && !editFile) {
      errors.image = true;
    }
    
    if (!editImageLink) {
      errors.link = true;
    }
    
    // If there are errors, show them and return
    if (errors.name || errors.image || errors.link) {
      setEditFormErrors(errors);
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields highlighted in red.",
        variant: "destructive",
      })
      return;
    }

    setIsLoading(true)
    setApiError(null)
    setEditFormErrors({})

    try {
      let finalImageUrl = editImageUrl

      if (editFile) {
        const reader = new FileReader()
        finalImageUrl = await new Promise((resolve, reject) => {
          reader.onload = async (e) => {
            try {
              if (typeof e.target?.result === "string") {
                // Pre-compress the image before updating
                const compressed = await compressImage(e.target.result, 0.6, 600)
                resolve(compressed)
              } else {
                reject(new Error("Failed to read file"))
              }
            } catch (error) {
              reject(error)
            }
          }
          reader.onerror = () => reject(new Error("Failed to read file"))
          reader.readAsDataURL(editFile)
        })
      }

      const updatedCardData = {
        name: editImageName || "Unnamed Card",
        imageUrl: finalImageUrl,
        link: editImageLink,
      }

      const updatedCards = await updateCard(editingCard._id, updatedCardData)

      if (updatedCards) {
        setCards(updatedCards)
        closeEditDialog()
        toast({
          title: "Card updated",
          description: "Your card has been updated successfully",
        })
      } else {
        setApiError("Failed to update card. Server error occurred.")
        toast({
          title: "Server error",
          description: "Failed to update card. Please try again later.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating card:", error)
      toast({
        title: "Error updating card",
        description: "There was a problem updating your card. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setImageUrl("")
    setImageLink("")
    setImageName("")
    setFile(null)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value)
    if (e.target.value) {
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleEditImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditImageUrl(e.target.value)
    if (e.target.value) {
      setEditFile(null)
      if (editFileInputRef.current) {
        editFileInputRef.current.value = ""
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    if (selectedFile) {
      setImageUrl("")
    }
  }

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setEditFile(selectedFile)
    if (selectedFile) {
      setEditImageUrl("")
    }
  }

  // Preview card based on current preview index
  const previewCard = cards[previewCardIndex]

  return (
    <div className="container mx-auto px-4 py-8 bg-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Cards</h1>
      </div>

      {apiError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Shuffle Speed Settings Card */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              Shuffle Speed Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="shuffle-speed">Shuffle Speed</Label>
                  <span className="text-muted-foreground text-sm">
                    {isLoadingSpeed ? "Loading..." : `${shuffleSpeed}% (${formatSpeedDisplay(shuffleSpeed)})`}
                  </span>
                </div>
                <Slider
                  id="shuffle-speed"
                  min={1}
                  max={100}
                  step={1}
                  value={[shuffleSpeed]}
                  onValueChange={handleSpeedChange}
                  disabled={isLoadingSpeed || isSavingSpeed}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>

              {/* Information alert about minimum cards required */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-700 text-sm">
                  <span className="font-medium">Note:</span> At least 2 cards are required for shuffling.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={toggleSpeedPreview} 
                  variant={speedPreviewActive ? "destructive" : "outline"}
                  disabled={cards.length < 2 || isLoadingCards}
                >
                  {speedPreviewActive ? "Stop Preview" : "Preview Speed"}
                </Button>
                <Button 
                  onClick={saveSpeed} 
                  disabled={isLoadingSpeed || isSavingSpeed}
                >
                  {isSavingSpeed ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Speed Setting"
                  )}
                </Button>
              </div>
            </div>
            
            {/* Speed Preview Card */}
            {speedPreviewActive && (
              <div className="mt-4 border rounded-lg p-2 overflow-hidden">
                <h3 className="text-sm font-medium mb-2">Speed Preview</h3>
                {cards.length < 2 ? (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      You need at least 2 cards to preview shuffling.
                    </AlertDescription>
                  </Alert>
                ) : isLoadingCards ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                    {previewCard ? (
                      <Image
                        src={previewCard.imageUrl || "/placeholder.svg"}
                        alt={previewCard.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg"
                        }}
                        width={300}
                        height={200}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">No preview available</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5" />
              Add New Card
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-name" className="flex items-center gap-1">
                <Type className="h-4 w-4" /> Card Name <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="image-name"
                placeholder="Enter a name for this card"
                value={imageName}
                onChange={(e) => {
                  setImageName(e.target.value);
                  if (e.target.value) {
                    setFormErrors(prev => ({...prev, name: false}));
                  }
                }}
                className={formErrors.name ? "border-red-500 focus:ring-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-xs text-red-500">Card name is required</p>
              )}
            </div>

            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">Image URL</TabsTrigger>
                <TabsTrigger value="upload">Upload Image</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-2">
                <Label htmlFor="image-url">Image URL <span className="text-red-500">*</span></Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => {
                    handleImageUrlChange(e);
                    if (e.target.value) {
                      setFormErrors(prev => ({...prev, image: false}));
                    }
                  }}
                  className={formErrors.image && !file ? "border-red-500 focus:ring-red-500" : ""}
                />
                {formErrors.image && !file && !imageUrl && (
                  <p className="text-xs text-red-500">Please provide an image URL or upload an image</p>
                )}
              </TabsContent>
              <TabsContent value="upload" className="space-y-2">
                <Label htmlFor="image-upload">Upload Image <span className="text-red-500">*</span></Label>
                <Input 
                  id="image-upload" 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={(e) => {
                    handleFileChange(e);
                    if (e.target.files && e.target.files.length > 0) {
                      setFormErrors(prev => ({...prev, image: false}));
                    }
                  }} 
                  className={formErrors.image && !imageUrl ? "border-red-500 focus:ring-red-500" : ""}
                />
                {formErrors.image && !imageUrl && !file && (
                  <p className="text-xs text-red-500">Please upload an image or provide an image URL</p>
                )}
                <p className="text-xs text-muted-foreground">
                  For best results, use images smaller than 600px wide. Larger images will be compressed.
                </p>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="image-link" className="flex items-center gap-1">
                <LinkIcon className="h-4 w-4" /> Link URL <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="image-link"
                placeholder="https://example.com"
                value={imageLink}
                onChange={(e) => {
                  setImageLink(e.target.value);
                  if (e.target.value) {
                    setFormErrors(prev => ({...prev, link: false}));
                  }
                }}
                className={formErrors.link ? "border-red-500 focus:ring-red-500" : ""}
              />
              {formErrors.link && (
                <p className="text-xs text-red-500">Link URL is required</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddCard} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                "Add Card"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Current Cards {isLoadingCards ? "" : `(${cards.length})`}
          </h2>
          {cards.length > 0 && !isLoadingCards && (
            <Button variant="outline" size="sm" onClick={handleClearAllCards}>
              Clear All
            </Button>
          )}
        </div>

        {isLoadingCards ? (
          <div className="flex justify-center items-center p-12 border rounded-lg border-dashed">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center p-8 border rounded-lg border-dashed">
            <Alert className="bg-amber-50 border-amber-200 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-700">
                No cards found. Add at least 2 cards to start shuffling.
              </AlertDescription>
            </Alert>
            <p className="text-muted-foreground">Add your first card to get started!</p>
          </div>
        ) : cards.length === 1 ? (
          <>
            <Alert className="bg-amber-50 border-amber-200 mb-4">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-700">
                You have only 1 card. Add at least one more card to enable shuffling.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto p-1">
              {cards.map((card) => (
                <Card key={card._id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative aspect-video bg-muted">
                    <Image
                      src={card.imageUrl || "/placeholder.svg"}
                      alt={card.name || "Card image"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=300"
                      }}
                      width={200}
                      height={300}
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{card.name}</h3>
                        <a
                          href={card.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary truncate block hover:underline"
                        >
                          {card.link}
                        </a>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="flex-shrink-0 h-8 w-8"
                          onClick={() => openEditDialog(card)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="flex-shrink-0 h-8 w-8"
                          onClick={() => handleDeleteCard(card._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            {cards.length >= 2 && (
              <Alert className="bg-green-50 border-green-200 mb-4">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700">
                  You have {cards.length} cards. Ready to shuffle!
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto p-1">
              {cards.map((card) => (
                <Card key={card._id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative aspect-video bg-muted">
                    <Image
                      src={card.imageUrl || "/placeholder.svg"}
                      alt={card.name || "Card image"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=300"
                      }}
                      width={200}
                      height={300}
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{card.name}</h3>
                        <a
                          href={card.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary truncate block hover:underline"
                        >
                          {card.link}
                        </a>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="flex-shrink-0 h-8 w-8"
                          onClick={() => openEditDialog(card)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="flex-shrink-0 h-8 w-8"
                          onClick={() => handleDeleteCard(card._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit Card Dialog */}
      <Dialog open={!!editingCard} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-image-name" className="flex items-center gap-1">
                <Type className="h-4 w-4" /> Card Name <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="edit-image-name"
                placeholder="Enter a name for this card"
                value={editImageName}
                onChange={(e) => {
                  setEditImageName(e.target.value);
                  if (e.target.value) {
                    setEditFormErrors(prev => ({...prev, name: false}));
                  }
                }}
                className={editFormErrors.name ? "border-red-500 focus:ring-red-500" : ""}
              />
              {editFormErrors.name && (
                <p className="text-xs text-red-500">Card name is required</p>
              )}
            </div>

            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">Image URL</TabsTrigger>
                <TabsTrigger value="upload">Upload Image</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-2">
                <Label htmlFor="edit-image-url">Image URL <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-image-url"
                  placeholder="https://example.com/image.jpg"
                  value={editImageUrl}
                  onChange={(e) => {
                    handleEditImageUrlChange(e);
                    if (e.target.value) {
                      setEditFormErrors(prev => ({...prev, image: false}));
                    }
                  }}
                  className={editFormErrors.image && !editFile ? "border-red-500 focus:ring-red-500" : ""}
                />
                {editFormErrors.image && !editFile && !editImageUrl && (
                  <p className="text-xs text-red-500">Please provide an image URL or upload an image</p>
                )}
              </TabsContent>
              <TabsContent value="upload" className="space-y-2">
                <Label htmlFor="edit-image-upload">Upload Image <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-image-upload"
                  type="file"
                  accept="image/*"
                  ref={editFileInputRef}
                  onChange={(e) => {
                    handleEditFileChange(e);
                    if (e.target.files && e.target.files.length > 0) {
                      setEditFormErrors(prev => ({...prev, image: false}));
                    }
                  }}
                  className={editFormErrors.image && !editImageUrl ? "border-red-500 focus:ring-red-500" : ""}
                />
                {editFormErrors.image && !editImageUrl && !editFile && (
                  <p className="text-xs text-red-500">Please upload an image or provide an image URL</p>
                )}
                <p className="text-xs text-muted-foreground">
                  For best results, use images smaller than 600px wide. Larger images will be compressed.
                </p>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="edit-image-link" className="flex items-center gap-1">
                <LinkIcon className="h-4 w-4" /> Link URL <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="edit-image-link"
                placeholder="https://example.com"
                value={editImageLink}
                onChange={(e) => {
                  setEditImageLink(e.target.value);
                  if (e.target.value) {
                    setEditFormErrors(prev => ({...prev, link: false}));
                  }
                }}
                className={editFormErrors.link ? "border-red-500 focus:ring-red-500" : ""}
              />
              {editFormErrors.link && (
                <p className="text-xs text-red-500">Link URL is required</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog} className="gap-1">
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleUpdateCard} disabled={isLoading} className="gap-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
