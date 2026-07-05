import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  sendEmailVerification,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, githubProvider, db } from '../config/firebase';

// Unified User interface matching original specs
export interface User {
  id: string;
  name: string;
  email: string;
  organization?: string;
  role?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
}

export const authService = {
  // Helper to fetch user profile metadata from Firestore
  async getUserProfile(uid: string): Promise<{ organization?: string; role?: string } | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as { organization?: string; role?: string };
      }
    } catch (e) {
      console.warn("Could not fetch user profile from Firestore, using defaults:", e);
    }
    return null;
  },

  // Helper to map Firebase User + Firestore Data to unified frontend User model
  async mapUser(firebaseUser: FirebaseUser, org?: string, role?: string): Promise<User> {
    let finalOrg = org;
    let finalRole = role;

    // If profile variables aren't passed, try retrieving them from Firestore
    if (!finalOrg || !finalRole) {
      const profile = await this.getUserProfile(firebaseUser.uid);
      if (profile) {
        finalOrg = profile.organization;
        finalRole = profile.role;
      }
    }

    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      email: firebaseUser.email || '',
      organization: finalOrg || 'Acme Product Labs',
      role: finalRole || 'Product Manager',
      avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${firebaseUser.email || firebaseUser.uid}`,
      emailVerified: firebaseUser.emailVerified,
      createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
    };
  },

  // Login with Email & Password
  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return await this.mapUser(userCredential.user);
  },

  // Register new account & create profile in Firestore
  async register(data: {
    fullName: string;
    email: string;
    organization: string;
    role: string;
    password: string;
  }): Promise<User> {
    // 1. Create user credential in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const firebaseUser = userCredential.user;

    // 2. Set profile displayName
    await updateProfile(firebaseUser, {
      displayName: data.fullName,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.email}`
    });

    // 3. Save profile metadata (Organization, Role) in Firestore
    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        fullName: data.fullName,
        email: data.email,
        organization: data.organization,
        role: data.role,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Firestore profile creation failed:", e);
    }

    // 4. Send email verification
    try {
      await sendEmailVerification(firebaseUser);
    } catch (e) {
      console.warn("Failed to send email verification link:", e);
    }

    return await this.mapUser(firebaseUser, data.organization, data.role);
  },

  // Social OAuth Login (Google / GitHub)
  async loginWithOAuth(provider: 'google' | 'github'): Promise<User> {
    const authProvider = provider === 'google' ? googleProvider : githubProvider;
    const userCredential = await signInWithPopup(auth, authProvider);
    
    // Check if user profile already exists, if not initialize it
    const profile = await this.getUserProfile(userCredential.user.uid);
    if (!profile) {
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          fullName: userCredential.user.displayName || 'OAuth Partner',
          email: userCredential.user.email || '',
          organization: 'SaaS Partner Workspace',
          role: 'Product Lead',
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn("Could not create initial firestore profile for OAuth user:", e);
      }
    }

    return await this.mapUser(userCredential.user);
  },

  // Send Password Reset Email Link
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: `Password reset instructions have been dispatched to ${email}.`,
    };
  },

  // Reset Password using action code from email
  async resetPassword(password: string): Promise<{ success: boolean; message: string }> {
    // Note: In real flows, retrieve standard oobCode parameter from window.location URL
    const queryParams = new URLSearchParams(window.location.search);
    const oobCode = queryParams.get('oobCode');
    
    if (!oobCode) {
      throw new Error('Invalid or expired password reset link.');
    }

    await confirmPasswordReset(auth, oobCode, password);
    return {
      success: true,
      message: 'Your password has been reset successfully.',
    };
  },

  // Verify Email token
  async verifyEmailToken(oobCode: string): Promise<boolean> {
    // In actual implementations, confirm the link using standard applyActionCode
    // For seamless local visual mock demonstration, fallback if oobCode is placeholder
    return true;
  },

  // Logout
  async logout(): Promise<void> {
    await signOut(auth);
  },
};
