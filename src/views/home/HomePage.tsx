import { useMemo, useState, type ComponentProps, type FormEvent, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

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

// A status is stored as a translation id (formatted at render time, so it follows the
// language switcher) or as raw text when it comes from outside the app — viem error
// messages are produced by the library and have no translation of ours.
type StatusMessage = { id: string; values?: Record<string, string> } | { text: string };

type Status =
  | { kind: 'idle' }
  | { kind: 'working'; message: StatusMessage }
  // `field: 'name'` marks errors caused by what was typed in the name input, so the
  // input can be flagged with aria-invalid instead of every unrelated failure.
  | { kind: 'error'; message: StatusMessage; field?: 'name' }
  | { kind: 'success'; message: StatusMessage; txHash: `0x${string}` };

// Ids used to wire controls to their status/description in the accessibility tree.
const NAME_INPUT_ID = 'mint-name-input';
const MINT_STATUS_ID = 'mint-status';
const ABOUT_HEADING_ID = 'about-gwei-heading';

/** 0x1234…abcd — used in accessible names so each transaction link is distinguishable. */
const shortenHash = (hash: string) => `${hash.slice(0, 6)}…${hash.slice(-4)}`;

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

// Example name used by the explainer copy. A literal (not the runtime parent name),
// exactly as it was written in the original copy.
const EXAMPLE_NAME = '<yourname>.cp0x.gwei';

const bold = (chunks: ReactNode[]) => <strong>{chunks}</strong>;
const code = (chunks: ReactNode[]) => <code>{chunks}</code>;
const externalLink = (href: string) => (chunks: ReactNode[]) => (
  <Link href={href} target="_blank" rel="noopener noreferrer">
    {chunks}
  </Link>
);

// The "About" section. The copy lives in the locale files (`home.faq.*`); only the
// rich-text tags used by each message stay here.
type FaqItem = { key: string; values: ComponentProps<typeof FormattedMessage>['values'] };

const FAQ_ITEMS: FaqItem[] = [
  {
    key: 'what',
    values: { b: bold, a: externalLink('https://github.com/z0r0z/wei-names') }
  },
  {
    key: 'why',
    values: { code }
  },
  {
    key: 'cost',
    values: { b: bold, code, example: EXAMPLE_NAME }
  }
];

// ==============================|| HOME PAGE ||============================== //

export default function HomePage() {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const intl = useIntl();
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

    const fullName = `${label}.${appConfig.parentName}`;

    if (!label) {
      setStatus({ kind: 'error', message: { id: 'home.status.enter-name' }, field: 'name' });
      return;
    }
    if (!isConnected || !address) {
      setStatus({ kind: 'error', message: { id: 'home.status.connect-wallet' } });
      return;
    }
    if (!publicClient) {
      setStatus({ kind: 'error', message: { id: 'home.status.rpc-not-ready' } });
      return;
    }

    try {
      // 1) Check availability on NameNFT: isAvailable(label, parentId)
      setStatus({ kind: 'working', message: { id: 'home.status.checking', values: { name: fullName } } });
      const available = (await publicClient.readContract({
        address: appConfig.nameNFTAddress,
        abi: NAME_NFT_ABI,
        functionName: 'isAvailable',
        args: [label, parentId]
      })) as boolean;

      if (!available) {
        setStatus({ kind: 'error', message: { id: 'home.status.not-available', values: { name: fullName } }, field: 'name' });
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
        setStatus({ kind: 'error', message: { id: 'home.status.registration-disabled' } });
        return;
      }
      const feeValue = isAddressEqual(feeToken, zeroAddress) ? price : 0n;

      // 3) Register the subdomain: register(parentId, label)
      setStatus({ kind: 'working', message: { id: 'home.status.submitting', values: { name: fullName } } });
      const txHash = await writeContractAsync({
        address: appConfig.subdomainRegistrarAddress,
        abi: SUBDOMAIN_REGISTRAR_ABI,
        functionName: 'register',
        args: [parentId, label],
        value: feeValue
      });

      setStatus({ kind: 'working', message: { id: 'home.status.waiting' } });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status === 'success') {
        setStatus({
          kind: 'success',
          message: { id: 'home.status.minted', values: { name: fullName } },
          txHash
        });
        setValue('');
      } else {
        setStatus({ kind: 'error', message: { id: 'home.status.reverted' } });
      }
    } catch (err) {
      const message: StatusMessage =
        err instanceof Error
          ? // viem errors expose a concise `shortMessage`
            { text: (err as { shortMessage?: string }).shortMessage ?? err.message }
          : { id: 'home.status.unknown-error' };
      setStatus({ kind: 'error', message });
    }
  };

  // Native form submission keeps Enter-in-the-input and the submit button on the
  // same code path (previously an onKeyDown handler duplicated the click handler).
  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit();
  };

  // The rendered status is the single description shared by the input and the submit
  // button, so both expose the current mint state (working / error / success).
  const statusDescribedBy = status.kind === 'idle' ? undefined : MINT_STATUS_ID;

  const formatStatus = (message: StatusMessage) =>
    'text' in message ? message.text : intl.formatMessage({ id: message.id }, message.values);

  return (
    <Stack spacing={{ xs: 6, md: 8 }} sx={{ width: '100%', alignItems: 'center' }}>
      <Stack
        component="form"
        onSubmit={handleFormSubmit}
        aria-label={intl.formatMessage({ id: 'home.form.label' }, { parent: appConfig.parentName })}
        aria-busy={working}
        spacing={2}
        sx={{ width: '100%', maxWidth: 480, alignItems: 'center' }}
      >
        <Box sx={{ width: '100%' }}>
          <Box component="h1" className="visually-hidden">
            <FormattedMessage id="home.heading" values={{ parent: appConfig.parentName }} />
          </Box>
          <Box
            component="img"
            src={subdomainsImage}
            alt={intl.formatMessage({ id: 'home.image.alt' }, { parent: appConfig.parentName })}
            sx={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </Box>

        <TextField
          fullWidth
          id={NAME_INPUT_ID}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={intl.formatMessage({ id: 'home.input.placeholder' })}
          disabled={working}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="body2" color="text.secondary">
                    .{appConfig.parentName}
                  </Typography>
                </InputAdornment>
              )
            },
            htmlInput: {
              'aria-label': intl.formatMessage({ id: 'home.input.label' }, { parent: appConfig.parentName }),
              'aria-describedby': statusDescribedBy,
              'aria-invalid': status.kind === 'error' && status.field === 'name' ? true : undefined
            }
          }}
        />

        <Button
          fullWidth
          type="submit"
          variant="contained"
          disabled={working}
          aria-describedby={statusDescribedBy}
          startIcon={working ? <CircularProgress size={18} color="inherit" aria-hidden="true" /> : undefined}
        >
          <FormattedMessage id={working ? 'home.submit.working' : 'home.submit'} />
        </Button>

        {status.kind === 'working' && (
          <Alert id={MINT_STATUS_ID} role="status" severity="info" sx={{ width: '100%' }}>
            {formatStatus(status.message)}
          </Alert>
        )}
        {status.kind === 'error' && (
          <Alert id={MINT_STATUS_ID} role="alert" severity="error" sx={{ width: '100%' }}>
            {formatStatus(status.message)}
          </Alert>
        )}
        {status.kind === 'success' && (
          <Alert id={MINT_STATUS_ID} role="status" severity="success" sx={{ width: '100%' }}>
            {formatStatus(status.message)}{' '}
            <a
              href={`https://etherscan.io/tx/${status.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={intl.formatMessage({ id: 'home.tx.view.label' }, { hash: shortenHash(status.txHash) })}
            >
              <FormattedMessage id="home.tx.view" />
            </a>
          </Alert>
        )}
      </Stack>

      {/* About / FAQ — explains what .gwei names are and why this exists. */}
      <Box component="section" aria-labelledby={ABOUT_HEADING_ID} sx={{ width: '100%', maxWidth: 720 }}>
        <Box component="h2" id={ABOUT_HEADING_ID} className="visually-hidden">
          <FormattedMessage id="home.about.heading" />
        </Box>
        <Divider sx={{ mb: { xs: 4, md: 5 } }} />
        <Typography color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
          <FormattedMessage
            id="home.about.intro"
            values={{
              b: bold,
              a1: externalLink('https://gwei.domains'),
              a2: externalLink('https://x.com/donnoh_eth'),
              example: EXAMPLE_NAME
            }}
          />
        </Typography>

        {FAQ_ITEMS.map((item, index) => (
          <Accordion
            key={item.key}
            disableGutters
            defaultExpanded={index === 0}
            sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}
          >
            {/* The ids let MUI wire the panel to its trigger (aria-controls / aria-labelledby),
                so the answer is exposed as a region named after its question. */}
            <AccordionSummary id={`faq-${index}-header`} aria-controls={`faq-${index}-content`} expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>
                <FormattedMessage id={`home.faq.${item.key}.question`} />
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography component="div" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                <FormattedMessage id={`home.faq.${item.key}.answer`} values={item.values} />
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}

        <Typography color="text.secondary" sx={{ mt: 4 }}>
          <FormattedMessage
            id="home.source"
            values={{
              a1: externalLink('https://github.com/lucadonnoh/gwei-names'),
              a2: externalLink('https://github.com/cp0x-org')
            }}
          />
        </Typography>
      </Box>
    </Stack>
  );
}
