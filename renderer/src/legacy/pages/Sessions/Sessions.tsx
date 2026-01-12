import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate, Outlet } from 'react-router-dom';
import OverviewTab from './tabs/OverviewTab';
import RunTab from './tabs/RunTab';
import AuthorizationTab from './tabs/AuthorizationTab';
import ResultTab from './tabs/ResultTab';
import HistoryTab from './tabs/HistoryTab';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { useSelector, useDispatch } from 'react-redux';
import Typography from '@mui/material/Typography';
import { RootState } from '../../redux/store';
import { clearSessionState } from '../../redux/dataSlice';

// https://mui.com/material-ui/react-tabs/
// Some helper functions to render tab bar & tab pannels.
interface CustomTabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: CustomTabPanelProps): React.ReactElement {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`session-tabpanel-${index}`}
      aria-labelledby={`session-tab-${index}`}
      {...other}
      sx={{ height: '100%', overflow: 'hidden', display: value === index ? 'block' : 'none' }}
    >
      <Box
        sx={{
          p: 3,
          height: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function a11yProps(index: number): { id: string; 'aria-controls': string } {
  return {
    id: `session-tab-${index}`,
    'aria-controls': `session-tabpanel-${index}`
  };
}

// Create styled components outside render functions to avoid recreating new components for each re-render.
const SessionsDiv = styled.div`
  padding: 50px;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`;

const Sessions: React.FC = () => {
  const dispatch = useDispatch();
  const configFile = useSelector((state: RootState) => state.configFile);
  console.log('Current configFile on SessionTab:', configFile);
  // Get the session Id from URL parameters.
  const params = useParams();
  const sessionId = params.id;

  // Get the session name to display on the title bar.
  const sessionName = useSelector((state: RootState) => {
    for (let i = 0; i < state.datafile.length; i++) {
      if (state.datafile[i].sessionId.toString() === sessionId) {
        return state.datafile[i].sessionName;
      }
    }
    return null;
  });

  const navigate = useNavigate();

  // Tab bar's state that represents the currently selected tab.
  // 0 = overview, 1 = authorization, 2 = run, 3 = result, 4 = history.
  const [currentTab, setCurrentTab] = useState<number>(0); // Overview
  const handleTabChange = (event: React.SyntheticEvent, newValue: number): void => {
    setCurrentTab(newValue);
  };

  // Track previous sessionId to detect actual session changes
  const prevSessionIdRef = useRef<string | undefined>(sessionId);
  // Clear session-related state when session changes, and switch to Overview tab
  useEffect(() => {
    // Only reset tab if sessionId actually changed (different session)
    console.log('previous sessionId:', prevSessionIdRef.current, 'current sessionId:', sessionId);
    if (prevSessionIdRef.current !== sessionId && sessionId) {
      console.log('reset session page stage.');
      // Clear state first to prevent RunTab from triggering runTest with old state
      dispatch(clearSessionState());
      // Switch to Overview tab only when changing to a different session
      setCurrentTab(0);
      prevSessionIdRef.current = sessionId;
    } else if (sessionId && !prevSessionIdRef.current) {
      // Initial mount - set ref but don't reset tab
      prevSessionIdRef.current = sessionId;
    }
  }, [sessionId, dispatch]);

  // Auto-switch to Result tab when test completes
  // Get result from state to detect when test completes
  const result = useSelector((state: RootState) => state.result);
  useEffect(() => {
    if (result) {
      setCurrentTab(3); // Switch to Result tab (index 3)
    }
  }, [result]);

  // Check if the react router URL is on a request page (has requestId in params)
  // If so, render the Outlet (whcih is the request page component).
  const requestId = params.requestId;
  if (requestId) {
    return (
      <SessionsDiv>
        <Outlet />
      </SessionsDiv>
    );
  }

  // Otherwise, render the session page (session tabs)
  return (
    <SessionsDiv>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '20px',
          borderBottom: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)'
        }}
      >
        <Typography
          variant="h6"
          component="h6"
          onClick={() => {
            setCurrentTab(0);
            navigate('/sessions/' + sessionId);
          }}
          sx={{ cursor: 'pointer' }}
        >
          {sessionName}
        </Typography>
      </Box>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ width: '70%', minWidth: 300 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="session tab bar"
            variant="fullWidth"
          >
            <Tab label="Overview" {...a11yProps(0)} />
            <Tab label="Authorization" {...a11yProps(1)} />
            <Tab label="Run" {...a11yProps(2)} />
            <Tab label="Result" {...a11yProps(3)} />
            <Tab label="History" {...a11yProps(4)} />
          </Tabs>
        </Box>
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <CustomTabPanel value={currentTab} index={0}>
            <OverviewTab setCurrentTab={setCurrentTab} />
          </CustomTabPanel>
          <CustomTabPanel value={currentTab} index={1}>
            <AuthorizationTab />
          </CustomTabPanel>
          <CustomTabPanel value={currentTab} index={2}>
            <RunTab setCurrentTab={setCurrentTab} />
          </CustomTabPanel>
          <CustomTabPanel value={currentTab} index={3}>
            <ResultTab />
          </CustomTabPanel>
          <CustomTabPanel value={currentTab} index={4}>
            <HistoryTab setCurrentTab={setCurrentTab} currentTab={currentTab} />
          </CustomTabPanel>
        </Box>
      </Box>
    </SessionsDiv>
  );
};

export default Sessions;
