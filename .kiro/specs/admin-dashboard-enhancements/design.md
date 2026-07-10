# Admin Dashboard Enhancements - Design Document

## Architecture Overview

### Core Principles
1. **Ease of Use**: Admin should accomplish tasks in minimal clicks
2. **Safety**: All bulk operations are logged and can be reviewed
3. **Performance**: Handle large datasets efficiently
4. **Scalability**: Design supports growth in listings/users

## Module Structure

### Backend Architecture

```
backend/src/modules/admin/
├── admin.controller.ts          (Updated with new endpoints)
├── admin.service.ts             (Core admin functions)
├── bulk-operations.service.ts   (Bulk CRUD operations)
├── image-bulk-operations.service.ts (Mass image management)
├── batch-editor.service.ts      (Batch property editing)
├── filters.service.ts           (Advanced filtering)
├── bulk-queue.service.ts        (Job queue for large ops)
└── admin.module.ts              (Module config)

backend/src/modules/slides/
├── slides.controller.ts         (Admin slide endpoints)
├── slides.service.ts            (Extend existing)

backend/src/modules/marquee/
├── marquee.service.ts          (New marquee service)
├── marquee.controller.ts        (New marquee endpoints)

frontend/src/app/admin/
├── listings-manager/page.tsx    (Advanced listings UI)
├── bulk-image-manager/page.tsx  (Bulk image upload)
├── slides-manager/page.tsx      (Slides editor)
├── marquee-manager/page.tsx     (Marquee editor)
└── bulk-operations-queue/page.tsx (Queue/history)

frontend/src/components/admin/
├── listings-bulk-editor.tsx     (Bulk editing component)
├── bulk-actions-toolbar.tsx     (Action buttons)
├── advanced-filter-panel.tsx    (Filter UI)
├── image-upload-zone.tsx        (Drag & drop upload)
├── slide-editor.tsx             (Slide editor)
└── marquee-editor.tsx           (Marquee editor)
```

## API Design

### Bulk Listing Operations

```
POST /admin/listings/bulk/approve
{
  listingIds: string[]
  reason?: string (for audit)
}
→ { approved: number, failed: number, auditId: string }

POST /admin/listings/bulk/reject
{
  listingIds: string[]
  reason: string (required)
}
→ { rejected: number, failed: number, auditId: string }

PATCH /admin/listings/bulk/suspend
{
  listingIds: string[]
  reason?: string
}
→ { suspended: number, failed: number }

DELETE /admin/listings/bulk/delete
{
  listingIds: string[]
}
→ { deleted: number, failed: number }

PATCH /admin/listings/bulk/feature
{
  listingIds: string[]
  isFeatured: boolean
}
→ { updated: number, failed: number }
```

### Bulk Image Operations

```
POST /admin/listings/bulk/upload-images
{
  imageUrls: string[]           (or base64 data)
  filterBy: {
    categoryId?: string
    sellerId?: string
    gameName?: string
    status?: ListingStatus
  }
  assignmentStrategy: 'rotate' | 'all' | 'first'  (how to assign)
}
→ { 
  matched: number
  assigned: number
  failed: number
  auditId: string
}

POST /admin/listings/bulk/update-image-urls
{
  updates: Array<{
    listingId: string
    imageUrls: string[]
  }>
}
→ { successful: number, failed: number }

POST /admin/listings/images/bulk-upload
[FormData with multiple files]
→ { 
  files: Array<{ filename: string, url: string }>
  uploadId: string
}
```

### Advanced Filtering

```
GET /admin/listings/search
?filter=category:GAMES&filter=status:ACTIVE&filter=price:0-1000&filter=seller:SELLER_ID
&sort=createdAt:desc&limit=50&offset=0

GET /admin/listings/export-filtered
?filter=category:GAMES&format=csv
→ CSV file download

GET /admin/filter-templates
→ [{ id, name, filters, createdBy, createdAt }]

POST /admin/filter-templates
{ name: string, filters: object }
→ { id: string }
```

### Batch Editing

