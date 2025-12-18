import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response?.status === 401) {
    if (!window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location = '/login';
    }
  }
  return Promise.reject(error);
});

export const projectsAPI = {
  // Get active projects
  getActiveProjects: async () => {
    try {
      console.log('=== CALLING GET ACTIVE PROJECTS ===');
      const response = await api.get('/projects/active');
      return response.data;
    } catch (error) {
      console.error('API: Error fetching active projects:', error);
      throw error;
    }
  },

  // Get all projects
  getAllProjects: async (params = {}) => {
    try {
      const response = await api.get('/projects', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching all projects:', error);
      throw error;
    }
  },

  // Get project by ID
  getProjectById: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching project details:', error);
      throw error;
    }
  }
};

// ===== IT SUPPORT API =====
export const itSupportAPI = {
  getDashboardStats: async () => {
    try {
      console.log('Fetching dashboard stats...');
      const response = await api.get('/it-support/dashboard/stats');
      console.log('Dashboard stats response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching dashboard stats:', error);
      if (error.response?.status === 404 || error.response?.status === 304) {
        console.warn('Dashboard stats endpoint not found, returning mock data');
        return {
          success: true,
          data: {
            summary: {
              total: 0,
              pending: 0,
              inProgress: 0,
              resolved: 0,
              materialRequests: 0,
              technicalIssues: 0,
              critical: 0,
              slaBreached: 0
            },
            recent: [],
            trends: {
              resolutionRate: 0,
              avgResponseTime: 0,
              slaCompliance: 100
            }
          }
        };
      }
      throw error;
    }
  },

  getRequestsByRole: async (params = {}) => {
    try {
      console.log('Fetching requests by role...');
      const response = await api.get('/it-support/role/requests', { params });
      console.log('Role-based requests response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching role-based requests:', error);
      throw error;
    }
  },

  getEmployeeRequests: async (params = {}) => {
    try {
      console.log('Fetching employee requests...');
      const response = await api.get('/it-support/employee', { params });
      console.log('Employee requests response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching employee requests:', error);
      throw error;
    }
  },

  getSupervisorRequests: async (params = {}) => {
    try {
      console.log('Fetching supervisor requests...');
      const response = await api.get('/it-support/supervisor', { params });
      console.log('Supervisor requests response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching supervisor requests:', error);
      throw error;
    }
  },

  getITDepartmentRequests: async (params = {}) => {
    try {
      console.log('Fetching IT department requests...');
      const response = await api.get('/it-support/it-department', { params });
      console.log('IT department requests response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching IT department requests:', error);
      throw error;
    }
  },

  getAllRequests: async (params = {}) => {
    try {
      console.log('Fetching all admin requests...');
      const response = await api.get('/it-support/admin', { params });
      console.log('All admin requests response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching all admin requests:', error);
      throw error;
    }
  },

  // Create material request with file upload
  createMaterialRequest: async (requestData) => {
    try {
      const formData = new FormData();

      // Generate ticket number
      const ticketNumber = `ITM-${Date.now()}`;

      // Basic fields
      formData.append('ticketNumber', ticketNumber);
      formData.append('requestType', 'material_request');
      formData.append('title', requestData.title || 'Material Request');
      formData.append('description', requestData.description);
      formData.append('category', requestData.category || 'hardware');
      formData.append('subcategory', requestData.subcategory || 'accessories');
      formData.append('priority', requestData.priority || 'medium');
      formData.append('urgency', requestData.urgency || 'normal');
      formData.append('businessJustification', requestData.businessJustification || '');
      formData.append('businessImpact', requestData.businessImpact || '');
      formData.append('location', requestData.location || 'Office');

      // Contact info
      if (requestData.contactInfo) {
        formData.append('contactInfo', JSON.stringify(requestData.contactInfo));
      }

      // Requested items
      if (requestData.requestedItems && requestData.requestedItems.length > 0) {
        formData.append('requestedItems', JSON.stringify(requestData.requestedItems));
      }

      // Additional fields
      if (requestData.preferredContactMethod) {
        formData.append('preferredContactMethod', requestData.preferredContactMethod);
      }

      // Handle file attachments
      if (requestData.attachments && requestData.attachments.length > 0) {
        requestData.attachments.forEach((file) => {
          if (file.originFileObj) {
            formData.append('attachments', file.originFileObj);
          } else if (file instanceof File) {
            formData.append('attachments', file);
          }
        });
      }

      console.log('Submitting material request...');

      const response = await api.post('/it-support', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

      return response.data;
    } catch (error) {
      console.error('API: Error creating material request:', error);
      throw error;
    }
  },

  // Create technical issue with file upload
  createTechnicalIssue: async (requestData) => {
    try {
      const formData = new FormData();

      // Generate ticket number
      const ticketNumber = `ITI-${Date.now()}`;

      // Basic fields
      formData.append('ticketNumber', ticketNumber);
      formData.append('requestType', 'technical_issue');
      formData.append('title', requestData.title);
      formData.append('description', requestData.description);
      formData.append('category', requestData.category);
      formData.append('subcategory', requestData.subcategory);
      formData.append('priority', requestData.severity || 'medium');
      formData.append('urgency', requestData.urgency || 'normal');
      formData.append('businessJustification', requestData.businessImpact || '');
      formData.append('businessImpact', requestData.businessImpact || '');
      formData.append('location', requestData.location);

      // Contact info
      if (requestData.contactInfo) {
        formData.append('contactInfo', JSON.stringify(requestData.contactInfo));
      }

      // Device details
      if (requestData.deviceDetails) {
        formData.append('deviceDetails', JSON.stringify(requestData.deviceDetails));
      }

      // Issue details
      if (requestData.issueDetails) {
        formData.append('issueDetails', JSON.stringify(requestData.issueDetails));
      }

      // Troubleshooting information
      if (requestData.troubleshootingAttempted !== undefined) {
        formData.append('troubleshootingAttempted', requestData.troubleshootingAttempted);
      }

      if (requestData.troubleshootingSteps && requestData.troubleshootingSteps.length > 0) {
        formData.append('troubleshootingSteps', JSON.stringify(requestData.troubleshootingSteps));
      }

      // Additional fields
      if (requestData.preferredContactMethod) {
        formData.append('preferredContactMethod', requestData.preferredContactMethod);
      }

      // Handle file attachments
      if (requestData.attachments && requestData.attachments.length > 0) {
        requestData.attachments.forEach((file) => {
          if (file.originFileObj) {
            formData.append('attachments', file.originFileObj);
          } else if (file instanceof File) {
            formData.append('attachments', file);
          }
        });
      }

      console.log('Submitting technical issue with', requestData.attachments?.length || 0, 'attachments...');

      const response = await api.post('/it-support', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

      return response.data;
    } catch (error) {
      console.error('API: Error creating technical issue:', error);
      throw error;
    }
  },

  getRequestById: async (requestId) => {
    try {
      const response = await api.get(`/it-support/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching IT request details:', error);
      throw error;
    }
  },

  processSupervisorDecision: async (requestId, decision) => {
    try {
      const response = await api.put(`/it-support/${requestId}/supervisor`, decision);
      return response.data;
    } catch (error) {
      console.error('API: Error processing supervisor decision:', error);
      throw error;
    }
  },

  processITDepartmentDecision: async (requestId, decision) => {
    try {
      const response = await api.put(`/it-support/${requestId}/it-department`, decision);
      return response.data;
    } catch (error) {
      console.error('API: Error processing IT department decision:', error);
      throw error;
    }
  },

  updateFulfillmentStatus: async (requestId, statusData) => {
    try {
      const response = await api.put(`/it-support/${requestId}/fulfillment`, statusData);
      return response.data;
    } catch (error) {
      console.error('API: Error updating fulfillment status:', error);
      throw error;
    }
  },

  updateRequest: async (requestId, updateData) => {
    try {
      const response = await api.put(`/it-support/${requestId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('API: Error updating IT request:', error);
      throw error;
    }
  },

  deleteRequest: async (requestId) => {
    try {
      const response = await api.delete(`/it-support/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('API: Error deleting IT request:', error);
      throw error;
    }
  },

  saveDraft: async (draftData) => {
    try {
      const response = await api.post('/it-support/draft', draftData);
      return response.data;
    } catch (error) {
      console.error('API: Error saving draft:', error);
      throw error;
    }
  },

  getApprovalChainPreview: async (department, employeeName) => {
    try {
      const response = await api.post('/it-support/preview-approval-chain', {
        department,
        employeeName
      });
      return response.data;
    } catch (error) {
      console.error('API: Error getting approval chain preview:', error);
      throw error;
    }
  },

  downloadAttachment: (requestId, fileName) => {
    // Return download URL
    return `${process.env.REACT_APP_API_URL}/it-support/download/${requestId}/${fileName}`;
  }
};

// ===== CASH REQUEST API =====
export const cashRequestAPI = {
  // Employee functions
  create: async (formData) => {
    console.log('API: Creating cash request...');
    console.log('FormData entries:');
    
    for (let pair of formData.entries()) {
      if (pair[1] instanceof File) {
        console.log(`${pair[0]}: File - ${pair[1].name} (${pair[1].size} bytes)`);
      } else {
        console.log(`${pair[0]}:`, pair[1]);
      }
    }

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, 
    };
    
    try {
      const response = await api.post('/cash-requests', formData, config);
      console.log('API: Cash request created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error creating cash request:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      }
      
      throw error;
    }
  },

  getEmployeeRequests: async (params = {}) => {
    try {
      const response = await api.get('/cash-requests/employee', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching employee cash requests:', error);
      throw error;
    }
  },

  getRequestById: async (requestId) => {
    try {
      const response = await api.get(`/cash-requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching cash request details:', error);
      throw error;
    }
  },

  updateRequest: async (requestId, updateData) => {
    try {
      const response = await api.put(`/cash-requests/${requestId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('API: Error updating cash request:', error);
      throw error;
    }
  },

  deleteRequest: async (requestId) => {
    try {
      const response = await api.delete(`/cash-requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('API: Error deleting cash request:', error);
      throw error;
    }
  },

  getSupervisorRequests: async (params = {}) => {
    try {
      const response = await api.get('/cash-requests/supervisor', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching supervisor cash requests:', error);
      throw error;
    }
  },

  processSupervisorDecision: async (requestId, decision) => {
    try {
      const response = await api.put(`/cash-requests/${requestId}/supervisor`, decision);
      return response.data;
    } catch (error) {
      console.error('API: Error processing supervisor decision:', error);
      throw error;
    }
  },

  getSupervisorJustifications: async (params = {}) => {
    try {
      const response = await api.get('/cash-requests/supervisor/justifications', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching supervisor justifications:', error);
      throw error;
    }
  },

  processSupervisorJustificationDecision: async (requestId, decision) => {
    try {
      const response = await api.put(`/cash-requests/${requestId}/supervisor/justification`, decision);
      return response.data;
    } catch (error) {
      console.error('API: Error processing supervisor justification decision:', error);
      throw error;
    }
  },

  getFinanceRequests: async (params = {}) => {
    try {
      const response = await api.get('/cash-requests/finance', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching finance cash requests:', error);
      throw error;
    }
  },

  processFinanceDecision: async (requestId, decision) => {
    try {
      const response = await api.put(`/cash-requests/${requestId}/finance`, decision);
      return response.data;
    } catch (error) {
      console.error('API: Error processing finance decision:', error);
      throw error;
    }
  },

  getFinanceJustifications: async (params = {}) => {
    try {
      const response = await api.get('/cash-requests/finance/justifications', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching finance justifications:', error);
      throw error;
    }
  },

  processFinanceJustificationDecision: async (requestId, decision) => {
    try {
      const response = await api.put(`/cash-requests/${requestId}/finance/justification`, decision);
      return response.data;
    } catch (error) {
      console.error('API: Error processing finance justification decision:', error);
      throw error;
    }
  },

  getAllRequests: async (params = {}) => {
    try {
      const response = await api.get('/cash-requests/admin', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching all cash requests:', error);
      throw error;
    }
  },

  getAdminRequestDetails: async (requestId) => {
    try {
      const response = await api.get(`/cash-requests/admin/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching admin request details:', error);
      throw error;
    }
  },

  submitJustification: async (requestId, formData) => {
    console.log('API: Submitting justification...');
    console.log('FormData entries:');
    
    for (let pair of formData.entries()) {
      if (pair[1] instanceof File) {
        console.log(`${pair[0]}: File - ${pair[1].name} (${pair[1].size} bytes)`);
      } else {
        console.log(`${pair[0]}:`, pair[1]);
      }
    }

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    };
    
    try {
      const response = await api.post(`/cash-requests/${requestId}/justification`, formData, config);
      console.log('API: Justification submitted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error submitting justification:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      }
      
      throw error;
    }
  },

  getRequestForJustification: async (requestId) => {
    try {
      const response = await api.get(`/cash-requests/employee/${requestId}/justify`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching request for justification:', error);
      throw error;
    }
  },

  getStats: async (params = {}) => {
    try {
      const response = await api.get('/cash-requests/analytics/statistics', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching cash request stats:', error);
      throw error;
    }
  },

  getDashboardStats: async () => {
    try {
      const response = await api.get('/cash-requests/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('API: Error fetching dashboard stats:', error);
      throw error;
    }
  },

  getApprovalChainPreview: async (employeeName, department) => {
    try {
      const response = await api.post('/cash-requests/preview-approval-chain', {
        employeeName,
        department
      });
      return response.data;
    } catch (error) {
      console.error('API: Error getting approval chain preview:', error);
      throw error;
    }
  },

  downloadAttachment: async (requestId, fileName) => {
    try {
      const response = await api.get(`/cash-requests/${requestId}/attachment/${fileName}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('API: Error downloading attachment:', error);
      throw error;
    }
  }, 

};

export default api;











// import axios from 'axios';

// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URLL || 'http://localhost:5001',
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers['Authorization'] = `Bearer ${token}`;
//   }
//   return config;
// }, (error) => {
//   return Promise.reject(error);
// });

// api.interceptors.response.use((response) => {
//   return response;
// }, (error) => {
//   if (error.response?.status === 401) {
//     if (!window.location.pathname.includes('/login')) {
//       // Clear both token and user from localStorage
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       window.location = '/login';
//     }
//   }
//   return Promise.reject(error);
// });

// export const itSupportAPI = {
//   getDashboardStats: async () => {
//     try {
//       console.log('Fetching dashboard stats...');
//       const response = await api.get('/it-support/dashboard/stats');
//       console.log('Dashboard stats response:', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching dashboard stats:', error)
//       if (error.response?.status === 404 || error.response?.status === 304) {
//         console.warn('Dashboard stats endpoint not found, returning mock data');
//         return {
//           success: true,
//           data: {
//             summary: {
//               total: 0,
//               pending: 0,
//               inProgress: 0,
//               resolved: 0,
//               materialRequests: 0,
//               technicalIssues: 0,
//               critical: 0,
//               slaBreached: 0
//             },
//             recent: [],
//             trends: {
//               resolutionRate: 0,
//               avgResponseTime: 0,
//               slaCompliance: 100
//             }
//           }
//         };
//       }
//       throw error;
//     }
//   },

//   getRequestsByRole: async (params = {}) => {
//     try {
//       console.log('Fetching requests by role...');
//       const response = await api.get('/it-support/role/requests', { params });
//       console.log('Role-based requests response:', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching role-based requests:', error);
//       throw error;
//     }
//   },

//   getEmployeeRequests: async (params = {}) => {
//     try {
//       console.log('Fetching employee requests...');
//       const response = await api.get('/it-support/employee', { params });
//       console.log('Employee requests response:', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching employee requests:', error);
//       throw error;
//     }
//   },

//   getSupervisorRequests: async (params = {}) => {
//     try {
//       console.log('Fetching supervisor requests...');
//       const response = await api.get('/it-support/supervisor', { params });
//       console.log('Supervisor requests response:', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching supervisor requests:', error);
//       throw error;
//     }
//   },

//   getITDepartmentRequests: async (params = {}) => {
//     try {
//       console.log('Fetching IT department requests...');
//       const response = await api.get('/it-support/it-department', { params });
//       console.log('IT department requests response:', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching IT department requests:', error);
//       throw error;
//     }
//   },

//   getFinanceRequests: async (params = {}) => {
//     try {
//       console.log('Fetching finance requests...');
//       const response = await api.get('/it-support/finance', { params });
//       console.log('Finance requests response:', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching finance requests:', error);
//       throw error;
//     }
//   },

//   // FIXED: Admin - get all requests
//   getAllRequests: async (params = {}) => {
//     try {
//       console.log('Fetching all admin requests...');
//       const response = await api.get('/it-support/admin', { params });
//       console.log('All admin requests response:', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching all admin requests:', error);
//       throw error;
//     }
//   },

//   // FIXED: Create material request
//   createMaterialRequest: async (requestData) => {
//     try {
//       const formData = new FormData();

//       // Generate ticket number
//       const ticketNumber = `ITM-${Date.now()}`;

//       // Basic fields
//       formData.append('ticketNumber', ticketNumber);
//       formData.append('requestType', 'material_request');
//       formData.append('title', requestData.title || 'Material Request');
//       formData.append('description', requestData.description);
//       formData.append('category', requestData.category || 'hardware');
//       formData.append('subcategory', requestData.subcategory || 'accessories');
//       formData.append('priority', requestData.priority || 'medium');
//       formData.append('urgency', requestData.urgency || 'normal');
//       formData.append('businessJustification', requestData.businessJustification || '');
//       formData.append('businessImpact', requestData.businessImpact || '');
//       formData.append('location', requestData.location || 'Office');

//       // Contact info
//       if (requestData.contactInfo) {
//         formData.append('contactInfo', JSON.stringify(requestData.contactInfo));
//       }

//       // Requested items
//       if (requestData.requestedItems && requestData.requestedItems.length > 0) {
//         formData.append('requestedItems', JSON.stringify(requestData.requestedItems));
//       }

//       // Additional fields
//       if (requestData.preferredContactMethod) {
//         formData.append('preferredContactMethod', requestData.preferredContactMethod);
//       }

//       // Handle file attachments
//       if (requestData.attachments && requestData.attachments.length > 0) {
//         requestData.attachments.forEach((file) => {
//           if (file.originFileObj) {
//             formData.append('attachments', file.originFileObj);
//           } else if (file instanceof File) {
//             formData.append('attachments', file);
//           }
//         });
//       }

//       console.log('Submitting material request...');

//       const response = await api.post('/it-support', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//         timeout: 60000,
//       });

//       return response.data;
//     } catch (error) {
//       console.error('API: Error creating material request:', error);
//       throw error;
//     }
//   },

//   createTechnicalIssue: async (requestData) => {
//     try {
//       const formData = new FormData();

//       // Generate ticket number
//       const ticketNumber = `ITI-${Date.now()}`;

//       // Basic fields
//       formData.append('ticketNumber', ticketNumber);
//       formData.append('requestType', 'technical_issue');
//       formData.append('title', requestData.title);
//       formData.append('description', requestData.description);
//       formData.append('category', requestData.category);
//       formData.append('subcategory', requestData.subcategory);
//       formData.append('priority', requestData.severity || 'medium');
//       formData.append('urgency', requestData.urgency || 'normal');
//       formData.append('businessJustification', requestData.businessImpact || '');
//       formData.append('businessImpact', requestData.businessImpact || '');
//       formData.append('location', requestData.location);

//       // Contact info
//       if (requestData.contactInfo) {
//         formData.append('contactInfo', JSON.stringify(requestData.contactInfo));
//       }

//       // Device details
//       if (requestData.deviceDetails) {
//         formData.append('deviceDetails', JSON.stringify(requestData.deviceDetails));
//       }

//       // Issue details
//       if (requestData.issueDetails) {
//         formData.append('issueDetails', JSON.stringify(requestData.issueDetails));
//       }

//       // Troubleshooting information
//       if (requestData.troubleshootingAttempted !== undefined) {
//         formData.append('troubleshootingAttempted', requestData.troubleshootingAttempted);
//       }

//       if (requestData.troubleshootingSteps && requestData.troubleshootingSteps.length > 0) {
//         formData.append('troubleshootingSteps', JSON.stringify(requestData.troubleshootingSteps));
//       }

//       // Additional fields
//       if (requestData.preferredContactMethod) {
//         formData.append('preferredContactMethod', requestData.preferredContactMethod);
//       }

//       // Handle file attachments
//       if (requestData.attachments && requestData.attachments.length > 0) {
//         requestData.attachments.forEach((file) => {
//           if (file.originFileObj) {
//             formData.append('attachments', file.originFileObj);
//           } else if (file instanceof File) {
//             formData.append('attachments', file);
//           }
//         });
//       }

//       console.log('Submitting technical issue...');

//       const response = await api.post('/it-support', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//         timeout: 60000,
//       });

//       return response.data;
//     } catch (error) {
//       console.error('API: Error creating technical issue:', error);
//       throw error;
//     }
//   },

//   getRequestById: async (requestId) => {
//     try {
//       const response = await api.get(`/it-support/${requestId}`);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching IT request details:', error);
//       throw error;
//     }
//   },

//   processSupervisorDecision: async (requestId, decision) => {
//     try {
//       const response = await api.put(`/it-support/${requestId}/supervisor`, decision);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error processing supervisor decision:', error);
//       throw error;
//     }
//   },

//   processITDepartmentDecision: async (requestId, decision) => {
//     try {
//       const response = await api.put(`/it-support/${requestId}/it-department`, decision);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error processing IT department decision:', error);
//       throw error;
//     }
//   },

//   updateFulfillmentStatus: async (requestId, statusData) => {
//     try {
//       const response = await api.put(`/it-support/${requestId}/fulfillment`, statusData);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error updating fulfillment status:', error);
//       throw error;
//     }
//   },

//   processFinanceDecision: async (requestId, decision) => {
//     try {
//       const response = await api.put(`/it-support/${requestId}/finance`, decision);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error processing finance decision:', error);
//       throw error;
//     }
//   },

//   updateRequest: async (requestId, updateData) => {
//     try {
//       const response = await api.put(`/it-support/${requestId}`, updateData);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error updating IT request:', error);
//       throw error;
//     }
//   },

//   deleteRequest: async (requestId) => {
//     try {
//       const response = await api.delete(`/it-support/${requestId}`);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error deleting IT request:', error);
//       throw error;
//     }
//   },

//   saveDraft: async (draftData) => {
//     try {
//       const response = await api.post('/it-support/draft', draftData);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error saving draft:', error);
//       throw error;
//     }
//   },

//   getApprovalChainPreview: async (department, employeeName) => {
//     try {
//       const response = await api.post('/it-support/preview-approval-chain', {
//         department,
//         employeeName
//       });
//       return response.data;
//     } catch (error) {
//       console.error('API: Error getting approval chain preview:', error);
//       throw error;
//     }
//   },

//   downloadAttachment: async (requestId, fileName) => {
//     try {
//       const response = await api.get(`/it-support/${requestId}/attachment/${fileName}`, {
//         responseType: 'blob',
//       });
//       return response.data;
//     } catch (error) {
//       console.error('API: Error downloading attachment:', error);
//       throw error;
//     }
//   }
// };


// export const cashRequestAPI = {
//   // Employee functions
//   create: async (formData) => {
//     console.log('API: Creating cash request...');
//     console.log('FormData entries:');
    
//     // Debug FormData contents
//     for (let pair of formData.entries()) {
//       if (pair[1] instanceof File) {
//         console.log(`${pair[0]}: File - ${pair[1].name} (${pair[1].size} bytes)`);
//       } else {
//         console.log(`${pair[0]}:`, pair[1]);
//       }
//     }

//     const config = {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//       timeout: 60000, 
//     };
    
//     try {
//       const response = await api.post('/cash-requests', formData, config);
//       console.log('API: Cash request created successfully:', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error creating cash request:', error);
      
//       if (error.response) {
//         console.error('Response status:', error.response.status);
//         console.error('Response data:', error.response.data);
//         console.error('Response headers:', error.response.headers);
//       }
      
//       throw error;
//     }
//   },

//   getEmployeeRequests: async (params = {}) => {
//     try {
//       const response = await api.get('/cash-requests/employee', { params });
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching employee cash requests:', error);
//       throw error;
//     }
//   },

//   getRequestById: async (requestId) => {
//     try {
//       const response = await api.get(`/cash-requests/${requestId}`);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching cash request details:', error);
//       throw error;
//     }
//   },

//   updateRequest: async (requestId, updateData) => {
//     try {
//       const response = await api.put(`/cash-requests/${requestId}`, updateData);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error updating cash request:', error);
//       throw error;
//     }
//   },

//   deleteRequest: async (requestId) => {
//     try {
//       const response = await api.delete(`/cash-requests/${requestId}`);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error deleting cash request:', error);
//       throw error;
//     }
//   },

//   // Supervisor functions
//   getSupervisorRequests: async (params = {}) => {
//     try {
//       const response = await api.get('/cash-requests/supervisor', { params });
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching supervisor cash requests:', error);
//       throw error;
//     }
//   },

//   processSupervisorDecision: async (requestId, decision) => {
//     try {
//       const response = await api.put(`/cash-requests/${requestId}/supervisor`, decision);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error processing supervisor decision:', error);
//       throw error;
//     }
//   },

//   getSupervisorJustifications: async (params = {}) => {
//     try {
//       const response = await api.get('/cash-requests/supervisor/justifications', { params });
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching supervisor justifications:', error);
//       throw error;
//     }
//   },

//   processSupervisorJustificationDecision: async (requestId, decision) => {
//     try {
//       const response = await api.put(`/cash-requests/${requestId}/supervisor/justification`, decision);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error processing supervisor justification decision:', error);
//       throw error;
//     }
//   },

//   // Finance functions  
//   getFinanceRequests: async (params = {}) => {
//     try {
//       const response = await api.get('/cash-requests/finance', { params });
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching finance cash requests:', error);
//       throw error;
//     }
//   },

//   processFinanceDecision: async (requestId, decision) => {
//     try {
//       const response = await api.put(`/cash-requests/${requestId}/finance`, decision);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error processing finance decision:', error);
//       throw error;
//     }
//   },

//   getFinanceJustifications: async (params = {}) => {
//     try {
//       const response = await api.get('/cash-requests/finance/justifications', { params });
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching finance justifications:', error);
//       throw error;
//     }
//   },

//   processFinanceJustificationDecision: async (requestId, decision) => {
//     try {
//       const response = await api.put(`/cash-requests/${requestId}/finance/justification`, decision);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error processing finance justification decision:', error);
//       throw error;
//     }
//   },

//   // Admin functions
//   getAllRequests: async (params = {}) => {
//     try {
//       const response = await api.get('/cash-requests/admin', { params });
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching all cash requests:', error);
//       throw error;
//     }
//   },

//   getAdminRequestDetails: async (requestId) => {
//     try {
//       const response = await api.get(`/cash-requests/admin/${requestId}`);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching admin request details:', error);
//       throw error;
//     }
//   },

//   // Justification functions
//   submitJustification: async (requestId, formData) => {
//     console.log('API: Submitting justification...');
//     console.log('FormData entries:');
    
//     // Debug FormData contents
//     for (let pair of formData.entries()) {
//       if (pair[1] instanceof File) {
//         console.log(`${pair[0]}: File - ${pair[1].name} (${pair[1].size} bytes)`);
//       } else {
//         console.log(`${pair[0]}:`, pair[1]);
//       }
//     }

//     const config = {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//       timeout: 60000,
//     };
    
//     try {
//       const response = await api.post(`/cash-requests/${requestId}/justification`, formData, config);
//       console.log('API: Justification submitted successfully:', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error submitting justification:', error);
      
//       if (error.response) {
//         console.error('Response status:', error.response.status);
//         console.error('Response data:', error.response.data);
//         console.error('Response headers:', error.response.headers);
//       }
      
//       throw error;
//     }
//   },

//   getRequestForJustification: async (requestId) => {
//     try {
//       const response = await api.get(`/cash-requests/employee/${requestId}/justify`);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching request for justification:', error);
//       throw error;
//     }
//   },

//   // Analytics and reporting
//   getStats: async (params = {}) => {
//     try {
//       const response = await api.get('/cash-requests/analytics/statistics', { params });
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching cash request stats:', error);
//       throw error;
//     }
//   },

//   getDashboardStats: async () => {
//     try {
//       const response = await api.get('/cash-requests/dashboard/stats');
//       return response.data;
//     } catch (error) {
//       console.error('API: Error fetching dashboard stats:', error);
//       throw error;
//     }
//   },

//   // Approval chain preview
//   getApprovalChainPreview: async (employeeName, department) => {
//     try {
//       const response = await api.post('/cash-requests/preview-approval-chain', {
//         employeeName,
//         department
//       });
//       return response.data;
//     } catch (error) {
//       console.error('API: Error getting approval chain preview:', error);
//       throw error;
//     }
//   },

//   // File download
//   downloadAttachment: async (requestId, fileName) => {
//     try {
//       const response = await api.get(`/cash-requests/${requestId}/attachment/${fileName}`, {
//         responseType: 'blob',
//       });
//       return response.data;
//     } catch (error) {
//       console.error('API: Error downloading attachment:', error);
//       throw error;
//     }
//   }
// };

// export default api;



