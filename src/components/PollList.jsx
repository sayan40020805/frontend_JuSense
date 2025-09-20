
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import API_CONFIG from '../config/api';

const PollList = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    fetchPolls();
  }, [token]);

  const fetchPolls = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.POLLS.LIST}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPolls(response.data.polls);
    } catch (error) {
      setError('Failed to fetch polls');
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const [copiedPollId, setCopiedPollId] = useState(null);

  const copyToClipboard = async (pollId) => {
    const shareUrl = `${window.location.origin}/poll/${pollId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedPollId(pollId);
      setTimeout(() => setCopiedPollId(null), 1500);
    } catch (error) {
      alert('Failed to copy link');
    }
  };

  return (
    <div className="poll-list-container">
      <h2>Your Polls</h2>
      {loading ? (
        <div className="loading">Loading polls...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : polls.length === 0 ? (
        <div className="no-polls">No polls found. Create your first poll!</div>
      ) : (
        <div className="poll-grid">
          {polls.map((poll) => {
            return (
              <div key={poll._id} className="poll-card">
                <h3>{poll.question}</h3>
                <div className="poll-meta">
                  <span>Created: {formatDate(poll.createdAt)}</span>
                  <span>Total Votes: {poll.totalVotes || 0}</span>

export default PollList;
                    <button
                      onClick={() => copyToClipboard(poll._id)}
                      className="share-link"
                      style={{ marginLeft: '8px' }}
                      title="Copy share link to clipboard"
                    >
                      {copiedPollId === poll._id ? '✅ Copied!' : '📋 Share'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  export default PollList;
