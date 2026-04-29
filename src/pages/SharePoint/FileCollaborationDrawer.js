import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Drawer, Tabs, Timeline, List, Avatar, Tag, Button, Input,
  Space, Typography, Upload, Select, Tooltip, Popconfirm,
  Badge, Empty, Spin, message, Divider, Alert, Modal, Card
} from 'antd';
import {
  HistoryOutlined, CommentOutlined, UserAddOutlined, SafetyOutlined,
  UploadOutlined, DeleteOutlined, UserOutlined, DownloadOutlined,
  EyeOutlined, TeamOutlined, ReloadOutlined, ClockCircleOutlined,
  FileOutlined, CheckCircleOutlined, RollbackOutlined, LockOutlined,
  UnlockOutlined, WarningOutlined, EditOutlined, CheckOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import sharepointAPI from '../../services/sharePointAPI';

dayjs.extend(relativeTime);

const { Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtSize = (bytes) => {
  if (!bytes) return '—';
  const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + s[i];
};

/**
 * Safely compare two IDs regardless of whether they are:
 *   - plain strings
 *   - Mongoose ObjectId instances
 *   - populated objects ({ _id: '...' })
 */
const sameId = (a, b) => {
  if (!a || !b) return false;
  const str = (v) => (typeof v === 'object' ? (v._id ?? v.id ?? v).toString() : String(v));
  return str(a) === str(b);
};

/**
 * Maps any folder/file permission to a simple edit-capable boolean.
 *
 * Folder permissions:  view < download < upload < manage
 * File collab perms:   view < download < edit
 *
 * Both 'upload', 'manage', and 'edit' grant the right to modify file content.
 */
const permissionAllowsEdit = (p) => ['upload', 'manage', 'edit'].includes(p);

const ACTION_META = {
  view:                { text: 'Viewed',              color: '#1890ff', icon: <EyeOutlined /> },
  download:            { text: 'Downloaded',           color: '#52c41a', icon: <DownloadOutlined /> },
  checkout:            { text: 'Checked out',          color: '#722ed1', icon: <LockOutlined /> },
  checkin:             { text: 'Checked in',           color: '#13c2c2', icon: <UnlockOutlined /> },
  checkout_expired:    { text: 'Checkout expired',     color: '#faad14', icon: <WarningOutlined /> },
  upload_version:      { text: 'Uploaded version',     color: '#722ed1', icon: <UploadOutlined /> },
  comment:             { text: 'Commented',            color: '#fa8c16', icon: <CommentOutlined /> },
  comment_delete:      { text: 'Deleted comment',      color: '#ff4d4f', icon: <DeleteOutlined /> },
  collaborator_add:    { text: 'Added collaborator',   color: '#52c41a', icon: <UserAddOutlined /> },
  collaborator_remove: { text: 'Removed collaborator', color: '#ff4d4f', icon: <DeleteOutlined /> },
  share:               { text: 'Shared',               color: '#13c2c2', icon: <TeamOutlined /> },
  access_granted:      { text: 'Granted access',       color: '#52c41a', icon: <CheckCircleOutlined /> },
  access_revoked:      { text: 'Revoked access',       color: '#ff4d4f', icon: <DeleteOutlined /> },
};
const getMeta = (action) =>
  ACTION_META[action] || { text: action, color: '#999', icon: <ClockCircleOutlined /> };


// ─────────────────────────────────────────────────────────────────────────────

const FileCollaborationDrawer = ({ visible, onClose, file, onVersionUploaded }) => {
  const { user } = useSelector((state) => state.auth);

  const [activeTab,   setActiveTab]   = useState('checkout');
  const [loading,     setLoading]     = useState(false);
  const [detail,      setDetail]      = useState(null);
  const [versions,    setVersions]    = useState([]);
  const [auditTrail,  setAuditTrail]  = useState([]);

  const [coNote,      setCoNote]      = useState('');
  const [coLoading,   setCoLoading]   = useState(false);
  const [ciFile,      setCiFile]      = useState(null);
  const [ciNote,      setCiNote]      = useState('');
  const [vFile,       setVFile]       = useState(null);
  const [vNote,       setVNote]       = useState('');
  const [vLoading,    setVLoading]    = useState(false);
  const [cText,       setCText]       = useState('');
  const [cLoading,    setCLoading]    = useState(false);
  const [invEmail,    setInvEmail]    = useState('');
  const [invPerm,     setInvPerm]     = useState('edit');
  const [invLoading,  setInvLoading]  = useState(false);

  useEffect(() => {
    if (visible && file) {
      setActiveTab('checkout');
      loadAll();
    }
  }, [visible, file]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [detailRes, versRes, auditRes] = await Promise.all([
        sharepointAPI.getFileDetails(file._id),
        sharepointAPI.getFileVersions(file._id),
        sharepointAPI.getFileAuditTrail(file._id),
      ]);
      setDetail(detailRes.data.data);
      setVersions(versRes.data.data || []);
      setAuditTrail(auditRes.data.data || []);
    } catch {
      message.error('Failed to load collaboration data');
    } finally {
      setLoading(false);
    }
  };

  // ── Access resolution ──────────────────────────────────────────────────────
  //
  // We check four independent sources in order and return as soon as one grants edit:
  //
  //  1. User is the file uploader                         → edit ✓
  //  2. User is admin                                     → edit ✓
  //  3. User is in file.collaborators with 'edit'         → edit ✓
  //  4. User's folder permission is 'upload' or 'manage'
  //     (communicated via userPermissions.canEdit sent
  //      by the server, OR via the folder invitation's
  //      permission stored in the file detail)            → edit ✓
  //
  // We also surface the effective permission label for the UI.
  //
  const resolveAccess = () => {
    if (!detail || !user) return { hasEdit: false, effectivePerm: null, reason: 'loading' };

    // 1. File owner
    if (sameId(detail.uploadedBy, user._id)) {
      return { hasEdit: true, effectivePerm: 'manage', reason: 'file_owner' };
    }

    // 2. Admin
    if (user.role === 'admin') {
      return { hasEdit: true, effectivePerm: 'manage', reason: 'admin' };
    }

    // 3. Explicit file collaborator with 'edit'
    const collab = (detail.collaborators || []).find(c => sameId(c.userId, user._id));
    if (collab) {
      const canEdit = permissionAllowsEdit(collab.permission);
      return {
        hasEdit:       canEdit,
        effectivePerm: collab.permission,
        reason:        canEdit ? 'collaborator_edit' : 'collaborator_readonly'
      };
    }

    // 4. Folder-level permission — server sends userPermissions on each file
    //    canEdit is true when folder permission is 'upload' or 'manage'
    if (detail.userPermissions?.canEdit) {
      return { hasEdit: true, effectivePerm: 'upload', reason: 'folder_permission' };
    }

    // 5. sharedWith entry with 'edit'
    const shared = (detail.sharedWith || []).find(s => sameId(s.userId, user._id));
    if (shared && permissionAllowsEdit(shared.permission)) {
      return { hasEdit: true, effectivePerm: shared.permission, reason: 'shared_edit' };
    }

    return { hasEdit: false, effectivePerm: 'download', reason: 'readonly' };
  };

  const { hasEdit, effectivePerm, reason } = resolveAccess();

  // Checkout state helpers
  const checkout      = detail?.checkout;
  const coExpired     = checkout?.expiresAt && new Date() > new Date(checkout.expiresAt);
  const isLocked      = !!checkout?.userId && !coExpired;
  const lockedByMe    = isLocked && sameId(checkout.userId, user?._id);
  const lockedByOther = isLocked && !lockedByMe;

  const comments      = (detail?.comments      || []).filter(c => !c.isDeleted);
  const collaborators = detail?.collaborators  || [];
  const isOwner       = !!(detail && user && (sameId(detail.uploadedBy, user._id) || user.role === 'admin'));

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleCheckout = async () => {
    setCoLoading(true);
    try {
      await sharepointAPI.checkoutFile(file._id, coNote);
      message.success('File checked out — you have 2 hours to edit and check back in.');
      setCoNote('');
      await loadAll();
    } catch (e) {
      message.error(e.response?.data?.message || 'Checkout failed');
    } finally {
      setCoLoading(false);
    }
  };

  const handleCheckin = async () => {
    setCoLoading(true);
    try {
      const newFile = ciFile?.originFileObj || ciFile || null;
      await sharepointAPI.checkinFile(file._id, newFile, ciNote);
      message.success(newFile ? 'Checked in with new version!' : 'Checked in — lock released.');
      setCiFile(null);
      setCiNote('');
      await loadAll();
      if (onVersionUploaded) onVersionUploaded();
    } catch (e) {
      message.error(e.response?.data?.message || 'Check-in failed');
    } finally {
      setCoLoading(false);
    }
  };

  const handleForceCheckin = () => {
    Modal.confirm({
      title: 'Force-release checkout?',
      content: 'Any unsaved changes by the current editor will be lost.',
      okText: 'Release', okType: 'danger',
      async onOk() {
        await sharepointAPI.forceCheckin(file._id);
        message.success('Checkout released');
        await loadAll();
      },
    });
  };

  const handleUploadVersion = async () => {
    if (!vFile) return message.warning('Please select a file first');
    setVLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', vFile.originFileObj || vFile);
      if (vNote) fd.append('changeNote', vNote);
      await sharepointAPI.createFileVersion(file._id, fd);
      message.success('New version uploaded');
      setVFile(null);
      setVNote('');
      await loadAll();
      if (onVersionUploaded) onVersionUploaded();
    } catch (e) {
      message.error(e.response?.data?.message || 'Upload failed');
    } finally {
      setVLoading(false);
    }
  };

  const handleRestoreVersion = async (versionIndex) => {
    try {
      await sharepointAPI.restoreFileVersion(file._id, versionIndex);
      message.success('Version restored');
      await loadAll();
      if (onVersionUploaded) onVersionUploaded();
    } catch {
      message.error('Failed to restore version');
    }
  };

  const handleAddComment = async () => {
    if (!cText.trim()) return;
    setCLoading(true);
    try {
      await sharepointAPI.addComment(file._id, cText.trim());
      setCText('');
      await loadAll();
    } catch {
      message.error('Failed to add comment');
    } finally {
      setCLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await sharepointAPI.deleteComment(file._id, commentId);
      message.success('Comment deleted');
      await loadAll();
    } catch {
      message.error('Failed to delete comment');
    }
  };

  const handleInvite = async () => {
    if (!invEmail.trim()) return message.warning('Enter user email');
    setInvLoading(true);
    try {
      await sharepointAPI.addCollaborator(file._id, invEmail.trim(), invPerm);
      message.success('Collaborator added');
      setInvEmail('');
      await loadAll();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to add collaborator');
    } finally {
      setInvLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    try {
      await sharepointAPI.removeCollaborator(file._id, userId);
      message.success('Collaborator removed');
      await loadAll();
    } catch {
      message.error('Failed to remove collaborator');
    }
  };

  // ── Checkout tab UI ────────────────────────────────────────────────────────

  const CheckoutTab = () => {
    if (!detail) return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>;

    // ── State A: I have it checked out → show check-in UI
    if (lockedByMe) {
      return (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Alert type="info" showIcon icon={<LockOutlined />}
            message={<Text strong>You have this file checked out</Text>}
            description={
              <Space direction="vertical" size={2}>
                <Text>Expires: <strong>{dayjs(checkout.expiresAt).format('DD MMM YYYY, HH:mm')}</strong> ({dayjs(checkout.expiresAt).fromNow()})</Text>
                {checkout.note && <Text type="secondary">Note: {checkout.note}</Text>}
              </Space>
            }
          />
          <Card title={<Space><UnlockOutlined /><span>Check In</span></Space>} style={{ borderColor: '#1890ff' }}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Text type="secondary">
                Upload your edited file to save a new version, then release the lock.
                Or just release the lock if you made no changes.
              </Text>
              <Upload beforeUpload={() => false} maxCount={1}
                onChange={(info) => setCiFile(info.fileList.slice(-1)[0])}
                fileList={ciFile ? [ciFile] : []}>
                <Button icon={<UploadOutlined />}>
                  {ciFile ? 'Change File' : 'Attach Updated File (optional)'}
                </Button>
              </Upload>
              {ciFile && (
                <Input placeholder="What changed? (optional change note)"
                  value={ciNote} onChange={(e) => setCiNote(e.target.value)} />
              )}
              <Button type="primary" size="large" icon={<CheckOutlined />}
                loading={coLoading} onClick={handleCheckin} style={{ minWidth: 240 }}>
                {ciFile ? 'Check In with New Version' : 'Check In (No Changes)'}
              </Button>
            </Space>
          </Card>
        </Space>
      );
    }

    // ── State B: Someone else has it locked
    if (lockedByOther) {
      return (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Alert type="warning" showIcon icon={<LockOutlined />}
            message={<Text strong>File is locked by another editor</Text>}
            description={
              <Space direction="vertical" size={2}>
                <Text>Checked out by: <strong>{checkout.userId?.fullName || 'Unknown'}</strong></Text>
                <Text>Expires: <strong>{dayjs(checkout.expiresAt).format('DD MMM YYYY, HH:mm')}</strong> ({dayjs(checkout.expiresAt).fromNow()})</Text>
                {checkout.note && <Text type="secondary">Working on: {checkout.note}</Text>}
              </Space>
            }
          />
          <Text type="secondary">
            You can still download and read this file. Version uploads are blocked until the editor checks in.
          </Text>
          {user?.role === 'admin' && (
            <Button danger icon={<WarningOutlined />} onClick={handleForceCheckin}>
              Force Release Lock (Admin)
            </Button>
          )}
        </Space>
      );
    }

    // ── State C: File is free — always show checkout card
    return (
      <Space direction="vertical" style={{ width: '100%' }} size={16}>

        {/* Status indicator */}
        <Card style={{ borderColor: '#52c41a', background: '#f6ffed' }}>
          <Space align="start">
            <UnlockOutlined style={{ fontSize: 28, color: '#52c41a', marginTop: 2 }} />
            <div>
              <Text strong style={{ fontSize: 15 }}>File is available</Text><br />
              <Text type="secondary">No one is currently editing this file.</Text>
            </div>
          </Space>
        </Card>

        {/* Checkout action — always rendered */}
        <Card title={<Space><LockOutlined /><span>Check Out for Editing</span></Space>}>
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Text type="secondary">
              Locking the file prevents version conflicts while you work.
              The lock auto-releases after <strong>2 hours</strong> if you forget to check in.
            </Text>

            <Input
              placeholder="What are you working on? (optional note for your team)"
              value={coNote}
              onChange={(e) => setCoNote(e.target.value)}
              onPressEnter={hasEdit ? handleCheckout : undefined}
              prefix={<EditOutlined style={{ color: '#bbb' }} />}
            />

            {hasEdit ? (
              /* ── CAN CHECKOUT ── */
              <Button type="primary" size="large" icon={<LockOutlined />}
                loading={coLoading} onClick={handleCheckout} style={{ minWidth: 180 }}>
                Check Out File
              </Button>
            ) : (
              /* ── CANNOT CHECKOUT — show disabled button + explanation ── */
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                <Tooltip title="You need upload, manage, or edit permission to check out files.">
                  <Button size="large" icon={<LockOutlined />} disabled style={{ minWidth: 180 }}>
                    Check Out File
                  </Button>
                </Tooltip>
                <Alert type="warning" showIcon
                  message="Insufficient permission to check out"
                  description={
                    <span>
                      Your current access is <Tag>{effectivePerm || 'view/download'}</Tag>.
                      To check out this file you need <Tag color="orange">upload</Tag> or{' '}
                      <Tag color="purple">manage</Tag> folder access, or ask the file owner
                      to add you as a collaborator with <Tag color="purple">Edit</Tag> access
                      in the <strong>Collaborators</strong> tab.
                    </span>
                  }
                />
              </Space>
            )}
          </Space>
        </Card>
      </Space>
    );
  };

  // ── Tabs ───────────────────────────────────────────────────────────────────

  const tabItems = [
    {
      key: 'checkout',
      label: (
        <Space size={4}>
          {isLocked
            ? <LockOutlined style={{ color: lockedByMe ? '#722ed1' : '#ff4d4f' }} />
            : <UnlockOutlined style={{ color: '#52c41a' }} />}
          <span>Checkout</span>
        </Space>
      ),
      children: <CheckoutTab />,
    },

    {
      key: 'versions',
      label: (
        <Space size={4}>
          <HistoryOutlined />
          <span>Versions</span>
          {versions.length > 0 && (
            <Badge count={versions.length} size="small" style={{ backgroundColor: '#722ed1' }} />
          )}
        </Space>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {hasEdit && !lockedByOther && (
            <Card title={<Space><UploadOutlined /><span>Upload New Version</span></Space>} size="small">
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                <Upload beforeUpload={() => false} maxCount={1}
                  onChange={(info) => setVFile(info.fileList.slice(-1)[0])}
                  fileList={vFile ? [vFile] : []}>
                  <Button icon={<UploadOutlined />}>Select File</Button>
                </Upload>
                {vFile && (
                  <>
                    <Input placeholder="Describe what changed (optional)…"
                      value={vNote} onChange={(e) => setVNote(e.target.value)} />
                    <Button type="primary" loading={vLoading}
                      onClick={handleUploadVersion} icon={<UploadOutlined />}>
                      Upload Version
                    </Button>
                  </>
                )}
              </Space>
            </Card>
          )}
          {lockedByOther && (
            <Alert type="warning" showIcon
              message="Version uploads are blocked while another user has this file checked out." />
          )}
          {versions.length === 0
            ? <Empty description="This is the only version" />
            : (
              <List dataSource={versions} renderItem={(v, idx) => (
                <List.Item key={idx}
                  style={{
                    background: v.isCurrent ? '#f0f8ff' : 'white',
                    borderRadius: 8, marginBottom: 8, padding: '12px 16px',
                    border: v.isCurrent ? '1px solid #1890ff' : '1px solid #f0f0f0',
                  }}
                  actions={[
                    v.isCurrent
                      ? <Tag color="blue">Current</Tag>
                      : isOwner && (
                        <Popconfirm title="Restore this version?"
                          description="The current version will be archived."
                          onConfirm={() => handleRestoreVersion(v.index)} okText="Restore">
                          <Button type="link" size="small" icon={<RollbackOutlined />}>Restore</Button>
                        </Popconfirm>
                      ),
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<FileOutlined />}
                      style={{ backgroundColor: v.isCurrent ? '#1890ff' : '#d9d9d9' }} />}
                    title={
                      <Space>
                        <Text strong>Version {v.versionNumber}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{fmtSize(v.size)}</Text>
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <UserOutlined style={{ marginRight: 4 }} />
                          {v.uploadedBy?.fullName || 'Unknown'} · {dayjs(v.uploadedAt).fromNow()}
                        </Text>
                        {v.changeNote && (
                          <div>
                            <Text italic style={{ fontSize: 12, color: '#888' }}>"{v.changeNote}"</Text>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )} />
            )}
        </Space>
      ),
    },

    {
      key: 'comments',
      label: (
        <Space size={4}>
          <CommentOutlined />
          <span>Discussion</span>
          {comments.length > 0 && (
            <Badge count={comments.length} size="small" style={{ backgroundColor: '#fa8c16' }} />
          )}
        </Space>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <TextArea rows={3} placeholder="Add a comment or note for your team…"
              value={cText} onChange={(e) => setCText(e.target.value)} />
            <Button type="primary" style={{ marginTop: 8 }} loading={cLoading}
              onClick={handleAddComment} disabled={!cText.trim()}>
              Post Comment
            </Button>
          </div>
          <Divider style={{ margin: 0 }} />
          {comments.length === 0
            ? <Empty description="No comments yet" />
            : (
              <List dataSource={[...comments].reverse()} renderItem={(c) => (
                <List.Item key={c._id}
                  actions={[
                    (sameId(c.userId, user?._id) || user?.role === 'admin') && (
                      <Popconfirm title="Delete comment?"
                        onConfirm={() => handleDeleteComment(c._id)}>
                        <Button type="link" danger size="small" icon={<DeleteOutlined />} />
                      </Popconfirm>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                    title={
                      <Space>
                        <Text strong style={{ fontSize: 13 }}>{c.userId?.fullName || 'Unknown'}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(c.createdAt).fromNow()}</Text>
                      </Space>
                    }
                    description={
                      <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{c.text}</Paragraph>
                    }
                  />
                </List.Item>
              )} />
            )}
        </Space>
      ),
    },

    {
      key: 'collaborators',
      label: (
        <Space size={4}>
          <TeamOutlined />
          <span>Collaborators</span>
          {collaborators.length > 0 && (
            <Badge count={collaborators.length} size="small" style={{ backgroundColor: '#52c41a' }} />
          )}
        </Space>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {isOwner && (
            <Card title={<Space><UserAddOutlined /><span>Add Collaborator</span></Space>} size="small">
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                <Input placeholder="User email address…" value={invEmail}
                  onChange={(e) => setInvEmail(e.target.value)} onPressEnter={handleInvite} />
                <Space>
                  <Select value={invPerm} onChange={setInvPerm} style={{ width: 240 }}>
                    <Option value="view">
                      <Tag color="blue">👁 View only</Tag>
                    </Option>
                    <Option value="download">
                      <Tag color="green">⬇️ Download</Tag>
                    </Option>
                    <Option value="edit">
                      <Tag color="purple">✏️ Edit — checkout &amp; upload versions</Tag>
                    </Option>
                  </Select>
                  <Button type="primary" onClick={handleInvite}
                    loading={invLoading} icon={<UserAddOutlined />}>
                    Invite
                  </Button>
                </Space>
              </Space>
            </Card>
          )}

          <Alert type="info" showIcon
            message={
              <Text style={{ fontSize: 12 }}>
                <strong>Edit</strong> collaborators can check out the file and upload new versions.
                Use Checkout to prevent simultaneous conflicting edits.
              </Text>
            }
          />

          {collaborators.length === 0
            ? <Empty description="No collaborators added yet" />
            : (
              <List dataSource={collaborators} renderItem={(c) => (
                <List.Item key={c.userId?._id}
                  actions={[
                    isOwner && (
                      <Popconfirm title="Remove this collaborator?"
                        onConfirm={() => handleRemoveCollaborator(c.userId?._id)}>
                        <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                          Remove
                        </Button>
                      </Popconfirm>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <Space>
                        <Text strong>{c.userId?.fullName || 'Unknown'}</Text>
                        <Tag color={
                          c.permission === 'edit'     ? 'purple' :
                          c.permission === 'download' ? 'green'  : 'blue'
                        }>
                          {c.permission === 'edit'     ? '✏️ Can edit' :
                           c.permission === 'download' ? '⬇️ Download' : '👁 View only'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {c.userId?.email} · Added {dayjs(c.addedAt).fromNow()}
                      </Text>
                    }
                  />
                </List.Item>
              )} />
            )}
        </Space>
      ),
    },

    {
      key: 'audit',
      label: <Space size={4}><SafetyOutlined /><span>Audit Trail</span></Space>,
      children: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ textAlign: 'right' }}>
            <Button size="small" icon={<ReloadOutlined />} onClick={loadAll}>Refresh</Button>
          </div>
          {auditTrail.length === 0
            ? <Empty description="No activity recorded yet" />
            : (
              <Timeline items={auditTrail.slice(0, 100).map((entry, i) => {
                const { text, color, icon } = getMeta(entry.action);
                return {
                  key: i, color, dot: icon,
                  children: (
                    <div>
                      <Space>
                        <Text strong style={{ fontSize: 13 }}>
                          {entry.userId?.fullName || 'Unknown'}
                        </Text>
                        <Tag color={color} style={{ fontSize: 11 }}>{text}</Tag>
                      </Space>
                      <div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {dayjs(entry.timestamp).format('DD MMM YYYY, HH:mm')}
                          {' · '}
                          {dayjs(entry.timestamp).fromNow()}
                        </Text>
                      </div>
                      {entry.meta?.changeNote && (
                        <div><Text italic style={{ fontSize: 11, color: '#888' }}>"{entry.meta.changeNote}"</Text></div>
                      )}
                      {entry.meta?.note && (
                        <div><Text italic style={{ fontSize: 11, color: '#888' }}>"{entry.meta.note}"</Text></div>
                      )}
                      {entry.meta?.preview && (
                        <div><Text style={{ fontSize: 11, color: '#888' }}>{entry.meta.preview}</Text></div>
                      )}
                    </div>
                  ),
                };
              })} />
            )}
        </Space>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Drawer
      title={
        <Space>
          <FileOutlined />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              {file?.name}
              {isLocked && (
                <Tag icon={<LockOutlined />}
                  color={lockedByMe ? 'purple' : 'red'}
                  style={{ marginLeft: 8 }}>
                  {lockedByMe ? 'Checked out by you' : 'Locked'}
                </Tag>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 400 }}>
              {fmtSize(file?.size)}
              {versions.length > 0 && ` · ${versions.length + 1} versions`}
              {isLocked && ` · Expires ${dayjs(checkout?.expiresAt).fromNow()}`}
            </Text>
          </div>
        </Space>
      }
      placement="right"
      width={620}
      open={visible}
      onClose={onClose}
      destroyOnClose
      extra={
        <Button size="small" icon={<ReloadOutlined />} onClick={loadAll} loading={loading}>
          Refresh
        </Button>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#999' }}>Loading collaboration data…</div>
        </div>
      ) : (
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      )}
    </Drawer>
  );
};

export default FileCollaborationDrawer;









// import React, { useState, useEffect } from 'react';
// import { useSelector } from 'react-redux';
// import {
//   Drawer, Tabs, Timeline, List, Avatar, Tag, Button, Input,
//   Space, Typography, Upload, Select, Tooltip, Popconfirm,
//   Badge, Empty, Spin, message, Divider, Alert, Modal, Card
// } from 'antd';
// import {
//   HistoryOutlined, CommentOutlined, UserAddOutlined, SafetyOutlined,
//   UploadOutlined, DeleteOutlined, UserOutlined, DownloadOutlined,
//   EyeOutlined, TeamOutlined, ReloadOutlined, ClockCircleOutlined,
//   FileOutlined, CheckCircleOutlined, RollbackOutlined, LockOutlined,
//   UnlockOutlined, WarningOutlined, EditOutlined, CheckOutlined
// } from '@ant-design/icons';
// import dayjs from 'dayjs';
// import relativeTime from 'dayjs/plugin/relativeTime';
// import sharepointAPI from '../../services/sharePointAPI';

// dayjs.extend(relativeTime);

// const { Text, Paragraph, Title } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// const fmtSize = (bytes) => {
//   if (!bytes) return '—';
//   const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
//   return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + s[i];
// };

// const ACTION_META = {
//   view:                { text: 'Viewed',             color: '#1890ff', icon: <EyeOutlined /> },
//   download:            { text: 'Downloaded',          color: '#52c41a', icon: <DownloadOutlined /> },
//   checkout:            { text: 'Checked out',         color: '#722ed1', icon: <LockOutlined /> },
//   checkin:             { text: 'Checked in',          color: '#13c2c2', icon: <UnlockOutlined /> },
//   checkout_expired:    { text: 'Checkout expired',    color: '#faad14', icon: <WarningOutlined /> },
//   upload_version:      { text: 'Uploaded version',    color: '#722ed1', icon: <UploadOutlined /> },
//   comment:             { text: 'Commented',           color: '#fa8c16', icon: <CommentOutlined /> },
//   comment_delete:      { text: 'Deleted comment',     color: '#ff4d4f', icon: <DeleteOutlined /> },
//   collaborator_add:    { text: 'Added collaborator',  color: '#52c41a', icon: <UserAddOutlined /> },
//   collaborator_remove: { text: 'Removed collaborator',color: '#ff4d4f', icon: <DeleteOutlined /> },
//   share:               { text: 'Shared',              color: '#13c2c2', icon: <TeamOutlined /> },
//   access_granted:      { text: 'Granted access',      color: '#52c41a', icon: <CheckCircleOutlined /> },
//   access_revoked:      { text: 'Revoked access',      color: '#ff4d4f', icon: <DeleteOutlined /> },
// };
// const getMeta = (action) =>
//   ACTION_META[action] || { text: action, color: '#999', icon: <ClockCircleOutlined /> };

// // ─────────────────────────────────────────────────────────────────────────────

// const FileCollaborationDrawer = ({ visible, onClose, file, onVersionUploaded }) => {
//   const { user } = useSelector((state) => state.auth);

//   const [activeTab,    setActiveTab]    = useState('checkout');
//   const [loading,      setLoading]      = useState(false);
//   const [detail,       setDetail]       = useState(null);
//   const [versions,     setVersions]     = useState([]);
//   const [auditTrail,   setAuditTrail]   = useState([]);

//   // Checkout state
//   const [coNote,       setCoNote]       = useState('');
//   const [coLoading,    setCoLoading]    = useState(false);

//   // Check-in state
//   const [ciFile,       setCiFile]       = useState(null);
//   const [ciNote,       setCiNote]       = useState('');

//   // Version-only upload
//   const [vFile,        setVFile]        = useState(null);
//   const [vNote,        setVNote]        = useState('');
//   const [vLoading,     setVLoading]     = useState(false);

//   // Comment
//   const [cText,        setCText]        = useState('');
//   const [cLoading,     setCLoading]     = useState(false);

//   // Collaborator invite
//   const [invEmail,     setInvEmail]     = useState('');
//   const [invPerm,      setInvPerm]      = useState('download');
//   const [invLoading,   setInvLoading]   = useState(false);

//   useEffect(() => {
//     if (visible && file) {
//       setActiveTab('checkout');
//       loadAll();
//     }
//   }, [visible, file]);

//   const loadAll = async () => {
//     setLoading(true);
//     try {
//       const [detailRes, versRes, auditRes] = await Promise.all([
//         sharepointAPI.getFileDetails(file._id),
//         sharepointAPI.getFileVersions(file._id),
//         sharepointAPI.getFileAuditTrail(file._id),
//       ]);
//       setDetail(detailRes.data.data);
//       setVersions(versRes.data.data || []);
//       setAuditTrail(auditRes.data.data || []);
//     } catch {
//       message.error('Failed to load collaboration data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── Derived ──────────────────────────────────────────────────────────────────
//   const checkout      = detail?.checkout;
//   const coExpired     = checkout?.expiresAt && new Date() > new Date(checkout.expiresAt);
//   const isLocked      = !!checkout?.userId && !coExpired;
//   const lockedByMe    = isLocked && (checkout.userId?._id ?? checkout.userId) === user?._id;
//   const lockedByOther = isLocked && !lockedByMe;

//   const comments      = (detail?.comments      || []).filter(c => !c.isDeleted);
//   const collaborators = detail?.collaborators  || [];

//   const isOwner = detail && user && (
//     (detail.uploadedBy?._id ?? detail.uploadedBy) === user._id ||
//     user.role === 'admin'
//   );

//   // Can this user upload new versions?
//   const hasEditAccess = isOwner || collaborators.some(
//     c => (c.userId?._id ?? c.userId) === user?._id && c.permission === 'edit'
//   );

//   // ── Checkout ─────────────────────────────────────────────────────────────────
//   const handleCheckout = async () => {
//     setCoLoading(true);
//     try {
//       await sharepointAPI.checkoutFile(file._id, coNote);
//       message.success('File checked out! You have 2 hours to edit and check back in.');
//       setCoNote('');
//       await loadAll();
//     } catch (e) {
//       message.error(e.response?.data?.message || 'Checkout failed');
//     } finally {
//       setCoLoading(false);
//     }
//   };

//   const handleCheckin = async () => {
//     setCoLoading(true);
//     try {
//       const newFile = ciFile?.originFileObj || ciFile || null;
//       await sharepointAPI.checkinFile(file._id, newFile, ciNote);
//       message.success(newFile ? 'Checked in with new version!' : 'Checked in (no changes)');
//       setCiFile(null);
//       setCiNote('');
//       await loadAll();
//       if (onVersionUploaded) onVersionUploaded();
//     } catch (e) {
//       message.error(e.response?.data?.message || 'Check-in failed');
//     } finally {
//       setCoLoading(false);
//     }
//   };

//   const handleForceCheckin = () => {
//     Modal.confirm({
//       title: 'Force-release checkout?',
//       content: 'Any unsaved changes by the current editor will be lost.',
//       okText: 'Release', okType: 'danger',
//       async onOk() {
//         await sharepointAPI.forceCheckin(file._id);
//         message.success('Checkout released');
//         await loadAll();
//       },
//     });
//   };

//   // ── Version upload ────────────────────────────────────────────────────────────
//   const handleUploadVersion = async () => {
//     if (!vFile) return message.warning('Please select a file first');
//     setVLoading(true);
//     try {
//       const fd = new FormData();
//       fd.append('file', vFile.originFileObj || vFile);
//       if (vNote) fd.append('changeNote', vNote);
//       await sharepointAPI.createFileVersion(file._id, fd);
//       message.success('New version uploaded');
//       setVFile(null);
//       setVNote('');
//       await loadAll();
//       if (onVersionUploaded) onVersionUploaded();
//     } catch (e) {
//       message.error(e.response?.data?.message || 'Upload failed');
//     } finally {
//       setVLoading(false);
//     }
//   };

//   const handleRestoreVersion = async (versionIndex) => {
//     try {
//       await sharepointAPI.restoreFileVersion(file._id, versionIndex);
//       message.success('Version restored');
//       await loadAll();
//       if (onVersionUploaded) onVersionUploaded();
//     } catch {
//       message.error('Failed to restore version');
//     }
//   };

//   // ── Comments ──────────────────────────────────────────────────────────────────
//   const handleAddComment = async () => {
//     if (!cText.trim()) return;
//     setCLoading(true);
//     try {
//       await sharepointAPI.addComment(file._id, cText.trim());
//       setCText('');
//       await loadAll();
//     } catch {
//       message.error('Failed to add comment');
//     } finally {
//       setCLoading(false);
//     }
//   };

//   const handleDeleteComment = async (commentId) => {
//     try {
//       await sharepointAPI.deleteComment(file._id, commentId);
//       message.success('Comment deleted');
//       await loadAll();
//     } catch {
//       message.error('Failed to delete comment');
//     }
//   };

//   // ── Collaborators ─────────────────────────────────────────────────────────────
//   const handleInvite = async () => {
//     if (!invEmail.trim()) return message.warning('Enter user email');
//     setInvLoading(true);
//     try {
//       await sharepointAPI.addCollaborator(file._id, invEmail.trim(), invPerm);
//       message.success('Collaborator added');
//       setInvEmail('');
//       await loadAll();
//     } catch (e) {
//       message.error(e.response?.data?.message || 'Failed to add collaborator');
//     } finally {
//       setInvLoading(false);
//     }
//   };

//   const handleRemoveCollaborator = async (userId) => {
//     try {
//       await sharepointAPI.removeCollaborator(file._id, userId);
//       message.success('Collaborator removed');
//       await loadAll();
//     } catch {
//       message.error('Failed to remove collaborator');
//     }
//   };

//   // ════════════════════════════════════════════════════════════════════════════
//   // CHECKOUT TAB CONTENT
//   // ════════════════════════════════════════════════════════════════════════════
//   const CheckoutTab = () => {
//     if (!detail) return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>;

//     // ── LOCKED BY ME ──────────────────────────────────────────────────────────
//     if (lockedByMe) {
//       return (
//         <Space direction="vertical" style={{ width: '100%' }} size={16}>
//           <Alert
//             type="info"
//             showIcon
//             icon={<LockOutlined />}
//             message={<Text strong>You have this file checked out</Text>}
//             description={
//               <Space direction="vertical" size={2}>
//                 <Text>Expires: <strong>{dayjs(checkout.expiresAt).format('DD MMM YYYY, HH:mm')}</strong> ({dayjs(checkout.expiresAt).fromNow()})</Text>
//                 {checkout.note && <Text type="secondary">Note: {checkout.note}</Text>}
//               </Space>
//             }
//           />

//           <Card
//             title={<Space><UnlockOutlined /><span>Check In</span></Space>}
//             style={{ borderColor: '#1890ff' }}
//           >
//             <Space direction="vertical" style={{ width: '100%' }} size={12}>
//               <Text type="secondary">
//                 Upload your edited file and release the lock, or just release the lock if you made no changes.
//               </Text>

//               <Upload
//                 beforeUpload={() => false}
//                 maxCount={1}
//                 onChange={(info) => setCiFile(info.fileList.slice(-1)[0])}
//                 fileList={ciFile ? [ciFile] : []}
//               >
//                 <Button icon={<UploadOutlined />}>
//                   {ciFile ? 'Change File' : 'Attach Updated File (optional)'}
//                 </Button>
//               </Upload>

//               {ciFile && (
//                 <Input
//                   placeholder="What changed? (change note — optional)"
//                   value={ciNote}
//                   onChange={(e) => setCiNote(e.target.value)}
//                 />
//               )}

//               <Space>
//                 <Button
//                   type="primary"
//                   size="large"
//                   icon={<CheckOutlined />}
//                   loading={coLoading}
//                   onClick={handleCheckin}
//                   style={{ minWidth: 200 }}
//                 >
//                   {ciFile ? 'Check In with New Version' : 'Check In (No Changes)'}
//                 </Button>
//               </Space>
//             </Space>
//           </Card>
//         </Space>
//       );
//     }

//     // ── LOCKED BY SOMEONE ELSE ────────────────────────────────────────────────
//     if (lockedByOther) {
//       return (
//         <Space direction="vertical" style={{ width: '100%' }} size={16}>
//           <Alert
//             type="warning"
//             showIcon
//             icon={<LockOutlined />}
//             message={<Text strong>File is locked by another editor</Text>}
//             description={
//               <Space direction="vertical" size={2}>
//                 <Text>Checked out by: <strong>{checkout.userId?.fullName || 'Unknown'}</strong></Text>
//                 <Text>Lock expires: <strong>{dayjs(checkout.expiresAt).format('DD MMM YYYY, HH:mm')}</strong> ({dayjs(checkout.expiresAt).fromNow()})</Text>
//                 {checkout.note && <Text type="secondary">Working on: {checkout.note}</Text>}
//               </Space>
//             }
//           />

//           <Text type="secondary" style={{ display: 'block' }}>
//             You can still download and read this file, but uploading a new version is blocked until the editor checks in.
//           </Text>

//           {user?.role === 'admin' && (
//             <Button danger icon={<WarningOutlined />} onClick={handleForceCheckin}>
//               Force Release Lock (Admin)
//             </Button>
//           )}
//         </Space>
//       );
//     }

//     // ── FREE — show big checkout button ───────────────────────────────────────
//     return (
//       <Space direction="vertical" style={{ width: '100%' }} size={16}>
//         {/* Status — always visible */}
//         <Card style={{ borderColor: '#52c41a', background: '#f6ffed' }}>
//           <Space align="start">
//             <UnlockOutlined style={{ fontSize: 28, color: '#52c41a', marginTop: 2 }} />
//             <div>
//               <Text strong style={{ fontSize: 15 }}>File is available</Text>
//               <br />
//               <Text type="secondary">
//                 No one is currently editing this file.
//               </Text>
//             </div>
//           </Space>
//         </Card>

//         {/* THE CHECKOUT ACTION — always shown, not gated on hasEditAccess check */}
//         <Card
//           title={<Space><LockOutlined /><span>Check Out for Editing</span></Space>}
//           bordered
//         >
//           <Space direction="vertical" style={{ width: '100%' }} size={12}>
//             <Text type="secondary">
//               Checking out locks the file so no one else can upload a conflicting version while you work.
//               The lock auto-releases after <strong>2 hours</strong> if you forget to check in.
//             </Text>

//             <Input
//               placeholder="What are you working on? (optional note for your team)"
//               value={coNote}
//               onChange={(e) => setCoNote(e.target.value)}
//               onPressEnter={hasEditAccess ? handleCheckout : undefined}
//               prefix={<EditOutlined style={{ color: '#bbb' }} />}
//             />

//             {hasEditAccess ? (
//               <Button
//                 type="primary"
//                 size="large"
//                 icon={<LockOutlined />}
//                 loading={coLoading}
//                 onClick={handleCheckout}
//                 style={{ minWidth: 160 }}
//               >
//                 Check Out File
//               </Button>
//             ) : (
//               <Tooltip title="You need Edit collaborator permission on this file to check it out. Ask the file owner to add you as a collaborator with Edit access.">
//                 <Button
//                   size="large"
//                   icon={<LockOutlined />}
//                   disabled
//                   style={{ minWidth: 160 }}
//                 >
//                   Check Out File
//                 </Button>
//               </Tooltip>
//             )}

//             {!hasEditAccess && (
//               <Alert
//                 type="info"
//                 showIcon
//                 message="You need Edit access to check out this file."
//                 description={
//                   <span>
//                     Ask the file owner to go to the <strong>Collaborators</strong> tab and add you with <strong>Edit</strong> permission.
//                   </span>
//                 }
//               />
//             )}
//           </Space>
//         </Card>
//       </Space>
//     );
//   };

//   // ════════════════════════════════════════════════════════════════════════════
//   // TABS
//   // ════════════════════════════════════════════════════════════════════════════
//   const tabItems = [
//     {
//       key: 'checkout',
//       label: (
//         <Space size={4}>
//           {isLocked
//             ? <LockOutlined style={{ color: lockedByMe ? '#722ed1' : '#ff4d4f' }} />
//             : <UnlockOutlined style={{ color: '#52c41a' }} />}
//           <span>Checkout</span>
//         </Space>
//       ),
//       children: <CheckoutTab />,
//     },

//     {
//       key: 'versions',
//       label: (
//         <Space size={4}>
//           <HistoryOutlined />
//           <span>Versions</span>
//           <Badge count={versions.length} size="small" style={{ backgroundColor: '#722ed1' }} />
//         </Space>
//       ),
//       children: (
//         <Space direction="vertical" style={{ width: '100%' }} size={16}>
//           {hasEditAccess && !lockedByOther && (
//             <Card title={<Space><UploadOutlined /><span>Upload New Version</span></Space>} size="small">
//               {lockedByMe && (
//                 <Alert type="info" showIcon style={{ marginBottom: 10 }}
//                   message="Tip: you can also upload the new version during check-in." />
//               )}
//               <Space direction="vertical" style={{ width: '100%' }} size={8}>
//                 <Upload beforeUpload={() => false} maxCount={1}
//                   onChange={(info) => setVFile(info.fileList.slice(-1)[0])}
//                   fileList={vFile ? [vFile] : []}>
//                   <Button icon={<UploadOutlined />}>Select File</Button>
//                 </Upload>
//                 {vFile && (
//                   <>
//                     <Input placeholder="Describe what changed (optional)…" value={vNote} onChange={(e) => setVNote(e.target.value)} />
//                     <Button type="primary" loading={vLoading} onClick={handleUploadVersion} icon={<UploadOutlined />}>
//                       Upload Version
//                     </Button>
//                   </>
//                 )}
//               </Space>
//             </Card>
//           )}

//           {lockedByOther && (
//             <Alert type="warning" showIcon
//               message="File is checked out by another user. Version uploads are blocked until they check in." />
//           )}

//           {versions.length === 0
//             ? <Empty description="This is the only version" />
//             : (
//               <List dataSource={versions} renderItem={(v, idx) => (
//                 <List.Item key={idx}
//                   style={{
//                     background: v.isCurrent ? '#f0f8ff' : 'white',
//                     borderRadius: 8, marginBottom: 8, padding: '12px 16px',
//                     border: v.isCurrent ? '1px solid #1890ff' : '1px solid #f0f0f0',
//                   }}
//                   actions={[
//                     v.isCurrent
//                       ? <Tag color="blue">Current</Tag>
//                       : isOwner && (
//                         <Popconfirm title="Restore this version?" description="Current version will be archived."
//                           onConfirm={() => handleRestoreVersion(v.index)} okText="Restore">
//                           <Button type="link" size="small" icon={<RollbackOutlined />}>Restore</Button>
//                         </Popconfirm>
//                       ),
//                   ]}
//                 >
//                   <List.Item.Meta
//                     avatar={<Avatar icon={<FileOutlined />} style={{ backgroundColor: v.isCurrent ? '#1890ff' : '#d9d9d9' }} />}
//                     title={<Space><Text strong>Version {v.versionNumber}</Text><Text type="secondary" style={{ fontSize: 12 }}>{fmtSize(v.size)}</Text></Space>}
//                     description={
//                       <div>
//                         <Text type="secondary" style={{ fontSize: 12 }}>
//                           <UserOutlined style={{ marginRight: 4 }} />
//                           {v.uploadedBy?.fullName || 'Unknown'} · {dayjs(v.uploadedAt).fromNow()}
//                         </Text>
//                         {v.changeNote && (
//                           <div><Text italic style={{ fontSize: 12, color: '#888' }}>"{v.changeNote}"</Text></div>
//                         )}
//                       </div>
//                     }
//                   />
//                 </List.Item>
//               )} />
//             )}
//         </Space>
//       ),
//     },

//     {
//       key: 'comments',
//       label: (
//         <Space size={4}>
//           <CommentOutlined />
//           <span>Discussion</span>
//           <Badge count={comments.length} size="small" style={{ backgroundColor: '#fa8c16' }} />
//         </Space>
//       ),
//       children: (
//         <Space direction="vertical" style={{ width: '100%' }} size={16}>
//           <div>
//             <TextArea rows={3} placeholder="Add a comment or note for your team…"
//               value={cText} onChange={(e) => setCText(e.target.value)} />
//             <Button type="primary" style={{ marginTop: 8 }} loading={cLoading}
//               onClick={handleAddComment} disabled={!cText.trim()}>
//               Post Comment
//             </Button>
//           </div>
//           <Divider style={{ margin: '0' }} />
//           {comments.length === 0
//             ? <Empty description="No comments yet" />
//             : (
//               <List dataSource={[...comments].reverse()} renderItem={(c) => (
//                 <List.Item key={c._id} actions={[
//                   ((c.userId?._id ?? c.userId) === user?._id || user?.role === 'admin') && (
//                     <Popconfirm title="Delete comment?" onConfirm={() => handleDeleteComment(c._id)}>
//                       <Button type="link" danger size="small" icon={<DeleteOutlined />} />
//                     </Popconfirm>
//                   ),
//                 ]}>
//                   <List.Item.Meta
//                     avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />}
//                     title={
//                       <Space>
//                         <Text strong style={{ fontSize: 13 }}>{c.userId?.fullName || 'Unknown'}</Text>
//                         <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(c.createdAt).fromNow()}</Text>
//                       </Space>
//                     }
//                     description={<Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{c.text}</Paragraph>}
//                   />
//                 </List.Item>
//               )} />
//             )}
//         </Space>
//       ),
//     },

//     {
//       key: 'collaborators',
//       label: (
//         <Space size={4}>
//           <TeamOutlined />
//           <span>Collaborators</span>
//           <Badge count={collaborators.length} size="small" style={{ backgroundColor: '#52c41a' }} />
//         </Space>
//       ),
//       children: (
//         <Space direction="vertical" style={{ width: '100%' }} size={16}>
//           {isOwner && (
//             <Card title={<Space><UserAddOutlined /><span>Add Collaborator</span></Space>} size="small">
//               <Space direction="vertical" style={{ width: '100%' }} size={8}>
//                 <Input placeholder="User email address…" value={invEmail}
//                   onChange={(e) => setInvEmail(e.target.value)} onPressEnter={handleInvite} />
//                 <Space>
//                   <Select value={invPerm} onChange={setInvPerm} style={{ width: 200 }}>
//                     <Option value="view"><Tag color="blue">View only</Tag></Option>
//                     <Option value="download"><Tag color="green">Download</Tag></Option>
//                     <Option value="edit"><Tag color="purple">Edit (can upload versions)</Tag></Option>
//                   </Select>
//                   <Button type="primary" onClick={handleInvite} loading={invLoading} icon={<UserAddOutlined />}>
//                     Invite
//                   </Button>
//                 </Space>
//               </Space>
//             </Card>
//           )}

//           <Alert type="info" showIcon
//             message={
//               <Text style={{ fontSize: 12 }}>
//                 Collaborators with <strong>Edit</strong> permission can upload new versions.
//                 Use <strong>Checkout</strong> to prevent editing conflicts.
//               </Text>
//             }
//           />

//           {collaborators.length === 0
//             ? <Empty description="No collaborators yet" />
//             : (
//               <List dataSource={collaborators} renderItem={(c) => (
//                 <List.Item key={c.userId?._id}
//                   actions={[
//                     isOwner && (
//                       <Popconfirm title="Remove this collaborator?"
//                         onConfirm={() => handleRemoveCollaborator(c.userId?._id)}>
//                         <Button type="link" danger size="small" icon={<DeleteOutlined />}>Remove</Button>
//                       </Popconfirm>
//                     ),
//                   ]}
//                 >
//                   <List.Item.Meta
//                     avatar={<Avatar icon={<UserOutlined />} />}
//                     title={
//                       <Space>
//                         <Text strong>{c.userId?.fullName || 'Unknown'}</Text>
//                         <Tag color={c.permission === 'edit' ? 'purple' : c.permission === 'download' ? 'green' : 'blue'}>
//                           {c.permission === 'edit' ? 'Can edit' : c.permission === 'download' ? 'Can download' : 'View only'}
//                         </Tag>
//                       </Space>
//                     }
//                     description={
//                       <Text type="secondary" style={{ fontSize: 12 }}>
//                         {c.userId?.email} · Added {dayjs(c.addedAt).fromNow()}
//                       </Text>
//                     }
//                   />
//                 </List.Item>
//               )} />
//             )}
//         </Space>
//       ),
//     },

//     {
//       key: 'audit',
//       label: <Space size={4}><SafetyOutlined /><span>Audit Trail</span></Space>,
//       children: (
//         <Space direction="vertical" style={{ width: '100%' }}>
//           <div style={{ textAlign: 'right' }}>
//             <Button size="small" icon={<ReloadOutlined />} onClick={loadAll}>Refresh</Button>
//           </div>
//           {auditTrail.length === 0
//             ? <Empty description="No activity recorded yet" />
//             : (
//               <Timeline items={auditTrail.slice(0, 100).map((entry, i) => {
//                 const { text, color, icon } = getMeta(entry.action);
//                 return {
//                   key: i, color, dot: icon,
//                   children: (
//                     <div>
//                       <Space>
//                         <Text strong style={{ fontSize: 13 }}>{entry.userId?.fullName || 'Unknown'}</Text>
//                         <Tag color={color} style={{ fontSize: 11 }}>{text}</Tag>
//                       </Space>
//                       <div>
//                         <Text type="secondary" style={{ fontSize: 11 }}>
//                           {dayjs(entry.timestamp).format('DD MMM YYYY, HH:mm')} · {dayjs(entry.timestamp).fromNow()}
//                         </Text>
//                       </div>
//                       {entry.meta?.changeNote && <Text italic style={{ fontSize: 11, color: '#888' }}>"{entry.meta.changeNote}"</Text>}
//                       {entry.meta?.note       && <Text italic style={{ fontSize: 11, color: '#888' }}>"{entry.meta.note}"</Text>}
//                       {entry.meta?.preview    && <Text style={{ fontSize: 11, color: '#888' }}>{entry.meta.preview}</Text>}
//                     </div>
//                   ),
//                 };
//               })} />
//             )}
//         </Space>
//       ),
//     },
//   ];

//   // ════════════════════════════════════════════════════════════════════════════
//   // RENDER
//   // ════════════════════════════════════════════════════════════════════════════
//   return (
//     <Drawer
//       title={
//         <Space>
//           <FileOutlined />
//           <div>
//             <div style={{ fontWeight: 600, fontSize: 14 }}>
//               {file?.name}
//               {isLocked && (
//                 <Tag
//                   icon={<LockOutlined />}
//                   color={lockedByMe ? 'purple' : 'red'}
//                   style={{ marginLeft: 8 }}
//                 >
//                   {lockedByMe ? 'Checked out by you' : 'Locked'}
//                 </Tag>
//               )}
//             </div>
//             <Text type="secondary" style={{ fontSize: 11, fontWeight: 400 }}>
//               {fmtSize(file?.size)}
//               {versions.length > 0 && ` · ${versions.length + 1} versions`}
//               {isLocked && ` · Expires ${dayjs(checkout?.expiresAt).fromNow()}`}
//             </Text>
//           </div>
//         </Space>
//       }
//       placement="right"
//       width={620}
//       open={visible}
//       onClose={onClose}
//       destroyOnClose
//       extra={
//         <Button size="small" icon={<ReloadOutlined />} onClick={loadAll} loading={loading}>
//           Refresh
//         </Button>
//       }
//     >
//       {loading ? (
//         <div style={{ textAlign: 'center', padding: 60 }}>
//           <Spin size="large" />
//           <div style={{ marginTop: 16, color: '#999' }}>Loading collaboration data…</div>
//         </div>
//       ) : (
//         <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
//       )}
//     </Drawer>
//   );
// };

// export default FileCollaborationDrawer;










// import React, { useState, useEffect } from 'react';
// import { useSelector } from 'react-redux';
// import {
//   Drawer, Tabs, Timeline, List, Avatar, Tag, Button, Input,
//   Space, Typography, Upload, Select, Tooltip, Popconfirm,
//   Badge, Empty, Spin, message, Divider, Alert, Modal
// } from 'antd';
// import {
//   HistoryOutlined, CommentOutlined, UserAddOutlined, SafetyOutlined,
//   UploadOutlined, DeleteOutlined, UserOutlined, DownloadOutlined,
//   EyeOutlined, TeamOutlined, ReloadOutlined, ClockCircleOutlined,
//   FileOutlined, CheckCircleOutlined, RollbackOutlined, LockOutlined,
//   UnlockOutlined, WarningOutlined, EditOutlined
// } from '@ant-design/icons';
// import dayjs from 'dayjs';
// import relativeTime from 'dayjs/plugin/relativeTime';
// import sharepointAPI from '../../services/sharePointAPI';

// dayjs.extend(relativeTime);

// const { Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// const fmtSize = (bytes) => {
//   if (!bytes) return '—';
//   const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
//   return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + s[i];
// };

// const ACTION_META = {
//   view:               { text: 'Viewed',            color: '#1890ff', icon: <EyeOutlined /> },
//   download:           { text: 'Downloaded',         color: '#52c41a', icon: <DownloadOutlined /> },
//   checkout:           { text: 'Checked out',        color: '#722ed1', icon: <LockOutlined /> },
//   checkin:            { text: 'Checked in',         color: '#13c2c2', icon: <UnlockOutlined /> },
//   checkout_expired:   { text: 'Checkout expired',   color: '#faad14', icon: <WarningOutlined /> },
//   upload_version:     { text: 'Uploaded version',   color: '#722ed1', icon: <UploadOutlined /> },
//   comment:            { text: 'Commented',          color: '#fa8c16', icon: <CommentOutlined /> },
//   comment_delete:     { text: 'Deleted comment',    color: '#ff4d4f', icon: <DeleteOutlined /> },
//   collaborator_add:   { text: 'Added collaborator', color: '#52c41a', icon: <UserAddOutlined /> },
//   collaborator_remove:{ text: 'Removed collaborator',color: '#ff4d4f', icon: <DeleteOutlined /> },
//   share:              { text: 'Shared',             color: '#13c2c2', icon: <TeamOutlined /> },
//   access_granted:     { text: 'Granted access',     color: '#52c41a', icon: <CheckCircleOutlined /> },
//   access_revoked:     { text: 'Revoked access',     color: '#ff4d4f', icon: <DeleteOutlined /> }
// };
// const getActionMeta = (action) => ACTION_META[action] || { text: action, color: '#999', icon: <ClockCircleOutlined /> };

// // ─── Component ────────────────────────────────────────────────────────────────

// const FileCollaborationDrawer = ({ visible, onClose, file, onVersionUploaded }) => {
//   const { user } = useSelector((state) => state.auth);

//   const [activeTab,     setActiveTab]     = useState('checkout');
//   const [loading,       setLoading]       = useState(false);

//   // File detail (refreshed on open)
//   const [detail,        setDetail]        = useState(null);
//   const [versions,      setVersions]      = useState([]);
//   const [auditTrail,    setAuditTrail]    = useState([]);

//   // Checkout UI
//   const [coNote,        setCoNote]        = useState('');
//   const [coLoading,     setCoLoading]     = useState(false);
//   // Check-in with new version
//   const [ciFile,        setCiFile]        = useState(null);
//   const [ciNote,        setCiNote]        = useState('');
//   const [ciLoading,     setCiLoading]     = useState(false);

//   // Version-only upload (no checkout needed for collaborators with edit)
//   const [vFile,         setVFile]         = useState(null);
//   const [vNote,         setVNote]         = useState('');
//   const [vLoading,      setVLoading]      = useState(false);

//   // Comment
//   const [cText,         setCText]         = useState('');
//   const [cLoading,      setCLoading]      = useState(false);

//   // Collaborator invite
//   const [invEmail,      setInvEmail]      = useState('');
//   const [invPerm,       setInvPerm]       = useState('download');
//   const [invLoading,    setInvLoading]    = useState(false);

//   useEffect(() => {
//     if (visible && file) loadAll();
//   }, [visible, file]);

//   const loadAll = async () => {
//     setLoading(true);
//     try {
//       const [detailRes, versRes, auditRes] = await Promise.all([
//         sharepointAPI.getFileDetails(file._id),
//         sharepointAPI.getFileVersions(file._id),
//         sharepointAPI.getFileAuditTrail(file._id)
//       ]);
//       setDetail(detailRes.data.data);
//       setVersions(versRes.data.data || []);
//       setAuditTrail(auditRes.data.data || []);
//     } catch {
//       message.error('Failed to load collaboration data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── Derived state ───────────────────────────────────────────────────────────
//   const checkout       = detail?.checkout;
//   const coExpired      = checkout?.expiresAt && new Date() > new Date(checkout.expiresAt);
//   const isLocked       = !!checkout?.userId && !coExpired;
//   const lockedByMe     = isLocked && checkout.userId?._id === user?._id;
//   const lockedByOther  = isLocked && !lockedByMe;
//   const comments       = (detail?.comments || []).filter(c => !c.isDeleted);
//   const collaborators  = detail?.collaborators || [];
//   const isOwner        = detail && user && (
//     detail.uploadedBy?._id === user._id ||
//     detail.uploadedBy === user._id ||
//     user.role === 'admin'
//   );
//   const hasEditAccess  = isOwner || collaborators.some(c =>
//     (c.userId?._id === user?._id || c.userId === user?._id) && c.permission === 'edit'
//   );

//   // ── Checkout ────────────────────────────────────────────────────────────────
//   const handleCheckout = async () => {
//     setCoLoading(true);
//     try {
//       await sharepointAPI.checkoutFile(file._id, coNote);
//       message.success('File checked out. You have 2 hours to edit and check back in.');
//       setCoNote('');
//       await loadAll();
//     } catch (e) {
//       const msg = e.response?.data?.message || 'Checkout failed';
//       message.error(msg);
//     } finally {
//       setCoLoading(false);
//     }
//   };

//   const handleCheckin = async () => {
//     setCoLoading(true);
//     try {
//       await sharepointAPI.checkinFile(file._id, ciFile?.originFileObj || null, ciNote);
//       message.success(ciFile ? 'Checked in with new version!' : 'Checked in (no changes)');
//       setCiFile(null); setCiNote('');
//       await loadAll();
//       if (onVersionUploaded) onVersionUploaded();
//     } catch (e) {
//       message.error(e.response?.data?.message || 'Check-in failed');
//     } finally {
//       setCoLoading(false);
//     }
//   };

//   const handleForceCheckin = () => {
//     Modal.confirm({
//       title: 'Force-release checkout?',
//       content: 'Any unsaved edits by the current editor will be lost.',
//       okText: 'Release', okType: 'danger',
//       async onOk() {
//         await sharepointAPI.forceCheckin(file._id);
//         message.success('Checkout released');
//         await loadAll();
//       }
//     });
//   };

//   // ── Version upload (no checkout) ────────────────────────────────────────────
//   const handleUploadVersion = async () => {
//     if (!vFile) return message.warning('Please select a file');
//     setVLoading(true);
//     try {
//       const fd = new FormData();
//       fd.append('file', vFile.originFileObj || vFile);
//       if (vNote) fd.append('changeNote', vNote);
//       await sharepointAPI.createFileVersion(file._id, fd);
//       message.success('New version uploaded');
//       setVFile(null); setVNote('');
//       await loadAll();
//       if (onVersionUploaded) onVersionUploaded();
//     } catch (e) {
//       message.error(e.response?.data?.message || 'Upload failed');
//     } finally {
//       setVLoading(false);
//     }
//   };

//   // ── Version restore ─────────────────────────────────────────────────────────
//   const handleRestoreVersion = async (versionIndex) => {
//     try {
//       await sharepointAPI.restoreFileVersion(file._id, versionIndex);
//       message.success('Version restored');
//       await loadAll();
//       if (onVersionUploaded) onVersionUploaded();
//     } catch {
//       message.error('Failed to restore version');
//     }
//   };

//   // ── Comments ────────────────────────────────────────────────────────────────
//   const handleAddComment = async () => {
//     if (!cText.trim()) return;
//     setCLoading(true);
//     try {
//       await sharepointAPI.addComment(file._id, cText.trim());
//       setCText('');
//       await loadAll();
//     } catch {
//       message.error('Failed to add comment');
//     } finally {
//       setCLoading(false);
//     }
//   };

//   const handleDeleteComment = async (commentId) => {
//     try {
//       await sharepointAPI.deleteComment(file._id, commentId);
//       message.success('Comment deleted');
//       await loadAll();
//     } catch {
//       message.error('Failed to delete comment');
//     }
//   };

//   // ── Collaborators ───────────────────────────────────────────────────────────
//   const handleInvite = async () => {
//     if (!invEmail.trim()) return message.warning('Enter user email');
//     setInvLoading(true);
//     try {
//       await sharepointAPI.addCollaborator(file._id, invEmail.trim(), invPerm);
//       message.success('Collaborator added');
//       setInvEmail('');
//       await loadAll();
//     } catch (e) {
//       message.error(e.response?.data?.message || 'Failed to add collaborator');
//     } finally {
//       setInvLoading(false);
//     }
//   };

//   const handleRemoveCollaborator = async (userId) => {
//     try {
//       await sharepointAPI.removeCollaborator(file._id, userId);
//       message.success('Collaborator removed');
//       await loadAll();
//     } catch {
//       message.error('Failed to remove collaborator');
//     }
//   };

//   // ── Tabs ────────────────────────────────────────────────────────────────────
//   const tabItems = [
//     // ── TAB 1: CHECKOUT / CHECK-IN ────────────────────────────────────────────
//     {
//       key: 'checkout',
//       label: (
//         <span>
//           {isLocked ? <LockOutlined style={{ color: lockedByMe ? '#722ed1' : '#ff4d4f' }} /> : <UnlockOutlined style={{ color: '#52c41a' }} />}
//           {' '}Checkout
//         </span>
//       ),
//       children: (
//         <div>
//           {/* Status banner */}
//           {isLocked ? (
//             <Alert
//               type={lockedByMe ? 'info' : 'warning'}
//               showIcon
//               icon={<LockOutlined />}
//               message={lockedByMe ? 'You have this file checked out' : 'File is locked by another editor'}
//               description={
//                 <div>
//                   {!lockedByMe && <div><strong>Checked out by:</strong> {checkout.userId?.fullName || 'Unknown'}</div>}
//                   <div><strong>Expires:</strong> {dayjs(checkout.expiresAt).format('DD MMM YYYY, HH:mm')} ({dayjs(checkout.expiresAt).fromNow()})</div>
//                   {checkout.note && <div><strong>Note:</strong> {checkout.note}</div>}
//                 </div>
//               }
//               style={{ marginBottom: 16 }}
//             />
//           ) : (
//             <Alert
//               type="success"
//               showIcon
//               icon={<UnlockOutlined />}
//               message="File is available"
//               description="No one is currently editing this file. Check it out to lock it for exclusive editing."
//               style={{ marginBottom: 16 }}
//             />
//           )}

//           {/* Checkout action */}
//           {!isLocked && hasEditAccess && (
//             <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, marginBottom: 20 }}>
//               <Text strong style={{ display: 'block', marginBottom: 10 }}>
//                 <LockOutlined /> Check Out File
//               </Text>
//               <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>
//                 Locking the file prevents others from uploading versions while you edit. The lock auto-releases after 2 hours.
//               </Text>
//               <Input
//                 placeholder="What are you working on? (optional)"
//                 value={coNote}
//                 onChange={(e) => setCoNote(e.target.value)}
//                 style={{ marginBottom: 10 }}
//               />
//               <Button type="primary" icon={<LockOutlined />} loading={coLoading} onClick={handleCheckout}>
//                 Check Out
//               </Button>
//             </div>
//           )}

//           {/* Check-in action (only the person who checked out) */}
//           {lockedByMe && (
//             <div style={{ background: '#f0f8ff', borderRadius: 8, padding: 16, marginBottom: 20 }}>
//               <Text strong style={{ display: 'block', marginBottom: 10 }}>
//                 <UnlockOutlined /> Check In
//               </Text>
//               <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>
//                 Optionally upload your edited file along with the check-in. If you made no changes, just check in to release the lock.
//               </Text>
//               <Upload beforeUpload={() => false} maxCount={1}
//                 onChange={(info) => setCiFile(info.fileList.slice(-1)[0])}
//                 fileList={ciFile ? [ciFile] : []}>
//                 <Button icon={<UploadOutlined />}>Attach Updated File (optional)</Button>
//               </Upload>
//               {ciFile && (
//                 <Input
//                   style={{ marginTop: 10 }}
//                   placeholder="What changed? (optional change note)"
//                   value={ciNote}
//                   onChange={(e) => setCiNote(e.target.value)}
//                 />
//               )}
//               <Space style={{ marginTop: 12 }}>
//                 <Button type="primary" icon={<UnlockOutlined />} loading={coLoading} onClick={handleCheckin}>
//                   {ciFile ? 'Check In with New Version' : 'Check In (No Changes)'}
//                 </Button>
//               </Space>
//             </div>
//           )}

//           {/* Force release — admin or owner */}
//           {isLocked && !lockedByMe && user?.role === 'admin' && (
//             <Button danger icon={<WarningOutlined />} onClick={handleForceCheckin} style={{ marginTop: 8 }}>
//               Force Release Lock (Admin)
//             </Button>
//           )}
//         </div>
//       )
//     },

//     // ── TAB 2: VERSIONS ────────────────────────────────────────────────────────
//     {
//       key: 'versions',
//       label: (
//         <span>
//           <HistoryOutlined /> Versions
//           <Badge count={versions.length} size="small" style={{ marginLeft: 6, backgroundColor: '#722ed1' }} />
//         </span>
//       ),
//       children: (
//         <div>
//           {/* Upload version without checkout (for collaborators with edit) */}
//           {hasEditAccess && !lockedByOther && (
//             <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, marginBottom: 20 }}>
//               <Text strong style={{ display: 'block', marginBottom: 8 }}>
//                 <UploadOutlined /> Upload New Version
//               </Text>
//               {lockedByMe && (
//                 <Alert type="info" message="Tip: You can also upload the new version during check-in." style={{ marginBottom: 10 }} showIcon />
//               )}
//               <Upload beforeUpload={() => false} maxCount={1}
//                 onChange={(info) => setVFile(info.fileList.slice(-1)[0])}
//                 fileList={vFile ? [vFile] : []}>
//                 <Button icon={<UploadOutlined />}>Select File</Button>
//               </Upload>
//               {vFile && (
//                 <>
//                   <Input style={{ marginTop: 10 }} placeholder="Describe what changed..." value={vNote} onChange={(e) => setVNote(e.target.value)} />
//                   <Button type="primary" style={{ marginTop: 10 }} loading={vLoading} onClick={handleUploadVersion} icon={<UploadOutlined />}>
//                     Upload Version
//                   </Button>
//                 </>
//               )}
//             </div>
//           )}

//           {versions.length === 0 ? (
//             <Empty description="Only the current version exists" />
//           ) : (
//             <List dataSource={versions} renderItem={(v, idx) => (
//               <List.Item
//                 key={idx}
//                 style={{
//                   background: v.isCurrent ? '#f0f8ff' : 'white',
//                   borderRadius: 8, marginBottom: 8, padding: '12px 16px',
//                   border: v.isCurrent ? '1px solid #1890ff' : '1px solid #f0f0f0'
//                 }}
//                 actions={[
//                   v.isCurrent ? <Tag color="blue">Current</Tag> : (
//                     isOwner && (
//                       <Popconfirm title="Restore this version?" description="The current version will be archived." onConfirm={() => handleRestoreVersion(v.index)} okText="Restore">
//                         <Button type="link" size="small" icon={<RollbackOutlined />}>Restore</Button>
//                       </Popconfirm>
//                     )
//                   )
//                 ]}
//               >
//                 <List.Item.Meta
//                   avatar={<Avatar icon={<FileOutlined />} style={{ backgroundColor: v.isCurrent ? '#1890ff' : '#d9d9d9' }} />}
//                   title={<Space><Text strong>Version {v.versionNumber}</Text><Text type="secondary" style={{ fontSize: 12 }}>{fmtSize(v.size)}</Text></Space>}
//                   description={
//                     <div>
//                       <div><UserOutlined style={{ marginRight: 4 }} /><Text type="secondary" style={{ fontSize: 12 }}>{v.uploadedBy?.fullName || 'Unknown'} · {dayjs(v.uploadedAt).fromNow()}</Text></div>
//                       {v.changeNote && <Text italic style={{ fontSize: 12, color: '#888' }}>"{v.changeNote}"</Text>}
//                     </div>
//                   }
//                 />
//               </List.Item>
//             )} />
//           )}
//         </div>
//       )
//     },

//     // ── TAB 3: DISCUSSION ──────────────────────────────────────────────────────
//     {
//       key: 'comments',
//       label: (
//         <span>
//           <CommentOutlined /> Discussion
//           <Badge count={comments.length} size="small" style={{ marginLeft: 6, backgroundColor: '#fa8c16' }} />
//         </span>
//       ),
//       children: (
//         <div>
//           <TextArea rows={3} placeholder="Add a comment or note..." value={cText} onChange={(e) => setCText(e.target.value)} />
//           <Button type="primary" style={{ marginTop: 8 }} loading={cLoading} onClick={handleAddComment} disabled={!cText.trim()}>
//             Post Comment
//           </Button>
//           <Divider />
//           {comments.length === 0 ? <Empty description="No comments yet" /> : (
//             <List dataSource={[...comments].reverse()} renderItem={(c) => (
//               <List.Item key={c._id} actions={[
//                 (c.userId?._id === user?._id || c.userId === user?._id || user?.role === 'admin') && (
//                   <Popconfirm title="Delete comment?" onConfirm={() => handleDeleteComment(c._id)}>
//                     <Button type="link" danger size="small" icon={<DeleteOutlined />} />
//                   </Popconfirm>
//                 )
//               ]}>
//                 <List.Item.Meta
//                   avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />}
//                   title={<Space><Text strong style={{ fontSize: 13 }}>{c.userId?.fullName || 'Unknown'}</Text><Text type="secondary" style={{ fontSize: 11 }}>{dayjs(c.createdAt).fromNow()}</Text></Space>}
//                   description={<Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{c.text}</Paragraph>}
//                 />
//               </List.Item>
//             )} />
//           )}
//         </div>
//       )
//     },

//     // ── TAB 4: COLLABORATORS ───────────────────────────────────────────────────
//     {
//       key: 'collaborators',
//       label: (
//         <span>
//           <TeamOutlined /> Collaborators
//           <Badge count={collaborators.length} size="small" style={{ marginLeft: 6, backgroundColor: '#52c41a' }} />
//         </span>
//       ),
//       children: (
//         <div>
//           {isOwner && (
//             <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, marginBottom: 16 }}>
//               <Text strong style={{ display: 'block', marginBottom: 10 }}><UserAddOutlined /> Add Collaborator</Text>
//               <Space direction="vertical" style={{ width: '100%' }}>
//                 <Input placeholder="User email..." value={invEmail} onChange={(e) => setInvEmail(e.target.value)} onPressEnter={handleInvite} />
//                 <Space>
//                   <Select value={invPerm} onChange={setInvPerm} style={{ width: 190 }}>
//                     <Option value="view"><Tag color="blue">View only</Tag></Option>
//                     <Option value="download"><Tag color="green">Download</Tag></Option>
//                     <Option value="edit"><Tag color="purple">Edit (upload versions)</Tag></Option>
//                   </Select>
//                   <Button type="primary" onClick={handleInvite} loading={invLoading} icon={<UserAddOutlined />}>Invite</Button>
//                 </Space>
//               </Space>
//             </div>
//           )}

//           <Alert
//             type="info" showIcon
//             message={<Text style={{ fontSize: 12 }}>Collaborators with <strong>Edit</strong> permission can upload versions. Use <strong>Checkout</strong> to lock the file while you edit, preventing conflicts.</Text>}
//             style={{ marginBottom: 16 }}
//           />

//           {collaborators.length === 0 ? <Empty description="No collaborators yet" /> : (
//             <List dataSource={collaborators} renderItem={(c) => (
//               <List.Item key={c.userId?._id} actions={[
//                 isOwner && (
//                   <Popconfirm title="Remove collaborator?" onConfirm={() => handleRemoveCollaborator(c.userId?._id)}>
//                     <Button type="link" danger size="small" icon={<DeleteOutlined />}>Remove</Button>
//                   </Popconfirm>
//                 )
//               ]}>
//                 <List.Item.Meta
//                   avatar={<Avatar icon={<UserOutlined />} />}
//                   title={<Space><Text strong>{c.userId?.fullName || 'Unknown'}</Text><Tag color={c.permission === 'edit' ? 'purple' : c.permission === 'download' ? 'green' : 'blue'}>{c.permission === 'edit' ? 'Can edit' : c.permission === 'download' ? 'Can download' : 'View only'}</Tag></Space>}
//                   description={<Text type="secondary" style={{ fontSize: 12 }}>{c.userId?.email} · Added {dayjs(c.addedAt).fromNow()}</Text>}
//                 />
//               </List.Item>
//             )} />
//           )}
//         </div>
//       )
//     },

//     // ── TAB 5: AUDIT TRAIL ─────────────────────────────────────────────────────
//     {
//       key: 'audit',
//       label: <span><SafetyOutlined /> Audit Trail</span>,
//       children: (
//         <div>
//           <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
//             <Button size="small" icon={<ReloadOutlined />} onClick={loadAll}>Refresh</Button>
//           </div>
//           {auditTrail.length === 0 ? <Empty description="No activity recorded yet" /> : (
//             <Timeline items={auditTrail.slice(0, 100).map((entry, i) => {
//               const { text, color, icon } = getActionMeta(entry.action);
//               return {
//                 key: i, color, dot: icon,
//                 children: (
//                   <div>
//                     <Space>
//                       <Text strong style={{ fontSize: 13 }}>{entry.userId?.fullName || 'Unknown'}</Text>
//                       <Tag color={color} style={{ fontSize: 11 }}>{text}</Tag>
//                     </Space>
//                     <div>
//                       <Text type="secondary" style={{ fontSize: 11 }}>
//                         {dayjs(entry.timestamp).format('DD MMM YYYY, HH:mm')} · {dayjs(entry.timestamp).fromNow()}
//                       </Text>
//                     </div>
//                     {entry.meta?.changeNote && <Text italic style={{ fontSize: 11, color: '#888' }}>"{entry.meta.changeNote}"</Text>}
//                     {entry.meta?.note       && <Text italic style={{ fontSize: 11, color: '#888' }}>"{entry.meta.note}"</Text>}
//                     {entry.meta?.preview    && <Text style={{ fontSize: 11, color: '#888' }}>{entry.meta.preview}</Text>}
//                   </div>
//                 )
//               };
//             })} />
//           )}
//         </div>
//       )
//     }
//   ];

//   return (
//     <Drawer
//       title={
//         <Space>
//           <FileOutlined />
//           <div>
//             <div style={{ fontWeight: 600, fontSize: 14 }}>
//               {file?.name}
//               {isLocked && <Tag icon={<LockOutlined />} color={lockedByMe ? 'purple' : 'red'} style={{ marginLeft: 8 }}>
//                 {lockedByMe ? 'Checked out by you' : 'Locked'}
//               </Tag>}
//             </div>
//             <Text type="secondary" style={{ fontSize: 11, fontWeight: 400 }}>
//               {fmtSize(file?.size)} · {versions.length + 1} version{versions.length !== 0 ? 's' : ''}
//               {isLocked && ` · Expires ${dayjs(checkout?.expiresAt).fromNow()}`}
//             </Text>
//           </div>
//         </Space>
//       }
//       placement="right"
//       width={600}
//       open={visible}
//       onClose={onClose}
//       destroyOnClose
//       extra={<Button size="small" icon={<ReloadOutlined />} onClick={loadAll} loading={loading}>Refresh</Button>}
//     >
//       {loading ? (
//         <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
//       ) : (
//         <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
//       )}
//     </Drawer>
//   );
// };

// export default FileCollaborationDrawer;