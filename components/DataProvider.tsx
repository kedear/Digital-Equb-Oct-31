
import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile, Equb, Membership, Contribution, Winner, Notification, EqubStatus, Role } from '../types';

interface DataContextType {
  currentUser: UserProfile;
  isEmailConfirmed: boolean;
  profiles: UserProfile[];
  equbs: Equb[];
  memberships: Membership[];
  contributions: Contribution[];
  winners: Winner[];
  notifications: Notification[];
  refreshEqubs: () => Promise<void>;
  refreshMemberships: () => Promise<void>; // Added refreshMemberships to the context
  refreshProfiles: () => Promise<void>; // Added refreshProfiles to the context
  refreshNotifications: () => Promise<void>; // Added refreshNotifications to the context
}

export const DataContext = createContext<DataContextType>({
  currentUser: {} as UserProfile,
  isEmailConfirmed: false,
  profiles: [],
  equbs: [],
  memberships: [],
  contributions: [],
  winners: [],
  notifications: [],
  refreshEqubs: async () => {},
  refreshMemberships: async () => {}, // Default no-op function
  refreshProfiles: async () => {}, // Default no-op function
  refreshNotifications: async () => {}, // Default no-op function
});


interface DataProviderProps {
  user: UserProfile;
  isEmailConfirmed: boolean;
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ user, isEmailConfirmed, children }) => {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [equbs, setEqubs] = useState<Equb[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Function to refresh Equbs data
  const refreshEqubs = useCallback(async () => {
    const { data, error } = await supabase.from('equbs').select('*');
    if (error) {
      console.error("Error refreshing equbs:", error);
    } else if (data) {
      setEqubs(data);
    }
  }, []);

  // Function to refresh Memberships data
  const refreshMemberships = useCallback(async () => {
    const { data, error } = await supabase.from('memberships').select('*');
    if (error) {
      console.error("Error refreshing memberships:", error);
    } else if (data) {
      setMemberships(data);
    }
  }, []);

  // Function to refresh Profiles data
  const refreshProfiles = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.error("Error refreshing profiles:", error);
    } else if (data) {
      setProfiles(data);
    }
  }, []);

  // Function to refresh Notifications data for the current user
  const refreshNotifications = useCallback(async () => {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', user.id);
    if (error) {
      console.error("Error refreshing notifications:", error);
    } else if (data) {
      setNotifications(data);
    }
  }, [user.id]); // Dependency on user.id to ensure it fetches for the current user


  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      
      const [profilesRes, equbsRes, membershipsRes, contributionsRes, winnersRes, notificationsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('equbs').select('*'),
        supabase.from('memberships').select('*'),
        supabase.from('contributions').select('*'),
        supabase.from('winners').select('*'),
        supabase.from('notifications').select('*').eq('user_id', user.id),
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data);
      if (equbsRes.data) setEqubs(equbsRes.data);
      if (membershipsRes.data) setMemberships(membershipsRes.data);
      if (contributionsRes.data) setContributions(contributionsRes.data);
      if (winnersRes.data) setWinners(winnersRes.data);
      if (notificationsRes.data) setNotifications(notificationsRes.data);

      setLoading(false);
    };

    fetchInitialData();
  }, [user.id]);
  
  // Set up realtime subscriptions
  useEffect(() => {
    const equbsSub = supabase.channel('equbs-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equbs' }, async () => {
        refreshEqubs(); 
      }).subscribe();
      
    const profilesSub = supabase.channel('profiles-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, async () => {
        refreshProfiles();
      }).subscribe();
      
    const membershipsSub = supabase.channel('memberships-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memberships' }, async () => {
        refreshMemberships();
      }).subscribe();
      
    const contributionsSub = supabase.channel('contributions-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, async () => {
        const { data } = await supabase.from('contributions').select('*');
        if (data) setContributions(data);
      }).subscribe();
      
    const winnersSub = supabase.channel('winners-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'winners' }, async () => {
        const { data } = await supabase.from('winners').select('*');
        if (data) setWinners(data);
      }).subscribe();

    const notificationsSub = supabase.channel(`notifications-channel-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, async () => {
        refreshNotifications(); // Use the new refresh function
      }).subscribe();

    return () => {
      supabase.removeChannel(equbsSub);
      supabase.removeChannel(profilesSub);
      supabase.removeChannel(membershipsSub);
      supabase.removeChannel(contributionsSub);
      supabase.removeChannel(winnersSub);
      supabase.removeChannel(notificationsSub);
    };
  }, [user.id, refreshEqubs, refreshMemberships, refreshProfiles, refreshNotifications]); // Added refreshNotifications to dependency array

  // Automatically activate equbs when they are full
  useEffect(() => {
    const checkAndActivateEqubs = async () => {
        const equbsToActivate = equbs.filter(equb => {
            if (equb.status !== EqubStatus.Open) {
                return false;
            }
            const memberCount = memberships.filter(m => m.equb_id === equb.id && m.status === 'approved').length;
            return memberCount > 0 && memberCount === equb.max_members;
        });

        if (equbsToActivate.length > 0) {
            const updates = equbsToActivate.map(equb => 
                supabase
                    .from('equbs')
                    .update({ status: EqubStatus.Active })
                    .eq('id', equb.id)
            );
            
            const results = await Promise.all(updates);

            results.forEach(async (result, index) => { // Made callback async
                if (result.error) {
                    console.error(`Failed to activate equb ${equbsToActivate[index].name}:`, result.error.message || result.error);
                } else {
                    const activatedEqub = equbsToActivate[index];
                    const memberIds = memberships
                        .filter(m => m.equb_id === activatedEqub.id && m.status === 'approved')
                        .map(m => m.user_id);
                    
                    if (memberIds.length > 0) {
                        const notifications = memberIds.map(id => ({
                            user_id: id,
                            message: `The Equb group "${activatedEqub.name}" is now full and has become Active!`
                        }));
                        await supabase.from('notifications').insert(notifications).then(({ error }) => { // Awaited insert
                            if (error) {
                                console.error('Failed to send activation notifications:', error.message || error);
                            }
                        });
                    }
                }
            });
            refreshEqubs(); // Refresh equbs after potential activations
        }
    };

    if (!loading && user.role === Role.Admin) {
        checkAndActivateEqubs();
    }
  }, [memberships, equbs, loading, user.role, refreshEqubs]); // Added refreshEqubs to dependency array

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <DataContext.Provider value={{ currentUser: user, isEmailConfirmed, profiles, equbs, memberships, contributions, winners, notifications, refreshEqubs, refreshMemberships, refreshProfiles, refreshNotifications }}>
      {children}
    </DataContext.Provider>
  );
};