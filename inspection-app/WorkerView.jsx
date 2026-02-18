import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Select, Input, Space, Typography,
  Descriptions, List, Badge, Tag, message, Empty, Card,
} from 'antd';
import {
  ArrowRightOutlined, PlusOutlined, CheckOutlined, DeleteOutlined,
} from '@ant-design/icons';

const STATUS_CONFIG = {
  issued:      { badge: 'default',    label: 'Выдан' },
  in_progress: { badge: 'processing', label: 'В работе' },
  completed:   { badge: 'warning',    label: 'Завершен' },
  approved:    { badge: 'success',    label: 'Принят мастером' },
};

const SEVERITY_OPTIONS = [
  { value: 'low',    label: 'Низкая',   color: 'green' },
  { value: 'medium', label: 'Средняя',  color: 'orange' },
  { value: 'high',   label: 'Высокая',  color: 'red' },
];

export default function WorkerView({ sheets, setSheets, objects, currentUser }) {
  // openSheetId: ID of sheet currently opened for inspection (null = list view)
  const [openSheetId, setOpenSheetId] = useState(null);
  const [addDefectOpen, setAddDefectOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [defectForm] = Form.useForm();

  const mySheets = sheets.filter(s => s.executorId === currentUser.id);
  const openSheet = openSheetId ? sheets.find(s => s.id === openSheetId) : null;
  const openObject = openSheet ? objects.find(o => o.id === openSheet.objectId) : null;
  const isEditable = openSheet?.status === 'in_progress';

  const startInspection = sheet => {
    setSheets(prev =>
      prev.map(s => s.id === sheet.id ? { ...s, status: 'in_progress' } : s)
    );
    setOpenSheetId(sheet.id);
  };

  const handleAddDefect = values => {
    const location = openObject.locations.find(l => l.id === values.locationId);
    const newDefect = {
      id: Date.now(),
      locationId: values.locationId,
      locationName: location.name,
      description: values.description,
      severity: values.severity ?? null,
    };
    setSheets(prev =>
      prev.map(s =>
        s.id === openSheetId ? { ...s, defects: [...s.defects, newDefect] } : s
      )
    );
    defectForm.resetFields();
    setAddDefectOpen(false);
    message.success('Дефект зафиксирован');
  };

  const handleDeleteDefect = defectId => {
    setSheets(prev =>
      prev.map(s =>
        s.id === openSheetId
          ? { ...s, defects: s.defects.filter(d => d.id !== defectId) }
          : s
      )
    );
  };

  const handleSubmit = () => {
    const today = new Date().toISOString().split('T')[0];
    setSheets(prev =>
      prev.map(s =>
        s.id === openSheetId
          ? { ...s, status: 'completed', completedDate: today, workerSignature: currentUser.name }
          : s
      )
    );
    setSubmitOpen(false);
    setOpenSheetId(null);
    message.success('Осмотр завершён, лист передан мастеру на проверку');
  };

  // ── Список листов ────────────────────────────────────────
  if (!openSheet) {
    const columns = [
      {
        title: 'Объект',
        key: 'object',
        render: (_, r) => objects.find(o => o.id === r.objectId)?.name ?? '—',
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
        render: (_, r) => (
          <Badge status={STATUS_CONFIG[r.status].badge} text={STATUS_CONFIG[r.status].label} />
        ),
      },
      {
        title: 'Действие',
        key: 'action',
        render: (_, r) => {
          if (r.status === 'issued') {
            return (
              <Button
                type="primary"
                size="small"
                icon={<ArrowRightOutlined />}
                onClick={() => startInspection(r)}
              >
                Начать осмотр
              </Button>
            );
          }
          if (r.status === 'in_progress') {
            return (
              <Button size="small" icon={<ArrowRightOutlined />} onClick={() => setOpenSheetId(r.id)}>
                Продолжить
              </Button>
            );
          }
          return (
            <Button size="small" onClick={() => setOpenSheetId(r.id)}>
              Просмотр
            </Button>
          );
        },
      },
    ];

    return (
      <>
        <Typography.Title level={4} style={{ marginBottom: 16 }}>
          Мои листы осмотра
        </Typography.Title>
        {mySheets.length === 0 ? (
          <Empty description="Нет выданных листов осмотра" />
        ) : (
          <Table
            dataSource={mySheets}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            bordered
          />
        )}
      </>
    );
  }

  // ── Режим проведения осмотра ──────────────────────────────
  const severityColor = s =>
    SEVERITY_OPTIONS.find(o => o.value === s)?.color ?? 'default';
  const severityLabel = s =>
    SEVERITY_OPTIONS.find(o => o.value === s)?.label ?? s;

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => setOpenSheetId(null)}>← Назад</Button>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Осмотр: {openObject?.name}
        </Typography.Title>
        <Badge
          status={STATUS_CONFIG[openSheet.status].badge}
          text={STATUS_CONFIG[openSheet.status].label}
        />
      </Space>

      <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Объект" span={2}>{openObject?.name}</Descriptions.Item>
        <Descriptions.Item label="Исполнитель">{currentUser.name}</Descriptions.Item>
        <Descriptions.Item label="Дата выдачи">{openSheet.issuedDate}</Descriptions.Item>
        {openSheet.completedDate && (
          <Descriptions.Item label="Дата осмотра">{openSheet.completedDate}</Descriptions.Item>
        )}
      </Descriptions>

      <Card
        title={`Зафиксированные дефекты (${openSheet.defects.length})`}
        extra={
          isEditable && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddDefectOpen(true)}
            >
              Добавить дефект
            </Button>
          )
        }
        style={{ marginBottom: 16 }}
      >
        {openSheet.defects.length === 0 ? (
          <Empty
            description={
              isEditable
                ? 'Дефекты не зафиксированы. Нажмите «Добавить дефект» при обнаружении.'
                : 'Дефекты не зафиксированы'
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={openSheet.defects}
            renderItem={d => (
              <List.Item
                actions={
                  isEditable
                    ? [
                        <Button
                          key="del"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteDefect(d.id)}
                        />,
                      ]
                    : []
                }
              >
                <Space wrap>
                  <Tag>{d.locationName}</Tag>
                  {d.severity && (
                    <Tag color={severityColor(d.severity)}>{severityLabel(d.severity)}</Tag>
                  )}
                  <Typography.Text>{d.description}</Typography.Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>

      {isEditable && (
        <Button
          type="primary"
          size="large"
          icon={<CheckOutlined />}
          onClick={() => setSubmitOpen(true)}
        >
          Завершить осмотр и передать мастеру
        </Button>
      )}

      {/* ── Добавить дефект ── */}
      <Modal
        title="Зафиксировать дефект"
        open={addDefectOpen}
        onCancel={() => { setAddDefectOpen(false); defectForm.resetFields(); }}
        onOk={() => defectForm.submit()}
        okText="Добавить"
        cancelText="Отмена"
        destroyOnHidden
      >
        <Form form={defectForm} onFinish={handleAddDefect} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="locationId"
            label="Техническое место (опора / пролет)"
            rules={[{ required: true, message: 'Укажите техническое место' }]}
          >
            <Select
              options={openObject?.locations.map(l => ({ value: l.id, label: l.name }))}
              placeholder="Выберите опору или пролет"
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="Описание дефекта"
            rules={[{ required: true, message: 'Опишите дефект' }]}
          >
            <Input.TextArea rows={3} placeholder="Опишите обнаруженный дефект..." />
          </Form.Item>
          <Form.Item name="severity" label="Критичность">
            <Select
              options={SEVERITY_OPTIONS}
              placeholder="Выберите критичность (необязательно)"
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Завершить осмотр ── */}
      <Modal
        title="Завершить осмотр"
        open={submitOpen}
        onCancel={() => setSubmitOpen(false)}
        onOk={handleSubmit}
        okText="Подписать и передать мастеру"
        cancelText="Отмена"
      >
        <Typography.Paragraph>
          Объект: <strong>{openObject?.name}</strong>
        </Typography.Paragraph>
        <Typography.Paragraph>
          Зафиксировано дефектов: <strong>{openSheet.defects.length}</strong>
        </Typography.Paragraph>
        <Typography.Paragraph>
          Дата осмотра: <strong>{new Date().toLocaleDateString('ru-RU')}</strong>
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary">
          Нажимая «Подписать и передать мастеру», вы подтверждаете проведение
          осмотра и ставите электронную подпись ({currentUser.name}).
          Лист осмотра будет передан мастеру на проверку.
        </Typography.Paragraph>
      </Modal>
    </>
  );
}
