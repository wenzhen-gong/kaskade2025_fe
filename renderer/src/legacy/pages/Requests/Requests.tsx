import React from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateRequest } from '../../redux/dataSlice';
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  OutlinedInput,
  Typography,
  Grid
} from '@mui/material';
import { RootState } from '../../redux/store';
import { Header, Param } from '../../model';
import { Request } from '../../model';

interface RequestsProps {
  // Add props if needed
}

const Requests: React.FC<RequestsProps> = () => {
  const urlParams = useParams();
  const sessionId = urlParams.id ? Number(urlParams.id) : null;
  const requestId = urlParams.requestId ? Number(urlParams.requestId) : null;
  const dispatch = useDispatch();

  const RequestDiv = styled.div`
    padding: 50px;
  `;

  // Get the current request from session.requests array
  const currentRequest = useSelector((state: RootState) => {
    if (!sessionId || !requestId) return null;
    for (const session of state.datafile) {
      if (session.sessionId === sessionId) {
        const found = session.requests.find((r) => r.requestId === requestId);
        return found || null;
      }
    }
    return null;
  });

  // Convert headers and params from Request format to local state format
  const headers: Header[] = currentRequest?.headers || [];
  const params: Param[] = currentRequest?.params || [];
  const contentType = currentRequest?.contentType || null;

  // Helper function to update request in session
  const updateRequestInSession = (updates: Partial<Request>): void => {
    if (!sessionId || !requestId) return;
    dispatch(updateRequest({ sessionId, requestId, updates }));
  };

  const handleInputChange = (inputName: string, inputValue: string | number): void => {
    if (!currentRequest) return;

    if (inputName === 'httpMethod') {
      updateRequestInSession({ method: inputValue as Request['method'] });
    } else if (inputName === 'reqBody') {
      updateRequestInSession({ reqBody: inputValue as string });
    } else if (inputName === 'URL') {
      const urlValue = inputValue as string;
      updateRequestInSession({ url: urlValue });

      // Parse URL parameters
      if (urlValue.indexOf('?') !== -1) {
        const paramsList = urlValue.substring(urlValue.indexOf('?') + 1).split('&');
        const stateParam: Param[] = [];
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
        updateRequestInSession({ params: stateParam });
      } else {
        updateRequestInSession({ params: [] });
      }
    }
  };

  const handleHeaderChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Header,
    index: number
  ): void => {
    const updated = [...headers];
    updated[index] = { ...updated[index], [field]: e.target.value };
    updateRequestInSession({ headers: updated });
  };

  const handleAddHeader = (): void => {
    updateRequestInSession({ headers: [...headers, { key: '', value: '' }] });
  };

  const handleRemoveHeader = (index: number): void => {
    console.log('removing index: ', index);
    updateRequestInSession({ headers: headers.filter((_, i) => i !== index) });
  };

  const updatedURL = (updated: Param[]): void => {
    if (!currentRequest) return;
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
    const baseURL = currentRequest.url || '';
    const urlIndex = baseURL.indexOf('?');
    const updatedURLValue =
      urlIndex === -1
        ? baseURL + suffix.slice(0, suffix.length - 1)
        : baseURL.slice(0, urlIndex) + suffix.slice(0, suffix.length - 1);
    updateRequestInSession({ url: updatedURLValue });
  };

  const handleParamChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Param,
    index: number
  ): void => {
    const updated = [...params];
    updated[index] = { ...updated[index], [field]: e.target.value };
    updateRequestInSession({ params: updated });
    updatedURL(updated);
  };

  const handleAddParam = (): void => {
    updateRequestInSession({ params: [...params, { key: '', value: '' }] });
  };

  const handleRemoveParam = (index: number): void => {
    const updated = params.filter((_, i) => i !== index);
    updateRequestInSession({ params: updated });
    updatedURL(updated);
  };

  if (!currentRequest) {
    return (
      <RequestDiv>
        <p>Request not found</p>
      </RequestDiv>
    );
  }

  return (
    <RequestDiv>
      <p>Request: {currentRequest.requestName}</p>
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
          <FormControl fullWidth variant="outlined">
            <InputLabel id="method-label">HTTP Method</InputLabel>
            <Select
              labelId="method-label"
              value={currentRequest?.method || ''}
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
            value={currentRequest?.url || ''}
            onChange={(e) => {
              handleInputChange('URL', e.target.value);
            }}
            fullWidth
          />
        </Box>
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
            label="Request Body"
            variant="outlined"
            value={currentRequest?.reqBody || ''}
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
              maxHeight: 200,
              overflowY: 'auto',
              pr: 1
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
                    onChange={(e) => handleHeaderChange(e, 'key', index)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Value"
                    variant="outlined"
                    fullWidth
                    value={header.value}
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
                    onChange={(e) => handleParamChange(e, 'key', index)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Value"
                    variant="outlined"
                    fullWidth
                    value={param.value}
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
            width: '300px',
            marginLeft: '20px'
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
                  updateRequestInSession({ contentType: 'application/json' });
                } else if (e.target.value === 'Text') {
                  updateRequestInSession({ contentType: 'text/plain' });
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
    </RequestDiv>
  );
};

export default Requests;
