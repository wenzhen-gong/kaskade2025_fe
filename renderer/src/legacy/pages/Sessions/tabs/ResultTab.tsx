import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { Result, RequestStats } from '../../../model';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

interface ResultTabProps {
  // Add props if needed
}

const ResultTab: React.FC<ResultTabProps> = () => {
  // Get the result state.
  const result: Result | null = useSelector((state: RootState) => state.result) || null;
  const resultMetadata = useSelector((state: RootState) => state.resultMetadata);
  const requestStats = React.useMemo<RequestStats[]>(
    () => (result?.requestStats ? result.requestStats : []),
    [result]
  );
  const [selectedRequestId, setSelectedRequestId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (requestStats.length === 0) {
      if (selectedRequestId !== null) {
        setSelectedRequestId(null);
      }
      return;
    }
    const requestIds = requestStats.map((stat) => stat.requestId);
    if (selectedRequestId === null || !requestIds.includes(selectedRequestId)) {
      setSelectedRequestId(requestIds[0]);
    }
  }, [requestStats, selectedRequestId]);

  const [sessionMetric, setSessionMetric] = React.useState<'average' | number>('average');
  const [sessionMenuAnchor, setSessionMenuAnchor] = React.useState<null | HTMLElement>(null);
  const sessionMenuOpen = Boolean(sessionMenuAnchor);

  if (!result) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="text.secondary" align="center">
              No result available yet. Please run a test first.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Safely access result properties with defaults
  const avgTimeMs = result.avgTimeMs ?? 0;
  const success = result.success ?? 0;
  const failures = result.failures ?? 0;
  const percentileTimeMs = result.percentileTimeMs || {};

  const totalRequests = success + failures;
  const successRate = totalRequests > 0 ? (success / totalRequests) * 100 : 0;
  const failureRate = totalRequests > 0 ? (failures / totalRequests) * 100 : 0;

  const sessionPercentileOptions = [50, 75, 90, 95, 99, 100];

  const selectedRequestStats = requestStats.find((stat) => stat.requestId === selectedRequestId);

  const requestKeyPercentiles = [50, 75, 90, 95, 99, 100];
  const requestPercentileRows = requestKeyPercentiles.map((percentile) => {
    const value = selectedRequestStats?.percentileTimeMs[percentile];
    return { percentile, value };
  });

  const formatMs = (value: number | undefined): string => {
    if (typeof value !== 'number') {
      return 'N/A';
    }
    return `${value.toFixed(2)} ms`;
  };

  return (
    <Box
      sx={{
        px: 3,
        py: 2,
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {resultMetadata && (
        <Box
          sx={{
            mb: 2,
            px: 1.5,
            py: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            alignItems: 'center',
            borderRadius: 1,
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Result ID:{' '}
            <Typography component="span" variant="subtitle1" sx={{ fontWeight: 600 }}>
              {resultMetadata.id}
            </Typography>
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Timestamp:{' '}
            <Typography component="span" variant="subtitle1" sx={{ fontWeight: 600 }}>
              {new Date(resultMetadata.timestamp).toLocaleString()}
            </Typography>
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflowY: 'auto',
          pr: 1
        }}
      >
        <Typography variant="h6" gutterBottom>
          Session Stats
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
            gap: 3,
            flexShrink: 0
          }}
        >
          {/* Summary Cards */}
          <Box sx={{ display: 'flex' }}>
            <Card sx={{ flexGrow: 1 }}>
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', mb: 1, cursor: 'pointer' }}
                  onClick={(event) => {
                    setSessionMenuAnchor(event.currentTarget);
                  }}
                >
                  <AccessTimeIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                    {sessionMetric === 'average' ? 'Average Time' : `P${sessionMetric} Time`}
                    <ArrowDropDownIcon sx={{ ml: 0.5, color: 'text.secondary' }} />
                  </Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {(sessionMetric === 'average'
                    ? avgTimeMs
                    : Number(percentileTimeMs[sessionMetric]) || 0
                  ).toFixed(2)}{' '}
                  ms
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'flex' }}>
            <Card sx={{ flexGrow: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6">Success</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {success}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={successRate}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  color="success"
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {successRate.toFixed(1)}% success rate
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'flex' }}>
            <Card sx={{ flexGrow: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ErrorIcon sx={{ mr: 1, color: 'error.main' }} />
                  <Typography variant="h6">Failures</Typography>
                </Box>
                <Typography variant="h4" color="error.main">
                  {failures}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={failureRate}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  color="error"
                />
                {totalRequests > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    {failureRate.toFixed(1)}% failure rate
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'flex' }}>
            <Card sx={{ flexGrow: 1 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Sessions
                </Typography>
                <Typography variant="h4" color="text.primary">
                  {totalRequests}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Menu
          anchorEl={sessionMenuAnchor}
          open={sessionMenuOpen}
          onClose={() => setSessionMenuAnchor(null)}
        >
          <MenuItem
            onClick={() => {
              setSessionMetric('average');
              setSessionMenuAnchor(null);
            }}
          >
            <Chip label="AVG" size="small" color="primary" sx={{ mr: 1 }} />
            Average
          </MenuItem>
          {sessionPercentileOptions.map((percentile) => (
            <MenuItem
              key={percentile}
              onClick={() => {
                setSessionMetric(percentile);
                setSessionMenuAnchor(null);
              }}
            >
              <Chip
                label={`P${percentile}`}
                size="small"
                color={percentile >= 99 ? 'error' : percentile >= 90 ? 'warning' : 'primary'}
                sx={{ mr: 1 }}
              />
              {`P${percentile} Time`}
            </MenuItem>
          ))}
        </Menu>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Request Stats
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' },
              gap: 3
            }}
          >
            <Card>
              <CardContent>
                {requestStats.length > 0 ? (
                  <FormControl fullWidth size="small">
                    <InputLabel id="request-select-label">Request</InputLabel>
                    <Select
                      labelId="request-select-label"
                      value={selectedRequestId ?? ''}
                      label="Request"
                      onChange={(event) => {
                        setSelectedRequestId(Number(event.target.value));
                      }}
                    >
                      {requestStats.map((stat) => (
                        <MenuItem key={stat.requestId} value={stat.requestId}>
                          {stat.requestName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No requests available for this session.
                  </Typography>
                )}

                <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Average Time
                    </Typography>
                    <Typography variant="h6">
                      {formatMs(selectedRequestStats?.avgTimeMs)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Success
                    </Typography>
                    <Typography variant="h6">
                      {selectedRequestStats ? selectedRequestStats.success : 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Failures
                    </Typography>
                    <Typography variant="h6">
                      {selectedRequestStats ? selectedRequestStats.failures : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Key Percentile Latency
                </Typography>
                {selectedRequestStats ? (
                  <TableContainer sx={{ maxHeight: 140, overflowY: 'auto' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <strong>Percentile</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>Latency (ms)</strong>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {requestPercentileRows.map((row) => (
                          <TableRow key={row.percentile}>
                            <TableCell>P{row.percentile}</TableCell>
                            <TableCell align="right">
                              {typeof row.value === 'number' ? row.value.toFixed(2) : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No per-request latency stats available for this result.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ResultTab;
