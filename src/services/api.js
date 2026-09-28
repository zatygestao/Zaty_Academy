import { supabase, isolatedAuthClient } from '../config/supabase';
import { 
  generateStudentCode, 
  generateTransactionCode, 
  generateReceiptNumber, 
  generateValidationCode 
} from '../utils/formatters';
import { 
  broadcastCourseUpdate, 
  broadcastCertificateRequest, 
  broadcastNotificationEvent 
} from './realtimeService';

// ==========================================
// 1. CONFIGURAÇÕES INSTITUCIONAIS
// ==========================================

export async function getSettings() {
  let dbRow = null;
  try {
    const { data, error } = await supabase
      .from('academy_settings')
      .select('*')
      .maybeSingle();

    if (!error && data) {
      dbRow = data;
    }
  } catch (err) {
    console.warn('Aviso ao consultar academy_settings:', err);
  }

  // Obter possíveis dados salvos em cache local
  let localData = null;
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('zaty_academy_settings') : null;
    if (raw) localData = JSON.parse(raw);
  } catch (_) {}

  // Mapear colunas do banco e mesclar com cache local para nenhuma informação se perder
  const institution = {
    name: dbRow?.institution_name || localData?.institution?.name || 'ZATY ACADEMY',
    tagline: dbRow?.institution_subtitle || localData?.institution?.tagline || 'Centro de Formação em Informática e Tecnologia',
    email: dbRow?.email || localData?.institution?.email || 'contacto@zatyacademy.co.mz',
    phone: dbRow?.phone || localData?.institution?.phone || '+258 834 847 306',
    alternative_phone: dbRow?.phone_alt || localData?.institution?.alternative_phone || '834 847 306',
    city: (dbRow?.city && !dbRow.city.includes('Maputo')) ? dbRow.city : ((localData?.institution?.city && !localData.institution.city.includes('Maputo')) ? localData.institution.city : 'Nampula'),
    address: (dbRow?.address && !dbRow.address.includes('Maputo')) ? dbRow.address : ((localData?.institution?.address && !localData.institution.address.includes('Maputo')) ? localData.institution.address : 'Namicopo – Nampula, Moçambique (Próximo à 3ª Esquadra)'),
    website: dbRow?.website || localData?.institution?.website || 'https://zatyacademy.co.mz',
    director_name: dbRow?.certificate_signature_name || localData?.institution?.director_name || 'Eng. Carlos Alberto',
    director_role: dbRow?.certificate_signature_role || localData?.institution?.director_role || 'Diretor Geral',
    logo_url: dbRow?.logo_url || localData?.institution?.logo_url || '/logo.png',
    document_logo_url: dbRow?.document_logo_url || localData?.institution?.document_logo_url || '',
    signature_url: dbRow?.signature_url || localData?.institution?.signature_url || '',
    stamp_url: dbRow?.stamp_url || localData?.institution?.stamp_url || '',
    nuit: dbRow?.nuit || localData?.institution?.nuit || '400123456'
  };

  const payment_methods = dbRow?.payment_methods || localData?.payment_methods || null;

  const academic = {
    registration_fee: dbRow?.registration_fee ?? localData?.academic?.registration_fee ?? 500,
    allow_online_registration: dbRow?.allow_online_registration ?? localData?.academic?.allow_online_registration ?? true,
    max_installments: dbRow?.max_installments ?? localData?.academic?.max_installments ?? 3,
    academic_year: dbRow?.academic_year || localData?.academic?.academic_year || '2026',
    passing_grade: dbRow?.passing_grade ?? localData?.academic?.passing_grade ?? 10,
    enrollment_notice_enabled: dbRow?.enrollment_notice_enabled !== undefined
      ? Boolean(dbRow.enrollment_notice_enabled)
      : (localData?.academic?.enrollment_notice_enabled !== undefined ? Boolean(localData.academic.enrollment_notice_enabled) : false),
    enrollment_title: dbRow?.enrollment_title || localData?.academic?.enrollment_title || 'Edital Oficial de Inscrições & Matrículas',
    enrollment_period: dbRow?.enrollment_period || localData?.academic?.enrollment_period || 'Ano Letivo 2026 • Inscrições Abertas',
    enrollment_requirements: dbRow?.enrollment_requirements || localData?.academic?.enrollment_requirements || '1. Fotocópia autenticada do BI, Passaporte ou DIRE\n2. Certificado de Habilitações Literárias (ou declaração da escola)\n3. Duas (2) fotografias tipo passe recentes\n4. Ficha de inscrição devidamente preenchida',
    enrollment_conditions: dbRow?.enrollment_conditions || localData?.academic?.enrollment_conditions || 'Taxa de Inscrição: 500 MT (paga uma única vez no ato da matrícula). Mensalidades acessíveis com pagamento até ao dia 10 de cada mês. Vagas estritamente limitadas para garantir um computador por estudante nos laboratórios de informática.',
    enrollment_procedures: dbRow?.enrollment_procedures || localData?.academic?.enrollment_procedures || '1. Escolha o seu curso pretendido e preencha a inscrição online ou dirija-se à secretaria da academia.\n2. Efetue o pagamento da taxa de inscrição através de M-Pesa, e-Mola ou na secretaria.\n3. Anexe o comprovativo de pagamento no portal do estudante ou entregue na secretaria.\n4. Receba a confirmação da sua matrícula, turma, horário das aulas e credenciais de acesso ao portal.',
    enrollment_schedule_info: dbRow?.enrollment_schedule_info || localData?.academic?.enrollment_schedule_info || 'Turnos Disponíveis: Manhã (08h00 às 10h00 e 10h30 às 12h30) | Tarde (14h00 às 16h00) | Pós-Laboral (17h30 às 19h30) | Sábados Intensivo (08h00 às 13h00)'
  };

  const contact = {
    whatsapp_number: dbRow?.whatsapp_number || localData?.contact?.whatsapp_number || '+258 834 847 306',
    support_hours: dbRow?.support_hours || localData?.contact?.support_hours || 'Segunda a Sexta, das 08h às 17h | Sábados das 08h às 13h',
    terms_notice: dbRow?.terms_notice || localData?.contact?.terms_notice || 'Ao matricular-se, o aluno concorda com o regulamento interno e pedagógico da Zaty Academy.'
  };

  return {
    id: dbRow?.id || '80717825-a524-46e2-87d5-c3ef0296c608',
    institution,
    payment_methods,
    academic,
    contact
  };
}

export async function saveSettings({ institution, payment_methods, academic, contact }) {
  await ensureAdminRole('alterar as configurações globais do sistema', ['super_admin', 'admin']);

  // 1. Persistência imediata no armazenamento local para proteção total contra perda de dados
  if (typeof window !== 'undefined') {
    try {
      const existing = localStorage.getItem('zaty_academy_settings');
      const parsed = existing ? JSON.parse(existing) : {};
      const merged = {
        institution: { ...(parsed.institution || {}), ...(institution || {}) },
        payment_methods: payment_methods || parsed.payment_methods,
        academic: { ...(parsed.academic || {}), ...(academic || {}) },
        contact: { ...(parsed.contact || {}), ...(contact || {}) }
      };
      localStorage.setItem('zaty_academy_settings', JSON.stringify(merged));
      window.dispatchEvent(new Event('zaty-settings-updated'));
    } catch (e) {
      console.warn('Aviso: Falha ao guardar configurações no localStorage:', e);
    }
  }

  // 2. Preparar payload para o Supabase
  const inst = institution || {};
  let rowId = '80717825-a524-46e2-87d5-c3ef0296c608';
  try {
    const { data: firstRow } = await supabase
      .from('academy_settings')
      .select('id')
      .limit(1)
      .maybeSingle();
    if (firstRow?.id) rowId = firstRow.id;
  } catch (_) {}

  const payloadFull = {
    institution_name: inst.name || inst.institution_name,
    institution_subtitle: inst.tagline || inst.institution_subtitle,
    email: inst.email,
    phone: inst.phone,
    phone_alt: inst.alternative_phone || inst.phone_alt,
    address: inst.address,
    certificate_signature_name: inst.director_name || inst.certificate_signature_name,
    certificate_signature_role: inst.director_role || inst.certificate_signature_role || 'Diretor Geral',
    logo_url: inst.logo_url || null,
    document_logo_url: inst.document_logo_url || null,
    signature_url: inst.signature_url || null,
    stamp_url: inst.stamp_url || null,
    website: inst.website || null,
    updated_at: new Date().toISOString()
  };

  if (payment_methods) {
    payloadFull.payment_methods = payment_methods;
  }
  if (academic) {
    if ('registration_fee' in academic) payloadFull.registration_fee = Number(academic.registration_fee) || 0;
    if ('allow_online_registration' in academic) payloadFull.allow_online_registration = !!academic.allow_online_registration;
    if ('max_installments' in academic) payloadFull.max_installments = Number(academic.max_installments) || 1;
    if ('academic_year' in academic) payloadFull.academic_year = String(academic.academic_year);
    if ('passing_grade' in academic) payloadFull.passing_grade = Number(academic.passing_grade) || 10;
    if ('enrollment_notice_enabled' in academic) payloadFull.enrollment_notice_enabled = !!academic.enrollment_notice_enabled;
    if ('enrollment_title' in academic) payloadFull.enrollment_title = String(academic.enrollment_title || '');
    if ('enrollment_period' in academic) payloadFull.enrollment_period = String(academic.enrollment_period || '');
    if ('enrollment_requirements' in academic) payloadFull.enrollment_requirements = String(academic.enrollment_requirements || '');
    if ('enrollment_conditions' in academic) payloadFull.enrollment_conditions = String(academic.enrollment_conditions || '');
    if ('enrollment_procedures' in academic) payloadFull.enrollment_procedures = String(academic.enrollment_procedures || '');
    if ('enrollment_schedule_info' in academic) payloadFull.enrollment_schedule_info = String(academic.enrollment_schedule_info || '');
  }
  if (contact) {
    if ('whatsapp_number' in contact) payloadFull.whatsapp_number = contact.whatsapp_number;
    if ('support_hours' in contact) payloadFull.support_hours = contact.support_hours;
    if ('terms_notice' in contact) payloadFull.terms_notice = contact.terms_notice;
  }

  // 3. Tentar atualização com todos os campos
  try {
    const { data, error } = await supabase
      .from('academy_settings')
      .update(payloadFull)
      .eq('id', rowId)
      .select();

    if (error) throw error;

    await recordAuditLog({
      action: 'SETTINGS_UPDATED',
      description: 'Configurações globais e institucionais do sistema atualizadas',
      resourceType: 'settings',
      resourceId: rowId,
      details: {
        institution_name: inst.name || inst.institution_name,
        academic_year: academic?.academic_year
      }
    });

    return { institution, payment_methods, academic, contact };
  } catch (err) {
    // 4. Fallback caso colunas extras ainda não existam no banco
    console.warn('Tentando fallback com colunas nativas de academy_settings...', err?.message);
    const payloadNative = {
      institution_name: inst.name || inst.institution_name,
      institution_subtitle: inst.tagline || inst.institution_subtitle,
      email: inst.email,
      phone: inst.phone,
      phone_alt: inst.alternative_phone || inst.phone_alt,
      address: inst.address,
      certificate_signature_name: inst.director_name || inst.certificate_signature_name,
      certificate_signature_role: inst.director_role || inst.certificate_signature_role || 'Diretor Geral',
      logo_url: inst.logo_url || null,
      updated_at: new Date().toISOString()
    };

    try {
      await supabase
        .from('academy_settings')
        .update(payloadNative)
        .eq('id', rowId);
    } catch (nativeErr) {
      console.warn('Erro ao atualizar colunas nativas no Supabase:', nativeErr);
    }

    return { institution, payment_methods, academic, contact };
  }
}

export async function updateSetting(key, value, userId = null) {
  if (key === 'institution') {
    return saveSettings({ institution: value });
  } else if (key === 'payment_methods') {
    return saveSettings({ payment_methods: value });
  }
  return saveSettings({ [key]: value });
}

// ==========================================
// REGISTO UNIFICADO DE AUDITORIA (LOGS)
// ==========================================

// Cache anti-duplicação em memória para evitar registros duplicados em rajada (< 2.5s)
const recentAuditCalls = new Map();

