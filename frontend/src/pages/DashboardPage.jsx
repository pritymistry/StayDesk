import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Empty,
  Skeleton,
  Progress,
  Tooltip,
} from 'antd';
import {
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  DollarOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  LoginOutlined,
  LogoutOutlined,
  HomeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { dashboardApi } from '../api/dashboard';
import { bookingApi } from '../api/bookings';
import { roomTypeApi } from '../api/roomTypes';
import { formatCurrency, formatDate } from '../utils/formatters';

const { Title, Text } = Typography;

export default function DashboardPage({
  onNavigate,
  onOpenBookingModal,
  onOpenRoomModal,
  onViewBill,
}) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_room_types: 0,
    todays_check_ins: 0,
    active_bookings: 0,
    checked_in_guests: 0,
    todays_check_outs: 0,
    total_rooms_inventory: 0,
    total_occupied_today: 0,
    total_available_today: 0,
  });
  const [roomTypes, setRoomTypes] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, bookingsRes, roomTypesRes] = await Promise.all([
        dashboardApi.getSummary(),
        bookingApi.getAll(),
        roomTypeApi.getAll(),
      ]);

      setSummary(sumRes.data || {});
      setRoomTypes(roomTypesRes.data || []);
      const allBookings = bookingsRes.data || [];
      setRecentBookings(allBookings.slice(0, 6));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalInventory = summary.total_rooms_inventory || roomTypes.reduce((acc, curr) => acc + Number(curr.total_rooms || 0), 0);
  const totalOccupied = summary.total_occupied_today ?? roomTypes.reduce((acc, curr) => acc + Number(curr.occupied_rooms || 0), 0);
  const totalAvailable = summary.total_available_today ?? Math.max(0, totalInventory - totalOccupied);

  const renderStatusTag = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <Tag color="blue" style={{ fontWeight: 600 }}>CONFIRMED</Tag>;
      case 'CHECKED_IN':
        return <Tag color="green" style={{ fontWeight: 600 }}>CHECKED IN</Tag>;
      case 'CHECKED_OUT':
        return <Tag color="purple" style={{ fontWeight: 600 }}>CHECKED OUT</Tag>;
      case 'CANCELLED':
        return <Tag color="default" style={{ fontWeight: 600 }}>CANCELLED</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Booking ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id) => <Text strong style={{ color: '#0d5257' }}>#{id}</Text>,
    },
    {
      title: 'Guest Details',
      dataIndex: 'guest_name',
      key: 'guest_name',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{name}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{record.phone}</div>
        </div>
      ),
    },
    {
      title: 'Room Type',
      dataIndex: 'room_type',
      key: 'room_type',
      render: (type) => <Tag color="cyan" style={{ borderRadius: 4 }}>{type}</Tag>,
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => (
        <div>
          <div>{formatDate(record.check_in)} → {formatDate(record.check_out)}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.nights} night{record.nights > 1 ? 's' : ''}</Text>
        </div>
      ),
    },
    {
      title: 'Total Bill',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (val) => <Text strong>{formatCurrency(val)}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => renderStatusTag(status),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          icon={<FileTextOutlined />}
          onClick={() => onViewBill(record.id)}
        >
          Bill
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Top Banner / Welcome */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
            Front Desk Overview
          </Title>
          <Text type="secondary">
            Today is {dayjs().format('dddd, DD MMMM YYYY')} — Real-time live room inventory & guest status
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onOpenBookingModal}
            style={{ background: '#0d5257', borderColor: '#0d5257' }}
          >
            Create Booking
          </Button>
        </Space>
      </div>

      {/* Metric Cards */}
      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        {/* Card 1: Available Rooms (Deducted live) */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => onNavigate('rooms')}
            style={{ borderRadius: 12, border: '1px solid #bbf7d0', background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)' }}
          >
            <Statistic
              title={
                <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>
                  AVAILABLE ROOMS TODAY
                </span>
              }
              value={totalAvailable}
              suffix={`/ ${totalInventory}`}
              prefix={<HomeOutlined style={{ color: '#16a34a', marginRight: 8 }} />}
              valueStyle={{ fontWeight: 800, color: '#166534', fontSize: 32 }}
            />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>
                {totalOccupied} room{totalOccupied === 1 ? '' : 's'} occupied right now
              </Text>
              <ArrowRightOutlined style={{ color: '#16a34a', fontSize: 12 }} />
            </div>
          </Card>
        </Col>

        {/* Card 2: Checked In (In-House Guests) */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => onNavigate('bookings')}
            style={{ borderRadius: 12, border: '1px solid #fef3c7', background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)' }}
          >
            <Statistic
              title={
                <span style={{ fontSize: 13, fontWeight: 700, color: '#b45309' }}>
                  IN-HOUSE OCCUPIED GUESTS
                </span>
              }
              value={summary.checked_in_guests ?? 0}
              suffix="rooms"
              prefix={<UserOutlined style={{ color: '#d97706', marginRight: 8 }} />}
              valueStyle={{ fontWeight: 800, color: '#d97706', fontSize: 32 }}
            />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#b45309' }}>
                Active in-house stays
              </Text>
              <ArrowRightOutlined style={{ color: '#d97706', fontSize: 12 }} />
            </div>
          </Card>
        </Col>

        {/* Card 3: Today's Check-ins */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => onNavigate('bookings')}
            style={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <Statistic
              title={
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                  TODAY'S ARRIVALS
                </span>
              }
              value={summary.todays_check_ins ?? 0}
              prefix={<LoginOutlined style={{ color: '#0284c7', marginRight: 8 }} />}
              valueStyle={{ fontWeight: 800, color: '#0284c7', fontSize: 32 }}
            />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Pending arrival today
              </Text>
              <ArrowRightOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
            </div>
          </Card>
        </Col>

        {/* Card 4: Total Categories */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => onNavigate('rooms')}
            style={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <Statistic
              title={
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                  ROOM TYPES
                </span>
              }
              value={summary.total_room_types ?? 0}
              prefix={<AppstoreOutlined style={{ color: '#0d5257', marginRight: 8 }} />}
              valueStyle={{ fontWeight: 800, color: '#0f172a', fontSize: 32 }}
            />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {totalInventory} total inventory
              </Text>
              <ArrowRightOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Grid: Room Inventory Live Breakdown + Recent Bookings */}
      <Row gutter={[20, 20]}>
        {/* Room Types Live Inventory */}
        <Col xs={24} lg={9}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Live Room Inventory</span>
                <Button size="small" type="link" onClick={() => onNavigate('rooms')}>
                  Manage All
                </Button>
              </div>
            }
            style={{ borderRadius: 12, border: '1px solid #e2e8f0', height: '100%' }}
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : roomTypes.length === 0 ? (
              <Empty description="No room types created yet" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {roomTypes.map((rt) => {
                  const occupied = Number(rt.occupied_rooms) || 0;
                  const total = Number(rt.total_rooms) || 1;
                  const available = rt.available_rooms !== undefined ? Number(rt.available_rooms) : Math.max(0, total - occupied);
                  const percent = Math.round((occupied / total) * 100);

                  return (
                    <div
                      key={rt.id}
                      style={{
                        padding: 14,
                        background: occupied > 0 ? '#fffdf7' : '#f8fafc',
                        borderRadius: 10,
                        border: `1px solid ${occupied > 0 ? '#fde68a' : '#e2e8f0'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{rt.name}</div>
                          <div style={{ fontSize: 12, color: '#0d5257', fontWeight: 600 }}>
                            {formatCurrency(rt.price_per_night)} / night
                          </div>
                        </div>
                        <Space>
                          {occupied > 0 && (
                            <Tag color="orange" style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                              {occupied} Occupied
                            </Tag>
                          )}
                          <Tag
                            color={available > 0 ? 'green' : 'red'}
                            style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}
                          >
                            {available > 0 ? `${available} Available` : 'Sold Out'}
                          </Tag>
                        </Space>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 2 }}>
                          <span>{occupied} Booked / In-Use</span>
                          <span>Total: {total} rooms</span>
                        </div>
                        <Progress
                          percent={percent}
                          size="small"
                          showInfo={false}
                          status={available === 0 ? 'exception' : 'active'}
                          strokeColor={available === 0 ? '#ef4444' : percent > 50 ? '#f59e0b' : '#10b981'}
                        />
                      </div>
                    </div>
                  );
                })}

                <Button
                  block
                  icon={<PlusOutlined />}
                  onClick={onOpenRoomModal}
                  style={{ marginTop: 4 }}
                >
                  Add Another Room Type
                </Button>
              </div>
            )}
          </Card>
        </Col>

        {/* Recent Bookings & Status */}
        <Col xs={24} lg={15}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Latest Bookings & Status</span>
                <Button size="small" type="link" onClick={() => onNavigate('bookings')}>
                  View All Bookings ({recentBookings.length})
                </Button>
              </div>
            }
            style={{ borderRadius: 12, border: '1px solid #e2e8f0', height: '100%' }}
          >
            <Table
              dataSource={recentBookings}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="middle"
              locale={{ emptyText: 'No bookings recorded yet. Click "Create Booking" to add one.' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
