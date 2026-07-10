# Admin Dashboard Enhancements - Implementation Tasks

## Overview
Comprehensive enhancement of the Velxo admin dashboard with bulk operations, mass management tools, and streamlined editing workflows.

## Phase 1: Backend - Bulk Operations & Mass Management APIs

### Task 1.1: Extend Admin Service with Bulk Operations
**Status:** Todo
**Priority:** Critical

Create new methods in AdminService for:
- Bulk listing operations (approve, reject, suspend, delete, feature)
- Bulk image upload and assignment
- Bulk seller operations
- Bulk user operations
- Bulk price/inventory updates

**Files to Create/Edit:**
- `backend/src/modules/admin/admin.service.ts` - Add bulk operation methods
- `backend/src/modules/admin/bulk-operations.service.ts` - New service for bulk ops

**Acceptance Criteria:**
- [ ] Bulk approve/reject listings (multiple at once)
- [ ] Bulk suspend/unsuspend listings
- [ ] Bulk feature/unfeature listings
- [ ] Bulk ban/unban users
- [ ] Bulk suspend/unsuspend sellers
- [ ] Bulk delete listings
- [ ] Bulk update listing status with audit logging

### Task 1.2: Create Bulk Image Upload & Assignment API
**Status:** Todo
**Priority:** High

New endpoints for mass image operations:
- Upload images to all listings in category
- Upload images to all listings by seller
- Upload images to all game-specific listings
- Bulk image URL updates
- Image template system for quick assignment

**Files to Create/Edit:**
- `backend/src/modules/admin/image-bulk-operations.service.ts` - New service
- `backend/src/modules/admin/admin.controller.ts` - New endpoints
- `backend/src/common/dtos/bulk-image.dto.ts` - DTOs for bulk image operations

**Acceptance Criteria:**
- [ ] Upload image to all listings endpoint
- [ ] Assign image to listings by category filter
- [ ] Assign image to listings by seller filter
- [ ] Assign image to listings by game filter
- [ ] Bulk update image URLs
- [ ] Track which listings got which images
- [ ] Audit logging for all image operations

### Task 1.3: Advanced Filtering & Search Backend
**Status:** Todo
**Priority:** High

Enhance listing/user/seller queries with advanced filters:
- Multi-filter support (category + status + seller + price range + date range)
- Export filtered results as CSV
- Saved filter templates
- Quick preset filters

**Files to Create/Edit:**
- `backend/src/modules/admin/filters.service.ts` - New service
- `backend/src/common/dtos/advanced-filter.dto.ts` - Filter DTOs

**Acceptance Criteria:**
- [ ] Multi-criteria filtering working
- [ ] Filter templates can be saved
- [ ] CSV export of filtered results
- [ ] Performance optimized (indexed queries)

### Task 1.4: Create Admin Batch Editor Service
**Status:** Todo
**Priority:** High

Service for batch editing listings:
- Bulk edit listing titles/descriptions
- Bulk edit pricing
- Bulk edit inventory levels
- Bulk edit game assignments
- Change log for all edits

**Files to Create/Edit:**
- `backend/src/modules/admin/batch-editor.service.ts` - New service
- `backend/src/modules/admin/admin.controller.ts` - New endpoints

**Acceptance Criteria:**
- [ ] Bulk edit listing properties
- [ ] Change history tracking
- [ ] Audit logging
- [ ] Validation before bulk updates
- [ ] Rollback capability

## Phase 2: Backend - Game Slides & Marquee Management

### Task 2.1: Enhance Slides Management
**Status:** Todo
**Priority:** High

Extend slides service for admin editing:
- Create/edit/delete slides through API
- Bulk image assignment to slides
- Scheduling slides (start/end dates)
- Preview functionality
- A/B testing setup

**Files to Create/Edit:**
- `backend/src/modules/slides/slides.controller.ts` - Create if not exists
- `backend/src/modules/slides/slides.service.ts` - Extend existing service

**Acceptance Criteria:**
- [ ] Admin can create slides
- [ ] Admin can edit slide content & images
- [ ] Admin can reorder slides
- [ ] Admin can schedule slides
- [ ] Admin can preview slides
- [ ] Bulk slide operations working

### Task 2.2: Marquee/News Ticker Backend
**Status:** Todo
**Priority:** Medium

