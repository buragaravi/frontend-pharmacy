import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { LocalShipping as ShipIcon } from '@mui/icons-material';
import useLabs from '../../hooks/useLabs';

const LabInventoryView = ({ labId }) => {
  // Fetch labs dynamically
  const { labs, loading: labsLoading } = useLabs();
  const [chemicals, setChemicals] = useState([]);
  const [liveStock, setLiveStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [allocation, setAllocation] = useState({
    chemicalId: "",
    quantity: "",
    targetLabId: "",
  });
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);

  const fetchLabInventory = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/inventory/lab/${labId}?page=${page}&name=${search}`);
      setChemicals(response.data.data);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages
      });
    } catch (error) {
      console.error('Error fetching lab inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveStock = async () => {
    try {
      const response = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/inventory/live/${labId}`);
      setLiveStock(response.data);
    } catch (error) {
      console.error('Error fetching live stock:', error);
    }
  };

  const allocateChemical = async () => {
    try {
      await axios.post('https://backend-pharmacy-5541.onrender.com/api/inventory/allocate', allocation);
      setAllocationDialogOpen(false);
      fetchLabInventory();
      fetchLiveStock();
    } catch (error) {
      console.error('Error allocating chemical:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAllocation(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    fetchLabInventory();
    fetchLiveStock();
  }, [search, labId]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ 
        background: 'linear-gradient(135deg, #F5F9FD 0%, #E1F1FF 100%)',
        borderRadius: 2,
        p: 3,
        mb: 4,
        border: '1px solid #BCE0FD'
      }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#0B3861', mb: 4 }}>
          Lab {labId} Inventory
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card sx={{ border: '1px solid #BCE0FD' }}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Search chemicals..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderColor: '#BCE0FD',
                        '&:hover fieldset': {
                          borderColor: '#64B5F6',
                        },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <TableContainer component={Paper} sx={{ border: '1px solid #BCE0FD' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F5F9FD' }}>
                <TableCell sx={{ color: '#0B3861', fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ color: '#0B3861', fontWeight: 'bold' }}>Unit</TableCell>
                <TableCell sx={{ color: '#0B3861', fontWeight: 'bold' }}>Quantity</TableCell>
                <TableCell sx={{ color: '#0B3861', fontWeight: 'bold' }}>Expiry Date</TableCell>
                <TableCell sx={{ color: '#0B3861', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chemicals.map((chemical) => (
                <TableRow key={chemical._id} hover>
                  <TableCell>{chemical.name}</TableCell>
                  <TableCell>{chemical.unit}</TableCell>
                  <TableCell>{chemical.quantity}</TableCell>
                  <TableCell>{new Date(chemical.expiryDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ShipIcon />}
                      onClick={() => {
                        setAllocation({ ...allocation, chemicalId: chemical._id });
                        setAllocationDialogOpen(true);
                      }}
                      sx={{
                        bgcolor: '#64B5F6',
                        '&:hover': {
                          bgcolor: '#1E88E5',
                        },
                      }}
                    >
                      Allocate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => fetchLabInventory(pagination.currentPage - 1)}
            disabled={pagination.currentPage <= 1}
            sx={{
              borderColor: '#BCE0FD',
              color: '#0B3861',
              '&:hover': {
                borderColor: '#64B5F6',
                bgcolor: '#F5F9FD',
              },
            }}
          >
            Previous
          </Button>
          <Typography sx={{ color: '#0B3861', lineHeight: '36px' }}>
            Page {pagination.currentPage} of {pagination.totalPages}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => fetchLabInventory(pagination.currentPage + 1)}
            disabled={pagination.currentPage >= pagination.totalPages}
            sx={{
              borderColor: '#BCE0FD',
              color: '#0B3861',
              '&:hover': {
                borderColor: '#64B5F6',
                bgcolor: '#F5F9FD',
              },
            }}
          >
            Next
          </Button>
        </Box>
      </Box>

      {/* Allocation Dialog */}
      <Dialog 
        open={allocationDialogOpen} 
        onClose={() => setAllocationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#F5F9FD', color: '#0B3861' }}>
          Allocate Chemical
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Target Lab</InputLabel>
                <Select
                  name="targetLabId"
                  value={allocation.targetLabId}
                  onChange={handleInputChange}
                  disabled={labsLoading}
                  sx={{ '& fieldset': { borderColor: '#BCE0FD' } }}
                >
                  {labs.map((lab) => (
                    <MenuItem key={lab.labId} value={lab.labId}>
                      {lab.labId} - {lab.labName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                name="quantity"
                value={allocation.quantity}
                onChange={handleInputChange}
                sx={{ '& fieldset': { borderColor: '#BCE0FD' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#F5F9FD' }}>
          <Button 
            onClick={() => setAllocationDialogOpen(false)}
            sx={{ color: '#0B3861' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={allocateChemical}
            sx={{
              bgcolor: '#0B3861',
              '&:hover': {
                bgcolor: '#1E88E5',
              },
            }}
          >
            Allocate
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LabInventoryView;
