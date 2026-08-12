# Security

This app has no backend, no database, and no user accounts. Nothing a visitor
enters is stored on a server we control — RSVPs and inquiries are emailed
through FormSubmit.co, and everything else stays in the visitor's own browser
under a single `localStorage` key.

If you find a vulnerability, email **contact@millersmarketinggroup.com** rather
than opening a public issue. Please include the page, the steps, and what an
attacker could do with it.

Do not include real attendee names, emails, or phone numbers in issues or pull
requests. Use the fictional sample data already in `content/`.
