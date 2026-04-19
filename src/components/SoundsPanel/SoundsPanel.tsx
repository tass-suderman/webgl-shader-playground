import { useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import InputBase from '@mui/material/InputBase'
import Tooltip from '@mui/material/Tooltip'
import DeleteIcon from '@mui/icons-material/Delete'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import { SOUND_CATEGORIES, SoundCategory } from '../../utility/strudel/soundCategories'
import { InformationPanel } from '../InformationPanel/InformationPanel'
import { useAppStorage, UserSample } from '../../hooks/useAppStorage'
import DeleteItemDialog from '../DeleteItemDialog/DeleteItemDialog'

const MAX_SAMPLE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

/** Strip extension from a file name to derive a default title. */
function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '')
}

/** Convert a File to a base64-encoded string. */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // result is "data:<mime>;base64,<data>" – strip the prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Inline sounds reference panel – shown in-pane instead of a modal. */
export default function SoundsPanel() {
  const { userSamples, setUserSamples } = useAppStorage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserSample | null>(null)

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    const newSamples: UserSample[] = []
    for (const file of files) {
      if (file.size > MAX_SAMPLE_SIZE_BYTES) {
        alert(`"${file.name}" is too large (max 5 MB). Skipping.`)
        continue
      }
      try {
        const audioData = await fileToBase64(file)
        newSamples.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          title: baseName(file.name),
          fileName: file.name,
          audioData,
        })
      } catch {
        console.error(`Failed to read sample: ${file.name}`)
      }
    }

    if (newSamples.length > 0) {
      setUserSamples(prev => [...prev, ...newSamples])
    }
  }

  const handleTitleChange = (id: string, newTitle: string) => {
    setUserSamples(prev =>
      prev.map(s => (s.id === id ? { ...s, title: newTitle } : s)),
    )
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    setUserSamples(prev => prev.filter(s => s.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const renderCategory = (cat: SoundCategory) => (
    <Box key={cat.label} sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        sx={{
          color: 'textColor.muted',
          textTransform: 'uppercase',
        }}
      >
        {cat.label}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
        {cat.sounds.map((s: string) => (
          <Typography
            key={s}
            component="code"
            sx={{
              bgcolor: 'background.button',
              px: 0.75,
              py: 0.25,
              borderRadius: 0.5,
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              color: '#9cdcfe',
            }}
          >
            {s}
          </Typography>
        ))}
      </Box>
      {cat.aliases && Object.keys(cat.aliases).length > 0 && (
        <Typography
          variant="caption"
          sx={{
            color: 'textColor.muted',
            display: 'block',
            mt: 0.5,
          }}
        >
          Aliases: {Object.entries(cat.aliases).map(([a, b]) => `${a} → ${b}`).join(', ')}
        </Typography>
      )}
    </Box>
  )

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <InformationPanel
        renderer={renderCategory}
        items={SOUND_CATEGORIES}
        header={
          <Box sx={{ mb: 2 }}>
            {userSamples.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'textColor.muted', textTransform: 'uppercase', display: 'block', mb: 0.5 }}
                >
                  Uploaded samples
                </Typography>
                {userSamples.map(sample => (
                  <Box
                    key={sample.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 0.25,
                    }}
                  >
                    <Tooltip title="Sound name (use in .sound(&quot;…&quot;))">
                      <InputBase
                        value={sample.title}
                        onChange={e => handleTitleChange(sample.id, e.target.value)}
                        inputProps={{ 'aria-label': `Sample title for ${sample.fileName}` }}
                        sx={{
                          bgcolor: 'background.button',
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 0.5,
                          fontSize: '0.8rem',
                          fontFamily: 'monospace',
                          color: '#9cdcfe',
                          minWidth: 80,
                          flex: '0 1 auto',
                          '& input': { p: 0, cursor: 'text' },
                        }}
                      />
                    </Tooltip>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'textColor.muted',
                        fontFamily: 'monospace',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minWidth: 0,
                      }}
                    >
                      {sample.fileName}
                    </Typography>
                    <Tooltip title="Delete sample">
                      <IconButton
                        size="small"
                        aria-label={`Delete sample ${sample.title}`}
                        onClick={() => setDeleteTarget(sample)}
                        sx={{ color: 'textColor.muted', flexShrink: 0, p: 0.25 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </Box>
            )}

            <Button
              size="small"
              variant="outlined"
              startIcon={<FileUploadIcon fontSize="small" />}
              onClick={handleUploadClick}
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                color: 'textColor.muted',
                borderColor: 'border.faint',
                '&:hover': { borderColor: 'textColor.muted' },
              }}
            >
              Upload sample
            </Button>
          </Box>
        }
        footer={
          <Typography
            variant="caption"
            sx={{ color: 'textColor.muted', display: 'block', mt: 1 }}
          >
            Use with <code style={{ color: '#9cdcfe' }}>.sound("name")</code> in your pattern.
          </Typography>
        }
      />

      <DeleteItemDialog
        open={deleteTarget !== null}
        title={deleteTarget?.title ?? ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
