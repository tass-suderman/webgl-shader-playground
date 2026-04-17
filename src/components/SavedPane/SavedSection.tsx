import { Box, IconButton, List, ListItem, ListItemButton, ListItemText, Tooltip, Typography } from "@mui/material"
import { SavedEntry } from "../../hooks/useSavedContent"
import { DeleteOutline } from "@mui/icons-material"

const SavedSection = ({
  heading,
  entries,
  ext,
  onLoad,
  onDelete,
}: {
  heading: string
  entries: SavedEntry[]
  ext: string
  onLoad: (title: string, content: string) => void
  onDelete: (title: string) => void
}) => {
  if (entries.length === 0) return null
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="subtitle2"
        sx={{
          px: 2,
          py: 1,
          color: 'textColor.muted',
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {heading}
      </Typography>
      <List dense disablePadding>
        {entries.map(entry => (
          <ListItem
            key={entry.title}
            disablePadding
            secondaryAction={
              <Tooltip title={`Delete ${ext === 'glsl' ? 'shader' : 'pattern'}`}>
                <IconButton
                  size="small"
                  edge="end"
                  aria-label={`Delete ${entry.title}`}
                  onClick={() => onDelete(entry.title)}
                  sx={{ color: 'textColor.muted', '&:hover': { color: '#ff8080' } }}
                >
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </Tooltip>
            }
          >
            <ListItemButton
              onClick={() => onLoad(entry.title, entry.content)}
              sx={{
                px: 2,
                py: 0.75,
                pr: 6,
                '&:hover': { bgcolor: 'background.button' },
              }}
            >
              <ListItemText
                primary={entry.title}
                slotProps={{
									primary: {
										sx: {
											color: 'textColor.primary',
											fontFamily: 'monospace',
											fontSize: '0.875rem',
										},
									}
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
export default SavedSection
