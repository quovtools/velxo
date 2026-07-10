# Quick Start - Admin Dashboard Implementation

## Phase 1: MVP - Core Bulk Operations (Est. 5-7 days)

This is the minimum viable product. Get these working first.

### Step 1: Backend Bulk Operations Service (Day 1)

Create `backend/src/modules/admin/bulk-operations.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { ListingStatus } from '@prisma/client';

@Injectable()
export class BulkOperationsService {
  private readonly logger = new Logger(BulkOperationsService.name);

  constructor(private prisma: PrismaService) {}

  // Bulk approve listings
  async bulkApproveLists(listingIds: string[], adminId: string, reason?: string) {
    this.logger.log(`Bulk approving ${listingIds.length} listings`);
    
    const result = await this.prisma.listings.updateMany({
      where: { id: { in: listingIds } },
      data: {
        status: ListingStatus.ACTIVE,
        moderatedAt: new Date(),
        moderatedBy: adminId,
      },
    });

    // Audit log
    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'BULK_APPROVE_LISTINGS',
        entityType: 'LISTING',
        entityId: 'BULK',
        metadata: {
          count: listingIds.length,
          reason,
          listingIds: listingIds.slice(0, 10), // First 10 for reference
        },
      },
    });

    return { approved: result.count, failed: listingIds.length - result.count };
  }

  // Bulk reject listings
  async bulkRejectListings(listingIds: string[], adminId: string, reason: string) {
    this.logger.log(`Bulk rejecting ${listingIds.length} listings`);
    
    const result = await this.prisma.listings.updateMany({
      where: { id: { in: listingIds } },
      data: {
        status: ListingStatus.REJECTED,
        moderationNotes: reason,
        moderatedAt: new Date(),
        moderatedBy: adminId,
      },
    });

    // Audit log
    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'BULK_REJECT_LISTINGS',
        entityType: 'LISTING',
        entityId: 'BULK',
        metadata: {
          count: listingIds.length,
          reason,
        },
      },
    });

    return { rejected: result.count, failed: listingIds.length - result.count };
  }

  // Bulk suspend listings
  async bulkSuspendListings(listingIds: string[], adminId: string, reason?: string) {
    const result = await this.prisma.listings.updateMany({
      where: { id: { in: listingIds } },
      data: {
        status: ListingStatus.SUSPENDED,
      },
    });

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'BULK_SUSPEND_LISTINGS',
        entityType: 'LISTING',
        entityId: 'BULK',
        metadata: { count: listingIds.length, reason },
      },
    });

    return { suspended: result.count };
  }

  // Bulk feature listings
  async bulkFeatureListings(listingIds: string[], adminId: string, isFeatured: boolean) {
    const result = await this.prisma.listings.updateMany({
      where: { id: { in: listingIds } },
      data: { isFeatured },
    });

    return { updated: result.count };
  }

  // Bulk delete listings
  async bulkDeleteListings(listingIds: string[], adminId: string) {
    const result = await this.prisma.listings.deleteMany({
      where: { id: { in: listingIds } },
    });

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'BULK_DELETE_LISTINGS',
        entityType: 'LISTING',
        entityId: 'BULK',
        metadata: { count: listingIds.length },
      },
    });

    return { deleted: result.count };
  }
}
```

### Step 2: Add Endpoints to Admin Controller (Day 1)

Update `backend/src/modules/admin/admin.controller.ts`:

```typescript
// Add to existing controller

@Post('listings/bulk/approve')
@UseGuards(AdminPasswordGuard)
async bulkApproveLists(
  @Body('listingIds') listingIds: string[],
  @Body('reason') reason?: string,
  @CurrentUserId() adminId: string = 'admin-console',
) {
  const result = await this.bulkOpsService.bulkApproveLists(listingIds, adminId, reason);
  return ApiResponseDto.ok(result, `Approved ${result.approved} listings`);
}

@Post('listings/bulk/reject')
@UseGuards(AdminPasswordGuard)
async bulkRejectListings(
  @Body('listingIds') listingIds: string[],
  @Body('reason') reason: string,
  @CurrentUserId() adminId: string = 'admin-console',
) {
  const result = await this.bulkOpsService.bulkRejectListings(listingIds, adminId, reason);
  return ApiResponseDto.ok(result, `Rejected ${result.rejected} listings`);
}

@Patch('listings/bulk/suspend')
@UseGuards(AdminPasswordGuard)
async bulkSuspendListings(
  @Body('listingIds') listingIds: string[],
  @Body('reason') reason?: string,
  @CurrentUserId() adminId: string = 'admin-console',
) {
  const result = await this.bulkOpsService.bulkSuspendListings(listingIds, adminId, reason);
  return ApiResponseDto.ok(result, `Suspended ${result.suspended} listings`);
}

@Patch('listings/bulk/feature')
@UseGuards(AdminPasswordGuard)
async bulkFeatureLists(
  @Body('listingIds') listingIds: string[],
  @Body('isFeatured') isFeatured: boolean,
  @CurrentUserId() adminId: string = 'admin-console',
) {
  const result = await this.bulkOpsService.bulkFeatureListings(listingIds, adminId, isFeatured);
  return ApiResponseDto.ok(result, `Updated ${result.updated} listings`);
}

@Delete('listings/bulk/delete')
@UseGuards(AdminPasswordGuard)
async bulkDeleteListings(
  @Body('listingIds') listingIds: string[],
  @CurrentUserId() adminId: string = 'admin-console',
) {
  const result = await this.bulkOpsService.bulkDeleteListings(listingIds, adminId);
  return ApiResponseDto.ok(result, `Deleted ${result.deleted} listings`);
}
```

