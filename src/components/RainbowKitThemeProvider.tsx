import { ReactNode } from 'react';
import { RainbowKitProvider, type Locale } from '@rainbow-me/rainbowkit';
import useConfig from 'hooks/useConfig';
import { getRainbowKitTheme } from 'themes/rainbowkit-theme';

interface RainbowKitThemeProviderProps {
  children: ReactNode;
}

// RainbowKit ships its own translations; this maps the app locale onto them so the
// wallet button and connect modal follow the language picked in the header.
const RAINBOWKIT_LOCALES: Record<string, Locale> = {
  en: 'en-US',
  zh: 'zh-CN'
};

const RainbowKitThemeProvider = ({ children }: RainbowKitThemeProviderProps) => {
  const { mode, i18n } = useConfig();

  const customTheme = getRainbowKitTheme(mode);

  return (
    <RainbowKitProvider theme={customTheme} modalSize="compact" locale={RAINBOWKIT_LOCALES[i18n] ?? 'en-US'}>
      {children}
    </RainbowKitProvider>
  );
};

export default RainbowKitThemeProvider;
