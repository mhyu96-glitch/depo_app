const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

// Mock IoT data for demo
let mockReadings = [];
const generateMockReading = (deviceId, branchId, type) => {
  const now = new Date();
  const readings = [];
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now - i * 3600000);
    readings.push({
      id: Date.now() + i,
      device_id: deviceId,
      branch_id: branchId,
      sensor_type: type,
      value: type === 'water_quality' ? (6.8 + Math.random() * 1.2).toFixed(2) :
             type === 'water_level' ? (60 + Math.random() * 35).toFixed(1) :
             type === 'flow_rate' ? (2.5 + Math.random() * 1.5).toFixed(2) :
             (25 + Math.random() * 5).toFixed(1),
      unit: type === 'water_quality' ? 'pH' : type === 'water_level' ? '%' :
            type === 'flow_rate' ? 'L/min' : '°C',
      recorded_at: t.toISOString()
    });
  }
  return readings;
};

const MOCK_DEVICES = [
  { device_id: 'TANDON-PST-01', branch_id: 1, branch_name: 'Depo Pusat', name: 'Tandon Utama A', type: 'water_level', status: 'online', last_value: '78.5', unit: '%' },
  { device_id: 'TANDON-PST-02', branch_id: 1, branch_name: 'Depo Pusat', name: 'Tandon Utama B', type: 'water_level', status: 'online', last_value: '45.2', unit: '%' },
  { device_id: 'QUALITY-PST-01', branch_id: 1, branch_name: 'Depo Pusat', name: 'Sensor Kualitas Air', type: 'water_quality', status: 'online', last_value: '7.1', unit: 'pH' },
  { device_id: 'FLOW-PST-01', branch_id: 1, branch_name: 'Depo Pusat', name: 'Flow Meter Pengisian', type: 'flow_rate', status: 'online', last_value: '3.2', unit: 'L/min' },
  { device_id: 'TANDON-MLT-01', branch_id: 2, branch_name: 'Cabang Melati', name: 'Tandon Melati', type: 'water_level', status: 'warning', last_value: '22.8', unit: '%' },
  { device_id: 'TEMP-PST-01', branch_id: 1, branch_name: 'Depo Pusat', name: 'Sensor Suhu Ruangan', type: 'temperature', status: 'online', last_value: '27.4', unit: '°C' },
];

// GET /api/iot/devices - List all IoT devices with latest reading
router.get('/devices', authenticate, async (req, res) => {
  if (process.env.DEMO_MODE === 'true') {
    return res.json({ data: MOCK_DEVICES });
  }
  try {
    const { rows } = await db.pool.query(`
      SELECT DISTINCT ON (device_id) device_id, branch_id, sensor_type as type, value as last_value, unit, recorded_at
      FROM iot_sensor_readings
      ORDER BY device_id, recorded_at DESC
    `);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});

// GET /api/iot/readings/:deviceId - Historical readings for a device
router.get('/readings/:deviceId', authenticate, async (req, res) => {
  if (process.env.DEMO_MODE === 'true') {
    const device = MOCK_DEVICES.find(d => d.device_id === req.params.deviceId);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    return res.json({ data: generateMockReading(device.device_id, device.branch_id, device.type) });
  }
  try {
    const { rows } = await db.pool.query(
      'SELECT * FROM iot_sensor_readings WHERE device_id=$1 ORDER BY recorded_at DESC LIMIT 24',
      [req.params.deviceId]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});

// POST /api/iot/ingest - IoT device sends data here
router.post('/ingest', async (req, res) => {
  const { device_id, branch_id, sensor_type, value, unit, api_key } = req.body;
  
  // Simple API key auth for IoT devices
  if (api_key !== process.env.IOT_API_KEY && process.env.IOT_API_KEY !== undefined) {
    return res.status(401).json({ message: 'Invalid API key' });
  }

  if (process.env.DEMO_MODE === 'true') {
    console.log(`[IoT Ingest] ${device_id}: ${value} ${unit}`);
    return res.json({ success: true, demo: true });
  }

  try {
    await db.pool.query(
      'INSERT INTO iot_sensor_readings (device_id, branch_id, sensor_type, value, unit) VALUES ($1,$2,$3,$4,$5)',
      [device_id, branch_id, sensor_type, value, unit]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});

// GET /api/iot/summary - Overall IoT status for dashboard
router.get('/summary', authenticate, async (req, res) => {
  if (process.env.DEMO_MODE === 'true') {
    return res.json({
      data: {
        total_devices: MOCK_DEVICES.length,
        online: MOCK_DEVICES.filter(d => d.status === 'online').length,
        warning: MOCK_DEVICES.filter(d => d.status === 'warning').length,
        offline: 0,
        critical_alerts: [
          { device: 'Tandon Melati', branch: 'Cabang Melati', value: '22.8%', message: 'Level air kritis! Segera isi ulang.' }
        ]
      }
    });
  }
  res.json({ data: { total_devices: 0, online: 0, warning: 0, offline: 0, critical_alerts: [] } });
});

module.exports = router;
