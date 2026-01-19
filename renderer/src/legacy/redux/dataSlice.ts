import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Request, Session, State, Result, ResultMetadata } from '../model';

const initialState: State = {
  datafile: [], // Initial state that'll be updated to action payload (datafile)
  runTabConfig: {},
  validUserInput: { valid: false, flag: false, error: null },
  result: undefined,
  // 这里开始是signup signin的model里面的state
  signupError: null,
  openSignup: false,
  signupLoading: false,
  signupFormData: { username: '', email: '', password: '' },

  signinError: null,
  openSignin: false,
  signinLoading: false,
  signinFormData: { username: '', password: '' },
  // 这里开始是后端返回的state
  user: null,
  // only for testing
  // user: { username: 'wzg', email: 'wzg@email.com' },
  // 这里开始是Profile的state
  openProfile: false
};

export const runTest = createAsyncThunk('datafile/runTest', async (sessionId: string, thunkAPI) => {
  const state = thunkAPI.getState() as State;
  const finalRunTabConfig = { ...state.runTabConfig };

  // Get all requests for the current session
  const sessionIdNum = Number(sessionId);
  const currentSession = state.datafile.find((session) => session.sessionId === sessionIdNum);
  const requests = currentSession?.requests || [];

  console.log('finalRunTabConfig in runTest Thunk: ', finalRunTabConfig);
  console.log('requests in runTest Thunk: ', requests);

  // TODO: set validUserInput to false to prevent duplicate triggering of runs.

  const result: Result = await window.api.runLoadTest({
    ...finalRunTabConfig,
    requests: requests
  });

  // Send a fetch request to backend to save result
  const saveResultRequest = {
    userId: state.user?.id,
    sessionId: sessionId,
    version: '1.0.0',
    config: finalRunTabConfig,
    result: result
  };
  const saveResultResponse = await fetch(
    'https://kaskade-backend-483052428154.asia-east1.run.app/benchmarkresult',
    {
      method: 'POST',
      body: JSON.stringify(saveResultRequest)
    }
  ).then((res) => res.json());
  console.log(`saveResultResponse: ${saveResultResponse}`);
  const resultMetadata: ResultMetadata = {
    id: saveResultResponse.id,
    userId: saveResultResponse.userId,
    timestamp: saveResultResponse.timestamp,
    sessionId: saveResultResponse.sessionId,
    version: saveResultResponse.version,
    successRatio: saveResultResponse.successRatio,
    p50Latency: saveResultResponse.p50Latency,
    p95Latency: saveResultResponse.p95Latency,
    throughput: saveResultResponse.throughput
  };

  return { result, resultMetadata };
});