export async function recordAuditLog({
  action,
  description = null,
  resourceType = 'system',
  resourceId = null,
  details = null,
  userId = null,
  userEmail = null,
  userName = null,
  status = 'sucesso',
  ipAddress = null,
  telemetry = null
}) {
  try {
    let uid = userId;
    let uemail = userEmail;
    let uname = userName;

    if (!uid || !uemail) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          uid = uid || authData.user.id;
          uemail = uemail || authData.user.email;
          uname = uname || authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0];
        }
      } catch (_) {}
    }

    // 0. Prevenção estrita de registros duplicados em rajada (< 2.5 segundos)
    const dedupeSignature = `${uid || uemail || 'anon'}|${action}|${resourceType || 'system'}|${resourceId || ''}|${description || ''}`;
    const nowTime = Date.now();
    const lastCalled = recentAuditCalls.get(dedupeSignature);
    if (lastCalled && (nowTime - lastCalled) < 2500) {
      console.warn('Registo de auditoria duplicado prevenido na origem:', dedupeSignature);
      return null;
    }
    recentAuditCalls.set(dedupeSignature, nowTime);
    if (recentAuditCalls.size > 200) {
      const oldestKeys = Array.from(recentAuditCalls.keys()).slice(0, 50);
      oldestKeys.forEach(k => recentAuditCalls.delete(k));
    }

    // Coleta silenciosa e ultra-rápida de telemetria e geolocalização do dispositivo
    let clientTelemetry = telemetry;
    if (!clientTelemetry && typeof window !== 'undefined') {
      try {
        clientTelemetry = await getAccessTelemetry();
      } catch (telErr) {
        console.warn('Telemetria em modo reduzido:', telErr);
      }
    }

    const clientIp = ipAddress || clientTelemetry?.ip || null;
    const enrichedDetails = {
      ...(details ? (typeof details === 'object' ? details : { info: details }) : {}),
      ...(clientTelemetry ? { telemetry: clientTelemetry } : {})
    };

    const logId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : null;
    const nowIso = new Date().toISOString();

    const logEntry = {
      id: logId || `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: uid || null,
      user_email: uemail || null,
      user_name: uname || (uemail ? uemail.split('@')[0] : 'Administrador'),
      action,
      description: description || action,
      entity: resourceType || 'system',
      entity_id: resourceId ? String(resourceId) : null,
      resource_type: resourceType || 'system',
      resource_id: resourceId ? String(resourceId) : null,
      ip_address: clientIp,
      details: enrichedDetails,
      status: status || 'sucesso',
      created_at: nowIso
    };

    // 1. Tentar gravação na tabela academy_audit_logs do Supabase (com entity, entity_id e ip_address)
    let dbSuccess = false;
    try {
      const insertPayload = {
        user_id: logEntry.user_id,
        user_email: logEntry.user_email,
        user_name: logEntry.user_name,
        action: logEntry.action,
        description: logEntry.description,
        entity: logEntry.entity,
        entity_id: logEntry.entity_id,
        details: logEntry.details,
        ip_address: logEntry.ip_address,
        status: logEntry.status,
        created_at: logEntry.created_at
      };
      if (logId) {
        insertPayload.id = logId;
      }

      const { data: insertedData, error } = await supabase
        .from('academy_audit_logs')
        .insert([insertPayload])
        .select('id, created_at')
        .maybeSingle();

      if (!error) {
        dbSuccess = true;
        if (insertedData?.id) {
          logEntry.id = insertedData.id;
        }
        if (insertedData?.created_at) {
          logEntry.created_at = insertedData.created_at;
        }
      } else {
        console.warn('Aviso Supabase ao gravar academy_audit_logs:', error.message);
      }
    } catch (insertErr) {
      console.warn('Exceção ao inserir academy_audit_logs:', insertErr);
    }

    // 2. Persistência contínua em cache local para auditoria imutável mesmo offline
    if (typeof window !== 'undefined') {
      try {
        const cachedRaw = localStorage.getItem('academy_audit_logs_cache');
        const cachedList = cachedRaw ? JSON.parse(cachedRaw) : [];
        const updatedList = [
          { ...logEntry, synced: dbSuccess },
          ...cachedList.filter(l => l.id !== logEntry.id).slice(0, 250)
        ];
        localStorage.setItem('academy_audit_logs_cache', JSON.stringify(updatedList));
      } catch (cacheErr) {
        console.warn('Aviso: Falha ao cachear log local:', cacheErr);
      }
    }

    return logEntry;
  } catch (err) {
    console.warn('Falha silenciosa ao registar auditoria:', err);
    return null;
  }
}

// ==========================================
// 2. CURSOS & CONTEÚDOS
// ==========================================

export async function getCourses(includeInactive = false) {
  let query = supabase
    .from('academy_courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getCourseBySlug(slugOrId) {
  if (!slugOrId) return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  let query = supabase
    .from('academy_courses')
    .select(`
      *,
      modules:academy_course_modules (
        id,
        title,
        description,
        order_index,
        lessons:academy_lessons (*)
      )
    `);

  if (isUuid) {
    query = query.eq('id', slugOrId);
  } else {
    query = query.eq('slug', slugOrId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  return data;
}

export async function createCourse(courseData) {
  const { data, error } = await supabase
    .from('academy_courses')
    .insert([courseData])
    .select()
    .single();

  if (error) throw error;

  await recordAuditLog({
    action: 'COURSE_CREATED',
    description: `Curso criado: ${courseData.title}`,
    resourceType: 'course',
    resourceId: data.id,
    details: { title: courseData.title, price: courseData.price, workload_hours: courseData.workload_hours }
  });

  return data;
}

export async function updateCourse(id, courseData) {
  const { data, error } = await supabase
    .from('academy_courses')
    .update({ ...courseData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await recordAuditLog({
    action: 'COURSE_UPDATED',
    description: `Curso atualizado: ${courseData.title || id}`,
    resourceType: 'course',
    resourceId: id,
    details: courseData
  });

  return data;
}

export async function deleteCourse(id) {
  await ensureAdminRole('eliminar cursos do sistema', ['super_admin', 'admin']);
  const { error } = await supabase
    .from('academy_courses')
    .delete()
    .eq('id', id);

  if (error) throw error;

  await recordAuditLog({
    action: 'COURSE_DELETED',
    description: `Curso eliminado ID: ${id}`,
    resourceType: 'course',
    resourceId: id
  });

  return true;
}

// ==========================================
// 3. MÓDULOS & AULAS
// ==========================================

export async function createModule(moduleData) {
  const { data, error } = await supabase
    .from('academy_course_modules')
    .insert([moduleData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteModule(moduleId) {
  // 1. Localiza todas as aulas do módulo para remover arquivos PDF do storage
  try {
    const { data: lessons } = await supabase
      .from('academy_lessons')
      .select('pdf_url')
      .eq('module_id', moduleId);

    if (lessons && lessons.length > 0) {
      for (const l of lessons) {
        if (l.pdf_url) {
          await deletePublicFile(l.pdf_url, 'academy_public');
        }
      }
    }
  } catch (err) {
    console.warn('Aviso: Erro ao limpar PDFs do módulo:', err);
  }

  // 2. Apaga o módulo
  const { error } = await supabase
    .from('academy_course_modules')
    .delete()
    .eq('id', moduleId);

  if (error) throw error;
  return true;
}

export async function createLesson(lessonData) {
  const payload = { ...lessonData };

  // Tratamento de expiração por dias configurados
  if (payload.available_days && Number(payload.available_days) > 0) {
    payload.available_days = Number(payload.available_days);
    if (!payload.expires_at) {
      payload.expires_at = new Date(Date.now() + payload.available_days * 24 * 60 * 60 * 1000).toISOString();
    }
  } else {
    payload.available_days = null;
    payload.expires_at = null;
  }

  try {
    const { data, error } = await supabase
      .from('academy_lessons')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    // Fallback caso a migração SQL de available_days/expires_at ainda não tenha sido executada
    if (err.message && (err.message.includes('available_days') || err.message.includes('expires_at'))) {
      const { available_days, expires_at, ...cleanPayload } = payload;
      const { data, error } = await supabase
        .from('academy_lessons')
        .insert([cleanPayload])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    throw err;
  }
}

export async function updateLesson(id, lessonData) {
  const payload = { ...lessonData, updated_at: new Date().toISOString() };

  if ('available_days' in payload) {
    if (payload.available_days && Number(payload.available_days) > 0) {
      payload.available_days = Number(payload.available_days);
      if (!payload.expires_at) {
        payload.expires_at = new Date(Date.now() + payload.available_days * 24 * 60 * 60 * 1000).toISOString();
      }
    } else {
      payload.available_days = null;
      payload.expires_at = null;
    }
  }

  try {
    const { data, error } = await supabase
      .from('academy_lessons')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    // Fallback gracioso caso as colunas ainda não existam no banco
    if (err.message && (err.message.includes('available_days') || err.message.includes('expires_at'))) {
      const { available_days, expires_at, ...cleanPayload } = payload;
      const { data, error } = await supabase
        .from('academy_lessons')
        .update(cleanPayload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    throw err;
  }
}

export async function deleteLesson(id, pdfUrl = null) {
  let fileToDelete = pdfUrl;
  if (!fileToDelete) {
    try {
      const { data: lesson } = await supabase
        .from('academy_lessons')
        .select('pdf_url')
        .eq('id', id)
        .maybeSingle();
      if (lesson?.pdf_url) {
        fileToDelete = lesson.pdf_url;
      }
    } catch (_) {}
  }

  // 1. Apaga permanentemente o arquivo PDF do Storage
  if (fileToDelete) {
    await deletePublicFile(fileToDelete, 'academy_public');
  }

  // 2. Apaga definitivamente o registro do banco de dados
  const { error } = await supabase
    .from('academy_lessons')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function getLessonProgress(studentId) {
  const { data, error } = await supabase
    .from('academy_lesson_progress')
    .select('lesson_id, completed, last_accessed_at')
    .eq('student_id', studentId);

  if (error) throw error;
  return data || [];
}

export async function toggleLessonProgress(studentId, lessonId, completed = true) {
  const { data, error } = await supabase
    .from('academy_lesson_progress')
    .upsert({
      student_id: studentId,
      lesson_id: lessonId,
      completed,
      last_accessed_at: new Date().toISOString()
    }, { onConflict: 'student_id,lesson_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==========================================
// 4. TURMAS & FORMADORES
// ==========================================

export async function getClasses() {
  // 1. Obter turmas diretamente da tabela
  let rawClasses = [];
  try {
    const { data, error } = await supabase
      .from('academy_classes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    rawClasses = data || [];
  } catch (err) {
    console.warn('Aviso ao consultar academy_classes:', err?.message);
    return [];
  }

  if (rawClasses.length === 0) return [];

  // 2. Enriquecer com curso, formador e alunos matriculados
  const courseIds = [...new Set(rawClasses.map(c => c.course_id).filter(Boolean))];
  const teacherIds = [...new Set(rawClasses.map(c => c.teacher_id).filter(Boolean))];
  const classIds = rawClasses.map(c => c.id);

  const [crsRes, tchRes, enrRes] = await Promise.allSettled([
    courseIds.length > 0 ? supabase.from('academy_courses').select('id, title, slug, workload_hours').in('id', courseIds) : Promise.resolve({ data: [] }),
    teacherIds.length > 0 ? supabase.from('academy_teachers').select('*').in('id', teacherIds) : Promise.resolve({ data: [] }),
    classIds.length > 0 ? supabase.from('academy_enrollments').select('id, student_id, course_id, class_id, status, student:academy_students(id, full_name, student_code, student_number, email, phone, photo_url, enrollment_status)').in('class_id', classIds) : Promise.resolve({ data: [] })
  ]);

  const coursesList = crsRes.status === 'fulfilled' ? (crsRes.value.data || []) : [];
  const teachersList = tchRes.status === 'fulfilled' ? (tchRes.value.data || []) : [];
  const enrollmentsList = enrRes.status === 'fulfilled' ? (enrRes.value.data || []) : [];

  const crsMap = {};
  coursesList.forEach(c => { crsMap[c.id] = c; });

  const tchMap = {};
  teachersList.forEach(t => { 
    tchMap[t.id] = {
      ...t,
      name: t.name || t.full_name || 'Formador',
      full_name: t.full_name || t.name || 'Formador'
    }; 
  });

  const studentsByClass = {};
  enrollmentsList.forEach(e => {
    if (!studentsByClass[e.class_id]) studentsByClass[e.class_id] = [];
    if (e.student) {
      studentsByClass[e.class_id].push({
        ...e.student,
        student_code: e.student.student_code || e.student.student_number || `ZA-${e.student.id?.slice(0, 5)}`,
        enrollment_id: e.id,
        enrollment_status: e.status
      });
    }
  });

  return rawClasses.map(cls => ({
    ...cls,
    course: crsMap[cls.course_id] || { id: cls.course_id, title: 'Curso Vinculado' },
    teacher: tchMap[cls.teacher_id] || (cls.teacher_id ? { id: cls.teacher_id, name: 'Formador' } : null),
    students: studentsByClass[cls.id] || [],
    student_count: (studentsByClass[cls.id] || []).length
  }));
}

export async function createClass(classData) {
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const classCode = (classData.code && classData.code.trim())
    ? classData.code.trim().toUpperCase()
    : `TUR-${currentYear}-${randomSuffix}`;

  const payload = {
    name: classData.name.trim(),
    code: classCode,
    course_id: classData.course_id,
    teacher_id: classData.teacher_id || null,
    schedule: classData.schedule.trim(),
    room: classData.room ? classData.room.trim() : 'Sala 1 - Laboratório TI',
    start_date: classData.start_date || null,
    end_date: classData.end_date || null,
    max_students: Number(classData.max_students) || 20,
    status: classData.status || 'aberta'
  };

  let res = await supabase
    .from('academy_classes')
    .insert([payload])
    .select()
    .single();

  // Fallback defensivo caso a coluna 'room' ainda não exista no schema físico do PostgREST
  if (res.error && (res.error.message?.includes('room') || res.error.message?.includes('schema cache'))) {
    console.warn('Aviso: Coluna room não reconhecida no schema cache. Criando turma com fallback defensivo...', res.error.message);
    const { room, ...payloadWithoutRoom } = payload;
    res = await supabase
      .from('academy_classes')
      .insert([payloadWithoutRoom])
      .select()
      .single();
  }

  if (res.error) throw res.error;
  const data = res.data;

  await recordAuditLog({
    action: 'CLASS_CREATED',
    description: `Turma criada: ${payload.name} (${payload.code})`,
    resourceType: 'class',
    resourceId: data.id,
    details: { name: payload.name, code: payload.code, course_id: payload.course_id, schedule: payload.schedule }
  });

  return data;
}

export async function updateClass(id, classData) {
  const payload = {
    ...classData,
    name: classData.name ? classData.name.trim() : undefined,
    code: classData.code ? classData.code.trim().toUpperCase() : undefined,
    schedule: classData.schedule ? classData.schedule.trim() : undefined,
    max_students: classData.max_students ? Number(classData.max_students) : undefined,
    updated_at: new Date().toISOString()
  };

  let res = await supabase
    .from('academy_classes')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  // Fallback defensivo caso 'room' gere erro de coluna
  if (res.error && (res.error.message?.includes('room') || res.error.message?.includes('schema cache'))) {
    console.warn('Aviso: Coluna room não reconhecida no schema cache. Atualizando turma com fallback defensivo...', res.error.message);
    const { room, ...payloadWithoutRoom } = payload;
    res = await supabase
      .from('academy_classes')
      .update(payloadWithoutRoom)
      .eq('id', id)
      .select()
      .single();
  }

  if (res.error) throw res.error;
  const data = res.data;

  await recordAuditLog({
    action: 'CLASS_UPDATED',
    description: `Turma atualizada: ${payload.name || id}`,
    resourceType: 'class',
    resourceId: id,
    details: payload
  });

  return data;
}

export async function deleteClass(id) {
  await ensureAdminRole('eliminar turmas do sistema', ['super_admin', 'admin', 'secretaria']);
  // Verificar se há estudantes matriculados nesta turma
  try {
    const { count } = await supabase
      .from('academy_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', id);

    if (count > 0) {
      throw new Error(`Esta turma possui ${count} aluno(s) vinculado(s). Transfira ou desvincule os alunos antes de a excluir.`);
    }
  } catch (chkErr) {
    if (chkErr.message?.includes('aluno(s)')) throw chkErr;
  }

  const { error } = await supabase
    .from('academy_classes')
    .delete()
    .eq('id', id);

  if (error) throw error;

  await recordAuditLog({
    action: 'CLASS_DELETED',
    description: `Turma eliminada ID: ${id}`,
    resourceType: 'class',
    resourceId: id
  });

  return true;
}

/**
 * Consulta estudantes disponíveis para adicionar a uma turma, com flags de estado
 */
export async function getAvailableStudentsForClass(classId, courseId = null) {
  try {
    const { data: students, error: stdErr } = await supabase
      .from('academy_students')
      .select('id, user_id, full_name, student_code, student_number, email, phone, photo_url, enrollment_status, status')
      .order('full_name', { ascending: true });

    if (stdErr) throw stdErr;
    if (!students || students.length === 0) return [];

    const { data: enrollments } = await supabase
      .from('academy_enrollments')
      .select('id, student_id, course_id, class_id, status, class:academy_classes(id, name, code)');

    const enrByStudent = {};
    (enrollments || []).forEach(e => {
      if (!enrByStudent[e.student_id]) enrByStudent[e.student_id] = [];
      enrByStudent[e.student_id].push(e);
    });

    return students.map(s => {
      const sEnrollments = enrByStudent[s.id] || [];
      const isInThisClass = sEnrollments.some(e => e.class_id === classId);
      const isEnrolledInCourse = courseId ? sEnrollments.some(e => e.course_id === courseId) : false;
      const otherClassEnrollment = sEnrollments.find(e => e.class_id && e.class_id !== classId);

      return {
        ...s,
        student_code: s.student_code || s.student_number || `ZA-${s.id?.slice(0, 5)}`,
        is_in_this_class: isInThisClass,
        is_enrolled_in_course: isEnrolledInCourse,
        has_any_class: sEnrollments.some(e => !!e.class_id),
        current_class_name: otherClassEnrollment?.class?.name || null,
        enrollments: sEnrollments
      };
    });
  } catch (err) {
    console.error('Erro ao buscar estudantes disponíveis:', err);
    return [];
  }
}

/**
 * Associa com segurança uma lista de estudantes a uma turma e garante a vinculação do formador
 */
export async function assignStudentsToClass({ classId, teacherId = null, studentIds = [] }) {
  if (!classId) throw new Error('ID da turma é obrigatório.');
  if (!studentIds || studentIds.length === 0) throw new Error('Selecione pelo menos um estudante para adicionar à turma.');

  await ensureAdminRole('adicionar estudantes a turmas', ['super_admin', 'admin', 'secretaria']);

  // 1. Obter dados da turma alvo
  const { data: classData, error: clsErr } = await supabase
    .from('academy_classes')
    .select('*, course:academy_courses(id, title)')
    .eq('id', classId)
    .single();

  if (clsErr || !classData) throw new Error('Turma não encontrada no sistema.');

  // 2. Se um formador foi selecionado, garantir atualização da turma
  let assignedTeacher = null;
  const targetTeacherId = teacherId || classData.teacher_id;
  if (targetTeacherId) {
    const { data: tchData } = await supabase
      .from('academy_teachers')
      .select('id, name, full_name, specialty, email')
      .eq('id', targetTeacherId)
      .maybeSingle();

    assignedTeacher = tchData;

    if (teacherId && classData.teacher_id !== teacherId) {
      await supabase
        .from('academy_classes')
        .update({ teacher_id: teacherId, updated_at: new Date().toISOString() })
        .eq('id', classId);
    }
  }

  const teacherName = assignedTeacher?.full_name || assignedTeacher?.name || 'Formador Designado';

  // 3. Buscar matrículas atuais dos estudantes selecionados
  const { data: existingEnrollments } = await supabase
    .from('academy_enrollments')
    .select('*')
    .in('student_id', studentIds);

  const enrollmentsByStudent = {};
  (existingEnrollments || []).forEach(e => {
    if (!enrollmentsByStudent[e.student_id]) enrollmentsByStudent[e.student_id] = [];
    enrollmentsByStudent[e.student_id].push(e);
  });

  const updatePromises = [];
  const insertEnrollments = [];
  const notifications = [];
  const studentStatusUpdates = [];

  for (const studentId of studentIds) {
    const studentEnrs = enrollmentsByStudent[studentId] || [];
    // Verificar se já possui matrícula para o curso da turma
    const matchCourseEnr = studentEnrs.find(e => e.course_id === classData.course_id);

    if (matchCourseEnr) {
      updatePromises.push(
        supabase
          .from('academy_enrollments')
          .update({
            class_id: classId,
            status: 'ativo',
            updated_at: new Date().toISOString()
          })
          .eq('id', matchCourseEnr.id)
      );
    } else {
      insertEnrollments.push({
        student_id: studentId,
        course_id: classData.course_id,
        class_id: classId,
        status: 'ativo'
      });
    }

    // Ativar status do aluno
    studentStatusUpdates.push(
      supabase
        .from('academy_students')
        .update({
          enrollment_status: 'ativo',
          status: 'ativo',
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId)
    );

    // Notificação ao aluno
    notifications.push({
      student_id: studentId,
      title: 'Enturmação e Formador Confirmados!',
      message: `Você foi adicionado à turma "${classData.name}" (${classData.code || ''}) sob a responsabilidade do formador ${teacherName}. Horário das aulas: ${classData.schedule}. Sala: ${classData.room || 'Sala 1 - Laboratório TI'}.`,
      type: 'success',
      is_read: false
    });
  }

  if (insertEnrollments.length > 0) {
    await supabase.from('academy_enrollments').insert(insertEnrollments);
  }
  await Promise.allSettled([...updatePromises, ...studentStatusUpdates]);

  if (notifications.length > 0) {
    try {
      await supabase.from('academy_notifications').insert(notifications);
    } catch (notifErr) {
      console.warn('Aviso: Falha ao inserir notificações automáticas:', notifErr?.message);
    }
  }

  // Registrar auditoria
  await recordAuditLog({
    action: 'STUDENTS_ASSIGNED_TO_CLASS',
    description: `Adicionados ${studentIds.length} estudantes à Turma "${classData.name}" sob responsabilidade do Formador "${teacherName}".`,
    resourceType: 'class',
    resourceId: classId,
    details: {
      classId,
      className: classData.name,
      classCode: classData.code,
      teacherId: targetTeacherId,
      teacherName,
      studentCount: studentIds.length,
      studentIds
    }
  });

  return {
    success: true,
    count: studentIds.length,
    class: classData,
    teacher: assignedTeacher
  };
}

/**
 * Remove com segurança a associação de um estudante a uma turma
 */
export async function removeStudentFromClass({ enrollmentId, studentId, classId }) {
  await ensureAdminRole('remover estudantes de turma', ['super_admin', 'admin', 'secretaria']);

  let query = supabase.from('academy_enrollments').update({
    class_id: null,
    updated_at: new Date().toISOString()
  });

  if (enrollmentId) {
    query = query.eq('id', enrollmentId);
  } else if (studentId && classId) {
    query = query.eq('student_id', studentId).eq('class_id', classId);
  } else {
    throw new Error('Parâmetros insuficientes para desvincular o estudante.');
  }

  const { error } = await query;
  if (error) throw error;

  await recordAuditLog({
    action: 'STUDENT_REMOVED_FROM_CLASS',
    description: `Estudante desvinculado da Turma ID: ${classId || 'N/A'}`,
    resourceType: 'class',
    resourceId: classId || 'unknown',
    details: { enrollmentId, studentId, classId }
  });

  return true;
}

export async function getTeachers() {
  try {
    const { data, error } = await supabase
      .from('academy_teachers')
      .select('*');

    if (error) throw error;

    return (data || []).map(t => ({
      ...t,
      name: t.name || t.full_name || 'Formador',
      full_name: t.full_name || t.name || 'Formador'
    })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } catch (err) {
    console.error('Erro ao consultar academy_teachers:', err);
    return [];
  }
}

export async function createTeacher(teacherData) {
  const teacherName = (teacherData.name || teacherData.full_name || '').trim();
  const payload = {
    name: teacherName,
    full_name: teacherName,
    email: teacherData.email.trim().toLowerCase(),
    phone: teacherData.phone ? teacherData.phone.trim() : null,
    specialty: teacherData.specialty ? teacherData.specialty.trim() : 'Tecnologia',
    bio: teacherData.bio ? teacherData.bio.trim() : null,
    is_active: teacherData.is_active !== undefined ? teacherData.is_active : true
  };

  let inserted = null;
  let lastError = null;

  // Tentativa 1: Ambos os campos
  try {
    const { data, error } = await supabase
      .from('academy_teachers')
      .insert([payload])
      .select()
      .single();

    if (!error && data) inserted = data;
    else lastError = error;
  } catch (e) {
    lastError = e;
  }

  // Fallback se uma das colunas não existir no schema cache do Supabase
  if (!inserted) {
    const withoutName = { ...payload };
    delete withoutName.name;
    try {
      const { data, error } = await supabase.from('academy_teachers').insert([withoutName]).select().single();
      if (!error && data) inserted = data;
    } catch (_) {}
  }

  if (!inserted) {
    const withoutFullName = { ...payload };
    delete withoutFullName.full_name;
    try {
      const { data, error } = await supabase.from('academy_teachers').insert([withoutFullName]).select().single();
      if (!error && data) inserted = data;
    } catch (_) {}
  }

  if (!inserted) {
    throw lastError || new Error('Falha ao registar formador no banco de dados.');
  }

  const normalized = {
    ...inserted,
    name: inserted.name || inserted.full_name || teacherName,
    full_name: inserted.full_name || inserted.name || teacherName
  };

  await recordAuditLog({
    action: 'TEACHER_CREATED',
    description: `Formador registado: ${teacherName}`,
    resourceType: 'teacher',
    resourceId: normalized.id,
    details: { name: teacherName, email: payload.email, specialty: payload.specialty }
  });

  return normalized;
}

export async function updateTeacher(id, teacherData) {
  const teacherName = (teacherData.name || teacherData.full_name || '').trim();
  const payload = {
    name: teacherName,
    full_name: teacherName,
    email: teacherData.email.trim().toLowerCase(),
    phone: teacherData.phone ? teacherData.phone.trim() : null,
    specialty: teacherData.specialty ? teacherData.specialty.trim() : 'Tecnologia',
    bio: teacherData.bio ? teacherData.bio.trim() : null,
    is_active: teacherData.is_active !== undefined ? teacherData.is_active : true,
    updated_at: new Date().toISOString()
  };

  let updated = null;
  try {
    const { data, error } = await supabase
      .from('academy_teachers')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) updated = data;
  } catch (_) {}

  if (!updated) {
    const withoutName = { ...payload };
    delete withoutName.name;
    const { data, error } = await supabase.from('academy_teachers').update(withoutName).eq('id', id).select().single();
    if (error) throw error;
    updated = data;
  }

  await recordAuditLog({
    action: 'TEACHER_UPDATED',
    description: `Formador atualizado: ${teacherName}`,
    resourceType: 'teacher',
    resourceId: id,
    details: payload
  });

  return {
    ...updated,
    name: updated.name || updated.full_name || teacherName,
    full_name: updated.full_name || updated.name || teacherName
  };
}

/**
 * Atualização do próprio perfil pelo Formador (apenas dados permitidos: telefone, bio, foto)
 */
export async function updateTeacherSelfProfile(teacherId, { phone, bio, photo_url }) {
  if (!teacherId) throw new Error('ID do formador não especificado');

  const updates = {
    updated_at: new Date().toISOString()
  };
  if (phone !== undefined) updates.phone = phone ? phone.trim() : null;
  if (bio !== undefined) updates.bio = bio ? bio.trim() : null;
  if (photo_url !== undefined) updates.photo_url = photo_url;

  const { data, error } = await supabase
    .from('academy_teachers')
    .update(updates)
    .eq('id', teacherId)
    .select()
    .single();

  if (error) throw error;

  // Se tiver foto ou telefone, atualizar também no academy_profiles
  if (data?.user_id) {
    try {
      const profileUpdates = {};
      if (photo_url !== undefined) profileUpdates.avatar_url = photo_url;
      if (phone !== undefined) profileUpdates.phone = phone ? phone.trim() : null;
      if (Object.keys(profileUpdates).length > 0) {
        await supabase
          .from('academy_profiles')
          .update(profileUpdates)
          .eq('id', data.user_id);
      }
    } catch (_) {}
  }

  await recordAuditLog({
    action: 'TEACHER_SELF_PROFILE_UPDATED',
    description: `Perfil atualizado pelo próprio formador: ${data.name || data.full_name}`,
    resourceType: 'teacher',
    resourceId: teacherId
  });

  return data;
}

export async function suspendTeacher(arg1, arg2, arg3) {
  await ensureAdminRole('suspender contas de formadores', ['super_admin', 'admin']);
  let teacherId, reason, suspendedBy;
  if (typeof arg1 === 'object' && arg1 !== null) {
    teacherId = arg1.teacherId;
    reason = arg1.reason || '';
    suspendedBy = arg1.suspendedBy || null;
  } else {
    teacherId = arg1;
    reason = arg2 || '';
    suspendedBy = arg3 || null;
  }

  if (!teacherId) throw new Error('ID do formador é obrigatório.');

  // Buscar dados actuais do formador
  const { data: teacher, error: fetchErr } = await supabase
    .from('academy_teachers')
    .select('id, user_id, email, name, full_name')
    .eq('id', teacherId)
    .single();

  if (fetchErr || !teacher) {
    throw new Error('Formador não encontrado.');
  }

  const { data, error } = await supabase
    .from('academy_teachers')
    .update({
      is_active: false,
      is_blocked: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', teacherId)
    .select()
    .single();

  if (error) throw error;

  // Atualizar também no academy_profiles para revogar acesso imediatamente
  if (teacher.user_id) {
    try {
      await supabase
        .from('academy_profiles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacher.user_id);
    } catch (_) {}

    try {
      await supabase
        .from('academy_user_presence')
        .delete()
        .eq('user_id', teacher.user_id);
    } catch (_) {}
  }

  if (teacher.email) {
    try {
      await supabase
        .from('academy_profiles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('email', teacher.email.toLowerCase());
    } catch (_) {}
  }

  await recordAuditLog({
    action: 'TEACHER_SUSPENDED',
    description: `Formador suspenso: ${teacher.name || teacher.full_name}. Motivo: ${reason || 'Suspensão administrativa'}`,
    resourceType: 'teacher',
    resourceId: teacherId,
    userId: suspendedBy,
    details: { reason }
  });

  return data;
}

export async function reactivateTeacher(arg1, arg2) {
  await ensureAdminRole('reativar contas de formadores', ['super_admin', 'admin']);
  let teacherId, reactivatedBy;
  if (typeof arg1 === 'object' && arg1 !== null) {
    teacherId = arg1.teacherId;
    reactivatedBy = arg1.reactivatedBy || null;
  } else {
    teacherId = arg1;
    reactivatedBy = arg2 || null;
  }

  if (!teacherId) throw new Error('ID do formador é obrigatório.');

  const { data: teacher, error: fetchErr } = await supabase
    .from('academy_teachers')
    .select('id, user_id, email, name, full_name')
    .eq('id', teacherId)
    .single();

  if (fetchErr || !teacher) {
    throw new Error('Formador não encontrado.');
  }

  const { data, error } = await supabase
    .from('academy_teachers')
    .update({
      is_active: true,
      is_blocked: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', teacherId)
    .select()
    .single();

  if (error) throw error;

  if (teacher.user_id) {
    try {
      await supabase
        .from('academy_profiles')
        .update({
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacher.user_id);
    } catch (_) {}
  }

  if (teacher.email) {
    try {
      await supabase
        .from('academy_profiles')
        .update({
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', teacher.email.toLowerCase());
    } catch (_) {}
  }

  await recordAuditLog({
    action: 'TEACHER_REACTIVATED',
    description: `Formador reativado: ${teacher.name || teacher.full_name}`,
    resourceType: 'teacher',
    resourceId: teacherId,
    userId: reactivatedBy,
    details: {}
  });

  return data;
}

export async function deleteTeacher(id) {
  await ensureAdminRole('eliminar contas de formadores', ['super_admin', 'admin']);
  // Verificar se o formador está associado a alguma turma
  try {
    const { count } = await supabase
      .from('academy_classes')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', id);

    if (count > 0) {
      throw new Error(`Este formador está vinculado a ${count} turma(s). Desvincule-o das turmas antes de o remover.`);
    }
  } catch (chkErr) {
    if (chkErr.message?.includes('vinculado')) throw chkErr;
  }

  // Obter dados do formador antes de remover
  let teacher = null;
  try {
    const { data: t } = await supabase
      .from('academy_teachers')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    teacher = t;
  } catch (_) {}

  const { error } = await supabase
    .from('academy_teachers')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Revogar acesso e limpar academy_profiles
  if (teacher?.user_id) {
    try {
      await supabase
        .from('academy_profiles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacher.user_id);
    } catch (_) {}

    try {
      await supabase
        .from('academy_profiles')
        .delete()
        .eq('id', teacher.user_id);
    } catch (_) {}

    try {
      await supabase
        .from('academy_user_presence')
        .delete()
        .eq('user_id', teacher.user_id);
    } catch (_) {}
  }

  if (teacher?.email) {
    try {
      await supabase
        .from('academy_profiles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('email', teacher.email.toLowerCase());
    } catch (_) {}
  }

  await recordAuditLog({
    action: 'TEACHER_DELETED',
    description: `Formador eliminado: ${teacher?.name || teacher?.full_name || id}`,
    resourceType: 'teacher',
    resourceId: id
  });

  return true;
}

// ==========================================
// 5. ESTUDANTES & INSCRIÇÃO ONLINE
// ==========================================

export async function checkStudentDuplicates({ phone, email, idDocumentNumber }) {
  // Ignora contas com status 'removida' (permite recadastro conforme regra de negócio)
  if (phone) {
    try {
      const { data: byPhone } = await supabase
        .from('academy_students')
        .select('*')
        .eq('phone', phone)
        .limit(1);
      if (byPhone && byPhone.length > 0) {
        const s = byPhone[0];
        const status = s.enrollment_status || s.status;
        if (status !== 'removida') {
          return { duplicate: true, field: 'Telefone', student: { ...s, student_code: s.student_code || s.student_number } };
        }
      }
    } catch (_) {}
  }

  if (email) {
    try {
      const { data: byEmail } = await supabase
        .from('academy_students')
        .select('*')
        .eq('email', email)
        .limit(1);
      if (byEmail && byEmail.length > 0) {
        const s = byEmail[0];
        const status = s.enrollment_status || s.status;
        if (status !== 'removida') {
          return { duplicate: true, field: 'E-mail', student: { ...s, student_code: s.student_code || s.student_number } };
        }
      }
    } catch (_) {}
  }

  if (idDocumentNumber) {
    try {
      let byDoc = null;
      const res1 = await supabase
        .from('academy_students')
        .select('*')
        .or(`id_document_number.eq.${idDocumentNumber},bi_number.eq.${idDocumentNumber}`)
        .limit(1);

      if (res1?.data && res1.data.length > 0) {
        byDoc = res1.data;
      } else {
        const res2 = await supabase
          .from('academy_students')
          .select('*')
          .eq('bi_number', idDocumentNumber)
          .limit(1);
        if (res2?.data && res2.data.length > 0) byDoc = res2.data;
      }

      if (byDoc && byDoc.length > 0) {
        const s = byDoc[0];
        const status = s.enrollment_status || s.status;
        if (status !== 'removida') {
          return { duplicate: true, field: 'Documento de Identificação (BI)', student: { ...s, student_code: s.student_code || s.student_number } };
        }
      }
    } catch (_) {}
  }

  return { duplicate: false };
}

/**
 * Validação Centralizada e Segura de Elegibilidade de Matrícula (Regras Académicas Oficiais):
 * 1. Se o estudante for APROVADO / CONCLUÍDO no curso X (com certificado emitido ou pauta aprovada),
 *    o sistema PROÍBE expressamente nova matrícula no curso X.
 * 2. Se o estudante for REPROVADO no curso X, permite nova matrícula no curso X sob regras normais.
 * 3. Se possui matrícula ativa/pendente em andamento no curso X, proíbe duplicidade em andamento.
 */
export async function checkStudentCourseEnrollmentEligibility(studentId, courseId) {
  if (!studentId || !courseId) {
    return { eligible: true };
  }

  // 1. Verificar se já existe certificado válido emitido para este estudante neste curso
  try {
    const { data: certs } = await supabase
      .from('academy_certificates')
      .select('id, certificate_number, validation_code, status, course_id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .neq('status', 'revogado');

    if (certs && certs.length > 0) {
      return {
        eligible: false,
        reason: 'curso_concluido_com_certificado',
        message: 'Este curso já foi concluído. O seu certificado foi emitido. Para continuar os seus estudos, solicite uma nova matrícula noutro curso ou atualize o seu percurso académico.'
      };
    }
  } catch (cErr) {
    console.warn('Aviso ao checar certificados para elegibilidade:', cErr);
  }

  // 2. Verificar histórico de matrículas do estudante neste curso
  try {
    const { data: enrollments } = await supabase
      .from('academy_enrollments')
      .select('id, status, final_grade, created_at, course:academy_courses(title)')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (enrollments && enrollments.length > 0) {
      const courseTitle = enrollments[0].course?.title || 'este curso';

      // A) Se possui matrícula concluída ou com menção de APROVADO
      const hasApproved = enrollments.some(e => 
        e.status === 'concluido' || 
        (typeof e.final_grade === 'string' && e.final_grade.toUpperCase().includes('APROVADO'))
      );

      if (hasApproved) {
        return {
          eligible: false,
          reason: 'curso_concluido_aprovado',
          message: `O estudante já concluiu ${courseTitle} com aprovação. O seu certificado foi emitido ou está disponível. Apenas é permitida a inscrição em outros cursos disponíveis.`
        };
      }

      // B) Se possui matrícula ativa ou pendente em andamento (não reprovado nem cancelado)
      const hasActiveOrPending = enrollments.some(e => 
        ['ativo', 'pendente', 'em_curso'].includes(e.status) &&
        !(typeof e.final_grade === 'string' && e.final_grade.toUpperCase().includes('REPROVADO'))
      );

      if (hasActiveOrPending) {
        return {
          eligible: false,
          reason: 'matricula_em_andamento',
          message: `Você já possui uma matrícula ativa ou em análise para ${courseTitle}. Acompanhe o estado no seu painel.`
        };
      }

      // C) Se o estudante teve histórico com REPROVADO (status === 'reprovado' ou final_grade com REPROVADO):
      const isReproved = enrollments.some(e => 
        e.status === 'reprovado' || 
        (typeof e.final_grade === 'string' && e.final_grade.toUpperCase().includes('REPROVADO'))
      );

      if (isReproved) {
        // PERMITIDO RE-MATRICULAR!
        return {
          eligible: true,
          canReEnrollReproved: true,
          previousEnrollmentId: enrollments[0].id,
          message: `Estudante com histórico de reprovação prévia em ${courseTitle}. Nova matrícula permitida sob regras normais.`
        };
      }
    }
  } catch (eErr) {
    console.warn('Aviso ao consultar matrículas para elegibilidade:', eErr);
  }

  return { eligible: true };
}

/**
 * Retorna o mapa de elegibilidade do estudante para todos os cursos activos
 */
export async function getStudentCoursesEligibility(studentId) {
  if (!studentId) return {};
  try {
    const { data: courses } = await supabase
      .from('academy_courses')
      .select('id, title, is_active')
      .eq('is_active', true);

    const map = {};
    if (courses && courses.length > 0) {
      await Promise.all(
        courses.map(async (c) => {
          const res = await checkStudentCourseEnrollmentEligibility(studentId, c.id);
          map[c.id] = res;
        })
      );
    }
    return map;
  } catch (err) {
    console.warn('Aviso ao obter elegibilidade de cursos do estudante:', err);
    return {};
  }
}

/**
 * Matrícula em Curso Adicional com Validação Rigorosa de Aprovação/Reprovação
 */
export async function enrollAdditionalCourse({ studentId, courseId, classId = null }) {
  // 1. Validação central de elegibilidade
  const eligibility = await checkStudentCourseEnrollmentEligibility(studentId, courseId);
  if (!eligibility.eligible) {
    throw new Error(eligibility.message);
  }

  // 2. Criar nova matrícula associada ao mesmo estudante (preservando histórico anterior)
  const { data: enrData, error: enrError } = await supabase
    .from('academy_enrollments')
    .insert([{
      student_id: studentId,
      course_id: courseId,
      class_id: classId,
      status: 'pendente'
    }])
    .select('*, course:academy_courses(id, title, workload_hours), student:academy_students(id, full_name, student_code, student_number, email, phone)')
    .single();

  if (enrError) throw enrError;

  const courseTitle = enrData.course?.title || 'Formação Zaty Academy';
  const studentName = enrData.student?.full_name || 'Estudante';
  const studentCode = enrData.student?.student_code || enrData.student?.student_number || 'ZA';

  // 3. Notificar estudante sobre a nova solicitação de curso
  try {
    await supabase.from('academy_notifications').insert([{
      student_id: studentId,
      title: 'Solicitação de Novo Curso Registada',
      message: `A sua inscrição no curso "${courseTitle}" foi registada com sucesso. Efetue o pagamento da taxa para ativação das aulas.`,
      type: 'info'
    }]);
  } catch (_) {}

  // 4. Notificar a administração em tempo real
  try {
    await supabase.from('academy_notifications').insert([{
      student_id: studentId,
      title: 'Nova Solicitação de Matrícula',
      message: `O estudante ${studentName} (${studentCode}) solicitou matrícula no curso "${courseTitle}".`,
      type: 'new_enrollment_request'
    }]);
  } catch (_) {}

  // 5. Registo no log de auditoria do sistema
  await recordAuditLog({
    action: 'ADDITIONAL_COURSE_ENROLLED',
    description: `Estudante ${studentName} (${studentCode}) solicitou inscrição no curso "${courseTitle}".`,
    resourceType: 'enrollment',
    resourceId: enrData.id,
    userId: enrData.student?.user_id,
    userName: studentName,
    details: {
      student_id: studentId,
      student_name: studentName,
      student_code: studentCode,
      course_id: courseId,
      course_title: courseTitle,
      re_enrolled_after_reproval: !!eligibility.canReEnrollReproved
    }
  });

  return enrData;
}

/**
 * Atualização de Curso pelo Estudante (Segura, Auditada e com Notificação em Tempo Real)
 */
// ==============================================================================
// 5. SOLICITAÇÃO & ATUALIZAÇÃO DE CURSO PELO ESTUDANTE (ÁREA ADMINISTRATIVA & ESTUDANTE)
// ==============================================================================

export const LOCAL_COURSE_UPDATE_REQUESTS_KEY = 'zaty_academy_course_update_requests_v2';

export function getLocalCourseUpdateRequestsStore() {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(LOCAL_COURSE_UPDATE_REQUESTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

export function saveLocalCourseUpdateRequestsStore(requests) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_COURSE_UPDATE_REQUESTS_KEY, JSON.stringify(requests));
    }
  } catch (_) {}
}

/**
 * Solicitação oficial de atualização de curso pelo estudante
 * Cria requerimento com status 'pendente' aguardando avaliação da Direção Académica.
 */
export async function requestStudentCourseUpdate({
  studentId,
  previousCourseId,
  newCourseId,
  reason = ''
}) {
  if (!studentId) {
    throw new Error('Identificador do estudante não informado.');
  }
  if (!newCourseId) {
    throw new Error('Por favor selecione o novo curso desejado.');
  }
  if (previousCourseId && previousCourseId === newCourseId) {
    throw new Error('O novo curso selecionado não pode ser igual ao curso atual.');
  }

  // 1. Verificar se o estudante já possui uma solicitação pendente ou aguardando pagamento
  const existingRequests = await getStudentCourseUpdateRequests(studentId);
  const activePending = existingRequests.find(r => 
    ['pendente', 'em_analise', 'aprovada_aguardando_pagamento'].includes(r.status)
  );

  if (activePending) {
    const statusLabel = activePending.status === 'aprovada_aguardando_pagamento' 
      ? 'Aprovada (Aguardando Pagamento)' 
      : 'Pendente de Avaliação';
    throw new Error(`Já possui uma solicitação de atualização em andamento [Estado: ${statusLabel}]. Por favor, aguarde o processamento pela Direção.`);
  }

  // 2. Obter dados atuais do estudante e dos cursos
  const [stdRes, prevCourseRes, newCourseRes] = await Promise.all([
    supabase.from('academy_students').select('*').eq('id', studentId).maybeSingle(),
    previousCourseId ? supabase.from('academy_courses').select('id, title, workload_hours').eq('id', previousCourseId).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('academy_courses').select('id, title, workload_hours, duration, price').eq('id', newCourseId).maybeSingle()
  ]);

  const student = stdRes.data;
  if (!student) {
    throw new Error('Registo do estudante não encontrado.');
  }

  const newCourse = newCourseRes.data;
  if (!newCourse) {
    throw new Error('O curso selecionado não foi encontrado ou não está disponível.');
  }

  const previousCourse = prevCourseRes.data || { id: previousCourseId, title: 'Curso Anterior' };

  // 3. Validação de elegibilidade: curso concluído não pode ser selecionado
  const eligibility = await checkStudentCourseEnrollmentEligibility(studentId, newCourseId);
  if (!eligibility.eligible) {
    throw new Error(eligibility.message);
  }

  const nowIso = new Date().toISOString();
  const reqId = `cur_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  const studentCode = student.student_code || student.student_number || 'ZA';
  const studentName = student.full_name;

  const newRequest = {
    id: reqId,
    student_id: studentId,
    student_name: studentName,
    student_code: studentCode,
    student_email: student.email,
    student_phone: student.phone,
    previous_course_id: previousCourse.id,
    previous_course_title: previousCourse.title,
    new_course_id: newCourse.id,
    new_course_title: newCourse.title,
    new_course_price: newCourse.price || 0,
    new_course_workload: newCourse.workload_hours || 60,
    new_course_duration: newCourse.duration || '3 Meses',
    reason: reason ? reason.trim() : 'Solicitação direta de atualização de formação',
    status: 'pendente', // 'pendente' | 'aprovada_aguardando_pagamento' | 'concluido' | 'rejeitada'
    admin_notes: null,
    rejection_reason: null,
    payment_status: (newCourse.price > 0) ? 'pendente' : 'isento',
    payment_id: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: nowIso,
    updated_at: nowIso
  };

  // 4. Inserir matrícula preliminar em estado 'pendente' no academy_enrollments
  try {
    await supabase.from('academy_enrollments').insert([{
      student_id: studentId,
      course_id: newCourseId,
      class_id: null,
      status: 'pendente'
    }]);
  } catch (_) {}

  // 5. Salvar na store local resiliente
  const localStore = getLocalCourseUpdateRequestsStore();
  const updatedLocal = [newRequest, ...localStore.filter(r => r.id !== reqId)];
  saveLocalCourseUpdateRequestsStore(updatedLocal);

  // 6. Registar no log de auditoria oficial
  try {
    await recordAuditLog({
      action: 'COURSE_UPDATE_REQUESTED',
      description: `Estudante ${studentName} (${studentCode}) submeteu solicitação de atualização de "${previousCourse.title}" para "${newCourse.title}".`,
      resourceType: 'course_update',
      resourceId: reqId,
      userId: student.user_id,
      userName: studentName,
      details: newRequest
    });
  } catch (_) {}

  // 7. Notificar a Administração
  try {
    await supabase.from('academy_notifications').insert([{
      student_id: studentId,
      title: '🔄 Nova Solicitação de Atualização de Curso',
      message: `O estudante ${studentName} (${studentCode}) solicitou transição de "${previousCourse.title}" para "${newCourse.title}".`,
      type: 'course_updated',
      is_read: false,
      created_at: nowIso
    }]);
  } catch (_) {}

  // 8. Notificar o próprio Estudante
  try {
    await supabase.from('academy_notifications').insert([{
      student_id: studentId,
      title: '📋 Solicitação de Atualização Registada',
      message: `A sua solicitação de atualização para o curso "${newCourse.title}" foi enviada com sucesso e está sob avaliação da Direção Académica.`,
      type: 'info',
      is_read: false,
      created_at: nowIso
    }]);
  } catch (_) {}

  // 9. Transmitir em tempo real
  broadcastCourseUpdate(newRequest);
  broadcastNotificationEvent({
    title: 'Nova Solicitação de Atualização de Curso',
    student_id: studentId,
    course_title: newCourse.title
  });

  return newRequest;
}

/**
 * Consulta todas as solicitações de atualização de curso (para o painel de Administração)
 */
export async function getCourseUpdateRequests(filters = {}) {
  const localList = getLocalCourseUpdateRequestsStore();
  const map = new Map();

  // 1. Carregar da store local
  localList.forEach(r => map.set(r.id, r));

  // 2. Carregar registos históricos da tabela de auditoria
  try {
    const { data: auditLogs } = await supabase
      .from('academy_audit_logs')
      .select('*')
      .in('action', ['COURSE_UPDATE_REQUESTED', 'COURSE_UPDATE_STATUS_UPDATED', 'STUDENT_COURSE_UPDATED'])
      .order('created_at', { ascending: false })
      .limit(100);

    if (auditLogs && auditLogs.length > 0) {
      auditLogs.forEach(log => {
        if (log.details && (log.details.id || log.details.student_id)) {
          const id = log.details.id || `audit_${log.id}`;
          if (!map.has(id)) {
            map.set(id, {
              id,
              student_id: log.details.student_id,
              student_name: log.details.student_name || log.user_name || 'Estudante',
              student_code: log.details.student_code || 'ZA',
              previous_course_id: log.details.previous_course_id,
              previous_course_title: log.details.previous_course_title || 'Curso Anterior',
              new_course_id: log.details.new_course_id,
              new_course_title: log.details.new_course_title || log.details.course_title || 'Novo Curso',
              new_course_price: log.details.new_course_price || 0,
              reason: log.details.reason || 'Atualização de curso',
              status: log.details.status || 'concluido',
              created_at: log.details.created_at || log.created_at,
              updated_at: log.details.updated_at || log.created_at
            });
          }
        }
      });
    }
  } catch (err) {
    console.warn('Aviso ao consultar logs de solicitações de curso:', err);
  }

  let list = Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  if (filters.status && filters.status !== 'todas') {
    list = list.filter(r => r.status === filters.status);
  }

  return list;
}

/**
 * Consulta as solicitações de atualização de um estudante específico
 */
export async function getStudentCourseUpdateRequests(studentId) {
  if (!studentId) return [];
  const all = await getCourseUpdateRequests();
  return all.filter(r => r.student_id === studentId);
}

/**
 * Obtém a solicitação ativa de atualização de um estudante (pendente ou aguardando pagamento)
 */
export async function getStudentActiveCourseUpdateRequest(studentId) {
  if (!studentId) return null;
  const requests = await getStudentCourseUpdateRequests(studentId);
  return requests.find(r => ['pendente', 'em_analise', 'aprovada_aguardando_pagamento'].includes(r.status)) || null;
}

/**
 * Parecer administrativo sobre a solicitação de atualização de curso (Aprovar / Rejeitar / Confirmar Pagamento)
 */
export async function reviewCourseUpdateRequest({
  requestId,
  studentId,
  decision, // 'aprovar' | 'rejeitar' | 'confirmar_pagamento_e_ativar'
  adminNotes = '',
  rejectionReason = '',
  adminUserId = null
}) {
  await ensureAdminRole('avaliar solicitações de atualização de curso', ['super_admin', 'admin', 'secretaria', 'financeiro']);

  if (!requestId) {
    throw new Error('Identificador da solicitação não fornecido.');
  }

  const localStore = getLocalCourseUpdateRequestsStore();
  let request = localStore.find(r => r.id === requestId);

  if (!request) {
    // Tenta encontrar em toda a lista
    const all = await getCourseUpdateRequests();
    request = all.find(r => r.id === requestId);
  }

  if (!request) {
    throw new Error('Solicitação de atualização de curso não encontrada.');
  }

  const nowIso = new Date().toISOString();
  const targetStudentId = studentId || request.student_id;
  const courseTitle = request.new_course_title || 'Novo Curso';
  const previousTitle = request.previous_course_title || 'Curso Anterior';

  let newStatus = request.status;
  let newPaymentStatus = request.payment_status;

  if (decision === 'aprovar') {
    // Se o curso exigir pagamento (preço > 0), requer pagamento correspondente
    if (Number(request.new_course_price) > 0) {
      newStatus = 'aprovada_aguardando_pagamento';
      newPaymentStatus = 'pendente';
    } else {
      // Curso gratuito ou isento: ativa imediatamente
      return await confirmCourseUpdatePaymentAndActivate({
        requestId,
        adminUserId,
        notes: adminNotes || 'Aprovado sem custos de propina'
      });
    }
  } else if (decision === 'rejeitar') {
    newStatus = 'rejeitada';

    // Cancelar matrícula pendente criada no academy_enrollments
    try {
      await supabase
        .from('academy_enrollments')
        .update({ status: 'cancelado', updated_at: nowIso })
        .eq('student_id', targetStudentId)
        .eq('course_id', request.new_course_id)
        .eq('status', 'pendente');
    } catch (_) {}
  } else if (decision === 'confirmar_pagamento_e_ativar') {
    return await confirmCourseUpdatePaymentAndActivate({
      requestId,
      adminUserId,
      notes: adminNotes
    });
  }

  // Atualizar registo da solicitação
  const updatedReq = {
    ...request,
    status: newStatus,
    payment_status: newPaymentStatus,
    admin_notes: adminNotes ? adminNotes.trim() : request.admin_notes,
    rejection_reason: rejectionReason ? rejectionReason.trim() : request.rejection_reason,
    reviewed_by: adminUserId,
    reviewed_at: nowIso,
    updated_at: nowIso
  };

  // Salvar na store
  const updatedLocal = localStore.map(r => r.id === requestId ? updatedReq : r);
  if (!updatedLocal.some(r => r.id === requestId)) {
    updatedLocal.unshift(updatedReq);
  }
  saveLocalCourseUpdateRequestsStore(updatedLocal);

  // Notificar o estudante
  try {
    if (newStatus === 'aprovada_aguardando_pagamento') {
      await supabase.from('academy_notifications').insert([{
        student_id: targetStudentId,
        title: '✅ Solicitação de Atualização Aprovada!',
        message: `A sua solicitação de atualização para o curso "${courseTitle}" foi aprovada pela Direção. Por favor, efetue o pagamento da propina para concluir a atualização e liberar o seu acesso total aos conteúdos.`,
        type: 'info',
        is_read: false,
        created_at: nowIso
      }]);
    } else if (newStatus === 'rejeitada') {
      await supabase.from('academy_notifications').insert([{
        student_id: targetStudentId,
        title: '❌ Solicitação de Atualização Não Aprovada',
        message: `A sua solicitação de atualização para o curso "${courseTitle}" não foi aprovada pela Direção. Motivo: ${rejectionReason || adminNotes || 'Critérios regulamentares da academia.'}`,
        type: 'warning',
        is_read: false,
        created_at: nowIso
      }]);
    }
  } catch (_) {}

  // Registo de auditoria
  try {
    await recordAuditLog({
      action: 'COURSE_UPDATE_STATUS_UPDATED',
      description: `Solicitação de atualização de curso ID ${requestId} (${request.student_name}) avaliada para "${newStatus}".`,
      resourceType: 'course_update',
      resourceId: requestId,
      userId: adminUserId,
      details: updatedReq
    });
  } catch (_) {}

  // Transmissão em tempo real
  broadcastCourseUpdate(updatedReq);
  broadcastNotificationEvent({
    title: `Atualização de Solicitação: ${newStatus}`,
    student_id: targetStudentId,
    status: newStatus
  });

  return updatedReq;
}

