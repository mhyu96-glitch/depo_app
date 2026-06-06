const DEFAULT_COMMISSION_TIERS = [
  { min_gallons: 1, max_gallons: 60, rate: 500 },
  { min_gallons: 61, max_gallons: null, rate: 1000 }
];

const DEFAULT_COMMISSION_SETTINGS = {
  base_rate: 500,
  threshold_gallons: 60,
  threshold_rate: 1000,
  tiers: DEFAULT_COMMISSION_TIERS
};

const parseSettingNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const normalizeTier = (tier, fallback = {}) => {
  const min = parseSettingNumber(tier?.min_gallons, fallback.min_gallons ?? 1);
  const maxRaw = tier?.max_gallons;
  const max = maxRaw === null || maxRaw === '' || maxRaw === undefined
    ? null
    : parseSettingNumber(maxRaw, fallback.max_gallons ?? null);
  const rate = parseSettingNumber(tier?.rate, fallback.rate ?? 0);

  return {
    min_gallons: Math.max(1, Math.floor(min)),
    max_gallons: max === null ? null : Math.max(1, Math.floor(max)),
    rate
  };
};

const normalizeTiers = (tiers) => {
  const source = Array.isArray(tiers) && tiers.length > 0 ? tiers : DEFAULT_COMMISSION_TIERS;
  return source
    .map((tier, index) => normalizeTier(tier, DEFAULT_COMMISSION_TIERS[index] || DEFAULT_COMMISSION_TIERS.at(-1)))
    .filter(tier => tier.rate >= 0 && (tier.max_gallons === null || tier.max_gallons >= tier.min_gallons))
    .sort((a, b) => a.min_gallons - b.min_gallons);
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
         'courier_commission_threshold_rate',
         'courier_commission_tiers'
       )`
    );

    const map = Object.fromEntries(rows.map(row => [row.key, row.value]));
    let tiers = null;

    if (map.courier_commission_tiers) {
      try {
        tiers = JSON.parse(map.courier_commission_tiers);
      } catch (_) {
        tiers = null;
      }
    }

    if (!tiers) {
      const baseRate = parseSettingNumber(map.courier_commission_base_rate, DEFAULT_COMMISSION_SETTINGS.base_rate);
      const thresholdGallons = parseSettingNumber(map.courier_commission_threshold_gallons, DEFAULT_COMMISSION_SETTINGS.threshold_gallons);
      const thresholdRate = parseSettingNumber(map.courier_commission_threshold_rate, DEFAULT_COMMISSION_SETTINGS.threshold_rate);
      tiers = [
        { min_gallons: 1, max_gallons: thresholdGallons, rate: baseRate },
        { min_gallons: thresholdGallons + 1, max_gallons: null, rate: thresholdRate }
      ];
    }

    const normalizedTiers = normalizeTiers(tiers);
    const firstTier = normalizedTiers[0] || DEFAULT_COMMISSION_TIERS[0];
    const lastTier = normalizedTiers[normalizedTiers.length - 1] || DEFAULT_COMMISSION_TIERS[1];

    return {
      base_rate: firstTier.rate,
      threshold_gallons: firstTier.max_gallons || DEFAULT_COMMISSION_SETTINGS.threshold_gallons,
      threshold_rate: lastTier.rate,
      tiers: normalizedTiers
    };
  } catch (_) {
    return DEFAULT_COMMISSION_SETTINGS;
  }
};

const saveCommissionSettings = async (client, settings) => {
  await ensureSettingsTable(client);
  const tiers = normalizeTiers(settings.tiers || [
    { min_gallons: 1, max_gallons: settings.threshold_gallons, rate: settings.base_rate },
    { min_gallons: Number(settings.threshold_gallons || 0) + 1, max_gallons: null, rate: settings.threshold_rate }
  ]);
  const firstTier = tiers[0] || DEFAULT_COMMISSION_TIERS[0];
  const lastTier = tiers[tiers.length - 1] || DEFAULT_COMMISSION_TIERS[1];

  const entries = [
    ['courier_commission_tiers', JSON.stringify(tiers), 'Daftar tier/rate komisi kurir per galon'],
    ['courier_commission_base_rate', firstTier.rate, 'Komisi kurir per galon untuk tier pertama'],
    ['courier_commission_threshold_gallons', firstTier.max_gallons || DEFAULT_COMMISSION_SETTINGS.threshold_gallons, 'Batas galon tier pertama'],
    ['courier_commission_threshold_rate', lastTier.rate, 'Komisi kurir per galon untuk tier terakhir']
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

  return {
    base_rate: firstTier.rate,
    threshold_gallons: firstTier.max_gallons || DEFAULT_COMMISSION_SETTINGS.threshold_gallons,
    threshold_rate: lastTier.rate,
    tiers
  };
};

const findCommissionTier = (qty, tiers) => {
  const normalizedTiers = normalizeTiers(tiers);
  return normalizedTiers.find(tier => (
    qty >= tier.min_gallons && (tier.max_gallons === null || qty <= tier.max_gallons)
  )) || normalizedTiers[normalizedTiers.length - 1] || DEFAULT_COMMISSION_TIERS[0];
};

const calculateCommission = (totalGallons, settings = DEFAULT_COMMISSION_SETTINGS) => {
  const qty = Number(totalGallons) || 0;
  if (qty <= 0) return { amount: 0, rate: 0, tier: null };

  const tier = findCommissionTier(qty, settings.tiers);
  return { amount: qty * tier.rate, rate: tier.rate, tier };
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
  DEFAULT_COMMISSION_TIERS,
  calculateCommission,
  calculateCommissionFromSettings,
  getCommissionSettings,
  saveCommissionSettings
};