const dataSlice = createSlice({
  name: 'datafile',
  initialState,
  reducers: {
    setData: (state, action) => {
      state.datafile = action.payload;
    },

    setRunTabData: (state, action) => {
      state.runTabConfig = action.payload;
    },

    setValidUserInput: (state, action) => {
      state.validUserInput = action.payload;
    },

    currentSessionConfig: (state, action) => {
      state.configFile = action.payload;
    },

    createSession: (state) => {
      const sessionId = Date.now();
      const newSession: Session = {
        sessionId: sessionId,
        sessionName: 'New Session',
        overview: '', // or some default text
        createdBy: 'anonymous', // or actual user
        createdOn: sessionId,
        lastModified: sessionId,
        requests: [],
        servers: [],
        history: []
      };
      state.datafile.push(newSession);

      // call main process to write data file
      window.api.writeDataFile(JSON.stringify(state.datafile));
    },

    addRequest: (state, action) => {
      const sessionId = action.payload.sessionId;
      const requestId = Date.now();
      const newRequest: Request = {
        requestId: requestId,
        requestName: 'New Request',
        method: 'GET',
        url: '',
        reqBody: '',
        headers: [],
        params: [],
        contentType: null
      };
      for (let i = 0; i < state.datafile.length; i++) {
        if (state.datafile[i].sessionId === sessionId) {
          state.datafile[i].requests.push(newRequest);
        }
      }
      // call main process to write data file
      window.api.writeDataFile(JSON.stringify(state.datafile));
    },

    duplicateSession: (state, action) => {
      const oldSession = action.payload.session;
      const newSession = JSON.parse(JSON.stringify(oldSession)) as Session;
      newSession.sessionId = Date.now();
      newSession.sessionName = 'Copy of ' + newSession.sessionName;
      newSession.createdOn = newSession.sessionId;
      newSession.lastModified = newSession.sessionId;
      state.datafile.push(newSession);

      // call main process to write data file
      window.api.writeDataFile(JSON.stringify(state.datafile));
    },

    deleteSession: (state, action) => {
      const sessionId = action.payload.sessionId;
      for (let i = 0; i < state.datafile.length; i++) {
        if (state.datafile[i].sessionId === sessionId) {
          state.datafile.splice(i, 1);
        }
      }

      // call main process to write data file
      window.api.writeDataFile(JSON.stringify(state.datafile));
    },

    renameSession: (state, action) => {
      const sessionId = action.payload.sessionId;
      const newName = action.payload.newName;
      for (let i = 0; i < state.datafile.length; i++) {
        if (state.datafile[i].sessionId === sessionId) {
          state.datafile[i].sessionName = newName;
          break;
        }
      }

      // call main process to write data file
      window.api.writeDataFile(JSON.stringify(state.datafile));
    },

    updateSessionOverview: (state, action) => {
      const sessionId = action.payload.sessionId;
      const newOverview = action.payload.newOverview;
      for (let i = 0; i < state.datafile.length; i++) {
        if (state.datafile[i].sessionId === sessionId) {
          state.datafile[i].overview = newOverview;
          break;
        }
      }

      // call main process to write data file
      window.api.writeDataFile(JSON.stringify(state.datafile));
    },

    deleteRequest: (state, action) => {
      const sessionId = action.payload.sessionId;
      const requestId = action.payload.requestId;
      for (let i = 0; i < state.datafile.length; i++) {
        if (state.datafile[i].sessionId === sessionId) {
          for (let j = 0; j < state.datafile[i].requests.length; j++) {
            if (state.datafile[i].requests[j].requestId === requestId) {
              state.datafile[i].requests.splice(j, 1);
              break;
            }
          }
          break;
        }
      }

      // call main process to write data file
      window.api.writeDataFile(JSON.stringify(state.datafile));
    },
    updateRequest: (state, action) => {
      const sessionId = action.payload.sessionId;
      const requestId = action.payload.requestId;
      const updates = action.payload.updates;
      for (let i = 0; i < state.datafile.length; i++) {
        if (state.datafile[i].sessionId === sessionId) {
          for (let j = 0; j < state.datafile[i].requests.length; j++) {
            if (state.datafile[i].requests[j].requestId === requestId) {
              state.datafile[i].requests[j] = {
                ...state.datafile[i].requests[j],
                ...updates
              };
              state.datafile[i].lastModified = Date.now();
              break;
            }
          }
          break;
        }
      }

      // call main process to write data file
      window.api.writeDataFile(JSON.stringify(state.datafile));
    },
    setSignupError: (state, action) => {
      state.signupError = action.payload;
    },
    setOpenSignup: (state, action) => {
      state.openSignup = action.payload;
    },
    setSignupLoading: (state, action) => {
      state.signupLoading = action.payload;
    },
    setSignupFormData: (state, action) => {
      state.signupFormData = action.payload;
    },

    setSigninError: (state, action) => {
      state.signinError = action.payload;
    },
    setOpenSignin: (state, action) => {
      state.openSignin = action.payload;
    },
    setSigninLoading: (state, action) => {
      state.signinLoading = action.payload;
    },
    setSigninFormData: (state, action) => {
      state.signinFormData = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setOpenProfile: (state, action) => {
      state.openProfile = action.payload;
    },
    setResult: (state, action) => {
      state.result = action.payload.result;
      state.resultMetadata = action.payload.resultMetadata;
    },
    clearSessionState: (state) => {
      state.result = undefined;
      state.resultMetadata = undefined;
      state.runTabConfig = {};
      state.validUserInput.valid = false;
      state.validUserInput.flag = !state.validUserInput.flag;
    }
  },
  // Reducers for asyncthunk
  extraReducers: (builder) => {
    builder.addCase(runTest.fulfilled, (state, action) => {
      console.log(action.payload);
      state.result = action.payload.result;
      state.resultMetadata = action.payload.resultMetadata;
    });
  }
});

export const {
  setData,
  setRunTabData,
  setValidUserInput,
  currentSessionConfig,
  createSession,
  addRequest,
  duplicateSession,
  deleteSession,
  renameSession,
  updateSessionOverview,
  deleteRequest,
  updateRequest,
  setSignupError,
  setOpenSignup,
  setSignupLoading,
  setSignupFormData,
  setSigninError,
  setOpenSignin,
  setSigninLoading,
  setSigninFormData,
  setUser,
  setOpenProfile,
  setResult,
  clearSessionState
} = dataSlice.actions;

export default dataSlice.reducer;
