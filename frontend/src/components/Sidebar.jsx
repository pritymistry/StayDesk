import React from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

export default function Sidebar({ currentKey, onSelectKey }) {
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined style={{ fontSize: 17 }} />,
      label: 'Dashboard Overview',
    },
    {
      key: 'rooms',
      icon: <AppstoreOutlined style={{ fontSize: 17 }} />,
      label: 'Room Management',
    },
    {
      key: 'bookings',
      icon: <CalendarOutlined style={{ fontSize: 17 }} />,
      label: 'Guest Bookings',
    },
    {
      key: 'billing',
      icon: <FileTextOutlined style={{ fontSize: 17 }} />,
      label: 'Billing & Invoices',
    },
  ];

  return (
    <Sider
      width={240}
      theme="light"
      style={{
        borderRight: '1px solid #e2e8f0',
        minHeight: 'calc(100vh - 64px)',
        background: '#ffffff',
      }}
    >
      <div style={{ padding: '16px 16px 8px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 0.8 }}>
          Navigation
        </div>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[currentKey]}
        onClick={({ key }) => onSelectKey(key)}
        items={menuItems}
        style={{
          borderRight: 0,
          fontWeight: 500,
        }}
      />

      {/* Helpful Info Widget */}
      <div
        style={{
          margin: 16,
          padding: 14,
          borderRadius: 8,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          fontSize: 12,
          color: '#64748b',
        }}
      >
        <div style={{ fontWeight: 600, color: '#0d5257', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircleOutlined /> Double-Booking Protection
        </div>
        Room inventory is locked in real-time transactions to ensure zero double-bookings.
      </div>
    </Sider>
  );
}
