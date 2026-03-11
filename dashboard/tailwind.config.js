/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      colors: {
        office: {
          floor: '#e8dcc8',
          wall: '#7c6f64',
          desk: '#a0845c',
          deskTop: '#c4a97d',
          carpet: '#6b8f71',
          rug: '#9b4d4d',
          screen: '#1a1c2c',
          screenGlow: '#41a6f6',
          plant: '#38b764',
          chair: '#3a3a5c',
          sofa: '#b13e53',
          whiteboard: '#f4f4f4',
          coffee: '#5d275d',
        },
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        'blink': {
          '0%, 90%, 100%': { opacity: '1' },
          '95%': { opacity: '0' },
        },
        'typing': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'breathe': {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.02)' },
        },
        'slideUp': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'blink': 'blink 4s ease-in-out infinite',
        'typing': 'typing 0.8s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
