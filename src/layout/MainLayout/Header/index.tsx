import { useIntl } from 'react-intl';

// web3
import { useAccount } from 'wagmi';

// material-ui
import Box from '@mui/material/Box';

// project imports
import LogoSection from '../LogoSection';
import MenuItems from './MenuItems';
import ConnectButtonCustom from 'components/ConnectButtonCustom';
import LanguageSwitcher from 'components/LanguageSwitcher';

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

export default function Header() {
  const intl = useIntl();

  // The connect button shows the network as an icon only (chainStatus="icon"), so the
  // wallet/network state would otherwise exist purely as pixels. This mirrors it as text
  // for screen readers and automation without rendering anything visible.
  const { isConnected, chain } = useAccount();
  const walletStatus = !isConnected
    ? intl.formatMessage({ id: 'header.wallet.not-connected' })
    : chain
      ? intl.formatMessage({ id: 'header.wallet.connected' }, { network: chain.name })
      : intl.formatMessage({ id: 'header.wallet.unsupported-network' });

  return (
    <>
      {/* logo */}
      <Box sx={{ display: 'flex' }}>
        <LogoSection />
      </Box>

      {/* menu */}
      <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-start' }}>
        <MenuItems />
      </Box>

      {/* header actions: language, then connect wallet */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LanguageSwitcher />

        <Box role="group" aria-label={intl.formatMessage({ id: 'header.wallet' })}>
          <span className="visually-hidden" role="status">
            {walletStatus}
          </span>
          <ConnectButtonCustom chainStatus="icon" showBalance={false} />
        </Box>
      </Box>
    </>
  );
}
