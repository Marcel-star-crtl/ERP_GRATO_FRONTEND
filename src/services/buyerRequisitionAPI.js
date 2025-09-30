const API_BASE_URL = process.env.REACT_APP_API_UR || 'http://localhost:5001/api';

// Utility function for making authenticated API requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    console.log('Making API request:', { url, method: config.method || 'GET', body: config.body });
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.error('API Error Response:', errorData);
      } catch (jsonError) {
        console.error('Could not parse error response as JSON');
      }
      
      // Handle different HTTP status codes
      switch (response.status) {
        case 401:
          throw new Error('Unauthorized - Please login again');
        case 403:
          throw new Error('Access forbidden - Insufficient permissions');
        case 404:
          throw new Error('Resource not found');
        case 400:
          throw new Error(errorMessage);
        case 500:
          throw new Error('Server error - Please try again later');
        default:
          throw new Error(errorMessage);
      }
    }

    const data = await response.json();
    console.log('API Response:', data);
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Buyer Purchase Requisition API Service
export const buyerRequisitionAPI = {

  /**
   * Download purchase order as PDF
   * @param {string} poId - Purchase order ID
   * @returns {Promise<Blob>} PDF file as blob
   */
   downloadPurchaseOrderPDF: async (poId) => {
    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/buyer/purchase-orders/${poId}/download-pdf`; // FIXED: Now uses correct base URL
      
      console.log('PDF Download URL:', url); 
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download PDF');
      }

      const blob = await response.blob();
      return {
        success: true,
        data: blob,
        filename: `PO_${poId}_${new Date().toISOString().split('T')[0]}.pdf`
      };
    } catch (error) {
      console.error('Download PDF error:', error);
      throw error;
    }
  },

  /**
   * Preview purchase order as PDF (inline)
   * @param {string} poId - Purchase order ID
   * @returns {Promise<Blob>} PDF file as blob
   */
  previewPurchaseOrderPDF: async (poId) => {
    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/buyer/purchase-orders/${poId}/preview-pdf`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to preview PDF');
      }

      const blob = await response.blob();
      return {
        success: true,
        data: blob,
        filename: `PO_${poId}_preview.pdf`
      };
    } catch (error) {
      console.error('Preview PDF error:', error);
      throw error;
    }
  },

  /**
   * Email purchase order PDF
   * @param {string} poId - Purchase order ID
   * @param {Object} emailData - Email configuration
   * @returns {Promise<Object>} Email result
   */
  emailPurchaseOrderPDF: async (poId, emailData) => {
    try {
      const url = `${API_BASE_URL}/buyer/purchase-orders/${poId}/email-pdf`;
      return await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(emailData),
      });
    } catch (error) {
      console.error('Email PDF error:', error);
      throw error;
    }
  },

  /**
   * Bulk download multiple purchase orders as ZIP
   * @param {Array} poIds - Array of purchase order IDs
   * @returns {Promise<Blob>} ZIP file as blob
   */
  bulkDownloadPurchaseOrders: async (poIds) => {
    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/buyer/purchase-orders/bulk-download`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ poIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create bulk download');
      }

      const blob = await response.blob();
      return {
        success: true,
        data: blob,
        filename: `Purchase_Orders_${new Date().toISOString().split('T')[0]}.zip`
      };
    } catch (error) {
      console.error('Bulk download error:', error);
      throw error;
    }
  },
  
  /**
   * Get all purchase requisitions assigned to the current buyer
   * @param {Object} filters 
   * @returns {Promise<Object>} 
   */
  getAssignedRequisitions: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const url = `${API_BASE_URL}/buyer/requisitions${queryParams.toString() ? `?${queryParams}` : ''}`;
      
      return await makeAuthenticatedRequest(url);
    } catch (error) {
      console.error('Error fetching assigned requisitions:', error);
      throw error;
    }
  },

  /**
   * Get detailed information for a specific requisition
   * @param {string} requisitionId - The requisition ID
   * @returns {Promise<Object>} Detailed requisition data
   */
  getRequisitionDetails: async (requisitionId) => {
    try {
      const url = `${API_BASE_URL}/buyer/requisitions/${requisitionId}`;
      return await makeAuthenticatedRequest(url);
    } catch (error) {
      console.error(`Error fetching requisition ${requisitionId}:`, error);
      throw error;
    }
  },

  /**
   * Get quotes for a specific requisition
   * @param {string} requisitionId - The requisition ID
   * @returns {Promise<Object>} Response with quotes
   */
  getQuotes: async (requisitionId) => {
    try {
      const url = `${API_BASE_URL}/buyer/requisitions/${requisitionId}/quotes`;
      return await makeAuthenticatedRequest(url);
    } catch (error) {
      console.error(`Error fetching quotes for requisition ${requisitionId}:`, error);
      throw error;
    }
  },

  /**
   * Get RFQ details including quotes
   * @param {string} requisitionId - The requisition ID
   * @returns {Promise<Object>} Response with RFQ and quotes data
   */
  getRFQDetails: async (requisitionId) => {
    try {
      const url = `${API_BASE_URL}/buyer/requisitions/${requisitionId}/rfq`;
      return await makeAuthenticatedRequest(url);
    } catch (error) {
      console.error(`Error fetching RFQ details for requisition ${requisitionId}:`, error);
      throw error;
    }
  },

  /**
   * Evaluate quotes for a requisition
   * @param {string} requisitionId - The requisition ID
   * @param {Object} evaluationData - Evaluation data
   * @returns {Promise<Object>} Response with evaluation result
   */
  evaluateQuotes: async (requisitionId, evaluationData) => {
    try {
      const url = `${API_BASE_URL}/buyer/requisitions/${requisitionId}/quotes/evaluate`;
      return await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(evaluationData),
      });
    } catch (error) {
      console.error(`Error evaluating quotes for requisition ${requisitionId}:`, error);
      throw error;
    }
  },

  /**
   * Select a quote as winner and create purchase order
   * @param {string} requisitionId - The requisition ID
   * @param {string} quoteId - The quote ID
   * @param {Object} selectionData - Selection data including reason and PO details
   * @returns {Promise<Object>} Response with selection result and PO creation
   */
  selectQuote: async (requisitionId, quoteId, selectionData) => {
    try {
      const url = `${API_BASE_URL}/buyer/requisitions/${requisitionId}/quotes/${quoteId}/select`;
      return await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          selectionReason: selectionData.selectionReason,
          createPurchaseOrder: selectionData.createPurchaseOrder !== false, 
          purchaseOrderDetails: {
            deliveryAddress: selectionData.deliveryAddress,
            deliveryDate: selectionData.deliveryDate,
            paymentTerms: selectionData.paymentTerms,
            specialInstructions: selectionData.specialInstructions,
            termsAndConditions: selectionData.termsAndConditions
          }
        }),
      });
    } catch (error) {
      console.error(`Error selecting quote ${quoteId}:`, error);
      throw error;
    }
  },

  /**
   * Reject a quote
   * @param {string} requisitionId - The requisition ID
   * @param {string} quoteId - The quote ID
   * @param {Object} rejectionData - Rejection data including reason
   * @returns {Promise<Object>} Response with rejection result
   */
  rejectQuote: async (requisitionId, quoteId, rejectionData) => {
    try {
      const url = `${API_BASE_URL}/buyer/requisitions/${requisitionId}/quotes/${quoteId}/reject`;
      return await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(rejectionData),
      });
    } catch (error) {
      console.error(`Error rejecting quote ${quoteId}:`, error);
      throw error;
    }
  },

  /**
   * Request clarification on a quote
   * @param {string} requisitionId - The requisition ID
   * @param {string} quoteId - The quote ID
   * @param {Object} clarificationRequest - Clarification request data
   * @returns {Promise<Object>} Response with clarification request result
   */
  requestQuoteClarification: async (requisitionId, quoteId, clarificationRequest) => {
    try {
      const url = `${API_BASE_URL}/buyer/requisitions/${requisitionId}/quotes/${quoteId}/clarify`;
      return await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(clarificationRequest),
      });
    } catch (error) {
      console.error(`Error requesting clarification for quote ${quoteId}:`, error);
      throw error;
    }
  },


/**
 * Legacy method - redirects to new getSuppliers method
 * Maintains compatibility with existing code
 */
 getSuppliersByCategory: async (category, filters = {}) => {
  return await buyerRequisitionAPI.getSuppliers({
    ...filters,
    category
  });
},


  /** 
  * Get suppliers from the Supplier database (not User database)
  * @param {Object} filters - Optional filters for search, category, etc.
  * @returns {Promise<Object>} List of approved suppliers
  */
  getSuppliers: async (filters = {}) => {
   try {
     const queryParams = new URLSearchParams();
     
     // Add filters to query parameters
     Object.entries(filters).forEach(([key, value]) => {
       if (value !== null && value !== undefined && value !== '') {
         queryParams.append(key, value);
       }
     });
 
     const url = `${API_BASE_URL}/buyer/suppliers${queryParams.toString() ? `?${queryParams}` : ''}`;
     
     console.log('Fetching suppliers from:', url);
     
     const response = await makeAuthenticatedRequest(url);
     
     if (response.success && response.data) {
       console.log(`Loaded ${response.data.length} suppliers`);
       return {
         success: true,
         data: response.data,
         pagination: response.pagination
       };
     } else {
       console.error('Failed to load suppliers:', response);
       return {
         success: false,
         message: response.message || 'Failed to fetch suppliers'
       };
     }
   } catch (error) {
     console.error('Error loading suppliers:', error);
     throw error;
   }
  },
 

  /**
 * Get specific supplier details
 * @param {string} supplierId - Supplier ID
 * @returns {Promise<Object>} Supplier details
 */
getSupplierDetails: async (supplierId) => {
  try {
    const url = `${API_BASE_URL}/buyer/suppliers/${supplierId}`;
    return await makeAuthenticatedRequest(url);
  } catch (error) {
    console.error(`Error fetching supplier ${supplierId}:`, error);
    throw error;
  }
},


/**
 * Get items from the Items database for PO creation
 * @param {Object} filters - Optional filters for search, category, etc.
 * @returns {Promise<Object>} List of active items
 */
 getItems: async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = `${API_BASE_URL}/buyer/items${queryParams.toString() ? `?${queryParams}` : ''}`;
    
    console.log('Fetching items from:', url);
    
    const response = await makeAuthenticatedRequest(url);
    
    if (response.success && response.data) {
      console.log(`Loaded ${response.data.length} items`);
      return {
        success: true,
        data: response.data
      };
    } else {
      console.error('Failed to load items:', response);
      return {
        success: false,
        message: response.message || 'Failed to fetch items'
      };
    }
  } catch (error) {
    console.error('Error loading items:', error);
    throw error;
  }
},


/**
 * Search items for autocomplete/lookup
 * @param {string} query - Search query
 * @param {number} limit - Maximum results to return
 * @returns {Promise<Object>} Search results
 */
 searchItems: async (query, limit = 10) => {
  try {
    if (!query || query.length < 2) {
      return {
        success: true,
        data: []
      };
    }

    const queryParams = new URLSearchParams({ q: query, limit });
    const url = `${API_BASE_URL}/buyer/items/search?${queryParams}`;
    
    const response = await makeAuthenticatedRequest(url);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data
      };
    } else {
      return {
        success: false,
        message: response.message || 'Failed to search items'
      };
    }
  } catch (error) {
    console.error('Error searching items:', error);
    throw error;
  }
},

/**
 * Get item categories for filtering
 * @returns {Promise<Object>} Available categories
 */
getItemCategories: async () => {
  try {
    const url = `${API_BASE_URL}/buyer/items/categories`;
    
    const response = await makeAuthenticatedRequest(url);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data
      };
    } else {
      return {
        success: false,
        message: response.message || 'Failed to fetch item categories'
      };
    }
  } catch (error) {
    console.error('Error loading item categories:', error);
    throw error;
  }
},


/**
 * Validate items for purchase order creation
 * @param {Array} items - Array of items to validate
 * @returns {Promise<Object>} Validation result
 */
 validatePOItems: async (items) => {
  try {
    const url = `${API_BASE_URL}/buyer/purchase-orders/validate-items`;
    
    const response = await makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
    
    if (response.success) {
      return {
        success: true,
        data: response.data
      };
    } else {
      return {
        success: false,
        message: response.message || 'Failed to validate items'
      };
    }
  } catch (error) {
    console.error('Error validating items:', error);
    throw error;
  }
},



  /**
   * Create and send RFQ to selected suppliers (supports both registered and external suppliers)
   * @param {string} requisitionId - The requisition ID
   * @param {Object} rfqData - RFQ data including suppliers, criteria, etc.
   * @returns {Promise<Object>} RFQ creation result
   */
  createAndSendRFQ: async (requisitionId, rfqData) => {
    try {
      console.log('Sending enhanced RFQ data:', { requisitionId, rfqData });
      
      const url = `${API_BASE_URL}/buyer/requisitions/${requisitionId}/rfq`;
      
      // Transform the supplier data from the frontend format
      const transformedData = {
        selectedSuppliers: rfqData.selectedSuppliers || [],
        externalSupplierEmails: rfqData.externalSupplierEmails || [],
        expectedDeliveryDate: rfqData.expectedDeliveryDate,
        quotationDeadline: rfqData.quotationDeadline,
        paymentTerms: rfqData.paymentTerms,
        deliveryLocation: rfqData.deliveryLocation,
        specialRequirements: rfqData.specialRequirements,
        evaluationCriteria: rfqData.evaluationCriteria
      };
      
      // Validate that we have at least one supplier
      const hasRegistered = transformedData.selectedSuppliers && transformedData.selectedSuppliers.length > 0;
      const hasExternal = transformedData.externalSupplierEmails && transformedData.externalSupplierEmails.length > 0;
      
      if (!hasRegistered && !hasExternal) {
        throw new Error('At least one registered supplier or external supplier email is required');
      }
      
      // Ensure dates are properly formatted
      const formattedData = {
        ...transformedData,
        expectedDeliveryDate: transformedData.expectedDeliveryDate ? 
          (typeof transformedData.expectedDeliveryDate === 'string' ? 
            transformedData.expectedDeliveryDate : 
            transformedData.expectedDeliveryDate.toISOString()) : null,
        quotationDeadline: transformedData.quotationDeadline ? 
          (typeof transformedData.quotationDeadline === 'string' ? 
            transformedData.quotationDeadline : 
            transformedData.quotationDeadline.toISOString()) : null
      };
      
      console.log('Final transformed RFQ data:', formattedData);
      
      return await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(formattedData),
      });
    } catch (error) {
      console.error(`Error creating RFQ for requisition ${requisitionId}:`, error);
      throw error;
    }
  },

  /**
   * Send reminder to suppliers about pending quotes
   * @param {string} requisitionId - The requisition ID
   * @param {Object} reminderData - Reminder message and options
   * @returns {Promise<Object>} Reminder result
   */
  sendQuoteReminder: async (requisitionId, reminderData = {}) => {
    try {
      const url = `${API_BASE_URL}/buyer/requisitions/${requisitionId}/rfq/remind`;
      return await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(reminderData),
      });
    } catch (error) {
      console.error(`Error sending quote reminder for requisition ${requisitionId}:`, error);
      throw error;
    }
  },

  /**
   * Extend RFQ deadline
   * @param {string} requisitionId - The requisition ID
   * @param {Object} extensionData - New deadline and reason
   * @returns {Promise<Object>} Extension result
   */
  extendRFQDeadline: async (requisitionId, extensionData) => {
    try {
      const url = `${API_BASE_URL}/buyer/requisitions/${requisitionId}/rfq/extend-deadline`;
      return await makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(extensionData),
      });
    } catch (error) {
      console.error(`Error extending RFQ deadline for requisition ${requisitionId}:`, error);
      throw error;
    }
  },

  
  /**
   * Get all purchase orders for the buyer
   * @param {Object} filters - Optional filters (status, search, etc.)
   * @returns {Promise<Object>} Response with purchase orders
   */
  getPurchaseOrders: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const url = `${API_BASE_URL}/buyer/purchase-orders${queryParams.toString() ? `?${queryParams}` : ''}`;
      return await makeAuthenticatedRequest(url);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  },

  /**
   * Get purchase order details
   * @param {string} poId - Purchase order ID
   * @returns {Promise<Object>} Purchase order details
   */
  getPurchaseOrderDetails: async (poId) => {
    try {
      const url = `${API_BASE_URL}/buyer/purchase-orders/${poId}`;
      return await makeAuthenticatedRequest(url);
    } catch (error) {
      console.error(`Error fetching purchase order ${poId}:`, error);
      throw error;
    }
  },

  /**
   * Update purchase order
   * @param {string} poId - Purchase order ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated purchase order
   */
  updatePurchaseOrder: async (poId, updateData) => {
    try {
      const url = `${API_BASE_URL}/buyer/purchase-orders/${poId}`;
      return await makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    } catch (error) {
      console.error(`Error updating purchase order ${poId}:`, error);
      throw error;
    }
  },

  /**
   * Send purchase order to supplier
   * @param {string} poId - Purchase order ID
   * @param {Object} messageData - Optional message to include
   * @returns {Promise<Object>} Send result
   */
  sendPurchaseOrderToSupplier: async (poId, messageData = {}) => {
    try {
      const url = `${API_BASE_URL}/buyer/purchase-orders/${poId}/send`;
      return await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(messageData),
      });
    } catch (error) {
      console.error(`Error sending purchase order ${poId}:`, error);
      throw error;
    }
  },

  /**
   * Cancel purchase order
   * @param {string} poId - Purchase order ID
   * @param {Object} cancellationData - Cancellation reason and details
   * @returns {Promise<Object>} Cancellation result
   */
  cancelPurchaseOrder: async (poId, cancellationData) => {
    try {
      const url = `${API_BASE_URL}/buyer/purchase-orders/${poId}/cancel`;
      return await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(cancellationData),
      });
    } catch (error) {
      console.error(`Error cancelling purchase order ${poId}:`, error);
      throw error;
    }
  },


  /**
   * Get buyer performance dashboard data
   * @param {Object} filters - Date range and other filters
   * @returns {Promise<Object>} Dashboard analytics data
   */
  getBuyerDashboard: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters);
      const url = `${API_BASE_URL}/buyer/dashboard?${queryParams}`;
      return await makeAuthenticatedRequest(url);
    } catch (error) {
      console.error('Error fetching buyer dashboard:', error);
      throw error;
    }
  },

  /**
   * Get procurement analytics
   * @param {Object} filters - Analysis parameters
   * @returns {Promise<Object>} Analytics data
   */
  getProcurementAnalytics: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters);
      const url = `${API_BASE_URL}/buyer/analytics/procurement?${queryParams}`;
      return await makeAuthenticatedRequest(url);
    } catch (error) {
      console.error('Error fetching procurement analytics:', error);
      throw error;
    }
  },

  /**
   * Export procurement report
   * @param {Object} reportParams - Report parameters
   * @returns {Promise<Object>} Export result
   */
  exportProcurementReport: async (reportParams) => {
    try {
      const url = `${API_BASE_URL}/buyer/reports/procurement/export`;
      return await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(reportParams),
      });
    } catch (error) {
      console.error('Error exporting procurement report:', error);
      throw error;
    }
  },

  
  /**
   * Get external quote by invitation token
   * @param {string} token - Invitation token
   * @returns {Promise<Object>} RFQ details for external supplier
   */
  getExternalQuote: async (token) => {
    try {
      const url = `${API_BASE_URL}/external-quote/${token}/rfq`;
      // Note: External quotes don't require authentication
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching external quote for token ${token}:`, error);
      throw error;
    }
  },

  /**
   * Submit external quote
   * @param {string} token - Invitation token
   * @param {Object} quoteData - Quote submission data
   * @returns {Promise<Object>} Submission result
   */
  submitExternalQuote: async (token, quoteData) => {
    try {
      const url = `${API_BASE_URL}/external-quote/${token}/submit`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quoteData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error submitting external quote:`, error);
      throw error;
    }
  },

  /**
   * Get external quote status
   * @param {string} token - Invitation token
   * @param {string} quoteId - Quote ID
   * @returns {Promise<Object>} Quote status
   */
  getExternalQuoteStatus: async (token, quoteId) => {
    try {
      const url = `${API_BASE_URL}/external-quote/${token}/status/${quoteId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching external quote status:`, error);
      throw error;
    }
  },

  /**
   * Update external quote
   * @param {string} token - Invitation token
   * @param {string} quoteId - Quote ID
   * @param {Object} updateData - Updated quote data
   * @returns {Promise<Object>} Update result
   */
  updateExternalQuote: async (token, quoteId, updateData) => {
    try {
      const url = `${API_BASE_URL}/external-quote/${token}/quote/${quoteId}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating external quote:`, error);
      throw error;
    }
  },

  /**
   * Validate external invitation token
   * @param {string} token - Invitation token
   * @returns {Promise<Object>} Token validation result
   */
  validateExternalToken: async (token) => {
    try {
      const url = `${API_BASE_URL}/external-quote/${token}/validate`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error validating external token:`, error);
      throw error;
    }
  },

  /**
   * Decline external invitation
   * @param {string} token - Invitation token
   * @param {Object} declineData - Decline reason
   * @returns {Promise<Object>} Decline result
   */
  declineExternalInvitation: async (token, declineData) => {
    try {
      const url = `${API_BASE_URL}/external-quote/${token}/decline`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(declineData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error declining external invitation:`, error);
      throw error;
    }
  },


  /**
 * Enhanced validation for RFQ data with supplier database integration
 */
validateRFQData: (rfqData) => {
  const errors = [];
  const warnings = [];

  // Check if we have any suppliers
  const hasRegistered = rfqData.selectedSuppliers && rfqData.selectedSuppliers.length > 0;
  const hasExternal = rfqData.externalSupplierEmails && rfqData.externalSupplierEmails.length > 0;
  
  if (!hasRegistered && !hasExternal) {
    errors.push('At least one registered supplier or external supplier email must be provided');
  }

  // Required fields validation
  if (!rfqData.expectedDeliveryDate) {
    errors.push('Expected delivery date is required');
  }

  if (!rfqData.paymentTerms) {
    errors.push('Payment terms must be specified');
  }

  if (!rfqData.quotationDeadline) {
    errors.push('Quotation deadline is required');
  }

  // Validate external supplier emails
  if (hasExternal) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    rfqData.externalSupplierEmails.forEach((supplier, index) => {
      if (!supplier.email) {
        errors.push(`External supplier ${index + 1}: Email is required`);
      } else if (!emailRegex.test(supplier.email)) {
        errors.push(`External supplier ${index + 1}: Invalid email format`);
      }
      
      if (!supplier.companyName) {
        errors.push(`External supplier ${index + 1}: Company name is required`);
      }
    });
  }

  // Evaluation criteria validation
  const criteria = rfqData.evaluationCriteria;
  if (criteria) {
    const totalWeight = (criteria.quality || 0) + (criteria.cost || 0) + (criteria.delivery || 0);
    if (totalWeight !== 100) {
      errors.push('Evaluation criteria weights must total 100%');
    }
  }

  // Date validations
  if (rfqData.expectedDeliveryDate && rfqData.quotationDeadline) {
    const deliveryDate = new Date(rfqData.expectedDeliveryDate);
    const quoteDeadline = new Date(rfqData.quotationDeadline);
    
    if (deliveryDate <= quoteDeadline) {
      warnings.push('Expected delivery date should be after quotation deadline');
    }
  }

  // Supplier count recommendations
  const totalSuppliers = (rfqData.selectedSuppliers?.length || 0) + (rfqData.externalSupplierEmails?.length || 0);
  if (totalSuppliers < 3) {
    warnings.push('Consider inviting at least 3 suppliers for better competition');
  }

  // External supplier warnings
  if (hasExternal && !hasRegistered) {
    warnings.push('Consider including registered suppliers for faster response times');
  }

  if (hasExternal && rfqData.externalSupplierEmails.length > 5) {
    warnings.push('Large number of external suppliers may slow down the process');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalSuppliers: hasRegistered ? rfqData.selectedSuppliers.length : 0,
    totalExternalSuppliers: hasExternal ? rfqData.externalSupplierEmails.length : 0,
    hasRegisteredSuppliers: hasRegistered,
    hasExternalSuppliers: hasExternal
  };
},


  /**
 * Enhanced PO validation with items database integration
 */
validatePOData: (poData) => {
  const errors = [];
  const warnings = [];

  // Required fields validation
  if (!poData.supplierDetails || !poData.supplierDetails.id) {
    errors.push('Supplier selection is required');
  }

  if (!poData.items || !Array.isArray(poData.items) || poData.items.length === 0) {
    errors.push('At least one item is required');
  }

  if (!poData.deliveryAddress) {
    errors.push('Delivery address is required');
  }

  if (!poData.expectedDeliveryDate) {
    errors.push('Expected delivery date is required');
  }

  if (!poData.paymentTerms) {
    errors.push('Payment terms must be specified');
  }

  // Items validation
  if (poData.items && Array.isArray(poData.items)) {
    poData.items.forEach((item, index) => {
      if (!item.description) {
        errors.push(`Item ${index + 1}: Description is required`);
      }
      
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Valid quantity is required`);
      }
      
      if (!item.unitPrice || item.unitPrice <= 0) {
        errors.push(`Item ${index + 1}: Valid unit price is required`);
      }
      
      // Warning for items without database reference
      if (!item.itemId) {
        warnings.push(`Item ${index + 1}: Not linked to items database - consider adding to catalog for future use`);
      }
    });
  }

  // Date validations
  if (poData.expectedDeliveryDate) {
    const deliveryDate = new Date(poData.expectedDeliveryDate);
    const today = new Date();
    
    if (deliveryDate <= today) {
      errors.push('Expected delivery date must be in the future');
    }
    
    const daysDiff = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
    if (daysDiff < 3) {
      warnings.push('Very short delivery timeline - confirm with supplier');
    }
  }

  // Amount validations
  if (poData.items && Array.isArray(poData.items)) {
    const calculatedTotal = poData.items.reduce((sum, item) => 
      sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0
    );
    
    if (poData.totalAmount && Math.abs(poData.totalAmount - calculatedTotal) > 0.01) {
      errors.push('Total amount does not match sum of item totals');
    }
    
    if (calculatedTotal === 0) {
      errors.push('Purchase order total cannot be zero');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    itemCount: poData.items?.length || 0,
    hasItemsFromDatabase: poData.items?.some(item => item.itemId) || false
  };
},


  /**
 * Create purchase order with proper supplier and items validation
 * @param {Object} poData - Purchase order data
 * @returns {Promise<Object>} Created purchase order
 */
