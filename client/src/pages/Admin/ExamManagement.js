import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Badge, Spinner, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';

function ExamManagement() {
  const [exams, setExams] = useState([]);
  const [teams, setTeams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    team: '',
    duration: 60,
    passingScore: 70,
    questions: [{ question: '', type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: '', points: 1 }]
  });

  useEffect(() => {
    fetchExams();
    fetchTeams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await axios.get('/exams');
      setExams(response.data.exams || []);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.log('Error fetching exams:', error);
      setExams([]);
      // Don't show error for fetch failures
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/teams');
      setTeams(response.data.teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post('/exams', formData);
      setShowModal(false);
      resetForm();
      fetchExams();
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating exam');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await axios.delete(`/exams/${id}`);
        fetchExams();
      } catch (error) {
        setError('Error deleting exam');
      }
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { question: '', type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: '', points: 1 }]
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index][field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      team: '',
      duration: 60,
      passingScore: 70,
      questions: [{ question: '', type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: '', points: 1 }]
    });
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Exam Management</h2>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          Create New Exam
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Title</th>
                <th>Team</th>
                <th>Questions</th>
                <th>Duration</th>
                <th>Passing Score</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(exam => (
                <tr key={exam._id}>
                  <td><strong>{exam.title}</strong></td>
                  <td>{exam.team?.name || 'All Teams'}</td>
                  <td><Badge bg="info">{exam.questions?.length || 0}</Badge></td>
                  <td>{exam.duration} min</td>
                  <td>{exam.passingScore}%</td>
                  <td>
                    <Badge bg={exam.isActive ? 'success' : 'secondary'}>
                      {exam.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td><Badge bg="primary">{exam.attempts?.length || 0}</Badge></td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="me-2"
                      href={`/admin/exams/${exam._id}/results`}
                    >
                      Results
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(exam._id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Create New Exam</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Exam Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Team</Form.Label>
                  <Form.Select
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  >
                    <option value="">All Teams</option>
                    {teams.map(team => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Duration (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Passing Score (%)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.passingScore}
                    onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <hr />
            <h5>Questions</h5>

            {formData.questions.map((question, qIndex) => (
              <Card key={qIndex} className="mb-3">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6>Question {qIndex + 1}</h6>
                    {formData.questions.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => removeQuestion(qIndex)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label>Question Text</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={question.question}
                      onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Type</Form.Label>
                        <Form.Select
                          value={question.type}
                          onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                        >
                          <option value="multiple-choice">Multiple Choice</option>
                          <option value="true-false">True/False</option>
                          <option value="short-answer">Short Answer</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Points</Form.Label>
                        <Form.Control
                          type="number"
                          value={question.points}
                          onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {question.type === 'multiple-choice' && (
                    <>
                      <Form.Label>Options</Form.Label>
                      {question.options.map((option, oIndex) => (
                        <Form.Group key={oIndex} className="mb-2">
                          <Form.Control
                            type="text"
                            placeholder={`Option ${oIndex + 1}`}
                            value={option}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            required
                          />
                        </Form.Group>
                      ))}
                    </>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Label>Correct Answer</Form.Label>
                    <Form.Control
                      type="text"
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                      required
                    />
                  </Form.Group>
                </Card.Body>
              </Card>
            ))}

            <Button variant="outline-primary" onClick={addQuestion} className="mb-3">
              + Add Question
            </Button>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Create Exam
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default ExamManagement;
