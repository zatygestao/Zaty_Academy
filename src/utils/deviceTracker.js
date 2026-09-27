/**
 * Utilitário avançado de Rastreio, Telemetria de Dispositivos e Geolocalização (IP)
 * ZatyAcademy - Sistema de Gestão Académica
 */

// Mapeamento de bandeiras emoji por código ISO de país
const COUNTRY_FLAGS = {
  MZ: '🇲🇿',
  PT: '🇵🇹',
  AO: '🇦🇴',
  BR: '🇧🇷',
  ZA: '🇿🇦',
  ZW: '🇿🇼',
  SZ: '🇸🇿',
  MW: '🇲🇼',
  TZ: '🇹🇿',
  ES: '🇪🇸',
  FR: '🇫🇷',
  GB: '🇬🇧',
  US: '🇺🇸',
  DE: '🇩🇪',
  IT: '🇮🇹'
};

/**
 * Identifica detalhes do dispositivo físico, marca, modelo, SO e navegador
 */
export function detectDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      device_type: 'Servidor / Desconhecido',
      brand: 'Desconhecido',
      model: 'Desconhecido',
      os: 'Desconhecido',
      os_version: '',
      browser: 'Desconhecido',
      browser_version: '',
      screen_resolution: 'N/A',
      orientation: 'N/A',
      device_summary: 'Dispositivo Desconhecido'
    };
  }

  const ua = navigator.userAgent || '';
  const screen = window.screen || {};
  const width = screen.width || window.innerWidth || 0;
  const height = screen.height || window.innerHeight || 0;
  const orientation = width >= height ? 'Horizontal (Landscape)' : 'Vertical (Portrait)';
  const resolution = width && height ? `${width}x${height}` : 'N/A';

  // 1. Determinar Tipo de Dispositivo
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let deviceType = 'Computador Desktop';
  if (isTablet) deviceType = 'Tablet';
  else if (isMobile) deviceType = 'Telemóvel (Smartphone)';

  // 2. Determinar Sistema Operativo
  let os = 'Outro SO';
  let osVersion = '';

  if (/Windows NT 10.0/i.test(ua)) {
    os = 'Windows';
    osVersion = '10 / 11';
  } else if (/Windows NT 6.3/i.test(ua)) {
    os = 'Windows';
    osVersion = '8.1';
  } else if (/Windows NT 6.2/i.test(ua)) {
    os = 'Windows';
    osVersion = '8';
  } else if (/Windows NT 6.1/i.test(ua)) {
    os = 'Windows';
    osVersion = '7';
  } else if (/Android/i.test(ua)) {
    os = 'Android';
    const match = ua.match(/Android\s+([0-9.]+)/i);
    if (match) osVersion = match[1];
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = /iPad/i.test(ua) ? 'iPadOS' : 'iOS';
    const match = ua.match(/OS\s+([0-9_]+)/i);
    if (match) osVersion = match[1].replace(/_/g, '.');
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS';
    const match = ua.match(/Mac OS X\s+([0-9_]+)/i);
    if (match) osVersion = match[1].replace(/_/g, '.');
  } else if (/CrOS/i.test(ua)) {
    os = 'ChromeOS';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // 3. Determinar Marca e Modelo
  let brand = 'Genérico';
  let model = '';

  if (os === 'iOS' || os === 'iPadOS' || /iPhone|iPad/i.test(ua)) {
    brand = 'Apple';
    model = /iPad/i.test(ua) ? 'iPad' : 'iPhone';
  } else if (os === 'macOS') {
    brand = 'Apple';
    model = 'Mac / MacBook';
  } else if (os === 'Windows') {
    brand = 'PC';
    model = isMobile ? 'Windows Phone' : 'Desktop / Portátil';
  } else if (os === 'Android') {
    // Extração inteligente de modelos comuns de Android (Samsung, Xiaomi, Infinix, Tecno, etc.)
    if (/SM-|SAMSUNG/i.test(ua)) {
      brand = 'Samsung';
      const m = ua.match(/(SM-[A-Z0-9]+)/i);
      model = m ? `Galaxy (${m[1]})` : 'Galaxy';
    } else if (/Redmi|Mi |POCO|Xiaomi/i.test(ua)) {
      brand = 'Xiaomi';
      const m = ua.match(/(Redmi[^;\)]*|POCO[^;\)]*|Mi[^;\)]*)/i);
      model = m ? m[1].trim() : 'Redmi / Xiaomi';
    } else if (/Infinix/i.test(ua)) {
      brand = 'Infinix';
      const m = ua.match(/Infinix\s+([^;\)]+)/i);
      model = m ? m[1].trim() : 'Smart Series';
    } else if (/TECNO/i.test(ua)) {
      brand = 'Tecno';
      const m = ua.match(/TECNO\s+([^;\)]+)/i);
      model = m ? m[1].trim() : 'Spark / Camon';
    } else if (/HUAWEI|HONOR/i.test(ua)) {
      brand = 'Huawei';
      const m = ua.match(/(HUAWEI[^;\)]*|HONOR[^;\)]*)/i);
      model = m ? m[1].trim() : 'Nova / P Series';
    } else if (/Pixel/i.test(ua)) {
      brand = 'Google';
      const m = ua.match(/Pixel\s+([0-9a-zA-Z\s]+)/i);
      model = m ? `Pixel ${m[1].trim()}` : 'Pixel';
    } else if (/moto|motorola/i.test(ua)) {
      brand = 'Motorola';
      const m = ua.match(/(moto[^;\)]+)/i);
      model = m ? m[1].trim() : 'Moto G / Edge';
    } else if (/OPPO|CPH/i.test(ua)) {
      brand = 'Oppo';
      model = 'Oppo Series';
    } else if (/VIVO/i.test(ua)) {
      brand = 'Vivo';
      model = 'Vivo Series';
    } else {
      brand = 'Android';
      const buildMatch = ua.match(/;\s*([^;]+?)\s*Build\//i);
      if (buildMatch) {
        model = buildMatch[1].trim();
      } else {
        model = 'Aparelho Android';
      }
    }
  }

  // 4. Determinar Navegador
  let browser = 'Outro Navegador';
  let browserVersion = '';

  if (/Edg/i.test(ua)) {
    browser = 'Microsoft Edge';
    const m = ua.match(/Edg\/([0-9.]+)/i);
    if (m) browserVersion = m[1].split('.')[0];
  } else if (/SamsungBrowser/i.test(ua)) {
    browser = 'Samsung Internet';
    const m = ua.match(/SamsungBrowser\/([0-9.]+)/i);
    if (m) browserVersion = m[1].split('.')[0];
  } else if (/OPR|Opera/i.test(ua)) {
    browser = 'Opera';
    const m = ua.match(/(?:OPR|Opera)\/([0-9.]+)/i);
    if (m) browserVersion = m[1].split('.')[0];
  } else if (/Chrome|CriOS/i.test(ua)) {
    browser = 'Google Chrome';
    const m = ua.match(/(?:Chrome|CriOS)\/([0-9.]+)/i);
    if (m) browserVersion = m[1].split('.')[0];
  } else if (/Firefox|FxiOS/i.test(ua)) {
    browser = 'Mozilla Firefox';
    const m = ua.match(/(?:Firefox|FxiOS)\/([0-9.]+)/i);
    if (m) browserVersion = m[1].split('.')[0];
  } else if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) {
    browser = 'Apple Safari';
    const m = ua.match(/Version\/([0-9.]+)/i);
    if (m) browserVersion = m[1].split('.')[0];
  }

  // Resumo conciso para badges rápidos
  const deviceSummary = brand && model 
    ? `${brand} ${model}` 
    : `${brand} (${deviceType})`;

  return {
    device_type: deviceType,
    brand,
    model: model || deviceType,
    os: osVersion ? `${os} ${osVersion}` : os,
    os_name: os,
    browser: browserVersion ? `${browser} ${browserVersion}` : browser,
    browser_name: browser,
    screen_resolution: resolution,
    orientation,
    device_summary: deviceSummary
  };
}

