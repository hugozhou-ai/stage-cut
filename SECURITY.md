# Security Policy

Security fixes are provided for the latest stable release and the current prerelease line.

Do not open a public issue for a suspected vulnerability. Use GitHub's private vulnerability reporting for `hugozhou-ai/stage-cut`. Include affected versions, reproduction steps, impact, and any suggested mitigation. Maintainers will acknowledge a complete report within five business days and coordinate disclosure after a fix is available.

Stagecut renders application-owned React components. It does not evaluate source code from project JSON. Consumers remain responsible for validating untrusted text before using APIs such as `dangerouslySetInnerHTML` inside their own Surface components.
