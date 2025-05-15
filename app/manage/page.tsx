"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, ImagePlus, LinkIcon, Type, Edit, X, Check, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { CardImage } from "@/lib/types"
import { getCards, addCard, deleteCard, updateCard, clearAllCards, compressImage } from "@/lib/storage"
import Image from "next/image"

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Load cards from API
    loadCards()
  }, [])

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
    if ((!imageUrl && !file) || !imageLink) {
      toast({
        title: "Missing information",
        description: "Please provide an image (URL or upload) and a link",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setApiError(null)

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
          title: "Card added",
          description: "Your card has been added successfully",
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

    if ((!editImageUrl && !editFile) || !editImageLink) {
      toast({
        title: "Missing information",
        description: "Please provide an image (URL or upload) and a link",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setApiError(null)

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Cards</h1>
      </div>

      {apiError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                <Type className="h-4 w-4" /> Card Name
              </Label>
              <Input
                id="image-name"
                placeholder="Enter a name for this card"
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
              />
            </div>

            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">Image URL</TabsTrigger>
                <TabsTrigger value="upload">Upload Image</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={handleImageUrlChange}
                />
              </TabsContent>
              <TabsContent value="upload" className="space-y-2">
                <Label htmlFor="image-upload">Upload Image</Label>
                <Input id="image-upload" type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} />
                <p className="text-xs text-muted-foreground">
                  For best results, use images smaller than 600px wide. Larger images will be compressed.
                </p>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="image-link" className="flex items-center gap-1">
                <LinkIcon className="h-4 w-4" /> Link URL
              </Label>
              <Input
                id="image-link"
                placeholder="https://example.com"
                value={imageLink}
                onChange={(e) => setImageLink(e.target.value)}
              />
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
              <p className="text-muted-foreground">No cards added yet. Add your first card!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto p-1">
              {cards.map((card) => (
                <Card key={card._id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative aspect-video bg-muted">
                    <Image
                      src={card.imageUrl || "/placeholder.svg"}
                      alt={card.name}
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
          )}
        </div>
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
                <Type className="h-4 w-4" /> Card Name
              </Label>
              <Input
                id="edit-image-name"
                placeholder="Enter a name for this card"
                value={editImageName}
                onChange={(e) => setEditImageName(e.target.value)}
              />
            </div>

            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">Image URL</TabsTrigger>
                <TabsTrigger value="upload">Upload Image</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-2">
                <Label htmlFor="edit-image-url">Image URL</Label>
                <Input
                  id="edit-image-url"
                  placeholder="https://example.com/image.jpg"
                  value={editImageUrl}
                  onChange={handleEditImageUrlChange}
                />
              </TabsContent>
              <TabsContent value="upload" className="space-y-2">
                <Label htmlFor="edit-image-upload">Upload Image</Label>
                <Input
                  id="edit-image-upload"
                  type="file"
                  accept="image/*"
                  ref={editFileInputRef}
                  onChange={handleEditFileChange}
                />
                <p className="text-xs text-muted-foreground">
                  For best results, use images smaller than 600px wide. Larger images will be compressed.
                </p>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="edit-image-link" className="flex items-center gap-1">
                <LinkIcon className="h-4 w-4" /> Link URL
              </Label>
              <Input
                id="edit-image-link"
                placeholder="https://example.com"
                value={editImageLink}
                onChange={(e) => setEditImageLink(e.target.value)}
              />
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
