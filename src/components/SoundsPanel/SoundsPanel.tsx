import { useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import InputBase from '@mui/material/InputBase'
import Tooltip from '@mui/material/Tooltip'
import Snackbar from '@mui/material/Snackbar'
import DeleteIcon from '@mui/icons-material/Delete'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import { SOUND_CATEGORIES, SoundCategory } from '../../utility/strudel/soundCategories'
import { InformationPanel } from '../InformationPanel/InformationPanel'
import { useAppStorage, UserSample } from '../../hooks/useAppStorage'
import DeleteItemDialog from '../DeleteItemDialog/DeleteItemDialog'

const MAX_SAMPLE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

/** All built-in sound names (sounds + aliases) from SOUND_CATEGORIES. */
const BUILTIN_SOUND_NAMES: ReadonlySet<string> = new Set(
  SOUND_CATEGORIES.flatMap(cat => [
    ...cat.sounds,
    ...Object.keys(cat.aliases ?? {}),
  ]),
)

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

/**
 * Given a desired title and the set of already-taken names, return a unique
 * title by appending "_1", "_2", … as needed.
 */
function uniqueTitle(desired: string, takenNames: Set<string>): string {
  if (!takenNames.has(desired)) return desired
  let n = 1
  while (takenNames.has(`${desired}_${n}`)) n++
  return `${desired}_${n}`
}

/** Inline sounds reference panel – shown in-pane instead of a modal. */
export default function SoundsPanel() {
  const { userSamples, setUserSamples } = useAppStorage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserSample | null>(null)
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null)
  /** Draft titles typed by the user but not yet committed (keyed by sample id). */
  const [draftTitles, setDraftTitles] = useState<Record<string, string>>({})

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    const newSamples: UserSample[] = []
    const skipped: string[] = []
    // Build the set of taken names before processing files so that multiple
    // files uploaded at once don't collide with each other either.
    const takenNames = new Set<string>([
      ...BUILTIN_SOUND_NAMES,
      ...userSamples.map(s => s.title),
    ])
    for (const file of files) {
      if (file.size > MAX_SAMPLE_SIZE_BYTES) {
        skipped.push(file.name)
        continue
      }
      try {
        const audioData = await fileToBase64(file)
        const title = uniqueTitle(baseName(file.name), takenNames)
        takenNames.add(title)
        newSamples.push({
          id: crypto.randomUUID(),
          title,
          fileName: file.name,
          audioData,
        })
      } catch (err) {
        console.error(`Failed to read sample: ${file.name}`, err)
      }
    }

    if (skipped.length > 0) {
      setSnackbarMessage(`Skipped (> 5 MB): ${skipped.join(', ')}`)
    }

    if (newSamples.length > 0) {
      setUserSamples(prev => [...prev, ...newSamples])
    }
  }

  /** Update the draft title while the user is typing (no validation yet). */
  const handleTitleChange = (id: string, newTitle: string) => {
    setDraftTitles(prev => ({ ...prev, [id]: newTitle }))
  }

  /** Commit the draft title when the input loses focus, with validation. */
  const handleTitleBlur = (id: string) => {
    const draft = draftTitles[id]
    // Nothing to commit if the user never changed the title for this sample
    if (draft === undefined) return

    const clearDraft = () =>
      setDraftTitles(prev => { const { [id]: _removed, ...next } = prev; return next })

    const trimmed = draft.trim()
    if (!trimmed) {
      setSnackbarMessage('Sample name cannot be empty')
      clearDraft()
      return
    }

    const conflict =
      BUILTIN_SOUND_NAMES.has(trimmed) ||
      userSamples.some(s => s.id !== id && s.title === trimmed)

    if (conflict) {
      setSnackbarMessage(`"${trimmed}" is already taken – choose a different name`)
      clearDraft()
      return
    }

    setUserSamples(prev =>
      prev.map(s => (s.id === id ? { ...s, title: trimmed } : s)),
    )
    clearDraft()
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
                        value={draftTitles[sample.id] ?? sample.title}
                        onChange={e => handleTitleChange(sample.id, e.target.value)}
                        onBlur={() => handleTitleBlur(sample.id)}
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
                        sx={{ color: 'error.main', flexShrink: 0, p: 0.25 }}
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
                color: 'textColor.primary',
                borderColor: 'border.faint',
                '&:hover': { borderColor: 'textColor.primary' },
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

      <Snackbar
        open={snackbarMessage !== null}
        message={snackbarMessage ?? ''}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  )
}
