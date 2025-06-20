import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Science as BeakerIcon,
  Warning as ExclamationCircleIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import LabInventoryChart from '../charts/LabInventoryChart';

const LabInventoryStatusSection = ({ inventory, labId }) => {
  const criticalItems = inventory.filter(item => item.quantity <= item.reorderLevel);

  return (
    <Box sx={{
      background: 'linear-gradient(135deg, #F5F9FD 0%, #E1F1FF 100%)',
      borderRadius: 2,
      p: 3,
      border: '1px solid #BCE0FD'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#0B3861', fontWeight: 600 }}>
          {labId} Inventory Status
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BeakerIcon sx={{ color: '#64B5F6', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ color: '#0B3861' }}>
            {inventory.length} chemicals in inventory
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ 
            height: '100%', 
            border: '1px solid #BCE0FD',
            background: '#FFFFFF'
          }}>
            <CardContent>
              <Box sx={{ height: 300 }}>
                <LabInventoryChart inventory={inventory} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              {criticalItems.length > 0 ? (
                <Card sx={{ 
                  border: '1px solid #BCE0FD',
                  background: '#FFFFFF'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <ExclamationCircleIcon sx={{ color: '#f44336' }} />
                      <Typography variant="h6" sx={{ color: '#0B3861' }}>
                        Critical Stock Levels
                      </Typography>
                    </Box>
                    <List dense>
                      {criticalItems.slice(0, 3).map(item => (
                        <ListItem key={item._id}>
                          <ListItemText
                            primary={item.chemicalName}
                            secondary={`Only ${item.quantity} ${item.unit} remaining`}
                            primaryTypographyProps={{ sx: { color: '#0B3861' } }}
                            secondaryTypographyProps={{ sx: { color: '#64B5F6' } }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    {criticalItems.length > 3 && (
                      <Typography variant="caption" sx={{ color: '#f44336', display: 'block', mt: 1 }}>
                        + {criticalItems.length - 3} more at critical levels
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card sx={{ 
                  border: '1px solid #BCE0FD',
                  background: '#FFFFFF'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CheckCircleIcon sx={{ color: '#4caf50' }} />
                      <Typography variant="h6" sx={{ color: '#0B3861' }}>
                        Stock Levels Healthy
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#64B5F6' }}>
                      No chemicals at critical levels
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Card sx={{ 
                border: '1px solid #BCE0FD',
                background: '#FFFFFF'
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#0B3861', mb: 2 }}>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<AddIcon />}
                      sx={{
                        borderColor: '#BCE0FD',
                        color: '#0B3861',
                        justifyContent: 'flex-start',
                        '&:hover': {
                          borderColor: '#64B5F6',
                          bgcolor: '#F5F9FD',
                        },
                      }}
                    >
                      Request New Stock
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      sx={{
                        borderColor: '#BCE0FD',
                        color: '#0B3861',
                        justifyContent: 'flex-start',
                        '&:hover': {
                          borderColor: '#64B5F6',
                          bgcolor: '#F5F9FD',
                        },
                      }}
                    >
                      View Expiring Soon
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ReportIcon />}
                      sx={{
                        borderColor: '#BCE0FD',
                        color: '#0B3861',
                        justifyContent: 'flex-start',
                        '&:hover': {
                          borderColor: '#64B5F6',
                          bgcolor: '#F5F9FD',
                        },
                      }}
                    >
                      Generate Usage Report
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LabInventoryStatusSection;