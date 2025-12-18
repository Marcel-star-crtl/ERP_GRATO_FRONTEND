import api from './api';

class SupplierApiService {
  async register(supplierData) {
    try {
      console.log('API Service: Registering supplier with data:', supplierData);
      
      const requiredFields = ['fullName', 'email', 'password', 'companyName', 'contactName', 'phoneNumber', 'address', 'supplierType'];
      const missingFields = requiredFields.filter(field => !supplierData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Ensure supplierType is valid
      const validSupplierTypes = ['goods', 'services', 'both', 'contractor'];
      if (!validSupplierTypes.includes(supplierData.supplierType)) {
        throw new Error(`Invalid supplier type. Must be one of: ${validSupplierTypes.join(', ')}`);
      }

      // : Send data in the exact format expected by backend
      const registrationData = {
        // Basic user information
        fullName: supplierData.fullName.trim(),
        email: supplierData.email.toLowerCase().trim(),
        password: supplierData.password,
        
        // Supplier details - backend will map these to supplierDetails object
        companyName: supplierData.companyName.trim(),
        contactName: supplierData.contactName.trim(),
        phoneNumber: supplierData.phoneNumber.trim(),
        address: supplierData.address.trim(), 
        supplierType: supplierData.supplierType, 
        
        // Optional fields
        businessRegistrationNumber: supplierData.businessRegistrationNumber?.trim(),
        taxIdNumber: supplierData.taxIdNumber?.trim(),
        website: supplierData.website?.trim(),
        businessDescription: supplierData.businessDescription?.trim(),
        servicesOffered: supplierData.servicesOffered || [],
        establishedYear: supplierData.establishedYear ? parseInt(supplierData.establishedYear) : undefined,
        employeeCount: supplierData.employeeCount,
        
        // Bank details if provided
        bankDetails: supplierData.bankDetails
      };

      console.log('API Service: Sending registration data:', registrationData);

      const response = await api.post('/suppliers/register', registrationData);
      
      console.log('API Service: Registration response:', response.data);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
          token: response.data.token,
          nextSteps: response.data.nextSteps
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Registration failed'
      };
    } catch (error) {
      console.error('Registration API error:', error);
      
      // Handle specific error responses
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        
        // Handle validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          throw new Error(errorData.errors.join(', '));
        }
        
        // Handle single error message
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        
        // Handle detailed validation errors
        if (errorData.details) {
          const errorMessages = Object.values(errorData.details)
            .map(detail => detail.message || detail.toString())
            .join(', ');
          throw new Error(errorMessages);
        }
      }
      
