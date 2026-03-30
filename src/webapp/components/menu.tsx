import React from 'react';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/webapp/authentification/AuthContext';
import { useTranslation } from 'react-i18next';
type MenuItem = Required<MenuProps>['items'][number];

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const isWebappAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'lv' ? 'en' : 'lv');
  };

  const onClick: MenuProps['onClick'] = (e) => {
    switch (e.key) {
      case 'home':
        navigate('/app');
        break;
      case 'login':
        navigate('/signin');
        break;
      case 'leaderboard':
        navigate('/app/leaderboard');
        break;
      case 'admin':
        navigate('/app/admin');
        break;
      case 'logout':
        logout();
        break;
      case 'results':              
        navigate('/app/results');
        break; 
      case 'live-data':
        navigate('/app/live-data');
        break;
      case 'test':
        navigate('/app/test');
        break;
      case 'eko-race':
        navigate('/app/Category/EkoRace');
        break;
      case 'main-race':
        navigate('/app/Category/MainRace');
        break;
      case 'shuttle-run':
        navigate('/app/Category/ShuttleRun');
        break;
      case 'steering-test':
        navigate('/app/Category/SteeringTest');
        break;
      case 'drag-race':
        navigate('/app/Category/DragRace');
        break;
      case 'braking-test':
        navigate('/app/Category/BrakingTest');
        break;
      case 'scoring':
        navigate('/app/scoring');
        break;
      case 'race-configuration':
        navigate('/app/race-configuration');
        break;
      case 'points':
        navigate('/app/points');
        break;
      case 'palette':
        navigate('/app/palette');
        break;
      case 'news-admin':
        navigate('/app/news-admin');
        break;
      case 'website':
        navigate('/');
        break;
      case 'lang':
        toggleLanguage();
        break;
    }
  };

  const items: MenuItem[] = [
    {
      key: 'grp',
      label: t('nav.navigation'),
      type: 'submenu',
      children: [
        { key: 'home', label: t('nav.home') },
        { key: 'leaderboard', label: t('nav.leaderboard') },
        { key: 'results', label: t('nav.results') },
        { key: 'live-data', label: t('nav.liveData') },
        { key: 'test', label: t('nav.test') },
        { key: 'palette', label: t('nav.palette') },
        { key: 'login', label: t('nav.login'), disabled: isAuthenticated },
        isWebappAdmin && { key: 'admin', label: t('nav.admin') },
        isWebappAdmin && { key: 'news-admin', label: t('website.newsAdmin.header') },
        isAuthenticated && { key: 'logout', label: t('nav.logout') },
        isWebappAdmin && { key: 'scoring', label: t('nav.scoring') },
        isWebappAdmin && { key: 'race-configuration', label: t('nav.raceConfig') },
        isWebappAdmin && { key: 'eko-race', label: t('categories.efficiencyRace') },
        isWebappAdmin && { key: 'main-race', label: t('categories.finalRace') },
        isWebappAdmin && { key: 'shuttle-run', label: t('categories.shuttleRun') },
        isWebappAdmin && { key: 'steering-test', label: t('categories.figureDriving') },
        isWebappAdmin && { key: 'drag-race', label: t('categories.dragRace') },
        isWebappAdmin && { key: 'braking-test', label: t('categories.brakingTest') },
        isWebappAdmin && { key: 'points', label: t('nav.points') },
        { key: 'lang', label: t('nav.langSwitch') },
        { key: 'website', label: '← ' + t('website.nav.home') },
      ].filter(Boolean) as MenuItem[],
    },
  ];

  return (
<Menu
  onClick={onClick}
    className="backdrop-blur-sm rounded-lg shadow-md"
  style={{
    width: 200,
    backgroundColor: "rgba(10, 48, 109, 0.85)",
    borderRight: "none",
    color: "#FCFDFD",
  }}
  mode="inline"
  items={items}
/>

  );
};

export default MainMenu;
