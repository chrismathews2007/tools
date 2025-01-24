"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"

interface ConversionResult {
  fileName: string
  dataUrl: string
  originalSize: number
  convertedSize: number
}

export default function FileUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file) {
      setError("Please select a file to convert")
      return
    }

    setIsConverting(true)
    setError(null)

    try {
      const result = await convertToWebP(file)
      setResult(result)
    } catch (err) {
      console.error("Conversion error:", err)
      setError(`Error converting file: ${err instanceof Error ? err.message : "Unknown error"}`)
      setResult(null)
    } finally {
      setIsConverting(false)
    }
  }

  const convertToWebP = (file: File): Promise<ConversionResult> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) {
          reject(new Error("Canvas not available"))
          return
        }
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const reader = new FileReader()
              reader.onloadend = () => {
                const dataUrl = reader.result as string
                resolve({
                  fileName: `${file.name.split(".")[0]}.webp`,
                  dataUrl,
                  originalSize: file.size,
                  convertedSize: blob.size,
                })
              }
              reader.onerror = () => reject(new Error("Failed to read converted image"))
              reader.readAsDataURL(blob)
            } else {
              reject(new Error("Blob conversion failed"))
            }
          },
          "image/webp",
          0.8,
        )
      }
      img.onerror = () => reject(new Error("Image loading failed"))
      img.src = URL.createObjectURL(file)
      setOriginalImageUrl(img.src)
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB"
    else return (bytes / 1048576).toFixed(2) + " MB"
  }

  const calculateSavings = (original: number, converted: number): string => {
    const savings = (((original - converted) / original) * 100).toFixed(2)
    return `${savings}%`
  }

  return (
    <div className="w-full max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-grow">
            {file ? (
              <p className="text-sm text-gray-500">
                Selected file: {file.name} ({formatFileSize(file.size)})
              </p>
            ) : (
              <p className="text-sm text-gray-500">No file selected (MAX. 5MB)</p>
            )}
          </div>
          <label
            htmlFor="file-upload"
            className="flex items-center justify-center w-40 h-10 px-4 transition bg-white border border-gray-300 rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none"
          >
            <span className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
              <span className="font-medium text-gray-600">Select a file</span>
            </span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
                  setError("File size exceeds 5MB limit")
                  setFile(null)
                  setOriginalImageUrl(null)
                } else {
                  setFile(selectedFile || null)
                  setError(null)
                  if (selectedFile) {
                    const url = URL.createObjectURL(selectedFile)
                    setOriginalImageUrl(url)
                  } else {
                    setOriginalImageUrl(null)
                  }
                  console.log(`File selected: ${selectedFile?.name}, size: ${selectedFile?.size} bytes`)
                }
              }}
              aria-label="Upload an image file"
            />
          </label>
        </div>
        <Button type="submit" disabled={isConverting || !file} aria-busy={isConverting} className="w-full">
          {isConverting ? "Converting..." : "Convert to WebP"}
        </Button>
      </form>

      {error && (
        <p className="mt-4 text-red-500" role="alert">
          {error}
        </p>
      )}

      {(originalImageUrl || result) && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Image Comparison</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">Original Image</h3>
              {originalImageUrl && (
                <img
                  src={originalImageUrl || "/placeholder.svg"}
                  alt="Original"
                  className="max-w-full h-auto rounded-lg shadow-md"
                />
              )}
              {file && <p className="mt-2 text-sm text-gray-600">Size: {formatFileSize(file.size)}</p>}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">Converted WebP</h3>
              {result && (
                <>
                  <img
                    src={result.dataUrl || "/placeholder.svg"}
                    alt="Converted WebP"
                    className="max-w-full h-auto rounded-lg shadow-md"
                  />
                  <p className="mt-2 text-sm text-gray-600">Size: {formatFileSize(result.convertedSize)}</p>
                  <p className="text-sm text-green-600">
                    Size reduction: {calculateSavings(result.originalSize, result.convertedSize)}
                  </p>
                  <a
                    href={result.dataUrl}
                    download={result.fileName}
                    className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Download WebP
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} aria-hidden="true" />
    </div>
  )
}

