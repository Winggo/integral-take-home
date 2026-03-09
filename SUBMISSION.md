# Submission Questions

Total time spent: ~3.5 hours

What I prioritized:
- Core requirements, which consisted of:
  - User login
  - Patient intake application
  - Page for reviewers to review applications
  - Redacting intake data, and only showing full data for approved applications
  - Logging events for audit trail
Without these features, the app would not be functional.

What I would improve with more time:
- More testing with multiple patients/reviewers
- Redaction of sensitive fields is currently fully done in the frontend, which is not secure. With more time, I'd add a new API endpoint for fetching redacted data.
- Enabling email notifications upon application status updates
- Real-time updates for reviewers to see status changes
- More robust authentication system
