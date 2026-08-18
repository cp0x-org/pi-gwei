import React, { useState, useEffect } from 'react';

// third party
import { IntlProvider, MessageFormatElement } from 'react-intl';
import useConfig from 'hooks/useConfig';

// types
import { I18n } from 'types/config';

// English is the base locale: it is merged under every other locale so a key that has
// not been translated yet falls back to its English text instead of showing the key id.
import enMessages from 'utils/locales/en.json';

// load locales files
function loadLocaleData(i18n: I18n) {
  switch (i18n) {
    case 'fr':
      return import('utils/locales/fr.json');
    case 'ro':
      return import('utils/locales/ro.json');
    case 'zh':
      return import('utils/locales/zh.json');
    default:
      return import('utils/locales/en.json');
  }
}

// ==============================|| LOCALIZATION ||============================== //

interface LocalsProps {
  children: React.ReactNode;
}

export default function Locales({ children }: LocalsProps) {
  const { i18n } = useConfig();
  const [messages, setMessages] = useState<Record<string, string> | Record<string, MessageFormatElement[]> | undefined>();

  useEffect(() => {
    loadLocaleData(i18n).then((d: { default: Record<string, string> | Record<string, MessageFormatElement[]> | undefined }) => {
      setMessages({ ...(enMessages as Record<string, string>), ...(d.default as Record<string, string>) });
    });
  }, [i18n]);

  // Keep the document language in sync so assistive tech announces the page correctly.
  useEffect(() => {
    document.documentElement.lang = i18n;
  }, [i18n]);

  return (
    <>
      {messages && (
        <IntlProvider locale={i18n} defaultLocale="en" messages={messages}>
          {children}
        </IntlProvider>
      )}
    </>
  );
}
