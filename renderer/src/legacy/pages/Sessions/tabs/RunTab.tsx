import React, { useEffect, useRef } from 'react';
import store from '../../../redux/store';
import { useSelector, useDispatch } from 'react-redux';
import {
  setValidUserInput,
  setRunTabData,
  runTest,
  resetRunTabConfig,
  addRequest
} from '../../../redux/dataSlice';
import { useParams } from 'react-router-dom';
import { Box, TextField, Button, Stack, Typography } from '@mui/material';
import { RootState } from '../../../redux/store';
import RequestItem from '../../../sidebars/RequestItem';

interface RunTabProps {
  setCurrentTab?: (tab: number) => void;
}

const RunTab: React.FC<RunTabProps> = () => {
  const urlParams = useParams();
  const sessionId = urlParams.id || 'default session';
  const dispatch = useDispatch();

  const user = useSelector((state: RootState) => state.user);
  const runTabConfig = useSelector((state: RootState) => state.runTabConfig);
  const validUserInput = useSelector((state: RootState) => state.validUserInput);
  const prevSessionIdRef = useRef<string>(sessionId);

  // Get the current session data
  const currentSession = useSelector((state: RootState) => {
    const sessionIdNum = Number(sessionId);
    for (let i = 0; i < state.datafile.length; i++) {
      if (state.datafile[i].sessionId === sessionIdNum) {
        return state.datafile[i];
      }
    }
    return null;
  });

  useEffect(() => {
    return () => {
      // console.log('Resetting runTabConfig and validUserInput');
      store.dispatch(resetRunTabConfig());
    };
  }, []);

  useEffect(() => {
    // If sessionId changed, update the ref and don't trigger runTest
    if (prevSessionIdRef.current !== sessionId) {
      prevSessionIdRef.current = sessionId;
      return;
    }

    // Only trigger runTest if validUserInput.valid is true and sessionId hasn't changed
    if (validUserInput.valid) {
      store.dispatch(runTest(sessionId));
    }
  }, [validUserInput.valid, validUserInput.flag, sessionId]);

  // use setRunTabData reducer to manage runTabConfig state centrally
  const handleInputChange = (inputName: string, inputValue: string | number): void => {
    const config = { ...runTabConfig };
    if (inputName === 'serverUrl') {
      config[inputName] = inputValue as string;
    } else {
      config[inputName] = Number(inputValue);
    }
    store.dispatch(setRunTabData(config));
  };

  const validateUserInput = (): void => {
    // 校验 Server URL
    if (
      typeof runTabConfig.serverUrl !== 'string' ||
      !/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(runTabConfig.serverUrl)
    ) {
      store.dispatch(
        setValidUserInput({
          valid: false,
          flag: !validUserInput.flag,
          error: 'Server URL must be a valid string URL'
        })
      );
      return;
    }
    // 校验必须为正整数的字段
    const positiveIntegerFields = ['testDuration', 'concurrencyNumber', 'totalRequests'];
    for (const field of positiveIntegerFields) {
      const value = runTabConfig[field];
      if (!Number.isInteger(value) || (value as number) <= 0) {
        store.dispatch(
          setValidUserInput({
            valid: false,
            flag: !validUserInput.flag,
            error: `${field} must be a positive integer`
          })
        );
        return;
      }
    }

    // 校验 user
    if (!user) {
      store.dispatch(
        setValidUserInput({
          valid: false,
          flag: !validUserInput.flag,
          error: 'Please log in first.'
        })
      );
      return;
    }

    // 如果所有检查通过
    store.dispatch(
      setValidUserInput({
        valid: true,
        flag: !validUserInput.flag
      })
    );
    return;
  };

  return (
    <Box display={'flex'} gap={4}>
      <Box
        component="form"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '300px',
          marginLeft: '20px'
        }}
      >
        <TextField
          label="Server URL"
          variant="outlined"
          value={runTabConfig.serverUrl || ''}
          onChange={(e) => {
            handleInputChange('serverUrl', e.target.value);
          }}
          fullWidth
        />

        <TextField
          label="Test Duration"
          type="number"
          variant="outlined"
          value={runTabConfig.testDuration || ''}
          onChange={(e) => {
            handleInputChange('testDuration', e.target.value);
          }}
          fullWidth
        />

        <TextField
          label="Concurrency Number"
          type="number"
          variant="outlined"
          value={runTabConfig.concurrencyNumber || ''}
          onChange={(e) => {
            handleInputChange('concurrencyNumber', e.target.value);
          }}
          fullWidth
        />

        <TextField
          label="Total Requests"
          type="number"
          variant="outlined"
          value={runTabConfig.totalRequests || ''}
          onChange={(e) => {
            handleInputChange('totalRequests', e.target.value);
          }}
          fullWidth
        />
        <Stack direction="row" spacing={2} sx={{ marginTop: 2 }} justifyContent="flex-start">
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              validateUserInput();
              console.log('after clicking: ', validUserInput.valid);
            }}
          >
            Run
          </Button>
        </Stack>
        {validUserInput.error && (
          <Typography
            variant="body2"
            sx={{ color: 'error.main', marginTop: 1, marginLeft: '20px' }}
          >
            {validUserInput.error}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '400px',
          marginLeft: '20px',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          padding: 2
        }}
      >
        <Typography variant="h6" sx={{ marginBottom: 2 }}>
          Requests in this session
        </Typography>
        {currentSession && currentSession.requests.length > 0 ? (
          currentSession.requests.map((request) => (
            <RequestItem
              key={request.requestId}
              request={request}
              sessionId={currentSession.sessionId}
              requestId={request.requestId}
            />
          ))
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary', marginTop: 2 }}>
            No requests in this session
          </Typography>
        )}
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            if (currentSession) {
              dispatch(addRequest({ sessionId: currentSession.sessionId }));
            }
          }}
          sx={{ marginTop: 2 }}
        >
          Add Request
        </Button>
      </Box>
    </Box>
  );
};

export default RunTab;
