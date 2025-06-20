import React from 'react';
import ChemicalStockLevels from '../charts/ChemicalStockLevels';
import ReorderAlertTile from '../tiles/ReorderAlertTile';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Divider
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

const InventoryOverviewSection = ({ inventory, reorderLevels }) => {
  return (
    <Box sx={{
      background: 'linear-gradient(135deg, #F5F9FD 0%, #E1F1FF 100%)',
      borderRadius: 2,
      p: 3,
      border: '1px solid #BCE0FD'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon sx={{ color: '#0B3861' }} />
          <Typography variant="h5" sx={{ color: '#0B3861', fontWeight: 600 }}>
            Inventory Overview
          </Typography>
        </Box>
        <Typography variant="subtitle2" sx={{ color: '#64B5F6' }}>
          {inventory.length} chemicals in stock
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ 
            height: '100%', 
            border: '1px solid #BCE0FD',
            background: '#FFFFFF'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#0B3861', mb: 2 }}>
                Stock Levels Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ChemicalStockLevels 
                  data={inventory} 
                  reorderLevels={reorderLevels}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card sx={{ 
                border: '1px solid #BCE0FD',
                background: '#FFFFFF'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <WarningIcon sx={{ color: '#0B3861' }} />
                    <Typography variant="h6" sx={{ color: '#0B3861' }}>
                      Stock Alerts
                    </Typography>
                  </Box>
                  <ReorderAlertTile 
                    chemicals={inventory.filter(c => c.quantity <= c.reorderLevel)}
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card sx={{ 
                border: '1px solid #BCE0FD',
                background: '#FFFFFF'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AssessmentIcon sx={{ color: '#0B3861' }} />
                    <Typography variant="h6" sx={{ color: '#0B3861' }}>
                      Quick Actions
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
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

export default InventoryOverviewSection;