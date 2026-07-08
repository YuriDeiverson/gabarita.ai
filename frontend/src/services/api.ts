const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export interface StudyPlan {
  id: string;
  course_id: string;
  title: string;
  exam_date: string;
  hours_per_day: number;
  days_per_week: number;
  total_weeks: number;
  study_sections: string;
  schedule_weeks: string;
  created_at: string;
  updated_at: string;
  is_active: number;
}

export interface QuizProgress {
  id: string;
  study_plan_id: string;
  question_id: number;
  answer: string;
  is_correct: number;
  answered_at: string;
}

export interface ScheduleProgress {
  id: string;
  study_plan_id: string;
  block_id: string;
  is_completed: number;
  completed_at: string | null;
}

// Study Plans API
export const studyPlansApi = {
  getAll: async (): Promise<StudyPlan[]> => {
    const response = await fetch(`${API_BASE_URL}/study-plans`);
    if (!response.ok) throw new Error('Failed to fetch study plans');
    return response.json();
  },

  getById: async (id: string): Promise<StudyPlan> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}`);
    if (!response.ok) throw new Error('Failed to fetch study plan');
    return response.json();
  },

  getActive: async (): Promise<StudyPlan> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/active/current`);
    if (!response.ok) throw new Error('Failed to fetch active study plan');
    return response.json();
  },

  create: async (data: {
    courseId: string;
    title: string;
    examDate: string;
    hoursPerDay: number;
    daysPerWeek: number;
    totalWeeks: number;
    studySections: any[];
    scheduleWeeks: any[];
  }): Promise<StudyPlan> => {
    const response = await fetch(`${API_BASE_URL}/study-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create study plan');
    return response.json();
  },

  update: async (id: string, data: {
    courseId: string;
    title: string;
    examDate: string;
    hoursPerDay: number;
    daysPerWeek: number;
    totalWeeks: number;
    studySections: any[];
    scheduleWeeks: any[];
  }): Promise<StudyPlan> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update study plan');
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete study plan');
  },

  activate: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}/activate`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error('Failed to activate study plan');
  },
};

// Quiz Progress API
export const quizProgressApi = {
  getByStudyPlan: async (studyPlanId: string): Promise<QuizProgress[]> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress/study-plan/${studyPlanId}`);
    if (!response.ok) throw new Error('Failed to fetch quiz progress');
    return response.json();
  },

  getById: async (id: string): Promise<QuizProgress> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress/${id}`);
    if (!response.ok) throw new Error('Failed to fetch quiz progress');
    return response.json();
  },

  create: async (data: {
    studyPlanId: string;
    questionId: number;
    answer: string;
    isCorrect: boolean;
  }): Promise<QuizProgress> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to save quiz progress');
    return response.json();
  },

  update: async (id: string, data: {
    answer: string;
    isCorrect: boolean;
  }): Promise<QuizProgress> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update quiz progress');
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete quiz progress');
  },

  deleteByStudyPlan: async (studyPlanId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress/study-plan/${studyPlanId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete quiz progress');
  },

  getStats: async (studyPlanId: string): Promise<{
    total_answered: number;
    correct_answers: number;
    wrong_answers: number;
  }> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress/stats/${studyPlanId}`);
    if (!response.ok) throw new Error('Failed to fetch quiz statistics');
    return response.json();
  },
};

// Schedule API
export const scheduleApi = {
  getProgress: async (studyPlanId: string): Promise<ScheduleProgress[]> => {
    const response = await fetch(`${API_BASE_URL}/schedule/progress/${studyPlanId}`);
    if (!response.ok) throw new Error('Failed to fetch schedule progress');
    return response.json();
  },

  saveProgress: async (data: {
    studyPlanId: string;
    blockId: string;
    isCompleted: boolean;
  }): Promise<ScheduleProgress> => {
    const response = await fetch(`${API_BASE_URL}/schedule/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to save schedule progress');
    return response.json();
  },

  updateProgress: async (id: string, data: {
    isCompleted: boolean;
  }): Promise<ScheduleProgress> => {
    const response = await fetch(`${API_BASE_URL}/schedule/progress/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update schedule progress');
    return response.json();
  },

  deleteProgress: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/schedule/progress/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete schedule progress');
  },

  generate: async (data: {
  courseId: string;
  examDate: string;
  studyDays: { day: string; hours: number }[];
  studySections: any[];
}): Promise<{ scheduleWeeks: any[] }> => {
  const response = await fetch(`${API_BASE_URL}/schedule/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to generate schedule');
  return response.json();
},

  getStats: async (studyPlanId: string): Promise<{
    total_blocks: number;
    completed_blocks: number;
  }> => {
    const response = await fetch(`${API_BASE_URL}/schedule/stats/${studyPlanId}`);
    if (!response.ok) throw new Error('Failed to fetch schedule statistics');
    return response.json();
  },
};
