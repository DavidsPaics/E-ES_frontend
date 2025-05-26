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
