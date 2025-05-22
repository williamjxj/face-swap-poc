'use client'

export default function TermsAndConditions() {
  return (
    <main className="flex-grow p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Acceptance of Terms</h2>
        <p className="mb-4">
          By accessing or using our services, you agree to be bound by these Terms. If you disagree
          with any part of the terms, you may not access the service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">User Responsibilities</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>You must be at least 13 years of age to use this service</li>
          <li>You are responsible for maintaining the confidentiality of your account</li>
          <li>You agree not to use the service for any illegal purpose</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Intellectual Property</h2>
        <p>
          The service and its original content, features and functionality are and will remain the
          exclusive property of the company and its licensors.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Termination</h2>
        <p>
          We may terminate or suspend your account immediately, without prior notice or liability,
          for any reason whatsoever, including without limitation if you breach the Terms.
        </p>
      </section>
    </main>
  )
}
