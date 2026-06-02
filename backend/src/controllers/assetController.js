const db = require('../config/database');

let mockAssets = [
  { id: 1, name: 'Filter Sedimen 10 micron', type: 'filter', lifespan_gallons: 5000, current_gallons: 4200, last_change: '2026-03-01', branch_name: 'Depo Pusat' },
  { id: 2, name: 'Lampu UV Sterilizer', type: 'uv', lifespan_gallons: 10000, current_gallons: 2500, last_change: '2026-04-15', branch_name: 'Depo Pusat' },
  { id: 3, name: 'Carbon Filter Actived', type: 'filter', lifespan_gallons: 8000, current_gallons: 7800, last_change: '2026-01-20', branch_name: 'Cabang Melati' },
  { id: 4, name: 'Membran RO (Reverse Osmosis)', type: 'membrane', lifespan_gallons: 20000, current_gallons: 5000, last_change: '2026-02-10', branch_name: 'Cabang Mawar' }
];

exports.getAll = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') {
    return res.json({ data: mockAssets });
  }
};

exports.updateMaintenance = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') {
    const { id } = req.body;
    const asset = mockAssets.find(a => a.id === id);
    if (asset) {
      asset.current_gallons = 0;
      asset.last_change = new Date().toISOString().split('T')[0];
    }
    return res.json({ data: asset });
  }
};
