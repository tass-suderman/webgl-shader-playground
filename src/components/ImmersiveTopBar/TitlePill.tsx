import { Box, InputBase, SxProps, Typography } from '@mui/material'
import { TabConfig } from '../../utility/tabConfigs'
import { TitlePillIcon } from './TitlePillIcon'

interface TitlePillProps {
	title: string
	onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
	sx: SxProps
	tabConfig: TabConfig
}

const baseSx: SxProps = {
  color: 'white',
  fontFamily: 'monospace',
  fontSize: '0.875rem',
  flex: 1,
}

const inputBaseSx: SxProps = {
  ...baseSx,
  '& input': { p: 0 },
}

const titleSx: SxProps = {
  ...baseSx,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const TitlePill = ({ title, onTitleChange, sx, tabConfig }: TitlePillProps) => {
  return (
    <Box sx={{ ...sx, width: 300, pointerEvents: 'auto', flexShrink: 0 }}>
      <TitlePillIcon icon={tabConfig.icon} />
      {tabConfig.editableTitleLabel ? (
        <InputBase
          value={title}
          onChange={onTitleChange}
          sx={inputBaseSx}
          inputProps={{ 'aria-label': tabConfig.editableTitleLabel }}
        />
      ) : (
        <Typography
          sx={titleSx}
          children={tabConfig.title}
        />
      )}
    </Box>
  )
}

export default TitlePill
