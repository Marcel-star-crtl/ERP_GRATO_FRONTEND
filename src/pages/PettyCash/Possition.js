// import React from 'react';
// import { Card, Typography, Divider, Row, Col, Statistic } from 'antd';
// import {
//   MoneyCollectOutlined,
//   WalletOutlined,
//   RiseOutlined,
//   FallOutlined
// } from '@ant-design/icons';

// const { Title, Text } = Typography;

// const Position = () => {
//   // This data would typically come from an API or state management
//   const positionData = {
//     companyInfo: {
//       name: 'Grato Inc.',
//       address: 'P.O. Box Ancienne Route',
//       city: 'Doula Cameroon',
//       telephone: '+237 670000000'
//     },
//     financials: {
//       openingBalance: 10000.00,
//       cashSales: 0.00,
//       otherFunding: 0.00,
//       totalFundReceived: 10000.00,
//       bills: 0.00,
//       advances: 0.00,
//       advanceSalary: 0.00,
//       chequeToEncash: 0.00,
//       cashInHand: 10000.00
//     }
//   };

//   const totalExpenses = positionData.financials.bills + 
//                        positionData.financials.advances + 
//                        positionData.financials.advanceSalary + 
//                        positionData.financials.chequeToEncash;

//   return (
//     <div style={{ padding: '24px' }}>
//       <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
//         Petty Cash Position
//       </Title>

//       {/* Summary Cards */}
//       <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
//         <Col xs={24} sm={12} md={6}>
//           <Card>
//             <Statistic
//               title="Total Funds"
//               value={positionData.financials.totalFundReceived}
//               precision={2}
//               prefix={<RiseOutlined style={{ color: '#3f8600' }} />}
//               valueStyle={{ color: '#3f8600' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card>
//             <Statistic
//               title="Total Expenses"
//               value={totalExpenses}
//               precision={2}
//               prefix={<FallOutlined style={{ color: '#cf1322' }} />}
//               valueStyle={{ color: '#cf1322' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card>
//             <Statistic
//               title="Cash in Hand"
//               value={positionData.financials.cashInHand}
//               precision={2}
//               prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
//               valueStyle={{ color: '#1890ff' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card>
//             <Statistic
//               title="Opening Balance"
//               value={positionData.financials.openingBalance}
//               precision={2}
//               prefix={<MoneyCollectOutlined />}
//             />
//           </Card>
//         </Col>
//       </Row>

//       {/* Detailed Statement */}
//       <Row justify="center">
//         <Col xs={24} md={16} lg={12}>
//           <Card 
//             title="PETTYCASH STATEMENT" 
//             bordered
//             headStyle={{ 
//               fontSize: '18px',
//               fontWeight: 'bold',
//               textAlign: 'center',
//               backgroundColor: '#f5f5f5'
//             }}
//           >
//             {/* Company Information */}
//             <div style={{ marginBottom: 16, textAlign: 'center' }}>
//               <Text strong style={{ fontSize: '16px' }}>{positionData.companyInfo.name}</Text><br />
//               <Text type="secondary">{positionData.companyInfo.address}</Text><br />
//               <Text type="secondary">{positionData.companyInfo.city}</Text><br />
//               <Text type="secondary">Tel: {positionData.companyInfo.telephone}</Text>
//             </div>
            
//             <Divider />
            
//             <div style={{ textAlign: 'center', marginBottom: 16 }}>
//               <Text strong style={{ fontSize: '16px' }}>PETTYCASH STATEMENT</Text><br />
//               <Text type="secondary">AS ON {new Date().toLocaleDateString()}</Text>
//             </div>
            
//             <Divider />
            
//             {/* Funds Received Section */}
//             <div style={{ marginBottom: 16 }}>
//               <Text strong style={{ color: '#3f8600', fontSize: '14px' }}>FUNDS RECEIVED</Text>
//             </div>
            
