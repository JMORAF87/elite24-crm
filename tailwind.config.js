/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'neon-pink': '#FF59F1',
            },
            fontFamily: {
                'sans': ['Inter', 'system-ui', 'sans-serif'],
            },
            fontWeight: {
                'extrabold': '800',
                'black': '900',
            },
            borderWidth: {
                '3': '3px',
            },
        },
    },
    plugins: [],
}
