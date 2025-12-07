import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
    isLoggedIn: boolean;
    userType: 'department' | 'finance' | null;
    departmentName: string | null;
    login: (userType: 'department' | 'finance', departmentName?: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userType, setUserType] = useState<'department' | 'finance' | null>(null);
    const [departmentName, setDepartmentName] = useState<string | null>(null);

    const login = (type: 'department' | 'finance', name?: string) => {
        setIsLoggedIn(true);
        setUserType(type);
        setDepartmentName(name || null);
    };

    const logout = () => {
        setIsLoggedIn(false);
        setUserType(null);
        setDepartmentName(null);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, userType, departmentName, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
