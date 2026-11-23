import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Alert, message } from 'antd';
import { AppstoreAddOutlined, EditOutlined } from '@ant-design/icons';
import { roomTypeApi } from '../api/roomTypes';

export default function RoomTypeModal({ visible, onClose, onSuccess, initialValues = null }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  const isEdit = Boolean(initialValues?.id);

  useEffect(() => {
    if (visible) {
      setServerError(null);
      if (initialValues) {
        form.setFieldsValue({
          name: initialValues.name,
          price_per_night: Number(initialValues.price_per_night),
          total_rooms: Number(initialValues.total_rooms),
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, initialValues, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setServerError(null);

      const payload = {
        name: values.name.trim(),
        price_per_night: Number(values.price_per_night),
        total_rooms: Number(values.total_rooms),
      };

      let result;
      if (isEdit) {
        result = await roomTypeApi.update(initialValues.id, payload);
        message.success(`Room type "${values.name}" updated successfully!`);
      } else {
        result = await roomTypeApi.create(payload);
        message.success(`Room type "${values.name}" created successfully!`);
      }

      if (onSuccess) onSuccess(result.data);
      onClose();
    } catch (err) {
      if (err.errorFields) return;
      setServerError(err.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText={isEdit ? 'Save Changes' : 'Create Room Type'}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isEdit ? (
            <EditOutlined style={{ color: '#0d5257', fontSize: 20 }} />
          ) : (
            <AppstoreAddOutlined style={{ color: '#0d5257', fontSize: 20 }} />
          )}
          <span>{isEdit ? `Edit Room Type: ${initialValues?.name}` : 'Add New Room Type'}</span>
        </div>
      }
      destroyOnClose
    >
      {serverError && (
        <Alert
          message="Failed to Save"
          description={serverError}
          type="error"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
          closable
          onClose={() => setServerError(null)}
        />
      )}

      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item
          name="name"
          label="Room Type Name"
          rules={[
            { required: true, message: 'Please enter room type name' },
            { min: 2, message: 'Name must be at least 2 characters' },
            { max: 50, message: 'Name cannot exceed 50 characters' },
          ]}
        >
          <Input placeholder="e.g. Standard, Deluxe, Presidential Suite" size="large" />
        </Form.Item>

        <Form.Item
          name="price_per_night"
          label="Price Per Night (₹)"
          rules={[
            { required: true, message: 'Please enter price per night' },
            {
              type: 'number',
              min: 1,
              max: 1000000,
              message: 'Price must be between ₹1 and ₹10,00,000',
            },
          ]}
        >
          <InputNumber
            size="large"
            style={{ width: '100%' }}
            placeholder="e.g. 2500"
            prefix="₹"
            precision={2}
          />
        </Form.Item>

        <Form.Item
          name="total_rooms"
          label="Total Number of Rooms in Hotel"
          tooltip={
            isEdit
              ? 'Cannot reduce below peak confirmed reservations on any overlapping night'
              : 'Total physical inventory of this room category'
          }
          rules={[
            { required: true, message: 'Please enter total number of rooms' },
            {
              type: 'integer',
              min: 1,
              max: 1000,
              message: 'Total rooms must be between 1 and 1000',
            },
          ]}
        >
          <InputNumber
            size="large"
            style={{ width: '100%' }}
            placeholder="e.g. 10"
            precision={0}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
