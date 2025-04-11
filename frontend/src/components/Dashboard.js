import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Assignment as TaskIcon,
  AttachMoney as MoneyIcon,
  People as BrokerIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    totalCommission: 0,
    pendingCommission: 0,
    activeHelperBrokers: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [helperBrokers, setHelperBrokers] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [tasksRes, brokersRes] = await Promise.all([
          axios.get('/api/tasks/recent'),
          axios.get('/api/brokers/helpers')
        ]);

        setRecentTasks(tasksRes.data);
        setHelperBrokers(brokersRes.data);
        
        // Calculate stats
        const totalTasks = tasksRes.data.length;
        const totalCommission = tasksRes.data.reduce((sum, task) => 
          sum + (task.financialDetails?.adminCommission?.amount || 0), 0);
        const pendingCommission = tasksRes.data.reduce((sum, task) => 
          sum + (task.financialDetails?.adminCommission?.status === 'pending' ? task.financialDetails.adminCommission.amount : 0), 0);
        
        setStats({
          totalTasks,
          totalCommission,
          pendingCommission,
          activeHelperBrokers: brokersRes.data.filter(b => b.status === 'active').length
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          {icon}
          <Typography variant="h6" component="div" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" color={color}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tasks"
            value={stats.totalTasks}
            icon={<TaskIcon color="primary" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Commission"
            value={`₹${stats.totalCommission.toLocaleString()}`}
            icon={<MoneyIcon color="success" />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Commission"
            value={`₹${stats.pendingCommission.toLocaleString()}`}
            icon={<TrendingUpIcon color="warning" />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Helper Brokers"
            value={stats.activeHelperBrokers}
            icon={<BrokerIcon color="info" />}
            color="info.main"
          />
        </Grid>

        {/* Recent Tasks */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Tasks
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Task ID</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Admin Commission</TableCell>
                    <TableCell>Helper Broker</TableCell>
                    <TableCell>Due Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTasks.map((task) => (
                    <TableRow key={task._id}>
                      <TableCell>{task._id.slice(-6)}</TableCell>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>
                        <Chip
                          label={task.status}
                          color={
                            task.status === 'completed' ? 'success' :
                            task.status === 'in_progress' ? 'primary' :
                            'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          ₹{task.financialDetails?.adminCommission?.amount?.toLocaleString()}
                        </Typography>
                        <Chip
                          label={task.financialDetails?.adminCommission?.status || 'pending'}
                          color={task.financialDetails?.adminCommission?.status === 'paid' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {task.helperBroker ? (
                          <Box mb={1}>
                            <Typography variant="body2">
                              {task.helperBroker.broker.name} ({task.helperBroker.commission}%)
                            </Typography>
                            <Chip
                              label={task.helperBroker.status}
                              color={task.helperBroker.status === 'paid' ? 'success' : 'warning'}
                              size="small"
                            />
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No helper broker
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(task.timeline.endDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Helper Brokers */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Helper Brokers
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Commission Share</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Tasks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {helperBrokers.map((broker) => (
                    <TableRow key={broker._id}>
                      <TableCell>{broker.name}</TableCell>
                      <TableCell>{broker.companyName}</TableCell>
                      <TableCell>{broker.commissionStructure.defaultRate}%</TableCell>
                      <TableCell>
                        <Chip
                          label={broker.status}
                          color={broker.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{broker.financialSummary.totalTasks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 