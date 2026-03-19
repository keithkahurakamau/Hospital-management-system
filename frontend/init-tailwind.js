import fs from 'fs';

const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medicare: {
          blue: "#1B2559",
          muted: "#A3AED0",
          bg: "#f4f7fe"
        }
      }
    },
  },
  plugins: [],
}`;

const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

try {
    fs.writeFileSync('tailwind.config.js', tailwindConfig);
    fs.writeFileSync('postcss.config.js', postcssConfig);
    console.log('✅ Configuration files created successfully!');
} catch (err) {
    console.error('❌ Error creating files:', err);
}