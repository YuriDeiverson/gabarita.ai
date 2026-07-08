import { useState, useEffect, useMemo, MouseEvent } from 'react';
import { COURSES_CONFIG, generateCustomPlan } from '../data/generator';
import { studyPlansApi, scheduleApi } from '../services/api';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Sparkles, 
  CheckSquare, 
  Settings2, 
  Award, 
  Info, 
  HeartPulse, 
  GraduationCap, 
  CheckCircle, 
  ArrowLeft, 
  Trash2, 
  Play, 
  Check 
} from 'lucide-react';

interface HomeTabProps {
  onPlanGenerated: (courseId: string) => void;
}

export default function HomeTab({ onPlanGenerated }: HomeTabProps) {
  const [screen, setScreen] = useState<'selection' | 'configure'>('selection');
  const [selectedCourse, setSelectedCourse] = useState<string>('jornalismo');

  // Configuration States (loaded dynamically per course when configuring)
  const [examDate, setExamDate] = useState<string>('2026-08-15');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]); // Monday to Friday
  const [hoursPerDayInput, setHoursPerDayInput] = useState<string>('4');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  // List of active plans stats
  const [savedPlans, setSavedPlans] = useState<{ [key: string]: any }>({});

  const weekdayOptions = [
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
  { label: 'Dom', value: 0 },
];