/**
 * Identifica o fuso horário, offset UTC e configurações de data local
 */
export function detectTimezone() {
  if (typeof window === 'undefined' || typeof Intl === 'undefined') {
    return {
      timezone: 'Africa/Maputo',
      utc_offset: 'GMT+2',
      local_time: new Date().toISOString(),
      language: 'pt-MZ'
    };
  }

  let timezone = 'Africa/Maputo';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Maputo';
  } catch (_) {}

  const now = new Date();
  const offsetMin = -now.getTimezoneOffset();
  const hours = Math.floor(Math.abs(offsetMin) / 60);
  const mins = Math.abs(offsetMin) % 60;
  const sign = offsetMin >= 0 ? '+' : '-';
  const utcOffset = `GMT${sign}${hours}${mins ? `:${mins}` : ''}`;

  let localTimeFormatted = '';
  try {
    localTimeFormatted = now.toLocaleString('pt-PT', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (_) {
    localTimeFormatted = now.toISOString();
  }

  return {
    timezone,
    utc_offset: utcOffset,
    local_time: localTimeFormatted,
    language: navigator.language || 'pt-MZ'
  };
}

/**
 * Consulta geolocalização e conexão por IP de forma silenciosa e com cache em sessionStorage
 * (Não requer e não pede autorização de GPS)
 */
export async function fetchLocationInfo() {
  if (typeof window === 'undefined') {
    return {
      ip: '127.0.0.1',
      city: 'Maputo',
      region: 'Maputo Cidade',
      country: 'Moçambique',
      country_code: 'MZ',
      country_flag: '🇲🇿',
      isp: 'Rede Local',
      org: 'ZatyAcademy'
    };
  }

  // 1. Verificar cache da sessão para resposta em 0ms
  try {
    const cached = sessionStorage.getItem('zaty_geo_telemetry');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (_) {}

  // 2. Serviço Primário: ipapi.co (rápido, fiável e completo)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://ipapi.co/json/', { 
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        const countryCode = (data.country_code || 'MZ').toUpperCase();
        const locationData = {
          ip: data.ip || 'Desconhecido',
          city: data.city || 'Maputo',
          region: data.region || 'Maputo Província',
          country: data.country_name || 'Moçambique',
          country_code: countryCode,
          country_flag: COUNTRY_FLAGS[countryCode] || '🌍',
          isp: data.org || data.asn || 'Operadora Móvel / ISP',
          org: data.org || '',
          latitude: data.latitude || null,
          longitude: data.longitude || null
        };

        try {
          sessionStorage.setItem('zaty_geo_telemetry', JSON.stringify(locationData));
        } catch (_) {}

        return locationData;
      }
    }
  } catch (_) {
    // Continuar para o serviço de fallback
  }

  // 3. Fallback: ipwho.is (rápido e sem chave de API)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false) {
        const countryCode = (data.country_code || 'MZ').toUpperCase();
        const locationData = {
          ip: data.ip || 'Desconhecido',
          city: data.city || 'Maputo',
          region: data.region || 'Maputo Província',
          country: data.country || 'Moçambique',
          country_code: countryCode,
          country_flag: COUNTRY_FLAGS[countryCode] || '🌍',
          isp: data.connection?.isp || data.connection?.org || 'Provedor de Acesso',
          org: data.connection?.org || '',
          latitude: data.latitude || null,
          longitude: data.longitude || null
        };

        try {
          sessionStorage.setItem('zaty_geo_telemetry', JSON.stringify(locationData));
        } catch (_) {}

        return locationData;
      }
    }
  } catch (_) {}

  // 4. Fallback Seguro quando offline ou bloqueado por AdBlocker
  const fallbackData = {
    ip: 'Acesso Direto',
    city: 'Maputo',
    region: 'Maputo Província',
    country: 'Moçambique',
    country_code: 'MZ',
    country_flag: '🇲🇿',
    isp: 'Conexão Local / ISP',
    org: 'Rede Local'
  };

  try {
    sessionStorage.setItem('zaty_geo_telemetry', JSON.stringify(fallbackData));
  } catch (_) {}

  return fallbackData;
}

/**
 * Coleta o pacote completo de telemetria e rastreio para gravação em auditoria
 */
export async function getAccessTelemetry() {
  const device = detectDevice();
  const timezone = detectTimezone();
  const location = await fetchLocationInfo();

  return {
    device,
    timezone,
    location,
    ip: location.ip,
    collected_at: new Date().toISOString()
  };
}

/**
 * Gera um texto resumido e amigável da localização
 * Ex: "Maputo, Moçambique 🇲🇿"
 */
export function formatLocationLabel(telemetry) {
  if (!telemetry?.location) return 'Localização Desconhecida';
  const loc = telemetry.location;
  const parts = [];
  if (loc.city) parts.push(loc.city);
  if (loc.country) parts.push(loc.country);
  const text = parts.join(', ') || 'Moçambique';
  return loc.country_flag ? `${text} ${loc.country_flag}` : text;
}

/**
 * Gera um texto resumido do dispositivo
 * Ex: "Samsung Galaxy (Telemóvel)" ou "Apple Mac (macOS)"
 */
export function formatDeviceLabel(telemetry) {
  if (!telemetry?.device) return 'Dispositivo Padrão';
  const dev = telemetry.device;
  return dev.device_summary || `${dev.brand} (${dev.device_type})`;
}
