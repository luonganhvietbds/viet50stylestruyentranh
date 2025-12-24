
import { useState, useEffect, useCallback, useRef } from 'react';
import { StyleAgent } from '../types';
import { AGENTS as DEFAULT_AGENTS } from '../data/agents';
import { getAgentsFromCloud } from '../services/db';

export function useAgents(currentUid: string | undefined) {
  const [agentsList, setAgentsList] = useState<StyleAgent[]>(DEFAULT_AGENTS);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!currentUid) return;

    const loadAgents = async () => {
      try {
        const cloudAgents = await getAgentsFromCloud();
        if (isMounted.current) {
          setAgentsList(cloudAgents);
        }
      } catch (e) {
        console.error("Failed to load agents", e);
        // Fallback to default is automatic via initial state
      }
    };
    loadAgents();
  }, [currentUid]);

  const updateAgentsList = useCallback((newAgents: StyleAgent[]) => {
    setAgentsList(newAgents);
  }, []);

  return {
    agentsList,
    updateAgentsList
  };
}
