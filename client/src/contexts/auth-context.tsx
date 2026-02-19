import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VALID_CREDENTIALS = {
  username: "eashanmahajan",
  password: "wewinhackathon",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  // Check localStorage on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");
    if (storedAuth) {
      try {
        const { username: storedUsername, isAuthenticated: storedAuthState } = JSON.parse(storedAuth);
        if (storedAuthState && storedUsername === VALID_CREDENTIALS.username) {
          setIsAuthenticated(true);
          setUsername(storedUsername);
        }
      } catch {
        localStorage.removeItem("auth");
      }
    }
  }, []);

  const login = (usernameInput: string, passwordInput: string): boolean => {
    if (
      usernameInput === VALID_CREDENTIALS.username &&
      passwordInput === VALID_CREDENTIALS.password
    ) {
      setIsAuthenticated(true);
      setUsername(usernameInput);
      localStorage.setItem(
        "auth",
        JSON.stringify({ username: usernameInput, isAuthenticated: true })
      );
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    localStorage.removeItem("auth");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
