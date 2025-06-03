import React from 'react';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/authentification/AuthContext';
type MenuItem = Required<MenuProps>['items'][number];

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const onClick: MenuProps['onClick'] = (e) => {
    switch (e.key) {
      case 'home':
        navigate('/');
        break;
      case 'login':
        navigate('/login');
        break;
      case 'leaderboard':
        navigate('/leaderboard');
        break;
      case 'admin':
        navigate('/admin');
        break;
      case 'logout':
        logout();
        break;
      case 'results':              
        navigate('/results');
        break; 
      case 'live-data':
        navigate('/live-data');
        break;
      case 'test':
        navigate('/test');
        break;
      case 'eko-race':
        navigate('/Category/EkoRace');
        break;
      case 'main-race':
        navigate('/Category/MainRace');
        break;
      case 'shuttle-run':
        navigate('/Category/ShuttleRun');
        break;
      case 'steering-test':
        navigate('/Category/SteeringTest');
        break;
      case 'drag-race':
        navigate('/Category/DragRace');
        break;
      case 'braking-test':
        navigate('/Category/BrakingTest');
        break;
      case 'scoring':
        navigate('/scoring');
        break;
    }
  };

  const items: MenuItem[] = [
    {
      key: 'grp',
      label: 'Navigation',
      type: 'submenu',
      children: [
        { key: 'home', label: '🏠 Home' },
        { key: 'leaderboard', label: '🏆 Leaderboard' },
        { key: 'results',     label: '📈 Results' },
        { key: 'live-data', label: '📊 Live Data' },
        { key: 'test', label: '🧪 Test' },
        { key: 'login', label: '🔑 Login', disabled: isAuthenticated },
        { key: 'eko-race', label: '🏁 Eko Race' },
        { key: 'main-race', label: '🏁 Main Race' },
        { key: 'shuttle-run', label: '🏁 Shuttle Run' },
        { key: 'steering-test', label: '🏁 Steering Test' },
        { key: 'drag-race', label: '🏁 Drag Race' },
        { key: 'braking-test', label: '🏁 Braking Test' },
        { key: 'scoring', label: '📊 Scoring' },
        isAuthenticated && { key: 'admin', label: '⚙️ Admin Panel' },
        isAuthenticated && { key: 'logout', label: '🚪 Logout' },
      ].filter(Boolean) as MenuItem[], // remove nulls
    },
  ];

  return (
<Menu
  onClick={onClick}
    className="bg-white/60 backdrop-blur-sm rounded-lg shadow-md text-black"
  style={{
    width: 200,
    backgroundColor: "rgba(255, 255, 255, 0.4)", 
    borderRight: "none",
  }}
  mode="inline"
  items={items}
/>

  );
};

export default MainMenu;
