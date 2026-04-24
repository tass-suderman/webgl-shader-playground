import { createTheme } from "@mui/material";
import kanagawa from "../themes/kanagawa";

export const useTheme = () => {
  const muiTheme = createTheme(kanagawa.themeContent);
  const strudelTheme = 'tokyoNight'

  return {
    muiTheme,
    strudelTheme,
  };
}
