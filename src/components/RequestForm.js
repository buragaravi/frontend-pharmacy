import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import ExperimentSelector from './ExperimentSelector';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const steps = ['Select Lab', 'Select Experiments', 'Review & Submit'];

const RequestForm = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedExperiments, setSelectedExperiments] = useState([]);
  const [labId, setLabId] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (activeStep === 0 && !labId) {
      setError('Please select a lab');
      return;
    }
    if (activeStep === 1 && selectedExperiments.length === 0) {
      setError('Please select at least one experiment');
      return;
    }
    setError('');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://backend-pharmacy-5541.onrender.com/api/requests', {
        labId,
        experiments: selectedExperiments,
      });
      navigate('/requests');
    } catch (error) {
      console.error('Error creating request:', error);
      setError(error.response?.data?.message || 'Error creating request');
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <FormControl fullWidth sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#BCE0FD',
              },
              '&:hover fieldset': {
                borderColor: '#64B5F6',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#0B3861',
              },
            },
          }}>
            <InputLabel sx={{ color: '#0B3861' }}>Select Lab</InputLabel>
            <Select
              value={labId}
              label="Select Lab"
              onChange={(e) => setLabId(e.target.value)}
              sx={{ backgroundColor: '#F5F9FD' }}
            >
              <MenuItem value="lab1">Lab 1</MenuItem>
              <MenuItem value="lab2">Lab 2</MenuItem>
              <MenuItem value="lab3">Lab 3</MenuItem>
            </Select>
          </FormControl>
        );
      case 1:
        return (
          <ExperimentSelector
            onExperimentsSelect={setSelectedExperiments}
            selectedExperiments={selectedExperiments}
          />
        );
      case 2:
        return (
          <Box sx={{ backgroundColor: '#F5F9FD', p: 2, borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#0B3861' }}>
              Request Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography sx={{ color: '#0B3861' }}>
                  <strong>Lab:</strong> {labId}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography sx={{ color: '#0B3861' }}>
                  <strong>Selected Experiments:</strong>
                </Typography>
                {selectedExperiments.map((exp) => (
                  <Paper 
                    key={exp.experimentId} 
                    sx={{ 
                      p: 2, 
                      my: 1, 
                      backgroundColor: '#F5F9FD',
                      border: '1px solid #BCE0FD'
                    }}
                  >
                    <Typography sx={{ color: '#0B3861' }}>
                      {exp.experimentName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64B5F6' }}>
                      Chemicals: {exp.chemicals.length}
                    </Typography>
                  </Paper>
                ))}
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ width: '100%', bgcolor: '#F5F9FD', p: 3, borderRadius: 2 }}>
      <Stepper activeStep={activeStep} sx={{
        '& .MuiStepIcon-root': {
          color: '#BCE0FD',
          '&.Mui-active': {
            color: '#0B3861',
          },
          '&.Mui-completed': {
            color: '#64B5F6',
          },
        },
        '& .MuiStepLabel-label': {
          color: '#0B3861',
        },
        mb: 4
      }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ mt: 2, mb: 4 }}>
        {getStepContent(activeStep)}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{
            color: '#0B3861',
            borderColor: '#BCE0FD',
            '&:hover': {
              backgroundColor: '#F5F9FD',
              borderColor: '#64B5F6',
            },
          }}
          variant="outlined"
        >
          Back
        </Button>
        <Button
          onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
          sx={{
            backgroundColor: '#0B3861',
            color: 'white',
            '&:hover': {
              backgroundColor: '#1E88E5',
            },
            '&.Mui-disabled': {
              backgroundColor: '#BCE0FD',
            },
          }}
          variant="contained"
        >
          {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default RequestForm;