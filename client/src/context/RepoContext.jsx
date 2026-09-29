import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const RepoContext = createContext();

export const RepoProvider = ({ children }) => {
  const [repositories, setRepositories] = useState([]);
  const [activeRepo, setActiveRepo] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      const res = await API.get('/repos');
      if (res.success) {
        setRepositories(res.data.repos);
        if (res.data.repos.length > 0 && !activeRepo) {
          setActiveRepo(res.data.repos[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch repositories:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const createRepository = async (repoData) => {
    const res = await API.post('/repos', repoData);
    if (res.success) {
      await fetchRepositories();
      setActiveRepo(res.data.repo);
    }
    return res;
  };

  const indexRepository = async (repoId, customFiles = null) => {
    const payload = customFiles ? { files: customFiles } : {};
    const res = await API.post(`/repos/${repoId}/index`, payload);
    if (res.success) {
      await fetchRepositories();
      if (activeRepo && activeRepo._id === repoId) {
        setActiveRepo(res.data.repo);
      }
    }
    return res;
  };

  const deleteRepository = async (repoId) => {
    const res = await API.delete(`/repos/${repoId}`);
    if (res.success) {
      if (activeRepo && activeRepo._id === repoId) {
        setActiveRepo(null);
      }
      await fetchRepositories();
    }
    return res;
  };

  return (
    <RepoContext.Provider
      value={{
        repositories,
        activeRepo,
        setActiveRepo,
        loading,
        fetchRepositories,
        createRepository,
        indexRepository,
        deleteRepository,
      }}
    >
      {children}
    </RepoContext.Provider>
  );
};

export const useRepo = () => useContext(RepoContext);
