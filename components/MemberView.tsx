import React, { useState, useContext, useMemo, useEffect } from 'react';
import { HomeIcon, EqubIcon, ProfileIcon, NotificationIcon, WalletIcon, LogoutIcon, ChevronDownIcon, XIcon, SearchIcon, CheckCircleIcon, BellOffIcon } from './Icons';
import { DataContext } from './DataProvider';
import { ThemeContext } from '../App';
import { Equb, EqubStatus, UserProfile, Contribution, EqubType, Notification, Winner } from '../types';
import { ThemeSwitcher } from './ThemeSwitcher';
import { NotificationPanel } from './NotificationPanel';
import { supabase } from '../services/supabase';

const EmailConfirmationBanner: React.FC = () => {
    const { currentUser } = useContext(DataContext);
    const [loading, setLoading] = useState(false);
    const [resent, setResent] = useState(false);

    const handleResend = async () => {
        if (!currentUser?.email) return;
        setLoading(true);
        setResent(false);
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: currentUser.email,
        });
        setLoading(false);
        if (!error) {
            setResent(true);
        } else {
            console.error("Error resending confirmation email:", error);
            alert("Failed to resend confirmation email. Please try again later.");
        }
    };

    return (
        <div className="bg-yellow-100 dark:bg-yellow-900/50 border-b-2 border-yellow-400 dark:border-yellow-600 p-4 text-center">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold mb-2">Please confirm your email address.</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                We've sent a confirmation link to <strong>{currentUser?.email}</strong>. Check your inbox (and spam folder!) to activate your account.
            </p>
            {resent ? (
                <p className="text-xs text-green-700 dark:text-green-300 font-bold">A new confirmation email has been sent!</p>
            ) : (
                <button 
                    onClick={handleResend} 
                    disabled={loading}
                    className="text-xs font-bold text-yellow-800 dark:text-yellow-100 hover:underline disabled:opacity-50"
                >
                    {loading ? 'Sending...' : 'Resend confirmation link'}
                </button>
            )}
        </div>
    );
}

const Toast: React.FC<{ message: string; show: boolean; onDismiss: () => void; type?: 'success' | 'error' }> = ({ message, show, onDismiss, type = 'success' }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => onDismiss(), 3000);
            return () => clearTimeout(timer);
        }
    }, [show, onDismiss]);

    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
    };

    return (
        <div className={`fixed bottom-20 right-5 z-50 transition-all duration-300 transform ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${colors[type]} text-white py-3 px-5 rounded-lg shadow-lg flex items-center space-x-2`}>
            {type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <XIcon className="w-5 h-5" />}
            <span>{message}</span>
        </div>
    );
};

