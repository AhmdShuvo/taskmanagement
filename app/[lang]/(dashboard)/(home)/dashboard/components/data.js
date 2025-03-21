// Task management dashboard mock data

export const taskSummary = {
  totalTasks: 36,
  completedTasks: 12,
  inProgressTasks: 18,
  openTasks: 4,
  blockedTasks: 2,
  tasksByPriority: [
    { name: 'High', value: 9, color: '#EF4444' },
    { name: 'Medium', value: 18, color: '#F59E0B' },
    { name: 'Low', value: 9, color: '#10B981' }
  ],
  recentTasks: [
    { id: '1', title: 'Implement user authentication', status: 'completed', dueDate: '2023-07-01', priority: 'high' },
    { id: '2', title: 'Design dashboard layout', status: 'in progress', dueDate: '2023-07-05', priority: 'medium' },
    { id: '3', title: 'API integration for task management', status: 'in progress', dueDate: '2023-07-10', priority: 'high' },
    { id: '4', title: 'Bug fixing in task table', status: 'open', dueDate: '2023-07-12', priority: 'medium' },
    { id: '5', title: 'Deploy application to production', status: 'blocked', dueDate: '2023-07-15', priority: 'high' }
  ],
  taskCompletionTrend: [
    { name: 'Mon', completed: 3, created: 5 },
    { name: 'Tue', completed: 4, created: 3 },
    { name: 'Wed', completed: 2, created: 6 },
    { name: 'Thu', completed: 5, created: 2 },
    { name: 'Fri', completed: 3, created: 4 },
    { name: 'Sat', completed: 1, created: 1 },
    { name: 'Sun', completed: 0, created: 2 }
  ],
  tasksByAssignee: [
    { name: 'John Doe', count: 8, completedCount: 3 },
    { name: 'Jane Smith', count: 12, completedCount: 5 },
    { name: 'Alex Brown', count: 7, completedCount: 2 },
    { name: 'Sarah Wilson', count: 9, completedCount: 4 }
  ]
};

export const taskCategories = [
  { id: 1, name: 'Frontend', count: 14, color: '#3B82F6' },
  { id: 2, name: 'Backend', count: 10, color: '#10B981' },
  { id: 3, name: 'Design', count: 7, color: '#F59E0B' },
  { id: 4, name: 'Testing', count: 5, color: '#8B5CF6' }
];

export const taskStatusDistribution = [
  { name: 'Open', value: 4, color: '#F59E0B' },
  { name: 'In Progress', value: 18, color: '#3B82F6' },
  { name: 'Completed', value: 12, color: '#10B981' },
  { name: 'Blocked', value: 2, color: '#EF4444' }
];

export const monthlyTasksData = [
  { month: 'Jan', created: 22, completed: 18 },
  { month: 'Feb', created: 28, completed: 24 },
  { month: 'Mar', created: 35, completed: 29 },
  { month: 'Apr', created: 40, completed: 38 },
  { month: 'May', created: 32, completed: 30 },
  { month: 'Jun', created: 38, completed: 35 },
  { month: 'Jul', created: 42, completed: 36 }
];

export const upcomingDeadlines = [
  { id: 1, title: 'User Authentication Flow', dueDate: '2023-07-15', assignee: 'John Doe', status: 'in progress' },
  { id: 2, title: 'Dashboard Redesign', dueDate: '2023-07-18', assignee: 'Sarah Wilson', status: 'open' },
  { id: 3, title: 'API Documentation', dueDate: '2023-07-20', assignee: 'Alex Brown', status: 'in progress' },
  { id: 4, title: 'Performance Optimization', dueDate: '2023-07-22', assignee: 'Jane Smith', status: 'open' }
];

// Legacy data for backward compatibility
export const data = [
  {
    id: "01",
    page: "www.facebook.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "9,636",
    link: "/"
  },
  {
    id: "02",
    page: "www.linkedin.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "7,636",
    link: "/"
  },
  {
    id: "03",
    page: "www.twitter.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "04",
    page: "www.twitter.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "05",
    page: "www.pinterest.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "06",
    page: "www.twitter.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "07",
    page: "www.youtube.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "08",
    page: "www.linkedin.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "09",
    page: "www.twitter.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "10",
    page: "www.github.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "11",
    page: "www.github.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "12",
    page: "www.github.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "13",
    page: "www.github.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "14",
    page: "www.github.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "15",
    page: "www.github.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "16",
    page: "www.github.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "17",
    page: "www.github.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "18",
    page: "www.github.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "19",
    page: "www.github.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "20",
    page: "www.github.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },
  {
    id: "21",
    page: "www.github.com",
    post: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    count: "5,636",
    link: "/"
  },

];

