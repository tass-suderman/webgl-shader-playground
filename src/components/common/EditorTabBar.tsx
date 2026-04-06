import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

interface EditorTabBarProps {
  value: 'editor' | 'examples'
  onChange: (value: 'editor' | 'examples') => void
}

export default function EditorTabBar({ value, onChange }: EditorTabBarProps) {
  return (
    <Tabs
      value={value}
      onChange={(_e, val: 'editor' | 'examples') => onChange(val)}
      sx={{
        minHeight: 32,
        flexShrink: 0,
        bgcolor: '#252526',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        '& .MuiTabs-indicator': { height: 2 },
      }}
    >
      <Tab
        label="Editor"
        value="editor"
        sx={{ minHeight: 32, py: 0.5, px: 2, fontSize: '0.75rem', textTransform: 'none', color: 'rgba(255,255,255,0.6)' }}
      />
      <Tab
        label="Examples"
        value="examples"
        sx={{ minHeight: 32, py: 0.5, px: 2, fontSize: '0.75rem', textTransform: 'none', color: 'rgba(255,255,255,0.6)' }}
      />
    </Tabs>
  )
}
