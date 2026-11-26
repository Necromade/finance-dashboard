import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = { initialColorMode: 'dark', useSystemColorMode: false };
const theme = extendTheme({
  config,
  styles: { global: (props: { colorMode: string }) => ({
    'html, body, #root': { minHeight: '100%' },
    body: { bg: props.colorMode === 'dark' ? '#0b1220' : '#f3f6fa', color: props.colorMode === 'dark' ? '#e6edf7' : '#182436', fontFeatureSettings: '"ss01" on, "cv11" on' },
    '::selection': { bg: '#14b8d4', color: '#06121a' },
  }) },
  semanticTokens: {
    colors: {
      app: {
        canvas: { default: '#f3f6fa', _dark: '#0b1220' },
        surface: { default: '#ffffff', _dark: '#111c2d' },
        surfaceRaised: { default: '#f8fafc', _dark: '#162338' },
        border: { default: '#e2e8f0', _dark: '#25344a' },
        text: { default: '#182436', _dark: '#e6edf7' },
        muted: { default: '#718096', _dark: '#91a1b8' },
      },
    },
  },
  components: {
    Button: { defaultProps: { colorScheme: 'brand' }, baseStyle: { fontWeight: 600, borderRadius: 'lg', transition: 'all .18s ease', _hover: { transform: 'translateY(-1px)' } } },
    Input: { defaultProps: { focusBorderColor: 'brand.400' }, variants: { outline: { field: { borderRadius: 'lg', _dark: { bg: '#0e1828', borderColor: '#2a3b53' } } } } },
    Select: { defaultProps: { focusBorderColor: 'brand.400' }, variants: { outline: { field: { borderRadius: 'lg', _dark: { bg: '#0e1828', borderColor: '#2a3b53' } } } } },
    Textarea: { defaultProps: { focusBorderColor: 'brand.400' }, variants: { outline: { _dark: { bg: '#0e1828', borderColor: '#2a3b53' } } } },
    Progress: { defaultProps: { colorScheme: 'brand' } }, Checkbox: { defaultProps: { colorScheme: 'brand' } },
    Table: { variants: { simple: { th: { letterSpacing: '.08em', fontSize: 'xs', textTransform: 'uppercase', _dark: { borderColor: '#25344a', color: '#91a1b8' } }, td: { _dark: { borderColor: '#1d2b3e' } } } } },
    Modal: { baseStyle: { dialog: { _dark: { bg: '#111c2d', border: '1px solid #25344a' } } } },
  },
  colors: {
    brand: { 50: '#e6fbff', 100: '#c4f4fc', 200: '#8ce8f7', 300: '#51d8ee', 400: '#22c7e2', 500: '#08b4d2', 600: '#0791ae', 700: '#0b7189', 800: '#105b6d', 900: '#124b59' },
    income: { 400: '#34d399', 500: '#10b981', 600: '#059669' },
    expense: { 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48' },
  },
  fonts: { heading: 'Manrope, sans-serif', body: 'DM Sans, sans-serif' },
  shadows: { outline: '0 0 0 3px rgba(8,180,210,.35)', soft: '0 12px 32px rgba(2,8,23,.16)' },
  radii: { button: 'lg' },
});
export default theme;
