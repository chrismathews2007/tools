"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Trash2 } from "lucide-react"
import JSZip from "jszip"

const MAX_FILE_SIZE_MB = 25
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

interface ConversionResult {
  fileName: string
  dataUrl: string
  originalSize: number
  convertedSize: number
}

export default function FileUploader() {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<ConversionResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (files.length === 0) {
      setError("Please select at least one file to convert")
      return
    }

    setIsConverting(true)
    setError(null)
    setResults([])
    setProgress(0)

    try {
      const convertedResults: ConversionResult[] = []
      for (let i = 0; i < files.length; i++) {
        const result = await convertToWebP(files[i])
        convertedResults.push(result)
        setProgress(((i + 1) / files.length) * 100)
      }
      setResults(convertedResults)
    } catch (err) {
      console.error("Conversion error:", err)
      setError(`Error converting files: ${err instanceof Error ? err.message : "Unknown error"}`)
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    const validFiles = selectedFiles.filter((file) => file.size <= MAX_FILE_SIZE_BYTES)
    if (validFiles.length !== selectedFiles.length) {
      setError(`Some files exceeded the ${MAX_FILE_SIZE_MB}MB limit and were not added`)
    } else {
      setError(null)
    }
    setFiles((prevFiles) => [...prevFiles, ...validFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index))
  }

  const downloadAllAsZip = async () => {
    const zip = new JSZip()

    results.forEach((result) => {
      const data = result.dataUrl.split(",")[1]
      zip.file(result.fileName, data, { base64: true })
    })

    const content = await zip.generateAsync({ type: "blob" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(content)
    link.download = "converted_webp_images.zip"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-grow">
            <p className="text-sm text-gray-500">
              {files.length === 0 ? `No files selected (MAX. ${MAX_FILE_SIZE_MB}MB per file)` : `${files.length} file(s) selected`}
            </p>
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
              <span className="font-medium text-gray-600">Select files</span>
            </span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              aria-label="Upload image files"
            />
          </label>
        </div>
        {files.length > 0 && (
          <ul className="mt-4 space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {file.name} ({formatFileSize(file.size)})
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                  aria-label={`Remove ${file.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <Button type="submit" disabled={isConverting || files.length === 0} aria-busy={isConverting} className="w-full">
          {isConverting ? "Converting..." : "Convert to WebP"}
        </Button>
      </form>

      {error && (
        <p className="mt-4 text-red-500" role="alert">
          {error}
        </p>
      )}

      {isConverting && (
        <div className="mt-4">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-600 mt-2">Converting: {progress.toFixed(0)}% complete</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Conversion Results</h2>
            <Button onClick={downloadAllAsZip} className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download All as ZIP</span>
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Original Size</TableHead>
                <TableHead>Converted Size</TableHead>
                <TableHead>Size Reduction</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell>{result.fileName}</TableCell>
                  <TableCell>{formatFileSize(result.originalSize)}</TableCell>
                  <TableCell>{formatFileSize(result.convertedSize)}</TableCell>
                  <TableCell>{calculateSavings(result.originalSize, result.convertedSize)}</TableCell>
                  <TableCell>
                    <a href={result.dataUrl} download={result.fileName} className="text-blue-500 hover:text-blue-700">
                      Download
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} aria-hidden="true" />
    </div>
  )
}