createPurchaseOrder: async (poData) => {
  try {
    const url = `${API_BASE_URL}/buyer/purchase-orders`;
    
    console.log('Creating PO with data:', {
      supplierType: poData.supplierDetails?.isExternal ? 'External' : 'Registered',
      supplierId: poData.supplierDetails?.id,
      supplierName: poData.supplierDetails?.name,
      supplierEmail: poData.supplierDetails?.email,
      itemsCount: poData.items?.length,
      totalAmount: poData.totalAmount
    });
    
    console.log('Full PO Data being sent:', JSON.stringify(poData, null, 2));
    
    // Enhanced validation before sending
    if (!poData.supplierDetails?.name || !poData.supplierDetails?.email) {
      throw new Error('Supplier name and email are required');
    }
    
    // For external suppliers, we only need name and email
    // For registered suppliers, we need the ID
    if (!poData.supplierDetails.isExternal && !poData.supplierDetails?.id) {
      throw new Error('Registered supplier must have an ID');
    }
    
    if (!poData.items || poData.items.length === 0) {
      throw new Error('At least one item is required');
    }
    
    if (!poData.deliveryAddress) {
      throw new Error('Delivery address is required');
    }
    
    if (!poData.expectedDeliveryDate) {
      throw new Error('Expected delivery date is required');
    }
    
    if (!poData.paymentTerms) {
      throw new Error('Payment terms are required');
    }
    
    // Format items to ensure totalPrice is calculated
    const formattedItems = poData.items.map(item => ({
      ...item,
      totalPrice: item.quantity * item.unitPrice,
      // Include itemId if it exists for database items
      ...(item.itemId && { itemId: item.itemId })
    }));
    
    const formattedData = {
      ...poData,
      items: formattedItems,
      totalAmount: formattedItems.reduce((sum, item) => sum + item.totalPrice, 0)
    };
    
    const response = await makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify(formattedData),
    });
    
    if (response.success) {
      console.log('PO created successfully:', response.data?.purchaseOrder?.poNumber);
      return response;
    } else {
      throw new Error(response.message || 'Failed to create purchase order');
    }
  } catch (error) {
    console.error('Error creating PO:', error);
    throw error;
  }
},

  /**
   * Get budget codes available for purchase orders
   * @returns {Promise<Object>} Budget codes response
   */
  getBudgetCodes: async () => {
    try {
      const url = `${API_BASE_URL}/budget-codes/available`;
      const response = await makeAuthenticatedRequest(url);
      const data = await response.json();
      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('Error fetching budget codes:', error);
      return { success: false, message: error.message || 'Failed to fetch budget codes' };
    }
  },

  /**
   * Update budget code balance after PO creation
   * @param {string} budgetCodeId - Budget code ID
   * @param {number} amount - Amount to deduct
   * @returns {Promise<Object>} Update response
   */
  updateBudgetCodeBalance: async (budgetCodeId, amount) => {
    try {
      const url = `${API_BASE_URL}/budget-codes/${budgetCodeId}/allocate`;
      const response = await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          amount: amount,
          description: 'Purchase Order allocation'
        })
      });
      const data = await response.json();
      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('Error updating budget code balance:', error);
      return { success: false, message: error.message || 'Failed to update budget code balance' };
    }
  },

  /**
   * Format currency for display
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (default: XAF)
   * @returns {string} Formatted currency string
   */
  formatCurrency: (amount, currency = 'XAF') => {
    if (!amount || isNaN(amount)) return `${currency} 0`;
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  /**
   * Calculate time remaining until deadline
   * @param {string|Date} deadline - Deadline date
   * @returns {Object} Time remaining breakdown
   */
  calculateTimeRemaining: (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return {
        expired: true,
        days: 0,
        hours: 0,
        minutes: 0,
        total: 0
      };
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      expired: false,
      days,
      hours,
      minutes,
      total: timeDiff,
      isUrgent: days <= 1
    };
  }
};

export default buyerRequisitionAPI;




