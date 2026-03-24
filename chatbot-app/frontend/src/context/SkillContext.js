import React, { createContext, useContext, useState, useEffect } from 'react';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './Skill.css';

const SkillContext = createContext();

export const useSkill = () => {
  const context = useContext(SkillContext);
  if (!context) {
    throw new Error('useSkill must be used within a SkillProvider');
  }
  return context;
};

export const SkillProvider = ({ children }) => {
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize skill
    const initSkill = async () => {
      try {
        setLoading(true);
        // Simulate skill loading
        await new Promise(resolve => setTimeout(null, setLoading(false), 500));
      } catch (err) {
        setError('Failed to load skill');
        setLoading(false);
      }
    };

  }, []);

  const toggleSkill = () => setSkill(prev => !prev);

  const checkSkillStatus = () => {
    return skill;
  };

  const skillName = () => {
    return skill?.name || 'Unknown Skill';
  };

  const skillDescription = () => {
    return skill?.description || 'No description available';
  };

  const skillIcon = () => {
    return skill?.icon || '🔧';
  };

  return (
    <SkillContext.Provider value={{ skill, toggleSkill, skillName, skillDescription, skillIcon, loading, error }}>
      {children}
    </SkillContext.Provider>
  );
};
