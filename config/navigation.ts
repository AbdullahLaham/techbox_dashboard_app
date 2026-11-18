// config/navigation.ts
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  ClipboardList,
  FileCheck,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { GlobalRole } from '@/types';
import { canAccessRoute, isStaffRole } from '@/lib/auth/rbac';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  /**
   * Who sees the link. Omit to derive visibility from the RBAC route rules.
   * `'anonymous'` shows the item only to signed-out visitors.
   */
  audience?: readonly GlobalRole[] | 'anonymous';
}

export interface NavSection {
  id: string;
  title: string;
  items: readonly NavItem[];
}

const LEARNER_AUDIENCE = [GlobalRole.STUDENT, GlobalRole.GUEST] as const;

/*
 * Not linked until they are built (each page only says "coming soon"): /admin/startups,
 * /admin/settings, /certificates, /my-startup and /support. Their routes and role rules stay in
 * lib/auth/rbac.ts, so adding a link back is all it takes once a page is ready.
 */

const NAV_SECTIONS: readonly NavSection[] = [
  {
    id: 'admin-main',
    title: 'الإدارة',
    items: [
      { title: 'لوحة التحكم الرئيسية', href: '/admin/overview', icon: LayoutDashboard },
      { title: 'البرامج والمناهج', href: '/admin/content', icon: BookOpen },
      { title: 'طلبات التسجيل', href: '/admin/enrollments', icon: UserCheck },
      { title: 'إدارة الواجبات', href: '/admin/assignments', icon: ClipboardList },
      { title: 'تقييم التسليمات', href: '/admin/grading', icon: FileCheck },
    ],
  },
  {
    id: 'admin-people',
    title: 'الفريق والمستخدمون',
    items: [{ title: 'المستخدمون والصلاحيات', href: '/admin/users', icon: Users }],
  },
  {
    id: 'learner-main',
    title: 'رحلتي التعليمية',
    items: [
      { title: 'لوحتي الشخصية', href: '/dashboard', icon: LayoutDashboard },
      { title: 'واجباتي', href: '/assignments', icon: ClipboardList },
      { title: 'دليل البرامج والدورات', href: '/programs', icon: GraduationCap, audience: LEARNER_AUDIENCE },
    ],
  },
  {
    id: 'public',
    title: 'استكشف',
    items: [
      { title: 'استكشاف البرامج', href: '/programs', icon: GraduationCap, audience: 'anonymous' },
      { title: 'عن حاضنة TechBox', href: '/about', icon: ShieldCheck, audience: 'anonymous' },
      { title: 'تسجيل الدخول', href: '/login', icon: LogIn, audience: 'anonymous' },
    ],
  },
];

function isVisible(item: NavItem, role: GlobalRole | null): boolean {
  if (item.audience === 'anonymous') return role === null;
  if (item.audience) return role !== null && item.audience.includes(role);
  return role !== null && canAccessRoute(item.href, role);
}

/** Navigation sections visible to `role` (null = signed-out visitor). Empty sections are dropped. */
export function getNavigation(role: GlobalRole | null): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => isVisible(item, role)),
  })).filter((section) => section.items.length > 0);
}

/** Best-matching nav item for a path (longest prefix), used for active state and page titles. */
export function findActiveNavItem(pathname: string, role: GlobalRole | null): NavItem | undefined {
  return getNavigation(role)
    .flatMap((section) => section.items)
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

/** Staff-only quick actions, filtered with the same route rules as navigation. */
export interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export const ADMIN_QUICK_ACTIONS: readonly QuickAction[] = [
  { title: 'برنامج جديد', description: 'أنشئ مساراً تعليمياً أو دفعة احتضان', href: '/admin/content', icon: BookOpen },
  { title: 'واجب جديد', description: 'أنشئ واجباً وأرفق ملفات التعليمات', href: '/admin/assignments/new', icon: ClipboardList },
  { title: 'قائمة التقييم', description: 'راجع التسليمات المعلقة', href: '/admin/grading', icon: FileCheck },
  { title: 'إدارة المستخدمين', description: 'أنشئ حسابات الفريق وأسند الأدوار', href: '/admin/users', icon: Users },
];

export function getQuickActions(role: GlobalRole | null): QuickAction[] {
  if (!isStaffRole(role)) return [];
  return ADMIN_QUICK_ACTIONS.filter((action) => canAccessRoute(action.href, role));
}