const MemberView: React.FC = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [selectedEqub, setSelectedEqub] = useState<Equb | null>(null);
    const { isEmailConfirmed } = useContext(DataContext);

    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
    };

    const [notificationEqubIds, setNotificationEqubIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const storedIds = localStorage.getItem('equb-notifications');
        if (storedIds) {
            try {
                const parsedIds = JSON.parse(storedIds);
                if (Array.isArray(parsedIds)) {
                    setNotificationEqubIds(new Set(parsedIds));
                }
            } catch (e) {
                console.error("Failed to parse notification preferences from localStorage", e);
            }
        }
    }, []);

    const updateNotificationPreference = (equbId: string, enable: boolean) => {
        setNotificationEqubIds(prev => {
            const newSet = new Set(prev);
            if (enable) {
                newSet.add(equbId);
            } else {
                newSet.delete(equbId);
            }
            localStorage.setItem('equb-notifications', JSON.stringify(Array.from(newSet)));
            return newSet;
        });
    };
    
    const handleToggleNotification = async (equb: Equb) => {
        const isEnabled = notificationEqubIds.has(equb.id);

        if (!("Notification" in window)) {
            showToast("This browser does not support desktop notifications.", 'error');
            return;
        }

        if (Notification.permission === 'denied') {
            showToast("Notification permission is denied. Please enable it in browser settings.", 'error');
            return;
        }

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                showToast("Notification permission was not granted.", 'error');
                return;
            }
        }
        
        // At this point, permission is granted.
        if (isEnabled) {
            updateNotificationPreference(equb.id, false);
            showToast(`Reminders disabled for "${equb.name}".`);
        } else {
            updateNotificationPreference(equb.id, true);
            showToast(`Reminders enabled for "${equb.name}"!`);
            // Show a test notification
            new Notification('Reminders Enabled!', {
                body: `You will now receive reminders for contributions to "${equb.name}". Next due: ${equb.next_due_date || 'TBD'}.`,
                icon: '/vite.svg' 
            });
        }
    };

    const handleTabChange = (tab: string) => {
        setSelectedEqub(null); // Reset detail view when changing tabs
        setActiveTab(tab);
    };

    const renderContent = () => {
        if (selectedEqub) {
            return <EqubDetailPage equb={selectedEqub} onBack={() => handleTabChange(activeTab)} showToast={showToast} />;
        }
        switch (activeTab) {
            case 'home':
                return <MemberHome onEqubSelect={setSelectedEqub}/>;
            case 'my-equbs':
                return <MyEqubsList 
                            onEqubSelect={setSelectedEqub}
                            notificationEqubIds={notificationEqubIds}
                            onToggleNotification={handleToggleNotification}
                        />;
            case 'profile':
                return <Profile />;
            default:
                return <MemberHome onEqubSelect={setSelectedEqub}/>;
        }
    };
    
    return (
        <div className="max-w-md mx-auto h-screen flex flex-col bg-light-card dark:bg-brand-dark shadow-lg">
            <MemberHeader />
            {!isEmailConfirmed && <EmailConfirmationBanner />}
            <main className="flex-1 overflow-y-auto p-4 pb-20 bg-light-bg dark:bg-brand-dark">
                {renderContent()}
            </main>
            <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
            {toast && <Toast message={toast.message} show={!!toast} onDismiss={() => setToast(null)} type={toast.type} />}
        </div>
    );
};

const MemberHeader: React.FC = () => {
    const { currentUser, notifications } = useContext(DataContext);
    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
    
    const unreadCount = useMemo(() => 
        notifications.filter(n => n.user_id === currentUser?.id && !n.read).length,
    [notifications, currentUser]);

    const handleToggleNotifications = async () => {
        setIsNotificationPanelOpen(prev => !prev);
        if (!isNotificationPanelOpen) { // If panel is about to open, mark all as read
            const unreadIds = notifications
              .filter(n => n.user_id === currentUser.id && !n.read)
              .map(n => n.id);
            if(unreadIds.length > 0) {
                 await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
            }
        }
    };

    return (
        <header className="flex items-center justify-between p-4 bg-light-card dark:bg-brand-card border-b border-light-border dark:border-brand-border">
            <div>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Welcome back,</p>
                <h1 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{currentUser?.full_name}</h1>
            </div>
            <div className="flex items-center space-x-4">
                <div className="relative">
                    <button onClick={handleToggleNotifications} aria-label="Toggle notifications" className="relative">
                        <NotificationIcon className="w-7 h-7 text-light-text-secondary dark:text-dark-text-secondary" />
                         {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-brand-danger ring-2 ring-light-card dark:ring-brand-card"></span>
                        )}
                    </button>
                    {isNotificationPanelOpen && (
                        <NotificationPanel 
                            notifications={notifications.filter(n => n.user_id === currentUser?.id)} 
                            onClose={() => setIsNotificationPanelOpen(false)}
                        />
                    )}
                </div>
                <ThemeSwitcher />
            </div>
        </header>
    );
};

interface EqubListProps {
    title: string;
    equbs: Equb[];
    onEqubSelect: (equb: Equb) => void;
    isMyEqubsList?: boolean;
    notificationEqubIds?: Set<string>;
    onToggleNotification?: (equb: Equb) => void;
}

