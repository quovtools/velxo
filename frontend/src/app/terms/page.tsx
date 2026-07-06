import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-black py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-black mb-8">Terms of Service</h1>
          
          <Card className="border-zinc-800 bg-zinc-900/50 p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
              <p className="text-zinc-300 leading-relaxed">
                By accessing and using Velxo, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
              <p className="text-zinc-300 leading-relaxed">
                Permission is granted to temporarily download one copy of the materials on Velxo for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-zinc-300 mt-4 space-y-2">
                <li>Modifying or copying the materials</li>
                <li>Using the materials for any commercial purpose or for any public display</li>
                <li>Attempting to decompile or reverse engineer any software contained on Velxo</li>
                <li>Transferring the materials to another person or "mirror" the materials on any other server</li>
                <li>Removing any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Disclaimer</h2>
              <p className="text-zinc-300 leading-relaxed">
                The materials on Velxo are provided without any representations or warranties, express or implied. Velxo makes no representations or warranties in relation to this website or the information and materials provided.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Limitations of Liability</h2>
              <p className="text-zinc-300 leading-relaxed">
                In no event shall Velxo or its suppliers be liable for any damages including, without limitation, direct, indirect, special, consequential, or incidental damages or damages for lost profits resulting from the use or inability to use the materials on Velxo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Accuracy of Materials</h2>
              <p className="text-zinc-300 leading-relaxed">
                The materials appearing on Velxo could include technical, typographical, or photographic errors. Velxo does not warrant that any of the materials on Velxo are accurate, complete, or current.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Links</h2>
              <p className="text-zinc-300 leading-relaxed">
                Velxo has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Velxo of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Modifications</h2>
              <p className="text-zinc-300 leading-relaxed">
                Velxo may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Governing Law</h2>
              <p className="text-zinc-300 leading-relaxed">
                These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts located in this location.
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
