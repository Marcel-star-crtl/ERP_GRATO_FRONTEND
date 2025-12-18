import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    Button,
    Modal,
    Form,
    Typography,
    Tag,
    Space,
    Input,
    Select,
    DatePicker,
    Alert,
    message,
    Spin
} from 'antd';
import {
    PlusOutlined,
    TrophyOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { kpiAPI } from '../../services/kpiAPI';
import { actionItemAPI } from '../../services/actionItemAPI';
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const CreatePersonalTask = ({ visible, onClose, onSuccess }) => {
const [form] = Form.useForm();
const [loading, setLoading] = useState(false);
const [approvedKPIs, setApprovedKPIs] = useState(null);
const [loadingKPIs, setLoadingKPIs] = useState(false);
useEffect(() => {
    if (visible) {
        loadApprovedKPIs();
    }
}, [visible]);

const loadApprovedKPIs = async () => {
    try {
        setLoadingKPIs(true);
        const result = await kpiAPI.getApprovedKPIsForLinking();
        
        if (result.success && result.data) {
            setApprovedKPIs(result.data);
        } else {
            setApprovedKPIs(null);
        }
    } catch (error) {
        console.error('Error loading KPIs:', error);
        setApprovedKPIs(null);
    } finally {
        setLoadingKPIs(false);
    }
};

const handleSubmit = async (values) => {
    try {
        setLoading(true);

        // Validate KPI selection
        if (!values.linkedKPIs || values.linkedKPIs.length === 0) {
            message.error('Please select at least one KPI to link this task');
            return;
        }

        // Build linkedKPIs array
        const linkedKPIs = values.linkedKPIs.map(kpiIndex => ({
            kpiDocId: approvedKPIs._id,
            kpiIndex: kpiIndex
        }));

        const taskData = {
            title: values.title,
            description: values.description,
            priority: values.priority,
            dueDate: values.dueDate.format('YYYY-MM-DD'),
            linkedKPIs: linkedKPIs,
            notes: values.notes || ''
        };

        console.log('Creating personal task:', taskData);

        const result = await actionItemAPI.createPersonalTask(taskData);

        if (result.success) {
            message.success('Personal task created and sent to supervisor for approval!');
            form.resetFields();
            onClose();
            if (onSuccess) onSuccess();
        } else {
            message.error(result.message || 'Failed to create personal task');
        }
    } catch (error) {
        console.error('Error creating personal task:', error);
        message.error('Failed to create personal task');
    } finally {
        setLoading(false);
    }
};

const getPriorityIcon = (priority) => {
    const icons = {
        'LOW': '🟢',
        'MEDIUM': '🟡',
        'HIGH': '🟠',
        'CRITICAL': '🔴'
    };
    return icons[priority] || '';
};

return (
    <Modal
        title={
            <Space>
                <PlusOutlined />
                Create Personal Task
            </Space>
        }
        open={visible}
        onCancel={() => {
            form.resetFields();
            onClose();
        }}
        footer={null}
        width={800}
        destroyOnClose
    >
        <Alert
            message="Personal Task Creation"
            description="Personal tasks must be linked to your approved KPIs and require supervisor approval before you can start working on them."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
        />

        {loadingKPIs ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <p style={{ marginTop: 16 }}>Loading your approved KPIs...</p>
            </div>
        ) : !approvedKPIs || !approvedKPIs.kpis || approvedKPIs.kpis.length === 0 ? (
            <Alert
                message="No Approved KPIs Found"
                description="You need approved KPIs for the current quarter before creating personal tasks. Please set up your KPIs first."
                type="error"
                showIcon
                action={
                    <Button type="primary" onClick={() => window.location.href = '/employee/kpis'}>
                        Go to KPI Setup
                    </Button>
                }
            />
        ) : (
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    name="title"
                    label="Task Title"
                    rules={[
                        { required: true, message: 'Please enter task title' },
                        { min: 5, message: 'Title must be at least 5 characters' }
                    ]}
                >
                    <Input placeholder="e.g., Complete quarterly report analysis" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Task Description"
                    rules={[
                        { required: true, message: 'Please enter task description' },
                        { min: 20, message: 'Description must be at least 20 characters' }
                    ]}
                >
                    <TextArea
                        rows={4}
                        placeholder="Provide detailed description of what needs to be done, expected outcomes, and any relevant information..."
                        showCount
                        maxLength={500}
                    />
                </Form.Item>

                <Space style={{ width: '100%' }} direction="vertical" size="middle">
                    <Form.Item
                        name="priority"
                        label="Priority Level"
                        rules={[{ required: true, message: 'Please select priority' }]}
                    >
                        <Select placeholder="Select priority">
                            <Option value="LOW">🟢 Low Priority</Option>
                            <Option value="MEDIUM">🟡 Medium Priority</Option>
                            <Option value="HIGH">🟠 High Priority</Option>
                            <Option value="CRITICAL">🔴 Critical Priority</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="dueDate"
                        label="Due Date"
                        rules={[{ required: true, message: 'Please select due date' }]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            disabledDate={(current) => current && current < moment().startOf('day')}
                        />
                    </Form.Item>

                    <Form.Item
                        name="linkedKPIs"
                        label={
                            <Space>
                                <TrophyOutlined />
                                <Text>Link to Your KPIs (Required)</Text>
                            </Space>
                        }
                        rules={[{ required: true, message: 'Please select at least one KPI' }]}
                        extra="Select one or more KPIs that this task will contribute to. Task completion will impact your KPI achievement."
                    >
                        <Select
                            mode="multiple"
                            placeholder="Select KPIs this task contributes to"
                            optionLabelProp="label"
                        >
                            {approvedKPIs?.kpis.map((kpi, index) => (
                                <Option 
                                    key={index} 
                                    value={index}
                                    label={kpi.title}
                                >
                                    <div style={{ padding: '8px 0' }}>
                                        <div>
                                            <Text strong>{kpi.title}</Text>
                                            <Tag color="blue" style={{ marginLeft: 8 }}>
                                                Weight: {kpi.weight}%
                                            </Tag>
                                            <Tag color="green" style={{ marginLeft: 4 }}>
                                                Achievement: {Math.round(kpi.achievement || 0)}%
                                            </Tag>
                                        </div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {kpi.description.substring(0, 80)}...
                                        </Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '11px' }}>
                                            Target: {kpi.targetValue}
                                        </Text>
                                    </div>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="notes"
                        label="Additional Notes (Optional)"
                    >
                        <TextArea
                            rows={2}
                            placeholder="Any additional information or context..."
                            maxLength={300}
                        />
                    </Form.Item>
                </Space>

                <Alert
                    message="Approval Required"
                    description="This task will be sent to your supervisor for approval before you can start working on it."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                />

                <Form.Item>
                    <Space>
                        <Button onClick={() => {
                            form.resetFields();
                            onClose();
                        }}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            icon={<PlusOutlined />}
                        >
                            Create Personal Task
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        )}
    </Modal>
);
};
export default CreatePersonalTask;