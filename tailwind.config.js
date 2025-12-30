/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            colors: {
                slate: {
                    950: '#020617', // Custom deep slate for improved contrast
                }
            },
            fontFamily: {
                sans: ['Roboto', 'Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
