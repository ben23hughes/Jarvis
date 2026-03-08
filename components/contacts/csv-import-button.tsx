'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'

export function CsvImportButton({ onImported }: { onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/contacts/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      toast.success(`Imported ${data.imported} contacts${data.skipped ? ` (${data.skipped} skipped)` : ''}`)
      onImported()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        <Upload className="mr-2 h-4 w-4" />
        {loading ? 'Importing...' : 'Import CSV'}
      </Button>
    </>
  )
}