### Step 3: Frontend Bulk Listing Manager (Day 2-3)

Create `frontend/src/app/admin/listings-manager/page.tsx`:

```tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Check, X, AlertCircle, Trash2, Star } from 'lucide-react';
import { api } from '@/lib/api';

interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  isFeatured: boolean;
  seller?: { user?: { name: string } };
  images?: string[];
  createdAt: string;
}

export default function ListingsManagerPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  // Toggle selection
  const toggleSelection = useCallback((id: string) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  // Select all
  const toggleSelectAll = useCallback(() => {
    if (selected.size === listings.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(listings.map(l => l.id)));
    }
  }, [listings, selected.size]);

  // Bulk approve
  const handleBulkApprove = async () => {
    if (selected.size === 0) return;
    setActionInProgress(true);
    try {
      const res = await api.post('/admin/listings/bulk/approve', {
        listingIds: Array.from(selected),
        reason,
      });
      alert(`Approved ${res.data.approved} listings`);
      setSelected(new Set());
      // Refresh listings
    } catch (err) {
      alert('Error approving listings');
    } finally {
      setActionInProgress(false);
    }
  };

  // Bulk reject
  const handleBulkReject = async () => {
    if (selected.size === 0 || !reason) {
      alert('Please enter a rejection reason');
      return;
    }
    setActionInProgress(true);
    try {
      const res = await api.post('/admin/listings/bulk/reject', {
        listingIds: Array.from(selected),
        reason,
      });
      alert(`Rejected ${res.data.rejected} listings`);
      setSelected(new Set());
      setReason('');
    } catch (err) {
      alert('Error rejecting listings');
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Listings Manager</h1>
        <p className="text-gray-400">Manage, edit, and bulk update listings</p>
      </div>

      {/* Bulk Actions Toolbar */}
      {selected.size > 0 && (
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
          <p className="text-white mb-4">
            {selected.size} listing{selected.size !== 1 ? 's' : ''} selected
          </p>
          
          <div className="space-y-4">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for action (required for reject)"
              className="w-full bg-background border border-borderBg rounded px-3 py-2 text-white"
            />
            
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleBulkApprove}
                disabled={actionInProgress}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50 text-white"
              >
                <Check size={18} /> Approve
              </button>
              
              <button
                onClick={handleBulkReject}
                disabled={actionInProgress || !reason}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded disabled:opacity-50 text-white"
              >
                <X size={18} /> Reject
              </button>
              
              <button
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded disabled:opacity-50 text-white"
              >
                <AlertCircle size={18} /> Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listings Table */}
      <div className="bg-cardBg border border-borderBg rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-background border-b border-borderBg">
            <tr>
              <th className="p-4">
                <input
                  type="checkbox"
                  checked={selected.size === listings.length && listings.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="p-4 text-left text-white font-semibold">Title</th>
              <th className="p-4 text-left text-white font-semibold">Price</th>
              <th className="p-4 text-left text-white font-semibold">Status</th>
              <th className="p-4 text-left text-white font-semibold">Seller</th>
              <th className="p-4 text-left text-white font-semibold">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderBg">
            {listings.map(listing => (
              <tr key={listing.id} className="hover:bg-background/50">
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selected.has(listing.id)}
                    onChange={() => toggleSelection(listing.id)}
                    className="rounded"
                  />
                </td>
                <td className="p-4 text-white truncate">{listing.title}</td>
                <td className="p-4 text-gray-300">${listing.price}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    listing.status === 'ACTIVE' ? 'bg-green-600/30 text-green-300' :
                    listing.status === 'PENDING_APPROVAL' ? 'bg-yellow-600/30 text-yellow-300' :
                    'bg-red-600/30 text-red-300'
                  }`}>
                    {listing.status}
                  </span>
                </td>
                <td className="p-4 text-gray-300">{listing.seller?.user?.name || '—'}</td>
                <td className="p-4 text-gray-400 text-sm">
                  {new Date(listing.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Step 4: Update Admin Module (Day 1)

Update `backend/src/modules/admin/admin.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BulkOperationsService } from './bulk-operations.service';
import { PrismaService } from '@/common/services/prisma.service';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { SellersModule } from '@/modules/sellers/sellers.module';

@Module({
  controllers: [AdminController],
  providers: [AdminService, BulkOperationsService, PrismaService],
  exports: [AdminService, BulkOperationsService],
  imports: [NotificationsModule, SellersModule],
})
export class AdminModule {}
```

### Step 5: Add Navigation Link (Day 1)

Update `frontend/src/app/admin/layout.tsx` to add listings manager:

```tsx
// In the navItems array, update or add:
{ href: '/admin/listings-manager', label: 'Listings Manager', icon: ShoppingBag },
```

---

## Phase 2: Image Bulk Operations (Est. 3-4 days)

### Step 1: Image Bulk Operations Service (Day 1)

Create `backend/src/modules/admin/image-bulk-operations.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';

@Injectable()
export class ImageBulkOperationsService {
  private readonly logger = new Logger(ImageBulkOperationsService.name);

  constructor(private prisma: PrismaService) {}

  async bulkUpdateListingImages(
    imageUrls: string[],
    filter: {
      categoryId?: string;
      sellerId?: string;
      gameName?: string;
      status?: string;
    },
    adminId: string,
    assignmentStrategy: 'rotate' | 'all' | 'first' = 'rotate',
  ) {
    // Find matching listings
    const matchedListings = await this.prisma.listings.findMany({
      where: {
        ...(filter.categoryId && { categoryId: filter.categoryId }),
        ...(filter.sellerId && { sellerId: filter.sellerId }),
        ...(filter.gameName && { gameName: filter.gameName }),
        ...(filter.status && { status: filter.status }),
      },
      select: { id: true, images: true },
    });

    this.logger.log(`Found ${matchedListings.length} matching listings`);

    let updated = 0;
    let failed = 0;

    // Assign images based on strategy
    for (let i = 0; i < matchedListings.length; i++) {
      try {
        let newImages: string[] = [];

        if (assignmentStrategy === 'all') {
          newImages = imageUrls;
        } else if (assignmentStrategy === 'first') {
          newImages = [imageUrls[0]];
        } else if (assignmentStrategy === 'rotate') {
          newImages = [imageUrls[i % imageUrls.length]];
        }

        await this.prisma.listings.update({
          where: { id: matchedListings[i].id },
          data: { images: newImages },
        });
        updated++;
      } catch (err) {
        this.logger.error(`Failed to update listing ${matchedListings[i].id}`, err);
        failed++;
      }
    }

    // Audit log
    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'BULK_UPDATE_IMAGES',
        entityType: 'LISTING',
        entityId: 'BULK',
        metadata: {
          matched: matchedListings.length,
          updated,
          failed,
          strategy: assignmentStrategy,
          filter,
        },
      },
    });

    return { matched: matchedListings.length, updated, failed };
  }
}
```

### Step 2: Add Image Endpoints (Day 1)

Update admin controller with:

```typescript
@Post('listings/bulk/update-images')
@UseGuards(AdminPasswordGuard)
async bulkUpdateImages(
  @Body('imageUrls') imageUrls: string[],
  @Body('filter') filter: any,
  @Body('strategy') strategy: string = 'rotate',
  @CurrentUserId() adminId: string = 'admin-console',
) {
  const result = await this.imageBulkOpsService.bulkUpdateListingImages(
    imageUrls,
    filter,
    adminId,
    strategy as any,
  );
  return ApiResponseDto.ok(result, `Updated images for ${result.updated} listings`);
}
```

### Step 3: Frontend Image Manager (Day 2-3)

Create `frontend/src/app/admin/bulk-image-manager/page.tsx` with drag & drop upload, filter selection, and preview.

---

## Implementation Checklist

- [ ] Phase 1 - Bulk Operations
  - [ ] BulkOperationsService
  - [ ] Admin Controller endpoints
  - [ ] Frontend Listings Manager UI
  - [ ] Navigation link
  - [ ] Test bulk approve/reject/suspend
  
- [ ] Phase 2 - Image Operations
  - [ ] ImageBulkOperationsService
  - [ ] Image endpoints
  - [ ] Frontend bulk image manager
  - [ ] Test image assignment

- [ ] Phase 3 - Advanced Features
  - [ ] Advanced filtering
  - [ ] Batch editor
  - [ ] Slides manager
  - [ ] Marquee manager

## Testing Recommendations

1. Create test listings with different statuses
2. Test bulk operations on small sets (5-10 items)
3. Test with filters
4. Check audit logs are created
5. Verify images are assigned correctly
6. Test error handling with invalid IDs

## Performance Tips

- Limit bulk operations to 1000 items max per request
- Use pagination for listing queries
- Index on status, categoryId, sellerId for filter queries
- Consider async processing for very large operations (queue them)

---

Next Steps: Once Phase 1 MVP is working, I can help build out the more advanced features.
