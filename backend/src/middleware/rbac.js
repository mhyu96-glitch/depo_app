// Hirarki role: superadmin > admin > kasir
// superadmin : akses semua cabang, termasuk laba rugi
// admin      : akses cabang sendiri, laporan tanpa laba rugi
// kasir      : POS + pelanggan + absensi saja

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
  // superadmin selalu lolos jika admin diizinkan
  if (req.user.role === 'superadmin' && roles.includes('admin')) return next();
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Akses ditolak: izin tidak mencukupi' });
  }
  next();
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Akses ditolak: hanya Super Admin' });
  }
  next();
};

const requireBranchAccess = (req, res, next) => {
  // superadmin dan admin (lama) bebas lintas cabang
  if (req.user.role === 'superadmin' || req.user.role === 'admin') return next();
  const reqBranch = parseInt(req.query.branch_id || req.body.branch_id);
  if (reqBranch && reqBranch !== req.user.branch_id) {
    return res.status(403).json({ success: false, message: 'Akses ditolak: bukan cabang Anda' });
  }
  if (!req.query.branch_id) req.query.branch_id = req.user.branch_id;
  if (!req.body.branch_id)  req.body.branch_id  = req.user.branch_id;
  next();
};

module.exports = { requireRole, requireSuperAdmin, requireBranchAccess };
