import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Card,
  Space,
  Input,
  Select,
  Typography,
  Tag,
  Popconfirm,
  Badge,
  Tooltip,
  message,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  FileTextOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { bookingApi } from '../api/bookings';
import { formatCurrency, formatDate } from '../utils/formatters';

const { Title, Text } = Typography;

export default function BookingsPage({ onOpenBookingModal, onViewBill, onBookingUpdated }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter && statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const res = await bookingApi.getAll(params);
      setBookings(res.data || []);
    } catch (err) {
      message.error(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleCheckIn = async (id) => {
    setActionLoadingId(id);
    try {
      await bookingApi.checkIn(id);
      message.success(`Booking #${id}: Guest checked in successfully! Room is now marked occupied.`);
      await fetchBookings();
      if (onBookingUpdated) onBookingUpdated();
    } catch (err) {
      message.error(err.message || 'Failed to check in guest');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckOut = async (id) => {
    setActionLoadingId(id);
    try {
      await bookingApi.checkOut(id);
      message.success(`Booking #${id}: Guest checked out successfully! Room is now released & available.`);
      await fetchBookings();
      if (onBookingUpdated) onBookingUpdated();
    } catch (err) {
      message.error(err.message || 'Failed to check out guest');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelBooking = async (id) => {
    setActionLoadingId(id);
    try {
      await bookingApi.cancel(id);
      message.success(`Booking #${id} has been cancelled. Room is now available.`);
      await fetchBookings();
      if (onBookingUpdated) onBookingUpdated();
    } catch (err) {
      message.error(err.message || 'Failed to cancel booking');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredBookings = bookings.filter((item) => {
    const text = searchText.toLowerCase().trim();
    if (!text) return true;
    return (
      item.guest_name.toLowerCase().includes(text) ||
      item.phone.includes(text) ||
      item.email.toLowerCase().includes(text) ||
      String(item.id).includes(text) ||
      item.room_type.toLowerCase().includes(text)
    );
  });

  const renderStatusTag = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <Tag color="blue" style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
            <ClockCircleOutlined /> CONFIRMED
          </Tag>
        );
      case 'CHECKED_IN':
        return (
          <Tag color="green" style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
            <LoginOutlined /> CHECKED IN
          </Tag>
        );
      case 'CHECKED_OUT':
        return (
          <Tag color="purple" style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
            <LogoutOutlined /> CHECKED OUT
          </Tag>
        );
      case 'CANCELLED':
        return (
          <Tag color="red" style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
            <CloseCircleOutlined /> CANCELLED
          </Tag>
        );
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
      render: (id) => (
        <Text strong style={{ color: '#0d5257', fontSize: 14 }}>
          #{id}
        </Text>
      ),
    },
    {
      title: 'Guest Details',
      dataIndex: 'guest_name',
      key: 'guest_name',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{name}</div>
          <div style={{ fontSize: 12, color: '#475569' }}>📞 {record.phone}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>✉️ {record.email}</div>
        </div>
      ),
    },
    {
      title: 'Room Type',
      dataIndex: 'room_type',
      key: 'room_type',
      render: (type) => (
        <Tag color="cyan" style={{ borderRadius: 4, fontWeight: 600 }}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Stay Dates',
      key: 'dates',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {formatDate(record.check_in)} → {formatDate(record.check_out)}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.nights} night{record.nights > 1 ? 's' : ''} stay
          </Text>
        </div>
      ),
    },
    {
      title: 'Amount Breakdown',
      key: 'bill',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0d5257', fontSize: 14 }}>
            {formatCurrency(record.total_amount)}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            Base: {formatCurrency(record.room_charges)} + GST: {formatCurrency(record.gst_amount)}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => renderStatusTag(status),
    },
    {
      title: 'Change Status / Action',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space wrap>
          {/* Status Transition: CONFIRMED -> CHECKED_IN */}
          {record.status === 'CONFIRMED' && (
            <Popconfirm
              title="Check in this guest?"
              description="Mark the guest as arrived and room as currently occupied."
              onConfirm={() => handleCheckIn(record.id)}
              okText="Check In"
              cancelText="Cancel"
            >
              <Button
                size="small"
                type="primary"
                icon={<LoginOutlined />}
                loading={actionLoadingId === record.id}
                style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 600 }}
              >
                Check In
              </Button>
            </Popconfirm>
          )}

          {/* Status Transition: CHECKED_IN -> CHECKED_OUT */}
          {record.status === 'CHECKED_IN' && (
            <Popconfirm
              title="Check out this guest?"
              description="Confirm guest departure. The room will be immediately released."
              onConfirm={() => handleCheckOut(record.id)}
              okText="Check Out"
              cancelText="Cancel"
            >
              <Button
                size="small"
                type="primary"
                icon={<LogoutOutlined />}
                loading={actionLoadingId === record.id}
                style={{ background: '#d97706', borderColor: '#d97706', fontWeight: 600 }}
              >
                Check Out
              </Button>
            </Popconfirm>
          )}

          {/* Cancel button: only for CONFIRMED bookings */}
          {record.status === 'CONFIRMED' && (
            <Popconfirm
              title="Cancel this booking?"
              description="The room will immediately become available again for other guests."
              onConfirm={() => handleCancelBooking(record.id)}
              okText="Yes, Cancel"
              cancelText="No"
              okButtonProps={{ danger: true, loading: actionLoadingId === record.id }}
            >
              <Button size="small" danger icon={<StopOutlined />}>
                Cancel
              </Button>
            </Popconfirm>
          )}

          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => onViewBill(record.id)}
          >
            Bill
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
            Guest Booking Management
          </Title>
          <Text type="secondary">
            Manage reservations and full guest lifecycle: <strong>Confirm → Check In → Check Out</strong> or <strong>Cancel</strong>
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchBookings} loading={loading}>
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

      {/* Main Table Card */}
      <Card
        style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
        title={
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <span style={{ fontWeight: 700 }}>All Reservations ({filteredBookings.length})</span>
            <Space wrap>
              <Input
                placeholder="Search guest, phone, email, #ID..."
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 280 }}
                allowClear
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 170 }}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'CONFIRMED', label: 'Confirmed (Reserved)' },
                  { value: 'CHECKED_IN', label: 'Checked In (Active)' },
                  { value: 'CHECKED_OUT', label: 'Checked Out (Done)' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                ]}
              />
            </Space>
          </div>
        }
      >
        <Table
          dataSource={filteredBookings}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} bookings` }}
        />
      </Card>
    </div>
  );
}
