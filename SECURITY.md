# Security Policy

## Supported Versions

The current `0.1.x` release candidate is the supported line for security fixes.

## Reporting a Vulnerability

Please report suspected vulnerabilities through GitHub Security Advisories for
this repository when available, or by opening a minimal issue that avoids
including secrets, private repository contents, or sensitive logs.

## Scope

`repo-signal-skill` scans local repository files and writes reports to stdout.
It does not call external services, execute target repository scripts, or upload
scan results. Report issues where local file handling, package contents,
redaction boundaries, or generated evidence could expose sensitive data.
