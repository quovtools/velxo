// FIX #13: Removed re-export of WalletsModule (dead duplicate of WalletModule).
// WalletsModule is never imported by AppModule and exporting it from the barrel
// caused confusing import resolution. Use WalletModule from wallet.module.ts.
export * from './wallet.service'
export * from './wallet.controller'
export * from './wallet.module'
