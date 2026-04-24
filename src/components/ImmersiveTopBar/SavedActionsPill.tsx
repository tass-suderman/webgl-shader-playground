import { zipSync, strToU8 } from 'fflate'
import { IconButton, Tooltip } from '@mui/material';
import { Download } from '@mui/icons-material';
import { useSavedContent } from '../../hooks/useSavedContent';
import { useMemo } from 'react';

function sanitizeFilename(title: string, fallback: string): string {
  return (
    title
      .replace(/[^\w\s.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^[_\s]+|[_\s]+$/g, '')
      .trim() || fallback
  )
}

const SavedActionsPill = () => {
  const {
    savedPatterns,
    savedShaders
  } = useSavedContent();

  const handleExportAll = () => {
    const files: Record<string, Uint8Array> = {}
    for (const shader of savedShaders) {
      const safeName = sanitizeFilename(shader.title, 'shader')
      files[`shaders/${safeName}.glsl`] = strToU8(shader.content)
    }
    for (const pattern of savedPatterns) {
      const safeName = sanitizeFilename(pattern.title, 'pattern')
      files[`patterns/${safeName}.strudel`] = strToU8(pattern.content)
    }
    const zipped = zipSync(files)
    const blob = new Blob([zipped], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'saved-content.zip'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }


  const hasSavedContent = useMemo(() => savedShaders.length || savedPatterns.length, [savedShaders, savedPatterns]);

  return (
    <Tooltip title="Export all saved content as zip">
      <IconButton
        size="small"
        onClick={handleExportAll}
        aria-label="Export all saved content"
        sx={{ color: 'textColor.primary', ':disabled': { color: 'textColor.primary', opacity: 0.25 } }}
        disabled={!hasSavedContent}
        children={<Download fontSize="small" />}
      />
    </Tooltip>
  )
}

export default SavedActionsPill