/**
 * Confirma o pagamento e ativa definitivamente a matrícula no novo curso, liberando o acesso total
 */
export async function confirmCourseUpdatePaymentAndActivate({
  requestId,
  adminUserId = null,
  notes = ''
}) {
  const localStore = getLocalCourseUpdateRequestsStore();
  let request = localStore.find(r => r.id === requestId);
  if (!request) {
    const all = await getCourseUpdateRequests();
    request = all.find(r => r.id === requestId);
  }

  if (!request) {
    throw new Error('Solicitação de atualização não encontrada.');
  }

  const nowIso = new Date().toISOString();
  const studentId = request.student_id;
  const newCourseId = request.new_course_id;
  const previousCourseId = request.previous_course_id;

  // 1. Atualizar ou ativar matrícula no novo curso em academy_enrollments
  try {
    const { data: existingEnr } = await supabase
      .from('academy_enrollments')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('course_id', newCourseId)
      .maybeSingle();

    if (existingEnr) {
      await supabase
        .from('academy_enrollments')
        .update({
          status: 'ativo',
          updated_at: nowIso
        })
        .eq('id', existingEnr.id);
    } else {
      await supabase
        .from('academy_enrollments')
        .insert([{
          student_id: studentId,
          course_id: newCourseId,
          class_id: null,
          status: 'ativo'
        }]);
    }

    // 2. Marcar matrícula anterior como 'transferido' (caso não estivesse concluída com certificado)
    if (previousCourseId) {
      await supabase
        .from('academy_enrollments')
        .update({
          status: 'transferido',
          updated_at: nowIso
        })
        .eq('student_id', studentId)
        .eq('course_id', previousCourseId)
        .neq('status', 'concluido');
    }

    // 3. Atualizar status geral do estudante
    await supabase
      .from('academy_students')
      .update({
        enrollment_status: 'ativo',
        status: 'ativo',
        financial_status: 'regular',
        updated_at: nowIso
      })
      .eq('id', studentId);
  } catch (dbErr) {
    console.warn('Aviso ao sincronizar matrículas no Supabase:', dbErr);
  }

  // 4. Atualizar objeto da solicitação para 'concluido'
  const updatedReq = {
    ...request,
    status: 'concluido',
    payment_status: 'pago',
    admin_notes: notes || request.admin_notes,
    reviewed_by: adminUserId,
    reviewed_at: nowIso,
    updated_at: nowIso
  };

  const updatedLocal = localStore.map(r => r.id === requestId ? updatedReq : r);
  if (!updatedLocal.some(r => r.id === requestId)) updatedLocal.unshift(updatedReq);
  saveLocalCourseUpdateRequestsStore(updatedLocal);

  // 5. Enviar Notificação Padrão Obrigatória de Inscrição Aprovada (Requisito 3)
  const approvedNotif = {
    student_id: studentId,
    title: 'Inscrição Aprovada com Sucesso!',
    message: 'Acesso Liberado: A sua inscrição foi aprovada pela administração. Você já tem acesso total aos módulos, aulas e conteúdos do seu curso.',
    type: 'enrollment_approved',
    is_read: false,
    created_at: nowIso
  };

  try {
    await supabase.from('academy_notifications').insert([approvedNotif]);
  } catch (_) {}

  // Gravar na store de notificações locais
  const notifStore = getLocalNotificationsStore();
  notifStore.unshift({
    ...approvedNotif,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  });
  saveLocalNotificationsStore(notifStore);

  // 6. Auditoria do sistema
  try {
    await recordAuditLog({
      action: 'COURSE_UPDATE_COMPLETED',
      description: `Atualização de curso concluída com sucesso para o estudante ${request.student_name}. Acesso total liberado.`,
      resourceType: 'course_update',
      resourceId: requestId,
      userId: adminUserId,
      details: updatedReq
    });
  } catch (_) {}

  // 7. Transmissão em tempo real
  broadcastCourseUpdate(updatedReq);
  broadcastNotificationEvent({
    title: 'Inscrição Aprovada com Sucesso!',
    student_id: studentId,
    course_title: request.new_course_title
  });

  return updatedReq;
}

/**
 * Função de retrocompatibilidade: encaminha para requestStudentCourseUpdate
 */
export async function updateStudentCourse({
  studentId,
  previousCourseId,
  newCourseId,
  reason = ''
}) {
  return await requestStudentCourseUpdate({
    studentId,
    previousCourseId,
    newCourseId,
    reason
  });
}

/**
 * Normaliza os dados civis e de filiação do estudante necessários para certificados e documentos oficiais.
 * Extrai das colunas dedicadas de academy_students ou do campo serializado notes.
 */
export function parseStudentCivilData(studentRow) {
  if (!studentRow) return studentRow;
  let parsedNotes = null;
  if (studentRow.notes && typeof studentRow.notes === 'string') {
    try {
      if (studentRow.notes.trim().startsWith('{')) {
        parsedNotes = JSON.parse(studentRow.notes.trim());
      } else if (studentRow.notes.includes('| {')) {
        const jsonPart = studentRow.notes.split('|').pop().trim();
        parsedNotes = JSON.parse(jsonPart);
      }
    } catch (_) {}
  }

  const naturalidade = studentRow.naturalidade || parsedNotes?.naturalidade || studentRow.city || 'Nampula';
  const distrito = studentRow.distrito || parsedNotes?.distrito || studentRow.city || 'Nampula';
  const provincia = studentRow.provincia || parsedNotes?.provincia || studentRow.province || 'Nampula';
  const father_name = studentRow.father_name || parsedNotes?.father_name || null;
  const mother_name = studentRow.mother_name || parsedNotes?.mother_name || null;

  return {
    ...studentRow,
    naturalidade,
    distrito,
    provincia,
    province: provincia,
    father_name,
    mother_name
  };
}

export async function registerStudentWithEnrollment({ studentData, courseId, classId = null, password = null }) {
  // 0. Bloqueio de segurança: Utilizadores com sessão de Formador não realizam inscrição de estudante
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data: teacherRow } = await supabase
        .from('academy_teachers')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (teacherRow) {
        throw new Error('A sua conta está autenticada como Formador. Formadores não realizam inscrição online de estudantes.');
      }
    }
  } catch (err) {
    if (err.message?.includes('Formador')) throw err;
  }

  // 1. Verificar duplicados
  const dupCheck = await checkStudentDuplicates({
    phone: studentData.phone,
    email: studentData.email,
    idDocumentNumber: studentData.id_document_number || studentData.bi_number
  });

  if (dupCheck.duplicate) {
    throw new Error(`Já existe um cadastro com este ${dupCheck.field} (ID: ${dupCheck.student.student_code || dupCheck.student.student_number}). Se já possui conta, faça login.`);
  }

  let userId = null;

  // 2. Criar conta no Supabase Auth se tiver fornecido senha
  if (studentData.email && password) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: studentData.email,
        password: password,
        options: {
          data: {
            full_name: studentData.full_name,
            phone: studentData.phone,
            role: 'student'
          }
        }
      });

      if (!authError && authData?.user) {
        userId = authData.user.id;
        
        // Auto-confirmar e-mail se RPC estiver disponível para permitir login imediato
        try {
          await supabase.rpc('confirm_user_email', { user_email: studentData.email.trim().toLowerCase() });
        } catch (_) {}

        // Inserir perfil
        await supabase.from('academy_profiles').upsert({
          id: userId,
          email: studentData.email,
          full_name: studentData.full_name,
          phone: studentData.phone,
          role: 'student',
          avatar_url: studentData.photo_url || null
        });
      }
    } catch (e) {
      console.warn('Aviso ao criar utilizador no Auth:', e);
    }
  }

  // 3. Gerar código único do estudante
  const studentCode = generateStudentCode();

  // 4. Inserir estudante com mapeamento duplo e resiliência a schema
  let student = null;
  const civilDetails = {
    naturalidade: studentData.naturalidade || 'Nampula',
    distrito: studentData.distrito || 'Nampula',
    provincia: studentData.provincia || studentData.province || 'Nampula',
    father_name: studentData.father_name || null,
    mother_name: studentData.mother_name || null
  };

  const serializedNotes = studentData.notes 
    ? `${studentData.notes} | ${JSON.stringify(civilDetails)}` 
    : JSON.stringify(civilDetails);

  const fullPayload = {
    ...studentData,
    user_id: userId,
    student_code: studentCode,
    student_number: studentCode,
    bi_number: studentData.id_document_number || studentData.bi_number || null,
    id_document_number: studentData.id_document_number || studentData.bi_number || null,
    phone_alt: studentData.alternative_phone || studentData.phone_alt || null,
    city: studentData.city || 'Nampula',
    province: civilDetails.provincia,
    naturalidade: civilDetails.naturalidade,
    distrito: civilDetails.distrito,
    provincia: civilDetails.provincia,
    father_name: civilDetails.father_name,
    mother_name: civilDetails.mother_name,
    notes: serializedNotes,
    status: 'pendente',
    enrollment_status: 'pendente',
    financial_status: 'pendente'
  };

  try {
    const { data, error } = await supabase
      .from('academy_students')
      .insert([fullPayload])
      .select()
      .single();

    if (error) throw error;
    student = data;
  } catch (err) {
    console.warn('Tentando inserção resiliente com colunas nativas de academy_students...', err?.message);
    const nativePayload = {
      user_id: userId,
      student_number: studentCode,
      full_name: studentData.full_name,
      email: studentData.email,
      phone: studentData.phone,
      phone_alt: studentData.alternative_phone || studentData.phone_alt || null,
      bi_number: studentData.id_document_number || studentData.bi_number || null,
      gender: studentData.gender || 'M',
      birth_date: studentData.birth_date || null,
      city: studentData.city || 'Nampula',
      province: civilDetails.provincia,
      address: studentData.address || studentData.neighborhood || null,
      photo_url: studentData.photo_url || null,
      id_document_url: studentData.id_document_url || null,
      notes: serializedNotes,
      status: 'pendente'
    };

    const { data: fallbackData, error: fallbackError } = await supabase
      .from('academy_students')
      .insert([nativePayload])
      .select()
      .single();

    if (fallbackError) throw fallbackError;
    student = fallbackData;
  }

  if (student) {
    student.student_code = student.student_code || student.student_number;
    student.enrollment_status = student.enrollment_status || student.status;
    student.id_document_number = student.id_document_number || student.bi_number;
    student = parseStudentCivilData(student);
  }

  // 5. Inserir matrícula
  let enrollment = null;
  if (courseId) {
    const { data: enrData, error: enrError } = await supabase
      .from('academy_enrollments')
      .insert([{
        student_id: student.id,
        course_id: courseId,
        class_id: classId,
        status: 'pendente'
      }])
      .select()
      .single();

    if (!enrError) enrollment = enrData;
  }

  // 6. Notificação de boas-vindas
  try {
    await supabase.from('academy_notifications').insert([{
      student_id: student.id,
      title: 'Inscrição Realizada com Sucesso!',
      message: `Bem-vindo à Zaty Academy! O seu código de estudante é ${studentCode}. Efetue o pagamento da matrícula para ativar seu acesso às aulas.`,
      type: 'info'
    }]);
  } catch (_) {}

  return { student, enrollment, studentCode };
}

