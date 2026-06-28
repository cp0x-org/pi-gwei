import { useMemo, useState, type ReactNode } from 'react';

// web3
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { type Abi, type Address, isAddressEqual, zeroAddress } from 'viem';

// material-ui
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// project imports
import subdomainsImage from 'assets/images/subdomains.png';
import { getAppConfig } from '@/app-config';
import nameNFTAbi from '@/abi/NameNFT.json';
import subdomainRegistrarAbi from '@/abi/SubdomainRegistrar.json';

const NAME_NFT_ABI = nameNFTAbi as unknown as Abi;
const SUBDOMAIN_REGISTRAR_ABI = subdomainRegistrarAbi as unknown as Abi;

type Status =
  | { kind: 'idle' }
  | { kind: 'working'; message: string }
  | { kind: 'error'; message: string }
  | { kind: 'success'; message: string; txHash: `0x${string}` };

// Registrar.config(parentId) tuple shape
type RegistrarConfig = readonly [
  controller: Address,
  enabled: boolean,
  feeToken: Address,
  price: bigint,
  gateToken: Address,
  minGateBalance: bigint,
  payout: Address
];

// Static explainer content for the "About" section. Plain copy so it stays
// readable in the contract-driven dapp and easy to translate later.
type FaqItem = { question: string; answer: ReactNode };

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What is this?',
    answer: (
      <>
        Ownerless <strong>.gwei</strong> names as NFTs on Ethereum — no owner, no DAO, no treasury anyone can extract. A neutral fork of{' '}
        <Link href="https://github.com/z0r0z/wei-names" target="_blank" rel="noopener noreferrer">
          wei-names
        </Link>{' '}
        with profit and admin control removed.
      </>
    )
  },
  {
    question: 'Why does it exist?',
    answer: (
      <>
        It started when ENS Labs moved to pull its ~$20M treasury and voting power back to the team — a reminder that a DAO can still be
        captured. <code>.gwei</code> shows the alternative: provably neutral public infrastructure, not a product behind closed doors. Fees
        are burned rather than collected, and the rules are frozen in code forever, so no one can change them, capture the value, or shut it
        down.
      </>
    )
  },
  {
    question: 'How much does it cost?',
    answer: (
      <>
        Minting <code>&lt;yourname&gt;.cp0x.gwei</code> here is <strong>free</strong> — just connect your wallet and mine. A top-level{' '}
        <code>.gwei</code> name costs a fixed, burned fee (0.0005 ETH for 5+ chars, more for shorter ones).
      </>
    )
  }
];

// ==============================|| HOME PAGE ||============================== //

