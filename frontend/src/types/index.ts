export type Listing = { id: string; title: string; price: number; gameName: string; status: string; images: string[] }
export type Order = { id: string; orderNumber: string; totalAmount: number; status: string; createdAt: string }
export type User = { id: string; email: string; firstName?: string; lastName?: string; role: string }
