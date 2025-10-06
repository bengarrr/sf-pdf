import React, { createContext, useContext } from 'react';
import { getSession } from "@/lib/auth/session";

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const authData = getSession();
  
  return (
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthData() {
  return useContext(AuthContext);
}