export default function HomePage() {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const appConfig = getAppConfig();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const parentId = useMemo(() => BigInt(appConfig.parentId), [appConfig.parentId]);

  // Normalize what the user typed into a bare label:
  // trim, lowercase, and strip a trailing ".<parentName>" or ".gwei" if present.
  const normalizeLabel = (raw: string): string => {
    let label = raw.trim().toLowerCase();
    const suffixes = [`.${appConfig.parentName.toLowerCase()}`, '.gwei'];
    for (const suffix of suffixes) {
      if (label.endsWith(suffix)) {
        label = label.slice(0, -suffix.length);
        break;
      }
    }
    return label;
  };

  const working = status.kind === 'working';

  const handleSubmit = async () => {
    const label = normalizeLabel(value);

    if (!label) {
      setStatus({ kind: 'error', message: 'Enter a name to mine.' });
      return;
    }
    if (!isConnected || !address) {
      setStatus({ kind: 'error', message: 'Connect your wallet first.' });
      return;
    }
    if (!publicClient) {
      setStatus({ kind: 'error', message: 'RPC client is not ready. Try again in a moment.' });
      return;
    }

    try {
      // 1) Check availability on NameNFT: isAvailable(label, parentId)
      setStatus({ kind: 'working', message: `Checking availability of ${label}.${appConfig.parentName}…` });
      const available = (await publicClient.readContract({
        address: appConfig.nameNFTAddress,
        abi: NAME_NFT_ABI,
        functionName: 'isAvailable',
        args: [label, parentId]
      })) as boolean;

      if (!available) {
        setStatus({ kind: 'error', message: `${label}.${appConfig.parentName} is not available.` });
        return;
      }

      // 2) Read the registrar price so we send the correct fee (only ETH fees are paid as value).
      const registrarConfig = (await publicClient.readContract({
        address: appConfig.subdomainRegistrarAddress,
        abi: SUBDOMAIN_REGISTRAR_ABI,
        functionName: 'config',
        args: [parentId]
      })) as RegistrarConfig;

      const [, enabled, feeToken, price] = registrarConfig;
      if (!enabled) {
        setStatus({ kind: 'error', message: 'Registration is not enabled for this parent.' });
        return;
      }
      const feeValue = isAddressEqual(feeToken, zeroAddress) ? price : 0n;

      // 3) Register the subdomain: register(parentId, label)
      setStatus({ kind: 'working', message: `Submitting transaction to mint ${label}.${appConfig.parentName}…` });
      const txHash = await writeContractAsync({
        address: appConfig.subdomainRegistrarAddress,
        abi: SUBDOMAIN_REGISTRAR_ABI,
        functionName: 'register',
        args: [parentId, label],
        value: feeValue
      });

      setStatus({ kind: 'working', message: 'Waiting for confirmation…' });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status === 'success') {
        setStatus({
          kind: 'success',
          message: `${label}.${appConfig.parentName} minted!`,
          txHash
        });
        setValue('');
      } else {
        setStatus({ kind: 'error', message: 'Transaction reverted.' });
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? // viem errors expose a concise `shortMessage`
            ((err as { shortMessage?: string }).shortMessage ?? err.message)
          : 'Something went wrong.';
      setStatus({ kind: 'error', message });
    }
  };

  return (
    <Stack spacing={{ xs: 6, md: 8 }} sx={{ width: '100%', alignItems: 'center' }}>
      <Stack spacing={2} sx={{ width: '100%', maxWidth: 480, alignItems: 'center' }}>
        <Box component="img" src={subdomainsImage} alt="subdomains" sx={{ width: '100%', height: 'auto', display: 'block' }} />

        <TextField
          fullWidth
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="yourname"
          disabled={working}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="body2" color="text.secondary">
                    .{appConfig.parentName}
                  </Typography>
                </InputAdornment>
              )
            }
          }}
        />

        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={working}
          startIcon={working ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {working ? 'Working…' : 'Mine subdomain'}
        </Button>

        {status.kind === 'working' && (
          <Alert severity="info" sx={{ width: '100%' }}>
            {status.message}
          </Alert>
        )}
        {status.kind === 'error' && (
          <Alert severity="error" sx={{ width: '100%' }}>
            {status.message}
          </Alert>
        )}
        {status.kind === 'success' && (
          <Alert severity="success" sx={{ width: '100%' }}>
            {status.message}{' '}
            <a href={`https://etherscan.io/tx/${status.txHash}`} target="_blank" rel="noopener noreferrer">
              View transaction
            </a>
          </Alert>
        )}
      </Stack>

      {/* About / FAQ — explains what .gwei names are and why this exists. */}
      <Box component="section" sx={{ width: '100%', maxWidth: 720 }}>
        <Divider sx={{ mb: { xs: 4, md: 5 } }} />
        <Typography color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
          <strong>.gwei</strong> is an ownerless namespace on Ethereum ({' '}
          <Link href="https://gwei.domains" target="_blank" rel="noopener noreferrer">
            gwei.domains
          </Link>{' '}
          by{' '}
          <Link href="https://x.com/donnoh_eth" target="_blank" rel="noopener noreferrer">
            @donnoh_eth
          </Link>
          ): no owner, no DAO, fees burned instead of collected, rules frozen in code. Mint a free{' '}
          <strong>&lt;yourname&gt;.cp0x.gwei</strong> above.
        </Typography>

        {FAQ_ITEMS.map((item, index) => (
          <Accordion
            key={item.question}
            disableGutters
            defaultExpanded={index === 0}
            sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>{item.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography component="div" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {item.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}

        <Typography color="text.secondary" sx={{ mt: 4 }}>
          Source &amp; diffs:{' '}
          <Link href="https://github.com/lucadonnoh/gwei-names" target="_blank" rel="noopener noreferrer">
            lucadonnoh/gwei-names
          </Link>{' '}
          ·{' '}
          <Link href="https://github.com/cp0x-org" target="_blank" rel="noopener noreferrer">
            cp0x-org
          </Link>
        </Typography>
      </Box>
    </Stack>
  );
}
