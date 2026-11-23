import React from 'react';
import { Modal, Descriptions, Tag, Button, Divider, Space, Typography, Table } from 'antd';
import {
  PrinterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  LoginOutlined,
  LogoutOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { formatCurrency, formatDate } from '../utils/formatters';

const { Title, Text } = Typography;

export default function InvoiceModal({ visible, onClose, billData, loading }) {
  if (!billData && !loading) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceItems = billData
    ? [
        {
          key: '1',
          description: `${billData.room_type} Room Accommodation (${billData.nights} night${billData.nights > 1 ? 's' : ''} @ ${formatCurrency(billData.price_per_night)}/night)`,
          nights: billData.nights,
          rate: formatCurrency(billData.price_per_night),
          amount: formatCurrency(billData.room_charges),
        },
      ]
    : [];

  const columns = [
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Nights', dataIndex: 'nights', key: 'nights', align: 'center', width: 90 },
    { title: 'Rate / Night', dataIndex: 'rate', key: 'rate', align: 'right', width: 140 },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', width: 140 },
  ];

  const renderStatusTag = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <Tag color="blue" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 4, fontWeight: 600 }}>
            <ClockCircleOutlined /> Confirmed
          </Tag>
        );
      case 'CHECKED_IN':
        return (
          <Tag color="green" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 4, fontWeight: 600 }}>
            <LoginOutlined /> Checked In
          </Tag>
        );
      case 'CHECKED_OUT':
        return (
          <Tag color="purple" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 4, fontWeight: 600 }}>
            <LogoutOutlined /> Checked Out
          </Tag>
        );
      case 'CANCELLED':
        return (
          <Tag color="red" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 4, fontWeight: 600 }}>
            <CloseCircleOutlined /> Cancelled
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={720}
      title={
        <Space>
          <FileTextOutlined style={{ color: '#0d5257', fontSize: 20 }} />
          <span>Tax Invoice & Booking Bill</span>
        </Space>
      }
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          style={{ background: '#0d5257', borderColor: '#0d5257' }}
        >
          Print Invoice
        </Button>,
      ]}
      destroyOnClose
    >
      <div className="printable-invoice" style={{ padding: '12px 4px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0d5257', paddingBottom: 16, marginBottom: 20 }}>
          <div>
            <Title level={3} style={{ margin: 0, color: '#0d5257', fontWeight: 800, letterSpacing: '-0.5px' }}>
              STAYDESK HOTEL
            </Title>
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 2 }}>
              Hospitality & Front Desk Services
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              GSTIN: 27AABCS1429B1Z | Contact: +91 98765 43210
            </Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            {renderStatusTag(billData?.status)}
            <div style={{ marginTop: 8 }}>
              <Text strong style={{ fontSize: 14, color: '#334155' }}>
                Invoice #: INV-BK{String(billData?.booking_id || billData?.id || '').padStart(5, '0')}
              </Text>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Date: {formatDate(new Date())}
              </div>
            </div>
          </div>
        </div>

        {/* Guest & Stay Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20, background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div>
            <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, color: '#64748b' }}>
              Billed To
            </Text>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginTop: 4 }}>
              {billData?.guest_name || 'Guest'}
            </div>
            <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
              Phone: {billData?.phone || 'N/A'}
            </div>
            <div style={{ fontSize: 13, color: '#475569' }}>
              Email: {billData?.email || 'N/A'}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, color: '#64748b' }}>
              Stay Duration
            </Text>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginTop: 4 }}>
              Check-In: <strong>{formatDate(billData?.check_in)}</strong>
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginTop: 2 }}>
              Check-Out: <strong>{formatDate(billData?.check_out)}</strong>
            </div>
            <div style={{ fontSize: 13, color: '#0d5257', fontWeight: 700, marginTop: 4 }}>
              Total Stay: {billData?.nights} {billData?.nights === 1 ? 'Night' : 'Nights'}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <Table
          dataSource={invoiceItems}
          columns={columns}
          pagination={false}
          size="middle"
          bordered
          style={{ marginBottom: 16 }}
        />

        {/* Amount Breakdown */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <div style={{ width: 320, background: '#f8fafc', padding: '14px 18px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="secondary">Room Charges (Subtotal):</Text>
              <Text strong>{formatCurrency(billData?.room_charges)}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="secondary">GST (12%):</Text>
              <Text strong>{formatCurrency(billData?.gst_amount)}</Text>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong style={{ fontSize: 16, color: '#0d5257' }}>Grand Total:</Text>
              <Text strong style={{ fontSize: 18, color: '#0d5257' }}>
                {formatCurrency(billData?.total_amount)}
              </Text>
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: 12 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Thank you for staying with StayDesk Hotel! For queries, please email support@staydesk.local or call front desk.
          </Text>
        </div>
      </div>
    </Modal>
  );
}
