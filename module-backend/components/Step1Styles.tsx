
import React from 'react';
import { AGENTS as DEFAULT_AGENTS } from '../data/agents';
import { StyleAgent, UserRole } from '../types';
import { 
  Scroll, Axe, Pyramid, Cpu, Sword, Moon, Settings, Rocket, Zap, CheckCircle2,
  Gamepad2, Box, Fingerprint, Leaf, Shield, Minimize2, Microscope, Lock, Star
} from 'lucide-react';

interface Props {
  selectedAgentId: string | null;
  onSelect: (agent: StyleAgent) => void;
  agents?: StyleAgent[]; 
  userRole?: UserRole;
}

const Icons: Record<string, React.FC<any>> = {
  Scroll, Axe, Pyramid, Cpu, Sword, Moon, Settings, Rocket, Zap,
  Gamepad2, Box, Fingerprint, Leaf, Shield, Minimize2, Microscope
};

const Step1Styles: React.FC<Props> = ({ selectedAgentId, onSelect, agents, userRole = 'free' }) => {
  const displayAgents = agents || DEFAULT_AGENTS;

  // Logic phân quyền: 
  // Free: 3 styles đầu
  // Silver: 9 styles đầu
  // Gold/Admin: All
  const isAgentLocked = (index: number) => {
    if (userRole === 'admin' || userRole === 'gold') return false;
    if (userRole === 'silver') return index >= 9;
    return index >= 3; // free limit
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-3">Chọn Phong Cách Sáng Tác</h2>
        <div className="inline-block bg-gray-900 border border-gray-800 rounded-lg px-4 py-2">
          <p className="text-sm text-gray-400 flex items-center gap-2">
            {userRole === 'free' && (
              <>
                <Lock className="w-3 h-3 text-gray-500" /> 
                <span>Free Plan: Mở khóa <b className="text-white">3</b> Styles.</span>
              </>
            )}
            {userRole === 'silver' && (
              <>
                <Star className="w-3 h-3 text-blue-400" />
                <span>Silver Plan: Mở khóa <b className="text-white">9</b> Styles.</span>
              </>
            )}
            {(userRole === 'gold' || userRole === 'admin') && (
              <>
                <Star className="w-3 h-3 text-yellow-500" />
                <span>Gold Plan: <b className="text-white">Toàn bộ 16+</b> Styles đã sẵn sàng.</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayAgents.map((agent, index) => {
          const Icon = Icons[agent.iconName] || Scroll;
          const isSelected = selectedAgentId === agent.id;
          const locked = isAgentLocked(index);

          return (
            <div
              key={agent.id}
              onClick={() => !locked && onSelect(agent)}
              className={`
                relative group border rounded-xl p-6 transition-all duration-300 flex flex-col h-full select-none
                ${locked 
                  ? 'bg-gray-900/40 border-gray-800 opacity-60 cursor-not-allowed hover:bg-gray-900/40' 
                  : 'cursor-pointer hover:border-gray-600 hover:bg-gray-850'
                }
                ${isSelected 
                  ? 'bg-gray-800 border-primary-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] transform scale-105 z-10' 
                  : 'bg-gray-900 border-gray-800'}
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gray-800 border border-gray-700 ${locked ? 'text-gray-600' : agent.colorClass} bg-opacity-10`}>
                  <Icon className={`w-8 h-8 ${locked ? 'text-gray-600' : agent.colorClass}`} />
                </div>
                {isSelected && <CheckCircle2 className="w-6 h-6 text-primary-500" />}
                {locked && <Lock className="w-5 h-5 text-gray-600" />}
              </div>

              <h3 className={`text-xl font-bold mb-1 ${locked ? 'text-gray-500' : 'text-white'}`}>{agent.name}</h3>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${locked ? 'text-gray-600' : agent.colorClass}`}>
                {agent.tagline}
              </p>
              <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                {agent.description}
              </p>

              {!locked && (
                <div className="absolute inset-0 border-2 border-primary-500 rounded-xl opacity-0 scale-95 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:border-opacity-30"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Step1Styles;
