const db = require('../config/database');

// Mock data for Audit Logs
let mockAudits = [
  { id: 1, user: 'Admin Pusat', action: 'Update Price', target: 'Galon 19L', detail: 'Changed price from 5000 to 6000', date: new Date().toISOString(), ip: '192.168.1.1' },
  { id: 2, user: 'Kasir Andi', action: 'Delete Transaction', target: 'INV-20260513-001', detail: 'Wrong quantity entered', date: new Date(Date.now() - 3600000).toISOString(), ip: '192.168.1.5' },
  { id: 3, user: 'Admin Pusat', action: 'Reset Meter', target: 'UV Lamp - Cabang Melati', detail: 'Maintenance completed', date: new Date(Date.now() - 86400000).toISOString(), ip: '192.168.1.1' }
];

exports.getAll = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') {
    return res.json({ data: mockAudits });
  }
};

exports.log = async (user, action, target, detail, ip) => {
  if (process.env.DEMO_MODE === 'true') {
    const newLog = {
      id: Date.now(),
      user,
      action,
      target,
      detail,
      date: new Date().toISOString(),
      ip: ip || 'system'
    };
    mockAudits.unshift(newLog);
    return newLog;
  }
};
