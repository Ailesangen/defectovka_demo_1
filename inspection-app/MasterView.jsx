import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Select, DatePicker, Space, Typography,
  Descriptions, List, Input, Badge, Divider, Tag, message,
} from 'antd';
import { PlusOutlined, CheckOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const STATUS_CONFIG = {
  issued:      { badge: 'default',    label: 'Выдан' },
  in_progress: { badge: 'processing', label: 'В работе' },
  completed:   { badge: 'warning',    label: 'На проверке' },
  approved:    { badge: 'success',    label: 'Принят' },
};

const SEVERITY_CONFIG = {
  low:    { color: 'green',  label: 'Низкая' },
  medium: { color: 'orange', label: 'Средняя' },
  high:   { color: 'red',    label: 'Высокая' },
};

export default function MasterView({ sheets, setSheets, objects, users, currentUser }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [reviewSheet, setReviewSheet] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [form] = Form.useForm();

  const workers = users.filter(u => u.role === 'worker');

  const handleCreate = values => {
    const newSheet = {
      id: Date.now(),
      objectId: values.objectId,
      executorId: values.executorId,
      issuedDate: values.issuedDate
        ? values.issuedDate.format('YYYY-MM-DD')
        : new Date().toISOString().split('T')[0],
      status: 'issued',
      completedDate: null,
      workerSignature: null,
      masterAcceptedDate: null,
      masterSignature: null,
      masterNotes: '',
      defects: [],
    };
    setSheets(prev => [...prev, newSheet]);
    setCreateOpen(false);
    form.resetFields();
    message.success('Лист осмотра создан и выдан исполнителю');
  };

  const openReview = sheet => {
    // Always use the latest state from sheets
    const latest = sheets.find(s => s.id === sheet.id) || sheet;
    setReviewSheet(latest);
    setReviewNotes(latest.masterNotes || '');
  };

  const handleApprove = () => {
    const today = new Date().toISOString().split('T')[0];
    setSheets(prev =>
      prev.map(s =>
        s.id === reviewSheet.id
          ? { ...s, status: 'approved', masterNotes: reviewNotes, masterSignature: currentUser.name, masterAcceptedDate: today }
          : s
      )
    );
    setReviewSheet(null);
    message.success('Лист осмотра принят и подписан');
  };

  const columns = [
    {
      title: 'Объект',
      key: 'object',
      render: (_, r) => objects.find(o => o.id === r.objectId)?.name ?? '—',
    },
    {
      title: 'Исполнитель',
      key: 'executor',
      render: (_, r) => users.find(u => u.id === r.executorId)?.name ?? '—',
    },
    {
      title: 'Дата выдачи',
      dataIndex: 'issuedDate',
    },
    {
      title: 'Дата осмотра',
      dataIndex: 'completedDate',
      render: v => v || '—',
    },
    {
      title: 'Дефектов',
      key: 'defects',
      align: 'center',
      render: (_, r) => r.defects.length,
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, r) => {
        const cfg = STATUS_CONFIG[r.status];
        return <Badge status={cfg.badge} text={cfg.label} />;
      },
    },
    {
      title: 'Действие',
      key: 'action',
      render: (_, r) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          type={r.status === 'completed' ? 'primary' : 'default'}
          onClick={() => openReview(r)}
        >
          {r.status === 'completed' ? 'Проверить' : 'Просмотр'}
        </Button>
      ),
    },
  ];

  const obj = reviewSheet ? objects.find(o => o.id === reviewSheet.objectId) : null;
  const executor = reviewSheet ? users.find(u => u.id === reviewSheet.executorId) : null;
  const isCompleted = reviewSheet?.status === 'completed';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Листы осмотра
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Создать лист осмотра
        </Button>
      </div>

      <Table
        dataSource={sheets}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        bordered
      />

      {/* ── Создать лист осмотра ── */}
      <Modal
        title="Новый лист осмотра"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Выдать исполнителю"
        cancelText="Отмена"
        destroyOnHidden
      >
        <Form form={form} onFinish={handleCreate} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="objectId" label="Объект" rules={[{ required: true, message: 'Выберите объект' }]}>
            <Select
              options={objects.map(o => ({ value: o.id, label: o.name }))}
              placeholder="Выберите объект"
            />
          </Form.Item>
          <Form.Item name="executorId" label="Исполнитель" rules={[{ required: true, message: 'Выберите монтера' }]}>
            <Select
              options={workers.map(u => ({ value: u.id, label: u.name }))}
              placeholder="Выберите монтера"
            />
          </Form.Item>
          <Form.Item name="issuedDate" label="Дата выдачи">
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" defaultValue={dayjs()} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Просмотр / Проверка листа ── */}
      <Modal
        title="Лист осмотра"
        open={!!reviewSheet}
        onCancel={() => setReviewSheet(null)}
        width={620}
        destroyOnHidden
        footer={
          isCompleted
            ? [
                <Button key="cancel" onClick={() => setReviewSheet(null)}>
                  Закрыть
                </Button>,
                <Button key="approve" type="primary" icon={<CheckOutlined />} onClick={handleApprove}>
                  Принять и подписать
                </Button>,
              ]
            : [<Button key="close" onClick={() => setReviewSheet(null)}>Закрыть</Button>]
        }
      >
        {reviewSheet && (
          <>
            <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Объект" span={2}>{obj?.name}</Descriptions.Item>
              <Descriptions.Item label="Исполнитель">{executor?.name}</Descriptions.Item>
              <Descriptions.Item label="Статус">
                <Badge
                  status={STATUS_CONFIG[reviewSheet.status].badge}
                  text={STATUS_CONFIG[reviewSheet.status].label}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Дата выдачи">{reviewSheet.issuedDate}</Descriptions.Item>
              <Descriptions.Item label="Дата осмотра">{reviewSheet.completedDate || '—'}</Descriptions.Item>
              <Descriptions.Item label="Подпись монтера">{reviewSheet.workerSignature || '—'}</Descriptions.Item>
              <Descriptions.Item label="Подпись мастера">{reviewSheet.masterSignature || '—'}</Descriptions.Item>
              {reviewSheet.masterAcceptedDate && (
                <Descriptions.Item label="Дата принятия" span={2}>
                  {reviewSheet.masterAcceptedDate}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Typography.Title level={5}>
              Дефекты ({reviewSheet.defects.length})
            </Typography.Title>

            {reviewSheet.defects.length === 0 ? (
              <Typography.Text type="secondary">Дефекты не зафиксированы</Typography.Text>
            ) : (
              <List
                size="small"
                bordered
                dataSource={reviewSheet.defects}
                renderItem={d => (
                  <List.Item>
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Space>
                        <Tag>{d.locationName}</Tag>
                        {d.severity && (
                          <Tag color={SEVERITY_CONFIG[d.severity]?.color}>
                            {SEVERITY_CONFIG[d.severity]?.label}
                          </Tag>
                        )}
                      </Space>
                      <Typography.Text>{d.description}</Typography.Text>
                    </Space>
                  </List.Item>
                )}
              />
            )}

            {isCompleted && (
              <>
                <Divider />
                <Form.Item label="Комментарий мастера" style={{ marginBottom: 0 }}>
                  <Input.TextArea
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    rows={3}
                    placeholder="Замечания, уточнения по листу осмотра..."
                  />
                </Form.Item>
              </>
            )}

            {reviewSheet.status === 'approved' && reviewSheet.masterNotes && (
              <>
                <Divider />
                <Typography.Text strong>Комментарий мастера: </Typography.Text>
                <Typography.Text>{reviewSheet.masterNotes}</Typography.Text>
              </>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