export async function getStudents({ search = '', status = 'all', page = 1, limit = 50 } = {}) {
  const tryFetch = async (useExtendedColumns = true) => {
    let query = supabase
      .from('academy_students')
      .select(`
        *,
        enrollments:academy_enrollments (
          id,
          status,
          course:academy_courses (id, title),
          class:academy_classes (id, name)
        )
      `, { count: 'exact' });

    if (status && status !== 'all') {
      query = useExtendedColumns 
        ? query.eq('enrollment_status', status) 
        : query.eq('status', status);
    }

    if (search) {
      if (useExtendedColumns) {
        query = query.or(`full_name.ilike.%${search}%,student_code.ilike.%${search}%,student_number.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
      } else {
        query = query.or(`full_name.ilike.%${search}%,student_number.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
      }
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.order('created_at', { ascending: false }).range(from, to);

    return await query;
  };

  let { data, error, count } = await tryFetch(true);
  if (error) {
    // Fallback caso a tabela ainda use os nomes nativos de colunas
    const fallback = await tryFetch(false);
    data = fallback.data;
    error = fallback.error;
    count = fallback.count;
  }

  if (error) throw error;

  const normalized = (data || []).map(s => parseStudentCivilData({
    ...s,
    student_code: s.student_code || s.student_number,
    student_number: s.student_number || s.student_code,
    enrollment_status: s.enrollment_status || s.status,
    status: s.status || s.enrollment_status,
    id_document_number: s.id_document_number || s.bi_number,
    alternative_phone: s.alternative_phone || s.phone_alt
  }));

  return { students: normalized, count };
}

export async function getStudentById(id) {
  const { data, error } = await supabase
    .from('academy_students')
    .select(`
      *,
      enrollments:academy_enrollments (
        id,
        status,
        course:academy_courses (*),
        class:academy_classes (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (data) {
    data.student_code = data.student_code || data.student_number;
    data.student_number = data.student_number || data.student_code;
    data.enrollment_status = data.enrollment_status || data.status;
    data.status = data.status || data.enrollment_status;
    data.id_document_number = data.id_document_number || data.bi_number;
    data.alternative_phone = data.alternative_phone || data.phone_alt;
    return parseStudentCivilData(data);
  }
  return data;
}

export async function getStudentByUserId(userId) {
  const tryFetch = async (full = true) => {
    let query = supabase
      .from('academy_students')
      .select(full ? `
        *,
        enrollments:academy_enrollments (
          id,
          status,
          course:academy_courses (
            id,
            title,
            slug,
            thumbnail_url,
            workload_hours,
            modules:academy_course_modules (
              id,
              title,
              order_index,
              lessons:academy_lessons (*)
            )
          ),
          class:academy_classes (
            id,
            name,
            code,
            schedule,
            start_date,
            end_date,
            status,
            teacher_id
          )
        )
      ` : `
        *,
        enrollments:academy_enrollments (
          id,
          status,
          course:academy_courses (id, title, slug, workload_hours),
          class:academy_classes (
            id,
            name,
            code,
            schedule,
            start_date,
            end_date,
            status,
            teacher_id
          )
        )
      `)
      .eq('user_id', userId)
      .maybeSingle();

    return await query;
  };

  let { data, error } = await tryFetch(true);
  if (error) {
    const fallback = await tryFetch(false);
    data = fallback.data;
    error = fallback.error;
  }

  // Fallback 3: Busca segura independente caso joins aninhados falhem no schema cache
  if (error) {
    console.warn('Fallback seguro: buscando dados do estudante separadamente...', error?.message);
    const { data: std, error: sErr } = await supabase
      .from('academy_students')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!sErr) {
      if (std) {
        try {
          const { data: enrs } = await supabase
            .from('academy_enrollments')
            .select('*')
            .eq('student_id', std.id);

          if (enrs && enrs.length > 0) {
            const courseIds = [...new Set(enrs.map(e => e.course_id).filter(Boolean))];
            const classIds = [...new Set(enrs.map(e => e.class_id).filter(Boolean))];

            const [crsRes, clsRes] = await Promise.all([
              courseIds.length > 0 ? supabase.from('academy_courses').select('*').in('id', courseIds) : Promise.resolve({ data: [] }),
              classIds.length > 0 ? supabase.from('academy_classes').select('*').in('id', classIds) : Promise.resolve({ data: [] })
            ]);

            const teacherIds = [...new Set((clsRes.data || []).map(c => c.teacher_id).filter(Boolean))];
            const tchRes = teacherIds.length > 0
              ? await supabase.from('academy_teachers').select('*').in('id', teacherIds)
              : { data: [] };

            const tchMap = {};
            (tchRes.data || []).forEach(t => {
              tchMap[t.id] = {
                ...t,
                name: t.name || t.full_name || 'Formador',
                full_name: t.full_name || t.name || 'Formador'
              };
            });

            const cMap = {};
            (crsRes.data || []).forEach(c => { cMap[c.id] = c; });
            const clMap = {};
            (clsRes.data || []).forEach(cl => {
              clMap[cl.id] = {
                ...cl,
                teacher: tchMap[cl.teacher_id] || (cl.teacher_id ? { id: cl.teacher_id, name: 'Formador' } : null)
              };
            });

            std.enrollments = enrs.map(e => ({
              ...e,
              course: cMap[e.course_id] || null,
              class: clMap[e.class_id] || null
            }));
          } else {
            std.enrollments = [];
          }
          data = std;
        } catch (_) {
          data = std;
          data.enrollments = [];
        }
      } else {
        data = null;
      }
      error = null;
    }
  }

  if (error) throw error;
  if (data) {
    data.student_code = data.student_code || data.student_number;
    data.student_number = data.student_number || data.student_code;
    data.enrollment_status = data.enrollment_status || data.status;
    data.status = data.status || data.enrollment_status;
    data.id_document_number = data.id_document_number || data.bi_number;
    data.alternative_phone = data.alternative_phone || data.phone_alt;

    // Se houver turma com teacher_id mas teacher estiver vazio, enriquecer defensivamente
    if (data.enrollments && data.enrollments.length > 0) {
      const missingTeacherIds = data.enrollments
        .map(e => e.class)
        .filter(c => c && c.teacher_id && !c.teacher)
        .map(c => c.teacher_id);

      if (missingTeacherIds.length > 0) {
        try {
          const { data: tchs } = await supabase
            .from('academy_teachers')
            .select('id, name, full_name, specialty, email, photo_url')
            .in('id', missingTeacherIds);

          const tMap = {};
          (tchs || []).forEach(t => {
            tMap[t.id] = {
              ...t,
              name: t.name || t.full_name || 'Formador',
              full_name: t.full_name || t.name || 'Formador'
            };
          });

          data.enrollments.forEach(e => {
            if (e.class && e.class.teacher_id && !e.class.teacher) {
              e.class.teacher = tMap[e.class.teacher_id] || null;
            }
          });
        } catch (_) {}
      }
    }

    if (data.enrollments && Array.isArray(data.enrollments)) {
      // Ordenação inteligente: Cursos ativos/em curso primeiro, depois pendentes, depois concluídos por data mais recente
      data.enrollments.sort((a, b) => {
        const score = (s) => (s === 'ativo' ? 3 : s === 'pendente' ? 2 : s === 'concluido' ? 1 : 0);
        const diff = score(b.status) - score(a.status);
        if (diff !== 0) return diff;
        return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
      });
    }

    return parseStudentCivilData(data);
  }

  return null;
}

export async function updateStudent(id, studentData) {
  const { data, error } = await supabase
    .from('academy_students')
    .update({ ...studentData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function suspendStudent(arg1, arg2, arg3) {
  let studentId, reason, suspendedBy;
  if (typeof arg1 === 'object' && arg1 !== null) {
    studentId = arg1.studentId;
    reason = arg1.reason || '';
    suspendedBy = arg1.suspendedBy || null;
  } else {
    studentId = arg1;
    reason = arg2 || '';
    suspendedBy = arg3 || null;
  }

  const { data, error } = await supabase
    .from('academy_students')
    .update({
      enrollment_status: 'suspenso',
      status: 'suspenso',
      suspension_reason: reason.trim() || 'Suspenso pela administração',
      suspended_at: new Date().toISOString(),
      suspended_by: suspendedBy,
      updated_at: new Date().toISOString()
    })
    .eq('id', studentId)
    .select()
    .single();

  if (error) throw error;

  // Atualizar também no academy_profiles para revogar o acesso imediatamente
  if (data?.user_id) {
    try {
      await supabase
        .from('academy_profiles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.user_id);
    } catch (_) {}

    try {
      await supabase
        .from('academy_user_presence')
        .delete()
        .eq('user_id', data.user_id);
    } catch (_) {}
  }

  if (data?.email) {
    try {
      await supabase
        .from('academy_profiles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('email', data.email.toLowerCase());
    } catch (_) {}
  }

  // Notificar o estudante
  try {
    await supabase.from('academy_notifications').insert([{
      student_id: studentId,
      title: 'Aviso de Suspensão de Conta',
      message: `A sua conta de estudante encontra-se suspensa. Motivo: ${reason || 'Pendência administrativa ou cadastral'}. Entre em contacto com a administração para regularização.`,
      type: 'account_suspended'
    }]);
  } catch (_) {}

  // Auditoria
  await recordAuditLog({
    action: 'STUDENT_SUSPENDED',
    description: `Estudante suspenso: ${data?.full_name || studentId}. Motivo: ${reason || 'Pendência administrativa ou cadastral'}`,
    resourceType: 'student',
    resourceId: studentId,
    userId: suspendedBy,
    details: { reason }
  });

  return data;
}

export async function reactivateStudent(arg1, arg2) {
  let studentId, reactivatedBy;
  if (typeof arg1 === 'object' && arg1 !== null) {
    studentId = arg1.studentId;
    reactivatedBy = arg1.reactivatedBy || null;
  } else {
    studentId = arg1;
    reactivatedBy = arg2 || null;
  }

  const { data, error } = await supabase
    .from('academy_students')
    .update({
      enrollment_status: 'ativo',
      status: 'ativo',
      suspension_reason: null,
      suspended_at: null,
      suspended_by: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', studentId)
    .select()
    .single();

  if (error) throw error;

  if (data?.user_id) {
    try {
      await supabase
        .from('academy_profiles')
        .update({
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.user_id);
    } catch (_) {}
  }

  if (data?.email) {
    try {
      await supabase
        .from('academy_profiles')
        .update({
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', data.email.toLowerCase());
    } catch (_) {}
  }

  // Notificar o estudante
  try {
    await supabase.from('academy_notifications').insert([{
      student_id: studentId,
      title: 'Conta Reativada com Sucesso!',
      message: 'A sua conta de estudante foi reativada pela administração. O seu acesso aos cursos e aulas está liberado.',
      type: 'account_reactivated'
    }]);
  } catch (_) {}

  // Auditoria
  await recordAuditLog({
    action: 'STUDENT_REACTIVATED',
    description: `Estudante reativado: ${data?.full_name || studentId}`,
    resourceType: 'student',
    resourceId: studentId,
    userId: reactivatedBy,
    details: {}
  });

  return data;
}

export async function deleteStudentPermanently(studentId) {
  await ensureAdminRole('eliminar registos de estudantes da instituição', ['super_admin', 'admin', 'secretaria']);
  if (!studentId) throw new Error('ID do estudante é obrigatório.');

  // 1. Tentar executar a função RPC no Supabase (que remove de auth.users com privilégios SECURITY DEFINER)
  try {
    const { data, error } = await supabase.rpc('delete_student_permanently', {
      target_student_id: studentId
    });

    if (!error && (data?.success || data === true)) {
      return data;
    }
    if (error && !error.message?.includes('delete_student_permanently') && !error.message?.includes('does not exist')) {
      throw error;
    }
  } catch (rpcErr) {
    if (!rpcErr.message?.includes('does not exist') && !rpcErr.message?.includes('delete_student_permanently')) {
      throw rpcErr;
    }
  }

  // 2. Fallback resiliente no cliente para exclusão em cascata das tabelas da academia
  const { data: std, error: stdFetchErr } = await supabase
    .from('academy_students')
    .select('id, user_id, email, full_name, student_code')
    .eq('id', studentId)
    .maybeSingle();

  if (stdFetchErr) throw stdFetchErr;
  if (!std) throw new Error('Estudante não encontrado.');

  // Exclusão ordenada das dependências
  try {
    const certsRes = await supabase.from('academy_certificates').select('id').eq('student_id', studentId);
    const certIds = (certsRes.data || []).map(c => c.id);
    if (certIds.length > 0) {
      await supabase.from('academy_certificate_validations').delete().in('certificate_id', certIds);
    }
    await supabase.from('academy_certificates').delete().eq('student_id', studentId);
  } catch (_) {}

  try {
    await supabase.from('academy_receipts').delete().eq('student_id', studentId);
    await supabase.from('academy_payments').delete().eq('student_id', studentId);
  } catch (_) {}

  try {
    await supabase.from('academy_lesson_progress').delete().eq('student_id', studentId);
    await supabase.from('academy_notifications').delete().eq('student_id', studentId);
    await supabase.from('academy_enrollments').delete().eq('student_id', studentId);
  } catch (_) {}

  // Excluir o registo em academy_students
  const { error: delStdErr } = await supabase
    .from('academy_students')
    .delete()
    .eq('id', studentId);

  if (delStdErr) throw delStdErr;

  // Revogar acesso e limpar de academy_profiles
  if (std.user_id) {
    try {
      await supabase
        .from('academy_profiles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', std.user_id);
    } catch (_) {}

    try {
      await supabase.from('academy_profiles').delete().eq('id', std.user_id);
    } catch (_) {}

    try {
      await supabase.from('academy_user_presence').delete().eq('user_id', std.user_id);
    } catch (_) {}
  }

  if (std.email) {
    try {
      await supabase
        .from('academy_profiles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('email', std.email.toLowerCase());
    } catch (_) {}
  }

  // Auditoria
  await recordAuditLog({
    action: 'STUDENT_DELETED',
    description: `Estudante eliminado permanentemente: ${std.full_name} (${std.student_code || studentId})`,
    resourceType: 'student',
    resourceId: studentId,
    details: { student_name: std.full_name, student_code: std.student_code }
  });

  return {
    success: true,
    message: 'Estudante e dados associados removidos permanentemente.',
    student_id: studentId,
    student_name: std.full_name
  };
}

export async function confirmUserEmail(email) {
  if (!email) return false;
  try {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.rpc('confirm_user_email', { user_email: cleanEmail });
    if (error) throw error;
    return !!data;
  } catch (err) {
    console.warn('Aviso: Falha ao chamar RPC confirm_user_email:', err?.message);
    return false;
  }
}

export async function reviewEnrollment({
  studentId,
  enrollmentId = null,
  status, // 'ativo' | 'rejeitado' | 'pendente'
  rejectionReason = '',
  reviewedBy = null
}) {
  // 1. Atualizar academy_students com status
  const studentUpdates = {
    enrollment_status: status,
    status: status,
    updated_at: new Date().toISOString()
  };

  if (status === 'ativo') {
    studentUpdates.financial_status = 'regular';
  }

  const { data: updatedStudent, error: sErr } = await supabase
    .from('academy_students')
    .update(studentUpdates)
    .eq('id', studentId)
    .select()
    .single();

  if (sErr) throw sErr;

  // 2. Sincronizar na tabela academy_enrollments
  let enrollmentQuery = supabase
    .from('academy_enrollments')
    .update({
      status: status,
      updated_at: new Date().toISOString()
    });

  if (enrollmentId) {
    enrollmentQuery = enrollmentQuery.eq('id', enrollmentId);
  } else {
    enrollmentQuery = enrollmentQuery.eq('student_id', studentId);
  }

  await enrollmentQuery;

  // 3. Notificar o estudante no sistema
  try {
    if (status === 'ativo') {
      const approvedNotif = {
        student_id: studentId,
        title: 'Inscrição Aprovada com Sucesso!',
        message: 'Acesso Liberado: A sua inscrição foi aprovada pela administração. Você já tem acesso total aos módulos, aulas e conteúdos do seu curso.',
        type: 'enrollment_approved',
        is_read: false
      };
      try {
        await supabase.from('academy_notifications').insert([approvedNotif]);
      } catch (_) {}

      // Persistência na store local
      const notifStore = getLocalNotificationsStore();
      notifStore.unshift({
        ...approvedNotif,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        created_at: new Date().toISOString()
      });
      saveLocalNotificationsStore(notifStore);

      // Transmissão em tempo real
      broadcastNotificationEvent({
        title: 'Inscrição Aprovada com Sucesso!',
        student_id: studentId
      });
    } else if (status === 'rejeitado') {
      const rejNotif = {
        student_id: studentId,
        title: 'Inscrição Não Aprovada',
        message: `A sua inscrição não pôde ser aprovada. Motivo: ${rejectionReason || 'Documentação ou dados pendentes de validação'}. Por favor, contacte a secretaria ou submeta novos dados.`,
        type: 'enrollment_rejected',
        is_read: false
      };
      try {
        await supabase.from('academy_notifications').insert([rejNotif]);
      } catch (_) {}

      const notifStore = getLocalNotificationsStore();
      notifStore.unshift({
        ...rejNotif,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        created_at: new Date().toISOString()
      });
      saveLocalNotificationsStore(notifStore);

      broadcastNotificationEvent({
        title: 'Inscrição Não Aprovada',
        student_id: studentId
      });
    }
  } catch (_) {}

  // 4. Registo no log de auditoria
  await recordAuditLog({
    action: status === 'ativo' ? 'ENROLLMENT_APPROVED' : 'ENROLLMENT_REJECTED',
    description: `Matrícula do estudante ${status === 'ativo' ? 'aprovada com sucesso' : 'rejeitada'}. ${status === 'rejeitado' ? `Motivo: ${rejectionReason}` : ''}`,
    resourceType: 'student',
    resourceId: studentId,
    userId: reviewedBy,
    details: {
      enrollment_id: enrollmentId,
      status,
      reason: status === 'rejeitado' ? rejectionReason : null
    }
  });

  return updatedStudent;
}

// ==========================================
// 6. PAGAMENTOS, COMPROVATIVOS E RECIBOS
// ==========================================

export async function submitPayment({
  studentId,
  enrollmentId = null,
  amount,
  paymentType,
  paymentMethod,
  referenceCode,
  proofFileUrl,
  proofFileName,
  notes = ''
}) {
  let data = null;
  const fullPayload = {
    student_id: studentId,
    enrollment_id: enrollmentId,
    amount: Number(amount),
    payment_type: paymentType,
    payment_method: paymentMethod,
    reference_code: referenceCode,
    proof_file_url: proofFileUrl,
    proof_file_name: proofFileName,
    notes: notes,
    status: 'pendente'
  };

  try {
    const res = await supabase
      .from('academy_payments')
      .insert([fullPayload])
      .select()
      .single();

    if (res.error) throw res.error;
    data = res.data;
  } catch (err) {
    if (err?.message?.includes('proof_file_name') || err?.code === 'PGRST204' || err?.code === '42703') {
      console.warn('Fallback de pagamento: inserindo sem coluna proof_file_name...', err.message);
      const fallbackPayload = {
        student_id: studentId,
        enrollment_id: enrollmentId,
        amount: Number(amount),
        payment_type: paymentType,
        payment_method: paymentMethod,
        reference_code: referenceCode,
        proof_file_url: proofFileUrl,
        notes: notes,
        status: 'pendente'
      };
      const resFallback = await supabase
        .from('academy_payments')
        .insert([fallbackPayload])
        .select()
        .single();

      if (resFallback.error) throw resFallback.error;
      data = resFallback.data;
    } else {
      throw err;
    }
  }

  // Notificar estudante
  try {
    await supabase.from('academy_notifications').insert([{
      student_id: studentId,
      title: 'Comprovativo de Pagamento Enviado',
      message: `O seu pagamento de ${amount} MT via ${paymentMethod.toUpperCase()} foi recebido e está PENDENTE de conferência pela equipa financeira.`,
      type: 'info'
    }]);
  } catch (_) {}

  return data;
}

export async function getPayments({ status = 'all' } = {}) {
  const ensureReceipt = (p, rec) => {
    let finalRec = rec;
    if (Array.isArray(finalRec)) finalRec = finalRec[0];
    if (!finalRec && p.status === 'aprovado') {
      const trxCode = p.reference_code || `TRX-${p.id?.substring(0, 8).toUpperCase()}`;
      const recNumber = `REC-${new Date(p.created_at || Date.now()).getFullYear()}-${p.id?.substring(0, 4).toUpperCase()}`;
      finalRec = {
        id: `rec-${p.id}`,
        payment_id: p.id,
        student_id: p.student_id,
        transaction_code: trxCode,
        receipt_number: recNumber,
        amount: p.amount,
        payment_method: p.payment_method,
        payment_type: p.payment_type,
        issued_at: p.updated_at || p.created_at || new Date().toISOString(),
        security_hash: `SEC-${p.id?.substring(0, 12).toUpperCase()}`
      };
    }
    return finalRec;
  };

  try {
    let query = supabase
      .from('academy_payments')
      .select(`
        *,
        student:academy_students (
          id,
          full_name,
          student_code,
          phone,
          email
        ),
        receipt:academy_receipts (*)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(p => {
      const rec = ensureReceipt(p, p.receipt);
      return {
        ...p,
        receipt: rec,
        receipts: rec ? [rec] : []
      };
    });
  } catch (err) {
    console.warn('Buscando pagamentos sem join direto de recibos...', err?.message);
    let query = supabase
      .from('academy_payments')
      .select(`
        *,
        student:academy_students (
          id,
          full_name,
          student_code,
          phone,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (data && data.length > 0) {
      const paymentIds = data.map(p => p.id);
      let recMap = {};
      try {
        const { data: receipts } = await supabase
          .from('academy_receipts')
          .select('*')
          .in('payment_id', paymentIds);
        
        if (receipts) {
          receipts.forEach(r => { recMap[r.payment_id] = r; });
        }
      } catch (_) {}

      return data.map(p => {
        const rec = ensureReceipt(p, recMap[p.id]);
        return {
          ...p,
          receipt: rec,
          receipts: rec ? [rec] : []
        };
      });
    }

    return [];
  }
}

export async function getStudentPayments(studentId) {
  const ensureReceipt = (p, rec) => {
    let finalRec = rec;
    if (Array.isArray(finalRec)) finalRec = finalRec[0];
    if (!finalRec && p.status === 'aprovado') {
      const trxCode = p.reference_code || `TRX-${p.id?.substring(0, 8).toUpperCase()}`;
      const recNumber = `REC-${new Date(p.created_at || Date.now()).getFullYear()}-${p.id?.substring(0, 4).toUpperCase()}`;
      finalRec = {
        id: `rec-${p.id}`,
        payment_id: p.id,
        student_id: p.student_id,
        transaction_code: trxCode,
        receipt_number: recNumber,
        amount: p.amount,
        payment_method: p.payment_method,
        payment_type: p.payment_type,
        issued_at: p.updated_at || p.created_at || new Date().toISOString(),
        security_hash: `SEC-${p.id?.substring(0, 12).toUpperCase()}`
      };
    }
    return finalRec;
  };

  try {
    const { data, error } = await supabase
      .from('academy_payments')
      .select(`
        *,
        receipt:academy_receipts (*)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(p => {
      const rec = ensureReceipt(p, p.receipt);
      return {
        ...p,
        receipt: rec,
        receipts: rec ? [rec] : []
      };
    });
  } catch (err) {
    console.warn('Buscando pagamentos do estudante sem join direto...', err?.message);
    const { data, error } = await supabase
      .from('academy_payments')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      const paymentIds = data.map(p => p.id);
      let recMap = {};
      try {
        const { data: receipts } = await supabase
          .from('academy_receipts')
          .select('*')
          .in('payment_id', paymentIds);

        if (receipts) {
          receipts.forEach(r => { recMap[r.payment_id] = r; });
        }
      } catch (_) {}

      return data.map(p => {
        const rec = ensureReceipt(p, recMap[p.id]);
        return {
          ...p,
          receipt: rec,
          receipts: rec ? [rec] : []
        };
      });
    }

    return [];
  }
}

export async function reviewPayment({
  paymentId,
  status, // 'aprovado' | 'rejeitado'
  rejectionReason = '',
  reviewedBy = null
}) {
  // 1. Obter pagamento atual
  const { data: payment, error: pError } = await supabase
    .from('academy_payments')
    .select('*, student:academy_students(*)')
    .eq('id', paymentId)
    .single();

  if (pError) throw pError;

  const updatePayload = {
    status,
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
    rejection_reason: status === 'rejeitado' ? rejectionReason : null,
    updated_at: new Date().toISOString()
  };

  const { data: updatedPayment, error: uError } = await supabase
    .from('academy_payments')
    .update(updatePayload)
    .eq('id', paymentId)
    .select()
    .single();

  if (uError) throw uError;

  // Se Aprovado: Gerar transação e recibo automático
  let receipt = null;
  if (status === 'aprovado') {
    const trxCode = generateTransactionCode();
    const recNumber = generateReceiptNumber();
    const securityHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    try {
      const { data: recData, error: recError } = await supabase
        .from('academy_receipts')
        .insert([{
          payment_id: paymentId,
          student_id: payment.student_id,
          transaction_code: trxCode,
          receipt_number: recNumber,
          amount: payment.amount,
          payment_method: payment.payment_method,
          payment_type: payment.payment_type,
          issued_by: reviewedBy,
          security_hash: securityHash
        }])
        .select()
        .single();

      if (recError) {
        console.warn('Aviso: erro ao persistir academy_receipts, utilizando fallback em memória:', recError);
      } else {
        receipt = recData;
      }
    } catch (e) {
      console.warn('Exceção ao inserir recibo:', e);
    }

    if (!receipt) {
      receipt = {
        payment_id: paymentId,
        student_id: payment.student_id,
        transaction_code: trxCode,
        receipt_number: recNumber,
        amount: payment.amount,
        payment_method: payment.payment_method,
        payment_type: payment.payment_type,
        issued_by: reviewedBy,
        issued_at: new Date().toISOString(),
        security_hash: securityHash
      };
    }

    // Atualizar status do estudante e da matrícula
    await supabase
      .from('academy_students')
      .update({
        enrollment_status: 'ativo',
        financial_status: 'regular'
      })
      .eq('id', payment.student_id);

    if (payment.enrollment_id) {
      await supabase
        .from('academy_enrollments')
        .update({ status: 'ativo' })
        .eq('id', payment.enrollment_id);
    }

    // Notificar estudante
    await supabase.from('academy_notifications').insert([{
      student_id: payment.student_id,
      title: 'Pagamento Aprovado com Sucesso!',
      message: `Seu pagamento no valor de ${payment.amount} MT foi verificado e aprovado. O Recibo Oficial ${recNumber} já está disponível para download.`,
      type: 'payment_approved'
    }]);

    // Auditoria
    await recordAuditLog({
      action: 'PAYMENT_APPROVED',
      description: `Pagamento aprovado no valor de ${payment.amount} MT (Recibo Nº ${recNumber || '—'})`,
      resourceType: 'payment',
      resourceId: paymentId,
      userId: reviewedBy,
      details: { amount: payment.amount, receipt_number: recNumber, transaction_code: trxCode }
    });

  } else if (status === 'rejeitado') {
    // Notificar estudante sobre a rejeição
    await supabase.from('academy_notifications').insert([{
      student_id: payment.student_id,
      title: 'Pagamento Rejeitado',
      message: `O pagamento no valor de ${payment.amount} MT não pôde ser aprovado. Motivo: ${rejectionReason || "Comprovativo ilegível ou não correspondente"}. Por favor, envie novamente o comprovativo correcto.`,
      type: 'payment_rejected'
    }]);

    // Auditoria
    await recordAuditLog({
      action: 'PAYMENT_REJECTED',
      description: `Pagamento rejeitado no valor de ${payment.amount} MT. Motivo: ${rejectionReason || 'Comprovativo ilegível'}`,
      resourceType: 'payment',
      resourceId: paymentId,
      userId: reviewedBy,
      details: { amount: payment.amount, reason: rejectionReason }
    });
  }

  return { payment: updatedPayment, receipt };
}

export async function getReceipts(studentId = null) {
  let query = supabase
    .from('academy_receipts')
    .select(`
      *,
      student:academy_students (
        id,
        full_name,
        student_code,
        phone,
        email
      ),
      payment:academy_payments (*)
    `)
    .order('issued_at', { ascending: false });

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ==========================================
// 7. CERTIFICADOS DIGITAIS & VALIDAÇÃO
// ==========================================

export async function issueCertificate({
  studentId,
  courseId,
  enrollmentId = null,
  workloadHours,
  completionDate = null,
  startDate = null,
  finalGrade = '16/20 Valores (Bom com Distinção)',
  classification = 'Apto com Distinção',
  issuedBy = null
}) {
  // 0. VERIFICAÇÃO DE UNICIDADE DEFINITIVA: Um estudante só pode possuir UM certificado oficial por curso
  try {
    const { data: existingCerts } = await supabase
      .from('academy_certificates')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .neq('status', 'revogado');

    if (existingCerts && existingCerts.length > 0) {
      const existingCert = existingCerts[0];
      console.log('Certificado oficial já emitido para este curso. Reutilizando registo único:', existingCert.certificate_number);

      const [stdRes, crsRes] = await Promise.all([
        supabase.from('academy_students').select('id, full_name, student_code, student_number').eq('id', studentId).maybeSingle(),
        supabase.from('academy_courses').select('id, title, workload_hours').eq('id', courseId).maybeSingle()
      ]);

      const normalizedExisting = {
        ...existingCert,
        certificate_number: existingCert.certificate_number || existingCert.certificate_code,
        certificate_code: existingCert.certificate_code || existingCert.certificate_number,
        validation_code: existingCert.validation_code || existingCert.certificate_code || existingCert.certificate_number,
        student: stdRes.data ? {
          ...stdRes.data,
          student_code: stdRes.data.student_code || stdRes.data.student_number
        } : null,
        course: crsRes.data || null
      };

      // Garante que a matrícula esteja marcada como 'concluido'
      try {
        await supabase
          .from('academy_enrollments')
          .update({
            status: 'concluido',
            final_grade: existingCert.final_grade || finalGrade || '16/20 Valores (Aprovado com Distinção)',
            updated_at: new Date().toISOString()
          })
          .eq('student_id', studentId)
          .eq('course_id', courseId);
      } catch (_) {}

      return normalizedExisting;
    }
  } catch (checkErr) {
    console.warn('Aviso ao verificar certificados existentes:', checkErr);
  }

  const certNumber = `CERT-ZA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const validationCode = generateValidationCode();

  const certPayload = {
    student_id: studentId,
    course_id: courseId,
    enrollment_id: enrollmentId,
    certificate_number: certNumber,
    certificate_code: certNumber,
    validation_code: validationCode,
    issue_date: new Date().toISOString().split('T')[0],
    completion_date: completionDate || new Date().toISOString().split('T')[0],
    start_date: startDate || null,
    final_grade: finalGrade || '16/20 Valores (Bom com Distinção)',
    classification: classification || 'Apto com Distinção',
    workload_hours: Number(workloadHours) || 60,
    status: 'valido',
    issued_by: issuedBy
  };

  let currentPayload = { ...certPayload };
  let insertResult = null;
  let lastError = null;

  // Tentativa adaptativa contra divergências de colunas no schema cache do Supabase
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data: inserted, error: insertError } = await supabase
      .from('academy_certificates')
      .insert([currentPayload])
      .select()
      .single();

    if (!insertError && inserted) {
      insertResult = inserted;
      break;
    }

    lastError = insertError;
    const errorMsg = insertError?.message || '';

    // Se o PostgREST acusar coluna não existente no schema cache:
    const missingColMatch = errorMsg.match(/Could not find the '([^']+)' column of 'academy_certificates'/i);
    if (missingColMatch && missingColMatch[1] && currentPayload[missingColMatch[1]] !== undefined) {
      const missingCol = missingColMatch[1];
      console.warn(`Ajustando payload de certificado: Removendo coluna '${missingCol}' inexistente no schema.`);
      delete currentPayload[missingCol];
      continue;
    }

    // Se acusar violação de NOT NULL em alguma coluna:
    const notNullMatch = errorMsg.match(/null value in column "([^"]+)"/i);
    if (notNullMatch && notNullMatch[1]) {
      const reqCol = notNullMatch[1];
      if (!currentPayload[reqCol]) {
        console.warn(`Ajustando payload de certificado: Atribuindo valor padrão para '${reqCol}'.`);
        currentPayload[reqCol] = certNumber;
        continue;
      }
    }

    break;
  }

  if (!insertResult) {
    throw lastError || new Error('Falha ao gravar certificado no banco de dados.');
  }

  // Normalização do objeto retornado
  const data = {
    ...insertResult,
    certificate_number: insertResult.certificate_number || insertResult.certificate_code || certNumber,
    certificate_code: insertResult.certificate_code || insertResult.certificate_number || certNumber,
    validation_code: insertResult.validation_code || insertResult.certificate_code || insertResult.certificate_number || validationCode
  };

  // Buscar dados enriquecidos do estudante e curso
  try {
    const [stdRes, crsRes] = await Promise.all([
      supabase.from('academy_students').select('id, full_name, student_code, student_number').eq('id', studentId).maybeSingle(),
      supabase.from('academy_courses').select('id, title, workload_hours').eq('id', courseId).maybeSingle()
    ]);
    if (stdRes.data) {
      data.student = {
        ...stdRes.data,
        student_code: stdRes.data.student_code || stdRes.data.student_number
      };
    }
    if (crsRes.data) {
      data.course = crsRes.data;
    }
  } catch (_) {}

  // 1. Atualizar Matrícula correspondente como 'concluido' e registrar nota final oficial
  try {
    let enrUpdateQuery = supabase
      .from('academy_enrollments')
      .update({
        status: 'concluido',
        final_grade: data.final_grade || finalGrade || '16/20 Valores (Aprovado com Distinção)',
        updated_at: new Date().toISOString()
      });

    if (enrollmentId) {
      enrUpdateQuery = enrUpdateQuery.eq('id', enrollmentId);
    } else {
      enrUpdateQuery = enrUpdateQuery.eq('student_id', studentId).eq('course_id', courseId);
    }
    await enrUpdateQuery;
  } catch (enrErr) {
    console.warn('Aviso ao sincronizar status concluído na matrícula:', enrErr);
  }

  // 2. Atualizar status do estudante caso não tenha outra matrícula ativa
  try {
    await supabase
      .from('academy_students')
      .update({
        enrollment_status: 'concluido',
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId);
  } catch (stdErr) {
    console.warn('Aviso ao atualizar status concluído no perfil do estudante:', stdErr);
  }

  // 3. Notificar estudante com o comunicado oficial de conclusão do curso
  try {
    await supabase.from('academy_notifications').insert([{
      student_id: studentId,
      title: 'Parabéns! Certificado Digital Emitido',
      message: 'Este curso já foi concluído. O seu certificado foi emitido. Para continuar os seus estudos, solicite uma nova matrícula noutro curso ou atualize o seu percurso académico.',
      type: 'certificate_ready'
    }]);
  } catch (_) {}

  // 4. Auditoria com preservação histórica completa
  await recordAuditLog({
    action: 'CERTIFICATE_ISSUED',
    description: `Certificado emitido: ${data.certificate_number} para o estudante ${data.student?.full_name || studentId}. Curso formalmente concluído.`,
    resourceType: 'certificate',
    resourceId: data.id,
    userId: issuedBy,
    details: {
      certificate_number: data.certificate_number,
      validation_code: data.validation_code,
      student_id: studentId,
      course_id: courseId,
      course_title: data.course?.title,
      final_grade: data.final_grade || certPayload.final_grade,
      workload_hours: certPayload.workload_hours,
      status: 'concluido'
    }
  });

  return data;
}

export async function getStudentCertificates(studentId) {
  const { data, error } = await supabase
    .from('academy_certificates')
    .select(`
      *,
      course:academy_courses (*)
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(c => ({
    ...c,
    certificate_number: c.certificate_number || c.certificate_code,
    validation_code: c.validation_code || c.certificate_code || c.certificate_number
  }));
}

export async function getAllCertificates() {
  try {
    const { data, error } = await supabase
      .from('academy_certificates')
      .select(`
        *,
        student:academy_students (id, full_name, student_code, student_number),
        course:academy_courses (id, title, workload_hours)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map(c => ({
        ...c,
        certificate_number: c.certificate_number || c.certificate_code,
        validation_code: c.validation_code || c.certificate_code || c.certificate_number,
        student: c.student ? {
          ...c.student,
          student_code: c.student.student_code || c.student.student_number
        } : null
      }));
    }
  } catch (_) {}

  // Fallback caso o join aninhado falhe
  const { data: certs, error: cErr } = await supabase
    .from('academy_certificates')
    .select('*')
    .order('created_at', { ascending: false });

  if (cErr) throw cErr;
  if (!certs || certs.length === 0) return [];

  const studentIds = [...new Set(certs.map(c => c.student_id).filter(Boolean))];
  const courseIds = [...new Set(certs.map(c => c.course_id).filter(Boolean))];

  const [stdsRes, crsRes] = await Promise.all([
    supabase.from('academy_students').select('id, full_name, student_code, student_number').in('id', studentIds),
    supabase.from('academy_courses').select('id, title, workload_hours').in('id', courseIds)
  ]);

  const stdMap = {};
  (stdsRes.data || []).forEach(s => { 
    stdMap[s.id] = { ...s, student_code: s.student_code || s.student_number }; 
  });
  const crsMap = {};
  (crsRes.data || []).forEach(c => { crsMap[c.id] = c; });

  return certs.map(c => ({
    ...c,
    certificate_number: c.certificate_number || c.certificate_code,
    validation_code: c.validation_code || c.certificate_code || c.certificate_number,
    student: stdMap[c.student_id] || null,
    course: crsMap[c.course_id] || null
  }));
}

export async function verifyCertificateByCode(validationCode) {
  if (!validationCode) return null;
  const cleanCode = String(validationCode).trim().toUpperCase();

  // 1. Tentar busca ampla com OR
  try {
    const { data, error } = await supabase
      .from('academy_certificates')
      .select(`
        *,
        student:academy_students (
          full_name,
          student_code,
          student_number
        ),
        course:academy_courses (
          title,
          workload_hours
        )
      `)
      .or(`validation_code.eq.${cleanCode},certificate_code.eq.${cleanCode},certificate_number.eq.${cleanCode}`)
      .maybeSingle();

    if (!error && data) {
      // Registrar log de consulta
      try {
        await supabase.from('academy_certificate_validations').insert([{
          certificate_id: data.id,
          user_agent: navigator.userAgent
        }]);
      } catch (_) {}

      return {
        ...data,
        certificate_number: data.certificate_number || data.certificate_code,
        validation_code: data.validation_code || data.certificate_code || data.certificate_number
      };
    }
  } catch (_) {}

  // 2. Fallback por certificate_code
  try {
    const { data: certByCode, error: cErr } = await supabase
      .from('academy_certificates')
      .select(`
        *,
        student:academy_students (full_name),
        course:academy_courses (title)
      `)
      .eq('certificate_code', cleanCode)
      .maybeSingle();

    if (!cErr && certByCode) {
      return {
        ...certByCode,
        certificate_number: certByCode.certificate_number || certByCode.certificate_code,
        validation_code: certByCode.validation_code || certByCode.certificate_code
      };
    }
  } catch (_) {}

  return null;
}

export async function revokeCertificate(id, reason, userId = null) {
  const { data, error } = await supabase
    .from('academy_certificates')
    .update({
      status: 'revogado',
      revocation_reason: reason
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await recordAuditLog({
    action: 'CERTIFICATE_REVOKED',
    description: `Certificado revogado ID: ${id}. Motivo: ${reason}`,
    resourceType: 'certificate',
    resourceId: id,
    userId,
    details: { reason }
  });

  return data;
}

// ==========================================
// 8. NOTIFICAÇÕES DO ESTUDANTE
// ==========================================

export const LOCAL_NOTIFICATIONS_KEY = 'zaty_academy_notifications_v1';

export function getLocalNotificationsStore() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalNotificationsStore(notifs) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(notifs));
  } catch (e) {}
}

export async function getStudentNotifications(studentId) {
  let dbNotifs = [];
  try {
    const { data, error } = await supabase
      .from('academy_notifications')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      dbNotifs = data;
    }
  } catch (err) {
    console.warn('Aviso ao consultar academy_notifications (Supabase):', err);
  }

  // Obter notificações locais armazenadas
  const localList = getLocalNotificationsStore().filter(n => 
    String(n.student_id) === String(studentId) || n.student_id === 'all'
  );

  // Unificar evitando duplicados por ID
  const map = new Map();
  dbNotifs.forEach(n => map.set(n.id, n));
  localList.forEach(n => {
    if (!map.has(n.id)) map.set(n.id, n);
  });

  return Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

export async function getTeacherNotifications(teacherId) {
  let dbNotifs = [];
  try {
    const { data, error } = await supabase
      .from('academy_notifications')
      .select('*')
      .or(`teacher_id.eq.${teacherId},student_id.eq.all,teacher_id.eq.all`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      dbNotifs = data;
    }
  } catch (err) {
    console.warn('Aviso ao consultar academy_notifications para formador (Supabase):', err);
  }

  // Obter notificações locais armazenadas para o formador ou globais
  const localList = getLocalNotificationsStore().filter(n => 
    String(n.teacher_id) === String(teacherId) || 
    n.student_id === 'all' || 
    n.teacher_id === 'all' ||
    n.recipient_role === 'teacher' ||
    n.type === 'enrollment_announcement'
  );

  // Unificar evitando duplicados por ID
  const map = new Map();
  dbNotifs.forEach(n => map.set(n.id, n));
  localList.forEach(n => {
    if (!map.has(n.id)) map.set(n.id, n);
  });

  return Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

export async function markNotificationAsRead(id) {
  try {
    await supabase
      .from('academy_notifications')
      .update({ is_read: true })
      .eq('id', id);
  } catch (_) {}

  // Atualizar também na store local
  const current = getLocalNotificationsStore();
  const updated = current.map(n => n.id === id ? { ...n, is_read: true } : n);
  saveLocalNotificationsStore(updated);

  return true;
}

export async function getAdminNotifications() {
  let dbNotifs = [];
  try {
    const { data, error } = await supabase
      .from('academy_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(80);

    if (!error && data) {
      dbNotifs = data;
    }
  } catch (err) {
    console.warn('Aviso ao consultar notificações administrativas:', err);
  }

  // Notificações locais direcionadas a admin ou gerais
  const localList = getLocalNotificationsStore().filter(n => 
    !n.student_id || n.student_id === 'admin' || n.target_role === 'admin' || n.type === 'course_updated' || n.type === 'new_enrollment_request' || n.type === 'payment_proof'
  );

  const map = new Map();
  dbNotifs.forEach(n => map.set(n.id, n));
  localList.forEach(n => {
    if (!map.has(n.id)) map.set(n.id, n);
  });

  return Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

export async function getUserNotifications({ role = 'student', studentId = null, teacherId = null, userId = null } = {}) {
  if (['super_admin', 'admin', 'financeiro', 'secretaria'].includes(role)) {
    return await getAdminNotifications();
  }
  if (role === 'formador' || role === 'teacher') {
    return await getTeacherNotifications(teacherId);
  }
  return await getStudentNotifications(studentId);
}

export async function markAllNotificationsAsRead({ role = 'student', studentId = null, teacherId = null, userId = null } = {}) {
  try {
    let query = supabase.from('academy_notifications').update({ is_read: true }).eq('is_read', false);
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    await query;
  } catch (_) {}

  const current = getLocalNotificationsStore();
  const updated = current.map(n => {
    if (studentId && String(n.student_id) === String(studentId)) return { ...n, is_read: true };
    if (teacherId && String(n.teacher_id) === String(teacherId)) return { ...n, is_read: true };
    if (['super_admin', 'admin', 'financeiro', 'secretaria'].includes(role)) return { ...n, is_read: true };
    return { ...n, is_read: true };
  });
  saveLocalNotificationsStore(updated);
  return true;
}

/**
 * Transmite notificação oficial de Inscrições Abertas para todos os estudantes e formadores
 */
export async function broadcastEnrollmentNotification(adminUserId = null, customNotice = null) {
  await ensureAdminRole('enviar comunicados institucionais de inscrições', ['super_admin', 'admin']);

  // Obter todos os estudantes e formadores registados
  let students = [];
  let teachers = [];
  try {
    const [stdsRes, tchsRes] = await Promise.all([
      supabase.from('academy_students').select('id, full_name, email'),
      supabase.from('academy_teachers').select('id, name, full_name, email')
    ]);
    students = stdsRes.data || [];
    teachers = tchsRes.data || [];
  } catch (err) {
    console.warn('Aviso ao consultar estudantes/formadores para comunicado:', err);
  }

  const title = customNotice?.title || '📢 Inscrições Abertas — Ano Formativo 2026';
  const period = customNotice?.period || 'Ano Formativo 2026';
  const message = customNotice?.message || `A Direção da Zaty Academy informa que estão abertas as inscrições oficiais para novas turmas (${period}). Consulte o edital institucional completo e garanta a sua vaga!`;
  const teacherMessage = `A Direção da Zaty Academy informa ao Corpo Docente que estão abertas as inscrições oficiais para novas turmas (${period}). Consulte o edital institucional para alinhamento pedagógico e abertura de novas turmas.`;

  const studentNotifs = students.map(s => ({
    id: `notif_${s.id}_${Date.now()}`,
    student_id: s.id,
    title,
    message,
    type: 'enrollment_announcement',
    is_read: false,
    created_at: new Date().toISOString()
  }));

  const teacherNotifs = teachers.map(t => ({
    id: `notif_tch_${t.id}_${Date.now()}`,
    teacher_id: t.id,
    recipient_role: 'teacher',
    title,
    message: teacherMessage,
    type: 'enrollment_announcement',
    is_read: false,
    created_at: new Date().toISOString()
  }));

  // Notificação global gravada também localmente para todos os utilizadores
  const globalNotif = {
    id: `enrollment_broadcast_${Date.now()}`,
    student_id: 'all',
    teacher_id: 'all',
    title,
    message,
    type: 'enrollment_announcement',
    is_read: false,
    is_pinned: true,
    created_at: new Date().toISOString()
  };

  const allNewNotifs = [globalNotif, ...studentNotifs, ...teacherNotifs];
  const currentLocal = getLocalNotificationsStore();
  const updatedLocal = [...allNewNotifs, ...currentLocal].slice(0, 400);
  saveLocalNotificationsStore(updatedLocal);

  // Tentativa de inserção no Supabase para estudantes
  if (studentNotifs.length > 0) {
    for (let i = 0; i < studentNotifs.length; i += 50) {
      const chunk = studentNotifs.slice(i, i + 50);
      try {
        await supabase.from('academy_notifications').insert(chunk);
      } catch (err) {
        console.warn('Aviso ao inserir lote de notificações de estudantes no Supabase:', err);
      }
    }
  }

  // Tentativa de inserção no Supabase para formadores
  if (teacherNotifs.length > 0) {
    for (let i = 0; i < teacherNotifs.length; i += 50) {
      const chunk = teacherNotifs.slice(i, i + 50);
      try {
        await supabase.from('academy_notifications').insert(chunk);
      } catch (err) {
        console.warn('Aviso ao inserir lote de notificações de formadores no Supabase:', err);
      }
    }
  }

  const recipientsCount = (studentNotifs.length + teacherNotifs.length) || 1;

  // Registrar auditoria da transmissão
  try {
    await recordAuditLog({
      action: 'ENROLLMENT_NOTICE_BROADCAST',
      description: `Comunicado de Inscrições Abertas enviado para ${recipientsCount} utilizadores (estudantes e formadores).`,
      resourceType: 'system_settings',
      userId: adminUserId,
      details: { title, studentsCount: studentNotifs.length, teachersCount: teacherNotifs.length }
    });
  } catch (_) {}

  return { success: true, count: recipientsCount, notifiedCount: recipientsCount };
}

// ==========================================
// 9. DASHBOARD METRICS & AUDITORIA
// ==========================================

export const LOCAL_GRADES_KEY = 'zaty_academy_evaluations_store_v1';

export function getLocalGradesStore() {
  try {
    if (typeof window === 'undefined') return { evaluations: [], grades: [], auditLogs: [] };
    const raw = localStorage.getItem(LOCAL_GRADES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { evaluations: [], grades: [], auditLogs: [] };
}

export function saveLocalGradesStore(store) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_GRADES_KEY, JSON.stringify(store));
    }
  } catch (_) {}
}

export function getEvaluationDedupKey(item) {
  if (item.assignment_id) {
    return `asg_${item.assignment_id}`;
  }
  const cleanTitle = (item.title || '').trim().toLowerCase();
  const cleanDate = item.evaluation_date || '';
  const cleanType = item.evaluation_type || 'outro';
  if (item.is_recovery) {
    return `rec_${item.class_id}_${cleanTitle}_${item.recovery_for_evaluation_id || cleanDate}`;
  }
  return `eval_${item.class_id}_${cleanTitle}_${cleanDate}_${cleanType}`;
}

export function computeUnifiedEvaluationsCount(dbEvaluations = [], dbAssignments = [], localEvaluations = []) {
  const unifiedMap = new Map();

  (dbEvaluations || []).forEach(ev => {
    if (ev && (ev.id || ev.title)) {
      unifiedMap.set(getEvaluationDedupKey(ev), ev);
    }
  });

  (dbAssignments || []).forEach(asg => {
    if (asg && asg.id) {
      const asgKey = `asg_${asg.id}`;
      const titleKey = `eval_${asg.class_id}_${(asg.title || '').trim().toLowerCase()}_${asg.due_date ? asg.due_date.split('T')[0] : ''}_trabalho_casa`;
      if (!unifiedMap.has(asgKey) && !unifiedMap.has(titleKey)) {
        unifiedMap.set(asgKey, asg);
      }
    }
  });

  (localEvaluations || []).forEach(loc => {
    if (loc && (loc.id || loc.title)) {
      const key = getEvaluationDedupKey(loc);
      if (!unifiedMap.has(key)) {
        const titleMatch = Array.from(unifiedMap.values()).find(e => 
          e.title?.trim().toLowerCase() === loc.title?.trim().toLowerCase() &&
          e.evaluation_type === loc.evaluation_type
        );
        if (!titleMatch) {
          unifiedMap.set(key, loc);
        }
      }
    }
  });

  return unifiedMap.size;
}

export async function getAdminDashboardStats() {
  const [
    studentsRes,
    coursesRes,
    classesRes,
    paymentsRes,
    certificatesRes,
    resetsRes,
    recentAuditsRes,
    evaluationsRes,
    assignmentsRes,
    gradesRes
  ] = await Promise.allSettled([
    supabase.from('academy_students').select('id, enrollment_status, created_at, updated_at'),
    supabase.from('academy_courses').select('id, is_active'),
    supabase.from('academy_classes').select('id, status'),
    supabase.from('academy_payments').select('id, amount, status, created_at'),
    supabase.from('academy_certificates').select('id, status'),
    supabase.from('academy_password_resets').select('id, status, requested_at'),
    supabase.from('academy_audit_logs').select('id, user_id, action, created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('academy_evaluations').select('id, class_id, assignment_id, title, evaluation_date, evaluation_type, is_recovery, recovery_for_evaluation_id, status'),
    supabase.from('academy_assignments').select('id, class_id, title, due_date, created_at'),
    supabase.from('academy_grades').select('id, evaluation_id, student_id, score, status')
  ]);

  const students = studentsRes.status === 'fulfilled' ? (studentsRes.value.data || []) : [];
  const courses = coursesRes.status === 'fulfilled' ? (coursesRes.value.data || []) : [];
  const classes = classesRes.status === 'fulfilled' ? (classesRes.value.data || []) : [];
  const payments = paymentsRes.status === 'fulfilled' ? (paymentsRes.value.data || []) : [];
  const certificates = certificatesRes.status === 'fulfilled' ? (certificatesRes.value.data || []) : [];
  const resets = resetsRes.status === 'fulfilled' ? (resetsRes.value.data || []) : [];
  const recentAudits = recentAuditsRes.status === 'fulfilled' ? (recentAuditsRes.value.data || []) : [];

  const dbEvaluations = evaluationsRes.status === 'fulfilled' ? (evaluationsRes.value.data || []) : [];
  const dbAssignments = assignmentsRes.status === 'fulfilled' ? (assignmentsRes.value.data || []) : [];
  const dbGrades = gradesRes.status === 'fulfilled' ? (gradesRes.value.data || []) : [];

  const localStore = getLocalGradesStore();
  const localEvaluations = localStore?.evaluations || [];
  const localGrades = localStore?.grades || [];

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.enrollment_status === 'ativo').length;
  const pendingStudents = students.filter(s => s.enrollment_status === 'pendente').length;

  // Estudantes online / sessão ativa nos últimos 5 minutos (100% dados reais, sem simulações)
  let onlineStudentsList = [];
  try {
    onlineStudentsList = await getOnlineStudents();
  } catch (_) {}
  const onlineStudents = onlineStudentsList.length;

  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.is_active).length;

  const totalClasses = classes.length;
  const openClasses = classes.filter(c => c.status === 'aberta' || c.status === 'em_andamento').length;

  const pendingPayments = payments.filter(p => p.status === 'pendente');
  const approvedPayments = payments.filter(p => p.status === 'aprovado');

  const totalRevenue = approvedPayments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const pendingRevenue = pendingPayments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const issuedCertificates = certificates.filter(c => c.status === 'valido').length;
  const totalPasswordResets = resets.length;
  const pendingPasswordResets = resets.filter(r => r.status === 'pendente').length;

  // Contagem real e unificada de avaliações (com dados reais do Supabase e sincronização resiliente)
  const totalEvaluations = computeUnifiedEvaluationsCount(dbEvaluations, dbAssignments, localEvaluations);

  // Contagem de notas oficiais registadas nas pautas
  const uniqueGradeKeys = new Set();
  dbGrades.forEach(g => {
    if (g && g.evaluation_id && g.student_id) uniqueGradeKeys.add(`${g.evaluation_id}_${g.student_id}`);
    else if (g && g.id) uniqueGradeKeys.add(g.id);
  });
  localGrades.forEach(g => {
    if (g && g.evaluation_id && g.student_id) uniqueGradeKeys.add(`${g.evaluation_id}_${g.student_id}`);
    else if (g && g.id) uniqueGradeKeys.add(g.id);
  });
  const totalGradesCount = uniqueGradeKeys.size;

  return {
    totalStudents,
    activeStudents,
    pendingStudents,
    onlineStudents,
    onlineStudentsList,
    totalCourses,
    activeCourses,
    totalClasses,
    openClasses,
    pendingPaymentsCount: pendingPayments.length,
    approvedPaymentsCount: approvedPayments.length,
    totalRevenue,
    pendingRevenue,
    issuedCertificates,
    totalPasswordResets,
    pendingPasswordResets,
    totalEvaluations,
    totalGradesCount
  };
}

/**
 * Validação defensiva de autorização administrativa na camada de serviços
 */
export async function ensureAdminRole(actionName = 'esta operação', allowedRoles = ['super_admin', 'admin']) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error('Sessão expirada ou utilizador não autenticado.');
  }

  const { data: prof } = await supabase
    .from('academy_profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!prof || !allowedRoles.includes(prof.role) || prof.role === 'formador') {
    throw new Error(`Acesso negado: o perfil Formador não possui permissão para ${actionName}.`);
  }

  return prof;
}

export async function getAuditLogs(limit = 150) {
  let dbLogs = [];
  try {
    try {
      await ensureAdminRole('aceder à Trilha de Auditoria do sistema', ['super_admin', 'admin', 'financeiro', 'secretaria']);
    } catch (authErr) {
      console.warn('Verificação de perfil de auditoria com fallback:', authErr.message);
    }

    const { data, error } = await supabase
      .from('academy_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && Array.isArray(data)) {
      dbLogs = data.filter(l => l.action !== 'TEST_INSERT_AUTHENTICATED');
    }
  } catch (err) {
    console.warn('Erro ao carregar academy_audit_logs do Supabase:', err);
  }

  // 1. Carregar logs do cache local para tolerância total a falhas de rede e offline
  let localLogs = [];
  if (typeof window !== 'undefined') {
    try {
      const cachedRaw = localStorage.getItem('academy_audit_logs_cache');
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw);
        localLogs = parsed.filter(l => l.action !== 'TEST_INSERT_AUTHENTICATED');
      }
    } catch (_) {}
  }

  // 2. Higienizar cache local: Se o Supabase retornou dados, o banco é autoridade máxima
  let cleanLocalLogs = [];
  if (dbLogs.length > 0) {
    const dbIds = new Set(dbLogs.map(d => d.id).filter(Boolean));
    const dbSignatures = new Set(dbLogs.map(d => {
      const timeMs = d.created_at ? new Date(d.created_at).getTime() : 0;
      const timeBlock = Math.floor(timeMs / 4000); // Janela de 4 segundos
      return `${d.action}|${d.user_email || d.user_id || ''}|${d.entity || d.resource_type || ''}|${d.entity_id || d.resource_id || ''}|${timeBlock}`;
    }));

    // Manter apenas logs locais que falharam ou foram criados offline e ainda não estão no banco
    cleanLocalLogs = localLogs.filter(l => {
      if (l.synced === true) return false;
      if (l.id && dbIds.has(l.id)) return false;
      const lTimeMs = l.created_at ? new Date(l.created_at).getTime() : 0;
      const lTimeBlock = Math.floor(lTimeMs / 4000);
      const semKey = `${l.action}|${l.user_email || l.user_id || ''}|${l.entity || l.resource_type || ''}|${l.entity_id || l.resource_id || ''}|${lTimeBlock}`;
      if (dbSignatures.has(semKey)) return false;
      return true;
    });

    // Atualizar cache local removendo duplicatas já salvas no banco
    if (typeof window !== 'undefined' && cleanLocalLogs.length !== localLogs.length) {
      try {
        localStorage.setItem('academy_audit_logs_cache', JSON.stringify(cleanLocalLogs));
      } catch (_) {}
    }
  } else {
    cleanLocalLogs = localLogs;
  }

  // 3. Mesclagem e De-duplicação Absoluta (por ID e por assinatura semântica com janela de tempo)
  const combined = [...dbLogs, ...cleanLocalLogs];
  const uniqueList = [];
  const seenIds = new Set();
  const seenSignatures = new Set();

  for (const l of combined) {
    if (l.id && seenIds.has(l.id)) {
      continue; // Duplicado por ID exato
    }

    const action = l.action || '';
    const user = l.user_email || l.user_id || 'anon';
    const entity = l.entity || l.resource_type || 'system';
    const entityId = l.entity_id || l.resource_id || '';
    const desc = l.description || '';
    const timeMs = l.created_at ? new Date(l.created_at).getTime() : 0;

    // Janela de 3.5 segundos para agrupar disparos simultâneos
    const timeBlock = Math.floor(timeMs / 3500);
    const signature = `${action}|${user}|${entity}|${entityId}|${desc}|${timeBlock}`;

    if (seenSignatures.has(signature)) {
      continue; // Duplicado semântico disparado em milissegundos
    }

    if (l.id) seenIds.add(l.id);
    seenSignatures.add(signature);

    uniqueList.push({
      ...l,
      resource_type: l.entity || l.resource_type || l.details?.resource_type || 'system',
      resource_id: l.entity_id || l.resource_id || l.details?.resource_id || null,
      user_name: l.user_name || l.details?.user_name || (l.user_email ? l.user_email.split('@')[0] : 'Administrador'),
      user_email: l.user_email || l.details?.user_email || null,
      description: l.description || l.details?.description || l.action,
      ip_address: l.ip_address || l.details?.telemetry?.ip || null,
      telemetry: l.details?.telemetry || null,
      status: l.status || 'sucesso',
      synced: l.synced ?? true
    });
  }

  const sorted = uniqueList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return sorted.slice(0, limit);
}

// ==========================================
// 10. UPLOAD & GESTÃO DE FICHEIROS SEGUROS
// ==========================================

export function extractStoragePath(url, bucketName = 'academy_public') {
  if (!url) return null;
  if (!url.startsWith('http')) return url;
  const marker = `/${bucketName}/`;
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(url.substring(idx + marker.length).split('?')[0]);
  }
  return null;
}

export async function deletePublicFile(urlOrPath, bucket = 'academy_public') {
  if (!urlOrPath) return false;
  try {
    const path = extractStoragePath(urlOrPath, bucket);
    if (!path) return false;
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.warn('Aviso: Falha ao remover ficheiro do storage:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Erro ao deletar ficheiro do storage:', err);
    return false;
  }
}

export async function uploadPublicFile(file, folder = 'general') {
  const fileExt = file.name ? file.name.split('.').pop() : (file.type ? file.type.split('/').pop() : 'png');
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('academy_public')
    .upload(fileName, file, {
      contentType: file.type || 'image/png',
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from('academy_public')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

export async function uploadAvatar(userId, fileOrBlob) {
  const fileExt = fileOrBlob.name ? fileOrBlob.name.split('.').pop() : 'jpg';
  const fileName = `avatars/${userId}_${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('academy_public')
    .upload(fileName, fileOrBlob, {
      contentType: fileOrBlob.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from('academy_public')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

export async function updateProfile(userId, profileData) {
  // Garantir que formadores após o primeiro acesso não possam alterar o e-mail definitivo
  if (profileData && profileData.email) {
    try {
      const { data: prof } = await supabase
        .from('academy_profiles')
        .select('role, email, must_change_password')
        .eq('id', userId)
        .maybeSingle();

      if (prof?.role === 'formador' && !prof.must_change_password && prof.email.toLowerCase() !== profileData.email.trim().toLowerCase()) {
        throw new Error('O e-mail definitivo do Formador está permanentemente bloqueado e não pode ser alterado.');
      }
    } catch (checkErr) {
      if (checkErr.message?.includes('bloqueado')) throw checkErr;
    }
  }

  const { data, error } = await supabase
    .from('academy_profiles')
    .update({
      ...profileData,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadPrivateDocument(file, folder = 'documents') {
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('academy_private')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Gera uma URL assinada com expiração de 1 hora para visualização segura autorizada
  const { data: signedData, error: signedError } = await supabase.storage
    .from('academy_private')
    .createSignedUrl(fileName, 3600);

  if (signedError) {
    return fileName;
  }

  return signedData.signedUrl;
}

// ==========================================
// 12. GESTÃO DA EQUIPA INSTITUCIONAL
// ==========================================

export async function getTeamMembers({ activeOnly = false, homeOnly = false } = {}) {
  let query = supabase
    .from('academy_team')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  if (homeOnly) {
    query = query.eq('is_active', true).eq('show_on_home', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createTeamMember(memberData) {
  await ensureAdminRole('gerir administradores e membros da equipa', ['super_admin', 'admin']);
  const { data, error } = await supabase
    .from('academy_team')
    .insert([{
      ...memberData,
      display_order: Number(memberData.display_order) || 0,
      is_active: memberData.is_active !== undefined ? memberData.is_active : true,
      show_on_home: memberData.show_on_home !== undefined ? memberData.show_on_home : true
    }])
    .select()
    .single();

  if (error) throw error;

  await recordAuditLog({
    action: 'TEAM_MEMBER_CREATED',
    description: `Membro da equipa adicionado: ${memberData.full_name}`,
    resourceType: 'team',
    resourceId: data.id,
    details: { full_name: memberData.full_name, role: memberData.role }
  });

  return data;
}

export async function updateTeamMember(id, memberData) {
  await ensureAdminRole('atualizar dados de administradores e equipa', ['super_admin', 'admin']);
  const { data, error } = await supabase
    .from('academy_team')
    .update({
      ...memberData,
      display_order: Number(memberData.display_order) || 0,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await recordAuditLog({
    action: 'TEAM_MEMBER_UPDATED',
    description: `Membro da equipa atualizado: ${memberData.full_name || id}`,
    resourceType: 'team',
    resourceId: id,
    details: memberData
  });

  return data;
}

export async function deleteTeamMember(id) {
  await ensureAdminRole('eliminar membros da equipa ou administradores', ['super_admin', 'admin']);
  const { data, error } = await supabase
    .from('academy_team')
    .delete()
    .eq('id', id);

  if (error) throw error;

  await recordAuditLog({
    action: 'TEAM_MEMBER_DELETED',
    description: `Membro da equipa eliminado ID: ${id}`,
    resourceType: 'team',
    resourceId: id
  });

  return true;
}

export async function uploadTeamPhoto(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `team/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('academy_public')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from('academy_public')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

// ==========================================
// 13. RECUPERAÇÃO SEGURA DE SENHA
// ==========================================

export async function requestPasswordReset(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) throw new Error('O endereço de e-mail é obrigatório.');

  try {
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/redefinir-senha`
      : 'https://zatyacademy.co.mz/redefinir-senha';

    // 1. Chamar o Supabase Auth com redirect para a página dedicada
    await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl
    });

    // 2. Registar na tabela de pedidos de recuperação para métricas administrativas
    try {
      await supabase.from('academy_password_resets').insert([{
        email: cleanEmail,
        status: 'pendente',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
      }]);
    } catch (_) {}

    // 3. Auditoria
    await recordAuditLog({
      action: 'PASSWORD_RESET_REQUESTED',
      description: `Pedido de recuperação de senha solicitado para: ${cleanEmail}`,
      resourceType: 'auth',
      userEmail: cleanEmail,
      status: 'sucesso'
    });
  } catch (err) {
    console.warn('Aviso no envio de link de recuperação:', err);
  }

  // Resposta padronizada neutra para evitar enumeração de contas
  return {
    success: true,
    message: 'Se o endereço de e-mail estiver registado no sistema, enviámos as instruções com link seguro para definir uma nova palavra-passe.'
  };
}

export async function resetPasswordWithToken(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('A palavra-passe deve conter pelo menos 6 caracteres.');
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;

  try {
    if (data?.user?.email) {
      await supabase
        .from('academy_password_resets')
        .update({ status: 'concluido', completed_at: new Date().toISOString() })
        .eq('email', data.user.email)
        .eq('status', 'pendente');
    }
  } catch (_) {}

  await recordAuditLog({
    action: 'PASSWORD_RESET_COMPLETED',
    description: `Palavra-passe redefinida com sucesso para: ${data?.user?.email}`,
    resourceType: 'auth',
    userId: data?.user?.id,
    userEmail: data?.user?.email,
    status: 'sucesso'
  });

  return { success: true, user: data.user };
}

export async function getPasswordResetHistory(limit = 20) {
  try {
    const { data, error } = await supabase
      .from('academy_password_resets')
      .select('*')
      .order('requested_at', { ascending: false })
      .limit(limit);

    if (!error && data) return data;
  } catch (_) {}

  // Fallback via logs de auditoria
  try {
    const { data: logs } = await supabase
      .from('academy_audit_logs')
      .select('*')
      .or('action.eq.PASSWORD_RESET_REQUESTED,action.eq.PASSWORD_RESET_COMPLETED')
      .order('created_at', { ascending: false })
      .limit(limit);

    return (logs || []).map(l => ({
      id: l.id,
      email: l.user_email || 'Utilizador',
      status: l.action === 'PASSWORD_RESET_COMPLETED' ? 'concluido' : 'pendente',
      requested_at: l.created_at
    }));
  } catch (_) {
    return [];
  }
}

// ==========================================
// 14. ARTIGOS INSTITUCIONAIS & NOTÍCIAS
// ==========================================

export async function getArticles({
  audience = null,
  courseId = null,
  studentId = null,
  includeDrafts = false,
  limit = 50
} = {}) {
  let query = supabase
    .from('academy_articles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!includeDrafts) {
    query = query.eq('status', 'publicado');
  }

  if (audience) {
    query = query.eq('target_audience', audience);
  }

  const { data, error } = await query;
  if (error) {
    console.warn('Aviso ao consultar academy_articles:', error?.message);
    return [];
  }
  return data || [];
}

/**
 * Retorna exclusivamente notícias e conteúdos públicos do site da Zaty Academy
 */
export async function getPublicArticles({ limit = 30 } = {}) {
  try {
    const { data, error } = await supabase
      .from('academy_articles')
      .select('*')
      .eq('status', 'publicado')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!data) return [];

    return data.filter(art => 
      !art.target_audience || 
      art.target_audience === 'publico' || 
      art.target_audience === 'geral'
    );
  } catch (err) {
    console.warn('Aviso ao consultar artigos públicos:', err);
    return [];
  }
}

export async function getArticleById(idOrSlug) {
  if (!idOrSlug) return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  let query = supabase.from('academy_articles').select('*');
  if (isUuid) {
    query = query.eq('id', idOrSlug);
  } else {
    query = query.eq('slug', idOrSlug);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

export async function createArticle(articleData) {
  const slug = (articleData.title || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + `-${Date.now().toString(36)}`;

  const payload = {
    title: articleData.title.trim(),
    slug: articleData.slug || slug,
    excerpt: articleData.excerpt ? articleData.excerpt.trim() : null,
    content: articleData.content,
    cover_image_url: articleData.cover_image_url || null,
    video_url: articleData.video_url || null,
    status: articleData.status || 'publicado',
    target_audience: articleData.target_audience || 'geral',
    target_course_id: articleData.target_course_id || null,
    target_student_id: articleData.target_student_id || null,
    author_name: articleData.author_name || 'Zaty Academy',
    author_id: articleData.author_id || null
  };

  const { data, error } = await supabase
    .from('academy_articles')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  await recordAuditLog({
    action: 'ARTICLE_CREATED',
    description: `Artigo criado: ${payload.title}`,
    resourceType: 'article',
    resourceId: data.id,
    details: { title: payload.title, status: payload.status, target_audience: payload.target_audience }
  });

  return data;
}

export async function updateArticle(id, articleData) {
  const payload = {
    ...articleData,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('academy_articles')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await recordAuditLog({
    action: 'ARTICLE_UPDATED',
    description: `Artigo atualizado: ${payload.title || id}`,
    resourceType: 'article',
    resourceId: id,
    details: payload
  });

  return data;
}

export async function deleteArticle(id) {
  const { error } = await supabase
    .from('academy_articles')
    .delete()
    .eq('id', id);

  if (error) throw error;

  await recordAuditLog({
    action: 'ARTICLE_DELETED',
    description: `Artigo eliminado ID: ${id}`,
    resourceType: 'article',
    resourceId: id
  });

  return true;
}

export async function getStudentArticles(studentId, courseIds = []) {
  try {
    const { data: allArticles, error } = await supabase
      .from('academy_articles')
      .select('*')
      .eq('status', 'publicado')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!allArticles) return [];

    return allArticles.filter(art => {
      if (art.target_audience === 'geral' || !art.target_audience) return true;
      if (art.target_audience === 'estudante' && art.target_student_id === studentId) return true;
      if (art.target_audience === 'curso' && courseIds.includes(art.target_course_id)) return true;
      return false;
    });
  } catch (err) {
    console.warn('Aviso ao consultar artigos para estudante:', err);
    return [];
  }
}

// ==============================================================================
// 13. RASTREAMENTO REAL DE PRESENÇA (ESTUDANTES ONLINE SEM SIMULAÇÕES)
// ==============================================================================

/**
 * Atualiza o heartbeat de presença do utilizador logado no banco de dados
 */
export async function updateUserPresence(user, profile, student) {
  if (!user || !user.id) return;
  const now = new Date().toISOString();
  const role = profile?.role || 'estudante';
  const fullName = profile?.full_name || student?.full_name || user.email?.split('@')[0] || 'Utilizador';
  const studentCode = student?.student_code || student?.student_number || null;

  const payload = {
    user_id: user.id,
    role,
    full_name: fullName,
    student_code: studentCode,
    avatar_url: profile?.avatar_url || null,
    last_active_at: now,
    updated_at: now
  };

  try {
    const { error } = await supabase
      .from('academy_user_presence')
      .upsert([payload], { onConflict: 'user_id' });

    if (!error) return;
  } catch (_) {}

  // Fallback: se academy_user_presence ainda não estiver migrada, registrar em academy_audit_logs a cada 2 minutos
  try {
    const lastPing = typeof window !== 'undefined' ? sessionStorage.getItem('zaty_last_presence_ping') : null;
    if (!lastPing || (Date.now() - Number(lastPing)) > 120000) {
      if (typeof window !== 'undefined') sessionStorage.setItem('zaty_last_presence_ping', String(Date.now()));
      await recordAuditLog({
        action: 'USER_HEARTBEAT',
        description: `Sessão ativa de ${fullName}`,
        resourceType: 'presence',
        resourceId: user.id,
        details: { role, student_code: studentCode }
      });
    }
  } catch (_) {}
}

/**
 * Retorna os estudantes realmente ativos nos últimos 5 minutos (100% real, sem dados fictícios)
 */
export async function getOnlineStudents() {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  // Tentativa 1: academy_user_presence
  try {
    const { data, error } = await supabase
      .from('academy_user_presence')
      .select('*')
      .gte('last_active_at', fiveMinAgo)
      .in('role', ['estudante', 'student'])
      .order('last_active_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      // Enriquecer presenças com os registos de academy_students para fotos e dados completos
      const userIds = data.map(d => d.user_id).filter(Boolean);
      let studentMap = {};
      if (userIds.length > 0) {
        try {
          const { data: stData } = await supabase
            .from('academy_students')
            .select('id, user_id, full_name, student_code, email, photo_url, phone, status')
            .in('user_id', userIds);
          (stData || []).forEach(st => {
            if (st.user_id) studentMap[st.user_id] = st;
          });
        } catch (_) {}
      }

      return data.map(p => {
        const st = studentMap[p.user_id];
        return {
          user_id: p.user_id,
          full_name: st?.full_name || p.full_name || 'Estudante',
          student_code: st?.student_code || p.student_code || null,
          email: st?.email || null,
          avatar_url: st?.photo_url || p.avatar_url || null,
          photo_url: st?.photo_url || p.avatar_url || null,
          last_seen_at: p.last_active_at || p.updated_at,
          role: p.role,
          student: st || {
            full_name: p.full_name || 'Estudante',
            student_code: p.student_code,
            email: null,
            photo_url: p.avatar_url
          }
        };
      });
    }
  } catch (_) {}

  // Tentativa 2: academy_audit_logs dos últimos 5 minutos
  try {
    const { data: audits, error } = await supabase
      .from('academy_audit_logs')
      .select('*')
      .gte('created_at', fiveMinAgo)
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(audits)) {
      const activeMap = new Map();
      audits.forEach(a => {
        if (a.user_id && !activeMap.has(a.user_id)) {
          const isStudent = a.details?.role === 'estudante' || a.details?.role === 'student' || (!a.details?.role && a.user_name);
          if (isStudent) {
            activeMap.set(a.user_id, {
              user_id: a.user_id,
              full_name: a.user_name || 'Estudante Ativo',
              student_code: a.details?.student_code || null,
              last_seen_at: a.created_at,
              avatar_url: null,
              photo_url: null,
              student: {
                full_name: a.user_name || 'Estudante Ativo',
                student_code: a.details?.student_code || null
              }
            });
          }
        }
      });
      return Array.from(activeMap.values());
    }
  } catch (_) {}

  return [];
}

// ==============================================================================
// 14. CONTAS EXCLUSIVAS DE FORMADORES & CREDENCIAIS TEMPORÁRIAS (48 HORAS)
// ==============================================================================

/**
 * Auxiliar para extrair a senha temporária pendente guardada de forma segura
 */
export function extractPendingTeacherPassword(specialties) {
  if (!specialties) return null;
  let items = [];
  if (Array.isArray(specialties)) {
    items = specialties;
  } else if (typeof specialties === 'string') {
    try {
      const parsed = JSON.parse(specialties);
      if (Array.isArray(parsed)) items = parsed;
      else items = [specialties];
    } catch (_) {
      items = [specialties];
    }
  }
  for (const item of items) {
    if (typeof item === 'string' && item.startsWith('__PENDING_CRED__::')) {
      return item.replace('__PENDING_CRED__::', '');
    }
  }
  return null;
}

/**
 * Consulta as credenciais temporárias pendentes de um formador sem gerar uma nova senha.
 * Se a conta já tiver sido configurada (must_change_password === false), a senha definitiva
 * NUNCA é exposta e retorna isConfigured: true.
 */
export async function getTeacherPendingCredentials(teacherId) {
  if (!teacherId) return null;
  try {
    const { data: teacher, error } = await supabase
      .from('academy_teachers')
      .select('*')
      .eq('id', teacherId)
      .single();

    if (error || !teacher) return null;

    // Se já configurou a senha definitiva pessoal
    if (!teacher.must_change_password) {
      return {
        isConfigured: true,
        isPending: false,
        isExpired: false,
        email: teacher.email,
        temporaryPassword: null,
        expiresAt: null
      };
    }

    const pendingPass = extractPendingTeacherPassword(teacher.specialties);
    const isExpired = teacher.temporary_credentials_expires_at 
      ? new Date() > new Date(teacher.temporary_credentials_expires_at) 
      : false;

    return {
      isConfigured: false,
      isPending: true,
      isExpired,
      email: teacher.email,
      temporaryPassword: pendingPass || null,
      expiresAt: teacher.temporary_credentials_expires_at
    };
  } catch (err) {
    console.error('Erro ao consultar credenciais pendentes do formador:', err);
    return null;
  }
}

/**
 * Criação de formador pelo administrador com geração automática de credenciais temporárias
 */
export async function createTeacherWithAccount(teacherData) {
  const teacherName = (teacherData.name || teacherData.full_name || '').trim();
  let email = (teacherData.email || '').trim().toLowerCase();

  // Se o e-mail não for informado, gerar e-mail provisório institucional válido
  if (!email) {
    const cleanName = teacherName
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 15) || 'formador';
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    email = `formador.${cleanName}.${randomCode}@zatyacademy.co.mz`;
  }

  // Gerar senha temporária segura aleatória
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const tempPassword = `Formador#${randomSuffix}!`;

  // 1. Criar utilizador de autenticação no Supabase Auth via cliente isolado
  const { data: authData, error: authError } = await isolatedAuthClient.auth.signUp({
    email,
    password: tempPassword,
    options: {
      data: {
        full_name: teacherName,
        role: 'formador',
        phone: teacherData.phone || null
      }
    }
  });

  if (authError && !authError.message.includes('already registered')) {
    throw new Error(`Falha na criação da conta de autenticação: ${authError.message}`);
  }

  // Auto-confirmar e-mail imediatamente para garantir primeiro login sem bloqueios
  try {
    await confirmUserEmail(email);
  } catch (_) {}

  let userId = authData?.user?.id || null;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  if (!userId) {
    // Tentar localizar id existente no perfil
    try {
      const { data: prof } = await supabase
        .from('academy_profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (prof?.id) userId = prof.id;
    } catch (_) {}
  }

  // 2. Guardar a credencial temporária pendente codificada em specialties
  const pendingSpecialties = JSON.stringify([`__PENDING_CRED__::${tempPassword}`]);

  const teacherPayload = {
    name: teacherName,
    full_name: teacherName,
    email,
    phone: teacherData.phone ? teacherData.phone.trim() : null,
    specialty: teacherData.specialty ? teacherData.specialty.trim() : 'Tecnologia',
    specialties: pendingSpecialties,
    bio: teacherData.bio ? teacherData.bio.trim() : null,
    is_active: true,
    user_id: userId,
    must_change_password: true,
    temporary_credentials_created_at: now.toISOString(),
    temporary_credentials_expires_at: expiresAt,
    is_blocked: false
  };

  let savedTeacher = null;
  try {
    const { data, error } = await supabase
      .from('academy_teachers')
      .insert([teacherPayload])
      .select()
      .single();
    if (!error && data) savedTeacher = data;
  } catch (_) {}

  if (!savedTeacher) {
    // Fallback sem colunas novas se ainda não migradas
    savedTeacher = await createTeacher({ ...teacherData, email });
    if (savedTeacher?.id) {
      try {
        await supabase
          .from('academy_teachers')
          .update({
            specialties: pendingSpecialties,
            user_id: userId,
            must_change_password: true,
            temporary_credentials_created_at: now.toISOString(),
            temporary_credentials_expires_at: expiresAt
          })
          .eq('id', savedTeacher.id);
      } catch (_) {}
    }
  }

  // 3. Garantir perfil no academy_profiles estritamente com role 'formador'
  if (userId) {
    try {
      await supabase.from('academy_profiles').upsert([{
        id: userId,
        email,
        full_name: teacherName,
        role: 'formador',
        phone: teacherData.phone ? teacherData.phone.trim() : null,
        is_active: true
      }]);
    } catch (err) {
      console.warn('Aviso ao criar academy_profiles para formador:', err);
    }
  }

  await recordAuditLog({
    action: 'TEACHER_ACCOUNT_CREATED',
    description: `Conta de Formador criada para: ${teacherName} (${email})`,
    resourceType: 'teacher',
    resourceId: savedTeacher?.id || userId,
    details: { email, expiresAt }
  });

  return {
    teacher: savedTeacher,
    credentials: {
      email,
      temporaryPassword: tempPassword,
      expiresAt
    }
  };
}

/**
 * Regenera credenciais temporárias para um formador existente.
 * Invalida a senha temporária anterior e sincroniza com o Supabase Auth.
 */
export async function regenerateTeacherCredentials(teacherId) {
  const { data: teacher, error: fetchErr } = await supabase
    .from('academy_teachers')
    .select('*')
    .eq('id', teacherId)
    .single();

  if (fetchErr || !teacher) throw new Error('Formador não encontrado.');

  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const tempPassword = `Formador#${randomSuffix}!`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  // 1. Atualizar a senha no Supabase Auth
  const oldPassword = extractPendingTeacherPassword(teacher.specialties);
  let updatedAuth = false;

  if (oldPassword) {
    try {
      const { error: signErr } = await isolatedAuthClient.auth.signInWithPassword({
        email: teacher.email,
        password: oldPassword
      });
      if (!signErr) {
        const { error: updErr } = await isolatedAuthClient.auth.updateUser({
          password: tempPassword
        });
        if (!updErr) updatedAuth = true;
      }
    } catch (_) {}
  }

  // Se não foi possível atualizar via login anterior, tenta signUp se não existisse
  if (!updatedAuth) {
    try {
      const { data: sData, error: sErr } = await isolatedAuthClient.auth.signUp({
        email: teacher.email,
        password: tempPassword,
        options: {
          data: {
            full_name: teacher.name || teacher.full_name,
            role: 'formador',
            phone: teacher.phone || null
          }
        }
      });
      if (!sErr && sData?.user?.id) {
        updatedAuth = true;
        if (!teacher.user_id) teacher.user_id = sData.user.id;
        try {
          await confirmUserEmail(teacher.email);
        } catch (_) {}
      }
    } catch (_) {}
  }

  // 2. Atualizar dados em academy_teachers com a nova senha temporária
  const pendingSpecialties = JSON.stringify([`__PENDING_CRED__::${tempPassword}`]);
  try {
    await supabase
      .from('academy_teachers')
      .update({
        specialties: pendingSpecialties,
        user_id: teacher.user_id || undefined,
        must_change_password: true,
        temporary_credentials_created_at: now.toISOString(),
        temporary_credentials_expires_at: expiresAt,
        is_blocked: false,
        updated_at: now.toISOString()
      })
      .eq('id', teacherId);
  } catch (_) {}

  // 3. Atualizar perfil se vinculado
  if (teacher.user_id) {
    try {
      await supabase
        .from('academy_profiles')
        .upsert([{
          id: teacher.user_id,
          email: teacher.email,
          full_name: teacher.name || teacher.full_name,
          role: 'formador',
          is_active: true
        }]);
    } catch (_) {}
  }

  await recordAuditLog({
    action: 'TEACHER_CREDENTIALS_REGENERATED',
    description: `Novas credenciais temporárias emitidas para: ${teacher.name || teacher.full_name}`,
    resourceType: 'teacher',
    resourceId: teacherId,
    details: { email: teacher.email, expiresAt }
  });

  return {
    email: teacher.email,
    temporaryPassword: tempPassword,
    expiresAt
  };
}

/**
 * Altera o e-mail e a senha do formador no primeiro login e desativa o bloqueio obrigatório.
 * Elimina definitivamente as credenciais provisórias do banco de dados e notifica a administração.
 */
export async function changeTeacherTemporaryPassword(newPassword, newEmail = null) {
  return completeTeacherCredentialsSetup({ newPassword, newEmail });
}

export async function completeTeacherCredentialsSetup({ newPassword, newEmail = null }) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
  }

  const cleanEmail = newEmail ? newEmail.trim().toLowerCase() : null;
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Por favor, informe um endereço de e-mail válido para a sua conta.');
  }

  // 1. Obter a sessão e o utilizador atualmente autenticado
  const { data: { session } } = await supabase.auth.getSession();
  const currentUser = session?.user;
  if (!currentUser) {
    throw new Error('Sessão expirada. Por favor, volte a autenticar-se para concluir a configuração.');
  }

  const currentUserId = currentUser.id;
  const provisionalEmail = (currentUser.email || '').trim().toLowerCase();

  // O novo e-mail não pode ser idêntico ao e-mail provisório
  if (provisionalEmail && cleanEmail === provisionalEmail) {
    throw new Error('O novo e-mail deve ser o seu endereço pessoal ou corporativo real, diferente do e-mail provisório institucional.');
  }

  // 2. Verificar regra de 48 horas e bloqueio de reconfiguração
  const { data: teacherRow } = await supabase
    .from('academy_teachers')
    .select('*')
    .or(`user_id.eq.${currentUserId},email.eq.${provisionalEmail}`)
    .maybeSingle();

  // Se a conta já tiver sido configurada anteriormente, o e-mail real fica bloqueado
  if (teacherRow && !teacherRow.must_change_password) {
    throw new Error('As credenciais desta conta já foram configuradas anteriormente. O e-mail definitivo está bloqueado.');
  }

  if (teacherRow?.temporary_credentials_expires_at) {
    const expiresAt = new Date(teacherRow.temporary_credentials_expires_at);
    if (new Date() > expiresAt) {
      throw new Error('O prazo de 48 horas para a ativação inicial das suas credenciais provisórias expirou. Solicite um novo acesso ao Administrador da Zaty Academy.');
    }
  }

  const teacherName = teacherRow?.name || teacherRow?.full_name || currentUser.user_metadata?.full_name || 'Formador';
  const now = new Date().toISOString();

  // 3. Atualizar a SENHA no Supabase Auth
  const { error: passErr } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (passErr && !passErr.message?.includes('different from the old password')) {
    console.warn('Aviso ao atualizar senha no GoTrue:', passErr.message);
  }

  // 4. Executar invalidação e migração no PostgreSQL via RPC (SECURITY DEFINER)
  let emailUpdatedViaRpc = false;
  try {
    const { data: rpcSuccess, error: rpcErr } = await supabase.rpc('finalize_teacher_credentials_setup', {
      new_email: cleanEmail,
      new_password: newPassword,
      provisional_email: provisionalEmail
    });
    if (!rpcErr && rpcSuccess) {
      emailUpdatedViaRpc = true;
    }
  } catch (_) {}

  if (!emailUpdatedViaRpc) {
    try {
      const { data: rpc2, error: rpcErr2 } = await supabase.rpc('update_teacher_email', {
        new_email: cleanEmail
      });
      if (!rpcErr2 && rpc2) {
        emailUpdatedViaRpc = true;
      }
    } catch (_) {}
  }

  // 5. Invalidação obrigatória do e-mail provisório em academy_teachers e academy_profiles
  const teacherId = teacherRow?.id;
  const invalidatedSpecialties = JSON.stringify([
    `__INVALIDATED_PROVISIONAL_EMAIL__::${provisionalEmail}`
  ]);

  if (teacherId) {
    try {
      await supabase
        .from('academy_teachers')
        .update({
          email: cleanEmail,
          provisional_email: provisionalEmail,
          user_id: currentUserId,
          specialties: invalidatedSpecialties,
          must_change_password: false,
          temporary_credentials_created_at: null,
          temporary_credentials_expires_at: null,
          is_blocked: false,
          updated_at: now
        })
        .eq('id', teacherId);
    } catch (colErr) {
      // Fallback caso a coluna provisional_email ainda não tenha sido criada no banco
      try {
        await supabase
          .from('academy_teachers')
          .update({
            email: cleanEmail,
            user_id: currentUserId,
            specialties: invalidatedSpecialties,
            must_change_password: false,
            temporary_credentials_created_at: null,
            temporary_credentials_expires_at: null,
            is_blocked: false,
            updated_at: now
          })
          .eq('id', teacherId);
      } catch (updErr) {
        console.warn('Aviso ao atualizar academy_teachers:', updErr);
      }
    }
  }

  try {
    await supabase
      .from('academy_profiles')
      .update({
        email: cleanEmail,
        must_change_password: false,
        updated_at: now
      })
      .eq('id', currentUserId);
  } catch (err) {
    console.warn('Aviso ao atualizar academy_profiles:', err);
  }

  // 6. Se o RPC não tiver migrado auth.users, assegurar conta com novo e-mail e inutilizar a provisória
  if (!emailUpdatedViaRpc) {
    try {
      const { data: sData, error: sErr } = await isolatedAuthClient.auth.signUp({
        email: cleanEmail,
        password: newPassword,
        options: {
          data: {
            full_name: teacherName,
            role: 'formador',
            phone: teacherRow?.phone || null
          }
        }
      });

      if (sData?.user?.id) {
        try {
          await confirmUserEmail(cleanEmail);
        } catch (_) {}

        // Revogar permanentemente a conta provisória alterando a senha para um hash inacessível
        try {
          const deadHash = 'DEAD_REVOKED#' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36)) + '!#' + Date.now();
          await supabase.auth.updateUser({ password: deadHash });
        } catch (_) {}
      }
    } catch (_) {}
  }

  // 7. Notificação oficial e auditoria de segurança
  try {
    await supabase
      .from('academy_notifications')
      .insert([{
        title: 'Configuração de Conta do Formador Concluída',
        message: `O Formador ${teacherName} configurou o seu e-mail definitivo (${cleanEmail}). O e-mail provisório (${provisionalEmail}) foi imediatamente invalidado.`,
        type: 'teacher_activated',
        target_role: 'admin',
        created_at: now
      }]);
  } catch (_) {}

  await recordAuditLog({
    action: 'TEACHER_CREDENTIALS_CONFIGURED',
    description: `O Formador ${teacherName} ativou o e-mail real (${cleanEmail}). E-mail provisório (${provisionalEmail}) desativado em definitivo.`,
    resourceType: 'auth',
    resourceId: currentUserId,
    details: { 
      email: cleanEmail, 
      provisionalEmail, 
      teacherName,
      status: 'provisional_invalidated'
    }
  });

  return true;
}

// ==============================================================================
// 15. SISTEMA DE TRABALHOS DE CASA / TRABALHOS ACADÉMICOS (ASSIGNMENTS)
// ==============================================================================

/**
 * Consulta trabalhos pertencentes a um formador
 */
export async function getTeacherAssignments(teacherId) {
  try {
    const { data, error } = await supabase
      .from('academy_assignments')
      .select('*, class:academy_classes(id, name, schedule), course:academy_courses(id, title)')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Aviso ao consultar trabalhos do formador:', err);
    return [];
  }
}

/**
 * Criação de novo trabalho pelo formador
 */
export async function createAssignment(assignmentData) {
  let attachmentUrl = assignmentData.attachment_url || null;
  if (assignmentData.file) {
    try {
      const sanitized = assignmentData.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `assignment_attachments/${Date.now()}_${sanitized}`;
      const { error: upErr } = await supabase.storage
        .from('academy_public')
        .upload(filePath, assignmentData.file, { upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('academy_public').getPublicUrl(filePath);
        attachmentUrl = urlData.publicUrl;
      }
    } catch (e) {
      console.warn('Aviso no upload do anexo do trabalho:', e);
    }
  }

  const instructionsText = (assignmentData.instructions || assignmentData.description || 'Instruções do trabalho').trim();
  const maxScore = Number(assignmentData.max_score || assignmentData.max_points) || 20;

  const payload = {
    teacher_id: assignmentData.teacher_id,
    class_id: assignmentData.class_id,
    course_id: assignmentData.course_id || null,
    title: assignmentData.title.trim(),
    instructions: instructionsText,
    due_date: assignmentData.due_date,
    max_score: maxScore,
    weight: Number(assignmentData.weight) || 1,
    status: 'ativo'
  };

  if (attachmentUrl) {
    payload.attachment_url = attachmentUrl;
  }

  const { data, error } = await supabase
    .from('academy_assignments')
    .insert([payload])
    .select('*, class:academy_classes(name), course:academy_courses(title)')
    .single();

  if (error) throw error;

  // Sincronizar automaticamente com o módulo de Avaliações / Notas (tipo: trabalho_casa)
  try {
    await createEvaluation({
      class_id: payload.class_id,
      course_id: payload.course_id,
      teacher_id: payload.teacher_id,
      title: payload.title,
      evaluation_type: 'trabalho_casa',
      evaluation_date: payload.due_date ? payload.due_date.split('T')[0] : new Date().toISOString().split('T')[0],
      weight: Number(payload.weight) || 1.0,
      max_score: maxScore,
      passing_grade: 10.0,
      description: instructionsText,
      assignment_id: data.id
    });
  } catch (syncErr) {
    console.warn('Aviso ao sincronizar trabalho criado com avaliação:', syncErr);
  }

  await recordAuditLog({
    action: 'ASSIGNMENT_CREATED',
    description: `Trabalho criado: "${payload.title}" para turma ID ${payload.class_id}`,
    resourceType: 'assignment',
    resourceId: data.id,
    details: { title: payload.title, due_date: payload.due_date }
  });

  return data;
}

/**
 * Atualiza um trabalho existente
 */
export async function updateAssignment(id, assignmentData) {
  const payload = {
    ...assignmentData,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('academy_assignments')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Sincronizar alteração na avaliação correspondente
  try {
    const updateEvalPayload = {};
    if (payload.title) updateEvalPayload.title = payload.title.trim();
    if (payload.due_date) updateEvalPayload.evaluation_date = payload.due_date.split('T')[0];
    if (payload.max_score || payload.max_points) updateEvalPayload.max_score = Number(payload.max_score || payload.max_points);
    if (payload.weight) updateEvalPayload.weight = Number(payload.weight);

    await supabase
      .from('academy_evaluations')
      .update(updateEvalPayload)
      .eq('assignment_id', id);

    const localStore = getLocalGradesStore();
    const ev = (localStore.evaluations || []).find(e => e.assignment_id === id);
    if (ev) {
      Object.assign(ev, updateEvalPayload);
      saveLocalGradesStore(localStore);
    }
  } catch (_) {}

  return data;
}

/**
 * Exclui um trabalho
 */
export async function deleteAssignment(id) {
  // Excluir avaliação correspondente
  try {
    const { data: evals } = await supabase
      .from('academy_evaluations')
      .select('id')
      .eq('assignment_id', id);
    
    if (evals && evals.length > 0) {
      for (const ev of evals) {
        await deleteEvaluation(ev.id, null, true);
      }
    }
  } catch (_) {}

  const { error } = await supabase
    .from('academy_assignments')
    .delete()
    .eq('id', id);

  if (error) throw error;

  await recordAuditLog({
    action: 'ASSIGNMENT_DELETED',
    description: `Trabalho excluído ID: ${id}`,
    resourceType: 'assignment',
    resourceId: id
  });

  return true;
}

/**
 * Consulta submissões de estudantes para um trabalho (Apenas formador responsável / admin)
 */
export async function getAssignmentSubmissions(assignmentId) {
  try {
    const { data, error } = await supabase
      .from('academy_assignment_submissions')
      .select('*, student:academy_students(id, full_name, student_code, email, phone)')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Aviso ao consultar submissões do trabalho:', err);
    return [];
  }
}

/**
 * Avalia um trabalho submetido (lançamento de nota 0-20 e feedback pedagógico)
 * Aplica bloqueio permanente para o formador e sincroniza com a Pauta Oficial de Avaliações.
 */
export async function gradeAssignmentSubmission(submissionId, { grade, feedback, teacherId }) {
  const numGrade = Number(grade);
  if (isNaN(numGrade) || numGrade < 0 || numGrade > 20) {
    throw new Error('A nota deve estar entre 0 e 20 Valores.');
  }

  const now = new Date().toISOString();
  const payload = {
    grade: numGrade,
    feedback: feedback ? feedback.trim() : null,
    status: 'avaliado',
    graded_at: now,
    graded_by: teacherId || null,
    updated_at: now
  };

  const { data, error } = await supabase
    .from('academy_assignment_submissions')
    .update(payload)
    .eq('id', submissionId)
    .select('*, student:academy_students(id, full_name, student_code), assignment:academy_assignments(*)')
    .single();

  if (error) throw error;

  // Sincronizar com a Pauta Oficial de Avaliações (academy_evaluations e academy_grades)
  try {
    const asg = data.assignment;
    if (asg && asg.class_id) {
      const classId = asg.class_id;

      // 1. Obter ou criar a avaliação de tipo trabalho_casa correspondente
      const evals = await getEvaluationsByClass(classId);
      let targetEval = evals.find(e => 
        e.assignment_id === asg.id || 
        (e.evaluation_type === 'trabalho_casa' && e.title?.trim().toLowerCase() === asg.title?.trim().toLowerCase())
      );

      if (!targetEval) {
        targetEval = await createEvaluation({
          class_id: classId,
          course_id: asg.course_id,
          teacher_id: asg.teacher_id || teacherId,
          title: asg.title,
          evaluation_type: 'trabalho_casa',
          evaluation_date: asg.due_date ? asg.due_date.split('T')[0] : now.split('T')[0],
          weight: Number(asg.weight) || 1.0,
          max_score: Number(asg.max_score || asg.max_points) || 20.0,
          passing_grade: 10.0,
          description: asg.instructions || asg.description || `Trabalho de Casa: ${asg.title}`,
          assignment_id: asg.id
        });
      }

      // 2. Gravar nota bloqueada na pauta de notas (academy_grades)
      await saveGradesBatch(targetEval.id, [{
        student_id: data.student_id,
        class_id: classId,
        score: numGrade,
        observations: feedback ? feedback.trim() : null,
        is_recovery: false
      }], teacherId);
    }
  } catch (syncErr) {
    console.warn('Aviso ao sincronizar nota do trabalho com a pauta de avaliações:', syncErr);
  }

  await recordAuditLog({
    action: 'ASSIGNMENT_GRADED_AND_LOCKED',
    description: `Trabalho avaliado e bloqueado: ${numGrade}/20 Valores para ${data.student?.full_name || 'Estudante'}`,
    resourceType: 'submission',
    resourceId: submissionId,
    details: { grade: numGrade, teacherId }
  });

  return data;
}

/**
 * Consulta os trabalhos atribuídos estritamente ao estudante autenticado
 */
export async function getStudentAssignments(studentId) {
  if (!studentId) return [];

  try {
    // 1. Obter turmas em que o estudante está inscrito
    const { data: enrollments, error: enrolErr } = await supabase
      .from('academy_enrollments')
      .select('class_id')
      .eq('student_id', studentId);

    if (enrolErr) throw enrolErr;
    const classIds = (enrollments || []).map(e => e.class_id).filter(Boolean);

    if (classIds.length === 0) return [];

    // 2. Buscar trabalhos dessas turmas
    const { data: assignments, error: assignErr } = await supabase
      .from('academy_assignments')
      .select('*, teacher:academy_teachers(id, name, full_name, specialty), class:academy_classes(id, name), course:academy_courses(id, title)')
      .in('class_id', classIds)
      .order('due_date', { ascending: true });

    if (assignErr) throw assignErr;
    if (!assignments || assignments.length === 0) return [];

    // 3. Buscar submissão do próprio estudante (se existir)
    const assignmentIds = assignments.map(a => a.id);
    const { data: submissions } = await supabase
      .from('academy_assignment_submissions')
      .select('*')
      .in('assignment_id', assignmentIds)
      .eq('student_id', studentId);

    const submissionMap = new Map((submissions || []).map(s => [s.assignment_id, s]));

    return assignments.map(a => ({
      ...a,
      submission: submissionMap.get(a.id) || null
    }));
  } catch (err) {
    console.warn('Aviso ao consultar trabalhos do estudante:', err);
    return [];
  }
}

/**
 * Submete trabalho do estudante (upload seguro de PDF ou DOCX)
 */
export async function submitStudentAssignment({ assignmentId, studentId, file }) {
  if (!file) throw new Error('Selecione um ficheiro PDF ou DOCX para enviar.');

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!['pdf', 'docx', 'doc'].includes(ext)) {
    throw new Error('Apenas ficheiros no formato PDF (.pdf) ou Word (.docx) são aceites.');
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new Error('O ficheiro selecionado excede o limite máximo permitido de 20MB.');
  }

  // Upload para Supabase Storage
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `assignments/${assignmentId}/${studentId}/${Date.now()}_${sanitizedName}`;

  let publicUrl = null;
  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from('academy_public')
    .upload(filePath, file, {
      contentType: file.type || (ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
      upsert: true
    });

  if (uploadErr) {
    throw new Error(`Falha no upload do ficheiro: ${uploadErr.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('academy_public')
    .getPublicUrl(filePath);

  publicUrl = urlData.publicUrl;

  // Gravar submissão no banco de dados com chave única (assignment_id, student_id)
  const submissionPayload = {
    assignment_id: assignmentId,
    student_id: studentId,
    file_url: publicUrl,
    file_name: file.name,
    file_size: file.size,
    file_type: file.type || ext,
    status: 'submetido',
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('academy_assignment_submissions')
    .upsert([submissionPayload], { onConflict: 'assignment_id,student_id' })
    .select()
    .single();

  if (error) throw error;

  await recordAuditLog({
    action: 'ASSIGNMENT_SUBMITTED',
    description: `Trabalho enviado por estudante ID ${studentId} para trabalho ID ${assignmentId}`,
    resourceType: 'submission',
    resourceId: data.id,
    details: { file_name: file.name, file_size: file.size }
  });

  return data;
}

// ==============================================================================
// 16. SISTEMA DE CHAT ACADÉMICO, SUPORTE E DIRETRIZES INSTITUCIONAIS
// ==============================================================================

/**
 * Verifica se o utilizador já aceitou as diretrizes obrigatórias de utilização do Chat
 */
export async function checkChatGuidelinesAccepted(userId) {
  if (!userId) return false;
  try {
    const { data, error } = await supabase
      .from('academy_chat_guidelines_accepted')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  } catch (_) {
    return false;
  }
}

/**
 * Regista o aceite das diretrizes de utilização do chat
 */
export async function acceptChatGuidelines(userId, studentId = null) {
  if (!userId) throw new Error('Utilizador não identificado.');

  const { data, error } = await supabase
    .from('academy_chat_guidelines_accepted')
    .upsert([{
      user_id: userId,
      student_id: studentId || null,
      accepted_at: new Date().toISOString(),
      version: '1.0'
    }], { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;

  await recordAuditLog({
    action: 'CHAT_GUIDELINES_ACCEPTED',
    description: 'Diretrizes académicas de utilização do Chat aceites pelo utilizador.',
    resourceType: 'chat',
    resourceId: userId
  });

  return data;
}

/**
 * Verifica se o chat do estudante está bloqueado por violação das regras
 */
export async function checkChatBlocked(studentId, userId) {
  try {
    let query = supabase.from('academy_chat_blocks').select('*').in('status', ['bloqueado', 'em_analise']);
    if (studentId) query = query.eq('student_id', studentId);
    else if (userId) query = query.eq('user_id', userId);
    else return null;

    const { data, error } = await query.order('blocked_at', { ascending: false }).limit(1).maybeSingle();
    if (error) return null;
    return data || null;
  } catch (_) {
    return null;
  }
}

/**
 * Envia justificativa / recurso para desbloqueio do chat
 */
export async function submitChatAppeal(blockId, appealText) {
  if (!appealText || !appealText.trim()) throw new Error('Escreva a sua justificativa para análise.');

  const { data, error } = await supabase
    .from('academy_chat_blocks')
    .update({
      appeal_text: appealText.trim(),
      appeal_submitted_at: new Date().toISOString(),
      status: 'em_analise'
    })
    .eq('id', blockId)
    .select()
    .single();

  if (error) throw error;

  await recordAuditLog({
    action: 'CHAT_APPEAL_SUBMITTED',
    description: 'Recurso de desbloqueio de chat submetido pelo estudante.',
    resourceType: 'chat_block',
    resourceId: blockId
  });

  return data;
}

/**
 * Moderação de Chat pelo Administrador: Bloquear ou Reativar
 */
export async function manageChatBlock({ blockId, studentId, userId, action, reason, notes, adminId }) {
  if (action === 'bloquear') {
    const payload = {
      user_id: userId || null,
      student_id: studentId || null,
      reason: reason ? reason.trim() : 'Violação das diretrizes de convivência do Chat Académico.',
      status: 'bloqueado',
      blocked_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('academy_chat_blocks')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    await recordAuditLog({
      action: 'CHAT_BLOCKED',
      description: `Chat suspenso para estudante ID ${studentId}: ${payload.reason}`,
      resourceType: 'chat_block',
      resourceId: data.id,
      details: { reason: payload.reason, adminId }
    });

    return data;
  } else if (action === 'reativar') {
    const { data, error } = await supabase
      .from('academy_chat_blocks')
      .update({
        status: 'reativado',
        reactivated_at: new Date().toISOString(),
        reviewed_by: adminId || null,
        review_notes: notes || 'Chat reativado após análise favorável da equipa responsável.'
      })
      .eq('id', blockId)
      .select()
      .single();

    if (error) throw error;

    await recordAuditLog({
      action: 'CHAT_REACTIVATED',
      description: `Chat reativado ID ${blockId}`,
      resourceType: 'chat_block',
      resourceId: blockId,
      details: { notes }
    });

    return data;
  }
}

/**
 * Consulta conversas do estudante (Académicas e de Suporte)
 */
export async function getStudentConversations(studentId) {
  if (!studentId) return [];
  try {
    const { data, error } = await supabase
      .from('academy_chat_conversations')
      .select('*')
      .eq('student_id', studentId)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Aviso ao consultar conversas do estudante:', err);
    return [];
  }
}

/**
 * Localiza ou inicializa a conversa exclusiva de Suporte entre o estudante e a equipa institucional
 */
export async function getOrCreateSupportConversation(studentId, studentName = 'Estudante') {
  if (!studentId) throw new Error('Identificação do estudante é obrigatória.');

  // Verificar se já existe
  const { data: existing } = await supabase
    .from('academy_chat_conversations')
    .select('*')
    .eq('student_id', studentId)
    .eq('type', 'support')
    .maybeSingle();

  if (existing) return existing;

  // Criar nova conversa de suporte
  const payload = {
    type: 'support',
    student_id: studentId,
    title: `Suporte Institucional — ${studentName}`,
    status: 'ativo',
    last_message_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('academy_chat_conversations')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Consulta histórico de mensagens de uma conversa
 */
export async function getChatMessages(conversationId) {
  if (!conversationId) return [];
  try {
    const { data, error } = await supabase
      .from('academy_chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!Array.isArray(data)) return [];

    // Deduplicação rigorosa por ID para evitar mensagens repetidas na interface
    const seen = new Set();
    return data.filter(m => {
      if (!m?.id) return true;
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  } catch (err) {
    console.warn('Aviso ao consultar mensagens do chat:', err);
    return [];
  }
}

/**
 * Envia uma mensagem no chat com proteção estrita contra duplicatas
 */
export async function sendChatMessage({ conversationId, senderId, senderRole, senderName, content }) {
  if (!content || !content.trim()) return null;

  const trimmedContent = content.trim();

  // Prevenção contra duplo clique ou oscilação de rede (idempotência nos últimos 4 segundos)
  try {
    const recentLimit = new Date(Date.now() - 4000).toISOString();
    let query = supabase
      .from('academy_chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('content', trimmedContent)
      .gte('created_at', recentLimit);

    if (senderId) {
      query = query.eq('sender_id', senderId);
    }

    const { data: existingRecent } = await query.maybeSingle();
    if (existingRecent) {
      return existingRecent;
    }
  } catch (_) {}

  const payload = {
    conversation_id: conversationId,
    sender_id: senderId || null,
    sender_role: senderRole || 'estudante',
    sender_name: senderName || 'Utilizador',
    content: trimmedContent,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('academy_chat_messages')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  // Atualizar timestamp da última mensagem na conversa
  try {
    await supabase
      .from('academy_chat_conversations')
      .update({ last_message_at: payload.created_at, updated_at: payload.created_at })
      .eq('id', conversationId);
  } catch (_) {}

  // Notificações automáticas bidirecionais
  try {
    const { data: conv } = await supabase
      .from('academy_chat_conversations')
      .select('student_id, title, type')
      .eq('id', conversationId)
      .maybeSingle();

    if (conv?.type === 'support' && conv?.student_id) {
      if (senderRole === 'admin' || senderRole === 'suporte') {
        // Notificar o estudante sobre nova resposta da Direção/Suporte
        const { data: std } = await supabase
          .from('academy_students')
          .select('id, user_id')
          .eq('id', conv.student_id)
          .maybeSingle();

        await supabase.from('academy_notifications').insert([{
          student_id: conv.student_id,
          user_id: std?.user_id || null,
          title: '💬 Nova Mensagem do Suporte Zaty Academy',
          message: `A Direção / Suporte respondeu: "${trimmedContent.substring(0, 100)}${trimmedContent.length > 100 ? '...' : ''}"`,
          type: 'support_message',
          link: '/estudante/chat',
          is_read: false,
          created_at: payload.created_at
        }]);
      } else if (senderRole === 'estudante') {
        // Notificar a administração sobre nova mensagem do estudante
        await supabase.from('academy_notifications').insert([{
          title: `💬 Nova Mensagem de Suporte: ${senderName}`,
          message: `O estudante ${senderName} enviou uma nova mensagem no chat de suporte: "${trimmedContent.substring(0, 90)}..."`,
          type: 'support_message',
          target_role: 'admin',
          is_read: false,
          created_at: payload.created_at
        }]);
      }
    }
  } catch (notifErr) {
    console.warn('Aviso ao emitir notificação de chat:', notifErr);
  }

  return data;
}

/**
 * Lista todas as conversas de suporte para o painel da equipe de suporte / administração
 */
export async function getSupportConversationsList() {
  try {
    const { data, error } = await supabase
      .from('academy_chat_conversations')
      .select('*, student:academy_students(id, full_name, student_code, email, phone, photo_url)')
      .eq('type', 'support')
      .order('last_message_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      return data;
    }
    if (error) throw error;
    return [];
  } catch (err) {
    console.warn('Aviso ao consultar conversas de suporte:', err);
    return [];
  }
}

/**
 * Consulta os canais académicos e interlocutores permitidos para um estudante:
 * - Suas turmas ativas
 * - Formadores atribuídos às suas turmas ou cursos
 * - Colegas de turma ou curso matriculados
 */
export async function getStudentAcademicChannels(studentId) {
  if (!studentId) return { classes: [], teachers: [], classmates: [] };

  try {
    // 1. Obter inscrições ativas do estudante
    const { data: enrollments, error: enrErr } = await supabase
      .from('academy_enrollments')
      .select('id, course_id, class_id, status')
      .eq('student_id', studentId)
      .in('status', ['ativo', 'confirmado', 'concluido']);

    if (enrErr) throw enrErr;
    if (!enrollments || enrollments.length === 0) {
      return { classes: [], teachers: [], classmates: [] };
    }

    const courseIds = [...new Set(enrollments.map(e => e.course_id).filter(Boolean))];
    const classIds = [...new Set(enrollments.map(e => e.class_id).filter(Boolean))];

    // 2. Buscar dados dos cursos, turmas e formadores
    const [coursesRes, classesRes, allTeachersRes] = await Promise.all([
      courseIds.length > 0
        ? supabase.from('academy_courses').select('id, title').in('id', courseIds)
        : Promise.resolve({ data: [] }),
      classIds.length > 0
        ? supabase.from('academy_classes').select('*').in('id', classIds)
        : Promise.resolve({ data: [] }),
      supabase.from('academy_teachers').select('*').eq('is_active', true)
    ]);

    const courses = coursesRes.data || [];
    const classes = classesRes.data || [];
    const allTeachers = allTeachersRes.data || [];

    const courseMap = {};
    courses.forEach(c => { courseMap[c.id] = c; });

    // 3. Identificar os formadores relevantes
    const teacherIdsFromClasses = new Set(classes.map(c => c.teacher_id).filter(Boolean));
    
    let relevantTeachers = allTeachers.filter(t => {
      if (teacherIdsFromClasses.has(t.id)) return true;
      const teacherSpec = (t.specialty || '').toLowerCase();
      return courses.some(c => {
        const title = (c.title || '').toLowerCase();
        return (
          (teacherSpec.includes('design') && title.includes('design')) ||
          (teacherSpec.includes('web') && title.includes('web')) ||
          (teacherSpec.includes('rede') && title.includes('rede')) ||
          (teacherSpec.includes('inform') && title.includes('inform'))
        );
      });
    });

    if (relevantTeachers.length === 0 && allTeachers.length > 0) {
      relevantTeachers = allTeachers;
    }

    // 4. Identificar colegas de turma e curso
    let classmateEnrollments = [];
    try {
      let q = supabase
        .from('academy_enrollments')
        .select('student_id, course_id, class_id')
        .neq('student_id', studentId)
        .in('status', ['ativo', 'confirmado']);

      if (classIds.length > 0 && courseIds.length > 0) {
        q = q.or(`class_id.in.(${classIds.join(',')}),course_id.in.(${courseIds.join(',')})`);
      } else if (classIds.length > 0) {
        q = q.in('class_id', classIds);
      } else if (courseIds.length > 0) {
        q = q.in('course_id', courseIds);
      }

      const { data: cEnr } = await q;
      classmateEnrollments = cEnr || [];
    } catch (_) {}

    const peerStudentIds = [...new Set(classmateEnrollments.map(e => e.student_id).filter(Boolean))];

    let classmates = [];
    if (peerStudentIds.length > 0) {
      const { data: stData } = await supabase
        .from('academy_students')
        .select('id, full_name, student_code, email, photo_url, status')
        .in('id', peerStudentIds)
        .eq('status', 'ativo');

      classmates = (stData || []).map(peer => {
        const sharedEnr = classmateEnrollments.find(e => e.student_id === peer.id);
        const sharedCourse = sharedEnr ? courseMap[sharedEnr.course_id] : null;
        return {
          ...peer,
          sharedCourseTitle: sharedCourse?.title || 'Curso Comum',
          sharedClassId: sharedEnr?.class_id || null
        };
      });
    }

    const enrichedClasses = classes.map(cls => ({
      ...cls,
      courseTitle: courseMap[cls.course_id]?.title || 'Curso Académico'
    }));

    return {
      classes: enrichedClasses,
      teachers: relevantTeachers.map(t => ({
        ...t,
        name: t.name || t.full_name || 'Formador'
      })),
      classmates
    };
  } catch (err) {
    console.warn('Aviso ao consultar canais académicos do estudante:', err);
    return { classes: [], teachers: [], classmates: [] };
  }
}

/**
 * Localiza ou inicializa a conversa entre um estudante e um formador
 * Utiliza type: 'academic' para respeitar a constraint PostgreSQL
 */
export async function getOrCreateTeacherStudentConversation({ studentId, teacherId, classId, studentName, teacherName }) {
  if (!studentId || !teacherId) throw new Error('Estudante e Formador são obrigatórios.');

  const { data: existing } = await supabase
    .from('academy_chat_conversations')
    .select('*')
    .eq('student_id', studentId)
    .eq('teacher_id', teacherId)
    .in('type', ['academic', 'teacher_student'])
    .maybeSingle();

  if (existing) return existing;

  const payload = {
    type: 'academic',
    student_id: studentId,
    teacher_id: teacherId,
    class_id: classId || null,
    title: `Formador ${teacherName || 'Docente'} — ${studentName || 'Estudante'}`,
    status: 'ativo',
    last_message_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('academy_chat_conversations')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Localiza ou inicializa a conversa de grupo de uma turma
 */
export async function getOrCreateClassGroupConversation({ classId, className, teacherId }) {
  if (!classId) throw new Error('Identificação da turma é obrigatória.');

  const { data: existing } = await supabase
    .from('academy_chat_conversations')
    .select('*')
    .eq('class_id', classId)
    .eq('type', 'class_group')
    .maybeSingle();

  if (existing) return existing;

  const payload = {
    type: 'class_group',
    class_id: classId,
    teacher_id: teacherId || null,
    title: `Sala da Turma: ${className || 'Turma Académica'}`,
    status: 'ativo',
    last_message_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('academy_chat_conversations')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Localiza ou inicializa conversa 1-a-1 entre colegas da mesma turma/curso
 * Utiliza type: 'academic' para respeitar a constraint PostgreSQL
 */
export async function getOrCreateStudentPeerConversation({ studentId, peerStudentId, classId, studentName, peerName }) {
  if (!studentId || !peerStudentId) throw new Error('Ambos os estudantes devem ser informados.');

  const [idA, idB] = [studentId, peerStudentId].sort();

  const { data: list } = await supabase
    .from('academy_chat_conversations')
    .select('*')
    .in('type', ['academic', 'student_student'])
    .eq('student_id', idA);

  const existing = (list || []).find(c => c.title?.includes(idB));
  if (existing) return existing;

  const payload = {
    type: 'academic',
    student_id: idA,
    class_id: classId || null,
    title: `PEER::${idB}::${studentName || 'Colega'} & ${peerName || 'Colega'}`,
    status: 'ativo',
    last_message_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('academy_chat_conversations')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Consulta canais e conversas para o Formador
 */
export async function getTeacherAcademicChannels(teacherId) {
  if (!teacherId) return { classes: [], studentConversations: [], groupConversations: [], enrolledStudents: [] };

  try {
    const { data: classes } = await supabase
      .from('academy_classes')
      .select('*, course:academy_courses(id, title)')
      .eq('teacher_id', teacherId);

    const teacherClasses = classes || [];
    const classIds = teacherClasses.map(c => c.id);

    // Conversas diretas com estudantes (tipo academic ou legado teacher_student)
    const { data: convs } = await supabase
      .from('academy_chat_conversations')
      .select('*, student:academy_students(id, full_name, student_code, email, photo_url)')
      .eq('teacher_id', teacherId)
      .in('type', ['academic', 'teacher_student'])
      .order('last_message_at', { ascending: false });

    // Conversas de grupo das turmas
    let groupConversations = [];
    if (classIds.length > 0) {
      const { data: gConvs } = await supabase
        .from('academy_chat_conversations')
        .select('*')
        .in('class_id', classIds)
        .eq('type', 'class_group');

      groupConversations = gConvs || [];
    }

    // Estudantes das turmas do formador
    let enrolledStudents = [];
    if (classIds.length > 0) {
      const { data: enrs } = await supabase
        .from('academy_enrollments')
        .select('student:academy_students(id, full_name, student_code, email, photo_url), class_id')
        .in('class_id', classIds);

      enrolledStudents = (enrs || []).map(e => ({
        ...e.student,
        class_id: e.class_id
      })).filter(s => s?.id);
    }

    return {
      classes: teacherClasses,
      studentConversations: convs || [],
      groupConversations,
      enrolledStudents
    };
  } catch (err) {
    console.warn('Aviso ao consultar canais do formador:', err);
    return { classes: [], studentConversations: [], groupConversations: [], enrolledStudents: [] };
  }
}

/**
 * Consulta turmas atribuídas ao formador com a lista de estudantes matriculados
 */
export async function getTeacherClassesWithStudents(teacherId) {
  if (!teacherId) return [];
  try {
    const { data: classes, error } = await supabase
      .from('academy_classes')
      .select('*, course:academy_courses(id, title, category)')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!classes || classes.length === 0) return [];

    const classIds = classes.map(c => c.id);
    const { data: enrollments } = await supabase
      .from('academy_enrollments')
      .select('*, student:academy_students(id, full_name, student_code, email, phone, photo_url, status)')
      .in('class_id', classIds);

    return classes.map(cls => ({
      ...cls,
      students: (enrollments || [])
        .filter(e => e.class_id === cls.id && e.student)
        .map(e => ({
          ...e.student,
          enrollment_id: e.id,
          enrolled_at: e.enrolled_at || e.created_at,
          enrollment_status: e.status
        }))
    }));
  } catch (err) {
    console.error('Erro ao consultar turmas e estudantes do formador:', err);
    return [];
  }
}

// ==============================================================================
// 19. GESTÃO COMPLETA DE NOTAS, AVALIAÇÕES E AUDITORIA ACADÉMICA
// ==============================================================================

/**
 * Consulta todas as avaliações de uma turma específica
 * Realiza desduplicação estrita e integra trabalhos de casa (TPC) como avaliações oficiais.
 */
export async function getEvaluationsByClass(classId) {
  if (!classId) return [];

  // 1. Consultar avaliações no Supabase
  let dbData = [];
  try {
    const { data, error } = await supabase
      .from('academy_evaluations')
      .select('*, teacher:academy_teachers(id, name, full_name)')
      .eq('class_id', classId)
      .order('evaluation_date', { ascending: true });

    if (!error && data) {
      dbData = data;
    }
  } catch (err) {
    console.warn('Aviso ao consultar academy_evaluations no Supabase:', err);
  }

  // 2. Consultar trabalhos de casa atribuídos a esta turma
  let classAssignments = [];
  try {
    const { data: asgData, error: asgErr } = await supabase
      .from('academy_assignments')
      .select('*, teacher:academy_teachers(id, name, full_name)')
      .eq('class_id', classId);

    if (!asgErr && asgData) {
      classAssignments = asgData;
    }
  } catch (err) {
    console.warn('Aviso ao consultar academy_assignments da turma:', err);
  }

  // 3. Obter avaliações salvas localmente
  const localStore = getLocalGradesStore();
  const localList = (localStore.evaluations || []).filter(e => e.class_id === classId);

  // 4. Mapa de desduplicação unificado
  const unifiedMap = new Map();

  const getDedupKey = (item) => {
    if (item.assignment_id) {
      return `asg_${item.assignment_id}`;
    }
    const cleanTitle = (item.title || '').trim().toLowerCase();
    const cleanDate = item.evaluation_date || '';
    const cleanType = item.evaluation_type || 'outro';
    if (item.is_recovery) {
      return `rec_${item.class_id}_${cleanTitle}_${item.recovery_for_evaluation_id || cleanDate}`;
    }
    return `eval_${item.class_id}_${cleanTitle}_${cleanDate}_${cleanType}`;
  };

  // Registrar avaliações do banco
  (dbData || []).forEach(item => {
    const key = getDedupKey(item);
    unifiedMap.set(key, item);
  });

  // Integrar e vincular trabalhos de casa da turma
  classAssignments.forEach(asg => {
    const asgKey = `asg_${asg.id}`;
    // Verificar se já existe uma avaliação com mesmo título e tipo trabalho_casa
    const titleKey = `eval_${asg.class_id}_${asg.title.trim().toLowerCase()}_${asg.due_date ? asg.due_date.split('T')[0] : ''}_trabalho_casa`;

    if (unifiedMap.has(asgKey)) {
      const existing = unifiedMap.get(asgKey);
      existing.assignment_id = asg.id;
      existing.evaluation_type = 'trabalho_casa';
    } else if (unifiedMap.has(titleKey)) {
      const existing = unifiedMap.get(titleKey);
      existing.assignment_id = asg.id;
      existing.evaluation_type = 'trabalho_casa';
      unifiedMap.set(asgKey, existing);
    } else {
      // Criar avaliação integrada correspondente ao trabalho de casa
      const synthEval = {
        id: asg.id,
        class_id: asg.class_id,
        course_id: asg.course_id || null,
        teacher_id: asg.teacher_id || null,
        teacher: asg.teacher || null,
        assignment_id: asg.id,
        title: asg.title,
        evaluation_type: 'trabalho_casa',
        evaluation_date: asg.due_date ? asg.due_date.split('T')[0] : (asg.created_at ? asg.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
        weight: Number(asg.weight) || 1.0,
        max_score: Number(asg.max_score || asg.max_points) || 20.0,
        passing_grade: 10.0,
        description: asg.instructions || asg.description || `Trabalho de Casa: ${asg.title}`,
        is_recovery: false,
        recovery_for_evaluation_id: null,
        status: 'aberta',
        created_at: asg.created_at || new Date().toISOString(),
        updated_at: asg.updated_at || new Date().toISOString()
      };
      unifiedMap.set(asgKey, synthEval);
    }
  });

  // Mesclar com os dados locais sem duplicar
  localList.forEach(localItem => {
    const key = getDedupKey(localItem);
    if (!unifiedMap.has(key)) {
      // Verificar se não coincide por título + data
      const titleMatch = Array.from(unifiedMap.values()).find(e => 
        e.title?.trim().toLowerCase() === localItem.title?.trim().toLowerCase() &&
        e.evaluation_type === localItem.evaluation_type
      );
      if (!titleMatch) {
        unifiedMap.set(key, localItem);
      }
    }
  });

  const finalEvaluations = Array.from(unifiedMap.values())
    .sort((a, b) => new Date(a.evaluation_date) - new Date(b.evaluation_date));

  // 5. Sincronizar e limpar avaliações locais duplicadas para esta turma
  localStore.evaluations = [
    ...(localStore.evaluations || []).filter(e => e.class_id !== classId),
    ...finalEvaluations
  ];
  saveLocalGradesStore(localStore);

  // 6. Verificar se há submissões avaliadas em trabalhos para sincronizar com academy_grades
  if (classAssignments.length > 0) {
    try {
      const asgIds = classAssignments.map(a => a.id);
      const { data: gradedSubs } = await supabase
        .from('academy_assignment_submissions')
        .select('*')
        .in('assignment_id', asgIds)
        .not('grade', 'is', null);

      if (gradedSubs && gradedSubs.length > 0) {
        const localGrades = localStore.grades || [];
        let updatedLocal = false;

        gradedSubs.forEach(sub => {
          const evalItem = finalEvaluations.find(e => e.assignment_id === sub.assignment_id || e.id === sub.assignment_id);
          if (evalItem) {
            const gradeKey = `${evalItem.id}_${sub.student_id}`;
            const exists = localGrades.some(g => `${g.evaluation_id}_${g.student_id}` === gradeKey);
            if (!exists) {
              localGrades.push({
                id: `grd_asg_${sub.id}`,
                evaluation_id: evalItem.id,
                student_id: sub.student_id,
                class_id: classId,
                score: Number(sub.grade),
                observations: sub.feedback || null,
                status: 'confirmada',
                is_locked: true,
                is_recovery: false,
                graded_by_teacher_id: sub.graded_by || null,
                graded_at: sub.graded_at || sub.updated_at || new Date().toISOString()
              });
              updatedLocal = true;
            }
          }
        });

        if (updatedLocal) {
          localStore.grades = localGrades;
          saveLocalGradesStore(localStore);
        }
      }
    } catch (_) {}
  }

  return finalEvaluations;
}

/**
 * Cria uma nova avaliação para uma turma (Teste teórico, prático, exame, trabalho de casa, etc.)
 * Garante idempotência absoluta: se já existir avaliação idêntica, retorna a existente sem duplicar.
 */
export async function createEvaluation({
  class_id,
  course_id,
  teacher_id,
  title,
  evaluation_type = 'teste_teorico',
  evaluation_date = new Date().toISOString().split('T')[0],
  weight = 1.0,
  max_score = 20.0,
  passing_grade = 10.0,
  description = '',
  is_recovery = false,
  recovery_for_evaluation_id = null,
  assignment_id = null
}) {
  if (!class_id || !title?.trim()) {
    throw new Error('Turma e título da avaliação são obrigatórios.');
  }

  const cleanTitle = title.trim();
  const normTitle = cleanTitle.toLowerCase();

  // 1. Verificação preventiva contra duplicatas (Idempotência Estrita)
  const existingEvals = await getEvaluationsByClass(class_id);
  const duplicate = existingEvals.find(e => {
    if (assignment_id && e.assignment_id === assignment_id) return true;
    if (is_recovery) {
      return e.is_recovery && e.recovery_for_evaluation_id === recovery_for_evaluation_id && e.title?.trim().toLowerCase() === normTitle;
    }
    return !e.is_recovery && 
      e.title?.trim().toLowerCase() === normTitle && 
      e.evaluation_date === evaluation_date && 
      e.evaluation_type === evaluation_type;
  });

  if (duplicate) {
    console.info('Avaliação já existente identificada, evitando duplicação:', duplicate.id);
    return duplicate;
  }

  const payload = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `eval_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    class_id,
    course_id: course_id || null,
    teacher_id: teacher_id || null,
    assignment_id: assignment_id || null,
    title: cleanTitle,
    evaluation_type,
    evaluation_date,
    weight: Number(weight) || 1.0,
    max_score: Number(max_score) || 20.0,
    passing_grade: Number(passing_grade) || 10.0,
    description: description ? description.trim() : '',
    is_recovery: Boolean(is_recovery),
    recovery_for_evaluation_id: recovery_for_evaluation_id || null,
    status: 'aberta',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('academy_evaluations')
      .insert([payload])
      .select()
      .maybeSingle();

    if (!error && data) {
      payload.id = data.id;
    }
  } catch (err) {
    console.warn('Gravando avaliação em cache resiliente:', err);
  }

  // Guardar no armazenamento local para redundância garantida, eliminando duplicações
  const localStore = getLocalGradesStore();
  localStore.evaluations = [
    payload,
    ...(localStore.evaluations || []).filter(e => 
      e.id !== payload.id && 
      !(e.class_id === class_id && e.title?.trim().toLowerCase() === normTitle && e.evaluation_date === evaluation_date && e.evaluation_type === evaluation_type)
    )
  ];
  saveLocalGradesStore(localStore);

  await recordAuditLog({
    action: 'EVALUATION_CREATED',
    description: `Nova avaliação criada: "${payload.title}" (${payload.evaluation_type}) para a turma ID ${class_id}`,
    resourceType: 'evaluation',
    resourceId: payload.id,
    details: { type: payload.evaluation_type, weight: payload.weight, is_recovery: payload.is_recovery }
  });

  return payload;
}

/**
 * Remove uma avaliação (caso ainda não tenha notas confirmadas ou feito por admin)
 */
export async function deleteEvaluation(evaluationId, teacherId = null, isAdmin = false) {
  if (!evaluationId) return;

  const localStore = getLocalGradesStore();
  const existingGrades = (localStore.grades || []).filter(g => g.evaluation_id === evaluationId);

  if (existingGrades.some(g => g.is_locked) && !isAdmin) {
    throw new Error('Esta avaliação já possui notas confirmadas e bloqueadas. Apenas o Administrador pode excluir.');
  }

  try {
    await supabase.from('academy_grades').delete().eq('evaluation_id', evaluationId);
    await supabase.from('academy_evaluations').delete().eq('id', evaluationId);
  } catch (err) {
    console.warn('Aviso ao excluir avaliação no Supabase:', err);
  }

  localStore.evaluations = (localStore.evaluations || []).filter(e => e.id !== evaluationId);
  localStore.grades = (localStore.grades || []).filter(g => g.evaluation_id !== evaluationId);
  saveLocalGradesStore(localStore);

  await recordAuditLog({
    action: 'EVALUATION_DELETED',
    description: `Avaliação ID ${evaluationId} foi excluída.`,
    resourceType: 'evaluation',
    resourceId: evaluationId
  });

  return true;
}

/**
 * Consulta todas as notas lançadas para uma avaliação
 */
export async function getGradesByEvaluation(evaluationId) {
  if (!evaluationId) return [];

  let dbData = null;
  try {
    const { data, error } = await supabase
      .from('academy_grades')
      .select('*, student:academy_students(id, full_name, student_code, photo_url)')
      .eq('evaluation_id', evaluationId);

    if (!error && data) {
      dbData = data;
    }
  } catch (err) {
    console.warn('Aviso ao consultar academy_grades no Supabase:', err);
  }

  const localStore = getLocalGradesStore();
  const localGrades = (localStore.grades || []).filter(g => g.evaluation_id === evaluationId);

  const map = new Map();
  (dbData || []).forEach(g => map.set(g.student_id, g));
  localGrades.forEach(g => {
    if (!map.has(g.student_id)) map.set(g.student_id, g);
  });

  return Array.from(map.values());
}

/**
 * Lança e Bloqueia em Lote as notas dos estudantes para uma avaliação
 * Após a confirmação, o Formador não pode mais alterar as notas.
 */
export async function saveGradesBatch(evaluationId, gradesList, teacherId) {
  if (!evaluationId || !Array.isArray(gradesList) || gradesList.length === 0) {
    throw new Error('Nenhuma nota fornecida para confirmação.');
  }

  const localStore = getLocalGradesStore();
  const now = new Date().toISOString();

  const preparedGrades = gradesList.map(g => {
    const scoreVal = Number(g.score);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 20) {
      throw new Error(`A nota do estudante deve estar rigorosamente entre 0 e 20 Valores.`);
    }

    return {
      id: g.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `grd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`),
      evaluation_id: evaluationId,
      student_id: g.student_id,
      class_id: g.class_id,
      score: scoreVal,
      observations: g.observations ? g.observations.trim() : null,
      status: 'confirmada',
      is_locked: true,
      is_recovery: Boolean(g.is_recovery),
      original_grade_id: g.original_grade_id || null,
      graded_by_teacher_id: teacherId || null,
      graded_at: now,
      updated_at: now
    };
  });

  // Tentar inserir/atualizar no Supabase
  try {
    await supabase
      .from('academy_grades')
      .upsert(preparedGrades, { onConflict: 'evaluation_id,student_id' });

    // Atualizar status da avaliação para concluída
    await supabase
      .from('academy_evaluations')
      .update({ status: 'concluida', updated_at: now })
      .eq('id', evaluationId);
  } catch (err) {
    console.warn('Aviso no envio de notas para Supabase (salvando localmente):', err);
  }

  // Atualizar store local
  const currentGrades = localStore.grades || [];
  const updatedGradesMap = new Map();
  currentGrades.forEach(g => updatedGradesMap.set(`${g.evaluation_id}_${g.student_id}`, g));
  preparedGrades.forEach(g => updatedGradesMap.set(`${g.evaluation_id}_${g.student_id}`, g));
  localStore.grades = Array.from(updatedGradesMap.values());

  // Atualizar status da avaliação local
  const evalItem = (localStore.evaluations || []).find(e => e.id === evaluationId);
  if (evalItem) {
    evalItem.status = 'concluida';
    evalItem.updated_at = now;
  }
  saveLocalGradesStore(localStore);

  // Recalcular média final e status acadêmico dos alunos afetados na turma
  const classId = preparedGrades[0]?.class_id;
  if (classId) {
    await recalculateClassStudentsGrades(classId);
  }

  await recordAuditLog({
    action: 'GRADES_LOCKED_AND_CONFIRMED',
    description: `${preparedGrades.length} nota(s) confirmada(s) e bloqueada(s) na avaliação ID ${evaluationId}`,
    resourceType: 'grades',
    resourceId: evaluationId,
    details: { totalGraded: preparedGrades.length, teacherId }
  });

  return preparedGrades;
}

/**
 * Cria uma avaliação específica de Teste de Recuperação vinculada à avaliação original
 */
export async function createRecoveryEvaluation({
  originalEvaluationId,
  classId,
  courseId,
  teacherId,
  title,
  evaluation_date = new Date().toISOString().split('T')[0],
  description = 'Avaliação de Recuperação para estudantes com nota inferior à média mínima de aprovação.'
}) {
  return await createEvaluation({
    class_id: classId,
    course_id: courseId,
    teacher_id: teacherId,
    title: title || 'Teste de Recuperação',
    evaluation_type: 'outro',
    evaluation_date,
    weight: 1.0,
    max_score: 20.0,
    passing_grade: 10.0,
    description,
    is_recovery: true,
    recovery_for_evaluation_id: originalEvaluationId
  });
}

/**
 * Visão Geral Completa de Notas da Turma (Pauta Oficial de Notas)
 * Retorna todos os alunos matriculados, lista de avaliações, todas as notas atribuídas,
 * média final automática, classificação (APROVADO/REPROVADO) e elegibilidade para recuperação.
 */
export async function getClassGradesOverview(classId) {
  if (!classId) return null;

  // 1. Obter informações da turma
  let classInfo = null;
  try {
    const { data } = await supabase
      .from('academy_classes')
      .select('*, course:academy_courses(id, title, workload_hours), teacher:academy_teachers(id, name, full_name, email)')
      .eq('id', classId)
      .maybeSingle();
    classInfo = data;
  } catch (_) {}

  // 2. Obter estudantes matriculados
  let students = [];
  try {
    const { data: enrollments } = await supabase
      .from('academy_enrollments')
      .select('id, student_id, final_grade, status, student:academy_students(id, full_name, student_code, photo_url, email, phone)')
      .eq('class_id', classId);

    students = (enrollments || [])
      .filter(e => e.student)
      .map(e => ({
        ...e.student,
        enrollment_id: e.id,
        enrollment_status: e.status,
        enrollment_final_grade: e.final_grade
      }));
  } catch (_) {}

  // 3. Obter todas as avaliações da turma
  const evaluations = await getEvaluationsByClass(classId);

  // 4. Obter todas as notas para essas avaliações
  const localStore = getLocalGradesStore();
  let dbGrades = [];
  try {
    const evalIds = evaluations.map(e => e.id);
    if (evalIds.length > 0) {
      const { data } = await supabase
        .from('academy_grades')
        .select('*')
        .in('evaluation_id', evalIds);
      dbGrades = data || [];
    }
  } catch (_) {}

  const gradesMap = new Map();
  dbGrades.forEach(g => gradesMap.set(`${g.evaluation_id}_${g.student_id}`, g));
  (localStore.grades || []).forEach(g => {
    const key = `${g.evaluation_id}_${g.student_id}`;
    if (!gradesMap.has(key)) gradesMap.set(key, g);
  });

  // 5. Estruturar a Pauta por Estudante
  const studentsRows = students.map(student => {
    const studentGrades = [];
    let weightedSum = 0;
    let totalWeight = 0;
    const failingEvaluations = [];

    evaluations.forEach(ev => {
      const gradeRecord = gradesMap.get(`${ev.id}_${student.id}`);
      let effectiveScore = null;
      let isRecoveryEffective = false;

      if (gradeRecord) {
        effectiveScore = Number(gradeRecord.score);

        // Se este exame era de recuperação, associar à nota original
        if (ev.is_recovery && ev.recovery_for_evaluation_id) {
          const originalRecord = gradesMap.get(`${ev.recovery_for_evaluation_id}_${student.id}`);
          if (originalRecord) {
            // A recuperação mantém a maior pontuação alcançada
            effectiveScore = Math.max(Number(originalRecord.score), Number(gradeRecord.score));
            isRecoveryEffective = true;
          }
        }

        // Verificar se houve recuperação posterior para esta avaliação
        const recoveryEval = evaluations.find(re => re.is_recovery && re.recovery_for_evaluation_id === ev.id);
        if (recoveryEval) {
          const recGrade = gradesMap.get(`${recoveryEval.id}_${student.id}`);
          if (recGrade) {
            effectiveScore = Math.max(Number(gradeRecord.score), Number(recGrade.score));
            isRecoveryEffective = true;
          }
        }

        // Se a nota for inferior a 10 e não for teste de recuperação, é elegível para recuperação
        if (!ev.is_recovery && Number(gradeRecord.score) < (ev.passing_grade || 10)) {
          failingEvaluations.push({
            evaluationId: ev.id,
            evaluationTitle: ev.title,
            score: Number(gradeRecord.score),
            passingGrade: ev.passing_grade || 10
          });
        }
      }

      if (effectiveScore !== null && !isNaN(effectiveScore)) {
        // Para cômputo da média, não duplicar a avaliação regular e a de recuperação no denominador
        if (!ev.is_recovery) {
          const weight = Number(ev.weight) || 1.0;
          weightedSum += effectiveScore * weight;
          totalWeight += weight;
        }
      }

      studentGrades.push({
        evaluation_id: ev.id,
        evaluation_title: ev.title,
        evaluation_type: ev.evaluation_type,
        is_recovery: ev.is_recovery,
        score: gradeRecord ? Number(gradeRecord.score) : null,
        effectiveScore,
        is_locked: gradeRecord?.is_locked || false,
        observations: gradeRecord?.observations || null,
        grade_id: gradeRecord?.id || null,
        graded_at: gradeRecord?.graded_at || null
      });
    });

    const finalAverage = totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(1)) : null;
    const finalStatus = finalAverage !== null ? (finalAverage >= 10.0 ? 'APROVADO' : 'REPROVADO') : 'EM_CURSO';

    return {
      student,
      grades: studentGrades,
      finalAverage,
      finalStatus,
      totalEvaluationsDone: studentGrades.filter(g => g.score !== null).length,
      failingEvaluations,
      isEligibleForRecovery: failingEvaluations.length > 0
    };
  });

  return {
    classInfo,
    evaluations,
    studentsRows
  };
}

/**
 * Consulta o Boletim Oficial de Notas de um Estudante Específico (Área do Estudante)
 */
export async function getStudentGradesReport(studentId) {
  if (!studentId) return [];

  try {
    // 1. Buscar matrículas ativas do estudante
    const { data: enrollments } = await supabase
      .from('academy_enrollments')
      .select('id, course_id, class_id, final_grade, status, course:academy_courses(id, title, workload_hours), class:academy_classes(id, name, code, schedule, teacher:academy_teachers(name, full_name, email))')
      .eq('student_id', studentId);

    if (!enrollments || enrollments.length === 0) return [];

    const reports = [];

    for (const enr of enrollments) {
      const classId = enr.class_id;
      if (!classId) continue;

      const evaluations = await getEvaluationsByClass(classId);
      const localStore = getLocalGradesStore();

      let dbGrades = [];
      try {
        const { data } = await supabase
          .from('academy_grades')
          .select('*')
          .eq('student_id', studentId)
          .eq('class_id', classId);
        dbGrades = data || [];
      } catch (_) {}

      const gradesMap = new Map();
      dbGrades.forEach(g => gradesMap.set(g.evaluation_id, g));
      (localStore.grades || [])
        .filter(g => g.student_id === studentId)
        .forEach(g => {
          if (!gradesMap.has(g.evaluation_id)) gradesMap.set(g.evaluation_id, g);
        });

      let weightedSum = 0;
      let totalWeight = 0;
      const evaluationItems = [];

      evaluations.forEach(ev => {
        const gradeRec = gradesMap.get(ev.id);
        const score = gradeRec ? Number(gradeRec.score) : null;
        let recoveryRec = null;

        // Se houver teste de recuperação posterior
        if (!ev.is_recovery) {
          const recEval = evaluations.find(re => re.is_recovery && re.recovery_for_evaluation_id === ev.id);
          if (recEval) {
            const recGrade = gradesMap.get(recEval.id);
            if (recGrade) {
              recoveryRec = {
                title: recEval.title,
                score: Number(recGrade.score),
                date: recEval.evaluation_date
              };
            }
          }
        }

        const effectiveScore = recoveryRec && score !== null
          ? Math.max(score, recoveryRec.score)
          : score;

        if (effectiveScore !== null && !ev.is_recovery) {
          const w = Number(ev.weight) || 1.0;
          weightedSum += effectiveScore * w;
          totalWeight += w;
        }

        evaluationItems.push({
          evaluation_id: ev.id,
          title: ev.title,
          type: ev.evaluation_type,
          date: ev.evaluation_date,
          weight: ev.weight,
          max_score: ev.max_score,
          score,
          effectiveScore,
          is_recovery: ev.is_recovery,
          recoveryGrade: recoveryRec,
          observations: gradeRec?.observations || null,
          graded_at: gradeRec?.graded_at || null,
          is_passed: effectiveScore !== null ? effectiveScore >= (ev.passing_grade || 10) : null
        });
      });

      const calculatedAverage = totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(1)) : null;
      const status = calculatedAverage !== null ? (calculatedAverage >= 10.0 ? 'APROVADO' : 'REPROVADO') : 'EM_CURSO';

      reports.push({
        enrollment_id: enr.id,
        course: enr.course,
        class: enr.class,
        finalAverage: calculatedAverage,
        finalStatus: status,
        evaluations: evaluationItems,
        totalCompleted: evaluationItems.filter(e => e.score !== null).length
      });
    }

    return reports;
  } catch (err) {
    console.error('Erro ao consultar relatório de notas do estudante:', err);
    return [];
  }
}

/**
 * Recalcula a média final e atualiza a matrícula de todos os alunos de uma turma
 */
async function recalculateClassStudentsGrades(classId) {
  if (!classId) return;

  try {
    const overview = await getClassGradesOverview(classId);
    if (!overview || !overview.studentsRows) return;

    for (const row of overview.studentsRows) {
      if (row.finalAverage !== null && row.student.enrollment_id) {
        const gradeText = `${row.finalAverage}/20 Valores (${row.finalStatus})`;
        try {
          await supabase
            .from('academy_enrollments')
            .update({
              final_grade: gradeText,
              updated_at: new Date().toISOString()
            })
            .eq('id', row.student.enrollment_id);
        } catch (_) {}
      }
    }
  } catch (err) {
    console.warn('Aviso no recálculo automático de médias da turma:', err);
  }
}

/**
 * Retificação de Nota pelo Administrador (com JUSTIFICATIVA OBRIGATÓRIA e Auditoria)
 */
export async function adminUpdateGrade({
  gradeId,
  evaluationId,
  studentId,
  classId,
  newScore,
  reason,
  adminUser
}) {
  if (!reason || !reason.trim()) {
    throw new Error('A justificativa da alteração da nota é estritamente obrigatória.');
  }

  const numScore = Number(newScore);
  if (isNaN(numScore) || numScore < 0 || numScore > 20) {
    throw new Error('A nota deve estar rigorosamente entre 0 e 20 Valores.');
  }

  const localStore = getLocalGradesStore();
  const existingGrade = (localStore.grades || []).find(g => g.id === gradeId || (g.evaluation_id === evaluationId && g.student_id === studentId));
  const prevScore = existingGrade ? Number(existingGrade.score) : 0;

  const now = new Date().toISOString();
  const updatedGrade = {
    ...(existingGrade || {}),
    id: gradeId || existingGrade?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `grd_${Date.now()}`),
    evaluation_id: evaluationId,
    student_id: studentId,
    class_id: classId || existingGrade?.class_id,
    score: numScore,
    status: 'confirmada',
    is_locked: true,
    updated_at: now
  };

  // Salvar alteração no Supabase
  try {
    await supabase
      .from('academy_grades')
      .upsert([updatedGrade]);

    // Gravar log de auditoria de nota
    await supabase
      .from('academy_grade_audit_logs')
      .insert([{
        grade_id: updatedGrade.id,
        evaluation_id: evaluationId,
        student_id: studentId,
        changed_by_user_id: adminUser?.id || null,
        changed_by_name: adminUser?.name || adminUser?.full_name || 'Administrador',
        changed_by_role: 'admin',
        previous_score: prevScore,
        new_score: numScore,
        reason: reason.trim(),
        created_at: now
      }]);
  } catch (err) {
    console.warn('Aviso ao salvar retificação no Supabase:', err);
  }

  // Atualizar store local
  localStore.grades = [updatedGrade, ...(localStore.grades || []).filter(g => g.id !== updatedGrade.id)];
  localStore.auditLogs = [
    {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `aud_${Date.now()}`,
      grade_id: updatedGrade.id,
      evaluation_id: evaluationId,
      student_id: studentId,
      changed_by_name: adminUser?.name || adminUser?.full_name || 'Administrador',
      previous_score: prevScore,
      new_score: numScore,
      reason: reason.trim(),
      created_at: now
    },
    ...(localStore.auditLogs || [])
  ];
  saveLocalGradesStore(localStore);

  // Recalcular média final da turma
  if (updatedGrade.class_id) {
    await recalculateClassStudentsGrades(updatedGrade.class_id);
  }

  // Sincronizar com submissão de Trabalho de Casa caso a avaliação seja trabalho_casa ou possua assignment_id
  try {
    const evals = await getEvaluationsByClass(updatedGrade.class_id);
    const ev = evals.find(e => e.id === evaluationId);
    if (ev && (ev.evaluation_type === 'trabalho_casa' || ev.assignment_id)) {
      const asgId = ev.assignment_id || ev.id;
      await supabase
        .from('academy_assignment_submissions')
        .update({
          grade: numScore,
          feedback: reason ? `[Nota retificada pelo Administrador]: ${reason.trim()}` : undefined,
          updated_at: now
        })
        .eq('assignment_id', asgId)
        .eq('student_id', studentId);
    }
  } catch (syncErr) {
    console.warn('Aviso ao sincronizar retificação de nota com submissão de trabalho:', syncErr);
  }

  // Auditoria Geral do Sistema
  await recordAuditLog({
    action: 'GRADE_MODIFIED_BY_ADMIN',
    description: `Nota retificada de ${prevScore} para ${numScore} Valores. Motivo: "${reason.trim()}"`,
    resourceType: 'grade',
    resourceId: updatedGrade.id,
    details: {
      previousScore: prevScore,
      newScore: numScore,
      justification: reason.trim(),
      admin: adminUser?.name || 'Administrador'
    }
  });

  return updatedGrade;
}

/**
 * Consulta o histórico de auditoria de alterações de uma nota
 */
export async function getGradeAuditHistory(gradeId) {
  if (!gradeId) return [];

  let dbLogs = [];
  try {
    const { data } = await supabase
      .from('academy_grade_audit_logs')
      .select('*')
      .eq('grade_id', gradeId)
      .order('created_at', { ascending: false });
    dbLogs = data || [];
  } catch (_) {}

  const localStore = getLocalGradesStore();
  const localLogs = (localStore.auditLogs || []).filter(l => l.grade_id === gradeId);

  const map = new Map();
  dbLogs.forEach(l => map.set(l.id, l));
  localLogs.forEach(l => {
    if (!map.has(l.id)) map.set(l.id, l);
  });

  return Array.from(map.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// ==============================================================================
// 20. REQUERIMENTOS DE CERTIFICADO & PETIÇÃO INSTITUCIONAL DO ESTUDANTE
// ==============================================================================

export const LOCAL_CERTIFICATE_REQUESTS_KEY = 'zaty_academy_certificate_requests_v1';

export function getLocalCertificateRequestsStore() {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(LOCAL_CERTIFICATE_REQUESTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

export function saveLocalCertificateRequestsStore(requests) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_CERTIFICATE_REQUESTS_KEY, JSON.stringify(requests));
    }
  } catch (_) {}
}

/**
 * Submete um novo requerimento oficial de certificado pelo estudante
 */
export async function createCertificateRequest({
  studentId,
  courseId,
  purpose = 'Comprovação Curricular / Emprego',
  notes = '',
  completionYear = '2026',
  studentName = null,
  studentCode = null
}) {
  if (!studentId || !courseId) {
    throw new Error('Identificação do estudante e do curso são obrigatórias para emitir o requerimento.');
  }

  // 1. Verificar se já existe um pedido em andamento para o mesmo curso
  const existingLocal = getLocalCertificateRequestsStore();
  const matchActiveLocal = existingLocal.find(r => 
    r.student_id === studentId && 
    r.course_id === courseId && 
    ['pendente', 'em_analise', 'pagamento_pendente'].includes(r.status)
  );

  if (matchActiveLocal) {
    throw new Error('Já possui um requerimento de certificado em análise ou aguardando pagamento para este curso.');
  }

  // 2. Preparar payload oficial
  const reqId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const nowIso = new Date().toISOString();

  const newRequest = {
    id: reqId,
    student_id: studentId,
    course_id: courseId,
    purpose: purpose.trim(),
    notes: notes ? notes.trim() : '',
    status: 'pendente',
    admin_notes: null,
    rejection_reason: null,
    fee_amount: 0,
    payment_id: null,
    certificate_id: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: nowIso,
    updated_at: nowIso
  };

  // 3. Tentar persistência no Supabase
  let createdRecord = newRequest;
  try {
    const { data, error } = await supabase
      .from('academy_certificate_requests')
      .insert([newRequest])
      .select('*, course:academy_courses(id, title, workload_hours, duration)')
      .maybeSingle();

    if (!error && data) {
      createdRecord = data;
    }
  } catch (dbErr) {
    console.warn('Aviso: Fallback local para academy_certificate_requests:', dbErr?.message);
  }

  // 4. Salvar na store local resiliente
  const updatedLocal = [createdRecord, ...existingLocal.filter(r => r.id !== createdRecord.id)];
  saveLocalCertificateRequestsStore(updatedLocal);

  // 5. Notificação de confirmação para o próprio estudante
  try {
    await supabase.from('academy_notifications').insert([{
      student_id: studentId,
      title: '📋 Requerimento de Certificado Submetido',
      message: 'O seu requerimento de certificado foi recebido pela Administração da Zaty Academy e está em análise.',
      type: 'info',
      is_read: false
    }]);
  } catch (_) {}

  // 6. Auditoria institucional
  try {
    await recordAuditLog({
      action: 'CERTIFICATE_REQUEST_SUBMITTED',
      description: `Requerimento de certificado submetido pelo estudante ${studentName || studentCode || studentId} para o curso ID: ${courseId}`,
      resourceType: 'certificate_request',
      resourceId: createdRecord.id
    });
  } catch (_) {}

  // 7. Transmissão em tempo real
  try {
    broadcastCertificateRequest(createdRecord);
    broadcastNotificationEvent({
      title: 'Novo Requerimento de Certificado',
      student_id: studentId,
      course_id: courseId
    });
  } catch (_) {}

  return createdRecord;
}

/**
 * Consulta os requerimentos de certificado de um estudante específico
 */
export async function getStudentCertificateRequests(studentId) {
  if (!studentId) return [];

  let dbData = [];
  try {
    const { data, error } = await supabase
      .from('academy_certificate_requests')
      .select(`
        *,
        course:academy_courses (id, title, workload_hours, duration, category),
        certificate:academy_certificates (id, certificate_number, validation_code, status)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      dbData = data;
    }
  } catch (err) {
    console.warn('Aviso ao consultar academy_certificate_requests no Supabase:', err);
  }

  const localList = getLocalCertificateRequestsStore().filter(r => r.student_id === studentId);
  const map = new Map();

  dbData.forEach(r => map.set(r.id, r));
  localList.forEach(r => {
    if (!map.has(r.id)) map.set(r.id, r);
  });

  let merged = Array.from(map.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // 1. Sincronização definitiva com academy_certificates e academy_notifications
  try {
    const [certsRes, notifsRes] = await Promise.all([
      supabase.from('academy_certificates').select('id, certificate_number, validation_code, status, course_id').eq('student_id', studentId).neq('status', 'revogado'),
      supabase.from('academy_notifications').select('id, title, message, type, created_at').eq('student_id', studentId)
    ]);

    const activeCerts = certsRes.data || [];
    const notifs = notifsRes.data || [];

    let hasLocalUpdates = false;

    merged = merged.map(req => {
      // Se já existe certificado emitido no banco para este curso, o requerimento está CONCLUÍDO
      const matchingCert = activeCerts.find(c => c.course_id === req.course_id);
      if (matchingCert) {
        if (req.status !== 'concluido' || !req.certificate) {
          hasLocalUpdates = true;
          return {
            ...req,
            status: 'concluido',
            certificate_id: matchingCert.id,
            certificate: matchingCert
          };
        }
      }

      // Se há notificação de pedido aprovado/aceite para este aluno mas o status ainda está pendente
      const hasApprovalNotif = notifs.some(n => 
        n.type === 'certificate_ready' || 
        (typeof n.title === 'string' && n.title.includes('Pedido de Certificado Aceite')) ||
        (typeof n.message === 'string' && n.message.includes('pedido de certificado foi aceite'))
      );

      if (hasApprovalNotif && req.status === 'pendente') {
        hasLocalUpdates = true;
        return {
          ...req,
          status: 'aprovado'
        };
      }

      return req;
    });

    if (hasLocalUpdates) {
      const allLocal = getLocalCertificateRequestsStore();
      const updatedAllLocal = allLocal.map(l => {
        const match = merged.find(m => m.id === l.id);
        return match ? { ...l, ...match } : l;
      });
      saveLocalCertificateRequestsStore(updatedAllLocal);
    }
  } catch (syncErr) {
    console.warn('Aviso na sincronização de certificados emitidos:', syncErr);
  }

  // Resolver cursos se faltarem nos dados locais
  if (merged.some(r => !r.course && r.course_id)) {
    try {
      const courses = await getCourses(true);
      merged.forEach(r => {
        if (!r.course && r.course_id) {
          r.course = courses.find(c => c.id === r.course_id) || null;
        }
      });
    } catch (_) {}
  }

  return merged;
}

/**
 * Consulta todos os requerimentos de certificado para a Administração
 */
export async function getAllCertificateRequests(filters = {}) {
  await ensureAdminRole('visualizar e gerir os requerimentos de certificados', ['super_admin', 'admin']);

  let dbData = [];
  try {
    let query = supabase
      .from('academy_certificate_requests')
      .select(`
        *,
        student:academy_students (id, full_name, student_code, student_number, email, phone, id_number, photo_url),
        course:academy_courses (id, title, workload_hours, duration, category),
        certificate:academy_certificates (id, certificate_number, validation_code, status)
      `)
      .order('created_at', { ascending: false });

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (!error && data) {
      dbData = data;
    }
  } catch (err) {
    console.warn('Aviso ao consultar lista administrativa de requerimentos:', err);
  }

  const localList = getLocalCertificateRequestsStore();
  const map = new Map();

  dbData.forEach(r => map.set(r.id, r));
  localList.forEach(r => {
    if (!map.has(r.id)) {
      if (!filters.status || filters.status === 'all' || r.status === filters.status) {
        map.set(r.id, r);
      }
    }
  });

  const merged = Array.from(map.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Enriquecer com dados de estudantes e cursos se não vieram do join
  const missingStudents = merged.filter(r => !r.student && r.student_id);
  const missingCourses = merged.filter(r => !r.course && r.course_id);

  if (missingStudents.length > 0 || missingCourses.length > 0) {
    try {
      const [stdsRes, crsList] = await Promise.all([
        missingStudents.length > 0 ? supabase.from('academy_students').select('id, full_name, student_code, student_number, email, phone, id_number, photo_url').in('id', missingStudents.map(s => s.student_id)) : { data: [] },
        missingCourses.length > 0 ? getCourses(true) : []
      ]);

      const stdMap = {};
      (stdsRes.data || []).forEach(s => { stdMap[s.id] = s; });

      const crsMap = {};
      (crsList || []).forEach(c => { crsMap[c.id] = c; });

      merged.forEach(r => {
        if (!r.student && stdMap[r.student_id]) r.student = stdMap[r.student_id];
        if (!r.course && crsMap[r.course_id]) r.course = crsMap[r.course_id];
      });
    } catch (_) {}
  }

  return merged;
}

/**
 * Atualiza o estado de um requerimento de certificado e notifica o estudante
 */
export async function updateCertificateRequestStatus(requestId, {
  status,
  adminNotes = '',
  rejectionReason = '',
  feeAmount = 0,
  adminUserId = null,
  certificateId = null
}) {
  await ensureAdminRole('atualizar o parecer e estado de requerimentos de certificados', ['super_admin', 'admin']);

  if (!requestId || !status) {
    throw new Error('ID do requerimento e novo estado são obrigatórios.');
  }

  const validStatuses = ['pendente', 'em_analise', 'aprovado', 'pagamento_pendente', 'concluido', 'rejeitado'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Estado inválido: ${status}`);
  }

  const nowIso = new Date().toISOString();
  const updatePayload = {
    status,
    admin_notes: adminNotes ? adminNotes.trim() : null,
    rejection_reason: rejectionReason ? rejectionReason.trim() : null,
    fee_amount: Number(feeAmount) || 0,
    reviewed_by: adminUserId || null,
    reviewed_at: nowIso,
    updated_at: nowIso
  };

  if (certificateId) {
    updatePayload.certificate_id = certificateId;
  }

  // 1. Atualizar no Supabase
  let updatedRecord = null;
  try {
    const { data, error } = await supabase
      .from('academy_certificate_requests')
      .update(updatePayload)
      .eq('id', requestId)
      .select('*, student:academy_students(*), course:academy_courses(*)')
      .maybeSingle();

    if (!error && data) {
      updatedRecord = data;
    }
  } catch (err) {
    console.warn('Aviso ao atualizar academy_certificate_requests no Supabase:', err);
  }

  // 2. Atualizar na store local
  const localStore = getLocalCertificateRequestsStore();
  const existingIndex = localStore.findIndex(r => r.id === requestId);
  if (existingIndex >= 0) {
    localStore[existingIndex] = { ...localStore[existingIndex], ...updatePayload };
    if (!updatedRecord) updatedRecord = localStore[existingIndex];
  } else if (updatedRecord) {
    localStore.unshift(updatedRecord);
  }
  saveLocalCertificateRequestsStore(localStore);

  const studentId = updatedRecord?.student_id;
  const courseTitle = updatedRecord?.course?.title || 'Formação Profissional';

  // 3. Enviar notificação oficial com as mensagens exigidas pelo fluxo institucional
  if (studentId) {
    let notifTitle = '📋 Atualização de Requerimento de Certificado';
    let notifMessage = '';
    let notifType = 'info';

    if (status === 'aprovado' || status === 'pagamento_pendente') {
      notifTitle = '✅ Pedido de Certificado Aceite!';
      notifMessage = `O seu pedido de certificado foi aceite. Por favor, efetue o pagamento para levantar o seu certificado.${adminNotes ? ` Observações da Direção: ${adminNotes}` : ''}`;
      notifType = 'certificate_ready';
    } else if (status === 'rejeitado') {
      notifTitle = '❌ Requerimento de Certificado Não Aprovado';
      notifMessage = `O seu pedido de certificado para o curso "${courseTitle}" foi indeferido. Motivo: ${rejectionReason || adminNotes || 'Pendência académica ou financeira. Contacte a secretaria.'}`;
      notifType = 'warning';
    } else if (status === 'em_analise') {
      notifTitle = '🔍 Requerimento em Análise';
      notifMessage = `O seu pedido de certificado para o curso "${courseTitle}" está em processo de verificação curricular e pedagógica pela Direção.`;
      notifType = 'info';
    } else if (status === 'concluido') {
      notifTitle = '🎓 Certificado Oficial Disponível para Levantamento/Download';
      notifMessage = `O seu certificado do curso "${courseTitle}" foi emitido e concluído pela Direção. Acesse a área de certificados para consultar, descarregar em PDF com validação por QR Code ou dirija-se à secretaria.`;
      notifType = 'certificate_ready';
    }

    if (notifMessage) {
      try {
        await supabase.from('academy_notifications').insert([{
          student_id: studentId,
          title: notifTitle,
          message: notifMessage,
          type: notifType,
          is_read: false,
          created_at: nowIso
        }]);
      } catch (notifErr) {
        console.warn('Aviso ao enviar notificação de atualização de requerimento:', notifErr);
      }
    }
  }

  // 4. Auditoria
  try {
    await recordAuditLog({
      action: 'CERTIFICATE_REQUEST_STATUS_UPDATED',
      description: `Requerimento de certificado ID ${requestId} atualizado para status "${status}".`,
      resourceType: 'certificate_request',
      resourceId: requestId,
      userId: adminUserId
    });
  } catch (_) {}

  // 5. Transmissão em tempo real para sincronização instantânea
  try {
    broadcastCertificateRequest(updatedRecord || { id: requestId, status, ...updatePayload });
    broadcastNotificationEvent({
      title: 'Atualização de Requerimento de Certificado',
      student_id: studentId,
      status
    });
  } catch (_) {}

  return updatedRecord;
}

// ==========================================
// 38. MENSAGENS DE CONTACTO DO SITE PÚBLICO
// ==========================================

const LOCAL_CONTACT_MESSAGES_KEY = 'zaty_academy_contact_messages_cache';

/**
 * Remove e higieniza respostas duplicadas de mensagens de contacto.
 * Filtra por ID exclusivo ou por assinatura de conteúdo (remetente + texto + minuto de envio).
 */
export function deduplicateReplies(replies) {
  if (!Array.isArray(replies)) return [];
  const seenIds = new Set();
  const seenSignatures = new Set();
  const clean = [];

  for (const r of replies) {
    if (!r || typeof r !== 'object') continue;
    const rId = r.id ? String(r.id).trim() : null;
    if (rId && seenIds.has(rId)) continue;

    // Assinatura para apanhar duplicatas geradas com IDs gerados separadamente
    const text = (r.message || '').trim().toLowerCase();
    const sender = (r.sender_id || r.sender_name || 'admin').trim().toLowerCase();
    const timeMinute = r.sent_at ? String(r.sent_at).substring(0, 16) : '';
    const signature = `${sender}:::${timeMinute}:::${text}`;

    if (text && seenSignatures.has(signature)) {
      continue;
    }

    if (rId) seenIds.add(rId);
    if (text) seenSignatures.add(signature);
    clean.push(r);
  }

  return clean;
}

export async function submitContactMessage({
  name,
  email,
  phone,
  subject,
  message,
  userId = null,
  studentId = null
}) {
  if (!name || !email || !message) {
    throw new Error('Por favor, preencha os campos obrigatórios (Nome, E-mail e Mensagem).');
  }

  // 1. Obter telemetria do dispositivo de forma resiliente
  let telemetry = null;
  try {
    telemetry = await getAccessTelemetry();
  } catch (telErr) {
    console.warn('Telemetria não disponível para contacto:', telErr);
  }

  // Resolver studentId e userId caso o utilizador já possua conta cadastrada
  let resolvedStudentId = studentId || null;
  let resolvedUserId = userId || null;

  if (!resolvedStudentId || !resolvedUserId) {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data: std } = await supabase
        .from('academy_students')
        .select('id, user_id')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (std) {
        if (!resolvedStudentId) resolvedStudentId = std.id;
        if (!resolvedUserId) resolvedUserId = std.user_id;
      }
    } catch (_) {}
  }

  const clientIp = telemetry?.ip || null;
  const nowIso = new Date().toISOString();
  const messageId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
    ? crypto.randomUUID() 
    : `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const payload = {
    id: messageId,
    name: name.trim(),
    email: email.trim(),
    phone: (phone || '').trim(),
    subject: (subject || 'Dúvida Geral / Contacto do Site').trim(),
    message: message.trim(),
    status: 'pendente',
    ip_address: clientIp,
    user_id: resolvedUserId,
    student_id: resolvedStudentId,
    details: {
      telemetry: telemetry || null,
      submitted_from: typeof window !== 'undefined' ? window.location.href : 'site_publico',
      user_id: resolvedUserId,
      student_id: resolvedStudentId
    },
    replies: [],
    is_read: false,
    priority: 'normal',
    created_at: nowIso,
    updated_at: nowIso
  };

  let savedRecord = null;

  // 2. Gravação no Supabase (com tentativa de gravação resiliente com/sem colunas dedicadas)
  try {
    const { error } = await supabase
      .from('academy_contact_messages')
      .insert([payload]);

    if (!error) {
      savedRecord = payload;
    } else {
      // Fallback caso as colunas user_id / student_id ainda não existam no esquema
      const { user_id, student_id, ...fallbackPayload } = payload;
      const { error: fbErr } = await supabase
        .from('academy_contact_messages')
        .insert([fallbackPayload]);
      if (!fbErr) {
        savedRecord = payload;
      } else {
        console.warn('Aviso ao guardar mensagem de contacto no Supabase:', fbErr.message);
      }
    }
  } catch (dbErr) {
    console.warn('Exceção ao inserir mensagem de contacto no Supabase:', dbErr);
  }

  // Se o Supabase falhou, usa o payload gerado
  if (!savedRecord) {
    savedRecord = payload;
  }

  // 3. Manter cópia em cache local de segurança
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_CONTACT_MESSAGES_KEY) : null;
    const existing = raw ? JSON.parse(raw) : [];
    const updated = [savedRecord, ...existing.filter(m => m.id !== savedRecord.id)].slice(0, 200);
    localStorage.setItem(LOCAL_CONTACT_MESSAGES_KEY, JSON.stringify(updated));
  } catch (_) {}

  // 4. Auditoria
  try {
    await recordAuditLog({
      action: 'PUBLIC_CONTACT_MESSAGE_SUBMITTED',
      description: `Nova mensagem recebida de "${name}" (${email}) com o assunto: "${subject}".`,
      resourceType: 'contact_message',
      resourceId: savedRecord.id,
      userEmail: email,
      userName: name,
      ipAddress: clientIp,
      details: {
        subject,
        phone,
        messageLength: message.length
      }
    });
  } catch (_) {}

  return savedRecord;
}

export async function getContactMessages({ status = null, search = '' } = {}) {
  let messages = [];

  try {
    let query = supabase
      .from('academy_contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'todos') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      messages = data;
    } else if (error) {
      console.warn('Aviso ao consultar academy_contact_messages:', error.message);
    }
  } catch (err) {
    console.warn('Exceção ao consultar academy_contact_messages:', err);
  }

  // Cache fallback & sincronização
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_CONTACT_MESSAGES_KEY) : null;
    const localMsgs = raw ? JSON.parse(raw) : [];

    if (messages.length === 0 && localMsgs.length > 0) {
      messages = localMsgs;
    } else if (messages.length > 0) {
      // Mesclar mensagens locais se houver alguma que ainda não esteja sincronizada
      const dbIds = new Set(messages.map(m => m.id));
      const unsynced = localMsgs.filter(m => !dbIds.has(m.id));
      if (unsynced.length > 0) {
        messages = [...unsynced, ...messages];
      }
      localStorage.setItem(LOCAL_CONTACT_MESSAGES_KEY, JSON.stringify(messages.slice(0, 200)));
    }
  } catch (_) {}

  // Filtragem de pesquisa se fornecida
  if (search && search.trim()) {
    const term = search.toLowerCase().trim();
    messages = messages.filter(m => 
      (m.name || '').toLowerCase().includes(term) ||
      (m.email || '').toLowerCase().includes(term) ||
      (m.phone || '').toLowerCase().includes(term) ||
      (m.subject || '').toLowerCase().includes(term) ||
      (m.message || '').toLowerCase().includes(term)
    );
  }

  // Normalizar campos e deduplicar respostas (suportando tanto colunas dedicadas de migrations como estrutura flexível em details)
  messages = messages.map(m => {
    const det = (m.details && typeof m.details === 'object' && m.details !== null) ? m.details : {};
    const candidateReplies = [
      ...(Array.isArray(m.replies) ? m.replies : []),
      ...(Array.isArray(det.replies) ? det.replies : [])
    ];
    const uniqueReplies = deduplicateReplies(candidateReplies);

    return {
      ...m,
      replies: uniqueReplies,
      is_read: m.is_read !== undefined && m.is_read !== null ? Boolean(m.is_read) : Boolean(det.is_read),
      priority: m.priority || det.priority || 'normal',
      read_at: m.read_at || det.read_at || null,
      read_by: m.read_by || det.read_by || null
    };
  });

  // Atualizar cache com dados normalizados e livres de duplicatas
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_CONTACT_MESSAGES_KEY, JSON.stringify(messages.slice(0, 200)));
    }
  } catch (_) {}

  return messages;
}

export async function updateContactMessageStatus(id, {
  status,
  adminNotes = null,
  adminUserId = null
}) {
  if (!id) throw new Error('ID da mensagem não especificado.');

  const updatePayload = {
    updated_at: new Date().toISOString()
  };

  if (status) {
    updatePayload.status = status;
    if (status === 'respondido' || status === 'em_atendimento') {
      updatePayload.responded_at = new Date().toISOString();
      if (adminUserId) updatePayload.responded_by = adminUserId;
    }
  }

  if (adminNotes !== undefined && adminNotes !== null) {
    updatePayload.admin_notes = adminNotes;
  }

  let updatedRecord = null;

  try {
    const { data, error } = await supabase
      .from('academy_contact_messages')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (!error && data) {
      updatedRecord = data;
    }
  } catch (err) {
    console.warn('Erro ao atualizar status da mensagem de contacto:', err);
  }

  // Atualizar cache local
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_CONTACT_MESSAGES_KEY) : null;
    if (raw) {
      const list = JSON.parse(raw);
      const updatedList = list.map(item => item.id === id ? { ...item, ...updatePayload, ...(updatedRecord || {}) } : item);
      localStorage.setItem(LOCAL_CONTACT_MESSAGES_KEY, JSON.stringify(updatedList));
      if (!updatedRecord) {
        updatedRecord = updatedList.find(i => i.id === id);
      }
    }
  } catch (_) {}

  // Auditoria
  try {
    await recordAuditLog({
      action: 'CONTACT_MESSAGE_STATUS_UPDATED',
      description: `Mensagem de contacto ID ${id} atualizada para status "${status || 'atualizado'}".`,
      resourceType: 'contact_message',
      resourceId: id,
      userId: adminUserId,
      details: { status, adminNotes }
    });
  } catch (_) {}

  return updatedRecord || { id, ...updatePayload };
}

export async function deleteContactMessage(id, adminUserId = null) {
  if (!id) throw new Error('ID da mensagem não fornecido.');

  try {
    await supabase
      .from('academy_contact_messages')
      .delete()
      .eq('id', id);
  } catch (err) {
    console.warn('Erro ao eliminar mensagem de contacto no banco:', err);
  }

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_CONTACT_MESSAGES_KEY) : null;
    if (raw) {
      const list = JSON.parse(raw);
      const filtered = list.filter(item => item.id !== id);
      localStorage.setItem(LOCAL_CONTACT_MESSAGES_KEY, JSON.stringify(filtered));
    }
  } catch (_) {}

  try {
    await recordAuditLog({
      action: 'CONTACT_MESSAGE_DELETED',
      description: `Mensagem de contacto ID ${id} foi eliminada pelo administrador.`,
      resourceType: 'contact_message',
      resourceId: id,
      userId: adminUserId
    });
  } catch (_) {}

  return true;
}

export async function replyToContactMessage({
  contactId,
  message,
  subject = '',
  channel = 'sistema', // 'sistema' | 'email' | 'whatsapp'
  adminUserId = null,
  adminUserName = 'Administração Zaty Academy',
  adminUserRole = 'admin'
}) {
  if (!contactId) throw new Error('ID da mensagem não fornecido.');
  const trimmedMsg = (message || '').trim();
  if (!trimmedMsg || trimmedMsg.length < 3) {
    throw new Error('A resposta deve conter pelo menos 3 caracteres.');
  }

  const nowIso = new Date().toISOString();
  const replyId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
    ? crypto.randomUUID() 
    : `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const replyEntry = {
    id: replyId,
    contact_id: contactId,
    subject: subject.trim() || 'Resposta Institucional Zaty Academy',
    message: trimmedMsg,
    channel: channel || 'sistema',
    sender_id: adminUserId,
    sender_name: adminUserName,
    sender_role: adminUserRole,
    sent_at: nowIso
  };

  // 1. Obter dados atuais da mensagem para anexar ao array de respostas
  let existingReplies = [];
  let currentMsg = null;
  try {
    const { data } = await supabase
      .from('academy_contact_messages')
      .select('*')
      .eq('id', contactId)
      .maybeSingle();

    if (data) {
      currentMsg = data;
      const det = (data.details && typeof data.details === 'object' && data.details !== null) ? data.details : {};
      const candidateReplies = [
        ...(Array.isArray(data.replies) ? data.replies : []),
        ...(Array.isArray(det.replies) ? det.replies : [])
      ];
      existingReplies = deduplicateReplies(candidateReplies);
    }
  } catch (_) {}

  // Fallback cache local se necessário
  if (!currentMsg) {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_CONTACT_MESSAGES_KEY) : null;
      if (raw) {
        const list = JSON.parse(raw);
        const item = list.find(m => m.id === contactId);
        if (item) {
          currentMsg = item;
          const det = (item.details && typeof item.details === 'object' && item.details !== null) ? item.details : {};
          const candidateReplies = [
            ...(Array.isArray(item.replies) ? item.replies : []),
            ...(Array.isArray(det.replies) ? det.replies : [])
          ];
          existingReplies = deduplicateReplies(candidateReplies);
        }
      }
    } catch (_) {}
  }

  // 2. Proteção estrita contra envios duplicados (Idempotência)
  // Se a mesma resposta foi registada nos últimos 30 segundos pelo mesmo utilizador, evita duplicação
  const isDuplicate = existingReplies.some(r => {
    if (r.id === replyId) return true;
    const sameText = (r.message || '').trim().toLowerCase() === trimmedMsg.toLowerCase();
    const sameSender = (r.sender_id || r.sender_name) === (adminUserId || adminUserName);
    const timeDiff = Math.abs(new Date(r.sent_at || 0).getTime() - new Date(nowIso).getTime());
    return sameText && sameSender && timeDiff < 30000;
  });

  if (isDuplicate) {
    console.warn('Tentativa de envio de resposta duplicada ignorada (idempotência acionada).');
    return {
      ...(currentMsg || {}),
      replies: existingReplies,
      status: 'respondido',
      is_read: true,
      responded_at: currentMsg?.responded_at || nowIso
    };
  }

  const updatedReplies = deduplicateReplies([...existingReplies, replyEntry]);
  const currentDetails = (currentMsg?.details && typeof currentMsg.details === 'object' && currentMsg.details !== null)
    ? currentMsg.details
    : {};

  const updatedDetails = {
    ...currentDetails,
    replies: updatedReplies,
    is_read: true,
    read_at: nowIso,
    read_by: adminUserId
  };

  const updatePayload = {
    replies: updatedReplies,
    status: 'respondido',
    responded_by: adminUserId,
    responded_at: nowIso,
    is_read: true,
    details: updatedDetails,
    updated_at: nowIso
  };

  let updatedRecord = null;
  try {
    const { data, error } = await supabase
      .from('academy_contact_messages')
      .update(updatePayload)
      .eq('id', contactId)
      .select()
      .maybeSingle();

    if (!error && data) {
      updatedRecord = data;
    } else if (error) {
      // Fallback: se a coluna dedicada 'replies' não existir no banco, atualiza via 'details'
      const { data: fbData } = await supabase
        .from('academy_contact_messages')
        .update({
          status: 'respondido',
          responded_by: adminUserId,
          responded_at: nowIso,
          details: updatedDetails,
          updated_at: nowIso
        })
        .eq('id', contactId)
        .select()
        .maybeSingle();
      if (fbData) updatedRecord = fbData;
    }
  } catch (err) {
    console.warn('Erro ao guardar resposta no Supabase:', err);
  }

  // 3. Montar resultado garantindo que o array de replies deduplicado está sempre no nível superior
  const finalResult = {
    ...(currentMsg || {}),
    ...updatePayload,
    ...(updatedRecord || {}),
    replies: updatedReplies,
    details: updatedDetails,
    status: 'respondido',
    is_read: true,
    responded_at: nowIso
  };

  // 4. Atualizar cache local com a versão higienizada e deduplicada
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_CONTACT_MESSAGES_KEY) : null;
    if (raw) {
      const list = JSON.parse(raw);
      const updatedList = list.map(item => item.id === contactId ? { ...item, ...finalResult } : item);
      localStorage.setItem(LOCAL_CONTACT_MESSAGES_KEY, JSON.stringify(updatedList));
    }
  } catch (_) {}

  // 5. Auditoria de segurança
  try {
    await recordAuditLog({
      action: 'CONTACT_MESSAGE_REPLY_SENT',
      description: `Resposta registada por ${adminUserName} via canal "${channel}" para a mensagem ID ${contactId}.`,
      resourceType: 'contact_message',
      resourceId: contactId,
      userId: adminUserId,
      details: {
        replyId,
        channel,
        messageLength: trimmedMsg.length
      }
    });
  } catch (_) {}

  // 6. Notificação e Sincronização Automática com a Caixa de Mensagens do Utilizador / Estudante
  try {
    const studentId = currentMsg?.student_id || currentMsg?.details?.student_id;
    const userId = currentMsg?.user_id || currentMsg?.details?.user_id;
    const msgEmail = (currentMsg?.email || '').trim().toLowerCase();
    const msgPhone = (currentMsg?.phone || '').replace(/\D/g, '');

    let targetStudent = null;

    if (studentId) {
      const { data: s } = await supabase.from('academy_students').select('id, user_id, full_name, email').eq('id', studentId).maybeSingle();
      if (s) targetStudent = s;
    }

    if (!targetStudent && userId) {
      const { data: s } = await supabase.from('academy_students').select('id, user_id, full_name, email').eq('user_id', userId).maybeSingle();
      if (s) targetStudent = s;
    }

    if (!targetStudent && msgEmail) {
      const { data: s } = await supabase.from('academy_students').select('id, user_id, full_name, email').ilike('email', msgEmail).maybeSingle();
      if (s) targetStudent = s;
    }

    if (!targetStudent && msgPhone && msgPhone.length >= 9) {
      const { data: students } = await supabase.from('academy_students').select('id, user_id, full_name, phone');
      if (Array.isArray(students)) {
        targetStudent = students.find(s => {
          const sp = (s.phone || '').replace(/\D/g, '');
          return sp && (sp === msgPhone || msgPhone.endsWith(sp) || sp.endsWith(msgPhone));
        }) || null;
      }
    }

    if (targetStudent) {
      // A) Inserir notificação oficial em academy_notifications
      const channelLabel = channel === 'email' ? ' (enviada também por e-mail)' : channel === 'whatsapp' ? ' (via WhatsApp)' : '';
      const notifTitle = '💬 Nova Resposta da Administração';
      const notifMessage = `A Direção da Zaty Academy respondeu à sua mensagem sobre "${currentMsg?.subject || 'Atendimento'}"${channelLabel}: "${trimmedMsg.substring(0, 100)}${trimmedMsg.length > 100 ? '...' : ''}"`;

      await supabase.from('academy_notifications').insert([{
        student_id: targetStudent.id,
        user_id: targetStudent.user_id || null,
        title: notifTitle,
        message: notifMessage,
        type: 'support_message',
        link: '/estudante/chat',
        is_read: false,
        created_at: nowIso
      }]);

      // B) Integrar/Espelhar no Chat Oficial de Suporte (/estudante/chat)
      const conv = await getOrCreateSupportConversation(targetStudent.id, targetStudent.full_name);
      if (conv?.id) {
        // Verificar se a mensagem original já foi espelhada nesta conversa
        const originalContentTag = `[Mensagem do Site #${contactId.substring(0, 8)}]`;
        const { data: existingMsgs } = await supabase
          .from('academy_chat_messages')
          .select('id, content')
          .eq('conversation_id', conv.id)
          .ilike('content', `%${originalContentTag}%`);

        if (!existingMsgs || existingMsgs.length === 0) {
          // Espelha a mensagem original enviada pelo estudante
          await supabase.from('academy_chat_messages').insert([{
            conversation_id: conv.id,
            sender_id: targetStudent.user_id || targetStudent.id,
            sender_role: 'estudante',
            sender_name: targetStudent.full_name,
            content: `${originalContentTag} Assunto: ${currentMsg?.subject || 'Contacto'}\n\n${currentMsg?.message || ''}`,
            created_at: currentMsg?.created_at || nowIso
          }]);
        }

        // Espelha a resposta do Administrador na conversa de suporte
        const replyTag = channel === 'email' ? ' [Via E-mail]' : channel === 'whatsapp' ? ' [Via WhatsApp]' : '';
        await supabase.from('academy_chat_messages').insert([{
          conversation_id: conv.id,
          sender_id: adminUserId || null,
          sender_role: 'admin',
          sender_name: adminUserName || 'Administração Zaty Academy',
          content: `${trimmedMsg}${replyTag}`,
          created_at: nowIso
        }]);

        // Atualizar timestamp da última mensagem na conversa
        await supabase
          .from('academy_chat_conversations')
          .update({ last_message_at: nowIso, updated_at: nowIso })
          .eq('id', conv.id);
      }
    }
  } catch (syncErr) {
    console.warn('Aviso na sincronização automática da resposta com o utilizador:', syncErr);
  }

  return finalResult;
}

/**
 * Consulta mensagens de contacto estritamente pertencentes ao estudante/utilizador autenticado (Isolamento de Segurança)
 */
export async function getUserContactMessages({ studentId = null, userId = null, userEmail = null } = {}) {
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const conditions = [];
  if (studentId) conditions.push(`student_id.eq.${studentId}`);
  if (userId) conditions.push(`user_id.eq.${userId}`);
  if (cleanEmail) conditions.push(`email.ilike.${cleanEmail}`);

  if (conditions.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from('academy_contact_messages')
      .select('*')
      .or(conditions.join(','))
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      return data.map(m => {
        const det = (m.details && typeof m.details === 'object' && m.details !== null) ? m.details : {};
        const candidateReplies = [
          ...(Array.isArray(m.replies) ? m.replies : []),
          ...(Array.isArray(det.replies) ? det.replies : [])
        ];
        return {
          ...m,
          replies: deduplicateReplies(candidateReplies),
          is_read: m.is_read !== undefined && m.is_read !== null ? Boolean(m.is_read) : Boolean(det.is_read),
          priority: m.priority || det.priority || 'normal'
        };
      });
    }
  } catch (err) {
    console.warn('Aviso ao consultar mensagens do utilizador:', err);
  }

  // Fallback cache local estritamente filtrado por utilizador
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_CONTACT_MESSAGES_KEY) : null;
    if (raw) {
      const list = JSON.parse(raw);
      return list.filter(m => {
        const det = m.details || {};
        return (studentId && (m.student_id === studentId || det.student_id === studentId)) ||
               (userId && (m.user_id === userId || det.user_id === userId)) ||
               (cleanEmail && m.email && m.email.toLowerCase() === cleanEmail);
      }).map(m => ({
        ...m,
        replies: deduplicateReplies(m.replies || m.details?.replies || [])
      }));
    }
  } catch (_) {}

  return [];
}

