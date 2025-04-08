"use server"

import sharp from "sharp"

export async function convertToWebP(formData: FormData) {
  try {
    const file = formData.get("file") as File
    if (!file) {
      throw new Error("No file uploaded")
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    console.log(`Received file: ${file.name}, size: ${buffer.length} bytes`)

    const webpBuffer = await sharp(buffer).webp({ quality: 40 }).toBuffer()

    console.log(`Converted to WebP, size: ${webpBuffer.length} bytes`)

    const base64 = webpBuffer.toString("base64")
    const fileName = `${file.name.split(".")[0]}.webp`

    return { fileName, base64 }
  } catch (error) {
    console.error("Server action error:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to convert to WebP: ${error.message}`)
    } else {
      throw new Error("Failed to convert to WebP: Unknown error")
    }
  }
}

