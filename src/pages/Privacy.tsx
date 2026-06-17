import React from "react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans px-6 py-12 max-w-3xl mx-auto">
      <div className="mb-8">
        <a href="/" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">← Back to Violet</a>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🌸</span>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Privacy Policy</h1>
      </div>
      <p className="text-xs text-zinc-400 mb-8">Last updated: June 17, 2026</p>

      <div className="space-y-6 text-sm text-zinc-700 leading-relaxed">
        <section>
          <h2 className="font-bold text-zinc-900 mb-2">1. Information We Collect</h2>
          <p>We collect information you provide directly (name, email, career profile data) and information generated through use of the Service (job applications, email analyses, AI interactions).</p>
        </section>

        <section>
          <h2 className="font-bold text-zinc-900 mb-2">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide, operate, and improve the Service</li>
            <li>To personalize AI recommendations and career insights</li>
            <li>To communicate with you about your account</li>
            <li>To ensure security and prevent abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-zinc-900 mb-2">3. Data Storage</h2>
          <p>Your data is stored securely using Appwrite cloud infrastructure. Career profile data, applications, and memory vault entries are stored in your private account and are not shared with other users.</p>
        </section>

        <section>
          <h2 className="font-bold text-zinc-900 mb-2">4. Third-Party Services</h2>
          <p>Violet integrates with third-party services including Google OAuth (authentication), LLM providers (AI features), Composio (workflow automation), and Telegram (notifications). Each service is governed by its own privacy policy.</p>
        </section>

        <section>
          <h2 className="font-bold text-zinc-900 mb-2">5. AI and LLM Processing</h2>
          <p>Content you submit for AI processing (job descriptions, resume data, emails) may be sent to LLM providers (OpenRouter, Nvidia NIM, etc.) to generate responses. We do not sell this data. Refer to your configured LLM provider's privacy policy for their data handling practices.</p>
        </section>

        <section>
          <h2 className="font-bold text-zinc-900 mb-2">6. Cookies</h2>
          <p>We use session cookies to maintain your authenticated state. We do not use tracking or advertising cookies.</p>
        </section>

        <section>
          <h2 className="font-bold text-zinc-900 mb-2">7. Your Rights</h2>
          <p>You may request deletion of your account and associated data at any time by contacting us. You can export your career data from the Memory Vault and Profile sections of the app.</p>
        </section>

        <section>
          <h2 className="font-bold text-zinc-900 mb-2">8. Data Retention</h2>
          <p>We retain your data for as long as your account is active. Upon account deletion, your data is permanently removed within 30 days.</p>
        </section>

        <section>
          <h2 className="font-bold text-zinc-900 mb-2">9. Contact</h2>
          <p>For privacy inquiries, contact <a href="mailto:privacy@violet.app" className="text-zinc-900 underline">privacy@violet.app</a>.</p>
        </section>
      </div>
    </div>
  );
}
