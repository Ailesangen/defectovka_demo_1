import React, { useState } from 'react';
import { Layout, Select, Space, Typography, Tag } from 'antd';
import MasterView from './MasterView';
import WorkerView from './WorkerView';

const { Header, Content } = Layout;

export const OBJECTS = [
  {
    id: 1,
    name: 'ВЛ-10кВ Линия-01',
    locations: [
      { id: '1-1', name: 'Опора №1' },
      { id: '1-2', name: 'Пролет 1-2' },
      { id: '1-3', name: 'Опора №2' },
      { id: '1-4', name: 'Пролет 2-3' },
      { id: '1-5', name: 'Опора №3' },
    ],
  },
  {
    id: 2,
    name: 'ВЛ-10кВ Линия-02',
    locations: [
      { id: '2-1', name: 'Опора №1' },
      { id: '2-2', name: 'Пролет 1-2' },
      { id: '2-3', name: 'Опора №2' },
      { id: '2-4', name: 'Пролет 2-3' },
      { id: '2-5', name: 'Опора №3' },
    ],
  },
  {
    id: 3,
    name: 'ВЛ-6кВ Фидер-05',
    locations: [
      { id: '3-1', name: 'Опора №1' },
      { id: '3-2', name: 'Пролет 1-2' },
      { id: '3-3', name: 'Опора №2' },
    ],
  },
];

export const USERS = [
  { id: 1, name: 'Петров П.П.', role: 'master' },
  { id: 2, name: 'Иванов И.И.', role: 'worker' },
  { id: 3, name: 'Сидоров С.С.', role: 'worker' },
];

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

const INITIAL_SHEETS = [
  {
    id: 1,
    objectId: 1,
    executorId: 2,
    issuedDate: yesterday,
    status: 'completed',
    completedDate: today,
    workerSignature: 'Иванов И.И.',
    masterAcceptedDate: null,
    masterSignature: null,
    masterNotes: '',
    defects: [
      { id: 101, locationId: '1-1', locationName: 'Опора №1', description: 'Сколы бетона у основания', severity: 'medium' },
      { id: 102, locationId: '1-3', locationName: 'Опора №2', description: 'Наклон опоры более 1°', severity: 'high' },
    ],
  },
  {
    id: 2,
    objectId: 2,
    executorId: 3,
    issuedDate: today,
    status: 'issued',
    completedDate: null,
    workerSignature: null,
    masterAcceptedDate: null,
    masterSignature: null,
    masterNotes: '',
    defects: [],
  },
];

export default function InspectionApp() {
  const [currentUserId, setCurrentUserId] = useState(1);
  const [sheets, setSheets] = useState(INITIAL_SHEETS);

  const currentUser = USERS.find(u => u.id === currentUserId);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Typography.Title level={4} style={{ color: 'white', margin: 0 }}>
          Дефектовка
        </Typography.Title>
        <Space>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.65)' }}>
            Пользователь:
          </Typography.Text>
          <Select
            value={currentUserId}
            onChange={setCurrentUserId}
            style={{ width: 210 }}
            options={USERS.map(u => ({
              value: u.id,
              label: `${u.name} (${u.role === 'master' ? 'Мастер' : 'Монтер'})`,
            }))}
          />
          <Tag color={currentUser.role === 'master' ? 'blue' : 'green'}>
            {currentUser.role === 'master' ? 'Мастер' : 'Монтер'}
          </Tag>
        </Space>
      </Header>
      <Content style={{ padding: 24, background: '#f5f5f5' }}>
        {currentUser.role === 'master' ? (
          <MasterView
            sheets={sheets}
            setSheets={setSheets}
            objects={OBJECTS}
            users={USERS}
            currentUser={currentUser}
          />
        ) : (
          <WorkerView
            sheets={sheets}
            setSheets={setSheets}
            objects={OBJECTS}
            currentUser={currentUser}
          />
        )}
      </Content>
    </Layout>
  );
}
