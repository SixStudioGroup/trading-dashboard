# Archivum Security Policy

Archivum stores client and engagement artefacts. Security is a product requirement.

## Default posture

Every client or engagement archive must use a separate private repository. Access is granted at repository level only. Mixed-client storage inside one repository is prohibited.

Archivum v0.1 contains no executable application code, package manager, third-party dependency, CI workflow, deployment configuration, or runtime integration. This deliberately reduces supply-chain exposure.

## Required controls

Repository owners should use multi-factor authentication. Collaborators receive the minimum permission required. Access must be reviewed at engagement start, when team membership changes, at sign-off, and during retention review.

Secrets, API keys, passwords, certificates, access tokens, and connection strings must never be committed.

Repository rules should prevent force pushes and accidental deletion of the default branch. Controlled artefacts should use reviewed commits or pull requests where practical.

GitHub Actions remain disabled unless a future automation release explicitly approves them. Any future workflow must use least-privilege permissions and reviewed dependencies.

## Data classification

Each artefact manifest identifies one classification: Public, Internal, Confidential, or Restricted.

Restricted information requires explicit approval before storage. Sensitive material must not be stored unless the engagement agreement and security design allow it.

## Client separation

One client, one private repository, one access boundary.

A client must never be invited to another client's archive. Templates may be copied from the central Archivum template repo, but client content must never be copied back into templates or examples.

## Incident response

If compromise is suspected, remove affected access, rotate relevant credentials outside the repo, preserve evidence, suspend automation, review the audit trail, notify the Founder / CTO, and follow contractual notification requirements.

## Closure

At engagement closure, access is reviewed, final handover is produced, the repository is made read-only where practical, and the retention or deletion instruction is recorded.

## Reporting

Security concerns should be reported privately to the repository owner. Do not publish sensitive findings in public issues.