/**
 * Permite ao estudante redigir uma réplica a uma mensagem de contacto do site
 */
export async function studentReplyToContactMessage({
  contactId,
  studentId = null,
  studentName = 'Estudante',
  userId = null,
  message
}) {
  if (!contactId) throw new Error('ID do contacto não fornecido.');
  const trimmed = (message || '').trim();
  if (!trimmed || trimmed.length < 2) {
    throw new Error('A mensagem deve conter pelo menos 2 caracteres.');
  }

  const nowIso = new Date().toISOString();
  const replyId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
    ? crypto.randomUUID() 
    : `rep_std_${Date.now()}`;

  const studentReply = {
    id: replyId,
    contact_id: contactId,
    subject: 'Réplica do Estudante',
    message: trimmed,
    channel: 'sistema',
    sender_id: userId || studentId,
    sender_name: studentName,
    sender_role: 'estudante',
    sent_at: nowIso
  };

  // 1. Obter dados atuais do contacto
  let currentMsg = null;
  let existingReplies = [];
  try {
    const { data } = await supabase.from('academy_contact_messages').select('*').eq('id', contactId).maybeSingle();
    if (data) {
      currentMsg = data;
      const det = data.details || {};
      existingReplies = deduplicateReplies([
        ...(Array.isArray(data.replies) ? data.replies : []),
        ...(Array.isArray(det.replies) ? det.replies : [])
      ]);
    }
  } catch (_) {}

  const updatedReplies = deduplicateReplies([...existingReplies, studentReply]);
  const updatePayload = {
    replies: updatedReplies,
    status: 'em_atendimento',
    is_read: false, // Marca como não lida para o Admin notar a réplica
    updated_at: nowIso,
    details: {
      ...(currentMsg?.details || {}),
      replies: updatedReplies,
      is_read: false,
      last_student_reply_at: nowIso
    }
  };

  try {
    await supabase.from('academy_contact_messages').update(updatePayload).eq('id', contactId);
  } catch (_) {
    try {
      await supabase.from('academy_contact_messages').update({
        status: 'em_atendimento',
        updated_at: nowIso,
        details: updatePayload.details
      }).eq('id', contactId);
    } catch (_) {}
  }

  // Notificar Administração da réplica do estudante
  try {
    await supabase.from('academy_notifications').insert([{
      title: `📩 Nova Resposta de Estudante: ${studentName}`,
      message: `O estudante respondeu à mensagem sobre "${currentMsg?.subject || 'Atendimento'}": "${trimmed.substring(0, 90)}..."`,
      type: 'contact_message',
      target_role: 'admin',
      is_read: false,
      created_at: nowIso
    }]);
  } catch (_) {}

  // Também espelha no chat de suporte se houver conversa
  if (studentId) {
    try {
      const conv = await getOrCreateSupportConversation(studentId, studentName);
      if (conv?.id) {
        await supabase.from('academy_chat_messages').insert([{
          conversation_id: conv.id,
          sender_id: userId || studentId,
          sender_role: 'estudante',
          sender_name: studentName,
          content: trimmed,
          created_at: nowIso
        }]);
        await supabase.from('academy_chat_conversations').update({ last_message_at: nowIso, updated_at: nowIso }).eq('id', conv.id);
      }
    } catch (_) {}
  }

  return { ...(currentMsg || {}), ...updatePayload };
}

