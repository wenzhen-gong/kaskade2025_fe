import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import MethodDropdown from './MethodDropdown';
import { Request } from '../../model';

interface RequestsProps {
  // Add props if needed
}

const Requests: React.FC<RequestsProps> = () => {
  const location = useLocation();
  console.log('Requests location state: ', location.state);
  const request = location.state as Request | null;
  const { requestName, url, method, headers } = request || {};

  // const [currentTab, setCurrentTab] = useState<string>('overview');

  const RequestDiv = styled.div`
    padding: 50px;
  `;

  const availableMethods: string[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  const handleMethodSelect = (selectedMethod: string): void => {
    // Update the method in your state or perform any action based on the selected method
    console.log('Selected Method:', selectedMethod);
  };

  const [modifiedUrl, setModifiedUrl] = useState<string>(url || '');

  useEffect(() => {
    setModifiedUrl(url || '');
  }, [url]);

  return (
    <RequestDiv>
      <p>Request</p>
      {request && (
        <div>
          <p>Request Name: {requestName}</p>
          <label>Modified URL: </label>
          <input type="text" value={modifiedUrl} onChange={(e) => setModifiedUrl(e.target.value)} />
          <p>Method: {method}</p>
          <MethodDropdown options={availableMethods} onSelect={handleMethodSelect} />
          <p>Headers: {JSON.stringify(headers)}</p>
          {/* <p>Body: {JSON.stringify(body)}</p> */}
        </div>
      )}
    </RequestDiv>
  );
};

export default Requests;
