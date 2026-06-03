// Hirarki role: superadmin > admin > branch_admin > kasir
// superadmin    : akses semua cabang, termasuk laba rugi
// admin         : akses semua cabang, termasuk laba rugi (admin pusat)
// branch_admin  : akses cabang sendiri, TIDAK bisa lihat laba rugi
// kasir         : POS + pelanggan + absensi saja

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
  
  // superadmin selalu lolos untuk semua role
  if (req.user.role === 'superadmin') return next();
  
  // admin pusat lolos untuk admin dan branch_admin
  if (req.user.role === 'admin' && (roles.includes('admin') || roles.includes('branch_admin'))) {
    return next();
  }
  
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

const requireAdminOrSuperAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Akses ditolak: hanya Admin Pusat atau Super Admin' });
  }
  next();
};

const requireBranchAccess = (req, res, next) => {
  // superadmin dan admin pusat bebas lintas cabang
  if (req.user.role === 'superadmin' || req.user.role === 'admin') return next();
  
  // branch_admin dan kasir hanya bisa akses cabang sendiri
  const reqBranch = parseInt(req.query.branch_id || req.body.branch_id);
  if (reqBranch && reqBranch !== req.user.branch_id) {
    return res.status(403).json({ success: false, message: 'Akses ditolak: bukan cabang Anda' });
  }
  
  // Auto-assign branch_id jika tidak ada
  if (!req.query.branch_id) req.query.branch_id = req.user.branch_id;
  if (!req.body.branch_id)  req.body.branch_id  = req.user.branch_id;
  next();
};

module.exports = { requireRole, requireSuperAdmin, requireAdminOrSuperAdmin, requireBranchAccess };
