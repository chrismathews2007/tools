import FileUploader from "./components/FileUploader"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <h1 className="text-4xl font-bold mb-8">WebP Converter</h1>
      <FileUploader />
    </main>
  )
}

