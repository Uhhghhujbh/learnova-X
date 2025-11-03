import tailwindcss from '@tailwindcss/postcss';

export default {
  plugins: {
    'postcss-import': {},
    'postcss-nesting': {},
    '@tailwindcss/postcss': {},
    'postcss-custom-properties': {
      preserve: false
    },
    autoprefixer: {
      flexbox: 'no-2009',
      grid: 'autoplace'
    }
  }
}