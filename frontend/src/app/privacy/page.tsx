import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-black py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-black mb-8">Privacy Policy</h1>
          
          <Card className="border-zinc-800 bg-zinc-900/50 p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="text-zinc-300 leading-relaxed">
                Velxo ("we" or "us" or "our") operates the Velxo website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Information Collection and Use</h2>
              <p className="text-zinc-300 leading-relaxed mb-4">
                We collect several different types of information for various purposes to provide and improve our Service to you.
              </p>
              <h3 className="font-bold text-lg mb-2">Types of Data Collected:</h3>
              <ul className="list-disc list-inside text-zinc-300 space-y-2">
                <li><strong>Personal Data:</strong> Name, email address, phone number, payment information</li>
                <li><strong>Usage Data:</strong> Browser type, IP address, pages visited, time and date of visits</li>
                <li><strong>Cookies and Tracking Data:</strong> Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Use of Data</h2>
              <p className="text-zinc-300 leading-relaxed">
                Velxo uses the collected data for various purposes:
              </p>
              <ul className="list-disc list-inside text-zinc-300 mt-4 space-y-2">
                <li>To provide and maintain our Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features of our Service</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information to improve our Service</li>
                <li>To monitor the usage of our Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Security of Data</h2>
              <p className="text-zinc-300 leading-relaxed">
                The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Changes to This Privacy Policy</h2>
              <p className="text-zinc-300 leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "effective date" at the bottom of this page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Contact Us</h2>
              <p className="text-zinc-300 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at privacy@velxo.com.
              </p>
            </section>

            <div className="pt-8 border-t border-zinc-800">
              <p className="text-sm text-zinc-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  )
}