      // Handle network errors
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      throw new Error(error.message || 'Registration failed. Please try again.');
    }
  }

  // Login supplier
  async login(credentials) {
    try {
      console.log('API Service: Logging in supplier');
      
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      const response = await api.post('/suppliers/login', {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password
      });
      
      if (response.data && response.data.success) {
        // Store token if provided
        if (response.data.token) {
          localStorage.setItem('supplierToken', response.data.token);
          // Update api defaults with new token
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        }
        
        return {
          success: true,
          data: response.data.data,
          token: response.data.token,
          message: response.data.message
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Login failed'
      };
    } catch (error) {
      console.error('Login API error:', error);
      throw this.handleError(error);
    }
  }

  // : Update profile with proper data handling
  async updateProfile(profileData) {
    try {
      console.log('API Service: Updating profile with data:', profileData);

      // : Structure data properly for profile update
      const updateData = {
        // Basic fields that can be updated at root level
        fullName: profileData.fullName?.trim(),
        phone: profileData.phoneNumber?.trim(),
        
        // Supplier details - send as nested object for backend to handle
        supplierDetails: {
          companyName: profileData.companyName?.trim(),
          contactName: profileData.contactName?.trim(),
          phoneNumber: profileData.phoneNumber?.trim(),
          address: profileData.address?.trim(), // : String format
          website: profileData.website?.trim(),
          businessDescription: profileData.businessDescription?.trim(),
          servicesOffered: profileData.servicesOffered || [],
          businessRegistrationNumber: profileData.businessRegistrationNumber?.trim(),
          taxIdNumber: profileData.taxIdNumber?.trim(),
          establishedYear: profileData.establishedYear ? parseInt(profileData.establishedYear) : undefined,
          employeeCount: profileData.employeeCount
        },
        
        // Bank details if provided
        bankDetails: profileData.bankDetails ? {
          bankName: profileData.bankDetails.bankName?.trim(),
          accountNumber: profileData.bankDetails.accountNumber?.trim(),
          accountName: profileData.bankDetails.accountName?.trim(),
          swiftCode: profileData.bankDetails.swiftCode?.trim(),
          routingNumber: profileData.bankDetails.routingNumber?.trim()
        } : undefined
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        } else if (typeof updateData[key] === 'object' && updateData[key] !== null) {
          Object.keys(updateData[key]).forEach(subKey => {
            if (updateData[key][subKey] === undefined) {
              delete updateData[key][subKey];
            }
          });
          // Remove empty objects
          if (Object.keys(updateData[key]).length === 0) {
            delete updateData[key];
          }
        }
      });

      console.log('API Service: Sending update data:', updateData);

      const response = await api.put('/suppliers/profile', updateData);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to update profile'
      };
    } catch (error) {
      console.error('Update profile API error:', error);
      throw this.handleError(error);
    }
  }

  // Get supplier profile
  async getProfile() {
    try {
      const response = await api.get('/suppliers/profile');
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to fetch profile'
      };
    } catch (error) {
      console.error('Get profile API error:', error);
      throw this.handleError(error);
    }
  }

  async submitInvoice(formData) {
    try {
      console.log('API Service: Submitting invoice with FormData');
      
      // Log FormData contents for debugging
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}:`, {
            name: value.name,
            size: value.size,
            type: value.type
          });
        } else {
          console.log(`${key}:`, value);
        }
      }
  
      const response = await api.post('/suppliers/invoices', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000 
      });
  
      console.log('Submit invoice response:', response.data);
  
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      }
  
      return {
        success: false,
        message: response.data.message || 'Failed to submit invoice'
      };
  
    } catch (error) {
      console.error('submitInvoice error:', error);
      throw this.handleError(error);
    }
  }
  
  async getInvoices(params = {}) {
    try {
      console.log('API Service: Getting invoices with params:', params);
      
      const response = await api.get('/suppliers/invoices', { params });
      
      console.log('Get invoices response:', response.data);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          pagination: response.data.pagination
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to fetch invoices'
      };
    } catch (error) {
      console.error('getInvoices error:', error);
      throw this.handleError(error);
    }
  }

  // Get all suppliers (admin function)
  // async getAllSuppliers(params = {}) {
  //   try {
  //     console.log('API Service: Getting all suppliers with params:', params);
      
  //     const response = await api.get('/suppliers/admin/all', { params });
      
  //     console.log('API Response:', response.data);
      
  //     if (response.data && response.data.success) {
  //       return {
  //         success: true,
  //         data: response.data.data,
  //         pagination: response.data.pagination
  //       };
  //     }
      
  //     return {
  //       success: false,
  //       message: response.data.message || 'Failed to fetch suppliers'
  //     };
  //   } catch (error) {
  //     console.error('Get all suppliers API error:', error);
  //     throw this.handleError(error);
  //   }
  // }


  async getAllSuppliers(params = {}) {
    try {
      console.log('🔍 Fetching suppliers with params:', params);
      
      // Verify token exists
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      // Make API call with proper endpoint
      const response = await api.get('/suppliers/admin/all', { 
        params,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📦 Supplier API Response:', response.data);
      
      // Validate response structure
      if (response.data && response.data.success) {
        const suppliers = response.data.data || [];
        console.log(`✅ Successfully fetched ${suppliers.length} suppliers`);
        
        return {
          success: true,
          data: suppliers,
          pagination: response.data.pagination
        };
      }
      
      // Handle unsuccessful response
      console.warn('⚠️ API returned unsuccessful response:', response.data);
      return {
        success: false,
        data: [],
        message: response.data.message || 'Failed to fetch suppliers'
      };
      
    } catch (error) {
      console.error('❌ Error fetching suppliers:', error);
      
      // Handle specific error cases
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 401) {
          localStorage.removeItem('token');
          throw new Error('Session expired. Please login again.');
        }
        
        if (status === 403) {
          throw new Error('Access denied. You do not have permission to view suppliers.');
        }
        
        if (status === 404) {
          throw new Error('Supplier endpoint not found. Please contact support.');
        }
        
        throw new Error(data.message || `Failed to fetch suppliers (Status: ${status})`);
      }
      
      if (error.request) {
        throw new Error('Network error. Please check your connection.');
      }
      
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Get all onboarding applications (admin function)
  async getAllOnboardingApplications(params = {}) {
    try {
      console.log('API Service: Getting all onboarding applications with params:', params);
      
      const response = await api.get('/supplier-onboarding/onboarding/applications', { params });
      
      console.log('API Response:', response.data);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          pagination: response.data.pagination
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to fetch onboarding applications'
      };
    } catch (error) {
      console.error('Get all onboarding applications API error:', error);
      throw this.handleError(error);
    }
  }

  // Update supplier status (admin function)
  async updateSupplierStatus(supplierId, statusData) {
    try {
      console.log('API Service: Updating supplier status:', supplierId, statusData);

      const response = await api.put(`/suppliers/admin/${supplierId}/status`, statusData);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to update supplier status'
      };
    } catch (error) {
      console.error('Update supplier status API error:', error);
      throw this.handleError(error);
    }
  }


  async getRfqRequests(params = {}) {
    try {
      console.log('API Service: Getting RFQ requests with params:', params);
      
      const response = await api.get('/suppliers/rfq-requests', { params });
      
      console.log('API Response:', response.data);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          pagination: response.data.pagination
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to fetch RFQ requests'
      };
    } catch (error) {
      console.error('getRfqRequests error:', error);
      throw this.handleError(error);
    }
  }

  async getRfqById(rfqId) {
    try {
      console.log('API Service: Getting RFQ details for ID:', rfqId);
      
      const response = await api.get(`/suppliers/rfq-requests/${rfqId}`);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to fetch RFQ details'
      };
    } catch (error) {
      console.error('getRfqById error:', error);
      throw this.handleError(error);
    }
  }

  async submitQuote(rfqId, quoteData) {
    try {
      console.log('API Service: Submitting quote for RFQ:', rfqId);
      console.log('Quote data:', quoteData);

      // Create FormData for file uploads and regular data
      const formData = new FormData();

      // Add basic quote data
      formData.append('totalAmount', quoteData.totalAmount);
      formData.append('validityPeriod', quoteData.validityPeriod || 30);
      formData.append('deliveryTerms', quoteData.deliveryTerms || 'Standard delivery');
      formData.append('paymentTerms', quoteData.paymentTerms || '30 days');

      if (quoteData.additionalNotes) {
        formData.append('additionalNotes', quoteData.additionalNotes);
      }

      if (quoteData.warranty) {
        formData.append('warranty', quoteData.warranty);
      }

      if (quoteData.deliveryTime) {
        formData.append('deliveryTime', quoteData.deliveryTime);
      }

      // Add items as JSON string - ensure proper structure
      const processedItems = quoteData.items.map(item => ({
        itemId: item.itemId || item.id || item._id,
        id: item.itemId || item.id || item._id,
        _id: item.itemId || item.id || item._id,
        description: item.description,
        quantity: item.quantity,
        quotedPrice: parseFloat(item.quotedPrice),
        totalPrice: parseFloat(item.totalPrice),
        brand: item.brand || '',
        model: item.model || '',
        warranty: item.warranty || '',
        deliveryTime: item.deliveryTime || '',
        specifications: item.specifications || '',
        partNumber: item.partNumber || '',
        availability: item.availability || 'Available'
      }));

      formData.append('items', JSON.stringify(processedItems));
      console.log('Processed items:', processedItems);

      // Add quote-level documents if present
      if (quoteData.quoteDocuments && quoteData.quoteDocuments.length > 0) {
        quoteData.quoteDocuments.forEach(file => {
          if (file.originFileObj) {
            formData.append('quoteDocuments', file.originFileObj);
          }
        });
      }

      // Add technical specifications if present
      if (quoteData.technicalSpecs && quoteData.technicalSpecs.length > 0) {
        quoteData.technicalSpecs.forEach(file => {
          if (file.originFileObj) {
            formData.append('technicalSpecs', file.originFileObj);
          }
        });
      }

      // Add certificates if present
      if (quoteData.certificates && quoteData.certificates.length > 0) {
        quoteData.certificates.forEach(file => {
          if (file.originFileObj) {
            formData.append('certificates', file.originFileObj);
          }
        });
      }

      console.log('Submitting quote to endpoint:', `/suppliers/rfq-requests/${rfqId}/submit-quote`);

      const response = await api.post(
        `/suppliers/rfq-requests/${rfqId}/submit-quote`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000 
        }
      );

      console.log('Submit quote response:', response.data);

      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      }

      return {
        success: false,
        message: response.data.message || 'Failed to submit quote'
      };

    } catch (error) {
      console.error('submitQuote error:', error);
      throw this.handleError(error);
    }
  }

  async getQuotes(params = {}) {
    try {
      const response = await api.get('/suppliers/quotes', { params });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          pagination: response.data.pagination
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to fetch quotes'
      };
    } catch (error) {
      console.error('getQuotes error:', error);
      throw this.handleError(error);
    }
  }

  async getDashboardData() {
    try {
      const response = await api.get('/suppliers/dashboard');
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to fetch dashboard data'
      };
    } catch (error) {
      console.error('getDashboardData error:', error);
      throw this.handleError(error);
    }
  }

  handleError(error) {
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 400:
          // Bad request - validation errors
          if (data.errors && Array.isArray(data.errors)) {
            throw new Error(data.errors.join(', '));
          }
          if (data.details) {
            const errorMessages = Object.values(data.details)
              .map(detail => detail.message || detail.toString())
              .join(', ');
            throw new Error(errorMessages);
          }
          throw new Error(data.message || 'Invalid request data');

        case 401:
          // Unauthorized - clear tokens and redirect
          localStorage.removeItem('supplierToken');
          delete api.defaults.headers.common['Authorization'];
          
          // Only redirect if we're in a browser environment
          if (typeof window !== 'undefined') {
            window.location.href = '/supplier/login';
          }
          
          throw new Error('Session expired. Please log in again.');

        case 403:
          throw new Error(data.message || 'Access denied. Please contact administrator.');

        case 404:
          throw new Error(data.message || 'Resource not found.');

        case 422:
          // Validation errors
          if (data.errors) {
            const errorMessages = Object.values(data.errors).flat().join(', ');
            throw new Error(errorMessages);
          }
          throw new Error(data.message || 'Validation error.');

        case 429:
          throw new Error('Too many requests. Please try again later.');

        case 500:
          throw new Error('Server error. Please try again later or contact support.');

        default:
          throw new Error(data.message || `Request failed with status ${status}`);
      }
    } else if (error.request) {
      // Request made but no response received
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred.');
    }
  }

  async submitOnboarding(formData) {
    try {
      console.log('API Service: Submitting onboarding application');
      const response = await api.post('/supplier-onboarding/onboarding/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }

      return {
        success: false,
        message: response.data.message || 'Onboarding submission failed',
      };
    } catch (error) {
      console.error('Onboarding submission API error:', error);
      throw this.handleError(error);
    }
  }

  async updateApplicationStatus(applicationId, statusData) {
    try {
      console.log('API Service: Updating application status:', applicationId, statusData);
      const response = await api.put(`/supplier-onboarding/onboarding/applications/${applicationId}/status`, statusData);

      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }

      return {
        success: false,
        message: response.data.message || 'Failed to update application status',
      };
    } catch (error) {
      console.error('Update application status API error:', error);
      throw this.handleError(error);
    }
  }

  constructor() {
    // Set up request interceptor to add auth token
    api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('supplierToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Set up response interceptor for global error handling
    api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle common errors globally
        if (error.response?.status === 401) {
          localStorage.removeItem('supplierToken');
          delete api.defaults.headers.common['Authorization'];
          
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/supplier/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
}

// Export singleton instance
const supplierApiService = new SupplierApiService();
export default supplierApiService;



