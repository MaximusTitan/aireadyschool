export const COMMON_SUBJECTS = {
  'Primary': [
    'English',
    'Mathematics',
    'Science',
    'Social Studies',
    'EVS',
    'Physical Education',
    'Art',
    'Music',
  ],
  'Secondary': [
    'English',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'History',
    'Geography',
    'Computer',
    'Physical Education',
  ],
  'Languages': [
    'Hindi',
    'French',
    'Sanskrit',
    'Spanish',
    'German',
    'Chinese',
  ]
};

export const GRADE_PATTERNS = {
  'Primary (1-5)': Array.from({ length: 5 }, (_, i) => ({
    name: `Grade ${i + 1}`,
    sections: ['A', 'B', 'C'].map(section => ({ name: section }))
  })),
  'Middle (6-8)': Array.from({ length: 3 }, (_, i) => ({
    name: `Grade ${i + 6}`,
    sections: ['A', 'B', 'C'].map(section => ({ name: section }))
  })),
  'Secondary (9-12)': Array.from({ length: 4 }, (_, i) => ({
    name: `Grade ${i + 9}`,
    sections: ['A', 'B'].map(section => ({ name: section }))
  }))
};

export const COMMON_BOARDS = [
  'CBSE',
  'ICSE',
  'State Board',
  'IB',
  'Cambridge (IGCSE)',
  'CAIE'
];