```
PATCH /admin/listings/bulk/edit-properties
{
  listingIds: string[]
  updates: {
    title?: string
    description?: string
    price?: number
    inventory?: number
    gameName?: string
    region?: string
    platform?: string
  }
}
→ { updated: number, failed: number, changeId: string }

GET /admin/batch-edits/history
?limit=50
→ [{ id, editor, timestamp, changes, listingCount }]
```

### Slides & Marquee

```
POST /admin/slides
{ title, subtitle, imageUrl, linkHref, badge, isActive }
→ Slide object

PATCH /admin/slides/:id
{ ...properties }

PATCH /admin/slides/bulk/reorder
{
  slides: Array<{ id: string, sortOrder: number }>
}

GET /admin/marquee
→ [{ id, text, color, animation, isActive, sortOrder }]

POST /admin/marquee
{ text, color?, animation?, isActive, sortOrder }

PATCH /admin/marquee/:id
```

## Database Schema Extensions

### New Tables

```prisma
model BulkOperation {
  id                String @id @default(cuid())
  adminId           String
  operationType     String  // 'APPROVE', 'REJECT', 'SUSPEND', etc.
  entityType        String  // 'LISTING', 'USER', 'SELLER'
  filter            Json    // How items were selected
  itemCount         Int     // Number of items affected
  successCount      Int
  failureCount      Int
  status            String  // 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
  startedAt         DateTime
  completedAt       DateTime?
  errors            Json?   // List of failed items
  createdAt         DateTime @default(now())
  
  @@index([adminId])
  @@index([status])
  @@index([createdAt])
}

model BulkImageOperation {
  id                String @id @default(cuid())
  adminId           String
  imageUrls         String[]
  filterBy          Json
  assignmentStrategy String
  listingsMatched   Int
  listingsUpdated   Int
  failureCount      Int
  createdAt         DateTime @default(now())
  
  @@index([adminId])
  @@index([createdAt])
}

model AdminFilterTemplate {
  id                String @id @default(cuid())
  name              String
  createdBy         String
  filters           Json
  description       String?
  isPublic          Boolean @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([name, createdBy])
  @@index([createdBy])
}

model Marquee {
  id                String @id @default(cuid())
  text              String
  color             String? @default("#ffffff")
  animation         String? @default("scroll")
  isActive          Boolean @default(true)
  sortOrder         Int
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

## Frontend Component Design

### Listings Bulk Editor

```tsx
<ListingsBulkEditor>
  ├─ Selection Controls
  │  ├─ Checkbox (select all)
  │  ├─ Item count badge
  │  └─ Clear selection button
  │
  ├─ Listings Table
  │  ├─ Checkbox column
  │  ├─ Image thumbnail
  │  ├─ Title / Description preview
  │  ├─ Status badge
  │  ├─ Price
  │  ├─ Seller name
  │  ├─ Date created
  │  └─ Individual action menu
  │
  └─ Bulk Actions Toolbar
     ├─ Approve button
     ├─ Reject button
     ├─ Suspend button
     ├─ Feature button
     ├─ Delete button
     └─ Edit properties button
```

### Bulk Image Manager

```tsx
<BulkImageManager>
  ├─ Upload Section
  │  ├─ Drag & drop zone
  │  ├─ File input
  │  └─ Progress bars
  │
  ├─ Assignment Section
  │  ├─ Category filter
  │  ├─ Seller filter
  │  ├─ Game filter
  │  ├─ Assignment strategy selector
  │  └─ Preview of affected listings
  │
  └─ History Section
     ├─ Previous uploads
     ├─ Assignment details
     └─ Undo/retry options
```

### Advanced Filter Panel

```tsx
<AdvancedFilterPanel>
  ├─ Category filter
  ├─ Status filter (checkboxes)
  ├─ Seller filter (search)
  ├─ Price range slider
  ├─ Date range picker
  ├─ Game filter (checkboxes)
  ├─ Region/Platform filters
  ├─ Featured/Suspended toggles
  │
  └─ Actions
     ├─ Apply filters button
     ├─ Clear filters button
     ├─ Save as template
     └─ Export results (CSV)
