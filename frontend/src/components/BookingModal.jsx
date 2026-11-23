import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Alert,
  Tag,
  Spin,
  Space,
  message,
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  DollarCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { bookingApi } from '../api/bookings';
import { calculateClientBill, formatCurrency } from '../utils/formatters';

const { Text } = Typography;

export default function BookingModal({ visible, onClose, onSuccess, roomTypes = [] }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);

  // Watch fields for live bill computation and availability check
  const selectedRoomTypeId = Form.useWatch('room_type_id', form);
  const selectedDates = Form.useWatch('dates', form);

  const selectedRoomType = roomTypes.find((r) => r.id === selectedRoomTypeId);

  const checkInStr = selectedDates && selectedDates[0] ? selectedDates[0].format('YYYY-MM-DD') : null;
  const checkOutStr = selectedDates && selectedDates[1] ? selectedDates[1].format('YYYY-MM-DD') : null;

  const billEstimate = calculateClientBill(
    selectedRoomType ? selectedRoomType.price_per_night : 0,
    checkInStr,
    checkOutStr
  );

  // Live availability check whenever room type or dates change
  useEffect(() => {
    let active = true;
    if (selectedRoomTypeId && checkInStr && checkOutStr && billEstimate.nights > 0) {
      setCheckingAvailability(true);
      bookingApi
        .checkAvailability({
          room_type_id: selectedRoomTypeId,
          check_in: checkInStr,
          check_out: checkOutStr,
        })
        .then((res) => {
          if (active) {
            setAvailabilityResult(res.data);
          }
        })
        .catch((err) => {
          if (active) {
            console.error('Availability check failed:', err);
          }
        })
        .finally(() => {
          if (active) setCheckingAvailability(false);
        });
    } else {
      setAvailabilityResult(null);
    }
    return () => {
      active = false;
    };
  }, [selectedRoomTypeId, checkInStr, checkOutStr, billEstimate.nights]);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setServerError(null);
      setAvailabilityResult(null);
    }
  }, [visible, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (availabilityResult && !availabilityResult.is_available) {
        message.error('No rooms available for the selected dates. Please choose another date or room type.');
        return;
      }

      setLoading(true);
      setServerError(null);

      const payload = {
        guest_name: values.guest_name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        room_type_id: values.room_type_id,
        check_in: values.dates[0].format('YYYY-MM-DD'),
        check_out: values.dates[1].format('YYYY-MM-DD'),
      };

      const response = await bookingApi.create(payload);
      message.success('Booking confirmed successfully! Room has been reserved.');
      if (onSuccess) onSuccess(response.data);
      onClose();
    } catch (err) {
      if (err.errorFields) return;
      setServerError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const disabledDate = (current) => {
    return current && current < dayjs().startOf('day');
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Confirm & Reserve Room"
      confirmLoading={loading}
      okButtonProps={{
        disabled: availabilityResult && !availabilityResult.is_available,
      }}
      width={720}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#e6f4ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0d5257',
              fontSize: 18,
            }}
          >
            <HomeOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#0f172a' }}>Create New Guest Booking</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Reserve room with automatic availability deduction</div>
          </div>
        </div>
      }
      destroyOnClose
    >
      {serverError && (
        <Alert
          message="Booking Unavailable"
          description={serverError}
          type="error"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
          closable
          onClose={() => setServerError(null)}
        />
      )}

      <Form form={form} layout="vertical" requiredMark="optional">
        {/* Guest Information */}
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>
            Guest Information
          </Text>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col xs={24} md={12}>
              <Form.Item
                name="guest_name"
                label="Guest Full Name"
                rules={[
                  { required: true, message: 'Please enter guest name' },
                  { min: 2, message: 'Name must be at least 2 characters' },
                  { max: 100, message: 'Name cannot exceed 100 characters' },
                  {
                    pattern: /^[A-Za-z .'-]+$/,
                    message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
                  },
                ]}
              >
                <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="e.g. Rahul Sharma" size="large" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="Phone Number (10 Digits)"
                rules={[
                  { required: true, message: 'Please enter phone number' },
                  { pattern: /^[0-9]{10}$/, message: 'Phone must be exactly a 10-digit number' },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  size="large"
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter email address' },
                  { type: 'email', message: 'Please enter a valid email address' },
                  { max: 100, message: 'Email cannot exceed 100 characters' },
                ]}
              >
                <Input prefix={<MailOutlined style={{ color: '#94a3b8' }} />} placeholder="e.g. rahul@example.com" size="large" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider style={{ margin: '8px 0 16px 0' }} />

        {/* Room & Dates */}
        <div>
          <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>
            Room Selection & Dates
          </Text>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col xs={24} md={12}>
              <Form.Item
                name="room_type_id"
                label="Room Type"
                rules={[{ required: true, message: 'Please select a room type' }]}
              >
                <Select
                  size="large"
                  placeholder="Select room type"
                  options={roomTypes.map((rt) => {
                    const avail = rt.available_rooms !== undefined ? rt.available_rooms : rt.total_rooms;
                    return {
                      value: rt.id,
                      label: `${rt.name} - ${formatCurrency(rt.price_per_night)}/night (${avail} available / ${rt.total_rooms} total)`,
                    };
                  })}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="dates"
                label="Stay Duration (Check-In to Check-Out)"
                rules={[
                  { required: true, message: 'Please select check-in and check-out dates' },
                  () => ({
                    validator(_, value) {
                      if (!value || !value[0] || !value[1]) return Promise.resolve();
                      const nights = value[1].diff(value[0], 'day');
                      if (nights <= 0) {
                        return Promise.reject(new Error('Check-out date must be at least 1 day after check-in'));
                      }
                      if (nights > 30) {
                        return Promise.reject(new Error('Maximum stay duration is 30 nights'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker.RangePicker
                  size="large"
                  style={{ width: '100%' }}
                  disabledDate={disabledDate}
                  format="DD MMM YYYY"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Live Availability Status Indicator */}
          {selectedRoomTypeId && checkInStr && checkOutStr && (
            <div style={{ marginBottom: 12 }}>
              {checkingAvailability ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: '#f8fafc', borderRadius: 6 }}>
                  <Spin size="small" />
                  <Text type="secondary" style={{ fontSize: 12 }}>Checking live room availability for selected dates...</Text>
                </div>
              ) : availabilityResult ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: availabilityResult.is_available ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${availabilityResult.is_available ? '#bbf7d0' : '#fecaca'}`,
                  }}
                >
                  <Space>
                    {availabilityResult.is_available ? (
                      <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 16 }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#dc2626', fontSize: 16 }} />
                    )}
                    <span style={{ fontWeight: 600, color: availabilityResult.is_available ? '#166534' : '#991b1b', fontSize: 13 }}>
                      {availabilityResult.is_available
                        ? `Available: ${availabilityResult.available_rooms} of ${availabilityResult.total_rooms} rooms free for this stay period`
                        : `Sold Out: All ${availabilityResult.total_rooms} rooms of this type are already booked for these dates`}
                    </span>
                  </Space>
                  <Tag color={availabilityResult.is_available ? 'success' : 'error'} style={{ fontWeight: 700 }}>
                    {availabilityResult.is_available ? 'Ready to Book' : 'Unavailable'}
                  </Tag>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Live Billing Estimation */}
        {billEstimate.nights > 0 && selectedRoomType && (
          <Card
            style={{
              background: '#f8fafc',
              borderColor: '#cbd5e1',
              borderRadius: 8,
              marginTop: 8,
            }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <DollarCircleOutlined style={{ color: '#0d5257', fontSize: 18 }} />
              <Text strong style={{ color: '#0d5257', fontSize: 14 }}>
                Instant Price & GST Breakdown ({billEstimate.nights} Night{billEstimate.nights > 1 ? 's' : ''})
              </Text>
            </div>

            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Text type="secondary">Room Rate:</Text>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Text>{formatCurrency(selectedRoomType.price_per_night)} / night</Text>
              </Col>

              <Col span={12}>
                <Text type="secondary">Room Charges ({billEstimate.nights} × {formatCurrency(selectedRoomType.price_per_night)}):</Text>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Text strong>{formatCurrency(billEstimate.roomCharges)}</Text>
              </Col>

              <Col span={12}>
                <Text type="secondary">GST (12%):</Text>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Text strong style={{ color: '#c59b27' }}>+ {formatCurrency(billEstimate.gstAmount)}</Text>
              </Col>

              <Col span={24}>
                <Divider style={{ margin: '8px 0' }} />
              </Col>

              <Col span={12}>
                <Text strong style={{ fontSize: 16, color: '#0d5257' }}>Total Estimated Amount:</Text>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Text strong style={{ fontSize: 18, color: '#0d5257' }}>
                  {formatCurrency(billEstimate.totalAmount)}
                </Text>
              </Col>
            </Row>
          </Card>
        )}
      </Form>
    </Modal>
  );
}
