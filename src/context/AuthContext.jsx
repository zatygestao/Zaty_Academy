import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { getStudentByUserId, updateProfile, updateUserPresence } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [student, setStudent] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    try {
      if (user?.id) {
        try {
          await supabase.from('academy_user_presence').update({
            last_active_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
          }).eq('user_id', user.id);
        } catch (_) {}
      }
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('zaty_admin_session_active');
        sessionStorage.removeItem('zaty_last_presence_ping');
      }
      await supabase.auth.signOut();
    } catch (_) {}
    setUser(null);
    setProfile(null);
    setStudent(null);
    setTeacher(null);
  };

  const handleImmediateKickOut = async (reason) => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.removeItem('zaty_admin_session_active');
        const message = reason === 'account_suspended'
          ? 'A sua conta foi suspensa. O acesso ao sistema está temporariamente bloqueado. Contacte a Administração para mais informações.'
          : 'Esta conta não existe mais ou foi desativada permanentemente pela administração.';
        sessionStorage.setItem('zaty_auth_flash', JSON.stringify({ reason, message }));
      }
      await signOut();
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
    } catch (_) {}
  };

  const fetchProfileAndStudent = async (currentUser) => {
    if (!currentUser) {
      setProfile(null);
      setStudent(null);
      setTeacher(null);
      setLoading(false);
      return;
    }

    try {
      // 1. Buscar perfil da academia
      let { data: prof, error: profErr } = await supabase
        .from('academy_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      // Verificação imediata: se o perfil está excluído ou suspenso
      if (prof && prof.is_active === false) {
        await handleImmediateKickOut('account_suspended');
        return;
      }

      // 2. Verificar se o utilizador está registado como Formador em academy_teachers
      const { data: teacherRecord, error: teacherErr } = await supabase
        .from('academy_teachers')
        .select('*')
        .or(`user_id.eq.${currentUser.id},email.eq.${currentUser.email}`)
        .maybeSingle();

      // Se no perfil é formador mas não existe mais no cadastro (e a busca não falhou por erro de rede), foi excluído
      if (prof?.role === 'formador' && !teacherRecord && !teacherErr) {
        await handleImmediateKickOut('account_deleted');
        return;
      }

      // Se for Formador
      if (teacherRecord) {
        if (teacherRecord.is_active === false || teacherRecord.is_blocked === true) {
          await handleImmediateKickOut('account_suspended');
          return;
        }

        if (!prof) {
          const { data: createdProf } = await supabase
            .from('academy_profiles')
            .insert([{
              id: currentUser.id,
              email: currentUser.email,
              full_name: teacherRecord.full_name || teacherRecord.name || currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
              role: 'formador',
              phone: teacherRecord.phone || currentUser.user_metadata?.phone || null,
              is_active: true
            }])
            .select()
            .single();

          prof = createdProf || {
            id: currentUser.id,
            email: currentUser.email,
            full_name: teacherRecord.full_name || teacherRecord.name,
            role: 'formador'
          };
        } else if (prof.role !== 'formador') {
          try {
            await supabase
              .from('academy_profiles')
              .update({ role: 'formador' })
              .eq('id', currentUser.id);
          } catch (_) {}
          prof = { ...prof, role: 'formador' };
        }

        // Garantir vínculo de user_id no academy_teachers caso não estivesse gravado
        if (!teacherRecord.user_id && currentUser.id) {
          try {
            await supabase
              .from('academy_teachers')
              .update({ user_id: currentUser.id })
              .eq('id', teacherRecord.id);
          } catch (_) {}
        }
        // Sincronizar propriedades de credenciais temporárias do formador no perfil
        const mergedProf = {
          ...prof,
          role: 'formador',
          must_change_password: teacherRecord.must_change_password ?? prof?.must_change_password ?? false,
          temporary_credentials_expires_at: teacherRecord.temporary_credentials_expires_at ?? prof?.temporary_credentials_expires_at ?? null
        };

        setProfile(mergedProf);
        setTeacher(teacherRecord);
        setStudent(null);
        setLoading(false);
        return;
      }

      // 3. Se não for formador e o perfil ainda não existir
      if (!prof && !profErr) {
        // Verificar se é estudante cadastrado
        const { data: stdCheck } = await supabase
          .from('academy_students')
          .select('id, full_name, phone, status, enrollment_status')
          .or(`user_id.eq.${currentUser.id},email.eq.${currentUser.email}`)
          .maybeSingle();

        if (stdCheck?.status === 'excluido' || stdCheck?.enrollment_status === 'removida') {
          await handleImmediateKickOut('account_deleted');
          return;
        }
        if (stdCheck?.status === 'suspenso' || stdCheck?.enrollment_status === 'suspenso') {
          await handleImmediateKickOut('account_suspended');
          return;
        }

        let defaultRole = 'student';
        const metaRole = currentUser.user_metadata?.role;
        if (metaRole && ['super_admin', 'admin', 'financeiro', 'secretaria'].includes(metaRole)) {
          defaultRole = metaRole;
        }

        const { data: newProf, error: insErr } = await supabase
          .from('academy_profiles')
          .insert([{
            id: currentUser.id,
            email: currentUser.email,
            full_name: currentUser.user_metadata?.full_name || stdCheck?.full_name || currentUser.email.split('@')[0],
            role: defaultRole,
            phone: currentUser.user_metadata?.phone || stdCheck?.phone || null,
            is_active: true
          }])
          .select()
          .single();

        if (!insErr) prof = newProf;
      }

      setProfile(prof);
      setTeacher(null);

      // 4. Se for estudante, buscar os dados de aluno
      if (prof?.role === 'student' || prof?.role === 'estudante' || !prof) {
        const studentData = await getStudentByUserId(currentUser.id);
        if (!studentData || studentData.status === 'excluido' || studentData.enrollment_status === 'removida') {
          await handleImmediateKickOut('account_deleted');
          return;
        }
        if (studentData.status === 'suspenso' || studentData.enrollment_status === 'suspenso') {
          await handleImmediateKickOut('account_suspended');
          return;
        }
        setStudent(studentData);
      } else {
        setStudent(null);
      }
    } catch (err) {
      console.error('Erro ao carregar perfil do utilizador:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const currentUser = session?.user || null;
      setUser(currentUser);
      fetchProfileAndStudent(currentUser);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        const currentUser = session?.user || null;
        setUser(currentUser);
        await fetchProfileAndStudent(currentUser);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Monitorização em tempo real & Verificação periódica de integridade (expulsão imediata caso suspenso/excluído)
  useEffect(() => {
    if (!user?.id) return;

    // A. Subscrição em Tempo Real (Supabase Realtime) no academy_profiles
    const profileChannel = supabase.channel(`guard-profile-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'academy_profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        const row = payload.new;
        if (row) {
          if (row.status === 'excluido') {
            handleImmediateKickOut('account_deleted');
          } else if (row.status === 'suspenso' || row.is_active === false) {
            handleImmediateKickOut('account_suspended');
          }
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'academy_profiles',
        filter: `id=eq.${user.id}`
      }, () => {
        handleImmediateKickOut('account_deleted');
      })
      .subscribe();

    // B. Subscrição em Tempo Real para Formador
    let teacherChannel = null;
    if (profile?.role === 'formador' || teacher) {
      teacherChannel = supabase.channel(`guard-teacher-${user.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'academy_teachers',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const row = payload.new;
          if (row) {
            if (row.is_active === false || row.is_blocked === true) {
              handleImmediateKickOut('account_suspended');
            }
          }
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'academy_teachers',
          filter: `user_id=eq.${user.id}`
        }, () => {
          handleImmediateKickOut('account_deleted');
        })
        .subscribe();
    }

    // C. Subscrição em Tempo Real para Estudante
    let studentChannel = null;
    if (profile?.role === 'student' || profile?.role === 'estudante' || student) {
      studentChannel = supabase.channel(`guard-student-${user.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'academy_students',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const row = payload.new;
          if (row) {
            if (row.status === 'excluido' || row.enrollment_status === 'removida') {
              handleImmediateKickOut('account_deleted');
            } else if (row.status === 'suspenso' || row.enrollment_status === 'suspenso') {
              handleImmediateKickOut('account_suspended');
            }
          }
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'academy_students',
          filter: `user_id=eq.${user.id}`
        }, () => {
          handleImmediateKickOut('account_deleted');
        })
        .subscribe();
    }

    // D. Failsafe Polling a cada 10 segundos: confirma se o acesso continua válido no servidor
    const securityInterval = setInterval(async () => {
      try {
        const { data: pCheck, error: pErr } = await supabase
          .from('academy_profiles')
          .select('id, is_active, role')
          .eq('id', user.id)
          .maybeSingle();

        // Se houver erro de conexão/rede, não expulsar
        if (pErr) return;

        // Se o perfil foi explicitamente desativado/suspenso
        if (pCheck && pCheck.is_active === false) {
          handleImmediateKickOut('account_suspended');
          return;
        }

        // Se for Formador
        if (pCheck?.role === 'formador' || profile?.role === 'formador') {
          const { data: tCheck, error: tErr } = await supabase
            .from('academy_teachers')
            .select('id, is_active, is_blocked')
            .or(`user_id.eq.${user.id},email.eq.${user.email}`)
            .maybeSingle();

          // Ignorar se erro de rede
          if (tErr) return;

          // Se a conta de formador foi excluída pela administração
          if (!tCheck) {
            handleImmediateKickOut('account_deleted');
            return;
          }

          // Se o formador estiver bloqueado ou inativo (suspenso)
          if (tCheck.is_active === false || tCheck.is_blocked === true) {
            handleImmediateKickOut('account_suspended');
            return;
          }
        } else if (['student', 'estudante'].includes(pCheck?.role) || ['student', 'estudante'].includes(profile?.role)) {
          const { data: sCheck, error: sErr } = await supabase
            .from('academy_students')
            .select('id, status, enrollment_status')
            .or(`user_id.eq.${user.id},email.eq.${user.email}`)
            .maybeSingle();

          if (sErr) return;

          if (!sCheck || sCheck.status === 'excluido' || sCheck.enrollment_status === 'removida') {
            handleImmediateKickOut('account_deleted');
            return;
          }
          if (sCheck.status === 'suspenso' || sCheck.enrollment_status === 'suspenso') {
            handleImmediateKickOut('account_suspended');
            return;
          }
        }
      } catch (_) {}
    }, 10000);

    return () => {
      supabase.removeChannel(profileChannel);
      if (teacherChannel) supabase.removeChannel(teacherChannel);
      if (studentChannel) supabase.removeChannel(studentChannel);
      clearInterval(securityInterval);
    };
  }, [user?.id, user?.email, profile?.role, teacher?.id, student?.id]);

  // Heartbeat automático de presença real a cada 60 segundos
  useEffect(() => {
    if (!user) return;
    updateUserPresence(user, profile, student);

    const interval = setInterval(() => {
      updateUserPresence(user, profile, student);
    }, 60000);

    return () => clearInterval(interval);
  }, [user?.id, profile?.role, student?.student_code]);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  };

  const hasRole = (allowedRoles) => {
    if (!profile?.role) return false;
    // Formador possui perfil próprio e NUNCA herda permissões administrativas
    if (profile.role === 'formador') {
      if (Array.isArray(allowedRoles)) {
        return allowedRoles.includes('formador');
      }
      return allowedRoles === 'formador';
    }
    if (profile.role === 'super_admin') return true;
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(profile.role);
    }
    return profile.role === allowedRoles;
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndStudent(user);
    }
  };

  const updateAdminProfile = async (updates) => {
    if (!user) throw new Error('Utilizador não autenticado');
    const updated = await updateProfile(user.id, updates);
    setProfile(prev => ({ ...prev, ...updated }));
    return updated;
  };

  // Verificação de validade de 48 horas para credenciais provisórias de formador
  const isTeacher = profile?.role === 'formador';
  const isAdmin = ['super_admin', 'admin', 'financeiro', 'secretaria'].includes(profile?.role) && !isTeacher;
  const isStudent = ['student', 'estudante'].includes(profile?.role) && !isTeacher && !isAdmin;
  const mustChangePassword = isTeacher && (profile?.must_change_password || teacher?.must_change_password);
  const expiryDate = profile?.temporary_credentials_expires_at || teacher?.temporary_credentials_expires_at;
  const isCredentialsExpired = isTeacher && mustChangePassword && expiryDate && (new Date() > new Date(expiryDate));

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      student,
      teacher,
      loading,
      signIn,
      signOut,
      hasRole,
      refreshProfile,
      updateAdminProfile,
      isAdmin,
      isTeacher,
      isStudent,
      mustChangePassword,
      isCredentialsExpired
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
