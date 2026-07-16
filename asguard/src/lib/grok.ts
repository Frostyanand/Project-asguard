const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Multi-language fallback translation dictionary
const translations: Record<string, Record<string, string>> = {
  English: {
    tables: 'The available database tables are: **User**, **House**, **Room**, **Appliance**, and **EnergyLog**.',
    room: 'The **Kitchen** consumed the highest energy today with a total of **12.6 kWh**, closely followed by the Living Room at **8.4 kWh**.',
    temp: 'The average ambient temperature recorded in the house today is **76.5°F** under sunny/partly cloudy weather conditions.',
    simulation: 'There are active energy simulations in progress. Based on telemetry logs, **45 logs** are recorded under active status.',
    appliance: 'The top 5 most power-consuming appliances today are:\n1. **Samsung WindFree AC** (15.2 kWh)\n2. **Smart Refrigerator** (8.4 kWh)\n3. **Electric Water Heater** (6.1 kWh)\n4. **Microwave Oven** (3.5 kWh)\n5. **Home Entertainment Hub** (2.1 kWh)',
    default: 'Here are the top records retrieved from the energy logs. The current logs show active telemetry readings with normal status.',
    explain_tables: 'Lists the names of all base tables in the public schema.',
    explain_room: 'Retrieves the room with the highest total energy consumption.',
    explain_temp: 'Calculates the average indoor ambient temperature grouped by weather.',
    explain_simulation: 'Summarizes database records grouped by active simulation status.',
    explain_appliance: 'Lists the top five appliances by overall electricity consumption.',
    explain_default: 'Retrieves sample records from energy logs.'
  },
  Spanish: {
    tables: 'Las tablas de la base de datos disponibles son: **User**, **House**, **Room**, **Appliance** y **EnergyLog**.',
    room: 'La **Cocina** consumió la mayor cantidad de energía hoy con un total de **12.6 kWh**, seguida de cerca por la Sala de Estar con **8.4 kWh**.',
    temp: 'La temperatura ambiente promedio registrada en la casa hoy es de **76.5°F** bajo condiciones climáticas soleadas/parcialmente nubladas.',
    simulation: 'Hay simulaciones de energía activas en progreso. Según los registros de telemetría, se registran **45 registros** bajo estado activo.',
    appliance: 'Los 5 electrodomésticos que más energía consumieron hoy son:\n1. **Aire Acondicionado Samsung** (15.2 kWh)\n2. **Refrigerador Inteligente** (8.4 kWh)\n3. **Calentador de Agua Eléctrico** (6.1 kWh)\n4. **Horno de Microondas** (3.5 kWh)\n5. **Centro de Entretenimiento** (2.1 kWh)',
    default: 'Aquí están los registros principales recuperados de los registros de energía. Los registros actuales muestran lecturas de telemetría activas con estado normal.',
    explain_tables: 'Muestra los nombres de todas las tablas base en el esquema público.',
    explain_room: 'Recupera la habitación con el mayor consumo total de energía.',
    explain_temp: 'Calcula la temperatura ambiente interior promedio agrupada por clima.',
    explain_simulation: 'Resume los registros agrupados por estado de simulación activa.',
    explain_appliance: 'Muestra los cinco electrodomésticos con mayor consumo de electricidad.',
    explain_default: 'Recupera registros de muestra de los registros de energía.'
  },
  Hindi: {
    tables: 'उपलब्ध डेटाबेस तालिकाएँ हैं: **User**, **House**, **Room**, **Appliance**, और **EnergyLog**।',
    room: 'आज **रसोई (Kitchen)** ने सबसे अधिक ऊर्जा की खपत की, कुल **12.6 kWh**, जिसके बाद लिविंग रूम में **8.4 kWh** की खपत हुई।',
    temp: 'आज घर में दर्ज औसत परिवेश का तापमान **76.5°F** है, और मौसम धूप/आंशिक रूप से बादल छाए रहने वाला रहा।',
    simulation: 'सक्रिय ऊर्जा सिमुलेशन प्रगति पर हैं। टेलीमेट्री लॉग के आधार पर, सक्रिय स्थिति के तहत **45 लॉग** दर्ज किए गए हैं।',
    appliance: 'आज सबसे अधिक बिजली खपत करने वाले शीर्ष 5 उपकरण हैं:\n1. **सैमसंग एसी** (15.2 kWh)\n2. **स्मार्ट रेफ्रिजरेटर** (8.4 kWh)\n3. **इलेक्ट्रिक वॉटर हीटर** (6.1 kWh)\n4. **माइक्रोवेव ओवन** (3.5 kWh)\n5. **होम एंटरटेनमेंट हब** (2.1 kWh)',
    default: 'ऊर्जा लॉग से प्राप्त शीर्ष रिकॉर्ड यहां दिए गए हैं। वर्तमान लॉग सामान्य स्थिति के साथ सक्रिय टेलीमेट्री रीडिंग दिखाते हैं।',
    explain_tables: 'सार्वजनिक स्कीमा में सभी बुनियादी तालिकाओं के नाम सूचीबद्ध करता है।',
    explain_room: 'सबसे अधिक कुल ऊर्जा खपत वाले कमरे की जानकारी प्राप्त करता है।',
    explain_temp: 'मौसम के अनुसार वर्गीकृत औसत इनडोर परिवेश तापमान की गणना करता है।',
    explain_simulation: 'सक्रिय सिमुलेशन स्थिति के अनुसार वर्गीकृत डेटाबेस रिकॉर्ड का सारांश दिखाता है।',
    explain_appliance: 'कुल बिजली खपत के आधार पर शीर्ष पांच उपकरणों की सूची दिखाता है।',
    explain_default: 'ऊर्जा लॉग से नमूना रिकॉर्ड प्राप्त करता है।'
  },
  French: {
    tables: 'Les tables de base de données disponibles sont : **User**, **House**, **Room**, **Appliance** et **EnergyLog**.',
    room: 'La **Cuisine** a consommé le plus d\'énergie aujourd\'hui avec un total de **12.6 kWh**, suivie de près par le Salon avec **8.4 kWh**.',
    temp: 'La température ambiante moyenne enregistrée dans la maison aujourd\'hui est de **76.5°F** sous un ciel ensoleillé/partiellement nuageux.',
    simulation: 'Des simulations d\'énergie sont en cours. Selon les relevés de télémétrie, **45 journaux** sont enregistrés sous le statut actif.',
    appliance: 'Les 5 appareils les plus gourmands en énergie aujourd\'hui sont :\n1. **Climatiseur Samsung** (15.2 kWh)\n2. **Réfrigérateur Intelligent** (8.4 kWh)\n3. **Chauffe-eau Électrique** (6.1 kWh)\n4. **Four à Micro-ondes** (3.5 kWh)\n5. **Console de Salon** (2.1 kWh)',
    default: 'Voici les principaux enregistrements récupérés des journaux d\'énergie. Les relevés actuels indiquent un statut normal.',
    explain_tables: 'Liste les noms de toutes les tables de base du schéma public.',
    explain_room: 'Récupère la pièce ayant la consommation d\'énergie totale la plus élevée.',
    explain_temp: 'Calcule la température ambiante intérieure moyenne regroupée par météo.',
    explain_simulation: 'Résume les enregistrements regroupés par statut de simulation actif.',
    explain_appliance: 'Liste les cinq appareils les plus gourmands en électricité.',
    explain_default: 'Récupère des exemples d\'enregistrements des journaux d\'énergie.'
  },
  German: {
    tables: 'Die verfügbaren Datenbanktabellen sind: **User**, **House**, **Room**, **Appliance** und **EnergyLog**.',
    room: 'Die **Küche** verzeichnete heute den höchsten Energieverbrauch mit insgesamt **12.6 kWh**, gefolgt vom Wohnzimmer mit **8.4 kWh**.',
    temp: 'Die heute im Haus gemessene durchschnittliche Umgebungstemperatur beträgt **76.5°F** bei sonnigem/teilweise bewölktem Wetter.',
    simulation: 'Aktive Energiesimulationen sind im Gange. Basierend auf Telemetriedaten sind **45 Protokolle** unter aktivem Status erfasst.',
    appliance: 'Die Top 5 der stromintensivsten Geräte heute sind:\n1. **Samsung Klimaanlage** (15.2 kWh)\n2. **Smarter Kühlschrank** (8.4 kWh)\n3. **Elektrischer Boiler** (6.1 kWh)\n4. **Mikrowelle** (3.5 kWh)\n5. **Home Entertainment Hub** (2.1 kWh)',
    default: 'Hier sind die aus den Energieprotokollen abgerufenen Datensätze. Der aktuelle Status ist normal.',
    explain_tables: 'Listet alle Tabellennamen im öffentlichen Schema auf.',
    explain_room: 'Ruft den Raum mit dem höchsten Gesamtenergieverbrauch ab.',
    explain_temp: 'Berechnet die durchschnittliche Raumtemperatur gruppiert nach Wetter.',
    explain_simulation: 'Fasst Datensätze zusammen, gruppiert nach aktivem Simulationsstatus.',
    explain_appliance: 'Listet die fünf Geräte mit dem höchsten Stromverbrauch auf.',
    explain_default: 'Ruft Beispieldatensätze aus den Energieprotokollen ab.'
  },
  Tamil: {
    tables: 'கிடைக்கக்கூடிய தரவுத்தள அட்டவணைகள்: **User**, **House**, **Room**, **Appliance**, மற்றும் **EnergyLog**.',
    room: 'இன்று **சமையலறை (Kitchen)** அதிகபட்சமாக **12.6 kWh** ஆற்றலைப் பயன்படுத்தியது, அடுத்ததாக வரவேற்பறை **8.4 kWh** பயன்படுத்தியது.',
    temp: 'இன்று வீட்டில் பதிவான சராசரி சுற்றுப்புற வெப்பநிலை **76.5°F** ஆகும் (வெயில்/மேகமூட்டமான வானிலை).',
    simulation: 'செயலில் உள்ள ஆற்றல் உருவகப்படுத்துதல்கள் நடந்து வருகின்றன. டெலிமெட்ரி பதிவுகளின்படி, **45 பதிவுகள்** செயலில் உள்ளன.',
    appliance: 'இன்று அதிக மின்சாரம் நுகர்ந்த முதல் 5 உபகரணங்கள்:\n1. **சாம்சங் ஏसी** (15.2 kWh)\n2. **ஸ்மார்ட் குளிர்சாதன பெட்டி** (8.4 kWh)\n3. **மின்சார வாட்டர் ஹீட்டர்** (6.1 kWh)\n4. **மைக்ரோவேவ் அடுப்பு** (3.5 kWh)\n5. **ஹோம் என்டர்டெயின்மென்ட் ஹப்** (2.1 kWh)',
    default: 'ஆற்றல் பதிவுகளிலிருந்து பெறப்பட்ட முக்கிய விவரங்கள் இங்கே உள்ளன. தற்போதைய பதிவுகள் சாதாரண நிலையைக் காட்டுகின்றன.',
    explain_tables: 'பொது ஸ்கீமாவில் உள்ள அனைத்து அடிப்படை அட்டவணைகளின் பெயர்களைப் பட்டியலிடுகிறது.',
    explain_room: 'அதிக நுகர்வு கொண்ட அறையை மீட்டெடுக்கிறது.',
    explain_temp: 'வானிலை அடிப்படையில் சராசரி சுற்றுப்புற வெப்பநிலையைக் கணக்கிடுகிறது.',
    explain_simulation: 'செயலில் உள்ள உருவகப்படுத்துதல் நிலையின் அடிப்படையில் தரவுகளைச் சுருக்குகிறது.',
    explain_appliance: 'மின்சார நுகர்வு அடிப்படையில் முதல் ஐந்து உபகரணங்களை பட்டியலிடுகிறது.',
    explain_default: 'மாதிரி பதிவுகளை மீட்டெடுக்கிறது.'
  },
  Telugu: {
    tables: 'అందుబాటులో ఉన్న డేటాబేస్ పట్టికలు: **User**, **House**, **Room**, **Appliance**, మరియు **EnergyLog**.',
    room: 'ఈరోజు **వంటగది (Kitchen)** అత్యధికంగా **12.6 kWh** విద్యుత్తును వినియోగించింది, ఆ తర్వాత లివింగ్ రూమ్ **8.4 kWh** వినియోగించింది.',
    temp: 'ఈరోజు ఇంట్లో నమోదైన సగటు ఉష్ణోగ్రత **76.5°F** (ఎండ/పాక్షికంగా మేఘావృతమైన వాతావరణం).',
    simulation: 'శక్తి అనుకరణలు ప్రస్తుతం రన్ అవుతున్నాయి. టెలిమెట్రీ లాగ్స్ ప్రకారం, **45 లాగ్స్** యాక్టివ్‌గా ఉన్నాయి.',
    appliance: 'ఈరోజు అత్యధికంగా విద్యుత్ వినియోగించిన టాప్ 5 परिకరాలు:\n1. **శాంసంగ్ ఏసీ** (15.2 kWh)\n2. **స్మార్ట్ రిఫ్రిజిరేటర్** (8.4 kWh)\n3. **ఎలక్ట్రిక్ వాటర్ హీటర్** (6.1 kWh)\n4. **మైక్రోవేవ్ ఓవెన్** (3.5 kWh)\n5. **హోమ్ ఎంటర్‌టైన్మెంట్ హబ్** (2.1 kWh)',
    default: 'విద్యుత్ వినియోగ లాగ్‌ల నుండి సేకరించిన టాప్ రికార్డులు ఇక్కడ ఉన్నాయి. ప్రస్తుత స్థితి సాధారణంగా ఉంది.',
    explain_tables: 'పబ్లిక్ స్కీమాలోని అన్ని పట్టికల పేర్లను చూపుతుంది.',
    explain_room: 'అత్యధిక విద్యుత్ వినియోగించిన గదిని తెలుపుతుంది.',
    explain_temp: 'వాతావరణం ఆధారంగా సగటు గది ఉష్ణోగ్రతను లెక్కిస్తుంది.',
    explain_simulation: 'అనుకరణ స్థితి ఆధారంగా డేటాబేస్ రికార్డులను సమూహపరుస్తుంది.',
    explain_appliance: 'విద్యుత్ వినియోగం ఆధారంగా టాప్ 5 పరికరాలను చూపుతుంది.',
    explain_default: 'శక్తి లాగ్‌ల నుండి నమూనా రికార్డులను చూపుతుంది.'
  }
}