Create marquee management:
- Create/edit/delete marquee messages
- Bulk marquee updates
- Schedule marquee displays
- Preview marquee scrolling text

**Files to Create/Edit:**
- `backend/src/modules/marquee/marquee.service.ts` - New service
- `backend/src/modules/marquee/marquee.controller.ts` - New controller

**Acceptance Criteria:**
- [ ] CRUD operations for marquee items
- [ ] Scheduling functionality
- [ ] Bulk operations
- [ ] Preview endpoints

## Phase 3: Frontend - Advanced Listing Management UI

### Task 3.1: Enhanced Listings Table with Bulk Selection
**Status:** Todo
**Priority:** High

Create advanced listings management page:
- Checkbox selection for multiple listings
- Select all / deselect all
- Bulk action toolbar (approve, reject, suspend, delete, feature)
- Advanced filtering UI
- Column customization
- Sort by any column

**Files to Create/Edit:**
- `frontend/src/app/admin/listings-manager/page.tsx` - New advanced page
- `frontend/src/components/admin/listings-bulk-editor.tsx` - Bulk edit component
- `frontend/src/components/admin/bulk-actions-toolbar.tsx` - Actions toolbar
- `frontend/src/components/admin/advanced-filter-panel.tsx` - Filter UI

**Acceptance Criteria:**
- [ ] Checkbox selection working
- [ ] Bulk actions toolbar visible when items selected
- [ ] Filter panel with 5+ filter options
- [ ] Column sorting
- [ ] Performance optimized (virtualization for large lists)

### Task 3.2: Bulk Image Upload Manager
**Status:** Todo
**Priority:** High

Create dedicated bulk image upload interface:
- Drag & drop multiple images
- Progress tracking for uploads
- Assign images to listings (by filter)
- Preview before/after
- Batch image operations
- Image library/history

**Files to Create/Edit:**
- `frontend/src/app/admin/bulk-image-manager/page.tsx` - New page
- `frontend/src/components/admin/image-upload-zone.tsx` - Upload component
- `frontend/src/components/admin/image-assignment-panel.tsx` - Assignment UI
- `frontend/src/hooks/useImageUpload.ts` - Upload hook

**Acceptance Criteria:**
- [ ] Drag & drop upload working
- [ ] Multiple file selection
- [ ] Progress bars for each file
- [ ] Filter selection for image assignment
- [ ] Preview of affected listings
- [ ] Success confirmation

### Task 3.3: Advanced Listing Editor
**Status:** Todo
**Priority:** High

Create inline/modal editing for listings with powerful features:
- Quick edit mode (title, description, price, inventory)
- Bulk edit selected listings
- Live preview
- Auto-save drafts
- Undo/redo functionality
- Edit history/versioning

**Files to Create/Edit:**
- `frontend/src/components/admin/listing-editor-modal.tsx` - Editor modal
- `frontend/src/components/admin/quick-edit-panel.tsx` - Quick edit toolbar
- `frontend/src/hooks/useListingEditor.ts` - Editor logic

**Acceptance Criteria:**
- [ ] Can edit multiple listings at once
- [ ] Changes preview in real-time
- [ ] Auto-save functionality
- [ ] Edit history accessible
- [ ] Keyboard shortcuts for common actions

## Phase 4: Frontend - Slides & Game Management

### Task 4.1: Slides Editor UI
**Status:** Todo
**Priority:** High

Create comprehensive slides management interface:
- Drag & drop to reorder
- Add/edit/delete slides
- Image upload per slide
- Link/button configuration
- Preview full carousel
- Scheduling UI
- Bulk operations

**Files to Create/Edit:**
- `frontend/src/app/admin/slides-manager/page.tsx` - Redesigned page
- `frontend/src/components/admin/slide-editor.tsx` - Editor component
- `frontend/src/components/admin/carousel-preview.tsx` - Preview component

**Acceptance Criteria:**
- [ ] Drag & drop reordering
- [ ] Add new slides easily
- [ ] Edit all slide properties
- [ ] Image upload per slide
- [ ] Preview carousel
- [ ] Scheduling interface
- [ ] Bulk toggle active/inactive

### Task 4.2: Marquee Manager UI
**Status:** Todo
**Priority:** Medium

Create marquee/news ticker management:
- Add/edit/delete messages
- Text formatting options
- Color/animation settings
- Preview scrolling text
- Bulk message updates
- Schedule display times

