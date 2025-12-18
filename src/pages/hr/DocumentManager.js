import React, { useState } from 'react';
import {
  Card,
  Upload,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  message,
  Modal,
  Alert,
  List,
  Divider,
  Progress,
  Spin
} from 'antd';
import {
  UploadOutlined,
  FileOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  PlusOutlined,
  WarningOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const DocumentManager = ({ employeeId, employee, onUpdate }) => {
  const [uploading, setUploading] = useState({});
  const [deleting, setDeleting] = useState({});
  const [downloading, setDownloading] = useState({});
  const [viewing, setViewing] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);

  const documentTypes = [
    { key: 'nationalId', label: 'National ID (Certified Copy)', required: true },
    { key: 'birthCertificate', label: 'Birth Certificate', required: true },
    { key: 'bankAttestation', label: 'Bank Attestation', required: true },
    { key: 'locationPlan', label: 'Detailed Location Plan', required: true },
    { key: 'medicalCertificate', label: 'Medical Certificate', required: true },
    { key: 'criminalRecord', label: 'Criminal Record', required: true },
    { key: 'references', label: 'References (3)', required: true, multiple: true, maxCount: 3 },
    { key: 'academicDiplomas', label: 'Highest Academic Diplomas', required: true, multiple: true },
    { key: 'workCertificates', label: 'Work Certificates (Previous Employers)', required: false, multiple: true },
    { key: 'employmentContract', label: 'Employment Contract', required: true }
  ];

  const getDocumentStatus = (docKey) => {
    const docs = employee?.employmentDetails?.documents;
    if (!docs) return null;

    const docType = documentTypes.find(d => d.key === docKey);
    
    if (docType.multiple) {
      const docArray = docs[docKey];
      return docArray && docArray.length > 0 ? docArray : null;
    } else {
      const doc = docs[docKey];
      return doc && (doc.filename || doc.filePath) ? doc : null;
    }
  };

  const handleUpload = async (docType, file) => {
    try {
      console.log('\n=== DOCUMENT UPLOAD ===');
      console.log('Document Type:', docType);
      console.log('File:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);

      setUploading(prev => ({ ...prev, [docType]: true }));

      const formData = new FormData();
      formData.append('document', file);

      console.log('Uploading to:', `/hr/employees/${employeeId}/documents/${docType}`);

      const response = await api.post(
        `/hr/employees/${employeeId}/documents/${docType}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      );

      if (response.data.success) {
        console.log('✅ Upload successful:', response.data);
        message.success(`${documentTypes.find(d => d.key === docType).label} uploaded successfully`);
        onUpdate();
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      console.error('Response:', error.response?.data);
      message.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(prev => ({ ...prev, [docType]: false }));
    }

    return false; 
  };

  const handleDelete = async (docType, docId = null) => {
    Modal.confirm({
      title: 'Delete Document',
      content: 'Are you sure you want to delete this document? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const deleteKey = docId ? `${docType}-${docId}` : docType;
          setDeleting(prev => ({ ...prev, [deleteKey]: true }));

          const url = docId 
            ? `/hr/employees/${employeeId}/documents/${docId}`
            : `/hr/employees/${employeeId}/documents/${docType}`;

          console.log('Deleting document:', url);

          await api.delete(url);
          message.success('Document deleted successfully');
          onUpdate();
        } catch (error) {
          console.error('Delete error:', error);
          message.error(error.response?.data?.message || 'Failed to delete document');
        } finally {
          setDeleting(prev => ({ ...prev, [docType]: false }));
        }
      }
    });
  };

  const handleDownload = async (docType, doc, index = null) => {
    try {
      const downloadKey = doc._id || `${docType}-${index}`;
      setDownloading(prev => ({ ...prev, [downloadKey]: true }));

      console.log('\n=== DOCUMENT DOWNLOAD ===');
      console.log('Document:', doc.name);
      console.log('Public ID:', doc.publicId || doc.filename);

      // Use new download endpoint with publicId
      const publicId = doc.publicId || doc.filename;
      const downloadUrl = `/hr/documents/${employeeId}/download/${encodeURIComponent(publicId)}`;
      
      console.log('Download URL:', downloadUrl);

      const response = await api.get(downloadUrl, {
        responseType: 'blob',
        timeout: 60000
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.name || doc.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log('✅ Download completed');
      message.success('Document downloaded successfully');
    } catch (error) {
      console.error('❌ Download error:', error);
      message.error('Failed to download document');
    } finally {
      setDownloading(prev => ({ ...prev, [doc._id || `${docType}-${index}`]: false }));
    }
  };

  const handleView = async (doc) => {
    try {
      setViewing(true);
      
      console.log('\n=== DOCUMENT VIEW ===');
      console.log('Document:', doc.name);

      const ext = doc.name.split('.').pop().toLowerCase();
      const canViewInline = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);

      if (!canViewInline) {
        message.info('This file type cannot be viewed inline. Downloading instead...');
        return handleDownload(null, doc);
      }

      const publicId = doc.publicId || doc.filename;
      const viewUrl = `/hr/documents/${employeeId}/view/${encodeURIComponent(publicId)}`;
      
      setViewingFile({
        name: doc.name,
        url: `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}${viewUrl}`,
        type: ext === 'pdf' ? 'pdf' : 'image'
      });

    } catch (error) {
      console.error('View error:', error);
      message.error('Failed to view document');
      setViewing(false);
    }
  };

  const calculateCompletion = () => {
    const requiredDocs = documentTypes.filter(d => d.required);
    const uploaded = requiredDocs.filter(doc => {
      const status = getDocumentStatus(doc.key);
      if (doc.multiple) {
        return status && status.length > 0;
      }
      return status !== null;
    }).length;

    return {
      uploaded,
      total: requiredDocs.length,
      percentage: Math.round((uploaded / requiredDocs.length) * 100)
    };
  };

  const completion = calculateCompletion();

  return (
    <div>
      {/* Document Completion Progress */}
      <Card size="small" style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Text strong>Document Completion: </Text>
            <Text type="secondary">
              {completion.uploaded} of {completion.total} required documents uploaded
            </Text>
            <Progress
              percent={completion.percentage}
              status={completion.percentage === 100 ? 'success' : 'active'}
              style={{ marginTop: '8px' }}
            />
          </Col>
          {completion.percentage === 100 && (
            <Col>
              <CheckCircleOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
            </Col>
          )}
        </Row>
      </Card>

      {completion.percentage < 100 && (
        <Alert
          message="Missing Required Documents"
          description="Please upload all required documents to complete the employee profile."
          type="warning"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Document Upload Sections */}
      <Row gutter={[16, 16]}>
        {documentTypes.map((docType) => {
          const status = getDocumentStatus(docType.key);
          const isUploaded = status !== null;
          const isUploading = uploading[docType.key];

          return (
            <Col xs={24} md={12} key={docType.key}>
              <Card
                size="small"
                title={
                  <Space>
                    <FileOutlined />
                    {docType.label}
                    {docType.required && <Tag color="red">Required</Tag>}
                    {isUploaded && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  </Space>
                }
                extra={
                  isUploaded && !docType.multiple && (
                    <Space size="small">
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleView(status)}
                      />
                      <Button
                        type="link"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownload(docType.key, status)}
                        loading={downloading[status._id]}
                      />
                      <Button
                        type="link"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(docType.key)}
                        loading={deleting[docType.key]}
                      />
                    </Space>
                  )
                }
              >
                {docType.multiple ? (
                  <>
                    {status && status.length > 0 && (
                      <List
                        size="small"
                        dataSource={status}
                        renderItem={(doc, index) => (
                          <List.Item
                            actions={[
                              <Button
                                type="link"
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => handleView(doc)}
                              />,
                              <Button
                                type="link"
                                size="small"
                                icon={<DownloadOutlined />}
                                onClick={() => handleDownload(docType.key, doc, index)}
                                loading={downloading[doc._id]}
                              />,
                              <Button
                                type="link"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete(docType.key, doc._id)}
                                loading={deleting[`${docType.key}-${doc._id}`]}
                              />
                            ]}
                          >
                            <Space>
                              <FileOutlined />
                              <Text ellipsis style={{ maxWidth: '200px' }}>
                                {doc.name || doc.filename}
                              </Text>
                              <Text type="secondary" style={{ fontSize: '11px' }}>
                                {(doc.size / 1024).toFixed(1)} KB
                              </Text>
                            </Space>
                          </List.Item>
                        )}
                        style={{ marginBottom: '12px' }}
                      />
                    )}

                    {(!status || status.length < (docType.maxCount || 10)) && (
                      <Upload
                        beforeUpload={(file) => handleUpload(docType.key, file)}
                        showUploadList={false}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      >
                        <Button
                          icon={isUploading ? <LoadingOutlined /> : <PlusOutlined />}
                          loading={isUploading}
                          block
                          size="small"
                        >
                          Add {docType.label}
                        </Button>
                      </Upload>
                    )}
                  </>
                ) : (
                  <>
                    {isUploaded ? (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          <Text strong>Uploaded</Text>
                        </Space>
                        <Text type="secondary" ellipsis style={{ fontSize: '12px' }}>
                          {status.name || status.filename}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {(status.size / 1024).toFixed(1)} KB • {new Date(status.uploadedAt).toLocaleDateString()}
                        </Text>
                      </Space>
                    ) : (
                      <Dragger
                        beforeUpload={(file) => handleUpload(docType.key, file)}
                        showUploadList={false}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        disabled={isUploading}
                      >
                        <p className="ant-upload-drag-icon">
                          {isUploading ? <LoadingOutlined /> : <UploadOutlined />}
                        </p>
                        <p className="ant-upload-text">
                          {isUploading ? 'Uploading...' : 'Click or drag file to upload'}
                        </p>
                        <p className="ant-upload-hint" style={{ fontSize: '11px' }}>
                          PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                        </p>
                      </Dragger>
                    )}
                  </>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      <Divider />

      <Alert
        message="Document Guidelines"
        description={
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>All documents must be clear and legible</li>
            <li>ID copies must be certified</li>
            <li>Medical certificates must be recent (within 6 months)</li>
            <li>3 professional references are required</li>
            <li>Maximum file size: 10MB per document</li>
            <li>Accepted formats: PDF, DOC, DOCX, JPG, PNG</li>
          </ul>
        }
        type="info"
        showIcon
      />

      {/* File Viewer Modal */}
      <Modal
        title={viewingFile?.name || 'Document Viewer'}
        open={viewing && viewingFile}
        onCancel={() => {
          setViewing(false);
          setViewingFile(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setViewing(false);
            setViewingFile(null);
          }}>
            Close
          </Button>
        ]}
        width="90%"
        style={{ top: 20 }}
        bodyStyle={{ padding: '20px', minHeight: '70vh', textAlign: 'center' }}
      >
        {viewingFile && (
          viewingFile.type === 'pdf' ? (
            <iframe
              src={viewingFile.url}
              style={{ width: '100%', height: '70vh', border: 'none' }}
              title={viewingFile.name}
            />
          ) : (
            <img
              src={viewingFile.url}
              alt={viewingFile.name}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          )
        )}
      </Modal>
    </div>
  );
};

export default DocumentManager;









// // src/pages/hr/DocumentManager.jsx
// import React, { useState } from 'react';
// import {
//   Card,
//   Upload,
//   Button,
//   Space,
//   Typography,
//   Row,
//   Col,
//   Tag,
//   message,
//   Modal,
//   Alert,
//   List,
//   Divider,
//   Progress
// } from 'antd';
// import {
//   UploadOutlined,
//   FileOutlined,
//   CheckCircleOutlined,
//   DeleteOutlined,
//   DownloadOutlined,
//   EyeOutlined,
//   PlusOutlined,
//   WarningOutlined
// } from '@ant-design/icons';
// import api from '../../services/api';

// const { Title, Text } = Typography;
// const { Dragger } = Upload;

// const DocumentManager = ({ employeeId, employee, onUpdate }) => {
//   const [uploading, setUploading] = useState({});
//   const [deleting, setDeleting] = useState({});

//   const documentTypes = [
//     { key: 'nationalId', label: 'National ID (Certified Copy)', required: true },
//     { key: 'birthCertificate', label: 'Birth Certificate', required: true },
//     { key: 'bankAttestation', label: 'Bank Attestation', required: true },
//     { key: 'locationPlan', label: 'Detailed Location Plan', required: true },
//     { key: 'medicalCertificate', label: 'Medical Certificate', required: true },
//     { key: 'criminalRecord', label: 'Criminal Record', required: true },
//     { key: 'references', label: 'References (3)', required: true, multiple: true, maxCount: 3 },
//     { key: 'academicDiplomas', label: 'Highest Academic Diplomas', required: true, multiple: true },
//     { key: 'workCertificates', label: 'Work Certificates (Previous Employers)', required: false, multiple: true },
//     { key: 'employmentContract', label: 'Employment Contract', required: true }
//   ];

//   const getDocumentStatus = (docKey) => {
//     const docs = employee?.employmentDetails?.documents;
//     if (!docs) return null;

//     const docType = documentTypes.find(d => d.key === docKey);
    
//     if (docType.multiple) {
//       const docArray = docs[docKey];
//       return docArray && docArray.length > 0 ? docArray : null;
//     } else {
//       const doc = docs[docKey];
//       return doc && (doc.filename || doc.filePath) ? doc : null;
//     }
//   };

//   const handleUpload = async (docType, file) => {
//     try {
//       setUploading(prev => ({ ...prev, [docType]: true }));

//       const formData = new FormData();
//       formData.append('document', file);

//       const response = await api.post(
//         `/hr/employees/${employeeId}/documents/${docType}`,
//         formData,
//         {
//           headers: {
//             'Content-Type': 'multipart/form-data'
//           }
//         }
//       );

//       if (response.data.success) {
//         message.success(`${documentTypes.find(d => d.key === docType).label} uploaded successfully`);
//         onUpdate();
//       }
//     } catch (error) {
//       console.error('Upload error:', error);
//       message.error(error.response?.data?.message || 'Failed to upload document');
//     } finally {
//       setUploading(prev => ({ ...prev, [docType]: false }));
//     }

//     return false; 
//   };

//   const handleDelete = async (docType, docId = null) => {
//     Modal.confirm({
//       title: 'Delete Document',
//       content: 'Are you sure you want to delete this document?',
//       okText: 'Delete',
//       okType: 'danger',
//       onOk: async () => {
//         try {
//           const deleteKey = docId ? `${docType}-${docId}` : docType;
//           setDeleting(prev => ({ ...prev, [deleteKey]: true }));

//           const url = docId 
//             ? `/hr/employees/${employeeId}/documents/${docId}`
//             : `/hr/employees/${employeeId}/documents/${docType}`;

//           await api.delete(url);
//           message.success('Document deleted successfully');
//           onUpdate();
//         } catch (error) {
//           message.error(error.response?.data?.message || 'Failed to delete document');
//         } finally {
//           setDeleting(prev => ({ ...prev, [docType]: false }));
//         }
//       }
//     });
//   };

//   const handleDownload = async (docType, filename) => {
//     try {
//       const response = await api.get(
//         `/hr/employees/${employeeId}/documents/${docType}`,
//         { responseType: 'blob' }
//       );

//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', filename);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//     } catch (error) {
//       message.error('Failed to download document');
//     }
//   };

//   const calculateCompletion = () => {
//     const requiredDocs = documentTypes.filter(d => d.required);
//     const uploaded = requiredDocs.filter(doc => {
//       const status = getDocumentStatus(doc.key);
//       if (doc.multiple) {
//         return status && status.length > 0;
//       }
//       return status !== null;
//     }).length;

//     return {
//       uploaded,
//       total: requiredDocs.length,
//       percentage: Math.round((uploaded / requiredDocs.length) * 100)
//     };
//   };

//   const completion = calculateCompletion();

//   return (
//     <div>
//       {/* Document Completion Progress */}
//       <Card size="small" style={{ marginBottom: '24px' }}>
//         <Row gutter={16} align="middle">
//           <Col flex="auto">
//             <Text strong>Document Completion: </Text>
//             <Text type="secondary">
//               {completion.uploaded} of {completion.total} required documents uploaded
//             </Text>
//             <Progress
//               percent={completion.percentage}
//               status={completion.percentage === 100 ? 'success' : 'active'}
//               style={{ marginTop: '8px' }}
//             />
//           </Col>
//           {completion.percentage === 100 && (
//             <Col>
//               <CheckCircleOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
//             </Col>
//           )}
//         </Row>
//       </Card>

//       {completion.percentage < 100 && (
//         <Alert
//           message="Missing Required Documents"
//           description="Please upload all required documents to complete the employee profile."
//           type="warning"
//           showIcon
//           closable
//           style={{ marginBottom: '24px' }}
//         />
//       )}

//       {/* Document Upload Sections */}
//       <Row gutter={[16, 16]}>
//         {documentTypes.map((docType) => {
//           const status = getDocumentStatus(docType.key);
//           const isUploaded = status !== null;
//           const isUploading = uploading[docType.key];

//           return (
//             <Col xs={24} md={12} key={docType.key}>
//               <Card
//                 size="small"
//                 title={
//                   <Space>
//                     <FileOutlined />
//                     {docType.label}
//                     {docType.required && <Tag color="red">Required</Tag>}
//                     {isUploaded && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
//                   </Space>
//                 }
//                 extra={
//                   isUploaded && !docType.multiple && (
//                     <Space size="small">
//                       <Button
//                         type="link"
//                         size="small"
//                         icon={<DownloadOutlined />}
//                         onClick={() => handleDownload(docType.key, status.filename)}
//                       />
//                       <Button
//                         type="link"
//                         size="small"
//                         danger
//                         icon={<DeleteOutlined />}
//                         onClick={() => handleDelete(docType.key)}
//                         loading={deleting[docType.key]}
//                       />
//                     </Space>
//                   )
//                 }
//               >
//                 {docType.multiple ? (
//                   <>
//                     {status && status.length > 0 && (
//                       <List
//                         size="small"
//                         dataSource={status}
//                         renderItem={(doc, index) => (
//                           <List.Item
//                             actions={[
//                               <Button
//                                 type="link"
//                                 size="small"
//                                 icon={<DownloadOutlined />}
//                                 onClick={() => handleDownload(docType.key, doc.filename)}
//                               />,
//                               <Button
//                                 type="link"
//                                 size="small"
//                                 danger
//                                 icon={<DeleteOutlined />}
//                                 onClick={() => handleDelete(docType.key, doc._id)}
//                                 loading={deleting[`${docType.key}-${doc._id}`]}
//                               />
//                             ]}
//                           >
//                             <Space>
//                               <FileOutlined />
//                               <Text ellipsis style={{ maxWidth: '200px' }}>
//                                 {doc.name || doc.filename}
//                               </Text>
//                             </Space>
//                           </List.Item>
//                         )}
//                         style={{ marginBottom: '12px' }}
//                       />
//                     )}

//                     {(!status || status.length < (docType.maxCount || 10)) && (
//                       <Upload
//                         beforeUpload={(file) => handleUpload(docType.key, file)}
//                         showUploadList={false}
//                         accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
//                       >
//                         <Button
//                           icon={<PlusOutlined />}
//                           loading={isUploading}
//                           block
//                           size="small"
//                         >
//                           Add {docType.label}
//                         </Button>
//                       </Upload>
//                     )}
//                   </>
//                 ) : (
//                   <>
//                     {isUploaded ? (
//                       <Space direction="vertical" style={{ width: '100%' }}>
//                         <Space>
//                           <CheckCircleOutlined style={{ color: '#52c41a' }} />
//                           <Text strong>Uploaded</Text>
//                         </Space>
//                         <Text type="secondary" ellipsis style={{ fontSize: '12px' }}>
//                           {status.name || status.filename}
//                         </Text>
//                         <Text type="secondary" style={{ fontSize: '11px' }}>
//                           Uploaded: {new Date(status.uploadedAt).toLocaleDateString()}
//                         </Text>
//                       </Space>
//                     ) : (
//                       <Dragger
//                         beforeUpload={(file) => handleUpload(docType.key, file)}
//                         showUploadList={false}
//                         accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
//                         disabled={isUploading}
//                       >
//                         <p className="ant-upload-drag-icon">
//                           <UploadOutlined />
//                         </p>
//                         <p className="ant-upload-text">
//                           Click or drag file to upload
//                         </p>
//                         <p className="ant-upload-hint" style={{ fontSize: '11px' }}>
//                           PDF, DOC, DOCX, JPG, PNG (Max 10MB)
//                         </p>
//                       </Dragger>
//                     )}
//                   </>
//                 )}
//               </Card>
//             </Col>
//           );
//         })}
//       </Row>

//       <Divider />

//       <Alert
//         message="Document Guidelines"
//         description={
//           <ul style={{ margin: 0, paddingLeft: '20px' }}>
//             <li>All documents must be clear and legible</li>
//             <li>ID copies must be certified</li>
//             <li>Medical certificates must be recent (within 6 months)</li>
//             <li>3 professional references are required</li>
//             <li>Maximum file size: 10MB per document</li>
//             <li>Accepted formats: PDF, DOC, DOCX, JPG, PNG</li>
//           </ul>
//         }
//         type="info"
//         showIcon
//       />
//     </div>
//   );
// };

// export default DocumentManager;