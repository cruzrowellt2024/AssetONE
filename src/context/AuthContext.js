import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { getUserProfileRef } from "../firebase/userservices";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);        
    const [profile, setProfile] = useState(null);  
    const [loading, setLoading] = useState(true);  
    const [profileLoading, setProfileLoading] = useState(true);

    useEffect(() => {
        let unsubscribeProfile = null;
    
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                setProfileLoading(true);
                getUserProfileRef(currentUser.uid)
                    .then((userDocRef) => {
                        unsubscribeProfile = onSnapshot(userDocRef, (docSnapshot) => {
                            if (docSnapshot.exists()) {
                                setProfile({
                                    id: docSnapshot.id,
                                    ...docSnapshot.data(),
                                });
                            } else {
                                setProfile(null);
                            }
                            setProfileLoading(false);
                        });
                    })
                    .catch((err) => {
                        console.error("Failed to get user profile:", err);
                        setProfile(null);
                        setProfileLoading(false);
                    });
            } else {
                setProfile(null);
                setProfileLoading(false);
                if (unsubscribeProfile) unsubscribeProfile();
            }

            setLoading(false);
        });
    
        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);
    
    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setProfile(null);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, profileLoading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);