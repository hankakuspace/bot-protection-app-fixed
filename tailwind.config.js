// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}', // ← 念のためsrc全体も
  ],
  theme: {
    extend: {
      keyframes: {
        "fade-in-out": {
          "0%, 100%": { opacity: 0, transform: "translateY(-10px)" },
          "10%, 90%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-out": "fade-in-out 3s ease-in-out forwards",
      },
    },
  },
  plugins: [],
};
