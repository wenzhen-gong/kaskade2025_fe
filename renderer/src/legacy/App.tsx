import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import HeadBar from './common/HeadBar';
import NavBar from './common/NavBar';
import SideBar from './sidebars/SideBar';
import History from './pages/History/History';
import Sessions from './pages/Sessions/Sessions';
import Requests from './pages/Requests/Requests';
import Result from './pages/Result/Result';
import { useSelector } from 'react-redux';
import { State } from './model';

const PageContainer = styled.div`
  background-color: #000000;
  color: #ffffff;
  width: 100%;
  height: 100vh;
`;

const MainContainer = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100vh - 50px);
`;

const OutletContainer = styled.div`
  background-color: #1e1e1e;
  width: 100%;
`;

interface LayoutProps {
  page: string;
}

const App: React.FC = () => {
  // Find the first session in data file, so we can redirect the initial page to the first session.
  const firstSessionId = useSelector((state: State) => {
    if (state.datafile.length > 0) {
      return state.datafile[0].sessionId;
    }
    return null;
  });

  // The overall page layout.
  const Layout: React.FC<LayoutProps> = (props) => {
    //没有地址栏，但是可以用useLocation追踪当前url
    const location = useLocation();
    console.log('Current URL:', location.pathname);

    return (
      <PageContainer>
        <HeadBar />
        <MainContainer>
          <NavBar page={props.page} />
          <SideBar page={props.page} />
          <OutletContainer>
            <Outlet />
          </OutletContainer>
        </MainContainer>
      </PageContainer>
    );
  };

  // Define react router rules.
  // Note that request page is nested in session page, so session page component
  // will not unmount when navigating to a request page.
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate replace to={'/sessions/'} />} />

          <Route path="/sessions" element={<Layout page="sessions" />}>
            <Route path="" element={<Sessions />} />
            <Route path=":id" element={<Sessions />}>
              <Route path=":requestId" element={<Requests />} />
            </Route>
          </Route>

          <Route path="/history" element={<Layout page="history" />}>
            <Route path="" element={<History />} />
            <Route path=":id" element={<History />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
};

export default App;
