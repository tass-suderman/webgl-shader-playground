import { Typography } from '@mui/material'

export interface AboutPaneSectionProps {
	title?: string
	children: React.ReactNode
}

const AboutPaneSection: React.FC<AboutPaneSectionProps> = ({ title, children }) => {
  return (
    <>
      {title && <Typography variant="h6" sx={{ fontFamily: 'monospace', mb: 2 }} children={title} />}
      {children}
    </>
  )
}

export default AboutPaneSection
