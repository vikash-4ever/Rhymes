/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx","./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        "poppins" : ['Poppins-Regular', 'sans-serif'],
        "poppins-thin" : ['Poppins-Thin', 'sans-serif'],
        "poppins-light" : ['Poppins-Light', 'sans-serif'],
        "poppins-extralight" : ['Poppins-ExtraLight', 'sans-serif'],
        "poppins-medium" : ['Poppins-Medium', 'sans-serif'],
        "poppins-semibold" : ['Poppins-SemiBold', 'sans-serif'],
        "poppins-bold" : ['Poppins-Bold', 'sans-serif'],
        "poppins-extrabold" : ['Poppins-ExtraBold', 'sans-serif'],
        "poppins-black" : ['Poppins-Black', 'sans-serif'],
      },
      colors: {
        primary: {
          300: "#232323",
          200: "#22211f",
          100: "#6f7684",
        },
        text1: "#ffffff",
        text2: "#bdc4d4",
      },
    },
  },
  plugins: [],
}