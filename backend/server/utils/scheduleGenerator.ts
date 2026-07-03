import { addDays, format, isBefore, startOfDay } from 'date-fns';

interface StudySection {
  id: string;
  title: string;
  weight: string; // ex: "20%"
  cards: any[]; // cada card deve ter { title: string; keyTakeaways: string[] }
}

// Dia da semana informado pelo usuário + horas disponíveis naquele dia
interface StudyDayInput {
  day: string; // "segunda", "terça-feira", "sabado", etc. (aceita várias grafias)
  hours: number;
}

interface GenerateScheduleParams {
  courseId: string;
  examDate: string; // ISO string
  studyDays: StudyDayInput[]; // dias da semana + horas disponíveis em cada um
  studySections: StudySection[];
}

interface StudyBlock {
  id: string;
  day: string; // nome do dia da semana (ex: "Segunda-feira")
  date: string; // data formatada dd/MM
  title: string; // assunto/tópico
  duration: string; // ex: "2h" ou "1h30"
  methodology: string;
  subtopics: string[];
  done: boolean;
}

interface ScheduleWeek {
  id: string;
  title: string;
  dateRange: string;
  focus: string;
  blocks: StudyBlock[];
}

// ---------- Helpers ----------

const WEEKDAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

// Normaliza qualquer grafia comum de dia da semana para um índice 0-6 (0 = domingo)
function normalizeWeekday(input: string): number {
  const s = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim();

  if (s.startsWith('dom')) return 0;
  if (s.startsWith('seg')) return 1;
  if (s.startsWith('ter')) return 2;
  if (s.startsWith('qua')) return 3;
  if (s.startsWith('qui')) return 4;
  if (s.startsWith('sex')) return 5;
  if (s.startsWith('sab')) return 6;

  throw new Error(`Dia da semana não reconhecido: "${input}"`);
}

function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (minutes === 0) return `${wholeHours}h`;
  return `${wholeHours}h${minutes.toString().padStart(2, '0')}`;
}

function parseWeight(weight: string): number {
  return parseInt(weight.replace('%', ''), 10) || 0;
}

// ---------- Função principal ----------

export function generateSchedule(params: GenerateScheduleParams): ScheduleWeek[] {
  const { examDate, studyDays, studySections } = params;

  if (studyDays.length === 0) {
    throw new Error('Informe pelo menos um dia da semana disponível para estudo');
  }
  if (studySections.length === 0) {
    throw new Error('Informe pelo menos um assunto de estudo');
  }

  const examDateObj = startOfDay(new Date(examDate));
  const today = startOfDay(new Date());

  if (!isBefore(today, examDateObj)) {
    throw new Error('A data da prova deve ser futura');
  }

  // Mapa: índice do dia da semana (0-6) -> horas disponíveis
  const hoursByWeekday = new Map<number, number>();
  studyDays.forEach(({ day, hours }) => {
    const idx = normalizeWeekday(day);
    hoursByWeekday.set(idx, hours);
  });

  // 1. Monta a lista real de dias de estudo entre hoje e a prova
  interface StudyDaySlot {
    date: Date;
    weekdayIndex: number;
    hours: number;
  }

  const studySlots: StudyDaySlot[] = [];
  let cursor = today;
  while (isBefore(cursor, examDateObj)) {
    const weekdayIndex = cursor.getDay();
    const hours = hoursByWeekday.get(weekdayIndex);
    if (hours && hours > 0) {
      studySlots.push({ date: cursor, weekdayIndex, hours });
    }
    cursor = addDays(cursor, 1);
  }

  if (studySlots.length === 0) {
    throw new Error('Não há dias de estudo disponíveis entre hoje e a data da prova');
  }

  const totalHours = studySlots.reduce((sum, slot) => sum + slot.hours, 0);

  // 2. Meta de horas por assunto, proporcional ao peso
  const totalWeight = studySections.reduce((sum, s) => sum + parseWeight(s.weight), 0);
  const targetHoursBySection: Record<string, number> = {};
  studySections.forEach(section => {
    const weight = parseWeight(section.weight);
    targetHoursBySection[section.id] = totalWeight > 0 ? (weight / totalWeight) * totalHours : 0;
  });

  // 3. Distribuição "round-robin por déficit": em cada dia, o assunto mais
  //    atrasado em relação à sua meta de horas leva o dia inteiro.
  const assignedHoursBySection: Record<string, number> = {};
  const cardPointerBySection: Record<string, number> = {};
  studySections.forEach(section => {
    assignedHoursBySection[section.id] = 0;
    cardPointerBySection[section.id] = 0;
  });

  interface AssignedDay extends StudyDaySlot {
    sectionId: string;
  }

  const assignedDays: AssignedDay[] = [];

  for (const slot of studySlots) {
    // Escolhe a seção com maior déficit (meta - já atribuído)
    let chosenSection: StudySection | null = null;
    let biggestDeficit = -Infinity;

    for (const section of studySections) {
      const deficit = targetHoursBySection[section.id] - assignedHoursBySection[section.id];
      if (deficit > biggestDeficit) {
        biggestDeficit = deficit;
        chosenSection = section;
      }
    }

    if (!chosenSection) continue;

    assignedHoursBySection[chosenSection.id] += slot.hours;
    assignedDays.push({ ...slot, sectionId: chosenSection.id });
  }

  // 4. Monta os blocos de estudo (um por dia) usando os cards de cada seção
  let blockCounter = 0;
  const allBlocks: StudyBlock[] = assignedDays.map(assignedDay => {
    const section = studySections.find(s => s.id === assignedDay.sectionId)!;
    const pointer = cardPointerBySection[section.id];
    const card = section.cards.length > 0 ? section.cards[pointer % section.cards.length] : null;
    cardPointerBySection[section.id] = pointer + 1;

    return {
      id: `block-${blockCounter++}`,
      day: WEEKDAY_NAMES[assignedDay.weekdayIndex],
      date: format(assignedDay.date, 'dd/MM'),
      title: card ? card.title : section.title,
      duration: formatHours(assignedDay.hours),
      methodology: '30% Teoria, 50% Exercícios, 20% Revisão',
      subtopics: card?.keyTakeaways ? card.keyTakeaways.slice(0, 3) : [],
      done: false,
    };
  });

  // 5. Agrupa os blocos em semanas civis (blocos de 7 dias corridos a partir do primeiro dia de estudo)
  const weeks: ScheduleWeek[] = [];
  if (allBlocks.length === 0) return weeks;

  let weekStart = assignedDays[0].date;
  let weekIndex = 0;
  let weekBlocks: StudyBlock[] = [];

  const pushWeek = (blocks: StudyBlock[], start: Date) => {
    if (blocks.length === 0) return;
    const end = addDays(start, 6);
    const uniqueTitles = Array.from(new Set(blocks.map(b => b.title)));
    weeks.push({
      id: `week-${weekIndex}`,
      title: `Semana ${weekIndex + 1}`,
      dateRange: `${format(start, 'dd/MM')} - ${format(end, 'dd/MM')}`,
      focus: uniqueTitles.join(', '),
      blocks,
    });
    weekIndex++;
  };

  assignedDays.forEach((assignedDay, i) => {
    const daysSinceWeekStart = Math.floor(
      (assignedDay.date.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceWeekStart >= 7) {
      pushWeek(weekBlocks, weekStart);
      weekBlocks = [];
      weekStart = assignedDay.date;
    }

    weekBlocks.push(allBlocks[i]);
  });

  pushWeek(weekBlocks, weekStart);

  return weeks;
}