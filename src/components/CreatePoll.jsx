import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import API_CONFIG from '../config/api';

const CreatePoll = () => {
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', ''],
    isPublic: true
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('option')) {
      const index = parseInt(name.split('-')[1]);
      const newOptions = [...formData.options];
      newOptions[index] = value;
      setFormData({
        ...formData,
        options: newOptions
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const addOption = () => {
    if (formData.options.length < 4) {
      setFormData({
        ...formData,
        options: [...formData.options, '']
      });
    }
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        options: newOptions
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.question.trim()) {
      setError('Question is required');
      return;
    }

    const validOptions = formData.options.filter(option => option.trim());
    if (validOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.POLLS.CREATE}`, {
        question: formData.question,
        options: validOptions.map(text => ({ text })),
        isPublic: formData.isPublic
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      navigate('/polls');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-poll-container">
      <div className="create-poll-card">
        <h2>Create New Poll</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="question">Question</label>
            <input
              type="text"
              id="question"
              name="question"
              value={formData.question}
              onChange={handleChange}
              placeholder="What's your question?"
              required
            />
          </div>

          <div className="form-group">
            <label>Options</label>
            {formData.options.map((option, index) => (
              <div key={index} className="option-input">
                <input
                  type="text"
                  name={`option-${index}`}
                  value={option}
                  onChange={handleChange}
                  placeholder={`Option ${index + 1}`}
                  required
                />
                {formData.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="remove-option"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {formData.options.length < 4 && (
              <button type="button" onClick={addOption} className="add-option">
                Add Option
              </button>
            )}
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
              />
              Public Poll (anyone with the link can vote)
            </label>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Creating Poll...' : 'Create Poll'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePoll;
