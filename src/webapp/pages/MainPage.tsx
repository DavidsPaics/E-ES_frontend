import React from 'react';
import { Card, Avatar, Tag, Progress, List, Typography, Badge } from 'antd';
import { TrophyOutlined, ThunderboltOutlined, CarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { fakeMainPageStats } from '@/webapp/data/fakeData';
import '@ant-design/v5-patch-for-react-19';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const MainPage: React.FC = () => {
  const stats = fakeMainPageStats;
  const { t } = useTranslation();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'finish': return '🏁';
      case 'start': return '🚀';
      case 'registration': return '📝';
      default: return '📌';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'processing';
      case 'Completed': return 'success';
      case 'Upcoming': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">{t('mainPage.header')}</h1>

      <div className="space-y-6">
          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white/20 backdrop-blur-md border-none">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#4EA9D5' }}>
                  <CarOutlined className="text-2xl text-white" />
                </div>
                <div>
                  <Text className="text-white/70 block">{t('mainPage.totalCompetitors')}</Text>
                  <Title level={2} className="!text-white !m-0">{stats.totalCompetitors}</Title>
                </div>
              </div>
            </Card>

            <Card className="bg-white/20 backdrop-blur-md border-none">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#5085B1' }}>
                  <ThunderboltOutlined className="text-2xl text-white" />
                </div>
                <div>
                  <Text className="text-white/70 block">{t('mainPage.activeRaces')}</Text>
                  <Title level={2} className="!text-white !m-0">{stats.activeRaces}</Title>
                </div>
              </div>
            </Card>

            <Card className="bg-white/20 backdrop-blur-md border-none">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#36598B' }}>
                  <TrophyOutlined className="text-2xl text-white" />
                </div>
                <div>
                  <Text className="text-white/70 block">{t('mainPage.completedRaces')}</Text>
                  <Title level={2} className="!text-white !m-0">{stats.completedRaces}</Title>
                </div>
              </div>
            </Card>

            <Card className="bg-white/20 backdrop-blur-md border-none">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#A6C1CC' }}>
                  <ClockCircleOutlined className="text-2xl text-white" />
                </div>
                <div>
                  <Text className="text-white/70 block">{t('mainPage.upcomingRaces')}</Text>
                  <Title level={2} className="!text-white !m-0">{stats.upcomingRaces}</Title>
                </div>
              </div>
            </Card>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Competitors */}
            <Card
              title={<span className="text-white">{t('mainPage.topCompetitors')}</span>}
              className="bg-white/20 backdrop-blur-md border-none"
              headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}
            >
              <List
                dataSource={stats.topCompetitors}
                renderItem={(item, index) => (
                  <List.Item className="!border-b-white/10">
                    <div className="flex items-center gap-4 w-full">
                      <div className="text-2xl font-bold text-white/60 w-8">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <Avatar src={item.avatar} size={48} />
                      <div className="flex-1">
                        <Text className="text-white block font-medium">{item.username}</Text>
                        <Text className="text-white/60 text-sm">ID: {item.id}</Text>
                      </div>
                      <div className="text-right">
                        <Text className="text-yellow-400 font-bold text-lg">{item.totalPoints}</Text>
                        <Text className="text-white/60 block text-sm">points</Text>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>

            {/* Recent Activity */}
            <Card
              title={<span className="text-white">{t('mainPage.recentActivity')}</span>}
              className="bg-white/20 backdrop-blur-md border-none"
              headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}
            >
              <List
                dataSource={stats.recentActivity}
                renderItem={(item) => (
                  <List.Item className="!border-b-white/10">
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-2xl">{getActivityIcon(item.type)}</span>
                      <div className="flex-1">
                        <Text className="text-white block">
                          <strong>{item.competitor}</strong>
                          {item.race && <span className="text-white/70"> • {item.race}</span>}
                        </Text>
                        <Text className="text-white/50 text-sm">{item.time}</Text>
                      </div>
                      <Tag color={item.type === 'finish' ? 'green' : item.type === 'start' ? 'blue' : 'default'}>
                        {item.type.toUpperCase()}
                      </Tag>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </div>

          {/* Race Status */}
          <Card
              title={<span className="text-white">{t('mainPage.raceStatus')}</span>}
            className="bg-white/20 backdrop-blur-md border-none"
            headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.raceStatus.map((race) => (
                <Card
                  key={race.name}
                  size="small"
                  className="bg-white/10 border-white/20"
                >
                  <div className="flex justify-between items-center mb-2">
                    <Text className="text-white font-medium">{race.name}</Text>
                    <Badge status={getStatusColor(race.status) as any} text={<span className="text-white/80">{race.status}</span>} />
                  </div>
                  {race.participants > 0 ? (
                    <>
                      <Progress
                        percent={Math.round((race.completed / race.participants) * 100)}
                        strokeColor={{ '0%': '#4EA9D5', '100%': '#5085B1' }}
                        trailColor="rgba(255,255,255,0.2)"
                      />
                      <Text className="text-white/60 text-sm">
                        {race.completed} / {race.participants} completed
                      </Text>
                    </>
                  ) : (
                    <Text className="text-white/50 italic">{t('mainPage.awaitingParticipants')}</Text>
                  )}
                </Card>
              ))}
            </div>
          </Card>
      </div>
    </div>
  );
};

export default MainPage;
