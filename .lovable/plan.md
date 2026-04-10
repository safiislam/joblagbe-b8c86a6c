

# UI/UX Improvement Plan — Full Website

## Current State
The website already has a solid foundation with proper skeleton loading, CMS-driven content, responsive grid layouts, and a cohesive color scheme. The key areas for improvement are around micro-interactions, accessibility, mobile experience, loading states, and navigation clarity.

## Improvement Areas

### 1. Global Smooth Scroll & Page Transitions
- Add `scroll-behavior: smooth` to HTML root
- Add `scroll-margin-top` for anchored sections (to account for sticky header)
- Wrap page transitions with a subtle fade-in animation on route change

### 2. Header UX Improvements
- Add active state highlighting for current nav link (underline or background)
- Improve mobile menu with slide-in animation and overlay backdrop
- Add keyboard accessibility (Escape to close mobile menu)
- Make search input auto-focus when mobile search opens

### 3. Hero Section Polish
- Add staggered animation delays for badge, title, subtitle, and search bar
- Improve search bar with subtle focus ring animation
- Add hover effect on popular tags (scale + shadow)

### 4. Job Cards & Listings
- Add hover lift effect with smooth transform (`translateY(-2px)`)
- Improve touch targets on mobile (minimum 44px tap areas)
- Add empty state illustration when no jobs match filters
- Add loading shimmer animation to skeleton cards
- Improve pagination with "scroll to top" on page change

### 5. Category Grid
- Add hover scale + shadow transition on category cards
- Add subtle gradient backgrounds per category
- Improve mobile touch feedback

### 6. Forms (Login, Signup, PostJob, Contact)
- Add focus-within styling on form groups (label color change)
- Add password strength indicator on signup
- Improve error states with red border + icon
- Add success animations (checkmark) after form submission
- Improve button loading states with spinner + disabled style

### 7. Footer
- Add hover underline transitions on links
- Improve social icon hover effects (scale + color)
- Add "Back to Top" button

### 8. Mobile Bottom Navigation
- Add haptic-style visual feedback on tap (scale pulse)
- Highlight active tab with filled icon + accent color
- Add subtle top border on active item

### 9. Accessibility (a11y)
- Add `focus-visible` ring styles globally for keyboard navigation
- Ensure all interactive elements have proper `aria-label`s
- Add `prefers-reduced-motion` media query to disable animations
- Improve color contrast on muted-foreground text

### 10. Toast & Feedback
- Standardize toast positions (top-center on mobile, bottom-right on desktop)
- Add success/error icons consistently in all toasts

## Technical Details

### Files to modify:
- **`src/index.css`** — Add smooth scroll, focus-visible styles, reduced-motion, shimmer animation, back-to-top utility
- **`src/components/Header.tsx`** — Active nav link, mobile menu animation, keyboard a11y
- **`src/components/HeroSection.tsx`** — Staggered animations, tag hover effects
- **`src/components/JobBoard.tsx`** — Card hover lift, empty state, scroll-to-top on paginate
- **`src/components/CategoryGrid.tsx`** — Hover transitions
- **`src/components/QuickLinks.tsx`** — Hover polish
- **`src/components/Footer.tsx`** — Link hover transitions, back-to-top button
- **`src/components/ServicesSection.tsx`** — Card hover states
- **`src/components/EmployerCTA.tsx`** — Button hover animation
- **`src/pages/Login.tsx`** & **`src/pages/SignUp.tsx`** — Form UX improvements
- **`src/pages/Jobs.tsx`** — Empty state, pagination scroll, filter UX
- **`tailwind.config.ts`** — Add shimmer keyframe, transition utilities

### No database changes needed.

