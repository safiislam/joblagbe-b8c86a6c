import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type ProfileData = {
  full_name: string | null;
  role: string;
  resume_url?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: ProfileData | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role, resume_url, avatar_url, phone")
      .eq("user_id", userId)
      .single();
    setProfile(data);
    return data;
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const syncPendingSignupRole = async (userId: string, currentRole?: string | null) => {
    const url = new URL(window.location.href);
    const roleFromUrl = url.searchParams.get("role");
    const roleFromStorage = localStorage.getItem("pending_signup_role");
    const selectedRole = roleFromUrl === "employer" || roleFromUrl === "seeker"
      ? roleFromUrl
      : roleFromStorage === "employer" || roleFromStorage === "seeker"
        ? roleFromStorage
        : null;

    if (!selectedRole) return;

    if (currentRole !== selectedRole) {
      const { error } = await supabase
        .from("profiles")
        .update({ role: selectedRole })
        .eq("user_id", userId);

      if (!error) {
        setProfile((prev) => (prev ? { ...prev, role: selectedRole } : prev));
      }
    }

    localStorage.removeItem("pending_signup_role");
    if (roleFromUrl) {
      url.searchParams.delete("role");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  };

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin");
    setIsAdmin((data && data.length > 0) || false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(false);
        setTimeout(async () => {
          const [profileData] = await Promise.all([
            fetchProfile(session.user.id),
            checkAdmin(session.user.id),
          ]);
          await syncPendingSignupRole(session.user.id, profileData?.role);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        const [profileData] = await Promise.all([
          fetchProfile(session.user.id),
          checkAdmin(session.user.id),
        ]);
        await syncPendingSignupRole(session.user.id, profileData?.role);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isAdmin, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