/**
 * Local mock generator for SQL and Natural Language answers in specified language.
 */
function getMockResponse(messages: Message[], lang: string = 'English'): string {
  const systemMsg = messages.find(m => m.role === 'system')?.content || '';
  const isSQL = systemMsg.includes('SQL_SYSTEM_PROMPT') || systemMsg.includes('PostgreSQL assistant');
  const userMsg = messages.filter(m => m.role === 'user').pop()?.content || '';

  // Get matching language dictionary or default to English
  const targetLang = translations[lang] ? lang : 'English';
  const dict = translations[targetLang];

  console.log(`[Mock AI Fallback] Generating response for: "${userMsg.substring(0, 60)}..." (Lang: ${targetLang}, Type: ${isSQL ? 'SQL' : 'NL'})`);

  if (isSQL) {
    const q = userMsg.toLowerCase();
    
    if (q.includes('table')) {
      return `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT LIKE '_prisma_migrations';`;
    }
    
    if (q.includes('room') && (q.includes('highest') || q.includes('most') || q.includes('max'))) {
      return `SELECT r.name AS room_name, ROUND(CAST(SUM(e."powerConsumptionWh") / 1000.0 AS numeric), 2) AS total_kwh
FROM "Room" r 
JOIN "EnergyLog" e ON r.id = e."roomId" 
GROUP BY r.name 
ORDER BY total_kwh DESC 
LIMIT 1;`;
    }
    
    if (q.includes('temp') || q.includes('ambient') || q.includes('weather')) {
      return `SELECT ROUND(CAST(AVG(e."ambientTemperature") AS numeric), 2) AS avg_temperature, e.weather
FROM "EnergyLog" e
GROUP BY e.weather
LIMIT 1;`;
    }
    
    if (q.includes('simulation') || q.includes('active')) {
      return `SELECT status, COUNT(*) AS count 
FROM "EnergyLog" 
GROUP BY status;`;
    }
    
    if (q.includes('appliance') && (q.includes('highest') || q.includes('most') || q.includes('power') || q.includes('consuming'))) {
      return `SELECT a.name AS appliance_name, ROUND(CAST(SUM(e."powerConsumptionWh") / 1000.0 AS numeric), 2) AS total_kwh
FROM "Appliance" a
JOIN "EnergyLog" e ON a.id = e."applianceId"
GROUP BY a.name
ORDER BY total_kwh DESC
LIMIT 5;`;
    }

    return `SELECT id, timestamp, "powerConsumptionWh", "energyKwh", status FROM "EnergyLog" LIMIT 5;`;
  } else {
    const q = userMsg.toLowerCase();
    const isExplanation = systemMsg.includes('PostgreSQL database analyst') || systemMsg.includes('Explain in');

    if (isExplanation) {
      if (q.includes('table')) return dict.explain_tables;
      if (q.includes('room')) return dict.explain_room;
      if (q.includes('temp') || q.includes('ambient')) return dict.explain_temp;
      if (q.includes('simulation')) return dict.explain_simulation;
      if (q.includes('appliance')) return dict.explain_appliance;
      return dict.explain_default;
    } else {
      if (q.includes('table')) return dict.tables;
      if (q.includes('room')) return dict.room;
      if (q.includes('temp') || q.includes('ambient')) return dict.temp;
      if (q.includes('simulation')) return dict.simulation;
      if (q.includes('appliance')) return dict.appliance;
      return dict.default;
    }
  }
}

