import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Chip
} from '@mui/material';
import Paper from '@mui/material/Paper';
import { ResultMetadata, Result } from '../../../model';
import { setResult } from '../../../redux/dataSlice';

interface HistoryTabProps {
  setCurrentTab?: (tab: number) => void;
  currentTab?: number;
}

// Color thresholds for metrics
const SUCCESS_RATIO_THRESHOLDS = {
  EXCELLENT: 98, // >= 98%: green
  GOOD: 95, // >= 95%: blue
  WARNING: 80 // >= 80%: yellow, < 80%: red
};

const P50_LATENCY_THRESHOLDS = {
  EXCELLENT: 100, // <= 100ms: green
  GOOD: 200, // <= 200ms: blue
  WARNING: 500 // <= 500ms: yellow, > 500ms: red
};

const P95_LATENCY_THRESHOLDS = {
  EXCELLENT: 500, // <= 500ms: green
  GOOD: 1000, // <= 1000ms: blue
  WARNING: 2000 // <= 2000ms: yellow, > 2000ms: red
};

// Helper functions to get chip color based on value
const getSuccessRatioColor = (
  value: number
): 'success' | 'primary' | 'warning' | 'error' | 'default' => {
  if (value < 0) return 'default';
  if (value >= SUCCESS_RATIO_THRESHOLDS.EXCELLENT) return 'success';
  if (value >= SUCCESS_RATIO_THRESHOLDS.GOOD) return 'primary';
  if (value >= SUCCESS_RATIO_THRESHOLDS.WARNING) return 'warning';
  return 'error';
};

const getP50LatencyColor = (
  value: number
): 'success' | 'primary' | 'warning' | 'error' | 'default' => {
  if (value < 0) return 'default';
  if (value <= P50_LATENCY_THRESHOLDS.EXCELLENT) return 'success';
  if (value <= P50_LATENCY_THRESHOLDS.GOOD) return 'primary';
  if (value <= P50_LATENCY_THRESHOLDS.WARNING) return 'warning';
  return 'error';
};

const getP95LatencyColor = (
  value: number
): 'success' | 'primary' | 'warning' | 'error' | 'default' => {
  if (value < 0) return 'default';
  if (value <= P95_LATENCY_THRESHOLDS.EXCELLENT) return 'success';
  if (value <= P95_LATENCY_THRESHOLDS.GOOD) return 'primary';
  if (value <= P95_LATENCY_THRESHOLDS.WARNING) return 'warning';
  return 'error';
};

const HistoryTab: React.FC<HistoryTabProps> = ({ setCurrentTab, currentTab }) => {
  const params = useParams();
  const sessionId = params.id;
  const dispatch = useDispatch();
  const [results, setResults] = useState<ResultMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (): Promise<void> => {
    if (!sessionId) {
      setError('Session ID not found');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const limit = 20; // Show last 20 results
      const response = await fetch(
        `http://localhost:8080/benchmarkresult?sessionId=${sessionId}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch benchmark history');
      }

      const data: ResultMetadata[] = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Fetch history when component mounts or when switching to History tab (index 4)
  useEffect(() => {
    if (currentTab === 4) {
      fetchHistory();
    }
  }, [currentTab, fetchHistory]);

  const handleRowClick = async (resultId: number): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:8080/benchmarkresult/${resultId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch benchmark result details');
      }

      const data = await response.json();

      // Parse the JSON fields (result and config are stored as JSON strings)
      const result: Result =
        typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      const resultMetadata: ResultMetadata = {
        id: data.id,
        timestamp: data.timestamp,
        sessionId: data.session_id,
        version: data.version,
        successRatio: data.success_ratio,
        p50Latency: data.p50_latency,
        p95Latency: data.p95_latency,
        throughput: data.throughput
      };

      // Update Redux state
      dispatch(setResult({ result, resultMetadata }));

      // Switch to Result tab (index 3)
      if (setCurrentTab) {
        setCurrentTab(3);
      }
    } catch (err) {
      console.error('Error fetching benchmark result:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Benchmark History
      </Typography>
      <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>ID</strong>
              </TableCell>
              <TableCell>
                <strong>Timestamp</strong>
              </TableCell>
              <TableCell>
                <strong>Version</strong>
              </TableCell>
              <TableCell sx={{ padding: '8px 6px' }}>
                <strong>Success Ratio</strong>
              </TableCell>
              <TableCell sx={{ padding: '8px 6px' }}>
                <strong>P50 Latency</strong>
              </TableCell>
              <TableCell sx={{ padding: '8px 6px' }}>
                <strong>P95 Latency</strong>
              </TableCell>
              <TableCell sx={{ padding: '8px 6px' }}>
                <strong>Throughput</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No benchmark results found for this session.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              results.map((result) => (
                <TableRow
                  key={result.id}
                  hover
                  onClick={() => handleRowClick(result.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{result.id}</TableCell>
                  <TableCell>{new Date(result.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{result.version}</TableCell>
                  <TableCell sx={{ padding: '8px 6px' }}>
                    <Chip
                      label={
                        result.successRatio >= 0 ? `${result.successRatio.toFixed(1)}%` : 'N/A'
                      }
                      size="small"
                      color={getSuccessRatioColor(result.successRatio)}
                    />
                  </TableCell>
                  <TableCell sx={{ padding: '8px 6px' }}>
                    <Chip
                      label={result.p50Latency >= 0 ? `${result.p50Latency.toFixed(0)}ms` : 'N/A'}
                      size="small"
                      color={getP50LatencyColor(result.p50Latency)}
                    />
                  </TableCell>
                  <TableCell sx={{ padding: '8px 6px' }}>
                    <Chip
                      label={result.p95Latency >= 0 ? `${result.p95Latency.toFixed(0)}ms` : 'N/A'}
                      size="small"
                      color={getP95LatencyColor(result.p95Latency)}
                    />
                  </TableCell>
                  <TableCell sx={{ padding: '8px 6px' }}>
                    <Chip
                      label={result.throughput >= 0 ? `${result.throughput.toFixed(1)}/s` : 'N/A'}
                      size="small"
                      color="default"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default HistoryTab;