//             <Row gutter={8} style={{ marginBottom: 4 }}>
//               <Col span={16}><Text>Opening Balance:</Text></Col>
//               <Col span={8} style={{ textAlign: 'right' }}>
//                 <Text>{positionData.financials.openingBalance.toFixed(2)}</Text>
//               </Col>
//             </Row>
//             <Row gutter={8} style={{ marginBottom: 4 }}>
//               <Col span={16}><Text>Cash Sales:</Text></Col>
//               <Col span={8} style={{ textAlign: 'right' }}>
//                 <Text>{positionData.financials.cashSales.toFixed(2)}</Text>
//               </Col>
//             </Row>
//             <Row gutter={8} style={{ marginBottom: 8 }}>
//               <Col span={16}><Text>Other Funding:</Text></Col>
//               <Col span={8} style={{ textAlign: 'right' }}>
//                 <Text>{positionData.financials.otherFunding.toFixed(2)}</Text>
//               </Col>
//             </Row>
            
//             <Row gutter={8} style={{ marginBottom: 16, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
//               <Col span={16}><Text strong style={{ color: '#3f8600' }}>Total Fund Received:</Text></Col>
//               <Col span={8} style={{ textAlign: 'right' }}>
//                 <Text strong style={{ color: '#3f8600' }}>{positionData.financials.totalFundReceived.toFixed(2)}</Text>
//               </Col>
//             </Row>
            
//             {/* Expenses Section */}
//             <div style={{ marginBottom: 16 }}>
//               <Text strong style={{ color: '#cf1322', fontSize: '14px' }}>EXPENSES</Text>
//             </div>
            
//             <Row gutter={8} style={{ marginBottom: 4 }}>
//               <Col span={16}><Text>Bills:</Text></Col>
//               <Col span={8} style={{ textAlign: 'right' }}>
//                 <Text>({positionData.financials.bills.toFixed(2)})</Text>
//               </Col>
//             </Row>
//             <Row gutter={8} style={{ marginBottom: 4 }}>
//               <Col span={16}><Text>Advances:</Text></Col>
//               <Col span={8} style={{ textAlign: 'right' }}>
//                 <Text>({positionData.financials.advances.toFixed(2)})</Text>
//               </Col>
//             </Row>
//             <Row gutter={8} style={{ marginBottom: 4 }}>
//               <Col span={16}><Text>Advance Salary:</Text></Col>
//               <Col span={8} style={{ textAlign: 'right' }}>
//                 <Text>({positionData.financials.advanceSalary.toFixed(2)})</Text>
//               </Col>
//             </Row>
//             <Row gutter={8} style={{ marginBottom: 16 }}>
//               <Col span={16}><Text>Cheque To Encash:</Text></Col>
//               <Col span={8} style={{ textAlign: 'right' }}>
//                 <Text>({positionData.financials.chequeToEncash.toFixed(2)})</Text>
//               </Col>
//             </Row>
            
//             <Divider style={{ margin: '16px 0', borderColor: '#1890ff' }} />
            
//             {/* Final Balance */}
//             <Row gutter={8}>
//               <Col span={16}>
//                 <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>Cash In Hand:</Text>
//               </Col>
//               <Col span={8} style={{ textAlign: 'right' }}>
//                 <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
//                   {positionData.financials.cashInHand.toFixed(2)}
//                 </Text>
//               </Col>
//             </Row>
            
//             {/* Print Footer */}
//             <div style={{ marginTop: 24, textAlign: 'center', fontSize: '12px', color: '#8c8c8c' }}>
//               <Text type="secondary">Generated on {new Date().toLocaleString()}</Text>
//             </div>
//           </Card>
//         </Col>
//       </Row>
//     </div>
//   );
// };

// export default Position;








