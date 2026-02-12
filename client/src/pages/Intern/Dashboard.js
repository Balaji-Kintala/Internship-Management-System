import React, { useState, useEffect, useContext } from 'react';
import { Card, Row, Col, Table, Badge, Spinner, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

function InternDashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    examsTaken: 0
  });
  const [myTasks, setMyTasks] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, examsRes] = await Promise.all([
        axios.get('/tasks'),
        axios.get('/exams')
      ]);

      const tasks = tasksRes.data.tasks;
      setStats({
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        examsTaken: user?.examTaken ? 1 : 0
      });

      setMyTasks(tasks.slice(0, 5));
      setExams(examsRes.data.exams.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      'in-progress': 'primary',
      review: 'info',
      completed: 'success',
      cancelled: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      urgent: 'danger',
      high: 'warning',
      medium: 'info',
      low: 'secondary'
    };
    return <Badge bg={variants[priority]}>{priority}</Badge>;
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const completionPercentage = stats.totalTasks > 0 
    ? (stats.completedTasks / stats.totalTasks) * 100 
    : 0;

  return (
    <div>
      <h2 className="mb-4">Welcome, {user?.name}!</h2>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="dashboard-card">
            <Card.Body>
              <h6 className="text-muted mb-2">Total Tasks</h6>
              <h2 className="mb-0">{stats.totalTasks}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-card success">
            <Card.Body>
              <h6 className="text-muted mb-2">Completed</h6>
              <h2 className="mb-0">{stats.completedTasks}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-card warning">
            <Card.Body>
              <h6 className="text-muted mb-2">Pending</h6>
              <h2 className="mb-0">{stats.pendingTasks}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-card danger">
            <Card.Body>
              <h6 className="text-muted mb-2">Exam Score</h6>
              <h2 className="mb-0">{user?.examScore || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Task Completion Progress</h5>
              <ProgressBar 
                now={completionPercentage} 
                label={`${completionPercentage.toFixed(0)}%`}
                variant="success"
                style={{ height: '30px' }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">My Recent Tasks</h5>
            </Card.Header>
            <Card.Body>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {myTasks.map(task => (
                    <tr key={task._id}>
                      <td><strong>{task.title}</strong></td>
                      <td>{getPriorityBadge(task.priority)}</td>
                      <td>{getStatusBadge(task.status)}</td>
                      <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Available Exams</h5>
            </Card.Header>
            <Card.Body>
              {exams.length > 0 ? (
                exams.map(exam => (
                  <Card key={exam._id} className="mb-3">
                    <Card.Body>
                      <h6>{exam.title}</h6>
                      <p className="text-muted small mb-2">{exam.description}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <Badge bg="info">{exam.duration} min</Badge>
                        <Badge bg={exam.isActive ? 'success' : 'secondary'}>
                          {exam.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <p className="text-muted">No exams available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default InternDashboard;
