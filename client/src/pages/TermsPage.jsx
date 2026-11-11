import { Scale } from 'lucide-react';
import PageShell from '../components/PageShell.jsx';
import LegalDocument from '../components/LegalDocument.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { LEGAL_UPDATED, SITE_NAME, SUPPORT_EMAIL } from '../lib/site.js';

const SECTIONS = [
    {
        id: 'acceptance',
        title: '1. Acceptance of these terms',
        body: [
            `These terms explain the rules for using ${SITE_NAME}. By creating an account, signing in or playing a game, you agree to these terms and to our Privacy Policy. If you do not agree, please do not use the service.`,
        ],
    },
    {
        id: 'service',
        title: '2. About the service',
        body: [
            `${SITE_NAME} is a free browser-based calculation game. Puzzle images are provided by the Banana API. You do not need to download or install anything to play.`,
            'We may add, change or remove features at any time. We may also run maintenance that temporarily limits access to the service.',
        ],
    },
    {
        id: 'accounts',
        title: '3. Accounts and eligibility',
        body: [
            'You need an account to start a game, save scores, build streaks and unlock achievements. You must be at least 13 years old, or the minimum age of digital consent in your country, to create an account.',
        ],
        bullets: [
            'Provide accurate information and keep it up to date.',
            'Keep your password and sign-in details private.',
            'You are responsible for activity that happens through your account.',
            'Do not create multiple accounts to manipulate scores or the leaderboard.',
        ],
    },
    {
        id: 'verification',
        title: '4. Email verification and sign-in',
        body: [
            'Email registrations receive a 6-digit code. Entering the code confirms that you own the address and activates the account. Google and Facebook sign-ins are verified by the provider.',
            'When you sign in with a third-party provider, you authorise us to receive basic profile information such as your name, email address and avatar.',
        ],
    },
    {
        id: 'acceptable-use',
        title: '5. Acceptable use',
        body: ['Use the service in a way that keeps the game fair and safe for everyone.'],
        bullets: [
            'Do not use bots, scripts or automation to play or submit answers.',
            'Do not scrape, reverse engineer or attempt to bypass security features.',
            'Do not impersonate another player or misrepresent your identity.',
            'Do not upload unlawful, abusive, hateful or infringing content.',
            'Do not interfere with the service, its servers or other players.',
        ],
    },
    {
        id: 'fair-play',
        title: '6. Game rules and fair play',
        body: [
            'Scores must come from genuine play. We may remove scores, reset progress or suspend accounts that use automation, exploits, multiple accounts or other unfair methods.',
            'We may adjust scoring rules, timers or mode settings to keep the game balanced. Changes apply to future games unless we say otherwise.',
        ],
    },
    {
        id: 'scoring',
        title: '7. Scoring, leaderboards and achievements',
        body: [
            'Correct answers earn base points plus speed and streak bonuses. Wrong, skipped and timed-out quizzes earn zero points. Achievements unlock automatically from your recorded stats.',
            'Standard Easy and Standard Hard games are eligible for the global leaderboard. Custom games are practice sessions and are not ranked because their quiz count and timer are chosen by the player.',
            'Leaderboard ties are broken by games won, then by best streak. Players can hide their profile from the public board in their settings; hidden players keep their points and achievements but are excluded from public rankings.',
            'Rankings and achievements are for entertainment. They are not prizes, securities or guarantees unless we expressly state otherwise.',
        ],
    },
    {
        id: 'profile-content',
        title: '8. Your profile and content',
        body: [
            'You keep ownership of the profile details you add, such as your display name, bio and avatar. If you choose to appear on the leaderboard, you give us permission to display those details to other players.',
            'You are responsible for the content you add. Do not upload content that you do not have the right to use, or that is unlawful, misleading or harmful.',
        ],
    },
    {
        id: 'intellectual-property',
        title: '9. Intellectual property',
        body: [
            `The ${SITE_NAME} name, design, code and branding are owned by the operator or its licensors. Puzzle images are supplied by the Banana API. You receive a limited, non-exclusive, non-transferable licence to use the service for personal, non-commercial play.`,
            'You may not copy, resell, redistribute or create derivative products from the service without permission, except where the law allows it.',
        ],
    },
    {
        id: 'availability',
        title: '10. Availability and changes',
        body: [
            'We aim to keep the game available, but we do not guarantee uninterrupted access. The service may be unavailable because of maintenance, technical problems, network issues or events outside our control.',
            'We may change, suspend or discontinue any part of the service. Where practical, we will give notice of significant changes.',
        ],
    },
    {
        id: 'disclaimers',
        title: '11. Disclaimers',
        body: [
            'The service is provided “as is” and “as available”. To the extent permitted by law, we make no warranties about availability, accuracy, fitness for a particular purpose or non-infringement.',
            'Nothing in these terms limits rights that cannot be limited by law, including your statutory consumer rights.',
        ],
    },
    {
        id: 'liability',
        title: '12. Limitation of liability',
        body: [
            'To the extent permitted by law, we are not liable for indirect, incidental, special or consequential losses, or for loss of data, profits or goodwill arising from your use of the service.',
            'Where liability cannot be excluded, our total liability for claims relating to the service is limited to the amount you paid us in the twelve months before the claim. Banana Quiz is currently free to play.',
        ],
    },
    {
        id: 'termination',
        title: '13. Suspension and termination',
        body: [
            'You can stop using the service at any time. Profile → Privacy & data lets you deactivate your account or request deletion.',
            'We may suspend or terminate access if you breach these terms, if required by law, or to protect the service and other players. Where reasonable, we will explain the reason.',
            'When an account is deactivated, we handle the associated data as described in the Privacy Policy.',
        ],
    },
    {
        id: 'changes',
        title: '14. Changes to these terms',
        body: [
            'We may update these terms as the game evolves. The “last updated” date at the top of this page shows when the current version took effect.',
            'If we make material changes, we will provide reasonable notice. Continuing to use the service after the changes take effect means you accept the updated terms.',
        ],
    },
    {
        id: 'contact',
        title: '15. Contact',
        body: [
            `If you have questions about these terms, visit the Help Centre or email ${SUPPORT_EMAIL}.`,
        ],
    },
];

export default function TermsPage() {
    usePageTitle('Terms of Service');

    return (
        <PageShell
            icon={Scale}
            eyebrow="Legal"
            title="Terms of Service"
            subtitle="The rules that keep Banana Quiz fair, safe and fun for everyone."
            meta={`Last updated ${LEGAL_UPDATED}`}
        >
            <LegalDocument
                intro="These terms explain the rules for using Banana Quiz. By creating an account or playing a game, you agree to them. If you do not agree, please do not use the service."
                sections={SECTIONS}
            />
        </PageShell>
    );
}
