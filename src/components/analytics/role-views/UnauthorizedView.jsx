import React from 'react';
import { Alert } from 'react-bootstrap';

const UnauthorizedView = () => {
  return (
    <div className="unauthorized-view">
      <Alert variant="warning">
        <Alert.Heading>Access Denied</Alert.Heading>
        <p>
          You don't have permission to view analytics. Please contact your system administrator
          if you believe this is an error.
        </p>
      </Alert>
    </div>
  );
};

export default UnauthorizedView;