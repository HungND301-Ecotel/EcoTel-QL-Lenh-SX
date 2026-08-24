const ROLE = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DISPATCHER: 'dispatcher',
  EMPLOYEE: 'employee'
};

const ROLES = Object.values(ROLE);

const STATUS_ORDER = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const STATUS_ORDERS = Object.values(STATUS_ORDER);

const JOB_TYPE = {
  REPAIR: 'repair',
  MAINTENANCE: 'maintenance',
  INSTALLATION: 'installation',
  INSPECTION: 'inspection'
};

module.exports = { ROLE, ROLES, STATUS_ORDER, STATUS_ORDERS, JOB_TYPE };