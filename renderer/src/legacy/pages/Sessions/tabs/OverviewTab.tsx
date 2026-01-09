import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import {
  renameSession,
  updateSessionOverview,
  setShouldFocusSessionName
} from '../../../redux/dataSlice';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import Typography from '@mui/material/Typography';
import { RootState } from '../../../redux/store';
import { IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';

// Define styled elements outside the render function.
// Otherwise, each re-render will create a new styled element, causing lose of focus.
// (This page has TextField with onChange, so typing each character will cause a rerender).
// see https://www.reddit.com/r/reactjs/comments/85yxnu/text_input_unfocuses_after_adding_one_character/.

const OverviewDiv = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
`;

const TwoPannelDiv = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const LeftDiv = styled.div`
  width: 60%;
  display: flex;
  flex-direction: column;
`;

const RightDiv = styled.div`
  width: 30%;
  display: flex;
  flex-direction: column;
`;

interface LabelAndTextProps {
  label: string;
  text: string;
}

const LabelAndText: React.FC<LabelAndTextProps> = ({ label, text }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        marginBottom: '10px'
      }}
    >
      <Typography variant="h6" component="h6">
        {label}
      </Typography>
      <Typography variant="body1">{text}</Typography>
    </Box>
  );
};

interface OverviewTabProps {
  setCurrentTab: (tab: number) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = (props) => {
  const dispatch = useDispatch();
  const sessionNameInputRef = useRef<HTMLInputElement>(null);

  // Get the session Id from URL parameters.
  const params = useParams();
  const sessionId = params.id;
  console.log('Session Id is : ', sessionId);
  const [isOverviewEditable, setIsOverviewEditable] = useState(false);

  const toggleOverviewEditable = (): void => {
    setIsOverviewEditable((prev) => !prev);
  };
  // Get the state of this session.
  const overviewState = useSelector((state: RootState) => {
    for (let i = 0; i < state.datafile.length; i++) {
      if (state.datafile[i].sessionId.toString() === sessionId) {
        return state.datafile[i];
      }
    }
    return null;
  });

  // 监听 shouldFocusSessionName 状态，聚焦输入框
  const shouldFocusSessionName = useSelector((state: RootState) => state.shouldFocusSessionName);
  useEffect(() => {
    if (shouldFocusSessionName && sessionNameInputRef.current) {
      sessionNameInputRef.current.focus();
      // 将光标移动到文本末尾
      const length = sessionNameInputRef.current.value.length;
      sessionNameInputRef.current.setSelectionRange(length, length);
      // 重置状态
      dispatch(setShouldFocusSessionName(false));
    }
  }, [shouldFocusSessionName, dispatch]);
  // console.log("Overview State: ", overviewState)

  if (!overviewState) {
    return (
      <div>
        <p>Unknown session Id: {sessionId}</p>
      </div>
    );
  }

  // Render the page.
  const handleRenameSession = (e: React.ChangeEvent<HTMLInputElement>): void => {
    dispatch(
      renameSession({
        sessionId: sessionId,
        newName: e.target.value
      })
    );
  };

  const handleUpdateSessionOverview = (e: React.ChangeEvent<HTMLInputElement>): void => {
    dispatch(
      updateSessionOverview({
        sessionId: sessionId,
        newOverview: e.target.value
      })
    );
  };

  return (
    <OverviewDiv>
      <Box component="form" noValidate autoComplete="off">
        <TextField
          id="session-name"
          inputRef={sessionNameInputRef}
          variant="outlined"
          fullWidth
          value={overviewState.sessionName}
          onChange={handleRenameSession}
          // InputProps={{
          //   disableUnderline: true,
          //   style: {
          //     fontSize: '30px',
          //     fontWeight: 700
          //   }
          // }}
        />
      </Box>
      <TwoPannelDiv>
        <LeftDiv>
          <Box component="form" noValidate autoComplete="off">
            <TextField
              id="session-overview"
              variant="filled"
              multiline
              fullWidth
              value={overviewState.overview}
              onChange={handleUpdateSessionOverview}
              disabled={!isOverviewEditable}
            />
            <Tooltip title={isOverviewEditable ? 'Save' : 'Edit'}>
              <IconButton
                color={isOverviewEditable ? 'success' : 'default'}
                onClick={toggleOverviewEditable}
                size="small"
              >
                {isOverviewEditable ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <EditIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </LeftDiv>
        <RightDiv>
          <LabelAndText label={'Created By'} text={overviewState.createdBy} />
          <LabelAndText
            label={'Created On'}
            text={new Date(overviewState.createdOn).toLocaleString()}
          />
          <LabelAndText
            label={'Last Modified'}
            text={new Date(overviewState.lastModified).toLocaleString()}
          />
        </RightDiv>
      </TwoPannelDiv>
      <Button
        variant="contained"
        onClick={() => {
          props.setCurrentTab(2);
        }}
        sx={{ width: '150px', marginTop: '50px' }}
      >
        <PlayCircleIcon />
        Run
      </Button>
    </OverviewDiv>
  );
};

export default OverviewTab;
