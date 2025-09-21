import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import API_CONFIG from '../config/api';

const PollList = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, token } = useAuth();

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

  // Check if user is owner of the poll
  const isPollOwner = (poll) => {
    return user && poll && (user._id === poll.owner || user.id === poll.owner || user.email === poll.ownerEmail);
  };

  return (
    <div className="poll-list-container">
      <div className="poll-list-header">
        <h2>Your Polls</h2>
        <Link to="/create-poll" className="create-poll-button">
          + Create New Poll
        </Link>
      </div>

      {loading ? (
        <div className="loading">Loading polls...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : polls.length === 0 ? (
        <div className="no-polls">
          <p>No polls found. Create your first poll!</p>
          <Link to="/create-poll" className="create-poll-link">
            Create Poll
          </Link>
        </div>
      ) : (
        <div className="poll-grid">
          {polls.map((poll) => {
            const owner = isPollOwner(poll);

            return (
              <div key={poll._id} className="poll-card">
                <div className="poll-header">
                  <h3>{poll.question}</h3>
                  {poll.isPublic && <span className="public-badge">Public</span>}
                </div>

                <div className="poll-meta">
                  <span>Created: {formatDate(poll.createdAt)}</span>
                  <span>Total Votes: {poll.totalVotes || 0}</span>
                </div>

                <div className="poll-actions">
                  <button
                    onClick={() => copyToClipboard(poll._id)}
                    className="share-button"
                    title="Copy share link to clipboard"
                  >
                    {copiedPollId === poll._id ? '✅ Copied!' : '📋 Share'}
                  </button>

                  {owner && (
                    <Link
                      to={`/poll/${poll._id}/voters`}
                      className="voter-details-button"
                      title="View who voted for each option"
                    >
                      👥 Voter Details
                    </Link>
                  )}
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
