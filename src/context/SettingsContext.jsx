import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { getSettings } from '../services/api';

const defaultSettings = {
  institution: {
    name: 'ZATY ACADEMY',
    tagline: 'Centro de Formação em Informática e Tecnologia',
    phone: '+258 834 847 306',
    alternative_phone: '834 847 306',
    email: 'contacto@zatyacademy.co.mz',
    city: 'Nampula',
    address: 'Namicopo – Nampula, Moçambique (Próximo à 3ª Esquadra)',
    reference: 'Próximo à 3ª Esquadra',
    website: 'https://zatyacademy.co.mz',
    director_name: 'Eng. Carlos Alberto',
    director_role: 'Diretor Geral',
    logo_url: '/logo.png',
    document_logo_url: '',
    signature_url: '',
    stamp_url: '',
    nuit: '400123456'
  },
  payment_methods: {
    mpesa: {
      enabled: true,
      name: 'M-Pesa',
      number: '84 000 0000',
      holder: 'ZATY ACADEMY',
      instructions: 'Envie o valor exato para o número M-Pesa indicado. Guarde a mensagem de confirmação da Vodacom (ID de transação) e faça captura de ecrã/screenshot para anexar como comprovativo.'
    },
    emola: {
      enabled: true,
      name: 'e-Mola',
      number: '86 000 0000',
      holder: 'ZATY ACADEMY',
      instructions: 'Transfira o montante através do menu *898# para o número e-Mola indicado. Guarde o SMS de confirmação da Movitel e anexe o comprovativo.'
    },
    mkesh: {
      enabled: true,
      name: 'mKesh',
      number: '82 000 0000',
      holder: 'ZATY ACADEMY',
      instructions: 'Efetue o pagamento através do mKesh para o número indicado. Guarde o SMS ou comprovativo gerado e anexe na solicitação.'
    }
  },
  academic: {
    registration_fee: 500,
    allow_online_registration: true,
    max_installments: 3,
    academic_year: '2026',
    passing_grade: 10,
    enrollment_notice_enabled: true,
    enrollment_title: 'Edital Oficial de Inscrições & Matrículas',
    enrollment_period: 'Ano Letivo 2026 • Inscrições Abertas',
    enrollment_requirements: '1. Fotocópia autenticada do BI, Passaporte ou DIRE\n2. Certificado de Habilitações Literárias (ou declaração da escola)\n3. Duas (2) fotografias tipo passe recentes\n4. Ficha de inscrição devidamente preenchida',
    enrollment_conditions: 'Taxa de Inscrição: 500 MT (paga uma única vez no ato da matrícula). Mensalidades acessíveis com pagamento até ao dia 10 de cada mês. Vagas estritamente limitadas para garantir um computador por estudante nos laboratórios de informática.',
    enrollment_procedures: '1. Escolha o seu curso pretendido e preencha a inscrição online ou dirija-se à secretaria da academia.\n2. Efetue o pagamento da taxa de inscrição através de M-Pesa, e-Mola ou na secretaria.\n3. Anexe o comprovativo de pagamento no portal do estudante ou entregue na secretaria.\n4. Receba a confirmação da sua matrícula, turma, horário das aulas e credenciais de acesso ao portal.',
    enrollment_schedule_info: 'Turnos Disponíveis: Manhã (08h00 às 10h00 e 10h30 às 12h30) | Tarde (14h00 às 16h00) | Pós-Laboral (17h30 às 19h30) | Sábados Intensivo (08h00 às 13h00)'
  },
  contact: {
    whatsapp_number: '+258 834 847 306',
    support_hours: 'Segunda a Sexta, das 08h às 17h | Sábados das 08h às 13h',
    terms_notice: 'Ao matricular-se, o aluno concorda com o regulamento interno e pedagógico da Zaty Academy.'
  }
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      if (data) {
        setSettings(prev => ({
          institution: { ...prev.institution, ...(data.institution || {}) },
          payment_methods: { ...prev.payment_methods, ...(data.payment_methods || {}) },
          academic: { ...prev.academic, ...(data.academic || {}) },
          contact: { ...prev.contact, ...(data.contact || {}) }
        }));
      }
    } catch (err) {
      console.warn('Usando configurações padrão da instituição:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();

    const handleCustomEvent = () => {
      loadSettings();
    };

    // Subscrição em Tempo Real para refletir mudanças globais imediatamente
    const settingsChannel = supabase.channel('academy-settings-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'academy_settings'
      }, () => {
        loadSettings();
      })
      .subscribe();

    if (typeof window !== 'undefined') {
      window.addEventListener('zaty-settings-updated', handleCustomEvent);
    }

    return () => {
      supabase.removeChannel(settingsChannel);
      if (typeof window !== 'undefined') {
        window.removeEventListener('zaty-settings-updated', handleCustomEvent);
      }
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
}