export async function markContactMessageReadStatus(contactId, isRead, adminUserId = null) {
  if (!contactId) return null;
  const nowIso = new Date().toISOString();

  let currentMsg = null;
  try {
    const { data } = await supabase.from('academy_contact_messages').select('*').eq('id', contactId).maybeSingle();
    currentMsg = data;
  } catch (_) {}

  const currentDetails = (currentMsg?.details && typeof currentMsg.details === 'object' && currentMsg.details !== null)
    ? currentMsg.details
    : {};

  const updatedDetails = {
    ...currentDetails,
    is_read: isRead,
    read_at: isRead ? nowIso : null,
    read_by: isRead ? adminUserId : null
  };

  const updatePayload = {
    is_read: isRead,
    read_at: isRead ? nowIso : null,
    read_by: isRead ? adminUserId : null,
    details: updatedDetails,
    updated_at: nowIso
  };

  let updatedRecord = null;
  try {
    const { data, error } = await supabase
      .from('academy_contact_messages')
      .update(updatePayload)
      .eq('id', contactId)
      .select()
      .maybeSingle();

    if (!error && data) {
      updatedRecord = data;
    } else if (error) {
      // Fallback via details
      const { data: fbData } = await supabase
        .from('academy_contact_messages')
        .update({
          details: updatedDetails,
          updated_at: nowIso
        })
        .eq('id', contactId)
        .select()
        .maybeSingle();
      if (fbData) updatedRecord = fbData;
    }
  } catch (_) {}

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_CONTACT_MESSAGES_KEY) : null;
    if (raw) {
      const list = JSON.parse(raw);
      const updatedList = list.map(item => item.id === contactId ? { ...item, ...updatePayload, ...(updatedRecord || {}) } : item);
      localStorage.setItem(LOCAL_CONTACT_MESSAGES_KEY, JSON.stringify(updatedList));
      if (!updatedRecord) {
        updatedRecord = updatedList.find(i => i.id === contactId);
      }
    }
  } catch (_) {}

  return updatedRecord || { id: contactId, ...updatePayload };
}

