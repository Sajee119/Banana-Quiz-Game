import { ShieldCheck } from 'lucide-react';
import PageShell from '../components/PageShell.jsx';
import LegalDocument from '../components/LegalDocument.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { LEGAL_UPDATED, SITE_NAME, SUPPORT_EMAIL } from '../lib/site.js';

const SECTIONS = [
    {
        id: 'overview',
        title: '1. Overview',
        body: [
            `${SITE_NAME} is a free browser game. This policy explains what information we collect, why we collect it, how we protect it and the choices you have.`,
            'We try to collect only what the game needs to work. You can play with an account, hide your profile from the public leaderboard, export your data and deactivate your account.',
        ],
    },
    {
        id: 'collect',
        title: '2. Information we collect',
        body: ['We collect the following categories of information:'],
        bullets: [
            'Account details: display name, email address, avatar, bio, favourite mode and connected sign-in providers.',
            'Authentication data: a securely hashed password for email accounts, and provider identifiers for Google or Facebook sign-ins.',
            'Gameplay data: game sessions, quiz results, answers, response times, points, streaks, achievements and game history.',
            'Preferences: leaderboard visibility, notification choices, default mode, gameplay controls and reduced-motion settings.',
            'Technical data: session cookies, login history (such as timestamps, IP address and browser information) and server logs used for security and troubleshooting.',
        ],
    },
    {
        id: 'use',
        title: '3. How we use your information',
        body: ['We use your information to:'],
        bullets: [
            'Create and secure your account, verify your email and keep you signed in.',
            'Run games, save progress, calculate scores and unlock achievements.',
            'Show public leaderboards when you choose to share your profile.',
            'Send essential account emails, such as verification and password-reset messages.',
            'Send optional notifications you have opted into.',
            'Detect abuse, prevent cheating and protect the service.',
            'Respond to support requests and improve the game.',
            'Comply with legal obligations and enforce our Terms of Service.',
        ],
    },
    {
        id: 'cookies',
        title: '4. Cookies and browser storage',
        body: [
            'We use an essential session cookie named “sid” to keep you signed in. Without it, protected pages such as your dashboard cannot work. The cookie is HTTP-only and is cleared when your session ends.',
            'We also use browser storage for small preferences and the active game:',
        ],
        bullets: [
            '“bq-audio-settings” in local storage remembers your sound and music choices.',
            '“banana-cookie-choice” in local storage remembers your cookie banner choice.',
            '“banana-game-config” and “banana-game-id” in session storage keep an active game running until you finish or quit.',
        ],
    },
    {
        id: 'cookies-choice',
        title: '5. Your cookie choices',
        body: [
            'The cookie banner lets you allow or decline optional preferences. Essential cookies are always required while you are signed in because they keep your session secure.',
            'We do not use advertising cookies or sell cookie data. You can clear browser storage at any time, although doing so may sign you out or reset your audio and cookie preferences.',
        ],
    },
    {
        id: 'third-parties',
        title: '6. Third-party services',
        body: [
            'Some parts of the game rely on trusted third parties. They process information under their own privacy policies:',
        ],
        bullets: [
            'Banana API supplies the puzzle images used in each quiz.',
            'Google and Facebook provide optional sign-in through OAuth.',
            'An email delivery provider sends verification, password-reset and notification emails.',
            'Hosting and database providers store the application and its data.',
        ],
    },
    {
        id: 'retention',
        title: '7. How long we keep data',
        body: [
            'We keep account and gameplay data while your account is active so your stats, history and achievements remain available.',
            'If you deactivate your account or request deletion, we remove or anonymise the associated data within a reasonable period, unless we need to keep it for security, fraud prevention or legal obligations. Backup copies may take a little longer to expire.',
        ],
    },
    {
        id: 'security',
        title: '8. How we protect your data',
        body: [
            'Passwords are hashed with bcrypt and are never stored in plain text. Sessions use HTTP-only cookies, and production traffic is served over HTTPS. We also use access controls, rate limiting and login history to help detect suspicious activity.',
            'No online service can be completely secure. Please use a strong, unique password and keep your sign-in details private.',
        ],
    },
    {
        id: 'rights',
        title: '9. Your rights and choices',
        body: [
            'Depending on where you live, you may have the right to access, correct, export, delete, restrict or object to the processing of your personal information. You may also withdraw consent where processing is based on consent.',
            'You can update your profile, change your password, control leaderboard visibility and manage notifications from your account settings. To make another request, contact us using the details below.',
        ],
    },
    {
        id: 'export-delete',
        title: '10. Exporting and deleting your data',
        body: [
            'Profile → Privacy & data lets you download a copy of your account, stats, security overview and login history. The same section lets you deactivate your account.',
            'Deactivation signs you out and removes your profile from the public board. If you would like your data permanently deleted, contact support and we will guide you through the process.',
        ],
    },
    {
        id: 'children',
        title: '11. Children’s privacy',
        body: [
            `${SITE_NAME} is not intended for children under 13, or under the minimum age of digital consent in their country. We do not knowingly collect personal information from children below that age. If you believe a child has created an account, contact us and we will remove it.`,
        ],
    },
    {
        id: 'transfers',
        title: '12. International transfers',
        body: [
            'Our service providers may process data in countries other than yours. Where required, we rely on appropriate safeguards for those transfers. The protections in this policy apply regardless of where data is processed.',
        ],
    },
    {
        id: 'changes',
        title: '13. Changes to this policy',
        body: [
            'We may update this policy as the game or the law changes. The “last updated” date at the top of this page shows the current version. If changes are material, we will provide reasonable notice.',
        ],
    },
    {
        id: 'contact',
        title: '14. Contact us',
        body: [
            `If you have questions about this policy or want to exercise your rights, visit the Help Centre or email ${SUPPORT_EMAIL}.`,
        ],
    },
];

export default function PrivacyPage() {
    usePageTitle('Privacy Policy');

    return (
        <PageShell
            icon={ShieldCheck}
            eyebrow="Legal"
            title="Privacy Policy"
            subtitle="What we collect, why we collect it and the control you have over your data."
            meta={`Last updated ${LEGAL_UPDATED}`}
        >
            <LegalDocument
                intro="This policy explains how Banana Quiz handles your information. We keep it in plain language and only collect what the game needs."
                sections={SECTIONS}
            />
        </PageShell>
    );
}
