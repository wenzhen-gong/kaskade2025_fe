import React, { useEffect, useRef } from 'react';
import store from '../../../redux/store';
import { useSelector } from 'react-redux';
import {
  setValidUserInput,
  setRunTabData,
  runTest,
  resetRunTabConfig
} from '../../../redux/dataSlice';
import { useParams } from 'react-router-dom';
import { Box, TextField, Button, Stack, Typography } from '@mui/material';
import { RootState } from '../../../redux/store';

interface RunTabProps {
  setCurrentTab?: (tab: number) => void;
}

const RunTab: React.FC<RunTabProps> = () => {
  const urlParams = useParams();
  const sessionId = urlParams.id || 'default session';

  const user = useSelector((state: RootState) => state.user);
  const runTabConfig = useSelector((state: RootState) => state.runTabConfig);
  const validUserInput = useSelector((state: RootState) => state.validUserInput);
  const prevSessionIdRef = useRef<string>(sessionId);

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
    if (inputName === 'URL') {
      config[inputName] = inputValue as string;
    } else {
      config[inputName] = Number(inputValue);
    }
    store.dispatch(setRunTabData(config));
  };

  const validateUserInput = (): void => {
    // 校验 URL
    if (
      typeof runTabConfig.URL !== 'string' ||
      !/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(runTabConfig.URL)
    ) {
      store.dispatch(
        setValidUserInput({
          valid: false,
          flag: !validUserInput.flag,
          error: 'URL must be a valid string URL'
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
    <Box display={'flex'}>
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
          label="URL"
          variant="outlined"
          value={runTabConfig.URL || ''}
          onChange={(e) => {
            handleInputChange('URL', e.target.value);
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
    </Box>
  );
};

export default RunTab;
