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
  IconButton,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';

const InventoryPage = () => {
  const [chemicals, setChemicals] = useState([]);
  const [liveStock, setLiveStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [newChemical, setNewChemical] = useState({
    name: "",
    description: "",
    unit: "",
    quantity: "",
    expiryDate: "",
    supplier: "",
    batchId: ""
  });

  const fetchInventory = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/inventory/all?page=${page}&name=${search}`);
      setChemicals(response.data.inventory);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages
      });
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewChemical(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    fetchInventory();
  }, [search]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ 
        background: 'linear-gradient(135deg, #F5F9FD 0%, #E1F1FF 100%)',
        borderRadius: 2,
        p: 3,
        mb: 4,
        border: '1px solid #BCE0FD'
      }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#0B3861' }}>
          Chemical Inventory
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', border: '1px solid #BCE0FD' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#0B3861', mb: 2 }}>
                  Total Chemicals
                </Typography>
                <Typography variant="h3" sx={{ color: '#64B5F6' }}>
                  {chemicals.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%', border: '1px solid #BCE0FD' }}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={() => fetchInventory()}
                    sx={{
                      bgcolor: '#0B3861',
                      '&:hover': {
                        bgcolor: '#1E88E5',
                      },
                    }}
                  >
                    Refresh
                  </Button>
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
            onClick={() => fetchInventory(pagination.currentPage - 1)}
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
            onClick={() => fetchInventory(pagination.currentPage + 1)}
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
    </Container>
  );
};

export default InventoryPage;