const EqubList: React.FC<EqubListProps> = ({ title, equbs, onEqubSelect, isMyEqubsList = false, notificationEqubIds, onToggleNotification }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const { memberships } = useContext(DataContext); // Get memberships from DataContext

    const filteredEqubs = useMemo(() => {
        return equbs.filter(equb =>
            equb.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (typeFilter === 'All' || equb.equb_type === typeFilter)
        );
    }, [equbs, searchTerm, typeFilter]);

    // Helper to get the actual count of approved members for an equb
    const getApprovedMemberCount = (equbId: string) => {
        return memberships.filter(m => m.equb_id === equbId && m.status === 'approved').length;
    };

    return (
        <div>
            <h2 className="text-lg font-semibold mb-4 text-light-text-primary dark:text-dark-text-primary">{title}</h2>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                 <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-light-card dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2 pl-10"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                </div>
                <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="w-full sm:w-40 bg-light-card dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2"
                >
                    <option value="All">All Types</option>
                    {Object.values(EqubType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div className="space-y-4">
                {filteredEqubs.length > 0 ? filteredEqubs.map(equb => (
                    <EqubCard 
                        key={equb.id} 
                        equb={equb} 
                        onSelect={onEqubSelect} 
                        isMyEqub={isMyEqubsList}
                        notificationEnabled={notificationEqubIds?.has(equb.id)}
                        onToggleNotification={onToggleNotification}
                        approvedMembersCount={getApprovedMemberCount(equb.id)} // Pass the actual approved member count
                    />
                )) : <p className="text-light-text-secondary dark:text-dark-text-secondary text-center mt-8">No Equb groups found.</p>}
            </div>
        </div>
    );
};

const MemberHome: React.FC<{ onEqubSelect: (equb: Equb) => void; }> = ({ onEqubSelect }) => {
    const { currentUser, equbs, memberships } = useContext(DataContext); // Added memberships to DataContext

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    
    // The getApprovedMemberCount definition was moved to EqubList,
    // so it doesn't need to be redefined here for passing to EqubList.
    // EqubList will manage getting it and passing to EqubCard.

    return (
        <div>
            <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-brand-primary to-teal-800 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm">My Wallet Balance</p>
                        <p className="text-3xl font-bold">{formatCurrency(currentUser?.wallet_balance || 0)} <span className="text-lg">ETB</span></p>
                    </div>
                    <WalletIcon className="w-10 h-10 opacity-50"/>
                </div>
            </div>
            {/* Pass approvedMembersCount prop to EqubList, which will then pass it to EqubCard */}
            <EqubList title="Explore Equb Groups" equbs={equbs} onEqubSelect={onEqubSelect} />
        </div>
    );
};

const MyEqubsList: React.FC<{ 
    onEqubSelect: (equb: Equb) => void;
    notificationEqubIds: Set<string>;
    onToggleNotification: (equb: Equb) => void;
}> = ({ onEqubSelect, notificationEqubIds, onToggleNotification }) => {
     const { currentUser, equbs, memberships } = useContext(DataContext);
     const myEqubIds = useMemo(() => 
        memberships
            .filter(m => m.user_id === currentUser?.id && m.status === 'approved')
            .map(m => m.equb_id), 
    [memberships, currentUser]);
     const myEqubs = equbs.filter(e => myEqubIds.includes(e.id));

     return <EqubList 
                title="My Equb Groups" 
                equbs={myEqubs} 
                onEqubSelect={onEqubSelect} 
                isMyEqubsList={true}
                notificationEqubIds={notificationEqubIds}
                onToggleNotification={onToggleNotification}
            />;
};


const Profile: React.FC = () => {
    const { currentUser } = useContext(DataContext);
    const handleLogout = async () => {
        await supabase.auth.signOut();
    };
    return (
        <div className="flex flex-col items-center p-4">
            <div className="w-24 h-24 rounded-full bg-brand-primary flex items-center justify-center text-4xl font-bold text-white mb-4">{currentUser?.full_name.charAt(0)}</div>
            <h2 className="text-2xl font-bold">{currentUser?.full_name}</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">{currentUser?.email}</p>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2">{currentUser?.phone}</p>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">{currentUser?.location}</p>
            <button onClick={handleLogout} className="mt-8 w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-light-border dark:bg-brand-border hover:bg-brand-danger hover:text-white transition-colors">
                <LogoutIcon className="w-5 h-5" />
                <span>Logout</span>
            </button>
        </div>
    );
};

interface EqubCardProps {
    equb: Equb;
    onSelect: (equb: Equb) => void;
    isMyEqub?: boolean;
    notificationEnabled?: boolean;
    onToggleNotification?: (equb: Equb) => void;
    approvedMembersCount: number; // New prop for approved member count
}

const EqubCard: React.FC<EqubCardProps> = ({ equb, onSelect, isMyEqub, notificationEnabled, onToggleNotification, approvedMembersCount }) => {
    const statusColors = {
        [EqubStatus.Open]: 'border-yellow-500',
        [EqubStatus.Active]: 'border-brand-primary',
        [EqubStatus.Completed]: 'border-brand-danger'
    };
    
    return (
        <div onClick={() => onSelect(equb)} className={`bg-light-card dark:bg-brand-card p-4 rounded-lg border-l-4 ${statusColors[equb.status]} cursor-pointer hover:bg-light-border dark:hover:bg-brand-border transition-colors`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg">{equb.name}</h3>
                    <p className="text-xs text-brand-primary font-medium">{equb.equb_type}</p>
                    {/* Display actual approved members / max members */}
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">{approvedMembersCount} / {equb.max_members} members</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-brand-primary text-lg">{equb.contribution_amount} <span className="text-sm font-normal">ETB</span></p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary capitalize">{equb.cycle}</p>
                </div>
            </div>
            <div className="flex justify-between items-center mt-4">
                <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 text-xs font-semibold rounded-full ${ {
                        [EqubStatus.Open]: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
                        [EqubStatus.Active]: 'bg-brand-primary/20 text-brand-primary',
                        [EqubStatus.Completed]: 'bg-brand-danger/20 text-brand-danger'
                    }[equb.status]}`}>{equb.status}</div>
                    {isMyEqub && onToggleNotification && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleNotification(equb); }}
                            className="p-1 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:hover:bg-brand-border"
                            title={notificationEnabled ? 'Disable Reminders' : 'Enable Reminders'}
                        >
                            {notificationEnabled ? <NotificationIcon className="w-5 h-5 text-brand-primary" /> : <BellOffIcon className="w-5 h-5" />}
                        </button>
                    )}
                </div>
                <button className="text-brand-primary text-sm font-semibold">View Details &rarr;</button>
            </div>
        </div>
    );
};

interface EqubDetailPageProps {
    equb: Equb;
    onBack: () => void;
    showToast: (message: string, type?: 'success' | 'error') => void; // Added showToast prop
}

const EqubDetailPage: React.FC<EqubDetailPageProps> = ({ equb, onBack, showToast }) => {
    const { currentUser, memberships, profiles } = useContext(DataContext);
    const [showTerms, setShowTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    
    // Direct lookup of adminUser
    const adminUser = useMemo(() => profiles.find(p => p.role === 'admin'), [profiles]);

    const isMember = useMemo(() => 
        memberships.some(m => m.equb_id === equb.id && m.user_id === currentUser?.id && m.status === 'approved'), 
    [memberships, equb, currentUser]);

    const hasPendingRequest = useMemo(() =>
        memberships.some(m => m.equb_id === equb.id && m.user_id === currentUser?.id && m.status === 'pending'),
    [memberships, equb, currentUser]);

    const handleJoin = async () => {
        if (!currentUser) {
            console.error("Join failed: Current user not found.");
            return;
        }

        setLoading(true);
        try {
            // Use upsert to handle re-joining after being rejected.
            const { error: membershipError } = await supabase.from('memberships').upsert({
                user_id: currentUser.id,
                equb_id: equb.id,
                status: 'pending',
                join_date: new Date().toISOString(),
            });

            if (membershipError) {
                throw membershipError;
            }

            if (adminUser) {
                const { error: notificationError } = await supabase.from('notifications').insert({
                    user_id: adminUser.id,
                    message: `${currentUser.full_name} has requested to join "${equb.name}".`,
                });
                if (notificationError) {
                     // Log this, but don't fail the whole operation
                    console.error("Failed to send notification to admin:", notificationError.message || notificationError);
                }
            } else {
                console.warn("No admin user found to send a join request notification to.");
            }

            setShowTerms(false);
            setShowSuccessMessage(true);
        } catch (error: any) {
            console.error("Error submitting join request:", error.message || JSON.stringify(error));
            alert(`Failed to submit join request: ${error.message || 'An unknown error occurred.'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
             <button onClick={onBack} className="absolute top-0 right-0 p-1 text-light-text-secondary dark:text-dark-text-secondary hover:opacity-75" aria-label="Back to list">
                <XIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-1">{equb.name}</h2>
            <p className="text-sm font-semibold text-brand-primary mb-1">{equb.equb_type}</p>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">Contribution: {equb.contribution_amount} ETB / {equb.cycle}</p>
            
            {isMember ? <MemberEqubInfo equb={equb} showToast={showToast} /> : <PublicEqubInfo equb={equb} />}

            {!isMember && (
                <div className="mt-6">
                    {hasPendingRequest ? (
                        <button className="w-full bg-gray-500 text-white font-bold py-3 rounded-lg cursor-not-allowed" disabled>
                            Request Pending
                        </button>
                    ) : (
                         <button onClick={() => setShowTerms(true)} className="w-full bg-brand-primary text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:bg-gray-500" disabled={equb.status !== EqubStatus.Open || loading}>
                            {equb.status === EqubStatus.Open ? 'Request to Join' : 'Joining Closed'}
                        </button>
                    )}
                </div>
            )}
            
            {showTerms && <TermsModal onAgree={handleJoin} onCancel={() => setShowTerms(false)} loading={loading} />}

            {showSuccessMessage && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" role="alertdialog" aria-modal="true" aria-labelledby="success-title">
                    <div className="bg-light-card dark:bg-brand-card rounded-lg p-6 max-w-sm w-full text-center">
                        <CheckCircleIcon className="w-16 h-16 text-brand-primary mx-auto mb-4" />
                        <h3 id="success-title" className="text-xl font-bold mb-2">Request Sent!</h3>
                        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
                            Your request to join "{equb.name}" has been sent for admin review. You'll be notified upon approval.
                        </p>
                        <button 
                            onClick={() => {
                                setShowSuccessMessage(false);
                                onBack();
                            }}
                            className="px-6 py-2 rounded-lg bg-brand-primary text-white font-bold"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const PublicEqubInfo: React.FC<{equb: Equb}> = ({ equb }) => {
    return (
        <div className="bg-light-card dark:bg-brand-dark p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Equb Details</h3>
            <div className="space-y-2 text-sm">
                <p><span className="text-light-text-secondary dark:text-dark-text-secondary">Max Members:</span> {equb.max_members}</p>
                <p><span className="text-light-text-secondary dark:text-dark-text-secondary">Start Date:</span> {equb.start_date}</p>
                <p><span className="text-light-text-secondary dark:text-dark-text-secondary">Winnable Amount:</span> <span className="font-bold text-brand-primary">{equb.winnable_amount.toLocaleString()} ETB</span></p>
                <p className="pt-2 text-light-text-secondary dark:text-dark-text-secondary">This is a great community for saving together. Join us to reach your financial goals!</p>
            </div>
        </div>
    )
}

type ContributionStatus = Contribution['status'];

const ContributionStatusBadge: React.FC<{ status: ContributionStatus }> = ({ status }) => {
    const { theme } = useContext(ThemeContext);
    const colors: Record<ContributionStatus, string> = {
        paid: 'bg-brand-primary/20 text-brand-primary',
        late: 'bg-brand-danger/20 text-brand-danger',
        pending: theme === 'dark' ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-400/20 text-gray-500',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${colors[status]}`}>{status}</span>
};

interface MemberEqubInfoProps {
    equb: Equb;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const MemberEqubInfo: React.FC<MemberEqubInfoProps> = ({ equb, showToast }) => {
    const { currentUser, contributions, winners, profiles, refreshProfiles } = useContext(DataContext);
    const [showContributionModal, setShowContributionModal] = useState(false);
    const [showContributionSuccess, setShowContributionSuccess] = useState(false);
    const [statusFilter, setStatusFilter] = useState<ContributionStatus | 'All'>('All');
    const [loading, setLoading] = useState(false);
    
    const myContributions = useMemo(() => 
        contributions
            .filter(c => c.equb_id === equb.id && c.user_id === currentUser?.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [contributions, equb, currentUser]
    );

    const filteredContributions = useMemo(() => {
        if (statusFilter === 'All') return myContributions;
        return myContributions.filter(c => c.status === statusFilter);
    }, [myContributions, statusFilter]);

    const winnerHistory = useMemo(() => winners.filter(w => w.equb_id === equb.id), [winners, equb]);
    const getUser = (id: string): UserProfile | undefined => profiles.find(u => u.id === id);

    const handleMakeContribution = async () => {
        setLoading(true);
        console.log("handleMakeContribution triggered. Current profiles:", profiles);

        let adminUser = profiles.find(p => p.role === 'admin');

        // Fallback: If admin not found in context, attempt a direct fetch
        if (!adminUser) {
            console.warn("Admin user not found in context profiles. Attempting direct fetch for admin.");
            const { data: fetchedAdmin, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'admin')
                .single();

            if (fetchError) {
                console.error("Error directly fetching admin profile:", fetchError);
                // Continue without adminUser, will trigger the error below
            } else if (fetchedAdmin) {
                adminUser = fetchedAdmin;
                console.log("Admin user successfully fetched directly:", adminUser);
            }
        }

        if (!currentUser) { 
            console.error("handleMakeContribution failed: Current user profile not found.");
            showToast('Current user profile not found. Cannot make contribution.', 'error');
            setLoading(false);
            return;
        }
        
        if (!adminUser) { 
            console.error("handleMakeContribution failed: Admin profile not found for notifications.");
            setShowContributionModal(false); 
            showToast('Admin profile required for notifications not found. Please ensure an admin user exists.', 'error');
            setLoading(false);
            return;
        }

        try {
            // 1. Check wallet balance
            if (currentUser.wallet_balance < equb.contribution_amount) {
                setShowContributionModal(false); 
                showToast('Your wallet balance is too low to make this contribution.', 'error');
                setLoading(false);
                return;
            }

            // 2. Subtract from wallet balance and update profile
            const newWalletBalance = currentUser.wallet_balance - equb.contribution_amount;
            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update({ wallet_balance: newWalletBalance })
                .eq('id', currentUser.id);

            if (profileUpdateError) {
                throw profileUpdateError;
            }

            // 3. Insert contribution
            const { error: contributionError } = await supabase.from('contributions').insert({
                equb_id: equb.id,
                user_id: currentUser.id,
                amount: equb.contribution_amount,
                status: 'pending', // Still pending admin verification
            });

            if (contributionError) {
                // If contribution fails, try to revert wallet balance
                await supabase.from('profiles').update({ wallet_balance: currentUser.wallet_balance }).eq('id', currentUser.id);
                throw contributionError;
            }
            
            // 4. Send notifications
            const notificationsToInsert = [
                // To Admin
                {
                    user_id: adminUser.id, 
                    message: `New contribution of ${equb.contribution_amount} ETB from ${currentUser.full_name} for "${equb.name}".`,
                },
                // To Member
                {
                    user_id: currentUser.id,
                    message: `Your contribution for "${equb.name}" has been submitted for admin verification. ${equb.contribution_amount} ETB has been deducted from your wallet.`,
                }
            ];
            const { error: notificationError } = await supabase.from('notifications').insert(notificationsToInsert);
            if(notificationError) console.error("Failed to send contribution notifications:", notificationError);
            
            // Refresh current user's profile to update wallet balance in UI
            await refreshProfiles(); 

            setShowContributionModal(false);
            showToast('Your contribution has been made and is pending admin verification!', 'success');
            setShowContributionSuccess(true);
        } catch (error: any) {
            console.error("Error making contribution:", error);
            setShowContributionModal(false); 
            showToast(`Failed to make contribution: ${error.message || 'An unknown error occurred.'}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const statusFilters: (ContributionStatus | 'All')[] = ['All', 'paid', 'pending', 'late'];

    return (
        <div>
             <div className="bg-light-card dark:bg-brand-dark p-4 rounded-lg mb-4">
                <p className="text-light-text-secondary dark:text-dark-text-secondary">Next due date: {equb.next_due_date}</p>
                <button onClick={() => setShowContributionModal(true)} className="w-full bg-brand-primary text-white font-bold py-3 mt-4 rounded-lg">Make Contribution</button>
            </div>

            <Accordion title="My Payment History" startsOpen>
                 <div className="flex items-center space-x-1 bg-light-bg dark:bg-brand-border rounded-lg p-1 mb-2">
                    {statusFilters.map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`w-full text-center px-2 py-1 rounded-md text-xs font-medium transition-colors capitalize ${statusFilter === status ? 'bg-brand-primary text-white' : 'hover:bg-light-border dark:hover:bg-brand-dark'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                {filteredContributions.length > 0 ? filteredContributions.map(c => (
                    <div key={c.id} className="flex justify-between items-center py-3 border-b border-light-border dark:border-brand-border last:border-b-0">
                        <div>
                             <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{c.amount.toLocaleString('en-US')} ETB</p>
                             <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{c.date}</p>
                        </div>
                        <ContributionStatusBadge status={c.status} />
                    </div>
                )) : <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm py-2">No payment history for this filter.</p>}
            </Accordion>
            
            <Accordion title="Winner History">
                 {winnerHistory.length > 0 ? winnerHistory.map(w => (
                    <div key={w.id} className="flex justify-between items-center py-2 border-b border-light-border dark:border-brand-border last:border-b-0">
                        <p>Round {w.round}: <span className="font-semibold">{getUser(w.user_id)?.full_name}</span></p>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{w.win_date}</p>
                    </div>
                )) : <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm py-2">No winners have been drawn yet.</p>}
            </Accordion>

            {showContributionModal && (
                <ContributionModal 
                    equb={equb}
                    onConfirm={handleMakeContribution} 
                    onCancel={() => setShowContributionModal(false)} 
                    loading={loading}
                />
            )}
            {showContributionSuccess && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-light-card dark:bg-brand-card rounded-lg p-6 max-w-sm w-full text-center">
                        <CheckCircleIcon className="w-16 h-16 text-brand-primary mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Contribution Submitted!</h3>
                        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
                            Your payment is now pending verification by the administrator. You will be notified once it's confirmed.
                        </p>
                        <button 
                            onClick={() => setShowContributionSuccess(false)}
                            className="px-6 py-2 rounded-lg bg-brand-primary text-white font-bold"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

interface ContributionModalProps {
    equb: Equb;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}
const ContributionModal: React.FC<ContributionModalProps> = ({ equb, onConfirm, onCancel, loading }) => {
     useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-light-card dark:bg-brand-card rounded-lg p-6 max-w-sm w-full" role="dialog" aria-modal="true" aria-labelledby="contrib-modal-title">
                <div className="flex items-start">
                     <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-brand-primary/20 sm:mx-0 sm:h-10 sm:w-10">
                        <CheckCircleIcon className="h-6 w-6 text-brand-primary" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 id="contrib-modal-title" className="text-lg leading-6 font-medium">Confirm Contribution</h3>
                        <div className="mt-2">
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                You are about to contribute <span className="font-bold text-light-text-primary dark:text-dark-text-primary">{equb.contribution_amount.toLocaleString()} ETB</span> to the "{equb.name}" group.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button type="button" onClick={onConfirm} disabled={loading} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-primary text-base font-medium text-white hover:opacity-90 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                        Confirm Payment
                    </button>
                    <button type="button" onClick={onCancel} className="mt-3 w-full inline-flex justify-center rounded-md border border-light-border dark:border-brand-border shadow-sm px-4 py-2 bg-light-card dark:bg-brand-border text-base font-medium hover:bg-light-bg dark:hover:opacity-80 sm:mt-0 sm:w-auto sm:text-sm">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};


const TermsModal: React.FC<{onAgree: () => void, onCancel: () => void, loading: boolean}> = ({onAgree, onCancel, loading}) => {
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onCancel]);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-light-card dark:bg-brand-card rounded-lg p-6 max-w-sm w-full" role="dialog" aria-modal="true" aria-labelledby="terms-modal-title">
                <div className="flex justify-between items-center mb-4">
                    <h3 id="terms-modal-title" className="text-xl font-bold text-brand-primary">Terms & Conditions</h3>
                    <button onClick={onCancel} aria-label="Close terms and conditions"><XIcon className="w-6 h-6" /></button>
                </div>
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary space-y-2 max-h-60 overflow-y-auto pr-2">
                    <p>By joining this Equb, you agree to make timely contributions based on the specified cycle.</p>
                    <p>Failure to contribute on time may result in penalties as determined by the administrator.</p>
                    <p>The winning order is determined by the administrator and is final. A member cannot win twice until all other members have had their turn.</p>
                    <p>The winning order is determined by the administrator and is final. A member cannot win twice until all other members have had their turn.</p>
                    <p>Withdrawal from an active Equb cycle may not be possible or may incur penalties. Please communicate with the administrator for any issues.</p>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-light-border dark:bg-brand-border">Cancel</button>
                    <button type="button" onClick={onAgree} disabled={loading} className="px-4 py-2 rounded-lg bg-brand-primary text-white font-bold disabled:opacity-50">Agree & Join</button>
                </div>
            </div>
        </div>
    )
}

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    startsOpen?: boolean;
}
const Accordion: React.FC<AccordionProps> = ({ title, children, startsOpen = false }) => {
    const [isOpen, setIsOpen] = useState(startsOpen);
    const contentId = `accordion-content-${title.replace(/\s+/g, '-')}`;
    
    return (
        <div className="bg-light-card dark:bg-brand-dark rounded-lg mb-4">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center p-4"
                aria-expanded={isOpen}
                aria-controls={contentId}
            >
                <h3 className="font-semibold">{title}</h3>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div id={contentId} role="region" className="p-4 pt-0">{children}</div>}
        </div>
    );
};


interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}
const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'home', label: 'Home', icon: HomeIcon },
        { id: 'my-equbs', label: 'My Equbs', icon: EqubIcon },
        { id: 'profile', label: 'Profile', icon: ProfileIcon },
    ];
    return (
        <nav className="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-light-card dark:bg-brand-dark border-t border-light-border dark:border-brand-border flex justify-around">
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center justify-center p-3 w-full transition-colors ${activeTab === item.id ? 'text-brand-primary' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}
                >
                    <item.icon className="w-6 h-6 mb-1" />
                    <span className="text-xs">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

export { MemberView };