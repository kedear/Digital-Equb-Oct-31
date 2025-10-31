import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile, Equb, Membership, Contribution, Winner, Notification } from '../types';

interface DataContextType {
  currentUser: UserProfile;
  profiles: UserProfile[];
  equbs: Equb[];
  memberships: Membership[];
  contributions: Contribution[];
  winners: Winner[];
  notifications: Notification[];
}

export const DataContext = createContext<DataContextType>({
  currentUser: {} as UserProfile,
  profiles: [],
  equbs: [],
  memberships: [],
  contributions: [],
  winners: [],
  notifications: [],
});


interface DataProviderProps {
  user: UserProfile;
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ user, children }) => {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [equbs, setEqubs] = useState<Equb[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  

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
     const handleInserts = <T extends { id: string }>(payload: any, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
        setter(prev => [...prev, payload.new as T]);
    };
    const handleUpdates = <T extends { id: string }>(payload: any, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
        setter(prev => prev.map(item => item.id === payload.new.id ? payload.new as T : item));
    };
    const handleDeletes = <T extends { id: string }>(payload: any, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
        setter(prev => prev.filter(item => item.id !== payload.old.id));
    };
    
    // Generic handler for tables with composite keys like 'memberships'
    const handleCompositeKeyUpdates = <T,>(payload: any, setter: React.Dispatch<React.SetStateAction<T[]>>, keyFields: (keyof T)[]) => {
      setter(prev => prev.map(item => {
        const isMatch = keyFields.every(key => (item as any)[key] === (payload.new as any)[key]);
        return isMatch ? payload.new as T : item;
      }));
    };
    const handleCompositeKeyDeletes = <T,>(payload: any, setter: React.Dispatch<React.SetStateAction<T[]>>, keyFields: (keyof T)[]) => {
      setter(prev => prev.filter(item => {
         const isMatch = keyFields.every(key => (item as any)[key] === (payload.old as any)[key]);
        return !isMatch;
      }));
    };


    const equbsSub = supabase.channel('equbs-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'equbs' }, (payload) => handleInserts(payload, setEqubs))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'equbs' }, (payload) => handleUpdates(payload, setEqubs))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'equbs' }, (payload) => handleDeletes(payload, setEqubs))
      .subscribe();
      
    const profilesSub = supabase.channel('profiles-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          supabase.from('profiles').select('*').then(({ data }) => data && setProfiles(data));
      })
      .subscribe();
      
    const membershipsSub = supabase.channel('memberships-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'memberships' }, payload => setMemberships(prev => [...prev, payload.new as Membership]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'memberships' }, payload => handleCompositeKeyUpdates(payload, setMemberships, ['user_id', 'equb_id']))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'memberships' }, payload => handleCompositeKeyDeletes(payload, setMemberships, ['user_id', 'equb_id']))
      .subscribe();
      
    const contributionsSub = supabase.channel('contributions-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contributions' }, (payload) => handleInserts(payload, setContributions))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contributions' }, (payload) => handleUpdates(payload, setContributions))
      .subscribe();
      
    const winnersSub = supabase.channel('winners-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'winners' }, (payload) => handleInserts(payload, setWinners))
      .subscribe();

    const notificationsSub = supabase.channel(`notifications-channel-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => handleInserts(payload, setNotifications))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => handleUpdates(payload, setNotifications))
      .subscribe();

    return () => {
      supabase.removeChannel(equbsSub);
      supabase.removeChannel(profilesSub);
      supabase.removeChannel(membershipsSub);
      supabase.removeChannel(contributionsSub);
      supabase.removeChannel(winnersSub);
      supabase.removeChannel(notificationsSub);
    };
  }, [user.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <DataContext.Provider value={{ currentUser: user, profiles, equbs, memberships, contributions, winners, notifications }}>
      {children}
    </DataContext.Provider>
  );
};