**Files to Create/Edit:**
- `frontend/src/app/admin/marquee-manager/page.tsx` - Redesigned page
- `frontend/src/components/admin/marquee-editor.tsx` - Editor component
- `frontend/src/components/admin/marquee-preview.tsx` - Preview component

**Acceptance Criteria:**
- [ ] CRUD interface for messages
- [ ] Live preview of scrolling
- [ ] Formatting options
- [ ] Scheduling UI
- [ ] Bulk operations

## Phase 5: Frontend - Dashboard & Organization

### Task 5.1: Admin Dashboard Redesign
**Status:** Todo
**Priority:** Medium

Enhance main admin dashboard:
- Quick stats cards with drill-down
- Recent activities feed
- Alert center for urgent items
- Quick action buttons
- System health/status indicators

**Files to Create/Edit:**
- `frontend/src/app/admin/page.tsx` - Enhanced dashboard

**Acceptance Criteria:**
- [ ] More detailed stats
- [ ] Activity feed working
- [ ] Alert center functional
- [ ] Quick action shortcuts
- [ ] Status indicators

### Task 5.2: New Admin Sidebar with Tools
**Status:** Todo
**Priority:** Medium

Reorganize admin navigation:
- Add "Bulk Tools" section
- Add "Quick Actions" section
- Collapsible sections for organization
- Search for admin feature
- Favorites/pinning

**Files to Create/Edit:**
- `frontend/src/components/admin/sidebar.tsx` - Enhanced navigation
- `frontend/src/app/admin/layout.tsx` - Update layout

**Acceptance Criteria:**
- [ ] Better organization
- [ ] Quick access to bulk tools
- [ ] Search functionality
- [ ] Favorites system

## Phase 6: Advanced Features

### Task 6.1: Bulk Operations Queue & History
**Status:** Todo
**Priority:** Medium

Create background job processing for large operations:
- Queue system for bulk operations
- Progress tracking
- Retry failed items
- History of all bulk operations
- Export operation logs

**Files to Create/Edit:**
- `backend/src/modules/admin/bulk-queue.service.ts` - Queue service
- `backend/src/modules/admin/bulk-history.service.ts` - History tracking
- `frontend/src/app/admin/bulk-operations-queue/page.tsx` - Queue UI

**Acceptance Criteria:**
- [ ] Bulk operations queued properly
- [ ] Progress tracking working
- [ ] Retry functionality
- [ ] History accessible
- [ ] Performance with large operations

### Task 6.2: Audit & Compliance
**Status:** Todo
**Priority:** High

Enhanced audit logging for bulk operations:
- Detailed audit logs for all admin actions
- Who changed what and when
- Bulk operation audit trail
- Export audit reports
- Compliance reporting

**Files to Create/Edit:**
- `backend/src/modules/admin/audit-bulk-operations.service.ts` - Audit service
- `frontend/src/app/admin/audit-logs/page.tsx` - Enhanced audit UI

**Acceptance Criteria:**
- [ ] All bulk operations logged
- [ ] Audit trail comprehensive
- [ ] Export functionality
- [ ] Search audit logs
- [ ] Compliance reports

### Task 6.3: Admin Notifications & Alerts
**Status:** Todo
**Priority:** Medium

Create notification system for admin:
- Real-time alerts for urgent items
- Bulk operation completion notifications
- System alerts
- Notification preferences
- Notification history

**Files to Create/Edit:**
- `backend/src/modules/admin/admin-notifications.service.ts` - Notification service
- `frontend/src/components/admin/notification-center.tsx` - Notification UI

**Acceptance Criteria:**
- [ ] Real-time notifications working
- [ ] Completion alerts
- [ ] System alerts
- [ ] Preferences saved
- [ ] History accessible

## Testing Requirements

### Backend Tests
- [ ] Unit tests for all new services
- [ ] Integration tests for bulk operations
- [ ] Performance tests for large datasets
- [ ] Audit logging tests

### Frontend Tests
- [ ] Component tests for UI
- [ ] Integration tests for workflows
- [ ] E2E tests for critical paths
- [ ] Performance tests for large lists

### Manual QA
- [ ] Test all bulk operations
- [ ] Test image uploads with large files
- [ ] Test filters and search
- [ ] Test audit logging
- [ ] Test with different screen sizes
