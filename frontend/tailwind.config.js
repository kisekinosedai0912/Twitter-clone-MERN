import animatePlugin from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
	theme: {
		extend: {
			fontFamily: {
			  jetbrains: ['"JetBrains Mono"', 'monospace'],
			},
			fontSize: {
				'xs-16': '16px',
				'sm-18': '18px',
				'md-24': '24px',
			  	'lg-55': '55px',
				'xl-60': '60px',
			},
			lineHeight: {
			  	'90': '90px',
				'32': '32px',
				'21': '21px',
			},
		},
	},
	plugins: [animatePlugin],
}