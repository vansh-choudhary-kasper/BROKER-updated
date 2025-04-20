import React from 'react';
import { Alert, AlertTitle, styled } from '@mui/material';
import { keyframes } from '@mui/system';

interface ValidationError {
  field: string;
  message: string;
}

interface FormValidationProps {
  errors: ValidationError[];
  onClose?: () => void;
}

const slideIn = keyframes`
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const StyledAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  animation: `${slideIn} 0.3s ease-out`,
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  '& .MuiAlertTitle-root': {
    fontWeight: 600,
    fontSize: '1rem',
    marginBottom: '4px',
  },
  '& .MuiAlert-message': {
    fontSize: '0.9rem',
    color: theme.palette.error.dark,
  },
  '& .MuiAlert-icon': {
    fontSize: '1.2rem',
  },
}));

const ValidationContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  maxWidth: '100%',
}));

const FormValidation: React.FC<FormValidationProps> = ({ errors, onClose }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <ValidationContainer>
      {errors.map((error, index) => (
        <StyledAlert 
          key={index}
          severity="error"
          onClose={onClose}
          elevation={0}
        >
          <AlertTitle className="capitalize">{error.field}</AlertTitle>
          {error.message}
        </StyledAlert>
      ))}
    </ValidationContainer>
  );
};

export default FormValidation; 