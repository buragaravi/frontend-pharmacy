import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import ExperimentForm from '../components/ExperimentForm';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'https://backend-pharmacy-5541.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const ExperimentsPage = () => {
  const [openForm, setOpenForm] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const queryClient = useQueryClient();

  const { data: experiments, isLoading, error } = useQuery({
    queryKey: ['experiments'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/experiments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/experiments/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
    },
  });

  const handleEdit = (experiment) => {
    setSelectedExperiment(experiment);
    setOpenForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this experiment?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedExperiment(null);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: '#0B3861' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ backgroundColor: '#F5F9FD', color: '#0B3861', border: '1px solid #BCE0FD' }}>
          {error.response?.data?.message || 'Failed to load experiments'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3} sx={{ backgroundColor: '#F5F9FD' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1" sx={{ color: '#0B3861', fontWeight: 'bold' }}>
          Experiments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
          sx={{
            backgroundColor: '#0B3861',
            '&:hover': {
              backgroundColor: '#1E88E5',
            },
          }}
        >
          Add Experiment
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ border: '1px solid #BCE0FD', borderRadius: '0.5rem' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#F5F9FD' }}>
              <TableCell sx={{ color: '#0B3861', fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ color: '#0B3861', fontWeight: 'bold' }}>Subject</TableCell>
              <TableCell sx={{ color: '#0B3861', fontWeight: 'bold' }}>Semester</TableCell>
              <TableCell sx={{ color: '#0B3861', fontWeight: 'bold' }}>Default Chemicals</TableCell>
              <TableCell align="right" sx={{ color: '#0B3861', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {experiments?.map((experiment) => (
              <TableRow key={experiment._id} sx={{ '&:hover': { backgroundColor: '#F5F9FD' } }}>
                <TableCell>{experiment.name}</TableCell>
                <TableCell>{experiment.subject}</TableCell>
                <TableCell>{experiment.semester}</TableCell>
                <TableCell>
                  {experiment.defaultChemicals.map((chem, index) => (
                    <Chip
                      key={index}
                      label={`${chem.chemicalName} (${chem.quantity} ${chem.unit})`}
                      size="small"
                      sx={{
                        marginRight: '0.5rem',
                        marginBottom: '0.5rem',
                        backgroundColor: '#F5F9FD',
                        border: '1px solid #BCE0FD',
                        color: '#0B3861',
                      }}
                    />
                  ))}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => handleEdit(experiment)}
                    sx={{ color: '#64B5F6', '&:hover': { color: '#1E88E5' } }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(experiment._id)}
                    sx={{ color: '#0B3861', '&:hover': { color: '#1E88E5' } }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openForm}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#F5F9FD',
            border: '1px solid #BCE0FD',
          },
        }}
      >
        <Box p={3}>
          <ExperimentForm
            experiment={selectedExperiment}
            onClose={handleCloseForm}
          />
        </Box>
      </Dialog>
    </Box>
  );
};

export default ExperimentsPage;