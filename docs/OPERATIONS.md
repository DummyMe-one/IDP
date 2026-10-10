# Operations

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type check
npm run typecheck

# Build for production
npm run build
```

## Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update non-breaking
npm update

# Update specific package
npm install package@latest
```

### Security Audits
```bash
npm audit
npm audit fix
```

## Database Maintenance

### Backups
- Supabase provides automated daily backups (Pro plan)
- Export data manually: `supabase db dump`
- Test restore procedures quarterly

### Migration Process
1. Write migration in `supabase/migrations/`
2. Test locally with `supabase db push`
3. Review RLS policies
4. Deploy to production

## Incident Response

### Suspected Key Compromise
1. Force-lock all affected user vaults
2. Rotate affected project keys
3. Re-encrypt secrets with new keys
4. Create new envelopes for authorized members
5. Audit access logs
6. Notify affected users

### Suspected Database Breach
1. Verify RLS policies are intact
2. Confirm no plaintext secrets in database
3. Rotate Supabase API keys
4. Review audit logs
5. Users should change vault passphrases
6. Ciphertext exposure alone does not compromise secrets

### Frontend Compromise
1. Revoke all active sessions
2. Force vault lock for all users
3. Deploy clean build
4. Investigate attack vector
5. Users must re-enter vault passphrase

## Monitoring

### Key Metrics
- Failed authentication attempts
- Vault unlock failures
- Key rotation status
- Active sessions per user
- Integration sync status

### Alerts
- Multiple failed vault unlock attempts
- Unusual access patterns
- Integration errors
- Certificate expiration

## Security Maintenance

### Regular Tasks
- [ ] Weekly: Review audit logs
- [ ] Monthly: Check dependency vulnerabilities
- [ ] Quarterly: Review RLS policies
- [ ] Quarterly: Test recovery procedures
- [ ] Annually: Review threat model
- [ ] Annually: Penetration testing

### Version Updates
- Keep Supabase client updated
- Update crypto libraries promptly
- Monitor Web Crypto API changes
- Review and update PBKDF2 iteration count
