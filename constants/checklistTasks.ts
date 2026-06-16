export type ChecklistTask = {
  apiName: string;
  dashboardIcon: number;
  description: string;
  duration: string;
  icon: number;
  iconBackground: string;
  iconColor: string;
  id: string;
  title: string;
};

export const checklistTasks: ChecklistTask[] = [
  {
    apiName: 'Morning Sunlight',
    dashboardIcon: require('@/assets/icons/dashbord-morning-icon.svg'),
    description: 'Morning light helps regulate cortisol rhythm and support better sleep later',
    duration: '10 min',
    icon: require('@/assets/images/sun.svg'),
    iconBackground: '#FFC1031A',
    iconColor: '#FFC43D',
    id: 'morning-sunlight',
    title: 'Morning Sunlight',
  },
  {
    apiName: 'Breathwork',
    dashboardIcon: require('@/assets/icons/dashbord-breathing-icon.svg'),
    description: 'Boost mood and regulate your body check',
    duration: '20 min',
    icon: require('@/assets/images/lines.svg'),
    iconBackground: '#3770FC14',
    iconColor: '#3770FC',
    id: 'breathwork',
    title: 'Breath work',
  },
  {
    apiName: 'Movement',
    dashboardIcon: require('@/assets/icons/dashbord-speed-icon.svg'),
    description: 'Boost mood and regulate your body check',
    duration: '5 min',
    icon: require('@/assets/images/hugeicons_running-shoes.svg'),
    iconBackground: '#28B92A14',
    iconColor: '#2EB668',
    id: 'movement',
    title: 'Movements',
  },
  {
    apiName: 'Hydration',
    dashboardIcon: require('@/assets/images/hydration-checklist-icon.svg'),
    description: 'Boost mood and regulate your body check',
    duration: '2 glasses',
    icon: require('@/assets/images/hydration-checklist-icon.svg'),
    iconBackground: '#3770FC14',
    iconColor: '#3770FC',
    id: 'hydration',
    title: 'Hydration',
  },
  {
    apiName: 'Deep Work',
    dashboardIcon: require('@/assets/images/deep-work-checklist-icon.svg'),
    description: 'Boost mood and regulate your body check',
    duration: '3 tasks',
    icon: require('@/assets/images/deep-work-checklist-icon.svg'),
    iconBackground: '#7B61FF14',
    iconColor: '#7B61FF',
    id: 'deep-work',
    title: 'Deep work',
  },
  {
    apiName: 'Wind-down',
    dashboardIcon: require('@/assets/images/wind-down-checklist-icon.svg'),
    description: 'Boost mood and regulate your body check',
    duration: '20 min',
    icon: require('@/assets/images/wind-down-checklist-icon.svg'),
    iconBackground: '#7B61FF14',
    iconColor: '#7B61FF',
    id: 'wind-down',
    title: 'Wind-down',
  },
];

export const dashboardChecklistTasks = [
  checklistTasks[0],
  checklistTasks[2],
  checklistTasks[1],
];

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, ' ');
}

function getRecordString(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return '';
}

function getRecordBoolean(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'boolean') {
      return value;
    }
  }

  return false;
}

function resolveChecklistApiName(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = normalizeName(value);
  const task = checklistTasks.find(
    (item) =>
      normalizeName(item.apiName) === normalizedValue ||
      normalizeName(item.title) === normalizedValue ||
      normalizeName(item.id) === normalizedValue
  );

  return task?.apiName ?? null;
}

function getChecklistTaskArray(source: Record<string, unknown>) {
  const tasks = source.tasks ?? source.checklist_tasks ?? source.items;
  return Array.isArray(tasks) ? tasks : [];
}

function unwrapChecklist(source: unknown) {
  if (!source || typeof source !== 'object') {
    return null;
  }

  const record = source as Record<string, unknown>;
  const data = record.data && typeof record.data === 'object' ? (record.data as Record<string, unknown>) : null;
  const checklist = record.checklist ?? data?.checklist;

  return checklist && typeof checklist === 'object'
    ? (checklist as Record<string, unknown>)
    : record;
}

export function getChecklistStatusMap(checklistSource: unknown) {
  const statusMap = checklistTasks.reduce<Record<string, boolean>>((accumulator, task) => {
    accumulator[task.apiName] = false;
    return accumulator;
  }, {});
  const checklist = unwrapChecklist(checklistSource);

  if (!checklist) {
    return statusMap;
  }

  getChecklistTaskArray(checklist).forEach((task) => {
    if (!task || typeof task !== 'object') {
      return;
    }

    const record = task as Record<string, unknown>;
    const apiName = resolveChecklistApiName(
      getRecordString(record, ['apiName', 'api_name', 'taskName', 'task_name', 'name', 'title', 'task'])
    );

    if (apiName) {
      statusMap[apiName] = getRecordBoolean(record, ['completed', 'is_completed', 'checked', 'done']);
    }
  });

  checklistTasks.forEach((task) => {
    const value = checklist[task.apiName] ?? checklist[task.id];

    if (typeof value === 'boolean') {
      statusMap[task.apiName] = value;
    }
  });

  return statusMap;
}

export function getCompletedTaskNamesFromChecklist(checklistSource: unknown) {
  const statusMap = getChecklistStatusMap(checklistSource);
  return checklistTasks.filter((task) => statusMap[task.apiName]).map((task) => task.apiName);
}