import React, { useEffect } from 'react';
import {
    Card,
    Typography,
    Divider,
    Row,
    Col,
    Statistic,
    Spin,
    message,
    Button,
    Alert
} from 'antd';
import {
    MoneyCollectOutlined,
    WalletOutlined,
    RiseOutlined,
    FallOutlined,
    SettingOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchCurrentPosition,
    fetchCompanySettings
} from '../../features/pettyCash/pettyCashSlice';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Position = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {
        currentPosition,
        companySettings,
        loading,
        error
    } = useSelector((state) => state.pettyCash);

    useEffect(() => {
        // First fetch company settings, then position data
        dispatch(fetchCompanySettings()).then((result) => {
            if (result.meta.requestStatus === 'fulfilled') {
                // Only fetch position if company settings exist
                dispatch(fetchCurrentPosition());
            }
        });
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            console.error('Position page error:', error);

            // Check if it's a company settings related error
            if (error.includes('not found') || error.includes('404') || error.includes('Company')) {
                message.warning('Company settings must be configured first before viewing position.');
            } else {
                message.error(`Error: ${error}`);
            }
        }
    }, [error]);

    const handleGoToSettings = () => {
        navigate('/account-settings');
    };

    const retryFetch = () => {
        dispatch(fetchCompanySettings()).then((result) => {
            if (result.meta.requestStatus === 'fulfilled') {
                dispatch(fetchCurrentPosition());
            }
        });
    };

    // Show loading while fetching initial data
    if (loading && !currentPosition && !error) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    // Show error state if company settings not found
    if (error && !currentPosition && !companySettings) {
        return (
            <div style={{ padding: '24px' }}>
                <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
                    Petty Cash Position
                </Title>

                <Row justify="center">
                    <Col xs={24} sm={20} md={16} lg={12}>
                        <Alert
                            message="Setup Required"
                            description="Company settings must be configured before you can view the petty cash position. Please set up your company information first."
                            type="warning"
                            showIcon
                            style={{ marginBottom: 24 }}
                        />

                        <Card style={{ textAlign: 'center' }}>
                            <div style={{ padding: '40px 20px' }}>
                                <SettingOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: 16 }} />
                                <Title level={4}>Company Settings Required</Title>
                                <div style={{ marginBottom: 24, color: 'rgba(0,0,0,0.65)' }}>
                                    To view your petty cash position, you need to first configure your company settings
                                    including the opening balance and basic company information.
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <Button
                                        type="primary"
                                        icon={<SettingOutlined />}
                                        onClick={handleGoToSettings}
                                    >
                                        Go to Company Settings
                                    </Button>
                                    <Button
                                        onClick={retryFetch}
                                        loading={loading}
                                    >
                                        Retry
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }

    // Access computed values directly from currentPosition?.financials
    const openingBalance = currentPosition?.financials?.openingBalance || 0;
    const totalExpenses = currentPosition?.financials?.totalExpenses || 0;
    const totalFundReceived = currentPosition?.financials?.totalFundReceived || 0;
    const cashInHand = currentPosition?.financials?.cashInHand || 0;


    // Use company settings for company info if currentPosition.companyInfo is not fully populated
    // This provides a fallback and ensures all company details are displayed
    const companyInfo = currentPosition?.companyInfo || {
        name: companySettings?.name || 'Company Name',
        address: companySettings?.address || '',
        city: companySettings?.city || '',
        telephone: companySettings?.telephone || '',
        currency: companySettings?.currency || '' // Ensure currency is also available for display if needed
    };

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
                Petty Cash Position
            </Title>

            {/* Summary Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Funds"
                            value={totalFundReceived.toFixed(2)}
                            precision={2}
                            prefix={<RiseOutlined style={{ color: '#3f8600' }} />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Expenses"
                            value={totalExpenses.toFixed(2)}
                            precision={2}
                            prefix={<FallOutlined style={{ color: '#cf1322' }} />}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Cash in Hand"
                            value={cashInHand.toFixed(2)}
                            precision={2}
                            prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Opening Balance"
                            value={openingBalance.toFixed(2)}
                            precision={2}
                            prefix={<MoneyCollectOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Detailed Statement */}
            <Row justify="center">
                <Col xs={24} md={16} lg={12}>
                    <Card
                        title="PETTYCASH STATEMENT"
                        bordered
                        headStyle={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            backgroundColor: '#f5f5f5'
                        }}
                    >
                        {/* Company Information */}
                        <div style={{ marginBottom: 16, textAlign: 'center' }}>
                            <Text strong style={{ fontSize: '16px' }}>{companyInfo.name}</Text><br />
                            {companyInfo.address && (
                                <>
                                    <Text type="secondary">{companyInfo.address}</Text><br />
                                </>
                            )}
                            {companyInfo.city && (
                                <>
                                    <Text type="secondary">{companyInfo.city}</Text><br />
                                </>
                            )}
                            {companyInfo.telephone && (
                                <Text type="secondary">Tel: {companyInfo.telephone}</Text>
                            )}
                        </div>

                        <Divider />

                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <Text strong style={{ fontSize: '16px' }}>PETTYCASH STATEMENT</Text><br />
                            <Text type="secondary">AS ON {new Date().toLocaleDateString()}</Text>
                        </div>

                        <Divider />

                        {/* Funds Received Section */}
                        <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ color: '#3f8600', fontSize: '14px' }}>FUNDS RECEIVED</Text>
                        </div>

                        <Row gutter={8} style={{ marginBottom: 4 }}>
                            <Col span={16}><Text>Opening Balance:</Text></Col>
                            <Col span={8} style={{ textAlign: 'right' }}>
                                <Text>{openingBalance.toFixed(2)}</Text>
                            </Col>
                        </Row>
                        <Row gutter={8} style={{ marginBottom: 4 }}>
                            <Col span={16}><Text>Cash Sales:</Text></Col>
                            <Col span={8} style={{ textAlign: 'right' }}>
                                <Text>{(currentPosition?.financials?.cashSales || 0).toFixed(2)}</Text>
                            </Col>
                        </Row>
                        <Row gutter={8} style={{ marginBottom: 8 }}>
                            <Col span={16}><Text>Other Funding:</Text></Col>
                            <Col span={8} style={{ textAlign: 'right' }}>
                                <Text>{(currentPosition?.financials?.otherFunding || 0).toFixed(2)}</Text>
                            </Col>
                        </Row>

                        <Row gutter={8} style={{ marginBottom: 16, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                            <Col span={16}><Text strong style={{ color: '#3f8600' }}>Total Fund Received:</Text></Col>
                            <Col span={8} style={{ textAlign: 'right' }}>
                                <Text strong style={{ color: '#3f8600' }}>
                                    {totalFundReceived.toFixed(2)}
                                </Text>
                            </Col>
                        </Row>

                        {/* Expenses Section */}
                        <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ color: '#cf1322', fontSize: '14px' }}>EXPENSES</Text>
                        </div>

                        <Row gutter={8} style={{ marginBottom: 4 }}>
                            <Col span={16}><Text>Bills:</Text></Col>
                            <Col span={8} style={{ textAlign: 'right' }}>
                                <Text>({(currentPosition?.financials?.bills || 0).toFixed(2)})</Text>
                            </Col>
                        </Row>
                        <Row gutter={8} style={{ marginBottom: 4 }}>
                            <Col span={16}><Text>Advances:</Text></Col>
                            <Col span={8} style={{ textAlign: 'right' }}>
                                <Text>({(currentPosition?.financials?.advances || 0).toFixed(2)})</Text>
                            </Col>
                        </Row>
                        <Row gutter={8} style={{ marginBottom: 4 }}>
                            <Col span={16}><Text>Advance Salary:</Text></Col>
                            <Col span={8} style={{ textAlign: 'right' }}>
                                <Text>({(currentPosition?.financials?.advanceSalary || 0).toFixed(2)})</Text>
                            </Col>
                        </Row>
                        <Row gutter={8} style={{ marginBottom: 16 }}>
                            <Col span={16}><Text>Cheque To Encash:</Text></Col>
                            <Col span={8} style={{ textAlign: 'right' }}>
                                <Text>({(currentPosition?.financials?.chequeToEncash || 0).toFixed(2)})</Text>
                            </Col>
                        </Row>

                        <Divider style={{ margin: '16px 0', borderColor: '#1890ff' }} />

                        {/* Final Balance */}
                        <Row gutter={8}>
                            <Col span={16}>
                                <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>Cash In Hand:</Text>
                            </Col>
                            <Col span={8} style={{ textAlign: 'right' }}>
                                <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                                    {cashInHand.toFixed(2)}
                                </Text>
                            </Col>
                        </Row>

                        {/* Print Footer */}
                        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '12px', color: '#8c8c8c' }}>
                            <Text type="secondary">Generated on {new Date().toLocaleString()}</Text>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Refresh Button */}
            <Row justify="center" style={{ marginTop: 24 }}>
                <Button
                    onClick={retryFetch}
                    loading={loading}
                    type="default"
                >
                    Refresh Data
                </Button>
            </Row>
        </div>
    );
};

export default Position;