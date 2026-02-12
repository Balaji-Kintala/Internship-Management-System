import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeams: 0,
    totalTasks: 0,
    totalExams: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, teamsRes, tasksRes, examsRes] = await Promise.all([
        axios.get('/users'),
        axios.get('/teams'),
        axios.get('/tasks'),
        axios.get('/exams')
      ]);

      setStats({
        totalUsers: usersRes.data.count,
        totalTeams: teamsRes.data.count,
        totalTasks: tasksRes.data.count,
        totalExams: examsRes.data.count
      });

      setRecentUsers(usersRes.data.users.slice(0, 5));
      setRecentTasks(tasksRes.data.tasks.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      active: 'success',
      qualified: 'success',
      disqualified: 'danger',
      completed: 'info',
      'in-progress': 'primary',
      review: 'info'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Admin Dashboard</h2>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="dashboard-card">
            <Card.Body>
              <h6 className="text-muted mb-2">Total Users</h6>
              <h2 className="mb-0">{stats.totalUsers}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-card success">
            <Card.Body>
              <h6 className="text-muted mb-2">Total Teams</h6>
              <h2 className="mb-0">{stats.totalTeams}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-card warning">
            <Card.Body>
              <h6 className="text-muted mb-2">Total Tasks</h6>
              <h2 className="mb-0">{stats.totalTasks}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-card danger">
            <Card.Body>
              <h6 className="text-muted mb-2">Total Exams</h6>
              <h2 className="mb-0">{stats.totalExams}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Recent Users</h5>
            </Card.Header>
            <Card.Body>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{getStatusBadge(user.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Recent Tasks</h5>
            </Card.Header>
            <Card.Body>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map(task => (
                    <tr key={task._id}>
                      <td>{task.title}</td>
                      <td>
                        <Badge bg={
                          task.priority === 'urgent' ? 'danger' :
                          task.priority === 'high' ? 'warning' :
                          task.priority === 'medium' ? 'info' : 'secondary'
                        }>
                          {task.priority}
                        </Badge>
                      </td>
                      <td>{getStatusBadge(task.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default AdminDashboard;
