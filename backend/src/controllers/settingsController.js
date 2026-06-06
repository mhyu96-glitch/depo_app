const db = require('../config/database');
const {
  getCommissionSettings,
  saveCommissionSettings,
  calculateCommission
} = require('../utils/commission');

exports.getCommission = async (req, res) => {
  try {
    const settings = await getCommissionSettings(db.pool);
    res.json({
      data: {
        ...settings,
        sample_normal: calculateCommission(Math.max(1, settings.tiers?.[0]?.max_gallons || settings.threshold_gallons), settings),
        sample_threshold: calculateCommission((settings.tiers?.[0]?.max_gallons || settings.threshold_gallons) + 1, settings)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil pengaturan komisi', error: err.message });
  }
};

exports.updateCommission = async (req, res) => {
  try {
    const { base_rate, threshold_gallons, threshold_rate, tiers } = req.body;
    const submittedTiers = Array.isArray(tiers) && tiers.length > 0 ? tiers : null;
    const values = submittedTiers
      ? submittedTiers.flatMap(tier => [tier.min_gallons, tier.max_gallons ?? 0, tier.rate]).map(Number)
      : [base_rate, threshold_gallons, threshold_rate].map(Number);

    if (values.some(value => !Number.isFinite(value) || value < 0)) {
      return res.status(400).json({ message: 'Nilai komisi harus berupa angka 0 atau lebih' });
    }

    if (submittedTiers && submittedTiers.some(tier => Number(tier.min_gallons) < 1 || (tier.max_gallons !== null && tier.max_gallons !== '' && Number(tier.max_gallons) < Number(tier.min_gallons)))) {
      return res.status(400).json({ message: 'Range galon komisi tidak valid' });
    }

    if (!submittedTiers && Number(threshold_gallons) < 1) {
      return res.status(400).json({ message: 'Batas galon minimal 1' });
    }

    const settings = await saveCommissionSettings(db.pool, {
      base_rate,
      threshold_gallons,
      threshold_rate,
      tiers: submittedTiers
    });

    res.json({ message: 'Pengaturan komisi berhasil diperbarui', data: settings });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menyimpan pengaturan komisi', error: err.message });
  }
};
