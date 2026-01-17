import React, { useState, useEffect } from 'react';
import store from '../../../redux/store';
import { useSelector } from 'react-redux';
import {
  setValidUserInput,
  setRunTabData,
  setHeaders,
  setParams,
  runTest,
  resetRunTabConfig,
  setContentType
} from '../../../redux/dataSlice';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Stack,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  OutlinedInput,
  Typography,
  Grid
} from '@mui/material';
import { RootState } from '../../../redux/store';
import { Header, Param, RunTabConfig, ValidUserInput } from '../../../model';

interface RunTabProps {
  setCurrentTab?: (tab: number) => void;
}
const RunTab: React.FC<RunTabProps> = (props) => {
  const user = useSelector((state: RootState) => state.user);

  // const navigate = useNavigate();
  const urlParams = useParams();
  const sessionId = urlParams.id || 'default session';

  // const user = useSelector((state: RootState) => state.user);
  const runTabConfig = useSelector((state: RootState) => state.runTabConfig);
  const validUserInput = useSelector((state: RootState) => state.validUserInput);
  const headers = useSelector((state: RootState) => state.headers);
  const params = useSelector((state: RootState) => state.params);
  const contentType = useSelector((state: RootState) => state.contentType);
  useEffect(() => {
    return () => {
      // console.log('Resetting runTabConfig and validUserInput');
      store.dispatch(resetRunTabConfig());
    };
  }, []);

  useEffect(() => {
    // console.log('Checking if user input is valid');
    if (validUserInput.valid) {
      store.dispatch(runTest(sessionId));
    }
  }, [validUserInput.valid, validUserInput.flag, sessionId]);

  // console.log('upon rendering, headers is: ', headers, headers.length);

  // use setRunTabData reducer to manage runTabConfig state centrally
  const handleInputChange = (inputName: string, inputValue: string | number): void => {
    const config = { ...runTabConfig };
    if (inputName === 'httpMethod' || inputName === 'reqBody') {
      config[inputName] = inputValue;
    } else if (inputName === 'URL') {
      config[inputName] = inputValue;
      if (inputValue.indexOf('?') !== -1) {
        const paramsList = inputValue.substring(inputValue.indexOf('?') + 1).split('&');
        const stateParam = [];
        paramsList.forEach((param) => {
          if (param.indexOf('=') !== -1) {
            stateParam.push({
              key: param.substring(0, param.indexOf('=')),
              value: param.substring(param.indexOf('=') + 1)
            });
          } else {
            stateParam.push({ key: param, value: '' });
          }
        });
        store.dispatch(setParams(stateParam));
      } else {
        store.dispatch(setParams([]));
      }
    } else {
      config[inputName] = Number(inputValue);
    }
    store.dispatch(setRunTabData(config));
  };

  const handleHeaderChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Header,
    index: number
  ): void => {
    const updated = [...headers];
    updated[index] = { ...updated[index], [field]: e.target.value };
    store.dispatch(setHeaders(updated));
  };

  const handleAddHeader = (): void => {
    store.dispatch(setHeaders([...headers, { key: '', value: '' }]));
  };

  const handleRemoveHeader = (index: number): void => {
    console.log('removing index: ', index);
    store.dispatch(setHeaders(headers.filter((_, i) => i !== index)));
  };
  const updatedURL = (updated) => {
    let suffix = '?';
    updated.forEach((param) => {
      const value =
        param.value.indexOf('&') === -1
          ? param.value
          : param.value.slice(0, param.value.indexOf('&')) +
            '%26' +
            param.value.slice(param.value.indexOf('&') + 1, param.value.length);
      suffix += param.key + '=' + value + '&';
    });
    let updatedURL = runTabConfig.URL;
    updatedURL =
      updatedURL.indexOf('?') === -1
        ? updatedURL + suffix.slice(0, suffix.length - 1)
        : updatedURL.slice(0, updatedURL.indexOf('?')) + suffix.slice(0, suffix.length - 1);
    const updatedRunTabConfig = { ...runTabConfig };
    updatedRunTabConfig['URL'] = updatedURL;
    store.dispatch(setRunTabData(updatedRunTabConfig));
  };

  const handleParamChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Param,
    index: number
  ): void => {
    const updated = [...params];
    updated[index] = { ...updated[index], [field]: e.target.value };
    store.dispatch(setParams(updated));
    updatedURL(updated);
  };

  const handleAddParam = (): void => {
    store.dispatch(setParams([...params, { key: '', value: '' }]));
  };

  const handleRemoveParam = (index: number): void => {
    const updated = params.filter((_, i) => i !== index);
    store.dispatch(setParams(updated));
    updatedURL(updated);
  };

  const validateUserInput = (): void => {
    // 校验 httpMethod
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
    if (
      typeof runTabConfig.httpMethod !== 'string' ||
      !allowedMethods.includes(runTabConfig.httpMethod.toUpperCase())
    ) {
      store.dispatch(
        setValidUserInput({
          valid: false,
          flag: !validUserInput.flag,
          error: 'httpMethod must be one of GET, POST, PUT, DELETE'
        })
      );
      return;
    }

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
      if (!Number.isInteger(runTabConfig[field]) || runTabConfig[field] <= 0) {
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

    // // 校验 user
    // if (!user) {
    //   store.dispatch(
    //     setValidUserInput({
    //       valid: false,
    //       flag: !validUserInput.flag,
    //       error: 'Please log in first.'
    //     })
    //   );
    //   return;
    // }

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
          width: '300px', // 统一宽度
          marginLeft: '20px' // ⬅️ 靠左，距离左边 20px
        }}
      >
        <FormControl fullWidth variant="outlined">
          <InputLabel id="method-label">HTTP Method</InputLabel>
          <Select
            labelId="method-label"
            value={runTabConfig.httpMethod || ''}
            onChange={(e) => {
              handleInputChange('httpMethod', e.target.value);
            }}
            input={<OutlinedInput label="HTTP Method" />}
          >
            <MenuItem value="GET">GET</MenuItem>
            <MenuItem value="POST">POST</MenuItem>
            <MenuItem value="PUT">PUT</MenuItem>
            <MenuItem value="DELETE">DELETE</MenuItem>
          </Select>
        </FormControl>
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
          {user ? (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                validateUserInput();
                console.log('after clicking: ', validUserInput.valid);
              }}
            >
              Save
            </Button>
          ) : (
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
          )}
          {/* <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              navigate('/result/' + sessionId + '/' + 1660926192826);
            }}
          >
            Result
          </Button> */}
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
        component="form"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '300px', // 统一宽度
          marginLeft: '20px' // ⬅️ 靠左，距离左边 20px
        }}
      >
        <TextField
          label="Request Body"
          variant="outlined"
          value={runTabConfig.reqBody || ''}
          onChange={(e) => {
            handleInputChange('reqBody', e.target.value);
          }}
          fullWidth
        />
        <Typography variant="h6" sx={{ marginTop: 2 }}>
          Headers
        </Typography>
        <Box
          sx={{
            maxHeight: 200, // 限制最大高度
            overflowY: 'auto', // 超过时出现垂直滚动条
            pr: 1 // 给滚动条留点内边距，不会挡住输入框
          }}
        >
          {headers.map((header, index) => (
            <Grid container spacing={2} key={index} sx={{ marginBottom: 1 }}>
              <Grid item xs={6}>
                <TextField
                  label="Key"
                  variant="outlined"
                  fullWidth
                  value={header.key}
                  // data-index={index}
                  onChange={(e) => handleHeaderChange(e, 'key', index)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Value"
                  variant="outlined"
                  fullWidth
                  value={header.value}
                  // data-index={index}
                  onChange={(e) => handleHeaderChange(e, 'value', index)}
                />
              </Grid>
              <Button variant="outlined" onClick={() => handleRemoveHeader(index)}>
                - Remove Header
              </Button>
            </Grid>
          ))}
        </Box>
        <Button variant="outlined" onClick={handleAddHeader}>
          + Add Header
        </Button>

        <Typography variant="h6" sx={{ marginTop: 2 }}>
          Parameters
        </Typography>
        <Box
          sx={{
            maxHeight: 200,
            overflowY: 'auto',
            pr: 1
          }}
        >
          {params.map((param, index) => (
            <Grid container spacing={2} key={index} sx={{ marginBottom: 1 }}>
              <Grid item xs={6}>
                <TextField
                  label="Key"
                  variant="outlined"
                  fullWidth
                  value={param.key}
                  // data-index={index}
                  onChange={(e) => handleParamChange(e, 'key', index)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Value"
                  variant="outlined"
                  fullWidth
                  value={param.value}
                  // data-index={index}
                  onChange={(e) => handleParamChange(e, 'value', index)}
                />
              </Grid>
              <Button variant="outlined" onClick={() => handleRemoveParam(index)}>
                - Remove A Param
              </Button>
            </Grid>
          ))}
        </Box>

        <Button variant="outlined" onClick={handleAddParam}>
          + Add A Parameter
        </Button>
      </Box>
      <Box
        component="form"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '300px', // 统一宽度
          marginLeft: '20px' // ⬅️ 靠左，距离左边 20px
        }}
      >
        <FormControl fullWidth variant="outlined">
          <InputLabel id="content-type-label">Content Type</InputLabel>
          <Select
            labelId="content-type-label"
            value={
              contentType === 'application/json'
                ? 'JSON'
                : contentType === 'text/plain'
                  ? 'Text'
                  : ''
            }
            onChange={(e) => {
              if (e.target.value === 'JSON') {
                store.dispatch(setContentType('application/json'));
              } else if (e.target.value === 'Text') {
                store.dispatch(setContentType('text/plain'));
              }
            }}
            input={<OutlinedInput label="Content Type" />}
          >
            <MenuItem value="JSON">JSON</MenuItem>
            <MenuItem value="Text">Text</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
};

export default RunTab;
