const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Akses ditolak: izin tidak mencukupi' });
  }
  next();
};

const requireBranchAccess = (req, res, next) => {
  if (req.user.role === 'admin') return next();
  const reqBranch = parseInt(req.query.branch_id || req.body.branch_id);
  if (reqBranch && reqBranch !== req.user.branch_id) {
    return res.status(403).json({ success: false, message: 'Akses ditolak: bukan cabang Anda' });
  }
  if (!req.query.branch_id) req.query.branch_id = req.user.branch_id;
  if (!req.body.branch_id)  req.body.branch_id  = req.user.branch_id;
  next();
};

module.exports = { requireRole, requireBranchAccess };
