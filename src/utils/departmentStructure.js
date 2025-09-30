export const DEPARTMENT_STRUCTURE = {
    'Technical': {
        name: 'Technical',
        head: 'Mr. Didier Oyong',
        headEmail: 'didier.oyong@gratoengineering.com',
        positions: {
            'HSE Coordinator': {
                name: 'Mr. Ovo Becheni',
                email: 'bechem.mbu@gratoglobal.com',
                supervisor: 'Technical Director', 
                department: 'Technical'
            },
            'Head of Refurbishment': {
                name: 'Mr. Yerla Ivo',
                email: 'verla.ivo@gratoengineering.com',
                supervisor: 'Technical Director',
                department: 'Technical'
            },
            'Project Manager': {
                name: 'Mr. Joel Wamba',
                email: 'joel@gratoengineering.com',
                supervisor: 'Technical Director',
                department: 'Technical'
            },
            'Operations Manager': {
                name: 'Mr. Pascal Assam',
                email: 'pascal.rodrique@gratoglobal.com',
                supervisor: 'Technical Director',
                department: 'Technical'
            },
            'Diesel Coordinator': {
                name: 'Mr. Kevin Minka',
                email: 'minka.kevin@gratoglobal.com',
                supervisor: 'Technical Director',
                department: 'Technical'
            },
            'Data Collector': {
                name: 'Mr. Bomba Yvone',
                email: 'bemba.essack@gratoglobal.com',
                supervisor: 'Operations Manager',
                department: 'Technical'
            },
            'NOC Coordinator': {
                name: 'Mr. Rodrigue Nono',
                email: 'rodrigue.nono@gratoglobal.com',
                supervisor: 'Diesel Coordinator',
                department: 'Technical'
            },
            'Site Supervisor': {
                name: 'Site Supervisors', 
                email: 'site.supervisors@gratoengineering.com', 
                supervisor: 'Project Manager',
                department: 'Technical'
            },
            'Field Technician': { 
                name: 'Field Technicians', 
                email: 'field.technicians@gratoengineering.com', 
                supervisor: 'Site Supervisor', 
                department: 'Technical'
            },
            'NOC Operator': { 
                name: 'NOC Operators', 
                email: 'noc.operators@gratoengineering.com', 
                supervisor: 'NOC Coordinator',
                department: 'Technical'
            }
        }
    },
  
    'Business Development & Supply Chain': {
        name: 'Business Development & Supply Chain',
        head: 'Mr. E.T Kelvin',
        headEmail: 'kelvin.eyong@gratoglobal.com',
        positions: {
            'Supply Chain Coordinator': {
                name: 'Mr. Lukong Lambert',
                email: 'lukong.lambert@gratoglobal.com',
                supervisor: 'Head of Business Dev & Supply Chain', 
                department: 'Business Development & Supply Chain'
            },
            'Order Management Assistant': {
                name: 'Mr. Cristabel Maneni',
                email: 'christabel@gratoengineering.com',
                supervisor: 'Supply Chain Coordinator',
                department: 'Business Development & Supply Chain'
            },
            'Warehouse Coordinator': {
                name: 'Mr. Pryde Mua',
                email: 'pryde.mua@gratoglobal.com',
                supervisor: 'Supply Chain Coordinator',
                department: 'Business Development & Supply Chain'
            },
            'Warehouse Assistant': {
                name: 'Ms. Aghangu Marie',
                email: 'aghangu.marie@gratoengineering.com',
                supervisor: 'Warehouse Coordinator',
                department: 'Business Development & Supply Chain'
            },
            'Finance Officer': {
                name: 'Ms. Rambell Mambo',
                email: 'ranibellmambo@gratoengineerinng.com',
                supervisor: 'Head of Business Dev & Supply Chain', 
                department: 'Business Development & Supply Chain'
            }
        }
    },
  
    'HR & Admin': {
        name: 'HR & Admin',
        head: 'Mrs. Bruiline Tsitoh',
        headEmail: 'bruiline.tsitoh@gratoglobal.com',
        positions: {
            'Office Driver/Logistics Assistant': {
                name: 'Mr. Che Earnest',
                email: 'che.earnest@gratoengineering.com',
                supervisor: 'HR & Admin Head', 
                department: 'HR & Admin'
            },
            'IT Officer': {
                name: 'Mr. Ngong Marcel',
                email: 'marcel.ngong@gratoglobal.com',
                supervisor: 'HR & Admin Head', 
                department: 'HR & Admin'
            },
            'House Maid': {
                name: 'Ms. Ndi Belther',
                email: 'ndi.belther@gratoengineering.com',
                supervisor: 'HR & Admin Head', 
                department: 'HR & Admin'
            }
        }
    },
  
    'Executive': {
        name: 'Executive',
        head: 'Mr. Tom Omeje',
        headEmail: 'tom.omeje@gratoengineering.com',
        positions: {
            'Technical Director': {
                name: 'Mr. Didier Oyong',
                email: 'didier.oyong@gratoengineering.com',
                supervisor: 'President',
                department: 'Executive'
            },
            'Head of Business Dev & Supply Chain': {
                name: 'Mr. E.T Kelvin',
                email: 'kelvin.eyong@gratoglobal.com',
                supervisor: 'President',
                department: 'Executive'
            },
            'Head of HR & Admin': { 
                name: 'Mrs. Brunline Teitoh',
                email: 'bruiline.tsitoh@gratoglobal.com',
                supervisor: 'President',
                department: 'Executive'
            }
        }
    }
  };
  
  // Role mapping based on organizational structure
  export const ROLE_MAPPING = {
    // Executive Level
    'Mr. Tom Omeje': 'admin',
    
    // Department Heads (admin level)
    'Mr. Didier Oyong': 'admin',
    'Mr. E.T Kelvin': 'admin', 
    'Mrs. Brunline Teitoh': 'admin',
    
    // Senior Management (supervisor level)
    'Mr. Ovo Becheni': 'supervisor',
    'Mr. Yerla Ivo': 'supervisor',
    'Mr. Joel Wamba': 'supervisor',
    'Mr. Pascal Assam': 'supervisor',
    'Mr. Kevin Minka': 'supervisor',
    'Mr. Lukong Lambert': 'supervisor',
    'Mr. Pryde Mua': 'supervisor',
    
    // Finance specific
    'Ms. Ranibell Mambo': 'finance',
    
    // HR specific  
    'Mr. Ngong Marcel': 'it',
    
    // Coordinators and mid-level (supervisor)
    'Mr. Rodrigue Nono': 'supervisor',
    'Site Supervisors': 'supervisor',
    
    // Staff level (employee)
    'Mr. Bomba Yvone': 'employee',
    'Mr. Cristabel Maneni': 'employee',
    'Ms. Aghangu Marie': 'employee',
    'Mr. Che Earnest': 'employee',
    'Ms. Ndi Belther': 'employee',
    'Field Technicians': 'employee',
    'NOC Operators': 'employee'
  };
  
  // Department role mapping for role assignment
  export const DEPARTMENT_ROLE_MAPPING = {
    'Executive': {
      'Mr. Tom Omeje': 'head',
      'Mr. Didier Oyong': 'head',
      'Mr. E.T Kelvin': 'head',
      'Mrs. Brunline Teitoh': 'head'
    },
    'Technical': {
      'Mr. Didier Oyong': 'head',
      'Mr. Ovo Becheni': 'coordinator',
      'Mr. Yerla Ivo': 'supervisor',
      'Mr. Joel Wamba': 'supervisor',
      'Mr. Pascal Assam': 'supervisor',
      'Mr. Kevin Minka': 'coordinator',
      'Mr. Rodrigue Nono': 'coordinator',
      'Site Supervisors': 'supervisor',
      'Mr. Bomba Yvone': 'staff',
      'Field Technicians': 'staff',
      'NOC Operators': 'staff'
    },
    'Business Development & Supply Chain': {
      'Mr. E.T Kelvin': 'head',
      'Mr. Lukong Lambert': 'coordinator',
      'Mr. Pryde Mua': 'coordinator',
      'Ms. Rambell Mambo': 'staff',
      'Mr. Cristabel Maneni': 'staff',
      'Ms. Aghangu Marie': 'staff'
    },
    'HR & Admin': {
      'Mrs. Brunline Teitoh': 'head',
      'Mr. Ngong Marcel': 'staff',
      'Mr. Che Earnest': 'staff',
      'Ms. Ndi Belther': 'staff'
    }
  };
  
  // Helper functions
  export const getDepartmentList = () => {
    return Object.keys(DEPARTMENT_STRUCTURE)
      .filter(key => key !== 'Executive')
      .map(key => ({
        key,
        name: DEPARTMENT_STRUCTURE[key].name,
        head: DEPARTMENT_STRUCTURE[key].head,
        headEmail: DEPARTMENT_STRUCTURE[key].headEmail
      }));
  };
  
  export const getEmployeesInDepartment = (department) => {
    const dept = DEPARTMENT_STRUCTURE[department];
    if (!dept) return [];
  
    const employees = [];
  
    // Add department head if not Executive
    if (department !== 'Executive') {
      employees.push({
        name: dept.head,
        email: dept.headEmail,
        position: 'Department Head',
        department: department,
        supervisor: 'President',
        role: ROLE_MAPPING[dept.head] || 'admin',
        departmentRole: 'head'
      });
    }
  
    // Add other positions
    for (const [position, data] of Object.entries(dept.positions || {})) {
      employees.push({
        name: data.name,
        email: data.email,
        position: position,
        department: department,
        supervisor: data.supervisor,
        role: ROLE_MAPPING[data.name] || 'employee',
        departmentRole: DEPARTMENT_ROLE_MAPPING[department]?.[data.name] || 'staff'
      });
    }
  
    return employees;
  };
  
  export const getAllEmployees = () => {
    const allEmployees = [];
    
    Object.keys(DEPARTMENT_STRUCTURE).forEach(department => {
      const employees = getEmployeesInDepartment(department);
      allEmployees.push(...employees);
    });
    
    return allEmployees;
  };
  
  export const getApprovalChain = (employeeName, department) => {
    const chain = [];
  
    console.log(`Getting approval chain for: ${employeeName} in ${department}`);
  
    // Find the employee's data
    let employeeData = null;
    let employeeDepartmentName = department;
  
    // Search for employee in specified department first
    if (DEPARTMENT_STRUCTURE[department]) {
      if (DEPARTMENT_STRUCTURE[department].head === employeeName) {
        employeeData = {
          name: employeeName,
          email: DEPARTMENT_STRUCTURE[department].headEmail,
          position: 'Department Head',
          supervisor: 'President',
          department: department
        };
      } else {
        for (const [pos, data] of Object.entries(DEPARTMENT_STRUCTURE[department].positions || {})) {
          if (data.name === employeeName) {
            employeeData = { ...data, position: pos };
            break;
          }
        }
      }
    }
  
    // If not found, search all departments
    if (!employeeData) {
      for (const [deptKey, deptData] of Object.entries(DEPARTMENT_STRUCTURE)) {
        if (deptData.head === employeeName) {
          employeeData = {
            name: employeeName,
            email: deptData.headEmail,
            position: 'Department Head',
            supervisor: 'President',
            department: deptKey
          };
          employeeDepartmentName = deptKey;
          break;
        }
        
        if (deptData.positions) {
          for (const [pos, data] of Object.entries(deptData.positions)) {
            if (data.name === employeeName) {
              employeeData = { ...data, position: pos };
              employeeDepartmentName = deptKey;
              break;
            }
          }
        }
        
        if (employeeData) break;
      }
    }
  
    // If still not found, create default chain
    if (!employeeData) {
      console.warn(`Employee "${employeeName}" not found. Creating default approval chain.`);
      
      if (DEPARTMENT_STRUCTURE[department]) {
        chain.push({
          level: 1,
          approver: DEPARTMENT_STRUCTURE[department].head,
          email: DEPARTMENT_STRUCTURE[department].headEmail,
          role: 'Department Head',
          department: department
        });
      }
      
      if (DEPARTMENT_STRUCTURE['Executive']) {
        chain.push({
          level: chain.length + 1,
          approver: DEPARTMENT_STRUCTURE['Executive'].head,
          email: DEPARTMENT_STRUCTURE['Executive'].headEmail,
          role: 'President',
          department: 'Executive'
        });
      }
      
      return chain;
    }
  
    let currentEmployee = employeeData;
    let currentDepartment = employeeDepartmentName;
    let level = 1;
  
    // Traverse up the approval chain
    while (currentEmployee && currentEmployee.supervisor) {
      let supervisorFound = false;
  
      // Check positions in current department
      if (DEPARTMENT_STRUCTURE[currentDepartment]?.positions) {
        for (const [pos, data] of Object.entries(DEPARTMENT_STRUCTURE[currentDepartment].positions)) {
          if (pos === currentEmployee.supervisor || data.name === currentEmployee.supervisor) {
            chain.push({
              level: level++,
              approver: data.name,
              email: data.email,
              role: pos,
              department: currentDepartment
            });
            currentEmployee = { ...data, position: pos };
            supervisorFound = true;
            break;
          }
        }
      }
  
      // Check if supervisor is department head
      if (!supervisorFound && DEPARTMENT_STRUCTURE[currentDepartment] && 
          (DEPARTMENT_STRUCTURE[currentDepartment].head === currentEmployee.supervisor || 
           currentEmployee.supervisor.includes('Head') || 
           currentEmployee.supervisor.includes('Director'))) {
        
        chain.push({
          level: level++,
          approver: DEPARTMENT_STRUCTURE[currentDepartment].head,
          email: DEPARTMENT_STRUCTURE[currentDepartment].headEmail,
          role: 'Department Head',
          department: currentDepartment
        });
        
        currentEmployee = {
          name: DEPARTMENT_STRUCTURE[currentDepartment].head,
          supervisor: 'President',
          department: currentDepartment
        };
        supervisorFound = true;
      }
  
      // Check if supervisor is President
      if (!supervisorFound && currentEmployee.supervisor === 'President') {
        if (DEPARTMENT_STRUCTURE['Executive']) {
          chain.push({
            level: level++,
            approver: DEPARTMENT_STRUCTURE['Executive'].head,
            email: DEPARTMENT_STRUCTURE['Executive'].headEmail,
            role: 'President',
            department: 'Executive'
          });
        }
        currentEmployee = null;
        supervisorFound = true;
      }
  
      if (!supervisorFound) {
        console.warn(`Supervisor "${currentEmployee.supervisor}" not found. Adding fallback approvers.`);
        
        // Add department head if not already in chain
        if (DEPARTMENT_STRUCTURE[currentDepartment] && !chain.some(step => step.role === 'Department Head')) {
          chain.push({
            level: level++,
            approver: DEPARTMENT_STRUCTURE[currentDepartment].head,
            email: DEPARTMENT_STRUCTURE[currentDepartment].headEmail,
            role: 'Department Head',
            department: currentDepartment
          });
        }
        
        // Add president if not already in chain
        if (DEPARTMENT_STRUCTURE['Executive'] && !chain.some(step => step.role === 'President')) {
          chain.push({
            level: level++,
            approver: DEPARTMENT_STRUCTURE['Executive'].head,
            email: DEPARTMENT_STRUCTURE['Executive'].headEmail,
            role: 'President',
            department: 'Executive'
          });
        }
        
        break;
      }
    }
  
    return chain;
  };
  
  export const getUserHierarchyLevel = (name, department) => {
    if (name === 'Mr. Tom Omeje') return 5; 
    
    const dept = DEPARTMENT_STRUCTURE[department];
    if (!dept) return 1;
    
    if (dept.head === name) return 4; 
    
    // Check positions for hierarchy levels
    for (const [position, data] of Object.entries(dept.positions || {})) {
      if (data.name === name) {
        if (position.includes('Head') || position.includes('Director')) return 4;
        if (position.includes('Manager') || position.includes('Coordinator')) return 3;
        if (position.includes('Supervisor')) return 2;
        return 1; 
      }
    }
    
    return 1;
  };