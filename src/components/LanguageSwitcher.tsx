import { useIntl } from 'react-intl';

// material-ui
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';

// project imports
import useConfig from 'hooks/useConfig';

// types
import { I18n } from 'types/config';

// Language names are always written in their own language, so they are not translated.
// `short` is what the closed dropdown shows, `label` is what the options show.
const LANGUAGES: { code: I18n; short: string; label: string }[] = [
  { code: 'en', short: 'EN', label: 'English' },
  { code: 'zh', short: '中文', label: '中文' }
];

// ==============================|| LANGUAGE SWITCHER ||============================== //

export default function LanguageSwitcher() {
  const intl = useIntl();
  const { i18n, onChangeLocale } = useConfig();

  // The stored config may hold a locale this switcher does not offer; fall back to English.
  const value = LANGUAGES.some((language) => language.code === i18n) ? i18n : 'en';

  const handleChange = (event: SelectChangeEvent) => {
    onChangeLocale(event.target.value as I18n);
  };

  return (
    <Select
      value={value}
      onChange={handleChange}
      variant="standard"
      disableUnderline
      renderValue={(code) => LANGUAGES.find((language) => language.code === code)?.short}
      inputProps={{ 'aria-label': intl.formatMessage({ id: 'language.select' }) }}
      sx={{
        color: 'text.primary',
        fontWeight: 500,
        fontSize: '15px',
        '& .MuiSelect-select': {
          py: '6px',
          pl: '12px',
          pr: '30px !important',
          borderRadius: '8px',
          '&:focus': { borderRadius: '8px', backgroundColor: 'transparent' }
        },
        '&:hover .MuiSelect-select': {
          backgroundColor: 'primary.light',
          color: 'primary.main'
        },
        '& .MuiSelect-icon': { color: 'text.secondary' }
      }}
    >
      {LANGUAGES.map((language) => (
        <MenuItem key={language.code} value={language.code}>
          {language.label}
        </MenuItem>
      ))}
    </Select>
  );
}
