import React from 'react';
import styled from 'styled-components';
import SessionsSide from './SessionsSide';
import HistorySide from './HistorySide';

const SideBarDiv = styled.div`
  background-color: #2a2828;
  width: 300px;
  border-right-style: solid;
  border-right-color: #535353;
  border-right-with: 2px;
`;

interface SideBarProps {
  page: string;
}

const SideBar: React.FC<SideBarProps> = (props) => {
  let sideBarContent: React.ReactNode;
  if (props.page === 'sessions') {
    sideBarContent = <SessionsSide />;
  } else if (props.page === 'history') {
    sideBarContent = <HistorySide />;
  } else {
    sideBarContent = <p>Unknown page</p>;
  }

  return <SideBarDiv>{sideBarContent}</SideBarDiv>;
};

export default SideBar;
