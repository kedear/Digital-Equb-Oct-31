
import React from 'react';
import { WalletIcon, UsersIcon, SparklesIcon } from './Icons';
import { ThemeSwitcher } from './ThemeSwitcher';

interface LandingPageProps {
    onAuthNavigate: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onAuthNavigate }) => {
    return (
        <div className="bg-light-bg dark:bg-brand-dark text-light-text-primary dark:text-dark-text-primary">
            {/* Header */}
            <header className="py-4 px-6 md:px-12 lg:px-24 border-b border-light-border dark:border-brand-border">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-brand-primary">ZamZam Bank</h1>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={onAuthNavigate}
                            className="bg-brand-primary text-white font-semibold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Login
                        </button>
                        <ThemeSwitcher />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main>
                {/* Hero Section */}
                <section className="relative text-center py-24 md:py-32 px-6 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/10 to-brand-primary/5 dark:from-brand-dark/20 dark:to-brand-primary/10"></div>
                    <div className="relative z-10 container mx-auto">
                        <h1 className="text-5xl md:text-6xl font-extrabold text-brand-primary mb-6 leading-tight">
                            Modernizing Tradition: <br className="hidden md:inline"/> Your Digital Equb
                        </h1>
                        <p className="text-lg md:text-xl text-light-text-secondary dark:text-dark-text-secondary max-w-4xl mx-auto mb-10 leading-relaxed">
                            Experience the trusted Ethiopian tradition of community savings, reimagined for the digital age. Secure, transparent, and convenient, powered by ZamZam Bank.
                        </p>
                        <button
                            onClick={onAuthNavigate}
                            className="bg-brand-primary text-white font-bold py-4 px-10 rounded-xl text-xl hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            Get Started Today
                        </button>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 bg-light-card dark:bg-brand-card px-6">
                    <div className="container mx-auto">
                        <h2 className="text-4xl font-bold text-center mb-16 text-light-text-primary dark:text-dark-text-primary">Why Choose Digital Equb?</h2>
                        <div className="grid md:grid-cols-3 gap-12">
                            <FeatureCard
                                icon={<UsersIcon className="w-12 h-12 text-brand-primary" />}
                                title="Community Focused Savings"
                                description="Join or create groups with friends, family, and colleagues. Achieve your financial goals together with the power of community, fostering collective growth."
                            />
                            <FeatureCard
                                icon={<WalletIcon className="w-12 h-12 text-brand-primary" />}
                                title="Secure & Transparent Platform"
                                description="With the robust backing of ZamZam Bank, your contributions are secure. Track all payments, view group progress, and monitor winnings in real-time with full transparency."
                            />
                            <FeatureCard
                                icon={<SparklesIcon className="w-12 h-12 text-brand-primary" />}
                                title="Modern Convenience & Access"
                                description="Manage your savings from anywhere, anytime. Receive timely notifications, access detailed history, and interact with our intuitive, mobile-friendly interface designed for your ease."
                            />
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-light-border dark:border-brand-border px-6">
                <div className="container mx-auto text-center text-light-text-secondary dark:text-dark-text-secondary">
                    <p className="text-2xl font-semibold text-brand-primary mb-3">ZamZam Bank</p>
                    <p className="text-md">&copy; {new Date().getFullYear()} ZamZam Bank Digital Equb. All rights reserved.</p>
                    <p className="text-sm mt-3">A new way to save, rooted in tradition and powered by innovation.</p>
                </div>
            </footer>
        </div>
    );
};

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
    <div className="text-center p-8 bg-light-bg dark:bg-brand-dark rounded-xl border border-light-border dark:border-brand-border shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex justify-center mb-6">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 text-light-text-primary dark:text-dark-text-primary">{title}</h3>
        <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">{description}</p>
    </div>
);