```

### Slides Editor

```tsx
<SlidesEditor>
  ├─ Slide List (draggable)
  │  ├─ Drag handle
  │  ├─ Slide thumbnail
  │  ├─ Slide title
  │  ├─ Active toggle
  │  └─ Delete button
  │
  ├─ Slide Editor Panel
  │  ├─ Title input
  │  ├─ Subtitle input
  │  ├─ Image upload
  │  ├─ Link input
  │  ├─ Badge input
  │  ├─ Schedule (start/end date)
  │  └─ Active toggle
  │
  └─ Preview Section
     └─ Carousel preview
```

## Workflow Examples

### Bulk Approve Listings

1. Navigate to Listings Manager
2. Apply filters (e.g., Status: Pending Approval)
3. Click "Select All" or manually select listings
4. Click "Approve" in bulk toolbar
5. Confirm action
6. View progress
7. See success/fail counts
8. Check audit log

### Mass Upload Images

1. Navigate to Bulk Image Manager
2. Drag & drop images (or select files)
3. Set assignment strategy (Rotate, All, First)
4. Set filter (e.g., Category: GAMES, Status: ACTIVE)
5. Preview affected listings
6. Click "Assign Images"
7. View progress
8. See results and any failures
9. Option to retry failed assignments

### Edit Multiple Listings

1. Listings Manager → Select listings
2. Click "Edit Properties"
3. Modal opens with batch edit form
4. Select properties to update (Title, Price, Inventory, etc.)
5. Enter new values
6. Preview changes
7. Confirm and submit
8. See progress
9. Review changes in history

### Manage Slides

1. Navigate to Slides Manager
2. Existing slides shown as draggable cards
3. Drag to reorder
4. Click slide to edit content/image
5. Click + to add new slide
6. Set schedule dates if needed
7. Preview full carousel
8. Click Save

## Performance Considerations

### Database Optimization
- Indexed queries for filtering
- Pagination for large datasets (default 50, max 500)
- Count queries before bulk operations

### Frontend Optimization
- Virtual scrolling for large tables (1000+ rows)
- Lazy load images in thumbnails
- Debounce filter changes
- Pagination instead of loading all items

### API Optimization
- Batch endpoints for bulk operations
- Async processing for large operations (queue them)
- Progress polling for long-running operations
- Gzip response compression

## Security & Audit

### Access Control
- All admin endpoints require `AdminPasswordGuard`
- Add role-based access levels (SuperAdmin > Admin > Moderator)
- Restrict certain operations to SuperAdmin only

### Audit Logging
- Log all bulk operations with:
  - Admin who performed action
  - Type of operation
  - Number of items affected
  - Filter used
  - Timestamp
  - Items that failed
- Log all image uploads (who, when, how many)
- Export audit reports for compliance

### Data Safety
- Bulk operations are reversible where possible
- Change history kept for batch edits
- Soft delete initially (30-day retention)
- Confirmation required for destructive operations

## UI/UX Principles

### Clarity
- Show item count before bulk operations
- Provide preview of changes
- Clear success/error messages

### Speed
- Keyboard shortcuts for common actions
- Quick filter presets
- One-click actions where safe
- Drag & drop where applicable

### Safety
- Confirm destructive operations
- Show impact count before proceeding
- Undo capability where possible
- Audit trail always accessible

## Migration Path

### Phase 1: MVP (Week 1-2)
- Basic bulk operations (approve, reject, suspend)
- Simple filtering
- Basic image upload

### Phase 2: Enhancements (Week 2-3)
- Advanced filtering
- Batch editing
- Bulk image assignment
- Slides management

### Phase 3: Polish (Week 3-4)
- Performance optimization
- Bulk operation queue
- Audit log UI
- Admin notifications

### Phase 4: Advanced (Week 4+)
- Scheduling system
- A/B testing setup
- Advanced analytics
- Automation rules

## Success Metrics

- Admin can approve 100 listings in < 2 minutes
- Bulk image upload for 50 listings < 5 minutes
- Filter + bulk operation workflow < 3 clicks
- 100% audit trail coverage
- 0 accidental data loss
- Admin satisfaction score > 4.5/5
