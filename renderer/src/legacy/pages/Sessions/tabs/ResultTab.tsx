import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { Result } from '../../../model';
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
  LinearProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface ResultTabProps {
  // Add props if needed
}

const ResultTab: React.FC<ResultTabProps> = () => {
  // Get the result state.
  const result: Result | null = useSelector((state: RootState) => state.result) || null;
  const resultMetadata = useSelector((state: RootState) => state.resultMetadata);

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

  // Convert PercentileTimeMs to sorted array for display
  const percentileEntries = Object.entries(percentileTimeMs)
    .map(([key, value]) => ({ percentile: parseInt(key), timeMs: Number(value) || 0 }))
    .sort((a, b) => a.percentile - b.percentile);

  // Get key percentiles (p50, p75, p90, p95, p99, p100)
  const keyPercentiles = [50, 75, 90, 95, 99, 100];
  const keyPercentileData = keyPercentiles.map((p) => ({
    percentile: p,
    timeMs: Number(percentileTimeMs[p]) || 0
  }));

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
            mb: 3,
            px: 2,
            py: 1.5,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
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
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTimeIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Average Time</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {avgTimeMs.toFixed(2)} ms
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
              {totalRequests > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  {((failures / totalRequests) * 100).toFixed(1)}% failure rate
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ display: 'flex' }}>
          <Card sx={{ flexGrow: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Requests
              </Typography>
              <Typography variant="h4" color="text.primary">
                {totalRequests}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 3,
          flexGrow: 1,
          minHeight: 0
        }}
      >
        {/* Key Percentiles */}
        <Box sx={{ display: 'flex', minHeight: 0 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <CardContent
              sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
            >
              <Typography variant="h6" gutterBottom>
                Key Percentiles
              </Typography>
              <TableContainer sx={{ flexGrow: 1, minHeight: 0 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Percentile</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Response Time (ms)</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {keyPercentileData.map((item) => (
                      <TableRow key={item.percentile}>
                        <TableCell>
                          <Chip
                            label={`P${item.percentile}`}
                            size="small"
                            color={
                              item.percentile >= 99
                                ? 'error'
                                : item.percentile >= 90
                                  ? 'warning'
                                  : 'primary'
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1">{item.timeMs.toFixed(2)} ms</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>

        {/* All Percentiles */}
        <Box sx={{ display: 'flex', minHeight: 0 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <CardContent
              sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
            >
              <Typography variant="h6" gutterBottom>
                All Percentiles
              </Typography>
              <Box
                sx={{
                  flexGrow: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1
                }}
              >
                <TableContainer>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Percentile</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>Time (ms)</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {percentileEntries.map((item) => (
                        <TableRow key={item.percentile} hover>
                          <TableCell>P{item.percentile}</TableCell>
                          <TableCell align="right">{item.timeMs.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default ResultTab;
