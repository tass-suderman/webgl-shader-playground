import { createTheme } from "@mui/material";
import { Theme, themes } from "../themes/Theme";
import { useState, useEffect } from "react";
import { useAppStorage } from "./useAppStorage";
import kanagawa from "../themes/kanagawa";

export const useTheme = () => {
	const { theme, setTheme } = useAppStorage();
	const muiTheme = createTheme(themes.find(t => t.name === theme)?.themeContent || kanagawa.themeContent);

	const [currentTheme, setCurrentTheme] = useState<Theme>(kanagawa);
	
	useEffect(() => {
		const storedTheme = localStorage.getItem("shader-playground:theme");
		if (storedTheme) {
			const foundTheme = themes.find(t => t.name === storedTheme);
			if (foundTheme) {
				setCurrentTheme(foundTheme);
			}
		}
	}, [theme]);

	const changeTheme = (themeName: string) => {
		console.log("Changing theme to", themeName);
		const foundTheme = themes.find(t => t.name === themeName);
		if (foundTheme) {
			setCurrentTheme(foundTheme);
			setTheme(themeName);
		}
	}


	return {
		currentTheme,
		changeTheme,
		muiTheme
	};
}

