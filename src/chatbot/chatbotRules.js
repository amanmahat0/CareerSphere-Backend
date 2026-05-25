// Each rule: { keywords: string[], answer: string }
// Keywords are matched case-insensitively against the full user message.
// Rules are evaluated in order — first match wins.

const chatbotRules = [
  // ── Greetings ────────────────────────────────────────────────────────────
  {
    keywords: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "howdy", "greetings"],
    answer:
      "Hello!  Welcome to CareerSphere! I'm CareerBot, your personal assistant for jobs, internships, and career guidance. How can I help you today?",
  },
  {
    keywords: ["help", "what can you do", "what do you do", "how do you work", "chatbot"],
    answer:
      "I can help you with:\n• Registering and logging in\n• Building your resume\n• Applying for jobs and internships\n• Tracking your application status\n• Viewing your interview schedule\n• Password and profile management\n\nJust type your question and I'll do my best to assist!",
  },

  // ── What is CareerSphere ──────────────────────────────────────────────────
  {
    keywords: ["what is careersphere", "about careersphere", "tell me about careersphere", "what does careersphere do"],
    answer:
      "CareerSphere is a placement and internship portal based in Nepal. It connects students and fresh graduates with companies and institutions offering jobs, internships, and traineeships. You can build your resume, apply for opportunities, track your application progress, and receive real-time notifications — all in one place.",
  },

  // ── Registration ──────────────────────────────────────────────────────────
  {
    keywords: ["register", "create account", "sign up", "signup", "new account", "how to join"],
    answer:
      "To create an account on CareerSphere:\n1. Click 'Sign Up' on the homepage.\n2. Choose your role — Student/Applicant or Company/Institution.\n3. Fill in your details and submit.\n4. Check your email to verify your account.\n\nOnce verified, you can log in and start exploring opportunities!",
  },

  // ── Login ─────────────────────────────────────────────────────────────────
  {
    keywords: ["login", "log in", "sign in", "signin", "cannot login", "trouble logging in", "how to access"],
    answer:
      "To log in:\n1. Go to the CareerSphere login page.\n2. Select your role (Applicant or Company).\n3. Enter your registered email and password.\n4. Click 'Login'.\n\nIf you've forgotten your password, click 'Forgot Password' to reset it via email.",
  },

  // ── Forgot / Reset Password ────────────────────────────────────────────────
  {
    keywords: ["forgot password", "reset password", "change password", "password reset", "lost password", "recover password"],
    answer:
      "To reset your password:\n1. Click 'Forgot Password' on the login page.\n2. Enter your registered email address.\n3. Check your inbox for a password reset link.\n4. Click the link and set a new password.\n\nIf you don't receive the email within a few minutes, check your spam folder.",
  },

  // ── Update Profile ────────────────────────────────────────────────────────
  {
    keywords: ["update profile", "edit profile", "change profile", "update my details", "edit my info", "profile settings"],
    answer:
      "To update your profile:\n1. Log in and go to your Dashboard.\n2. Click on your profile picture or 'My Profile'.\n3. Edit the fields you want to update (name, contact, skills, education, etc.).\n4. Save changes.\n\nKeeping your profile complete increases your chances of being shortlisted by employers!",
  },

  // ── Resume Builder ────────────────────────────────────────────────────────
  {
    keywords: ["resume", "build resume", "create resume", "resume builder", "cv", "make resume", "complete profile"],
    answer:
      "To build your resume on CareerSphere:\n1. Log in and go to 'Resume Builder' from your Dashboard.\n2. Fill in your personal information, education, experience, and skills.\n3. Preview your resume and make any adjustments.\n4. Save it — your resume will be attached automatically when you apply.\n\nNote: Your profile must be at least 80% complete before you can apply for opportunities.",
  },

  // ── Apply for Jobs / Internships ──────────────────────────────────────────
  {
    keywords: ["apply", "how to apply", "apply for job", "apply for internship", "submit application", "job application"],
    answer:
      "To apply for a job or internship:\n1. Go to 'Opportunities' and browse available listings.\n2. Click on a listing to view details.\n3. Click 'Apply Now'.\n4. Your saved resume will be submitted automatically.\n\nMake sure your resume/profile is complete before applying — incomplete profiles may not be accepted by employers.",
  },

  // ── Track Application Status ──────────────────────────────────────────────
  {
    keywords: ["track application", "application status", "my application", "application progress", "where is my application", "check application"],
    answer:
      "To track your applications:\n1. Log in and click 'My Applications' in the sidebar.\n2. You'll see all your applications with their current status.\n\nStatus meanings:\n• Applied — your application was received.\n• Shortlisted — the company is interested in you!\n• Interview Scheduled — check your interview schedule.\n• Rejected — unfortunately not selected this time.\n• Offer Sent — you've received a job offer!",
  },

  // ── What does Shortlisted mean ────────────────────────────────────────────
  {
    keywords: ["shortlisted", "what is shortlisted", "shortlist", "shortlisting"],
    answer:
      "'Shortlisted' means the company has reviewed your application and selected you for further consideration. This usually means an interview is coming up soon. Keep an eye on your Notifications and Interview Schedule!",
  },

  // ── What does Rejected mean ──────────────────────────────────────────────
  {
    keywords: ["rejected", "what is rejected", "rejection", "application rejected", "not selected"],
    answer:
      "'Rejected' means the company has decided not to move forward with your application for this particular role. Don't be discouraged — keep your profile updated, work on your resume, and apply to other opportunities on CareerSphere!",
  },

  // ── Interview Schedule ────────────────────────────────────────────────────
  {
    keywords: ["interview schedule", "view interview", "my interview", "interview time", "interview date", "interview link", "when is my interview"],
    answer:
      "To view your interview schedule:\n1. Log in and go to 'Interview Schedule' from your Dashboard or sidebar.\n2. You'll see all upcoming interviews with date, time, mode (online/offline), and the meeting link if applicable.\n\nYou'll also receive a notification when an interview is scheduled.",
  },

  // ── Withdraw Application ──────────────────────────────────────────────────
  {
    keywords: ["withdraw", "cancel application", "remove application", "withdraw application", "take back application"],
    answer:
      "To withdraw an application:\n1. Go to 'My Applications' in your Dashboard.\n2. Find the application you want to withdraw.\n3. Click the 'Withdraw' button.\n\nNote: You can only withdraw an application that hasn't been shortlisted yet. Once shortlisted, please contact the company directly.",
  },

  // ── Upload Documents / Certificates ──────────────────────────────────────
  {
    keywords: ["upload", "certificate", "document", "attach file", "upload document", "upload certificate"],
    answer:
      "To upload documents or certificates:\n1. Go to your Profile from the Dashboard.\n2. Scroll to the Documents or Certificates section.\n3. Click 'Upload' and select your file (PDF or image).\n4. Save your profile.\n\nUploaded documents may be visible to companies when they review your application.",
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  {
    keywords: ["notification", "alerts", "updates", "how do notifications work", "email notification"],
    answer:
      "CareerSphere sends you real-time notifications for important events such as:\n• Application status changes (shortlisted, rejected, offer sent)\n• Interview scheduled or updated\n• New job postings matching your profile\n• System announcements\n\nYou can view all notifications by clicking the bell icon in your Dashboard or visiting 'Notifications' in the sidebar.",
  },

  // ── Types of Opportunities ────────────────────────────────────────────────
  {
    keywords: ["types of jobs", "types of opportunities", "what opportunities", "internship", "traineeship", "part time", "full time", "available jobs"],
    answer:
      "CareerSphere offers three types of opportunities:\n• Full-time Jobs — permanent positions at companies.\n• Internships — short-term learning experiences, great for students.\n• Traineeships — structured training programs offered by institutions.\n\nBrowse all of them in the 'Opportunities' section and filter by type, location, or keyword.",
  },

  // ── Contact Support ───────────────────────────────────────────────────────
  {
    keywords: ["contact", "support", "help desk", "reach out", "contact support", "email support", "contact us"],
    answer:
      "You can reach the CareerSphere support team through:\n• The 'Contact Us' page on the website — fill in the form and we'll get back to you.\n• Email: careersphere67@gmail.com\n\nWe typically respond within 1–2 business days.",
  },

  // ── Company: Post a Job ───────────────────────────────────────────────────
  {
    keywords: ["post job", "create job", "add job", "post internship", "create listing", "add listing", "post opportunity"],
    answer:
      "To post a job or internship (Company/Institution accounts only):\n1. Log in to your Company Dashboard.\n2. Click 'Job Management' or 'Post New Opportunity'.\n3. Fill in the job title, description, requirements, deadline, and type.\n4. Submit — the listing will be visible to applicants immediately.",
  },

  // ── Company: View Applicants ──────────────────────────────────────────────
  {
    keywords: ["view applicants", "see applicants", "who applied", "applicant list", "applications received"],
    answer:
      "To view applicants for your job postings:\n1. Log in to your Company Dashboard.\n2. Go to 'Applications' in the sidebar.\n3. Select a job listing to see all applicants.\n4. Click on an applicant to view their profile and resume.",
  },

  // ── Company: Shortlist / Reject ───────────────────────────────────────────
  {
    keywords: ["shortlist applicant", "reject applicant", "accept applicant", "approve application", "decline application"],
    answer:
      "To shortlist or reject an applicant:\n1. Go to 'Applications' in your Company Dashboard.\n2. Open the applicant's details.\n3. Click 'Shortlist' to move them forward or 'Reject' to decline.\n\nThe applicant will be notified automatically when their status changes.",
  },

  // ── Company: Schedule Interview ───────────────────────────────────────────
  {
    keywords: ["schedule interview", "set interview", "arrange interview", "book interview", "interview scheduling"],
    answer:
      "To schedule an interview:\n1. Go to 'Interviews' in your Company Dashboard.\n2. Select the applicant you want to interview.\n3. Choose the interview type (step), set the date, time, and mode (online/offline).\n4. Add a meeting link if it's online.\n5. Confirm — the applicant will receive a notification automatically.",
  },

  // ── Company: Update / Cancel Interview ───────────────────────────────────
  {
    keywords: ["update interview", "reschedule interview", "cancel interview", "change interview", "modify interview"],
    answer:
      "To update or cancel an interview:\n1. Go to 'Interviews' in your Company Dashboard.\n2. Find the scheduled interview.\n3. Click 'Edit' to reschedule or 'Cancel' to remove it.\n\nThe applicant will be notified of any changes automatically.",
  },

  // ── Company: Account Verification ────────────────────────────────────────
  {
    keywords: ["verify account", "company verification", "get verified", "institution verification", "account approval"],
    answer:
      "Company and institution accounts require verification by the CareerSphere admin before you can post opportunities. After registering:\n1. Complete your company profile fully.\n2. Submit your account for verification.\n3. Our admin team will review and approve within 1–3 business days.\n\nYou'll receive a notification once your account is verified.",
  },
];

export default chatbotRules;
