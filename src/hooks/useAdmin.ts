import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";

export function useAdmin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) { setCheckingAdmin(false); return; }
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setIsAdmin(data?.role === "admin");
          setCheckingAdmin(false);
        });
    }
  }, [user, loading]);

  return { isAdmin, checkingAdmin };
}
