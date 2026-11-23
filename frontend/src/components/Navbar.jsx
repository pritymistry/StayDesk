import React, { useState, useEffect } from 'react';
import { Layout, Button, Space, Typography, Tag, Avatar, Tooltip } from 'antd';
import {
  PlusOutlined,
  AppstoreAddOutlined,
  UserOutlined,
  CheckCircleFilled,
  SyncOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import client from '../api/client';

const { Header } = Layout;
const { Text } = Typography;

export default function Navbar({ onOpenBookingModal, onOpenRoomModal }) {
  const [apiOnline, setApiOnline] = useState(true);

  useEffect(() => {
    const checkApi = async () => {
      try {
        await client.get('/health');
        setApiOnline(true);
      } catch (err) {
        setApiOnline(false);
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0d5257 0%, #15737a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: 20,
            fontWeight: 800,
            boxShadow: '0 4px 6px -1px rgba(13, 82, 87, 0.3)',
          }}
        >
          🏨
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 19, fontWeight: 800, color: '#0d5257', letterSpacing: '-0.3px' }}>
              StayDesk
            </span>
            <Tag color="cyan" style={{ borderRadius: 12, margin: 0, fontSize: 11, fontWeight: 600 }}>
              v1.0
            </Tag>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, lineHeight: 1 }}>
            Hotel Front Desk & Booking System
          </div>
        </div>
      </div>

      {/* Right Side Actions & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* API Status */}
        <Tooltip title={apiOnline ? 'Connected to MySQL Backend API' : 'Backend connection issues'}>
          <Tag
            color={apiOnline ? 'success' : 'error'}
            style={{
              borderRadius: 20,
              padding: '2px 10px',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <CheckCircleFilled /> {apiOnline ? 'Live Backend' : 'Offline'}
          </Tag>
        </Tooltip>

        {/* Quick Actions */}
        <Button
          icon={<AppstoreAddOutlined />}
          onClick={onOpenRoomModal}
          style={{ borderRadius: 8, fontWeight: 500 }}
        >
          Add Room Type
        </Button>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onOpenBookingModal}
          style={{
            background: '#0d5257',
            borderColor: '#0d5257',
            borderRadius: 8,
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(13, 82, 87, 0.2)',
          }}
        >
          New Booking
        </Button>

        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 8, borderLeft: '1px solid #e2e8f0' }}>
          <Avatar
            style={{ backgroundColor: '#0d5257', color: '#fff', fontWeight: 600 }}
            icon={<UserOutlined />}
          />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Front Desk Staff</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Operations</div>
          </div>
        </div>
      </div>
    </Header>
  );
}
