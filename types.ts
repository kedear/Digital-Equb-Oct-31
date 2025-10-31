// Corresponds to the 'app_role' enum in Supabase
export enum Role {
  Admin = 'admin',
  Member = 'member',
}

// Corresponds to the 'profiles' table
export interface UserProfile {
  id: string; // UUID from auth.users
  full_name: string;
  email?: string; // email is in auth.users, can be joined
  phone: string;
  location: string;
  role: Role;
  wallet_balance: number;
  updated_at: string;
}

// Corresponds to the 'equb_status' enum in Supabase
export enum EqubStatus {
  Open = 'Open',
  Active = 'Active',
  Completed = 'Completed',
}

// Corresponds to the 'equb_type' enum in Supabase
export enum EqubType {
  Employee = 'Employee',
  Drivers = 'Drivers',
  Merchants = 'Merchants',
  CookingOven = 'Cooking Oven',
  TV = 'TV',
  Fridge = 'Fridge',
  WashingMachine = 'Washing Machine',
}

// Corresponds to the 'equbs' table
export interface Equb {
  id: string; // UUID
  created_at: string;
  created_by: string; // UUID of an admin user
  name: string;
  equb_type: EqubType;
  contribution_amount: number;
  cycle: 'daily' | 'weekly' | 'monthly';
  max_members: number;
  status: EqubStatus;
  start_date: string;
  next_due_date: string;
  winnable_amount: number;
}

// Corresponds to the 'memberships' table
export interface Membership {
    user_id: string; // UUID
    equb_id: string; // UUID
    join_date: string;
    status: 'pending' | 'approved' | 'rejected';
}

// Corresponds to the 'contributions' table
export interface Contribution {
    id: string; // UUID
    equb_id: string; // UUID
    user_id: string; // UUID
    date: string;
    amount: number;
    status: 'paid' | 'late' | 'pending';
}

// Corresponds to the 'winners' table
export interface Winner {
    id: string; // UUID
    equb_id: string; // UUID
    user_id: string; // UUID
    win_date: string;
    round: number;
}

// Corresponds to the 'notifications' table
export interface Notification {
    id: string; // UUID
    user_id: string; // UUID
    message: string;
    created_at: string;
    read: boolean;
}