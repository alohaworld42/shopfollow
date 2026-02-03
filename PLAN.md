# ShopFollow - Feature Implementation Plan

> **Current State**: UI connected to Supabase backend (partially, see status below)  
> **Target State**: Fully functional social commerce app

---

## 🔴 Critical: Connect UI to Supabase

These pages use services that connect to Supabase when configured.

### 1. Authentication ✅ DONE
- [x] `AuthContext.tsx` uses Supabase Auth via `authService.ts`
- [x] Login/Signup call Supabase `signInWithPassword` / `signUp`
- [x] Firebase imports removed from auth services
- [x] `.env` configured with real Supabase credentials

### 2. Dashboard Page (`/dashboard`) ✅ DONE
- [x] Fetch real user profile from `profiles` table
- [x] Fetch user's products from `products` table via `useProducts`
- [x] Calculate real stats via `analyticsService.ts` (followers, likes, products)
- [x] Show pending orders count

### 3. Feed Page (`/`) ✅ DONE
- [x] `useProducts` hook uses `productService.ts` when Supabase configured
- [x] Fetch products from `products` table
- [x] Real like/unlike via `likes` table
- [x] Real comments via `comments` table
- [ ] Filter by visibility (following, groups) - needs additional work
- [ ] Hide content from blocked users - handled by moderation

### 4. Product Detail/Comments ✅ DONE
- [x] Fetch real comments from `comments` table
- [x] Post comments (moderation TBD via Edge Function)

### 5. Purchases/Orders Page (`/purchases`) ✅ DONE
- [x] `useInbox` hook uses `inboxService.ts` with real data
- [x] Fetch from `staging_orders` table
- [x] Accept/Reject orders
- [x] Real-time subscription for new orders

### 6. Search Page (`/search`) ✅ DONE
- [x] `searchService.ts` created
- [x] Product search via Supabase `ilike`
- [x] User search via Supabase `ilike`
- [x] Trending products display
- [ ] Category filters (infrastructure ready, UI buttons non-functional)

### 7. Network Page (`/network`) ✅ DONE
- [x] `userService.ts` rewritten for Supabase (was Firebase)
- [x] `useUsers` hook uses `isSupabaseConfigured`
- [x] Real followers from `followers` table
- [x] Follow/unfollow functionality
- [x] User suggestions

### 8. Settings Page (`/settings`) ✅ DONE
- [x] Blocked users from `blocked_users` table
- [x] Unblock functionality
- [ ] Profile editing (name, avatar, bio) - UI exists, backend ready
- [ ] Notification preferences - needs implementation

---

## 🟡 Important: Remaining Work

### Image Uploads (High Priority)
- [ ] Configure Supabase Storage bucket for images
- [ ] Image upload component
- [ ] Call `moderate-image` Edge Function on upload
- [ ] Generate thumbnails

### Comment Moderation Integration
- [ ] Wire `addComment` to call `moderate-comment` Edge Function
- [ ] Show moderation status on flagged comments
- [ ] Allow comment reporting

### Groups (for visibility)
- [ ] Create/manage groups UI
- [ ] `group_members` table integration
- [ ] Share products to specific groups

---

## 🟢 Nice to Have: Phase 3 Features

### Push Notifications
- [ ] Set up Web Push API
- [ ] Create VAPID keys
- [ ] Notification preferences UI
- [ ] Send notifications on: new follower, like, comment, order

### Privacy Controls
- [ ] Private account mode (require follow approval)
- [ ] Hide follower/following counts
- [ ] Activity status toggle

### Admin Enhancements
- [ ] Bulk moderation actions
- [ ] User management (search, view history)
- [ ] Analytics dashboard enhancements
- [ ] Moderation audit log viewing

---

## 📁 File Reference

### Pages Status:
| Page | File | Status |
|------|------|--------|
| Dashboard | `src/pages/Dashboard.tsx` | � Connected |
| Feed | `src/pages/Feed.tsx` | � Connected |
| Purchases | `src/pages/Purchases.tsx` | � Connected |
| Search | `src/pages/Search.tsx` | � Connected |
| Network | `src/pages/Network.tsx` | � Connected |
| Settings | `src/pages/Settings.tsx` | � Connected |
| Admin | `src/pages/AdminDashboard.tsx` | 🟢 Ready |

### Services Created/Updated:
| Service | Purpose | Status |
|---------|---------|--------|
| `authService.ts` | Supabase Auth | � Ready |
| `productService.ts` | Product CRUD | � Ready |
| `userService.ts` | User CRUD + Follow | 🟢 Ready (Supabase) |
| `inboxService.ts` | Staging Orders | 🟢 Ready |
| `searchService.ts` | Search Products/Users | 🟢 Ready |
| `analyticsService.ts` | Dashboard Stats | 🟢 Ready |
| `moderationService.ts` | Moderation | 🟢 Ready |

### Database ready:
- ✅ All tables + RLS policies applied
- ✅ Views: `products_with_details`
- ✅ Edge Functions: 5 deployed

---

## 🚀 Summary

**Completed Today:**
1. ✅ Auth → Supabase (already was)
2. ✅ Dashboard → real stats via `analyticsService`
3. ✅ Feed → real products via `productService`
4. ✅ Network → real users via `userService` (Supabase version)
5. ✅ Search → real search via `searchService`
6. ✅ Purchases → real orders via `inboxService`

**Remaining High Priority:**
1. Image uploads
2. Comment moderation integration
3. Category filters in search

**Estimated Remaining Work:** ~8-12 hours

---

## Notes

- **Demo Mode**: App falls back to demo data when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not configured
- **Empty Database**: With Supabase configured but no data, pages will show empty states (need to create users/products via signup + create post)
