import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { DataContext } from './DataProvider';
import { ThemeContext, Theme } from '../App';
import { DashboardIcon, EqubIcon, UsersIcon, LogoutIcon, SparklesIcon, WalletIcon, PlusIcon, PencilIcon, TrashIcon, XIcon, AlertTriangleIcon, SearchIcon, NotificationIcon, TrophyIcon } from './Icons';
import { ThemeSwitcher } from './ThemeSwitcher';
import { UserProfile, Equb, EqubStatus, Membership, Contribution, EqubType, Notification, Winner } from '../types';
import { getAdminAdvice } from '../services/geminiService';
import { NotificationPanel } from './NotificationPanel';
import { supabase } from '../services/supabase';

const AdminView: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const { currentUser, notifications } = useContext(DataContext);
    
    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
    
    const pageTitles: { [key: string]: string } = {
        dashboard: 'Dashboard',
        equbs: 'Equb Group Management',
        members: 'Member Management',
        transactions: 'Transaction Management',
        advisor: 'AI Admin Advisor',
    };
    
     const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error signing out:", error.message);
            alert(`Could not log out: ${error.message}`);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <AnalyticsDashboard />;
            case 'equbs':
                return <EqubManagement />;
            case 'members':
                return <MemberManagement />;
            case 'transactions':
                return <TransactionManagement />;
            case 'advisor':
                 return <GeminiAdvisor />;
            default:
                return <AnalyticsDashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-light-bg dark:bg-brand-dark text-light-text-primary dark:text-dark-text-primary">
            <aside className="w-64 bg-light-card dark:bg-brand-card border-r border-light-border dark:border-brand-border flex flex-col">
                <div className="p-6 border-b border-light-border dark:border-brand-border">
                    <h1 className="text-2xl font-bold text-brand-primary">ZamZam Bank</h1>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">Admin Panel</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <NavItem icon={<DashboardIcon className="w-5 h-5" />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <NavItem icon={<EqubIcon className="w-5 h-5" />} label="Equb Groups" active={activeTab === 'equbs'} onClick={() => setActiveTab('equbs')} />
                    <NavItem icon={<UsersIcon className="w-5 h-5" />} label="Members" active={activeTab === 'members'} onClick={() => setActiveTab('members')} />
                    <NavItem icon={<WalletIcon className="w-5 h-5" />} label="Transactions" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
                    <NavItem icon={<SparklesIcon className="w-5 h-5" />} label="AI Advisor" active={activeTab === 'advisor'} onClick={() => setActiveTab('advisor')} />
                </nav>
            </aside>

            <main className="flex-1 flex flex-col">
                <header className="flex justify-between items-center p-6 border-b border-light-border dark:border-brand-border bg-light-card dark:bg-brand-card">
                    <h2 className="text-2xl font-bold">{pageTitles[activeTab]}</h2>
                    <div className="flex items-center space-x-4">
                        <ThemeSwitcher />
                        <div className="relative">
                            <button onClick={handleToggleNotifications} aria-label="Toggle notifications">
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
                         <div className="relative" ref={profileMenuRef}>
                            <button onClick={() => setIsProfileMenuOpen(prev => !prev)} className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center font-bold text-white">
                                {currentUser?.full_name.charAt(0)}
                            </button>
                            {isProfileMenuOpen && (
                                 <div className="absolute top-full right-0 mt-2 w-64 bg-light-card dark:bg-brand-card border border-light-border dark:border-brand-border rounded-lg shadow-lg z-50">
                                    <div className="p-4 border-b border-light-border dark:border-brand-border">
                                        <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{currentUser?.full_name}</p>
                                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{currentUser?.email}</p>
                                    </div>
                                    <div className="p-2">
                                        <button onClick={handleLogout} className="w-full flex items-center space-x-2 py-2 px-3 rounded-md hover:bg-light-bg dark:hover:bg-brand-dark text-left">
                                            <LogoutIcon className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <div className="flex-1 p-8 overflow-y-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

// ... other components remain largely the same, but will use the new DataContext
interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 py-2 px-4 rounded-lg text-left transition-colors ${active ? 'bg-brand-primary text-white' : 'hover:bg-light-border dark:hover:bg-brand-border'}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const AnalyticsDashboard: React.FC = () => {
    const { profiles, equbs, contributions } = useContext(DataContext);
    const { theme } = useContext(ThemeContext);
    
    const stats = {
        totalEqubs: equbs.length,
        totalMembers: profiles.filter(u => u.role === 'member').length,
        activeCycles: equbs.filter(e => e.status === 'Active').length,
        latePayments: contributions.filter(c => c.status === 'late').length,
    };

    const equbStatusData = useMemo(() => {
        const counts = equbs.reduce((acc, equb) => {
            acc[equb.status] = (acc[equb.status] || 0) + 1;
            return acc;
        }, {} as Record<EqubStatus, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [equbs]);
    
    const memberGrowthData = [
        { name: 'Jan', members: 4 }, { name: 'Feb', members: 7 }, { name: 'Mar', members: 11 },
        { name: 'Apr', members: 15 }, { name: 'May', members: 20 }, { name: 'Jun', members: 25 },
    ];
    
    const PIE_COLORS = {
        [EqubStatus.Open]: '#FDB813',
        [EqubStatus.Active]: '#00A99D',
        [EqubStatus.Completed]: '#DA121A',
    };

    const chartConfig = {
        axisColor: theme === 'dark' ? '#A0A00A' : '#6B7280',
        tooltipBg: theme === 'dark' ? '#14262B' : '#FFFFFF',
        tooltipBorder: theme === 'dark' ? '#2A3C40' : '#E5E7EB',
    };

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Equbs" value={stats.totalEqubs} />
                <StatCard title="Total Members" value={stats.totalMembers} />
                <StatCard title="Active Cycles" value={stats.activeCycles} />
                <StatCard title="Late Payments" value={stats.latePayments} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-light-card dark:bg-brand-card p-6 rounded-lg border border-light-border dark:border-brand-border">
                    <h3 className="text-xl font-semibold mb-4">Member Growth</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={memberGrowthData}>
                            <XAxis dataKey="name" stroke={chartConfig.axisColor} />
                            <YAxis stroke={chartConfig.axisColor} />
                            <Tooltip contentStyle={{ backgroundColor: chartConfig.tooltipBg, border: `1px solid ${chartConfig.tooltipBorder}` }} />
                            <Legend />
                            <Bar dataKey="members" fill="#00A99D" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-light-card dark:bg-brand-card p-6 rounded-lg border border-light-border dark:border-brand-border">
                    <h3 className="text-xl font-semibold mb-4">Equb Status Distribution</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={equbStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {equbStatusData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[entry.name as EqubStatus]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: chartConfig.tooltipBg, border: `1px solid ${chartConfig.tooltipBorder}` }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: number | string }> = ({ title, value }) => (
    <div className="bg-light-card dark:bg-brand-card p-6 rounded-lg border border-light-border dark:border-brand-border">
        <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">{title}</p>
        <p className="text-3xl font-bold text-brand-primary">{value}</p>
    </div>
);

const EqubManagement: React.FC = () => {
    const { equbs, memberships } = useContext(DataContext);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingEqub, setEditingEqub] = useState<Equb | null>(null);
    const [deletingEqub, setDeletingEqub] = useState<Equb | null>(null);
    const [drawWinnerEqub, setDrawWinnerEqub] = useState<Equb | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');

    const filteredEqubs = useMemo(() => {
        return equbs.filter(equb =>
            equb.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (statusFilter === 'All' || equb.status === statusFilter) &&
            (typeFilter === 'All' || equb.equb_type === typeFilter)
        );
    }, [equbs, searchTerm, statusFilter, typeFilter]);


    const openFormModal = (equb: Equb | null = null) => {
        setEditingEqub(equb);
        setIsFormModalOpen(true);
    };

    const closeFormModal = () => {
        setIsFormModalOpen(false);
        setEditingEqub(null);
    };

    const confirmDelete = async () => {
        if (deletingEqub) {
            await supabase.from('equbs').delete().eq('id', deletingEqub.id);
            setDeletingEqub(null);
        }
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US').format(amount);
    };

    const getMemberCount = (equbId: string) => {
        return memberships.filter(m => m.equb_id === equbId && m.status === 'approved').length;
    }

    return (
        <div>
            <div className="flex justify-end items-center mb-6">
                <button onClick={() => openFormModal()} className="flex items-center space-x-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:opacity-90">
                    <PlusIcon className="w-5 h-5"/>
                    <span>Create Equb</span>
                </button>
            </div>

            <div className="bg-light-card dark:bg-brand-card p-6 rounded-lg border border-light-border dark:border-brand-border">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2 pl-10"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2"
                    >
                        <option value="All">All Statuses</option>
                        {Object.values(EqubStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2"
                    >
                        <option value="All">All Types</option>
                        {Object.values(EqubType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-light-border dark:border-brand-border">
                                <th className="p-4">Name</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Members</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEqubs.map(equb => (
                                <tr key={equb.id} className="border-b border-light-border dark:border-brand-border hover:bg-light-bg dark:hover:bg-brand-border">
                                    <td className="p-4 font-semibold">{equb.name}</td>
                                    <td className="p-4">{equb.equb_type}</td>
                                    <td className="p-4">{getMemberCount(equb.id)} / {equb.max_members}</td>
                                    <td className="p-4">{formatCurrency(equb.contribution_amount)} ETB</td>
                                    <td className="p-4"><StatusBadge status={equb.status} /></td>
                                    <td className="p-4 flex space-x-2">
                                        <button onClick={() => setDrawWinnerEqub(equb)} className="text-green-500 hover:underline p-1" aria-label={`Draw winner for ${equb.name}`} title="Draw Winner" disabled={equb.status !== EqubStatus.Active}>
                                            <TrophyIcon className={`w-5 h-5 ${equb.status !== EqubStatus.Active ? 'opacity-50' : ''}`}/>
                                        </button>
                                        <button onClick={() => openFormModal(equb)} className="text-brand-primary hover:underline p-1" aria-label={`Edit ${equb.name}`} title="Edit Equb"><PencilIcon className="w-5 h-5"/></button>
                                        <button onClick={() => setDeletingEqub(equb)} className="text-brand-danger hover:underline p-1" aria-label={`Delete ${equb.name}`} title="Delete Equb"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isFormModalOpen && <EqubFormModal equb={editingEqub} onClose={closeFormModal} />}
            {deletingEqub && <ConfirmationModal 
                title="Delete Equb"
                message={`Are you sure you want to delete the "${deletingEqub.name}" group? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={() => setDeletingEqub(null)}
            />}
            {drawWinnerEqub && <DrawWinnerModal equb={drawWinnerEqub} onClose={() => setDrawWinnerEqub(null)} />}
        </div>
    );
};

const MemberManagement: React.FC = () => {
    const { profiles, memberships, equbs, currentUser } = useContext(DataContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    const memberUsers = useMemo(() => profiles.filter(p => p.role === 'member'), [profiles]);

    const filteredMembers = useMemo(() => {
        if (!searchTerm) return memberUsers;
        return memberUsers.filter(user =>
            user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [memberUsers, searchTerm]);
    
    const getUser = (id: string): UserProfile | undefined => profiles.find(u => u.id === id);
    const getEqub = (id: string): Equb | undefined => equbs.find(e => e.id === id);

    const handleRequest = async (membership: Membership, newStatus: 'approved' | 'rejected') => {
        const key = `${membership.user_id}-${membership.equb_id}`;
        setLoading(prev => ({ ...prev, [key]: true }));
    
        try {
            const { error: updateError } = await supabase
                .from('memberships')
                .update({ status: newStatus })
                .eq('user_id', membership.user_id)
                .eq('equb_id', membership.equb_id);
    
            if (updateError) throw updateError;
    
            const equb = getEqub(membership.equb_id);
            const user = getUser(membership.user_id);
    
            const notificationsToInsert = [
                // Notification for the member
                {
                    user_id: membership.user_id,
                    message: `Your request to join "${equb?.name}" has been ${newStatus}.`,
                },
                // Notification for the admin
                {
                    user_id: currentUser.id,
                    message: `You have ${newStatus} ${user?.full_name}'s request for "${equb?.name}".`,
                }
            ];
            
            const { error: notificationError } = await supabase.from('notifications').insert(notificationsToInsert);
            if (notificationError) {
                // Log but don't fail the entire operation
                console.error('Failed to send notifications:', notificationError);
            }
    
            alert(`Successfully ${newStatus} ${user?.full_name}'s request.`);
    
        } catch (error: any) {
            console.error(`Error handling request for ${membership.user_id}:`, error);
            alert(`Failed to ${newStatus} request: ${error.message}`);
        } finally {
            setLoading(prev => ({ ...prev, [key]: false }));
        }
    };
    
    return (
        <div>
            <div className="bg-light-card dark:bg-brand-card p-6 rounded-lg border border-light-border dark:border-brand-border">
                <h3 className="text-xl font-semibold mb-4">Pending Join Requests</h3>
                {memberships.filter(m => m.status === 'pending').length > 0 ? (
                    <div className="space-y-4">
                        {memberships.filter(m => m.status === 'pending').map(req => {
                            const user = getUser(req.user_id);
                            const equb = getEqub(req.equb_id);
                            if (!user || !equb) return null;
                            const isLoading = loading[`${user.id}-${equb.id}`];

                            return (
                                <div key={`${user.id}-${equb.id}`} className="flex items-center justify-between p-4 bg-light-bg dark:bg-brand-dark rounded-lg">
                                    <div>
                                        <p className="font-bold">{user.full_name} wants to join <span className="text-brand-primary">{equb.name}</span></p>
                                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{user.email || 'No email'} &bull; {user.location}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => handleRequest(req, 'approved')} disabled={isLoading} className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-80 disabled:opacity-50">Approve</button>
                                        <button onClick={() => handleRequest(req, 'rejected')} disabled={isLoading} className="px-4 py-2 bg-brand-danger text-white rounded-lg hover:opacity-80 disabled:opacity-50">Reject</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-light-text-secondary dark:text-dark-text-secondary">No pending requests.</p>
                )}
            </div>

            <div className="bg-light-card dark:bg-brand-card p-6 rounded-lg border border-light-border dark:border-brand-border mt-6">
                 <h3 className="text-xl font-semibold mb-4">All Members</h3>
                 <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2 pl-10"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-light-border dark:border-brand-border">
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Phone</th>
                                <th className="p-4">Location</th>
                                <th className="p-4">Joined Equbs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map(user => {
                                const joinedEqubs = memberships
                                    .filter(m => m.user_id === user.id && m.status === 'approved')
                                    .map(m => equbs.find(e => e.id === m.equb_id)?.name)
                                    .filter(Boolean);

                                return (
                                    <tr key={user.id} className="border-b border-light-border dark:border-brand-border hover:bg-light-bg dark:hover:bg-brand-border">
                                        <td className="p-4 font-semibold">{user.full_name}</td>
                                        <td className="p-4">{user.email || 'N/A'}</td>
                                        <td className="p-4">{user.phone}</td>
                                        <td className="p-4">{user.location}</td>
                                        <td className="p-4 text-sm">
                                            {joinedEqubs.length > 0 ? joinedEqubs.join(', ') : 'None'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

type ContributionStatus = Contribution['status'];

const TransactionManagement: React.FC = () => {
    const { contributions, profiles, equbs } = useContext(DataContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ContributionStatus | 'All'>('All');
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    const getUserName = (id: string) => profiles.find(u => u.id === id)?.full_name || 'Unknown';
    const getEqubName = (id: string) => equbs.find(e => e.id === id)?.name || 'Unknown';

    const filteredContributions = useMemo(() => {
        return contributions
            .filter(c => 
                (statusFilter === 'All' || c.status === statusFilter) &&
                (getUserName(c.user_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
                 getEqubName(c.equb_id).toLowerCase().includes(searchTerm.toLowerCase()))
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [contributions, searchTerm, statusFilter, profiles, equbs]);

    const handleMarkAsPaid = async (contribution: Contribution) => {
        setLoading(prev => ({...prev, [contribution.id]: true}));
        
        await supabase
            .from('contributions')
            .update({ status: 'paid' })
            .eq('id', contribution.id);
        
        const equbName = getEqubName(contribution.equb_id);
        await supabase.from('notifications').insert({
            user_id: contribution.user_id,
            message: `Your payment of ${contribution.amount} ETB for "${equbName}" has been confirmed.`
        });

        setLoading(prev => ({...prev, [contribution.id]: false}));
    };

    const statusFilters: (ContributionStatus | 'All')[] = ['All', 'paid', 'pending', 'late'];

    return (
        <div>
            <div className="bg-light-card dark:bg-brand-card p-6 rounded-lg border border-light-border dark:border-brand-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                     <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by member or equb..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2 pl-10"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                    </div>
                    <div className="flex items-center space-x-2 bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-1">
                        {statusFilters.map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`w-full text-center px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${statusFilter === status ? 'bg-brand-primary text-white' : 'hover:bg-light-border dark:hover:bg-brand-border'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-light-border dark:border-brand-border">
                                <th className="p-4">Member</th>
                                <th className="p-4">Equb Group</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContributions.map(c => (
                                <tr key={c.id} className="border-b border-light-border dark:border-brand-border hover:bg-light-bg dark:hover:bg-brand-border">
                                    <td className="p-4 font-semibold">{getUserName(c.user_id)}</td>
                                    <td className="p-4">{getEqubName(c.equb_id)}</td>
                                    <td className="p-4">{c.date}</td>
                                    <td className="p-4">{c.amount} ETB</td>
                                    <td className="p-4">
                                        <ContributionStatusBadge status={c.status} />
                                    </td>
                                    <td className="p-4">
                                        {c.status !== 'paid' && (
                                            <button 
                                                onClick={() => handleMarkAsPaid(c)}
                                                disabled={loading[c.id]}
                                                className="text-xs font-semibold text-brand-primary hover:underline disabled:opacity-50"
                                            >
                                                Mark as Paid
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

interface EqubFormModalProps {
    equb: Equb | null;
    onClose: () => void;
}
const EqubFormModal: React.FC<EqubFormModalProps> = ({ equb, onClose }) => {
    const { currentUser, memberships } = useContext(DataContext);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: equb?.name || '',
        equb_type: equb?.equb_type || EqubType.Employee,
        contribution_amount: equb?.contribution_amount || 1000,
        cycle: equb?.cycle || 'monthly',
        max_members: equb?.max_members || 10,
        status: equb?.status || EqubStatus.Open,
        start_date: equb?.start_date || new Date().toISOString().split('T')[0],
        next_due_date: equb?.next_due_date || '',
    });

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'contribution_amount' || name === 'max_members' ? Number(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const winnable_amount = formData.contribution_amount * formData.max_members;
        
        if (equb) { // Editing existing Equb
            const updatePayload = {
                ...formData,
                winnable_amount,
            };
            const { error } = await supabase.from('equbs').update(updatePayload).eq('id', equb.id);
            if (error) console.error("Update error:", error);

            const memberIds = memberships.filter(m => m.equb_id === equb.id && m.status === 'approved').map(m => m.user_id);
            if (memberIds.length > 0) {
              const notifications = memberIds.map(memberId => ({
                  user_id: memberId,
                  message: `The details for "${equb.name}" have been updated by the administrator.`,
              }));
              await supabase.from('notifications').insert(notifications);
            }
        } else { // Creating new Equb
            const { error } = await supabase.from('equbs').insert({
                ...formData,
                created_by: currentUser.id,
                winnable_amount
            });
            if (error) console.error("Insert error:", error);
        }

        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-light-card dark:bg-brand-card rounded-lg p-6 max-w-lg w-full" role="dialog" aria-modal="true" aria-labelledby="equb-modal-title">
                <div className="flex justify-between items-center mb-4">
                    <h3 id="equb-modal-title" className="text-xl font-bold text-brand-primary">{equb ? 'Edit' : 'Create'} Equb Group</h3>
                    <button onClick={onClose} aria-label="Close modal"><XIcon className="w-6 h-6"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Equb Name</label>
                            <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2" required />
                        </div>
                        <div>
                            <label htmlFor="equb_type" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Equb Type</label>
                            <select id="equb_type" name="equb_type" value={formData.equb_type} onChange={handleChange} className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2">
                                {Object.values(EqubType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="contribution_amount" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Contribution (ETB)</label>
                            <input id="contribution_amount" type="number" name="contribution_amount" value={formData.contribution_amount} onChange={handleChange} className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2" required />
                        </div>
                         <div>
                            <label htmlFor="max_members" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Max Members</label>
                            <input id="max_members" type="number" name="max_members" value={formData.max_members} onChange={handleChange} className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2" required />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="cycle" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Cycle</label>
                            <select id="cycle" name="cycle" value={formData.cycle} onChange={handleChange} className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2">
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Status</label>
                            <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2">
                                {Object.values(EqubStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-light-border dark:bg-brand-border hover:opacity-80">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-brand-primary text-white font-bold disabled:opacity-50">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const GeminiAdvisor: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [advice, setAdvice] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGetAdvice = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setAdvice('');
        const result = await getAdminAdvice(prompt);
        setAdvice(result);
        setIsLoading(false);
    };

    return (
        <div>
            <div className="bg-light-card dark:bg-brand-card p-6 rounded-lg border border-light-border dark:border-brand-border">
                <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">Get expert advice on managing your Equb groups. Describe a situation below.</p>
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., How to handle a member who consistently pays late?"
                        className="flex-1 bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    />
                    <button
                        onClick={handleGetAdvice}
                        disabled={isLoading}
                        className="bg-brand-primary text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? (
                           <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : 'Get Advice'}
                    </button>
                </div>
                {advice && (
                    <div className="mt-6 p-4 bg-light-bg dark:bg-brand-dark rounded-lg">
                        <h4 className="font-semibold text-lg mb-2 text-brand-primary">Expert Advice:</h4>
                        <p className="whitespace-pre-wrap">{advice}</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const StatusBadge: React.FC<{ status: EqubStatus }> = ({ status }) => {
    const colors = {
        [EqubStatus.Open]: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
        [EqubStatus.Active]: 'bg-brand-primary/20 text-brand-primary',
        [EqubStatus.Completed]: 'bg-brand-danger/20 text-brand-danger'
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>{status}</span>
};

const ContributionStatusBadge: React.FC<{ status: ContributionStatus }> = ({ status }) => {
    const { theme } = useContext(ThemeContext);
    const colors: Record<ContributionStatus, string> = {
        paid: 'bg-brand-primary/20 text-brand-primary',
        late: 'bg-brand-danger/20 text-brand-danger',
        pending: theme === 'dark' ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-400/20 text-gray-500',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${colors[status]}`}>{status}</span>
};

interface ConfirmationModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onConfirm, onCancel }) => {
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
            <div className="bg-light-card dark:bg-brand-card rounded-lg p-6 max-w-sm w-full" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-brand-danger/20 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangleIcon className="h-6 w-6 text-brand-danger" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 id="confirm-title" className="text-lg leading-6 font-medium text-light-text-primary dark:text-dark-text-primary">{title}</h3>
                        <div className="mt-2">
                            <p id="confirm-message" className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-danger text-base font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-danger sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={onConfirm}
                    >
                        Confirm
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-light-border dark:border-brand-border shadow-sm px-4 py-2 bg-light-card dark:bg-brand-border text-base font-medium text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg dark:hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

interface DrawWinnerModalProps {
    equb: Equb;
    onClose: () => void;
}
const DrawWinnerModal: React.FC<DrawWinnerModalProps> = ({ equb, onClose }) => {
    const { profiles, winners, memberships } = useContext(DataContext);
    const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    
    const pastWinnerIds = useMemo(() => 
        winners.filter(w => w.equb_id === equb.id).map(w => w.user_id), 
    [winners, equb.id]);

    const memberIds = useMemo(() => 
        memberships.filter(m => m.equb_id === equb.id && m.status === 'approved').map(m => m.user_id),
    [memberships, equb.id]);
        
    const eligibleMembers = useMemo(() => 
        profiles.filter(u => memberIds.includes(u.id) && !pastWinnerIds.includes(u.id)),
    [profiles, memberIds, pastWinnerIds]);

    useEffect(() => {
        if (eligibleMembers.length > 0) {
            setSelectedWinnerId(eligibleMembers[0].id);
        }
    }, [eligibleMembers]);
    
    const handleDrawWinner = async () => {
        if (!selectedWinnerId) return;
        setLoading(true);

        const newWinner: Omit<Winner, 'id'> = {
            equb_id: equb.id,
            user_id: selectedWinnerId,
            win_date: new Date().toISOString().split('T')[0],
            round: pastWinnerIds.length + 1,
        };
        await supabase.from('winners').insert(newWinner);
        
        const winnerUser = profiles.find(u => u.id === selectedWinnerId);
        const notifications = memberIds.map(memberId => ({
            user_id: memberId,
            message: `${winnerUser?.full_name} has won round ${newWinner.round} of "${equb.name}"!`,
        }));
        await supabase.from('notifications').insert(notifications);
        
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-light-card dark:bg-brand-card rounded-lg p-6 max-w-md w-full" role="dialog" aria-modal="true">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-brand-primary">Draw Winner for "{equb.name}"</h3>
                    <button onClick={onClose} aria-label="Close modal"><XIcon className="w-6 h-6"/></button>
                </div>
                {eligibleMembers.length > 0 ? (
                    <>
                        <label htmlFor="winner-select" className="block text-sm font-medium mb-2">Select a winner from eligible members:</label>
                        <select
                            id="winner-select"
                            value={selectedWinnerId}
                            onChange={e => setSelectedWinnerId(e.target.value)}
                            className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2 mb-6"
                        >
                            {eligibleMembers.map(member => (
                                <option key={member.id} value={member.id}>{member.full_name}</option>
                            ))}
                        </select>
                        <div className="flex justify-end space-x-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-light-border dark:bg-brand-border hover:opacity-80">Cancel</button>
                            <button type="button" onClick={handleDrawWinner} disabled={loading} className="px-4 py-2 rounded-lg bg-brand-primary text-white font-bold disabled:opacity-50">Confirm Winner</button>
                        </div>
                    </>
                ) : (
                    <p className="text-center py-4 text-light-text-secondary dark:text-dark-text-secondary">All members have already won a round in this Equb.</p>
                )}
            </div>
        </div>
    );
};


export { AdminView };