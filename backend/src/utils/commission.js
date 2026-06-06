const DEFAULT_COMMISSION_SETTINGS = {
  base_rate: 500,
  threshold_gallons: 60,
  threshold_rate: 1000
};

const parseSettingNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const ensureSettingsTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const getCommissionSettings = async (client) => {
  try {
    await ensureSettingsTable(client);
    const { rows } = await client.query(
      `SELECT key, value
       FROM app_settings
       WHERE key IN (
         'courier_commission_base_rate',
         'courier_commission_threshold_gallons',
         'courier_commission_threshold_rate'
       )`
    );

    const map = Object.fromEntries(rows.map(row => [row.key, row.value]));
    return {
      base_rate: parseSettingNumber(map.courier_commission_base_rate, DEFAULT_COMMISSION_SETTINGS.base_rate),
      threshold_gallons: parseSettingNumber(map.courier_commission_threshold_gallons, DEFAULT_COMMISSION_SETTINGS.threshold_gallons),
      threshold_rate: parseSettingNumber(map.courier_commission_threshold_rate, DEFAULT_COMMISSION_SETTINGS.threshold_rate)
    };
  } catch (_) {
    return DEFAULT_COMMISSION_SETTINGS;
  }
};

const saveCommissionSettings = async (client, settings) => {
  await ensureSettingsTable(client);
  const normalized = {
    base_rate: parseSettingNumber(settings.base_rate, DEFAULT_COMMISSION_SETTINGS.base_rate),
    threshold_gallons: parseSettingNumber(settings.threshold_gallons, DEFAULT_COMMISSION_SETTINGS.threshold_gallons),
    threshold_rate: parseSettingNumber(settings.threshold_rate, DEFAULT_COMMISSION_SETTINGS.threshold_rate)
  };

  const entries = [
    ['courier_commission_base_rate', normalized.base_rate, 'Komisi kurir per galon untuk jumlah normal'],
    ['courier_commission_threshold_gallons', normalized.threshold_gallons, 'Batas galon untuk memakai komisi tier tinggi'],
    ['courier_commission_threshold_rate', normalized.threshold_rate, 'Komisi kurir per galon setelah melewati batas tier']
  ];

  for (const [key, value, description] of entries) {
    await client.query(
      `INSERT INTO app_settings (key, value, description, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = CURRENT_TIMESTAMP`,
      [key, String(value), description]
    );
  }

  return normalized;
};

const calculateCommission = (totalGallons, settings = DEFAULT_COMMISSION_SETTINGS) => {
  const qty = Number(totalGallons) || 0;
  if (qty <= 0) return { amount: 0, rate: 0 };

  const rate = qty > settings.threshold_gallons ? settings.threshold_rate : settings.base_rate;
  return { amount: qty * rate, rate };
};

const calculateCommissionFromSettings = async (client, totalGallons) => {
  const settings = await getCommissionSettings(client);
  return {
    ...calculateCommission(totalGallons, settings),
    settings
  };
};

module.exports = {
  DEFAULT_COMMISSION_SETTINGS,
  calculateCommission,
  calculateCommissionFromSettings,
  getCommissionSettings,
  saveCommissionSettings
};
