import { useMemo, useState } from 'react';

// web3
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { type Abi, type Address, isAddressEqual, zeroAddress } from 'viem';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

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
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
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
    </Box>
  );
}
