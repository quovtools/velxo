// Re-export JwtAuthGuard under the SupabaseJwtGuard name so existing imports keep working
// without needing a mass-rename. All auth logic lives in jwt-auth.guard.ts.
export { JwtAuthGuard as SupabaseJwtGuard } from './jwt-auth.guard'
