# Security and safe operation

This is an experimental testing tool, not a security scanner, sandbox or compliance certification.

Use only applications you control or are explicitly authorized to test. Use disposable fixtures and fake accounts. Never point the tool at a production payment workflow, a real medical workflow, or third-party sites without permission.

The suite module executes with the permissions of the Node process. Origin filtering only covers browser requests intercepted by the supplied context router. It does not constrain Node, backend services, WebSockets, APIRequestContext, external processes, or routes installed later by the user. It is not protection against malicious fixture code or DNS rebinding.

Reports are stored locally. Request bodies, cookies, screenshots and traces are not collected by the runner. However, assertion messages and titles may contain data supplied by the caller. Query-string stripping is best-effort only; inspect reports before committing or sharing them.

If you find a vulnerability, avoid public exploit data or secrets. Contact the maintainer privately at hello@ixequiluna.ai with a synthetic reproduction and affected version. The project does not promise a response SLA. No independent security audit has been completed.