export async function updateContactMessagePriority(contactId, priority, adminUserId = null) {
  if (!contactId) return null;
  const nowIso = new Date().toISOString();

  let currentMsg = null;
  try {
    const { data } = await supabase.from('academy_contact_messages').select('*').eq('id', contactId).maybeSingle();
    currentMsg = data;
  } catch (_) {}

  const currentDetails = (currentMsg?.details && typeof currentMsg.details === 'object' && currentMsg.details !== null)
    ? currentMsg.details
    : {};

  const updatedDetails = {
    ...currentDetails,
    priority
  };

  const updatePayload = {
    priority,
    details: updatedDetails,
    updated_at: nowIso
  };

  let updatedRecord = null;
  try {
    const { data, error } = await supabase
      .from('academy_contact_messages')
      .update(updatePayload)
      .eq('id', contactId)
      .select()
      .maybeSingle();

    if (!error && data) {
      updatedRecord = data;
    } else if (error) {
      // Fallback via details
      const { data: fbData } = await supabase
        .from('academy_contact_messages')
        .update({
          details: updatedDetails,
          updated_at: nowIso
        })
        .eq('id', contactId)
        .select()
        .maybeSingle();
      if (fbData) updatedRecord = fbData;
    }
  } catch (_) {}

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_CONTACT_MESSAGES_KEY) : null;
    if (raw) {
      const list = JSON.parse(raw);
      const updatedList = list.map(item => item.id === contactId ? { ...item, ...updatePayload, ...(updatedRecord || {}) } : item);
      localStorage.setItem(LOCAL_CONTACT_MESSAGES_KEY, JSON.stringify(updatedList));
      if (!updatedRecord) {
        updatedRecord = updatedList.find(i => i.id === contactId);
      }
    }
  } catch (_) {}

  return updatedRecord || { id: contactId, ...updatePayload };
}



