import React, { useState, useEffect, useCallback } from 'react';
import { ConfigProvider, Layout, App as AntApp, message } from 'antd';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import RoomsPage from './pages/RoomsPage';
import BookingsPage from './pages/BookingsPage';
import BillingPage from './pages/BillingPage';
import BookingModal from './components/BookingModal';
import RoomTypeModal from './components/RoomTypeModal';
import InvoiceModal from './components/InvoiceModal';
import { roomTypeApi } from './api/roomTypes';
import { bookingApi } from './api/bookings';

const { Content } = Layout;

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [roomTypes, setRoomTypes] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [roomModalVisible, setRoomModalVisible] = useState(false);

  // Invoice Modal State
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [billData, setBillData] = useState(null);
  const [billLoading, setBillLoading] = useState(false);

  const fetchRoomTypes = useCallback(async () => {
    try {
      const res = await roomTypeApi.getAll();
      setRoomTypes(res.data || []);
    } catch (err) {
      console.error('Failed to load room types in App:', err);
    }
  }, []);

  useEffect(() => {
    fetchRoomTypes();
  }, [fetchRoomTypes, refreshTrigger]);

  const handleSelectView = (viewKey) => {
    setCurrentView(viewKey);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleOpenBookingModal = () => {
    fetchRoomTypes();
    setBookingModalVisible(true);
  };

  const handleOpenRoomModal = () => {
    setRoomModalVisible(true);
  };

  const handleViewBill = async (bookingId) => {
    setBillLoading(true);
    setInvoiceModalVisible(true);
    try {
      const res = await bookingApi.getBill(bookingId);
      setBillData(res.data);
    } catch (err) {
      message.error(err.message || 'Failed to fetch invoice bill');
      setInvoiceModalVisible(false);
    } finally {
      setBillLoading(false);
    }
  };

  const handleBookingSuccess = () => {
    fetchRoomTypes();
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleRoomSuccess = () => {
    fetchRoomTypes();
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleBookingUpdated = () => {
    fetchRoomTypes();
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0d5257',
          colorInfo: '#0d5257',
          borderRadius: 8,
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f1f5f9',
        },
        components: {
          Button: {
            controlHeight: 38,
            borderRadius: 8,
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#475569',
            headerBorderRadius: 8,
          },
          Card: {
            headerBg: '#ffffff',
          },
        },
      }}
    >
      <AntApp>
        <Layout style={{ minHeight: '100vh', background: '#f1f5f9' }}>
          <Navbar
            onOpenBookingModal={handleOpenBookingModal}
            onOpenRoomModal={handleOpenRoomModal}
          />
          <Layout>
            <Sidebar currentKey={currentView} onSelectKey={handleSelectView} />
            <Content
              style={{
                padding: '24px 32px',
                minHeight: 'calc(100vh - 64px)',
                background: '#f1f5f9',
                overflowY: 'auto',
              }}
            >
              <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                {currentView === 'dashboard' && (
                  <DashboardPage
                    key={`dash-${refreshTrigger}`}
                    onNavigate={handleSelectView}
                    onOpenBookingModal={handleOpenBookingModal}
                    onOpenRoomModal={handleOpenRoomModal}
                    onViewBill={handleViewBill}
                  />
                )}
                {currentView === 'rooms' && (
                  <RoomsPage
                    key={`rooms-${refreshTrigger}`}
                    onOpenBookingWithRoom={() => {
                      handleOpenBookingModal();
                    }}
                  />
                )}
                {currentView === 'bookings' && (
                  <BookingsPage
                    key={`bookings-${refreshTrigger}`}
                    onOpenBookingModal={handleOpenBookingModal}
                    onViewBill={handleViewBill}
                    onBookingUpdated={handleBookingUpdated}
                  />
                )}
                {currentView === 'billing' && (
                  <BillingPage
                    key={`billing-${refreshTrigger}`}
                    onViewBill={handleViewBill}
                  />
                )}
              </div>
            </Content>
          </Layout>

          {/* Global Modals */}
          <BookingModal
            visible={bookingModalVisible}
            onClose={() => setBookingModalVisible(false)}
            onSuccess={handleBookingSuccess}
            roomTypes={roomTypes}
          />

          <RoomTypeModal
            visible={roomModalVisible}
            onClose={() => setRoomModalVisible(false)}
            onSuccess={handleRoomSuccess}
          />

          <InvoiceModal
            visible={invoiceModalVisible}
            onClose={() => {
              setInvoiceModalVisible(false);
              setBillData(null);
            }}
            billData={billData}
            loading={billLoading}
          />
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}
