
import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { DataContext } from './DataProvider';
import { ThemeContext, Theme } from '../App';
import { DashboardIcon, EqubIcon, UsersIcon, LogoutIcon, SettingsIcon, WalletIcon, PlusIcon, PencilIcon, TrashIcon, XIcon, AlertTriangleIcon, SearchIcon, NotificationIcon, TrophyIcon, EyeIcon, CheckCircleIcon, BanIcon, DownloadIcon } from './Icons';
import { ThemeSwitcher } from './ThemeSwitcher';
import { NotificationPanel } from './NotificationPanel';
import { UserProfile, Equb, EqubStatus, Membership, Contribution, EqubType, Notification, Winner, Role } from '../types';
import { supabase } from '../services/supabase';

const AdminView: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const { currentUser, notifications } = useContext(DataContext);
    
    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    // FIX: Changed toastMessage state to an object to support message type (success/error).
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);


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
        settings: 'Settings',
    };
    
     const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error signing out:", error.message);
            alert(`Could not log out: ${error.message}`);
        }
    };
    
    // FIX: Updated showToast to accept a type parameter, defaulting to 'success'.
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <AnalyticsDashboard />;
            case 'equbs':
                return <EqubManagement showToast={showToast} />;
            case 'members':
                return <MemberManagement showToast={showToast} />;
            case 'transactions':
                return <TransactionManagement />;
            case 'settings':
                 return <Settings showToast={showToast} />;
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
                    <NavItem icon={<SettingsIcon className="w-5 h-5" />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
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
                                    notifications={notifications.filter(n => n.user_id === currentUser.id)} 
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
                                            <LogoutIcon className="w-5 h-5" />
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
            {/* FIX: Updated Toast component props to use the new `toast` state. */}
            <Toast message={toast?.message || ''} show={!!toast} onDismiss={() => setToast(null)} type={toast?.type} />
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
    
    const totalContributions = useMemo(() => {
        return contributions
            .filter(c => c.status === 'paid')
            .reduce((sum, c) => sum + c.amount, 0);
    }, [contributions]);

    const stats = {
        totalEqubs: equbs.length,
        totalMembers: profiles.filter(p => p.role === 'member').length,
        activeCycles: equbs.filter(e => e.status === 'Active').length,
        totalContributions: `${totalContributions.toLocaleString()} ETB`,
    };

    const equbStatusData = useMemo(() => {
        const counts = equbs.reduce((acc, equb) => {
            acc[equb.status] = (acc[equb.status] || 0) + 1;
            return acc;
        }, {} as Record<EqubStatus, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [equbs]);

    const contributionByTypeData = useMemo(() => {
        const paidContributions = contributions.filter(c => c.status === 'paid');
        const totalPerType = paidContributions.reduce((acc, contribution) => {
            const equb = equbs.find(e => e.id === contribution.equb_id);
            if (equb) {
                acc[equb.equb_type] = (acc[equb.equb_type] || 0) + contribution.amount;
            }
            return acc;
            // FIX: Added 'as Record<EqubType, number>' to ensure correct type for accumulator in reduce
        }, {} as Record<EqubType, number>);

        return Object.entries(totalPerType).map(([name, value]) => ({ name, value }));
    }, [contributions, equbs]);
    
    const memberGrowthData = [
        { name: 'Jan', members: 4 }, { name: 'Feb', members: 7 }, { name: 'Mar', members: 11 },
        { name: 'Apr', members: 15 }, { name: 'May', members: 20 }, { name: 'Jun', members: 25 },
    ];
    
    const PIE_COLORS = {
        [EqubStatus.Open]: '#FDB813',
        [EqubStatus.Active]: '#00A99D',
        [EqubStatus.Completed]: '#DA121A',
    };

    const CONTRIBUTION_PIE_COLORS = {
        [EqubType.Employee]: '#0088FE',
        [EqubType.Drivers]: '#00C49F',
        [EqubType.Merchants]: '#FFBB28',
        [EqubType.CookingOven]: '#FF8042',
        [EqubType.TV]: '#AF19FF',
        [EqubType.Fridge]: '#FF19AF',
        [EqubType.WashingMachine]: '#19FFFF',
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
                <StatCard title="Total Contributions (Paid)" value={stats.totalContributions} />
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
            {contributionByTypeData.length > 0 && (
                <div className="mt-6 bg-light-card dark:bg-brand-card p-6 rounded-lg border border-light-border dark:border-brand-border">
                    <h3 className="text-xl font-semibold mb-4">Contributions by Equb Type</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={contributionByTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {contributionByTypeData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={CONTRIBUTION_PIE_COLORS[entry.name as EqubType]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: chartConfig.tooltipBg, border: `19x solid ${chartConfig.tooltipBorder}` }} formatter={(value: number) => `${value.toLocaleString()} ETB`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: number | string }> = ({ title, value }) => (
    <div className="bg-light-card dark:bg-brand-card p-6 rounded-lg border border-light-border dark:border-brand-border">
        <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">{title}</p>
        <p className="text-3xl font-bold text-brand-primary">{value}</p>
    </div>
);

// FIX: Updated `showToast` prop type to include optional 'type' parameter
const EqubManagement: React.FC<{ showToast: (message: string, type?: 'success' | 'error') => void }> = ({ showToast }) => {
    const { equbs, profiles, memberships } = useContext(DataContext); // Added memberships to context
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingEqub, setEditingEqub] = useState<Equb | null>(null);
    const [deletingEqub, setDeletingEqub] = useState<Equb | null>(null);
    const [drawWinnerEqub, setDrawWinnerEqub] = useState<Equb | null>(null);
    const [viewingEqub, setViewingEqub] = useState<Equb | null>(null);


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

    // Helper to get the actual count of approved members for an equb
    const getApprovedMemberCount = (equbId: string) => {
        return memberships.filter(m => m.equb_id === equbId && m.status === 'approved').length;
    };

    const openFormModal = (equb: Equb | null = null) => {
        setEditingEqub(equb);
        setIsFormModalOpen(true);
    };

    const closeFormModal = (success: boolean = false) => {
        setIsFormModalOpen(false);
        setEditingEqub(null);
        if (success) {
            showToast('Equb saved successfully!');
        }
    };

    const closeDrawWinnerModal = (success: boolean = false) => {
        setDrawWinnerEqub(null);
        if (success) {
            showToast('Winner confirmed and members notified!');
        }
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
    
    const getAdminName = (adminId: string) => {
        return profiles.find(p => p.id === adminId)?.full_name || 'Unknown';
    };

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
                                <th className="p-4 w-12">#</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Members</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Cycle</th>
                                <th className="p-4">Start Date</th>
                                <th className="p-4">Next Due Date</th>
                                <th className="p-4">Created By</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEqubs.map((equb, index) => (
                                <tr key={equb.id} className="border-b border-light-border dark:border-brand-border hover:bg-light-bg dark:hover:bg-brand-border">
                                    <td className="p-4 text-light-text-secondary dark:text-dark-text-secondary">{index + 1}</td>
                                    <td className="p-4 font-semibold">{equb.name}</td>
                                    <td className="p-4">{equb.equb_type}</td>
                                    <td className="p-4">{getApprovedMemberCount(equb.id)} / {equb.max_members}</td> {/* FIX: Display actual approved member count */}
                                    <td className="p-4">{formatCurrency(equb.contribution_amount)} ETB</td>
                                    <td className="p-4 capitalize">{equb.cycle}</td>
                                    <td className="p-4">{equb.start_date}</td>
                                    <td className="p-4">{equb.next_due_date || 'N/A'}</td>
                                    <td className="p-4 text-sm">{getAdminName(equb.created_by)}</td>
                                    <td className="p-4"><StatusBadge status={equb.status} /></td>
                                    <td className="p-4 flex space-x-2">
                                        <button onClick={() => setViewingEqub(equb)} className="text-sky-500 hover:text-sky-700 p-1" aria-label={`View details for ${equb.name}`} title="View Details">
                                            <EyeIcon className="w-5 h-5"/>
                                        </button>
                                        <button onClick={() => setDrawWinnerEqub(equb)} className="text-green-500 hover:text-green-700 p-1" aria-label={`Draw winner for ${equb.name}`} title="Draw Winner" disabled={equb.status !== EqubStatus.Active}>
                                            <TrophyIcon className={`w-5 h-5 ${equb.status !== EqubStatus.Active ? 'opacity-50' : ''}`}/>
                                        </button>
                                        <button onClick={() => openFormModal(equb)} className="text-brand-primary hover:text-brand-accent p-1" aria-label={`Edit ${equb.name}`} title="Edit Equb"><PencilIcon className="w-5 h-5"/></button>
                                        <button onClick={() => setDeletingEqub(equb)} className="text-brand-danger hover:red-700 p-1" aria-label={`Delete ${equb.name}`} title="Delete Equb"><TrashIcon className="w-5 h-5"/></button>
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
            {drawWinnerEqub && <DrawWinnerModal equb={drawWinnerEqub} onClose={closeDrawWinnerModal} />}
            {viewingEqub && <EqubDetailModal equb={viewingEqub} onClose={() => setViewingEqub(null)} />}
        </div>
    );
};

// FIX: Updated `showToast` prop type to include optional 'type' parameter
const MemberManagement: React.FC<{ showToast: (message: string, type?: 'success' | 'error') => void }> = ({ showToast }) => {
    const { profiles, memberships, equbs, currentUser, refreshMemberships, refreshProfiles } = useContext(DataContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    const [editingMember, setEditingMember] = useState<UserProfile | null>(null);
    const [togglingStatusMember, setTogglingStatusMember] = useState<UserProfile | null>(null);
    const [viewingEqubDetails, setViewingEqubDetails] = useState<Equb | null>(null);

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
                { user_id: membership.user_id, message: `Your request to join "${equb?.name}" has been ${newStatus}.` },
                { user_id: currentUser.id, message: `You have ${newStatus} ${user?.full_name}'s request for "${equb?.name}".` }
            ];
            
            await supabase.from('notifications').insert(notificationsToInsert);
            showToast(`${user?.full_name}'s request has been ${newStatus}.`);

            // Explicitly refresh memberships and profiles to update UI immediately
            await refreshMemberships();
            await refreshProfiles();
    
        } catch (error: any) {
            console.error(`Error handling request for ${membership.user_id}:`, error);
            // FIX: Passed 'error' type to showToast for error messages.
            showToast(`Failed to ${newStatus} request: ${error.message}`, 'error');
        } finally {
            setLoading(prev => ({ ...prev, [key]: false }));
        }
    };
    
    const confirmToggleStatus = async () => {
        if (!togglingStatusMember) return;
        const newStatus = !togglingStatusMember.is_active;
        
        const { error } = await supabase
            .from('profiles')
            .update({ is_active: newStatus })
            .eq('id', togglingStatusMember.id);
            
        if (error) {
            // FIX: Passed 'error' type to showToast for error messages.
            showToast(`Error updating status: ${error.message}`, 'error');
        } else {
            showToast(`${togglingStatusMember.full_name}'s account has been ${newStatus ? 'activated' : 'deactivated'}.`);
            await refreshProfiles(); // Refresh profiles after status change
        }
        setTogglingStatusMember(null);
    };

    const exportToCsv = () => {
        if (filteredMembers.length === 0) {
            // FIX: Corrected showToast call to pass message and type.
            showToast('No members to export.', 'error');
            return;
        }

        const headers = [
            'ID', 'Full Name', 'Email', 'Phone', 'Location', 'Role', 'Wallet Balance', 'Is Active', 'Updated At'
        ];
        const csvRows = [];
        csvRows.push(headers.join(',')); // Add header row

        for (const member of filteredMembers) {
            const values = [
                `"${member.id}"`, // Wrap UUID in quotes to prevent Excel issues
                `"${member.full_name.replace(/"/g, '""')}"`, // Escape double quotes
                `"${(member.email || '').replace(/"/g, '""')}"`,
                `"${member.phone.replace(/"/g, '""')}"`,
                `"${member.location.replace(/"/g, '""')}"`,
                `"${member.role}"`,
                member.wallet_balance,
                member.is_active ? 'True' : 'False',
                member.updated_at,
            ];
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `members_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        URL.revokeObjectURL(url);
        showToast('Members exported successfully!');
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
                 <div className="flex flex-col md:flex-row gap-4 mb-4 items-center justify-between">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2 pl-10"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                    </div>
                    <button 
                        onClick={exportToCsv} 
                        className="flex items-center space-x-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={filteredMembers.length === 0}
                    >
                        <DownloadIcon className="w-5 h-5"/>
                        <span>Export to CSV</span>
                    </button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-light-border dark:border-brand-border">
                                <th className="p-4 w-12">#</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Phone</th>
                                <th className="p-4">Joined Equbs</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map((user, index) => {
                                const joinedEqubs = memberships
                                    .filter(m => m.user_id === user.id && m.status === 'approved')
                                    .map(m => equbs.find(e => e.id === m.equb_id))
                                    .filter((e): e is Equb => e !== undefined);

                                return (
                                    <tr key={user.id} className={`border-b border-light-border dark:border-brand-border hover:bg-light-bg dark:hover:bg-brand-border ${!user.is_active ? 'opacity-50' : ''}`}>
                                        <td className="p-4 text-light-text-secondary dark:text-dark-text-secondary">{index + 1}</td>
                                        <td className="p-4 font-semibold">{user.full_name}</td>
                                        <td className="p-4">{user.email || 'N/A'}</td>
                                        <td className="p-4">{user.phone}</td>
                                        <td className="p-4 text-sm">
                                            {joinedEqubs.length > 0 ? (
                                                <div className="flex flex-col space-y-1">
                                                {joinedEqubs.map(equb => (
                                                    <button key={equb.id} onClick={() => setViewingEqubDetails(equb)} className="text-brand-primary hover:underline text-left">
                                                        {equb.name}
                                                    </button>
                                                ))}
                                                </div>
                                            ) : 'None'}
                                        </td>
                                        <td className="p-4"><MemberStatusBadge isActive={user.is_active} /></td>
                                        <td className="p-4">
                                            <div className="flex space-x-1">
                                                <button onClick={() => setEditingMember(user)} className="text-brand-primary hover:text-brand-accent p-1" aria-label={`Edit ${user.full_name}`} title="Edit Member"><PencilIcon className="w-5 h-5"/></button>
                                                <button onClick={() => setTogglingStatusMember(user)} className={`${user.is_active ? 'text-brand-danger' : 'text-green-500'} p-1`} aria-label={user.is_active ? 'Deactivate' : 'Activate'} title={user.is_active ? 'Deactivate' : 'Activate'}>
                                                    {user.is_active ? <BanIcon className="w-5 h-5"/> : <CheckCircleIcon className="w-5 h-5"/>}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {viewingEqubDetails && <EqubDetailModal equb={viewingEqubDetails} onClose={() => setViewingEqubDetails(null)} />}
            {editingMember && <MemberFormModal user={editingMember} onClose={(success) => { setEditingMember(null); if(success) showToast('Member updated successfully!'); }} />}
            {togglingStatusMember && <ConfirmationModal 
                title={`${togglingStatusMember.is_active ? 'Deactivate' : 'Activate'} Member`}
                message={`Are you sure you want to ${togglingStatusMember.is_active ? 'deactivate' : 'activate'} ${togglingStatusMember.full_name}'s account?`}
                onConfirm={confirmToggleStatus}
                onCancel={() => setTogglingStatusMember(null)}
            />}
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
    // FIX: Corrected getEqubName to use the 'id' parameter for lookup
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
    onClose: (success?: boolean) => void;
}
const EqubFormModal: React.FC<EqubFormModalProps> = ({ equb, onClose }) => {
    const { currentUser, memberships, refreshEqubs } = useContext(DataContext);
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
        
        const dataToSubmit = { ...formData };
        
        // If next_due_date is not set, calculate it from start_date and cycle.
        if (!dataToSubmit.next_due_date) {
            const startDate = new Date(dataToSubmit.start_date);
            if (dataToSubmit.cycle === 'daily') {
                startDate.setDate(startDate.getDate() + 1);
            } else if (dataToSubmit.cycle === 'weekly') {
                startDate.setDate(startDate.getDate() + 7);
            } else if (dataToSubmit.cycle === 'monthly') {
                startDate.setMonth(startDate.getMonth() + 1);
            }
            dataToSubmit.next_due_date = startDate.toISOString().split('T')[0];
        }

        const winnable_amount = dataToSubmit.contribution_amount * dataToSubmit.max_members;
        let success = false;
        
        if (equb) { // Editing existing Equb
            const { error } = await supabase.from('equbs').update({ ...dataToSubmit, winnable_amount }).eq('id', equb.id);
            if (!error) {
                success = true;
                await refreshEqubs(); // Refresh equbs after update
                const memberIds = memberships.filter(m => m.equb_id === equb.id && m.status === 'approved').map(m => m.user_id);
                if (memberIds.length > 0) {
                  const notifications = memberIds.map(memberId => ({
                      user_id: memberId,
                      message: `The details for "${equb.name}" have been updated.`,
                  }));
                  await supabase.from('notifications').insert(notifications);
                }
            } else {
                 console.error("Update error:", error);
            }
        } else { // Creating new Equb
            const { error } = await supabase.from('equbs').insert({ ...dataToSubmit, created_by: currentUser.id, winnable_amount });
            if (!error) {
                success = true;
                await refreshEqubs(); // Refresh equbs after creation
            }
            else console.error("Insert error:", error);
        }

        setLoading(false);
        onClose(success);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-light-card dark:bg-brand-card rounded-lg p-6 max-w-lg w-full" role="dialog" aria-modal="true" aria-labelledby="equb-modal-title">
                <div className="flex justify-between items-center mb-4">
                    <h3 id="equb-modal-title" className="text-xl font-bold text-brand-primary">{equb ? 'Edit' : 'Create'} Equb Group</h3>
                    <button onClick={() => onClose()} aria-label="Close modal"><XIcon className="w-6 h-6"/></button>
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
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="start_date" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Start Date</label>
                            <input id="start_date" type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2" required />
                        </div>
                        <div>
                            <label htmlFor="next_due_date" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Next Due Date (Optional)</label>
                            <input id="next_due_date" type="date" name="next_due_date" value={formData.next_due_date} onChange={handleChange} className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 mt-6">
                        <button type="button" onClick={() => onClose()} className="px-4 py-2 rounded-lg bg-light-border dark:bg-brand-border hover:opacity-80">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-brand-primary text-white font-bold disabled:opacity-50">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// FIX: Added showToast prop.
const Settings: React.FC<{ showToast: (message: string, type?: 'success' | 'error') => void }> = ({ showToast }) => {
    const [isSendNotificationModalOpen, setIsSendNotificationModalOpen] = useState(false);

    return (
        <div>
            <div className="bg-light-card dark:bg-brand-card p-6 rounded-lg border border-light-border dark:border-brand-border">
                <h3 className="text-xl font-semibold mb-4">Application Settings</h3>
                <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
                    Manage system configurations and send important announcements.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={() => setIsSendNotificationModalOpen(true)}
                        className="w-full flex items-center justify-center space-x-2 bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90"
                    >
                        <NotificationIcon className="w-5 h-5"/>
                        <span>Send Custom Notification</span>
                    </button>
                    {/* Future settings components can go here */}
                </div>
            </div>
            {isSendNotificationModalOpen && (
                <SendNotificationModal 
                    onClose={() => setIsSendNotificationModalOpen(false)} 
                    showToast={showToast} 
                />
            )}
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
    onClose: (success?: boolean) => void;
}
const DrawWinnerModal: React.FC<DrawWinnerModalProps> = ({ equb, onClose }) => {
    const { profiles, winners, memberships, refreshEqubs } = useContext(DataContext);
    const [eligibleMembers, setEligibleMembers] = useState<UserProfile[]>([]);
    const [randomWinner, setRandomWinner] = useState<UserProfile | null>(null);
    const [displayWinnerName, setDisplayWinnerName] = useState<string>('');
    const [isSpinning, setIsSpinning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const spinIntervalRef = useRef<number | null>(null);
    
    useEffect(() => {
        const pastWinnerIds = winners.filter(w => w.equb_id === equb.id).map(w => w.user_id);
        const memberIds = memberships.filter(m => m.equb_id === equb.id && m.status === 'approved').map(m => m.user_id);
        const currentEligibleMembers = profiles.filter(u => memberIds.includes(u.id) && !pastWinnerIds.includes(u.id));

        if (currentEligibleMembers.length > 0) {
            setEligibleMembers(currentEligibleMembers);
            setLoading(false);
            setDisplayWinnerName('?'); // Initial display
        } else {
            setErrorMessage("All eligible members have already won, or there are no approved members for this Equb.");
            setLoading(false);
        }
        
        return () => {
            if (spinIntervalRef.current) {
                clearInterval(spinIntervalRef.current);
            }
        };
    }, [equb, winners, memberships, profiles]);

    const startSpin = () => {
        if (eligibleMembers.length === 0) {
            setErrorMessage("No eligible members to draw a winner.");
            return;
        }

        setIsSpinning(true);
        setRandomWinner(null);
        setDisplayWinnerName('Spinning...'); // Initial text during spin
        setErrorMessage(null);

        let spinCount = 0;
        const spinDuration = 3000; // 3 seconds for spinning
        const intervalTime = 100; // Update name every 100ms
        
        spinIntervalRef.current = window.setInterval(() => {
            const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
            setDisplayWinnerName(eligibleMembers[randomIndex].full_name);
            spinCount += intervalTime;

            if (spinCount >= spinDuration) {
                clearInterval(spinIntervalRef.current!);
                spinIntervalRef.current = null;
                // Final selection
                const finalWinnerIndex = Math.floor(Math.random() * eligibleMembers.length);
                const winner = eligibleMembers[finalWinnerIndex];
                setRandomWinner(winner);
                setDisplayWinnerName(winner.full_name);
                setIsSpinning(false);
            }
        }, intervalTime);
    };

    const calculateNextDueDate = (currentDueDate: string, cycle: 'daily' | 'weekly' | 'monthly'): string => {
        const date = new Date(currentDueDate);
        if (cycle === 'daily') {
            date.setDate(date.getDate() + 1);
        } else if (cycle === 'weekly') {
            date.setDate(date.getDate() + 7);
        } else if (cycle === 'monthly') {
            date.setMonth(date.getMonth() + 1);
        }
        return date.toISOString().split('T')[0];
    };
    
    const handleConfirmWinner = async () => {
        if (!randomWinner) return;
        setLoading(true);

        const pastWinnersCount = winners.filter(w => w.equb_id === equb.id).length;
        const newWinnerData: Omit<Winner, 'id'> = {
            equb_id: equb.id,
            user_id: randomWinner.id,
            win_date: new Date().toISOString().split('T')[0],
            round: pastWinnersCount + 1,
        };

        const { error: winnerInsertError } = await supabase.from('winners').insert(newWinnerData);
        if (winnerInsertError) {
            setErrorMessage(`Failed to record winner: ${winnerInsertError.message}`);
            setLoading(false);
            return;
        }

        const isLastWinner = (pastWinnersCount + 1) === equb.max_members; // Correct check for last winner
        const equbUpdateData: Partial<Equb> = {
            next_due_date: calculateNextDueDate(equb.next_due_date, equb.cycle),
            status: isLastWinner ? EqubStatus.Completed : EqubStatus.Active,
        };

        const { error: equbUpdateError } = await supabase.from('equbs').update(equbUpdateData).eq('id', equb.id);
        if (equbUpdateError) {
            setErrorMessage(`Failed to update Equb status: ${equbUpdateError.message}`);
            setLoading(false);
            return;
        }
        await refreshEqubs(); // Refresh equbs after updating its status

        const memberIds = memberships.filter(m => m.equb_id === equb.id && m.status === 'approved').map(m => m.user_id);
        const notificationsToInsert = memberIds.map(memberId => ({
            user_id: memberId,
            message: `${randomWinner.full_name} has won round ${newWinnerData.round} of "${equb.name}"!`,
        }));
        await supabase.from('notifications').insert(notificationsToInsert);
        
        setLoading(false);
        onClose(true);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-light-card dark:bg-brand-card rounded-lg p-6 max-w-md w-full" role="dialog" aria-modal="true">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-brand-primary">Draw Winner for "{equb.name}"</h3>
                    <button onClick={() => onClose(false)} aria-label="Close modal"><XIcon className="w-6 h-6"/></button>
                </div>
                <div className="min-h-[160px] flex flex-col items-center justify-center p-4">
                    {loading ? (
                        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" role="status">
                            <span className="sr-only">Loading eligible members...</span>
                        </div>
                    ) : errorMessage ? (
                        <p className="text-center py-4 text-brand-danger" aria-live="polite">{errorMessage}</p>
                    ) : (
                        <div className="text-center w-full">
                            <p className="mb-4 text-light-text-secondary dark:text-dark-text-secondary">
                                {randomWinner ? 'The system has randomly selected:' : 'Click "Spin to Draw" to find the next winner!'}
                            </p>
                            <div className="relative h-20 w-full flex items-center justify-center border-2 border-dashed border-light-border dark:border-brand-border rounded-lg bg-light-bg dark:bg-brand-dark mb-4 overflow-hidden">
                                <div 
                                    className={`text-5xl font-extrabold text-brand-primary transition-all duration-300 ${isSpinning ? 'animate-spin-text-fast' : ''}`}
                                    aria-live="polite"
                                >
                                    {displayWinnerName}
                                </div>
                            </div>
                            {randomWinner && !isSpinning && (
                                <p className="text-sm mt-4">Confirm to finalize the draw and notify all members.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-4 mt-4">
                    <button 
                        type="button" 
                        onClick={() => onClose(false)} 
                        className="px-4 py-2 rounded-lg bg-light-border dark:bg-brand-border hover:opacity-80"
                        disabled={isSpinning}
                    >
                        Cancel
                    </button>
                    {!randomWinner && !errorMessage && !loading && (
                        <button 
                            type="button" 
                            onClick={startSpin} 
                            disabled={isSpinning || eligibleMembers.length === 0}
                            className="px-4 py-2 rounded-lg bg-brand-primary text-white font-bold disabled:opacity-50"
                        >
                            {isSpinning ? 'Spinning...' : 'Spin to Draw Winner'}
                        </button>
                    )}
                    {randomWinner && !isSpinning && (
                        <button 
                            type="button" 
                            onClick={handleConfirmWinner} 
                            disabled={loading || !!errorMessage || !randomWinner} 
                            className="px-4 py-2 rounded-lg bg-brand-primary text-white font-bold disabled:opacity-50"
                        >
                            {loading ? 'Confirming...' : 'Confirm Winner'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const EqubDetailModal: React.FC<{ equb: Equb; onClose: () => void }> = ({ equb, onClose }) => {
    const { profiles, memberships, winners } = useContext(DataContext);

    const equbMembers = useMemo(() => {
        const memberLinks = memberships
            .filter(m => m.equb_id === equb.id && m.status === 'approved');
        
        return memberLinks.map(link => {
            const profile = profiles.find(p => p.id === link.user_id);
            return { ...profile, join_date: link.join_date };
        }).filter(Boolean); // Filter out any undefined profiles
    }, [equb.id, memberships, profiles]);

    const equbWinners = useMemo(() => {
        return winners
            .filter(w => w.equb_id === equb.id)
            .sort((a, b) => a.round - b.round) // Sort by round number
            .map(winner => {
                const profile = profiles.find(p => p.id === winner.user_id);
                return { ...winner, winner_name: profile?.full_name || 'Unknown' };
            });
    }, [equb.id, winners, profiles]);

    const creator = useMemo(() => profiles.find(p => p.id === equb.created_by), [profiles, equb.created_by]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
        <div>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{label}</p>
            <p className="font-semibold">{value}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-light-card dark:bg-brand-card rounded-lg p-6 max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="equb-detail-title">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 id="equb-detail-title" className="text-2xl font-bold text-brand-primary">{equb.name}</h3>
                    <button onClick={onClose} aria-label="Close modal"><XIcon className="w-6 h-6"/></button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Left Column: Details */}
                        <div className="bg-light-bg dark:bg-brand-dark p-4 rounded-lg">
                            <h4 className="font-bold text-lg mb-4">Group Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem label="Status" value={<StatusBadge status={equb.status}/>} />
                                <DetailItem label="Type" value={equb.equb_type} />
                                <DetailItem label="Contribution" value={`${equb.contribution_amount.toLocaleString()} ETB`} />
                                <DetailItem label="Cycle" value={<span className="capitalize">{equb.cycle}</span>} />
                                <DetailItem label="Start Date" value={equb.start_date} />
                                <DetailItem label="Next Due Date" value={equb.next_due_date || 'N/A'} />
                                <DetailItem label="Created By" value={creator?.full_name || 'Unknown'} />
                                <DetailItem label="Created At" value={new Date(equb.created_at).toLocaleDateString()} />
                                <DetailItem label="Winnable Amount" value={<span className="font-bold text-brand-primary">{equb.winnable_amount.toLocaleString()} ETB</span>} />
                            </div>
                        </div>

                        {/* Right Column: Members */}
                        <div className="bg-light-bg dark:bg-brand-dark p-4 rounded-lg flex flex-col">
                            <h4 className="font-bold text-lg mb-4">Members ({equbMembers.length} / {equb.max_members})</h4>
                            <div className="flex-grow overflow-y-auto">
                                {equbMembers.length > 0 ? (
                                    <ul className="space-y-3">
                                        {equbMembers.map(member => (
                                            <li key={member.id} className="flex items-center space-x-3">
                                                <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                                    {member.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{member.full_name}</p>
                                                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{member.email} &bull; Joined: {new Date(member.join_date).toLocaleDateString()}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center py-8">No members have joined yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Winner History Section */}
                    <div className="mb-6">
                        <h4 className="font-bold text-lg mb-2">Winner History</h4>
                        <div className="text-sm p-4 bg-light-bg dark:bg-brand-dark rounded-lg">
                            {equbWinners.length > 0 ? (
                                <ul className="space-y-3">
                                    {equbWinners.map(winner => (
                                        <li key={winner.id} className="flex items-center justify-between border-b border-light-border dark:border-brand-border pb-2 last:border-b-0">
                                            <div>
                                                <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">Round {winner.round}: {winner.winner_name}</p>
                                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Won on: {new Date(winner.win_date).toLocaleDateString()}</p>
                                            </div>
                                            <p className="font-bold text-brand-primary">{equb.winnable_amount.toLocaleString()} ETB</p>
                                        </li>
                                    ))}
                                    </ul>
                            ) : (
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center py-4">No winners have been drawn yet for this Equb.</p>
                            )}
                        </div>
                    </div>

                    {/* Bottom Section: Terms */}
                    <div>
                        <h4 className="font-bold text-lg mb-2">Terms & Conditions</h4>
                        <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary space-y-1 p-4 bg-light-bg dark:bg-brand-dark rounded-lg">
                            <p>&bull; By joining this Equb, you agree to make timely contributions based on the specified cycle.</p>
                            <p>&bull; Failure to contribute on time may result in penalties as determined by the administrator.</p>
                            <p>&bull; The winning order is determined by the administrator and is final. A member cannot win twice until all other members have had their turn.</p>
                            <p>&bull; Withdrawal from an active Equb cycle may not be possible or may incur penalties. Please communicate with the administrator for any issues.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MemberStatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    const colors = isActive
        ? 'bg-brand-primary/20 text-brand-primary'
        : 'bg-gray-500/20 text-gray-500 dark:text-gray-400';
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors}`}>{isActive ? 'Active' : 'Inactive'}</span>
};

interface MemberFormModalProps {
    user: UserProfile;
    onClose: (success?: boolean) => void;
}
const MemberFormModal: React.FC<MemberFormModalProps> = ({ user, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: user.full_name,
        phone: user.phone,
        location: user.location,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.from('profiles').update(formData).eq('id', user.id);
        setLoading(false);
        if (error) {
            console.error('Error updating profile:', error);
            onClose(false);
        } else {
            onClose(true);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-light-card dark:bg-brand-card rounded-lg p-6 max-w-md w-full" role="dialog" aria-modal="true">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-brand-primary">Edit Member: {user.full_name}</h3>
                    <button onClick={() => onClose()} aria-label="Close modal"><XIcon className="w-6 h-6"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="full_name" className="block text-sm font-medium">Full Name</label>
                        <input id="full_name" name="full_name" type="text" value={formData.full_name} onChange={handleChange} className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2 mt-1" required/>
                    </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium">Phone</label>
                        <input id="phone" name="phone" type="text" value={formData.phone} onChange={handleChange} className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2 mt-1" required/>
                    </div>
                     <div>
                        <label htmlFor="location" className="block text-sm font-medium">Location</label>
                        <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2 mt-1" required/>
                    </div>
                     <div className="flex justify-end space-x-4 mt-6">
                        <button type="button" onClick={() => onClose()} className="px-4 py-2 rounded-lg bg-light-border dark:bg-brand-border hover:opacity-80">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-brand-primary text-white font-bold disabled:opacity-50">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// FIX: Updated Toast component to support 'success' and 'error' types, similar to MemberView.
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
        <div className={`fixed bottom-5 right-5 z-50 transition-all duration-300 transform ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${colors[type]} text-white py-3 px-5 rounded-lg shadow-lg flex items-center space-x-2`}>
            {type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <XIcon className="w-5 h-5" />}
            <span>{message}</span>
        </div>
    );
};

interface SendNotificationModalProps {
    onClose: () => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const SendNotificationModal: React.FC<SendNotificationModalProps> = ({ onClose, showToast }) => {
    const { profiles, equbs, memberships, currentUser, refreshNotifications } = useContext(DataContext);
    const [targetType, setTargetType] = useState<'all_members' | 'specific_member' | 'equb_members'>('all_members');
    const [targetId, setTargetId] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const memberProfiles = useMemo(() => profiles.filter(p => p.role === Role.Member), [profiles]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (!message.trim()) {
            showToast('Notification message cannot be empty.', 'error');
            setLoading(false);
            return;
        }

        let notificationsToInsert: Omit<Notification, 'id' | 'created_at' | 'read'>[] = [];

        try {
            if (targetType === 'all_members') {
                notificationsToInsert = memberProfiles.map(member => ({
                    user_id: member.id,
                    message: message,
                }));
            } else if (targetType === 'specific_member') {
                if (!targetId) {
                    showToast('Please select a specific member.', 'error');
                    setLoading(false);
                    return;
                }
                notificationsToInsert.push({ user_id: targetId, message: message });
            } else if (targetType === 'equb_members') {
                if (!targetId) {
                    showToast('Please select an Equb group.', 'error');
                    setLoading(false);
                    return;
                }
                const equbMemberIds = memberships
                    .filter(m => m.equb_id === targetId && m.status === 'approved')
                    .map(m => m.user_id);
                
                if (equbMemberIds.length === 0) {
                    showToast('The selected Equb has no approved members.', 'error');
                    setLoading(false);
                    return;
                }
                notificationsToInsert = equbMemberIds.map(memberId => ({
                    user_id: memberId,
                    message: message,
                }));
            }
            
            // Add notification for the admin who sent it
            notificationsToInsert.push({ user_id: currentUser.id, message: `You sent: "${message.substring(0, 50)}..."` });

            const { error } = await supabase.from('notifications').insert(notificationsToInsert);

            if (error) {
                throw error;
            }

            showToast('Notification(s) sent successfully!');
            await refreshNotifications(); // Refresh admin's notifications to show "you sent" message
            onClose();
        } catch (error: any) {
            console.error('Error sending notification:', error);
            showToast(`Failed to send notification: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-light-card dark:bg-brand-card rounded-lg p-6 max-w-lg w-full" role="dialog" aria-modal="true" aria-labelledby="send-notification-title">
                <div className="flex justify-between items-center mb-4">
                    <h3 id="send-notification-title" className="text-xl font-bold text-brand-primary">Send Custom Notification</h3>
                    <button onClick={onClose} aria-label="Close modal"><XIcon className="w-6 h-6"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="targetType" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Send to</label>
                        <select 
                            id="targetType" 
                            name="targetType" 
                            value={targetType} 
                            onChange={(e) => {
                                setTargetType(e.target.value as 'all_members' | 'specific_member' | 'equb_members');
                                setTargetId(''); // Reset targetId when targetType changes
                            }} 
                            className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2"
                            required
                        >
                            <option value="all_members">All Members</option>
                            <option value="specific_member">Specific Member</option>
                            <option value="equb_members">Members of an Equb Group</option>
                        </select>
                    </div>

                    {(targetType === 'specific_member' || targetType === 'equb_members') && (
                        <div>
                            <label htmlFor="targetId" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                                {targetType === 'specific_member' ? 'Select Member' : 'Select Equb Group'}
                            </label>
                            <select 
                                id="targetId" 
                                name="targetId" 
                                value={targetId} 
                                onChange={(e) => setTargetId(e.target.value)} 
                                className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2"
                                required
                            >
                                <option value="">-- Select --</option>
                                {targetType === 'specific_member' ? (
                                    memberProfiles.map(member => (
                                        <option key={member.id} value={member.id}>{member.full_name} ({member.email})</option>
                                    ))
                                ) : (
                                    equbs.map(equb => (
                                        <option key={equb.id} value={equb.id}>{equb.name} ({equb.equb_type})</option>
                                    ))
                                )}
                            </select>
                        </div>
                    )}

                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Message</label>
                        <textarea 
                            id="message" 
                            name="message" 
                            rows={4}
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)} 
                            className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-2" 
                            placeholder="Enter your notification message here..."
                            required
                        ></textarea>
                    </div>

                    <div className="flex justify-end space-x-4 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-light-border dark:bg-brand-border hover:opacity-80">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-brand-primary text-white font-bold disabled:opacity-50">
                            {loading ? 'Sending...' : 'Send Notification'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export { AdminView };