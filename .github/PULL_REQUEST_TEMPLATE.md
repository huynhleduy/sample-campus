## Summary

Describe the user-facing and technical intent of this change.

## Scope

- [ ] Application code
- [ ] Database migration
- [ ] CI/CD or workflow automation
- [ ] Release process or deploy adapter
- [ ] Docs only

## Validation

- [ ] `yarn lint`
- [ ] `yarn build:with-tests --noEmit`
- [ ] `yarn test`
- [ ] Docker smoke check when packaging changed

## Release Impact

- [ ] Safe for normal release queue
- [ ] Needs `release:hold`
- [ ] Needs `release:hotfix`
- [ ] Requires manual migration or operator action
- [ ] Has rollback plan documented below

## Rollback Plan

State how this change is reverted or neutralized if production behavior is not acceptable.

## Notes For Reviewers

Anything high-risk, irreversible, or intentionally deferred.
