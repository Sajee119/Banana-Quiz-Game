import { SUPPORT_EMAIL } from './site.js';

/**
 * Public profile details taken from github.com/Sajee119.
 * Update this file when the GitHub profile or featured projects change.
 */
export const DEVELOPER = {
    name: 'Sajeepan',
    handle: 'Sajee119',
    role: 'Full-stack developer',
    company: 'Future designers',
    location: 'Sri Lanka',
    bio: 'Aspiring Software Engineer focused on full-stack development, problem-solving, and continuous learning.',
    email: SUPPORT_EMAIL,
    github: 'https://github.com/Sajee119',
    portfolio: 'https://sajeepan-portfolio.vercel.app/',
    twitter: 'https://x.com/SSajeepan3492',
    avatar: 'https://avatars.githubusercontent.com/u/170867193?v=4',
    joined: 'May 2024',
    repositories: 32,
};

export const GITHUB_STATS = [
    { value: String(DEVELOPER.repositories), label: 'Public repositories', tone: 'banana' },
    { value: '6', label: 'Featured live demos', tone: 'sky' },
    { value: '5', label: 'Languages used', tone: 'violet' },
    { value: '2024', label: 'On GitHub since', tone: 'emerald' },
];

export const PROJECTS = [
    {
        name: 'Banana Quiz Game',
        description:
            'This project: a full-stack banana-value quiz with timed rounds, streaks, achievements, email flows and a global leaderboard.',
        language: 'JavaScript',
        repo: 'https://github.com/Sajee119/Banana-Quiz-Game',
        live: 'https://banana-quiz-game.vercel.app',
        tags: ['React', 'Express', 'MongoDB', 'SMTP'],
    },
    {
        name: 'CHAOSVERSE',
        description:
            'An interactive React entertainment site filled with pranks, comedy, games, memes, surprises and hidden rooms.',
        language: 'JavaScript',
        repo: 'https://github.com/Sajee119/CHAOSVERSE',
        live: 'https://chaosverse-sajee.vercel.app',
        tags: ['React', 'Vite', 'Framer Motion'],
    },
    {
        name: 'SyntecXHub My Store',
        description:
            'A MERN e-commerce platform with an admin dashboard, JWT auth, Stripe and PayPal integration, product management and order tracking.',
        language: 'JavaScript',
        repo: 'https://github.com/Sajee119/syentecxhub_my_store',
        live: 'https://syentecxhub-my-store.vercel.app',
        tags: ['MERN', 'JWT', 'Stripe'],
    },
    {
        name: 'Employee Management System',
        description:
            'A full-stack MERN app for employee records with real-time notifications, two-factor authentication, attendance, salary management and document handling.',
        language: 'JavaScript',
        repo: 'https://github.com/Sajee119/Syntexhub_Employee_Management_System',
        live: 'https://syntexhub-employee-management-syste.vercel.app',
        tags: ['MERN', '2FA', 'Dashboard'],
    },
    {
        name: 'User Management System',
        description:
            'Secure authentication, role-based access control and CRUD operations with profile management, an admin dashboard and RESTful APIs.',
        language: 'JavaScript',
        repo: 'https://github.com/Sajee119/Syntecxhub_User_Management_System',
        live: 'https://syntecxhub-user-management-system-eight.vercel.app',
        tags: ['Auth', 'RBAC', 'REST API'],
    },
    {
        name: 'Expense Tracker',
        description:
            'A simple expense tracker for recording income and expenses, categorising transactions and reviewing spending summaries.',
        language: 'JavaScript',
        repo: 'https://github.com/Sajee119/syntecxhub-expense-tracker-app',
        live: 'https://syntecxhub-expense-tracker-app.vercel.app',
        tags: ['React', 'Finance', 'Dashboard'],
    },
];
