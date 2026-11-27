import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = { initialColorMode: 'dark', useSystemColorMode: false };
const emerald = {
  canvas: '#0C1210',
  sidebar: '#101A16',
  surface: '#15211B',
  raised: '#192720',
  border: '#26392F',
  primary: '#10B981',
  secondary: '#6EE7B7',
  text: '#E7EEE9',
  muted: '#95AA9D',
  expense: '#F87185',
};

const theme = extendTheme({
  config,
  styles: {
    global: (props: { colorMode: string }) => {
      const dark = props.colorMode === 'dark';
      return {
        'html, body, #root': { minHeight: '100%' },
        body: {
          bg: dark ? emerald.canvas : '#F3F7F5',
          color: dark ? emerald.text : '#182A22',
          colorScheme: props.colorMode,
          '--chart-tick': dark ? emerald.muted : '#718278',
          fontFeatureSettings: '"ss01" on, "cv11" on',
        },
        '::selection': { bg: emerald.primary, color: '#06130D' },
      };
    },
  },
  semanticTokens: {
    colors: {
      app: {
        canvas: { default: '#F3F7F5', _dark: emerald.canvas },
        sidebar: { default: '#FFFFFF', _dark: emerald.sidebar },
        surface: { default: '#FFFFFF', _dark: emerald.surface },
        surfaceRaised: { default: '#F7FAF8', _dark: emerald.raised },
        border: { default: '#DCE8E0', _dark: emerald.border },
        text: { default: '#182A22', _dark: emerald.text },
        muted: { default: '#718278', _dark: emerald.muted },
      },
    },
  },
  components: {
    Button: {
      defaultProps: { colorScheme: 'brand', variant: 'solid', size: 'md' },
      baseStyle: {
        minH: '44px',
        px: 4,
        fontWeight: 600,
        borderRadius: '10px',
        transition: 'background-color .18s ease, color .18s ease, border-color .18s ease, box-shadow .18s ease',
        _hover: { transform: 'none', _disabled: { transform: 'none' } },
        _active: { transform: 'none' },
        _focusVisible: { boxShadow: `0 0 0 3px rgba(16,185,129,.26)` },
        _disabled: { opacity: 0.48, cursor: 'not-allowed' },
      },
      variants: {
        primary: { bg: emerald.primary, color: '#062017', _hover: { bg: '#0FA775' }, _active: { bg: '#0D966A' } },
        secondary: {
          bg: 'app.surfaceRaised',
          color: 'app.text',
          border: '1px solid',
          borderColor: 'app.border',
          _hover: { bg: 'app.border' },
        },
        outline: {
          border: '1px solid',
          borderColor: 'app.border',
          color: 'app.text',
          bg: 'transparent',
          _hover: { bg: 'app.surfaceRaised', borderColor: 'brand.500' },
          _active: { bg: 'app.surfaceRaised' },
        },
        ghost: { color: 'app.muted', _hover: { color: 'app.text', bg: 'app.surfaceRaised' }, _active: { bg: 'app.border' } },
        danger: { bg: '#F87185', color: '#2B0B11', _hover: { bg: '#FB8B9A' }, _active: { bg: '#E85F74' } },
        icon: { minW: '44px', w: '44px', px: 0, color: 'app.muted', bg: 'transparent', _hover: { color: 'app.text', bg: 'app.surfaceRaised' } },
      },
      sizes: { sm: { minH: '38px', px: 3, fontSize: 'sm' }, md: { minH: '44px', px: 4, fontSize: 'sm' }, lg: { minH: '48px', px: 5, fontSize: 'md' } },
    },
    Input: {
      defaultProps: { focusBorderColor: 'brand.400', variant: 'outline', size: 'md' },
      variants: {
        outline: {
          field: {
            minH: '44px',
            borderRadius: '10px',
            bg: 'app.canvas',
            borderColor: 'app.border',
            _placeholder: { color: 'app.muted', opacity: 0.82 },
            _hover: { borderColor: 'brand.600' },
            _dark: { bg: '#101A16', borderColor: emerald.border },
          },
        },
      },
    },
    Select: {
      defaultProps: { focusBorderColor: 'brand.400', variant: 'outline', size: 'md' },
      variants: {
        outline: {
          field: {
            minH: '44px',
            borderRadius: '10px',
            bg: 'app.canvas',
            borderColor: 'app.border',
            _hover: { borderColor: 'brand.600' },
            _dark: { bg: '#101A16', borderColor: emerald.border },
          },
        },
      },
    },
    Textarea: { defaultProps: { focusBorderColor: 'brand.400' } },
    Progress: { defaultProps: { colorScheme: 'brand' } },
    Checkbox: { defaultProps: { colorScheme: 'brand' } },
    Table: {
      variants: {
        simple: {
          th: { letterSpacing: '.08em', fontSize: 'xs', textTransform: 'uppercase', _dark: { borderColor: emerald.border, color: emerald.muted } },
          td: { _dark: { borderColor: '#202F27' } },
        },
      },
    },
    Modal: { baseStyle: { dialog: { _dark: { bg: emerald.surface, border: `1px solid ${emerald.border}` } } } },
  },
  colors: {
    brand: {
      50: '#E8FFF4', 100: '#C5F7DE', 200: '#90EDC1', 300: emerald.secondary,
      400: '#34D399', 500: emerald.primary, 600: '#0D966A', 700: '#087A58', 800: '#075F46', 900: '#064E3B',
    },
    income: { 400: emerald.secondary, 500: emerald.primary, 600: '#0D966A' },
    expense: { 400: emerald.expense, 500: '#EF596F', 600: '#D9445D' },
  },
  fonts: { heading: 'Manrope, sans-serif', body: 'DM Sans, sans-serif' },
  shadows: { outline: '0 0 0 3px rgba(16,185,129,.26)', soft: '0 12px 28px rgba(0,8,5,.16)' },
  radii: { button: '10px' },
});

export default theme;
