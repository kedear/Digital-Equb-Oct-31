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
                <section className="text-center py-20 px-6">
                    <h1 className="text-4xl md:text-5xl font-bold text-brand-primary mb-4">
                        Modernizing Tradition: Your Digital Equb
                    </h1>
                    <p className="text-lg md:text-xl text-light-text-secondary dark:text-dark-text-secondary max-w-3xl mx-auto mb-8">
                        Experience the trusted Ethiopian tradition of community savings, reimagined for the digital age. Secure, transparent, and convenient, powered by ZamZam Bank.
                    </p>
                    <button
                        onClick={onAuthNavigate}
                        className="bg-brand-primary text-white font-bold py-3 px-8 rounded-lg text-lg hover:opacity-90 transition-opacity transform hover:scale-105"
                    >
                        Get Started
                    </button>
                </section>

                {/* Features Section */}
                <section className="py-20 bg-light-card dark:bg-brand-card px-6">
                    <div className="container mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Digital Equb?</h2>
                        <div className="grid md:grid-cols-3 gap-10">
                            <FeatureCard
                                icon={<UsersIcon className="w-10 h-10 text-brand-primary" />}
                                title="Community Focused"
                                description="Join or create groups with friends, family, and colleagues. Achieve your financial goals together with the power of community."
                            />
                            <FeatureCard
                                icon={<WalletIcon className="w-10 h-10 text-brand-primary" />}
                                title="Secure & Transparent"
                                description="With the backing of ZamZam Bank, your contributions are secure. Track all payments and winnings in real-time."
                            />
                            <FeatureCard
                                icon={<SparklesIcon className="w-10 h-10 text-brand-primary" />}
                                title="Modern Convenience"
                                description="Manage your savings from anywhere. Receive timely notifications and access your history with our easy-to-use mobile-friendly interface."
                            />
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-8 border-t border-light-border dark:border-brand-border px-6">
                <div className="container mx-auto text-center text-light-text-secondary dark:text-dark-text-secondary">
                    <p className="text-xl font-semibold text-brand-primary mb-2">ZamZam Bank</p>
                    <p>&copy; {new Date().getFullYear()} ZamZam Bank Digital Equb. All rights reserved.</p>
                    <p className="text-sm mt-2">A new way to save, rooted in tradition.</p>
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
    <div className="text-center p-6 bg-light-bg dark:bg-brand-dark rounded-lg border border-light-border dark:border-brand-border">
        <div className="flex justify-center mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">{description}</p>
    </div>
);