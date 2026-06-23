/**
 * ChangeHub
 * Extracted from App.jsx. Uses useSession() instead of currentUser module variable.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { api, setToken, getToken, clearToken } from '../../../api';
import { storage, getFlags, getPlatformConfig, getAdminProducts, getAdminPackages,
         getAdminPlans, getAdminHubs, getLeaderboardConfig, getAdminHostels,
         pollStorage, chatStorage, msgStorage, pushBrowserNotif } from '../../../storage';
import { fmt, delay, fromNow, timeUntil, PLANS, CATEGORIES, BANTER_MESSAGES,
         FOOD_PACKAGES, MOCK_SLASHES, MOCK_PRODUCTS, MOCK_TRANSACTIONS,
         MOCK_NOTIFICATIONS, MOCK_LEADERBOARD, LEADERBOARD_CONFIG, HOSTELS } from '../../../data';
import { mapUser, extractUser, normalizePhone } from '../../../utils/session';
import { useSession } from '../../../hooks/useSession';
import { useAuth } from '../../../context/AuthContext';
import { Btn, Card, Input, Badge, FillBar, Modal } from '../../../components/ui';
import { toast } from '../../../toast';
import { HubPickerFlow } from '../../hub/components/HubPickerFlow';

export function ChangeHub() {
  const { updateSession } = useSession();
  const nav = useNavigate();
  const [user, setUserState] = useState(() => storage.load('session', {}));

  const onComplete = (hub) => {
    const updated = { ...user, hubId: hub.id, hubName: hub.name, city: hub.city, state: hub.state };
    updateSession(updated);
    // Sync hub change to admin users table
    try {
      const adminUsers = JSON.parse(localStorage.getItem('slashit_admin_users') || '[]');
      const synced = adminUsers.map(u => (u.id === updated.id || u.email === updated.email) ? {...u, hubName: hub.name, hubId: hub.id, city: hub.city, state: hub.state} : u);
      localStorage.setItem('slashit_admin_users', JSON.stringify(synced));
    } catch(e) {}
    toast.success(`Hub changed to ${hub.name}!`);
    nav('/profile');
  };

  return (
    <HubPickerFlow
      onComplete={onComplete}
      onBack={() => nav('/profile')}
      title="Change Delivery Hub"
      sub="Select where you want to pick up your orders"
    />
  );
}

// Re-export alias so App.jsx can import { ChangeHubPage }
export { ChangeHub as ChangeHubPage };
