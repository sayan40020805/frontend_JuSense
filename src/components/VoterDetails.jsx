import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import API_CONFIG from '../config/api';

const VoterDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [poll, setPoll] = useState(null);
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchVoterDetails();
  }, [id, token, navigate]);

  const fetchVoterDetails = async () => {
    try {
      // First get the poll to verify ownership
      const pollResponse = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.POLLS.GET(id)}`);
      const pollData = pollResponse.data.poll;

      // Check if user is the owner
      const isOwner = user && pollData && (user._id === pollData.owner || user.id === pollData.owner || user.email === pollData.ownerEmail);

      if (!isOwner) {
        setError('Access denied. Only poll owners can view voter details.');
        setLoading(false);
        return;
      }

      setPoll(pollData);

      // Get detailed voter information
      const votersResponse = await axios.get(`${API_CONFIG.BASE_URL}/api/votes/${id}/voters`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle your backend's response format
      const voterDetails = votersResponse.data.voterDetails || [];
      const totalVotes = votersResponse.data.totalVotes || 0;

      // Convert to the format expected by the component
      const voters = [];
      voterDetails.forEach((detail, detailIndex) => {
        detail.voters.forEach(voterName => {
          voters.push({
            name: voterName,
            optionIndex: detailIndex
          });
        });
      });

      setVoters(voters);
    } catch (error) {
      if (error.response?.status === 403) {
        setError('Access denied. Only poll owners can view voter details.');
      } else {
        setError('Failed to fetch voter details');
      }
      console.error('Error fetching voter details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        Loading voter details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <h3>Access Error</h3>
        <p>{error}</p>
        <Link to={`/poll/${id}`} className="back-button">
          ← Back to Poll
        </Link>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="error-message">
        <h3>Poll Not Found</h3>
        <p>The poll you're looking for doesn't exist.</p>
        <Link to="/polls" className="back-button">
          ← Back to My Polls
        </Link>
      </div>
    );
  }

  const getVotersByOption = () => {
    const votersByOption = {};
    poll.options.forEach((option, index) => {
      votersByOption[index] = voters.filter(voter => voter.optionIndex === index);
    });
    return votersByOption;
  };

  const votersByOption = getVotersByOption();
  const totalVoters = voters.length;

  return (
    <div className="voter-details-container">
      <div className="voter-details-header">
        <h2>Voter Details</h2>
        <div className="poll-info">
          <h3>{poll.question}</h3>
          <div className="poll-stats">
            <span className="total-votes">Total Votes: {totalVoters}</span>
            <Link to={`/poll/${id}`} className="back-link">
              ← Back to Poll
            </Link>
          </div>
        </div>
      </div>

      <div className="voters-summary">
        <div className="summary-cards">
          {poll.options.map((option, index) => {
            const optionVoters = votersByOption[index] || [];
            const percentage = totalVoters > 0 ? Math.round((optionVoters.length / totalVoters) * 100) : 0;

            return (
              <div key={index} className="summary-card">
                <div className="option-header">
                  <h4>{option.text}</h4>
                  <div className="option-stats">
                    <span className="voter-count">{optionVoters.length} votes</span>
                    <span className="percentage">{percentage}%</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="detailed-voters">
        <h3>Individual Votes</h3>
        {totalVoters === 0 ? (
          <div className="no-votes">
            <p>No one has voted on this poll yet.</p>
          </div>
        ) : (
          <div className="voters-grid">
            {poll.options.map((option, index) => {
              const optionVoters = votersByOption[index] || [];

              if (optionVoters.length === 0) {
                return (
                  <div key={index} className="option-voters">
                    <h4 className="option-title">{option.text}</h4>
                    <p className="no-voters">No votes for this option</p>
                  </div>
                );
              }

              return (
                <div key={index} className="option-voters">
                  <h4 className="option-title">{option.text}</h4>
                  <div className="voters-list">
                    {optionVoters.map((voter, voterIndex) => (
                      <div key={voterIndex} className="voter-item">
                        <div className="voter-avatar">
                          {voter.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="voter-name">{voter.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoterDetails;
