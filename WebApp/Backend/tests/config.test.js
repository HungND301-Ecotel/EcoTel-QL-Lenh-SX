const { ROLE, ROLES, STATUS_ORDER, STATUS_ORDERS } = require('../config/config');

describe('config.js ROLE/ROLES', () => {
  test('ROLES phai chua dung 4 gia tri cua ROLE, khong phai cua STATUS_ORDER', () => {
    expect(ROLES).toEqual(Object.values(ROLE));
    expect(ROLES.sort()).toEqual(['admin', 'dispatcher', 'employee', 'manager']);
  });

  test('STATUS_ORDERS khong bi anh huong boi fix nay', () => {
    expect(STATUS_ORDERS).toEqual(Object.values(STATUS_ORDER));
  });
});
