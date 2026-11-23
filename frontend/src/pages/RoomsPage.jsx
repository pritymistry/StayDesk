import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Card,
  Space,
  Input,
  Typography,
  Tag,
  Tooltip,
  Row,
  Col,
  Statistic,
  Progress,
  message,
} from 'antd';
import {
  AppstoreAddOutlined,
  EditOutlined,
  SearchOutlined,
  ReloadOutlined,
  CalendarOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { roomTypeApi } from '../api/roomTypes';
import { formatCurrency, formatDate } from '../utils/formatters';
import RoomTypeModal from '../components/RoomTypeModal';

const { Title, Text } = Typography;

export default function RoomsPage({ onOpenBookingWithRoom }) {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await roomTypeApi.getAll();
      setRoomTypes(res.data || []);
    } catch (err) {
      message.error(err.message || 'Failed to fetch room types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleOpenAdd = () => {
    setSelectedRoomType(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (record) => {
    setSelectedRoomType(record);
    setModalVisible(true);
  };

  const filteredData = roomTypes.filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const totalInventory = roomTypes.reduce((acc, curr) => acc + Number(curr.total_rooms || 0), 0);
  const totalOccupied = roomTypes.reduce((acc, curr) => acc + Number(curr.occupied_rooms || 0), 0);
  const totalAvailable = Math.max(0, totalInventory - totalOccupied);

  const columns = [
    {
      title: 'Room Type',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: '#f0fdf4',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            <HomeOutlined />
          </div>
          <div>
            <Text strong style={{ fontSize: 14, color: '#0f172a' }}>{name}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Price Per Night',
      dataIndex: 'price_per_night',
      key: 'price_per_night',
      sorter: (a, b) => a.price_per_night - b.price_per_night,
      render: (val) => (
        <div>
          <Text strong style={{ fontSize: 15, color: '#0d5257' }}>
            {formatCurrency(val)}
          </Text>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>+ 12% GST</div>
        </div>
      ),
    },
    {
      title: 'Total Capacity',
      dataIndex: 'total_rooms',
      key: 'total_rooms',
      sorter: (a, b) => a.total_rooms - b.total_rooms,
      render: (total) => (
        <Tag style={{ fontSize: 13, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
          {total} Total
        </Tag>
      ),
    },
    {
      title: 'Currently Occupied',
      dataIndex: 'occupied_rooms',
      key: 'occupied_rooms',
      sorter: (a, b) => (a.occupied_rooms || 0) - (b.occupied_rooms || 0),
      render: (occupied) => (
        <div>
          <Tag color={occupied > 0 ? 'orange' : 'default'} style={{ fontSize: 13, fontWeight: 700 }}>
            {occupied > 0 ? (
              <Space>
                <UserOutlined />
                <span>{occupied} Occupied</span>
              </Space>
            ) : (
              '0 Occupied'
            )}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Available Rooms (Live Deducted)',
      key: 'available_rooms',
      sorter: (a, b) => (a.available_rooms ?? a.total_rooms) - (b.available_rooms ?? b.total_rooms),
      render: (_, record) => {
        const total = Number(record.total_rooms) || 1;
        const occupied = Number(record.occupied_rooms) || 0;
        const available = record.available_rooms !== undefined
          ? Number(record.available_rooms)
          : Math.max(0, total - occupied);
        const percent = Math.round((occupied / total) * 100);

        return (
          <div style={{ width: 180 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <Tag
                color={available > 0 ? 'green' : 'red'}
                style={{ fontWeight: 700, borderRadius: 4, fontSize: 13 }}
              >
                {available > 0 ? `${available} Available` : 'Sold Out'}
              </Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>{available} / {total}</Text>
            </div>
            <Progress
              percent={percent}
              size="small"
              showInfo={false}
              status={available === 0 ? 'exception' : 'active'}
              strokeColor={available === 0 ? '#ef4444' : percent > 50 ? '#f59e0b' : '#10b981'}
            />
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          {onOpenBookingWithRoom && (
            <Button
              size="small"
              icon={<CalendarOutlined />}
              onClick={() => onOpenBookingWithRoom(record.id)}
              disabled={(record.available_rooms ?? record.total_rooms) <= 0}
            >
              Book
            </Button>
          )}
          <Button
            size="small"
            type="primary"
            ghost
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
            Room Management
          </Title>
          <Text type="secondary">
            Live inventory tracking: Occupied rooms are <strong>automatically deducted</strong> from available capacity in real time
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchRooms} loading={loading}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<AppstoreAddOutlined />}
            onClick={handleOpenAdd}
            style={{ background: '#0d5257', borderColor: '#0d5257' }}
          >
            Add Room Type
          </Button>
        </Space>
      </div>

      {/* Metrics Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 8, border: '1px solid #e2e8f0' }} bodyStyle={{ padding: 16 }}>
            <Statistic
              title={<span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>TOTAL INVENTORY</span>}
              value={totalInventory}
              suffix="rooms"
              valueStyle={{ fontWeight: 800, color: '#0f172a' }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>Across {roomTypes.length} room categories</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 8, border: '1px solid #fde68a', background: '#fffdf7' }} bodyStyle={{ padding: 16 }}>
            <Statistic
              title={<span style={{ fontSize: 12, fontWeight: 700, color: '#b45309' }}>CURRENTLY OCCUPIED</span>}
              value={totalOccupied}
              suffix="booked"
              valueStyle={{ fontWeight: 800, color: '#d97706' }}
            />
            <Text style={{ fontSize: 11, color: '#b45309' }}>Guests in-house right now</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4' }} bodyStyle={{ padding: 16 }}>
            <Statistic
              title={<span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>AVAILABLE ROOMS NOW</span>}
              value={totalAvailable}
              suffix="free"
              valueStyle={{ fontWeight: 800, color: '#16a34a' }}
            />
            <Text style={{ fontSize: 11, color: '#15803d' }}>Ready for new reservations</Text>
          </Card>
        </Col>
      </Row>

      {/* Table Card */}
      <Card
        style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontWeight: 700 }}>Room Types & Live Inventory</span>
            <Input
              placeholder="Search by room name..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 260 }}
              allowClear
            />
          </div>
        }
      >
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} room types` }}
        />
      </Card>

      {/* Add / Edit Modal */}
      <RoomTypeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={fetchRooms}
        initialValues={selectedRoomType}
      />
    </div>
  );
}