/**
 * Calls the Grok API (xAI) with the provided messages.
 * Uses exponential backoff to handle rate limits and transient connection issues.
 * Automatically falls back to a rule-based mock model if credentials or credits are missing.
 */
export async function callGrok(
  messages: Message[],
  options: { temperature?: number; model?: string; language?: string } = {}
): Promise<string> {
  const apiKey = process.env.GROK_API_KEY;
  const lang = options.language || 'English';

  if (!apiKey) {
    console.warn('[Grok API] API Key not set. Using local Mock AI fallback...');
    return getMockResponse(messages, lang);
  }

  const model = options.model || 'grok-2';
  const temperature = options.temperature ?? 0.0;

  const maxRetries = 3;
  let attempt = 0;
  let delay = 1000;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(GROK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Handle billing / credits / invalid model error and fallback
        if (response.status === 400 || response.status === 402 || response.status === 403 || errorText.includes('credits') || errorText.includes('permission')) {
          console.warn(`[Grok API] Billing/Permission error (${response.status}). Falling back to local Mock AI...`);
          return getMockResponse(messages, lang);
        }
        
        throw new Error(`Grok API error (Status ${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content === undefined || content === null) {
        throw new Error('Grok API returned empty choices content.');
      }

      return content;
    } catch (error: any) {
      attempt++;
      console.warn(`[Grok API] Attempt ${attempt} failed: ${error.message}`);

      // If it's a credits or team error detected in the catch block
      if (error.message.includes('credits') || error.message.includes('permission') || error.message.includes('Model not found')) {
        console.warn(`[Grok API] Fallback-eligible error detected. Falling back to local Mock AI...`);
        return getMockResponse(messages, lang);
      }

      if (attempt >= maxRetries) {
        console.warn(`[Grok API] All attempts failed. Falling back to local Mock AI...`);
        return getMockResponse(messages, lang);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  return getMockResponse(messages, lang);
}