const WEEKDAY_NUMBER_TO_NAME: { [key: number]: string } = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado',
};

  // Helper to calculate matching study days between today (July 2, 2026) and exam date
  const calculateStudyDays = (examDateStr: string, weekdays: number[]): number => {
    const today = new Date('2026-07-02');
    const exam = new Date(examDateStr);
    if (exam < today || weekdays.length === 0) return 0;
    
    let count = 0;
    let tempDate = new Date(today);
    while (tempDate <= exam) {
      if (weekdays.includes(tempDate.getDay())) {
        count++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    return count;
  };

  const getCoursePlanStats = (courseId: string) => {
    const configSaved = localStorage.getItem(`${courseId}_study_config`);
    if (!configSaved) return null;

    let examDateStr = '';
    let hoursPerDayNum = 0;
    let totalDaysNum = 0;
    let weekdaysArr: number[] = [];

    try {
      const parsed = JSON.parse(configSaved);
      examDateStr = parsed.examDate;
      hoursPerDayNum = parsed.hoursPerDay;
      totalDaysNum = parsed.totalDays;
      weekdaysArr = parsed.selectedWeekdays || [1, 2, 3, 4, 5];
    } catch (e) {}

    let totalBlocks = 0;
    let completedBlocks = 0;

    const weeksSaved = localStorage.getItem(`${courseId}_schedule_weeks`);
    if (weeksSaved) {
      try {
        const weeks = JSON.parse(weeksSaved);
        weeks.forEach((w: any) => {
          totalBlocks += (w.blocks || []).length;
        });
      } catch (e) {}
    }

    const progressSaved = localStorage.getItem(`${courseId}_study_schedule_progress`);
    if (progressSaved) {
      try {
        const progress = JSON.parse(progressSaved);
        completedBlocks = Object.keys(progress).filter(key => progress[key]).length;
      } catch (e) {}
    }

    return {
      examDate: examDateStr,
      hoursPerDay: hoursPerDayNum,
      totalDays: totalDaysNum,
      selectedWeekdays: weekdaysArr,
      totalBlocks,
      completedBlocks,
      percentage: totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0
    };
  };

  const loadSavedPlans = () => {
    const plans: { [key: string]: any } = {};
    ['seplag_informatica', 'tecnico_enfermagem', 'jornalismo'].forEach(courseId => {
      const stats = getCoursePlanStats(courseId);
      if (stats) {
        plans[courseId] = stats;
      }
    });
    setSavedPlans(plans);
  };

  useEffect(() => {
    loadSavedPlans();
  }, []);

  // Compute live study days on configuration screen
  const calculatedDays = useMemo(() => {
    return calculateStudyDays(examDate, selectedWeekdays);
  }, [examDate, selectedWeekdays]);

  const normalizedHoursPerDay = useMemo(() => {
    const parsed = Number(hoursPerDayInput);
    if (!Number.isFinite(parsed)) return 1;
    return Math.min(24, Math.max(1, parsed));
  }, [hoursPerDayInput]);

  const handleHoursPerDayChange = (value: string) => {
    if (value === '') {
      setHoursPerDayInput('');
      return;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    setHoursPerDayInput(String(Math.min(24, Math.max(0, parsed))));
  };

  const commitHoursPerDay = () => {
    setHoursPerDayInput(String(normalizedHoursPerDay));
  };

  // Load configuration for a specific course to edit
  const handleOpenConfigure = (courseId: string) => {
    setSelectedCourse(courseId);
    const config = COURSES_CONFIG[courseId];
    
    // Attempt to load existing config
    const savedConfigStr = localStorage.getItem(`${courseId}_study_config`);
    if (savedConfigStr) {
      try {
        const parsed = JSON.parse(savedConfigStr);
        setExamDate(parsed.examDate || '2026-08-15');
        setSelectedWeekdays(parsed.selectedWeekdays || [1, 2, 3, 4, 5]);
        setHoursPerDayInput(String(Math.max(1, parsed.hoursPerDay || 4)));
        setSelectedTopicIds(parsed.selectedTopics || config.topics.map(t => t.id));
      } catch (e) {
        // Fallbacks
        setExamDate('2026-08-15');
        setSelectedWeekdays([1, 2, 3, 4, 5]);
        setHoursPerDayInput('4');
        setSelectedTopicIds(config.topics.map(t => t.id));
      }
    } else {
      // Defaults
      setExamDate('2026-08-15');
      setSelectedWeekdays([1, 2, 3, 4, 5]);
      setHoursPerDayInput('4');
      setSelectedTopicIds(config.topics.map(t => t.id));
    }
    setScreen('configure');
  };

  const handleWeekdayToggle = (value: number) => {
    setSelectedWeekdays(prev => 
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value].sort()
    );
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopicIds(prev => 
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleCreatePlan = async () => {
    if (selectedTopicIds.length === 0) {
      alert("Por favor, selecione pelo menos um assunto para estudar!");
      return;
    }
    if (selectedWeekdays.length === 0) {
      alert("Por favor, selecione pelo menos um dia da semana para estudar!");
      return;
    }
    if (calculatedDays === 0) {
      alert("Com as configurações escolhidas, não há dias de estudo entre hoje (02/07/2026) e o dia da prova!");
      return;
    }
    const hoursPerDay = normalizedHoursPerDay;
    setHoursPerDayInput(String(hoursPerDay));

    const today = new Date('2026-07-02');
    const exam = new Date(examDate);
    if (exam < today) {
      if (!window.confirm("A data da prova selecionada já passou em relação à data atual simulada (02/07/2026). Deseja prosseguir mesmo assim?")) {
        return;
      }
    }

    try {
      // Call generator to build custom study sections, questions, and calendar weeks
      const result = generateCustomPlan(
        selectedCourse,
        examDate,
        calculatedDays,
        hoursPerDay,
        selectedTopicIds,
        selectedWeekdays
      );

      if (result.success) {
        // Generate schedule using API
      const studyDaysPayload = selectedWeekdays.map(dayNum => ({
  day: WEEKDAY_NUMBER_TO_NAME[dayNum],
  hours: hoursPerDay,
}));

const scheduleResponse = await scheduleApi.generate({
  courseId: selectedCourse,
  examDate,
  studyDays: studyDaysPayload,
  studySections: result.sections
});

const scheduleWeeks = scheduleResponse.scheduleWeeks; // <-- ADICIONAR ESSA LINHA

        // Create study plan via API
        const studyPlan = await studyPlansApi.create({
          courseId: selectedCourse,
          title: activeCourseConfig.name,
          examDate,
          hoursPerDay,
          daysPerWeek: selectedWeekdays.length,
          totalWeeks: scheduleWeeks.length,
          studySections: result.sections,
          scheduleWeeks: scheduleWeeks
        });

        // Activate the plan
        await studyPlansApi.activate(studyPlan.id);

        // 1. Save to course-specific prefixed keys (safe storage)
        localStorage.setItem(`${selectedCourse}_study_sections`, JSON.stringify(result.sections));
        localStorage.setItem(`${selectedCourse}_quiz_questions`, JSON.stringify(result.questions));
        localStorage.setItem(`${selectedCourse}_schedule_weeks`, JSON.stringify(scheduleWeeks));
        localStorage.setItem(`${selectedCourse}_study_config`, JSON.stringify({
          examDate,
          totalDays: calculatedDays,
          hoursPerDay,
          selectedWeekdays,
          selectedTopics: selectedTopicIds,
          studyPlanId: studyPlan.id
        }));
        localStorage.removeItem(`${selectedCourse}_study_schedule_progress`);
        localStorage.removeItem(`${selectedCourse}_quiz_answers`);

        // 2. Load into active keys (so other tabs immediately work)
        localStorage.setItem('active_course', selectedCourse);
        localStorage.setItem('custom_study_sections', JSON.stringify(result.sections));
        localStorage.setItem('custom_quiz_questions', JSON.stringify(result.questions));
        localStorage.setItem('custom_schedule_weeks', JSON.stringify(scheduleWeeks));
        localStorage.setItem('study_config', JSON.stringify({
          examDate,
          totalDays: calculatedDays,
          hoursPerDay,
          selectedWeekdays,
          selectedTopics: selectedTopicIds,
          studyPlanId: studyPlan.id
        }));
        localStorage.removeItem('study_schedule_progress');
        localStorage.removeItem('quiz_answers');

        // Reload saved plans list
        loadSavedPlans();

        // Trigger callback in parent component to switch to Study Summaries
        onPlanGenerated(selectedCourse);
      }
    } catch (error) {
      console.error('Error creating study plan:', error);
      alert('Erro ao criar plano de estudo. Tente novamente.');
    }
  };

  const handleActivatePlan = (courseId: string) => {
    const sections = localStorage.getItem(`${courseId}_study_sections`);
    const questions = localStorage.getItem(`${courseId}_quiz_questions`);
    const weeks = localStorage.getItem(`${courseId}_schedule_weeks`);
    const config = localStorage.getItem(`${courseId}_study_config`);
    const progress = localStorage.getItem(`${courseId}_study_schedule_progress`);
    const quizAnswers = localStorage.getItem(`${courseId}_quiz_answers`);

    if (sections && questions && weeks && config) {
      localStorage.setItem('active_course', courseId);
      localStorage.setItem('custom_study_sections', sections);
      localStorage.setItem('custom_quiz_questions', questions);
      localStorage.setItem('custom_schedule_weeks', weeks);
      localStorage.setItem('study_config', config);
      
      if (progress) {
        localStorage.setItem('study_schedule_progress', progress);
      } else {
        localStorage.removeItem('study_schedule_progress');
      }

      if (quizAnswers) {
        localStorage.setItem('quiz_answers', quizAnswers);
      } else {
        localStorage.removeItem('quiz_answers');
      }

      onPlanGenerated(courseId);
    } else {
      // Plan data is incomplete, open configuration for it
      handleOpenConfigure(courseId);
    }
  };

  const handleDeletePlan = async (courseId: string, e: MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card click
    if (window.confirm("Deseja realmente excluir este plano de estudos? Seu progresso e histórico serão perdidos de forma irreversível.")) {
      try {
        // Get study plan ID from config
        const config = localStorage.getItem(`${courseId}_study_config`);
        let studyPlanId = null;
        if (config) {
          try {
            const parsed = JSON.parse(config);
            studyPlanId = parsed.studyPlanId;
          } catch (e) {}
        }

        // Delete from API if study plan ID exists. If production API is unavailable,
        // still remove the local plan so the user is not blocked by stale data.
        if (studyPlanId) {
          try {
            await studyPlansApi.delete(studyPlanId);
          } catch (apiError) {
            console.warn('Remote study plan deletion failed; clearing local plan only.', apiError);
          }
        }

        // Clear localStorage
        localStorage.removeItem(`${courseId}_study_sections`);
        localStorage.removeItem(`${courseId}_quiz_questions`);
        localStorage.removeItem(`${courseId}_schedule_weeks`);
        localStorage.removeItem(`${courseId}_study_config`);
        localStorage.removeItem(`${courseId}_study_schedule_progress`);
        localStorage.removeItem(`${courseId}_quiz_answers`);

        // If this was the active course, clean active keys
        const active = localStorage.getItem('active_course');
        if (active === courseId) {
          localStorage.removeItem('active_course');
          localStorage.removeItem('custom_study_sections');
          localStorage.removeItem('custom_quiz_questions');
          localStorage.removeItem('custom_schedule_weeks');
          localStorage.removeItem('study_config');
          localStorage.removeItem('study_schedule_progress');
          localStorage.removeItem('quiz_answers');
        }

        loadSavedPlans();
      } catch (error) {
        console.error('Error deleting study plan:', error);
        alert('Erro ao excluir plano de estudo. Tente novamente.');
      }
    }
  };

  const activeCourseConfig = COURSES_CONFIG[selectedCourse] || COURSES_CONFIG.jornalismo;

  return (
    <div id="home-tab-container" className="space-y-8 animate-fade-in">
      
      {screen === 'selection' ? (
        <>
          {/* Banner Principal */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 rounded-3xl shadow-md border border-indigo-900 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
            <div className="relative z-10 max-w-4xl space-y-4">
              <span className="px-3 py-1 text-xs font-bold bg-indigo-500 text-indigo-50 rounded-full inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Gabarita Concursos • Planejamento Inteligente
              </span>
              <h2 className="text-2xl lg:text-3.5xl font-black tracking-tight leading-none text-white">
                Reta Final de Alta Performance de Pareto (80/20)
              </h2>
              <p className="text-sm lg:text-base text-slate-300 leading-relaxed">
                Nossa metodologia analisa o edital e prioriza os pontos mais recorrentes com resumos de ouro e simulados realistas da banca CEBRASPE. Crie múltiplos planos e mude de especialidade a qualquer momento!
              </p>
            </div>
          </div>

          {/* Seção 1: Escolha de Especialidade */}
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-600" />
              Escolha uma Especialidade para Iniciar ou Reconfigurar:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card Informática */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs flex flex-col justify-between h-72">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">Informática</h4>
                    <p className="text-xs text-slate-400 mt-1">SEPLAG AL - Especialista em Gestão Pública</p>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3">
                    Foco completo em Engenharia de Software, DevOps, Banco de Dados Relacional e NoSQL, Redes e Legislação específica de Alagoas.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => handleOpenConfigure('seplag_informatica')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    {savedPlans.seplag_informatica ? 'Reconfigurar' : 'Configurar Plano'}
                  </button>
                </div>
              </div>

              {/* Card Técnico Enfermagem */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs flex flex-col justify-between h-72">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">Técnico em Enfermagem</h4>
                    <p className="text-xs text-slate-400 mt-1">Concurso Saúde e Hospitais Públicos</p>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3">
                    Revisão sistemática de Fundamentos de Enfermagem, Legislação do SUS, Urgência & Emergência, Farmacologia e Deontologia COFEN.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => handleOpenConfigure('tecnico_enfermagem')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    {savedPlans.tecnico_enfermagem ? 'Reconfigurar' : 'Configurar Plano'}
                  </button>
                </div>
              </div>

              {/* Card Jornalismo */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs flex flex-col justify-between h-72">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">Jornalismo</h4>
                    <p className="text-xs text-slate-400 mt-1">Comunicação, Redação e Assessoria</p>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3">
                    Preparação focado em Assessoria de Imprensa, Teorias da Comunicação, Marco Legal de CT&I, Divulgação Científica e Ética.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => handleOpenConfigure('jornalismo')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    {savedPlans.jornalismo ? 'Reconfigurar' : 'Configurar Plano'}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Seção 2: Seus Planos Salvos */}
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Seus Planos de Estudo Ativos e Salvos:
            </h3>

            {Object.keys(savedPlans).length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
                Nenhum plano de estudos foi gerado ainda. Escolha uma especialidade acima e clique em "Configurar Plano"!
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.keys(savedPlans).map(courseId => {
                  const plan = savedPlans[courseId];
                  const config = COURSES_CONFIG[courseId];
                  const weekdaysFormatted = plan.selectedWeekdays.map((val: number) => {
                    const opt = weekdayOptions.find(o => o.value === val);
                    return opt ? opt.label : '';
                  }).filter(Boolean).join(', ');

                  return (
                    <div
                      key={courseId}
                      onClick={() => handleActivatePlan(courseId)}
                      className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase">
                            {courseId === 'seplag_informatica' ? 'Informática' : courseId === 'tecnico_enfermagem' ? 'Enfermagem' : 'Jornalismo'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            Prova em {plan.examDate.split('-').reverse().join('/')}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-sm lg:text-base">
                          {config.name}
                        </h4>
                        
                        <div className="text-[11px] text-slate-500 space-y-1">
                          <p className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Carga Horária: <strong>{plan.hoursPerDay}h/dia</strong> nos dias [<strong>{weekdaysFormatted}</strong>]</span>
                          </p>
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Total de <strong>{plan.totalDays} dias de estudo</strong> planejados até a prova</span>
                          </p>
                        </div>
                      </div>

                      {/* Progresso */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                          <span>Progresso do Cronograma</span>
                          <span className="text-indigo-600">{plan.percentage}% ({plan.completedBlocks}/{plan.totalBlocks} Metas)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all"
                            style={{ width: `${plan.percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 gap-4">
                        <button
                          type="button"
                          onClick={() => handleActivatePlan(courseId)}
                          className="flex items-center gap-1 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-extrabold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Estudar / Ativar
                        </button>
                        
                        <button
                          type="button"
                          onClick={(e) => handleDeletePlan(courseId, e)}
                          className="text-slate-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Excluir Plano"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Tela de Configuração do Plano */
        <div className="space-y-6 animate-fade-in">
          
          {/* Botão Voltar */}
          <button
            onClick={() => setScreen('selection')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold text-xs cursor-pointer transition hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a seleção de especialidades
          </button>

          {/* Grid do Formulário */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Formulário de Configuração */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
                
                {/* Header do Form */}
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedCourse === 'seplag_informatica' ? 'bg-indigo-50 text-indigo-600' : selectedCourse === 'tecnico_enfermagem' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {selectedCourse === 'seplag_informatica' ? <GraduationCap className="w-5 h-5" /> : selectedCourse === 'tecnico_enfermagem' ? <HeartPulse className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-850 text-base">Configurar Cronograma: {activeCourseConfig.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{activeCourseConfig.description}</p>
                  </div>
                </div>

                {/* 1. Dia da Prova e Carga Horária */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Dia da Prova */}
                  <div className="space-y-1.5">
                    <label htmlFor="exam-date" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Data da Prova:</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        id="exam-date"
                        type="date"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-9 pr-3 text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-700 font-medium"
                      />
                    </div>
                  </div>

                  {/* Horas de Estudo por Dia */}
                  <div className="space-y-1.5">
                    <label htmlFor="hours-per-day" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Horas de Estudo por Dia:</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        id="hours-per-day"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="24"
                        step="1"
                        value={hoursPerDayInput}
                        aria-describedby="hours-per-day-help"
                        aria-invalid={hoursPerDayInput !== '' && Number(hoursPerDayInput) < 1}
                        onChange={(e) => handleHoursPerDayChange(e.target.value)}
                        onBlur={commitHoursPerDay}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-9 pr-3 text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-700 font-mono font-bold"
                      />
                    </div>
                    <p id="hours-per-day-help" className="text-[10px] text-slate-400">
                      Mínimo de 1 hora por dia.
                    </p>
                  </div>

                </div>

                {/* 2. Dias da Semana de Estudo */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Dias da semana que posso estudar:</label>
                  <div className="flex flex-wrap gap-2">
                    {weekdayOptions.map(day => {
                      const isSelected = selectedWeekdays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => handleWeekdayToggle(day.value)}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          <span>{day.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Assuntos do Edital (Filtro) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Selecione os Assuntos do Edital:</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTopicIds(activeCourseConfig.topics.map(t => t.id))}
                        className="text-[10px] text-indigo-600 font-bold hover:underline"
                      >
                        Selecionar Todos
                      </button>
                      <span className="text-slate-300 text-[10px]">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTopicIds([])}
                        className="text-[10px] text-slate-500 font-bold hover:underline"
                      >
                        Limpar Todos
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeCourseConfig.topics.map(topic => {
                      const isChecked = selectedTopicIds.includes(topic.id);
                      return (
                        <div
                          key={topic.id}
                          onClick={() => handleTopicToggle(topic.id)}
                          className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                            isChecked 
                              ? 'bg-slate-50 border-slate-300' 
                              : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <button
                            type="button"
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition ${
                              isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                            }`}
                          >
                            {isChecked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </button>
                          <div className="space-y-0.5">
                            <span className="text-xs font-extrabold text-slate-800">{topic.title}</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {topic.subtopics.slice(0, 3).map((sub, i) => (
                                <span key={i} className="text-[8px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                  {sub}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Botão de Geração */}
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCreatePlan}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm py-3.5 px-6 rounded-xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Criar e Ativar Cronograma de Estudos 🚀
                  </button>
                </div>

              </div>
            </div>

            {/* Painel Tático Resumo */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h3 className="font-extrabold text-xs lg:text-sm uppercase tracking-wider text-amber-500">Painel Tático de Pareto</h3>
                </div>
                
                <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-slate-400 block font-bold">Especialidade:</span>
                    <span className="text-sm font-extrabold text-white">{activeCourseConfig.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold font-mono">Dias de Estudo Ativo:</span>
                    <span className="text-sm font-extrabold text-indigo-400">{calculatedDays} dias de estudo efetivos</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Carga Total Disponível:</span>
                    <span className="text-sm font-extrabold text-emerald-400">{calculatedDays * normalizedHoursPerDay}h de estudo bruto</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Frequência Semanal:</span>
                    <span className="text-white font-extrabold">{selectedWeekdays.length} dias por semana ({selectedWeekdays.length * normalizedHoursPerDay}h/semana)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Assuntos Selecionados:</span>
                    <span className="text-white font-extrabold">{selectedTopicIds.length} de {activeCourseConfig.topics.length} tópicos do edital</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-slate-800/50 p-3 rounded-lg border border-slate-800 text-[11px] leading-relaxed">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-slate-400">
                    Ao criar o cronograma, suas horas serão distribuídas de forma inteligente pelas semanas restantes até a prova. Os resumos e questões se ajustarão automaticamente aos assuntos selecionados!
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
