import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  currentSessionConfig,
  addRequest,
  duplicateSession,
  deleteSession,
  setShouldFocusSessionName
} from '../redux/dataSlice.js';
import RequestItem from './RequestItem';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Session } from '../model';

const options = ['Add Request', 'Duplicate Session', 'Rename Session', 'Delete Session'];

const ITEM_HEIGHT = 48;

interface SessionItemProps {
  session: Session;
}

const SessionItem: React.FC<SessionItemProps> = (props) => {
  // console.log("SessionItem State called props.session: ", props.session)
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // dipatch(currentSessionConfig(props.session))
  // The basic styling of the session div.
  const sessionDivStyle: React.CSSProperties = {
    paddingLeft: '5px',
    paddingTop: '2px',
    paddingBottom: '2px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  // Decide what is the currently "selected" session.
  const params = useParams();
  const selectedSessionId = params.id;

  const requests: React.ReactNode[] = [];
  if (selectedSessionId == props.session.sessionId.toString()) {
    // Selected.
    // 1. Highlight the session div if we don't select any request in it.
    if (!params.requestId) {
      sessionDivStyle.backgroundColor = 'rgba(255, 255, 255, 0.2)';

      dispatch(currentSessionConfig(props.session));
    }

    // 2. Show requests.
    for (let i = 0; i < props.session.requests.length; ++i) {
      requests.push(
        <RequestItem
          key={i}
          request={props.session.requests[i]}
          sessionId={props.session.sessionId}
          requestId={i}
        />
      );
    }
  }

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (option: string): void => {
    console.log('option', option);
    if (option === 'Add Request') {
      dispatch(addRequest(selectedSessionId));
    } else if (option === 'Duplicate Session') {
      dispatch(duplicateSession(props.session));
    } else if (option === 'Rename Session') {
      // 导航到该 session 的页面（如果还没有）
      if (selectedSessionId !== props.session.sessionId.toString()) {
        navigate('/sessions/' + props.session.sessionId);
      }
      // 设置 Redux 状态，让 OverviewTab 知道需要聚焦输入框
      dispatch(setShouldFocusSessionName(true));
    } else if (option === 'Delete Session') {
      dispatch(deleteSession(selectedSessionId));
    }
    setAnchorEl(null);
  };

  return (
    <div>
      <div
        style={sessionDivStyle}
        onClick={() => {
          navigate('/sessions/' + props.session.sessionId);
        }}
      >
        <h4>{props.session.sessionName}</h4>
        <div>
          <IconButton
            aria-label="more"
            id="long-button"
            aria-controls={open ? 'long-menu' : undefined}
            aria-expanded={open ? 'true' : undefined}
            aria-haspopup="true"
            onClick={handleClick}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            id="long-menu"
            MenuListProps={{
              'aria-labelledby': 'long-button'
            }}
            anchorEl={anchorEl}
            open={open}
            onClose={() => handleClose('')}
            PaperProps={{
              style: {
                maxHeight: ITEM_HEIGHT * 4.5,
                width: '20ch'
              }
            }}
          >
            {options.map((option) => (
              <MenuItem
                key={option}
                selected={option === 'Pyxis'}
                onClick={() => {
                  handleClose(option);
                }}
              >
                {option}
              </MenuItem>
            ))}
          </Menu>
        </div>
      </div>
      {requests}
    </div>
  );
};

export default SessionItem;
