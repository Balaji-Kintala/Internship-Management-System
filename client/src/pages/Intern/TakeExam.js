import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import axios from 'axios';

function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchExam();
  }, [id]);

  useEffect(() => {
    if (timeRemaining > 0 && !submitted) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && exam && !submitted) {
      handleSubmit();
    }
  }, [timeRemaining, submitted]);

  const fetchExam = async () => {
    try {
      const response = await axios.get(`/exams/${id}`);
      setExam(response.data.exam);
      setTimeRemaining(response.data.exam.duration * 60);
      setAnswers(new Array(response.data.exam.questions.length).fill(''));
    } catch (error) {
      setError('Error fetching exam');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, answer) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (submitted) return;

    try {
      const formattedAnswers = answers.map((answer, index) => ({
        questionIndex: index,
        answer: answer
      }));

      const response = await axios.post(`/exams/${id}/attempt`, {
        answers: formattedAnswers
      });

      setResult(response.data.result);
      setSubmitted(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Error submitting exam');
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="text-center py-5">
        <Card className="mx-auto" style={{ maxWidth: '600px' }}>
          <Card.Body>
            <h2 className="mb-4">Exam Completed!</h2>
            
            <div className="mb-4">
              <h1 className={result.passed ? 'text-success' : 'text-danger'}>
                {result.percentage.toFixed(1)}%
              </h1>
              <p className="text-muted">
                Score: {result.score} / {result.totalPoints}
              </p>
            </div>

            <Alert variant={result.passed ? 'success' : 'danger'}>
              {result.passed ? (
                <>
                  <h5>Congratulations! 🎉</h5>
                  <p className="mb-0">You have passed the exam and qualified for the internship!</p>
                </>
              ) : (
                <>
                  <h5>Not Passed</h5>
                  <p className="mb-0">Unfortunately, you did not meet the passing score. Keep learning and try again!</p>
                </>
              )}
            </Alert>

            <Button variant="primary" onClick={() => navigate('/intern')}>
              Back to Dashboard
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{exam?.title}</h2>
        <div>
          <Badge bg={timeRemaining < 300 ? 'danger' : 'primary'} className="fs-5">
            Time: {formatTime(timeRemaining)}
          </Badge>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {exam?.description && (
        <Card className="mb-4">
          <Card.Body>
            <p className="mb-0">{exam.description}</p>
          </Card.Body>
        </Card>
      )}

      <Form onSubmit={handleSubmit}>
        {exam?.questions.map((question, index) => (
          <Card key={index} className="exam-question mb-4">
            <h5 className="mb-3">
              Question {index + 1} <Badge bg="info">{question.points} pts</Badge>
            </h5>
            <p className="mb-3">{question.question}</p>

            {question.type === 'multiple-choice' && (
              <div>
                {question.options.map((option, optIndex) => (
                  <Form.Check
                    key={optIndex}
                    type="radio"
                    id={`q${index}-opt${optIndex}`}
                    name={`question-${index}`}
                    label={option}
                    value={option}
                    checked={answers[index] === option}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className="mb-2"
                  />
                ))}
              </div>
            )}

            {question.type === 'true-false' && (
              <div>
                <Form.Check
                  type="radio"
                  id={`q${index}-true`}
                  name={`question-${index}`}
                  label="True"
                  value="True"
                  checked={answers[index] === 'True'}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  id={`q${index}-false`}
                  name={`question-${index}`}
                  label="False"
                  value="False"
                  checked={answers[index] === 'False'}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                />
              </div>
            )}

            {question.type === 'short-answer' && (
              <Form.Control
                type="text"
                value={answers[index]}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder="Type your answer here..."
              />
            )}
          </Card>
        ))}

        <div className="text-center">
          <Button variant="success" type="submit" size="lg">
            Submit Exam
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default TakeExam;
