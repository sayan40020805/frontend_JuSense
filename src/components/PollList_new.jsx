import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import API_CONFIG from '../config/api';

const PollList = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedPollId, setCopiedPollId] = useState(null);
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

  const copyToClipboard = async (pollId) => {
    const shareUrl = `${API_CONFIG.FRONTEND_URL}/poll/${pollId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedPollId(pollId);
      setTimeout(() => setCopiedPollId(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedPollId(pollId);
      setTimeout(() => setCopiedPollId(null), 2000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading polls...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="poll-list-container">
      <div className="poll-list-header">
        <h2>My Polls</h2>
        <Link to="/create-poll" className="create-poll-button">
          Create New Poll
        </Link>
      </div>

      {polls.length === 0 ? (
        <div className="no-polls">
          <p>You haven't created any polls yet.</p>
          <Link to="/create-poll" className="create-poll-button">
            Create Your First Poll
          </Link>
        </div>
      ) : (
        <div className="poll-grid">
          {polls.map((poll) => (
            <div key={poll._id} className="poll-card">
              <h3>{poll.question}</h3>
              <div className="poll-meta">
                <span>Created: {formatDate(poll.createdAt)}</span>
                <span>Total Votes: {poll.totalVotes || 0}</span>
              </div>
              <div className="poll-actions">
                <Link to={`/poll/${poll._id}`} className="view-poll-button">
                  View Poll
                </Link>
                <button
                  onClick={() => copyToClipboard(poll._id)}
                  className={`share-button ${copiedPollId === poll._id ? 'copied' : ''}`}
                  title="Copy share link to clipboard"
                >
                  {copiedPollId === poll._id ? '✅ Copied!' : '📋 Share'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PollList;
