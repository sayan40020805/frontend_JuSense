import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { io } from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import API_CONFIG from '../config/api';

const VotePoll = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [detailedVotes, setDetailedVotes] = useState([]);

  useEffect(() => {
    fetchPoll();
    checkIfVoted();
    fetchDetailedVotes();

    // Connect to WebSocket
    const socket = io(API_CONFIG.SOCKET_URL);
    socket.emit('join-poll', id);

    socket.on('poll-updated', (data) => {
      setPoll(data.poll);
    });

    return () => {
      socket.disconnect();
    };
  }, [id, token]);

  const fetchDetailedVotes = async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/votes/${id}/voters`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle your backend's response format
      const voterDetails = response.data.voterDetails || [];

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

      setDetailedVotes(voters);
    } catch (error) {
      console.error('Error fetching voter details:', error);
      // Don't show error to user, just set empty array
      setDetailedVotes([]);
    }
  };

  const fetchPoll = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.POLLS.GET(id)}`);
      setPoll(response.data.poll);
    } catch (error) {
      setError('Failed to fetch poll');
      console.error('Error fetching poll:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfVoted = async () => {
    if (!token) return;

    try {
      const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '[]');
      if (votedPolls.includes(id)) {
        setHasVoted(true);
      }
    } catch (error) {
      console.error('Error checking vote status:', error);
    }
  };

  const handleVote = async () => {
    if (selectedOption === null || hasVoted) return;

    setVoting(true);
    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VOTES.VOTE(id)}`, {
        optionIndex: selectedOption,
        name: user?.name || user?.username || user?.email || 'Anonymous'
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      setPoll(response.data.poll);
      setHasVoted(true);

      const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '[]');
      votedPolls.push(id);
      localStorage.setItem('votedPolls', JSON.stringify(votedPolls));

      fetchDetailedVotes();
    } catch (error) {
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.status === 500) {
        setError('A server error occurred. Please try again later.');
      } else {
        setError('Failed to submit vote');
      }
    } finally {
      setVoting(false);
    }
  };

  const getChartData = () => {
    if (!poll) return [];
    return pollOptions.map((option, index) => ({
      name: option.text,
      votes: option.votes || 0
    }));
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        Loading poll...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="error-message">
        <h3>Poll Not Found</h3>
        <p>Poll not found. It may have been deleted or does not exist.</p>
        <br />
        <Link to="/create-poll" className="create-poll-link">Create a new poll</Link> or go back to <Link to="/polls">your polls</Link>.
      </div>
    );
  }

  // Defensive: ensure poll.options is always an array
  const pollOptions = Array.isArray(poll.options) ? poll.options : [];

  // Determine if the logged-in user is the poll owner
  const isOwner = user && poll && (user._id === poll.owner || user.id === poll.owner || user.email === poll.ownerEmail);

  return (
    <div className="vote-poll-container">
      <div className="poll-header">
        <h2>{poll.question}</h2>
        <div className="poll-meta">
          <span>Total Votes: {poll.totalVotes || 0}</span>
          {poll.isPublic && <span className="public-badge">Public Poll</span>}
        </div>
      </div>

      <div className="poll-content">
        {!hasVoted ? (
          <div className="voting-section">
            <h3>Cast your vote:</h3>
            <div className="options-list">
              {pollOptions.map((option, index) => (
                <div key={index} className="option-item">
                  <label>
                    <input
                      type="radio"
                      name="vote"
                      value={index}
                      checked={selectedOption === index}
                      onChange={() => setSelectedOption(index)}
                    />
                    {option.text}
                  </label>
                </div>
              ))}
            </div>
            <button
              onClick={handleVote}
              disabled={selectedOption === null || voting}
              className="vote-button"
            >
              {voting ? 'Voting...' : 'Vote'}
            </button>
          </div>
        ) : (
          <div className="voted-message">
            <h3>Thank you for voting!</h3>
            <p>You have already voted on this poll.</p>
          </div>
        )}

        {isOwner && (
          <div className="results-section">
            <div className="owner-controls">
              <h3>Poll Results</h3>
              <Link to={`/poll/${id}/voters`} className="voter-details-link">
                👥 View Voter Details
              </Link>
            </div>
            {poll.totalVotes === 0 ? (
              <p>No votes yet. Be the first to vote!</p>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="votes" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="results-list">
              {pollOptions.map((option, index) => {
                const percentage = poll.totalVotes > 0
                  ? Math.round((option.votes / poll.totalVotes) * 100)
                  : 0;

                return (
                  <div key={index} className="result-item">
                    <span className="option-text">{option.text}</span>
                    <div className="result-bar">
                      <div
                        className="result-fill"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="result-stats">
                      {option.votes} votes ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>

            {isOwner && (
              <div className="detailed-voters-section" style={{ marginTop: '30px' }}>
                <h4>Who Voted for What:</h4>
                {detailedVotes.length > 0 ? (
                  pollOptions.map((option, index) => {
                    const votersForOption = detailedVotes.filter(
                      vote => vote.optionIndex === index
                    );
                    return (
                      <div key={index} className="option-voter-details" style={{ marginTop: '15px' }}>
                        <strong>{option.text} ({votersForOption.length} votes)</strong>
                        {votersForOption.length > 0 ? (
                          <ul style={{ listStyle: 'disc', marginLeft: '20px' }}>
                            {votersForOption.map((vote, voteIdx) => (
                              <li key={voteIdx}>{vote.name}</li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ fontStyle: 'italic', marginLeft: '20px', color: '#888' }}>No votes for this option.</p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p>Voter details are not available or no one has voted yet.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VotePoll;
