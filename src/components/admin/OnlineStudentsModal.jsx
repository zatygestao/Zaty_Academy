import { useState, useEffect } from 'react';
import { getOnlineStudents } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import UserAvatar from '../common/UserAvatar';
import { Users, X, RefreshCw, Activity } from 'lucide-react';

export default function OnlineStudentsModal({ onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOnline = async () => {
    setLoading(true);
    try {
      const data = await getOnlineStudents();
      setStudents(data || []);
    } catch (err) {
      console.error('Erro ao carregar estudantes online:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnline();
    const interval = setInterval(fetchOnline, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 10, 25, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.5rem'
    }}>
      <div 
        className="glass-card" 
        style={{ 
          maxWidth: '720px', 
          width: '100%', 
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(0, 199, 253, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Cabeçalho */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(0, 163, 224, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981'
            }}>
              <Activity size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                Estudantes Conectados em Tempo Real
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Atividade registada nos últimos 5 minutos
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={fetchOnline}
              disabled={loading}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}
              title="Atualizar lista"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '0.4rem'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {loading && students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
              <p>A verificar presenças online...</p>
            </div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
              <Users size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p style={{ fontWeight: '600', color: '#FFFFFF', marginBottom: '0.25rem' }}>Nenhum estudante ativo no momento</p>
              <p style={{ fontSize: '0.8rem' }}>Assim que um estudante interagir com o portal, aparecerá aqui automaticamente.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: '600', marginBottom: '0.25rem' }}>
                {students.length} {students.length === 1 ? 'estudante online' : 'estudantes online agora'}
              </div>
              {students.map((st) => (
                <div 
                  key={st.user_id || st.student_id || Math.random()}
                  style={{
                    background: 'rgba(0, 30, 60, 0.6)',
                    border: '1px solid rgba(0, 199, 253, 0.2)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <UserAvatar
                      photoUrl={st.photo_url || st.avatar_url || st.student?.photo_url}
                      name={st.full_name || st.student?.full_name || 'Estudante'}
                      size={42}
                      role="estudante"
                      showOnlineDot={true}
                      isOnline={true}
                    />

                    <div>
                      <div style={{ fontWeight: '700', color: '#FFFFFF', fontSize: '0.92rem' }}>
                        {st.full_name || st.student?.full_name || 'Estudante'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                        {(st.student_code || st.student?.student_code) ? (
                          <span style={{ color: '#00C7FD', fontWeight: '600' }}>
                            {st.student_code || st.student?.student_code}
                          </span>
                        ) : null}
                        {(st.student_code || st.student?.student_code) && (st.email || st.student?.email) ? ' • ' : ''}
                        <span>{st.email || st.student?.email || 'Estudante Ativo'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ 
                      fontSize: '0.7rem', 
                      color: '#10B981', 
                      fontWeight: '600',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.35rem',
                      justifyContent: 'flex-end'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                      Ativo
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.2rem' }}>
                      Última ação: {formatDateTime(st.last_seen_at || st.updated_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div style={{
          padding: '0.9rem 1.5rem',
          borderTop: '1px solid rgba(0, 163, 224, 0.2)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '0.45rem 1.25rem' }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
