import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Space,
  Input,
  Typography,
  Tag,
  Divider,
  message,
} from 'antd';
import {
  FileTextOutlined,
  PrinterOutlined,
  SearchOutlined,
  ReloadOutlined,
  DollarOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { bookingApi } from '../api/bookings';
import { formatCurrency, formatDate } from '../utils/formatters';

const { Title, Text } = Typography;

export default function BillingPage({ onViewBill }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingApi.getAll();
      setBookings(res.data || []);
    } catch (err) {
      message.error(err.message || 'Failed to fetch billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED');
  const totalRoomCharges = confirmedBookings.reduce((sum, b) => sum + Number(b.room_charges || 0), 0);
  const totalGst = confirmedBookings.reduce((sum, b) => sum + Number(b.gst_amount || 0), 0);
  const grandTotalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

  const filteredData = bookings.filter((b) => {
    const text = searchText.toLowerCase().trim();
    if (!text) return true;
    return (
      b.guest_name.toLowerCase().includes(text) ||
      b.phone.includes(text) ||
      String(b.id).includes(text) ||
      b.room_type.toLowerCase().includes(text)
    );
  });

  const columns = [
    {
      title: 'Invoice Ref',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (id) => <Text strong style={{ color: '#0d5257' }}>INV-BK{String(id).padStart(5, '0')}</Text>,
    },
    {
      title: 'Guest Name',
      dataIndex: 'guest_name',
      key: 'guest_name',
      render: (name, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{r.email}</div>
        </div>
      ),
    },
    {
      title: 'Room Type & Nights',
      key: 'room',
      render: (_, r) => (
        <div>
          <Tag color="blue">{r.room_type}</Tag>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
            {r.nights} night{r.nights > 1 ? 's' : ''} ({formatDate(r.check_in)} - {formatDate(r.check_out)})
          </div>
        </div>
      ),
    },
    {
      title: 'Room Charges',
      dataIndex: 'room_charges',
      key: 'room_charges',
      align: 'right',
      render: (val) => <Text>{formatCurrency(val)}</Text>,
    },
    {
      title: 'GST (12%)',
      dataIndex: 'gst_amount',
      key: 'gst_amount',
      align: 'right',
      render: (val) => <Text style={{ color: '#c59b27', fontWeight: 600 }}>{formatCurrency(val)}</Text>,
    },
    {
      title: 'Grand Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      render: (val) => <Text strong style={{ color: '#0d5257', fontSize: 15 }}>{formatCurrency(val)}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'CONFIRMED' ? 'green' : 'default'} style={{ fontWeight: 600 }}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, r) => (
        <Button
          size="small"
          type="primary"
          ghost
          icon={<FileTextOutlined />}
          onClick={() => onViewBill(r.id)}
        >
          View Bill & Print
        </Button>
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
            Billing & Invoicing
          </Title>
          <Text type="secondary">
            Room charges calculation, 12% GST tax breakdown, and printable guest tax invoices
          </Text>
        </div>

        <Button icon={<ReloadOutlined />} onClick={fetchBookings} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Financial Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 8, border: '1px solid #e2e8f0' }} bodyStyle={{ padding: 16 }}>
            <Statistic
              title={<span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>TOTAL ROOM CHARGES</span>}
              value={formatCurrency(totalRoomCharges)}
              valueStyle={{ fontWeight: 800, color: '#0f172a' }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>Base room revenue</Text>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 8, border: '1px solid #e2e8f0' }} bodyStyle={{ padding: 16 }}>
            <Statistic
              title={<span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>TOTAL GST COLLECTED (12%)</span>}
              value={formatCurrency(totalGst)}
              valueStyle={{ fontWeight: 800, color: '#c59b27' }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>Mandatory 12% hospitality tax</Text>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 8, border: '1px solid #e2e8f0' }} bodyStyle={{ padding: 16 }}>
            <Statistic
              title={<span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>TOTAL BILLED REVENUE</span>}
              value={formatCurrency(grandTotalRevenue)}
              valueStyle={{ fontWeight: 800, color: '#0d5257' }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>Grand total including tax</Text>
          </Card>
        </Col>
      </Row>

      {/* Invoices Table Card */}
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
            <span style={{ fontWeight: 700 }}>Guest Billing Records & Invoices</span>
            <Input
              placeholder="Search invoice, guest, phone..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280 }}
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
          pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} billing records` }}
        />
      </Card>
    </div>
  );
}
