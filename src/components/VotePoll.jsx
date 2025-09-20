import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [voters, setVoters] = useState([]);

  useEffect(() => {
    fetchPoll();
    checkIfVoted();
    fetchVoters();

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

  const fetchVoters = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/votes/${id}/voters`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setVoters(response.data.voters || []);
    } catch (error) {
      setVoters([]);
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

      fetchVoters();
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
    return <div className="loading">Loading poll...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!poll) {
    return (
      <div className="error-message">
        Poll not found.<br />
        It may have been deleted or does not exist.<br />
        <a href="/create-poll" className="create-poll-link">Create a new poll</a> or go back to <a href="/polls">your polls</a>.
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
        {isOwner && (
          <div className="voters-section">
            <h4>Voters:</h4>
            {voters.length === 0 ? (
              <p>No one has voted yet.</p>
            ) : (
              <ul>
                {voters.map((voter, idx) => (
                  <li key={idx}>{voter}</li>
                ))}
              </ul>
            )}
          </div>
        )}
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
            <h3>Results:</h3>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default VotePoll;