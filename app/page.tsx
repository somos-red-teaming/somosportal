import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { EyeOff, Users, Flag, BarChart3, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section — split layout: text left, illustration right */}
      <section className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 py-20 md:grid-cols-2 md:gap-16 md:py-24 lg:py-32">
        <div className="flex flex-col gap-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-700 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-700"></span>
            </span>
            Public Beta Now Live
          </div>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Help Shape the Future of AI Governance
          </h1>

          <p className="max-w-xl font-serif text-lg text-muted-foreground md:text-xl">
            Join a global community testing AI models for safety, bias, and accountability. Your voice matters in building trustworthy technology.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/register">
                Start Testing AI Models
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="#learn-more">Learn More</Link>
            </Button>
          </div>
        </div>

        <div className="hidden items-center justify-center md:flex">
          <Image
            src="/illustrations/grafismo-5-green.svg"
            alt="SOMOS grafismo illustration"
            width={400}
            height={400}
            className="h-auto w-full max-w-[400px]"
            aria-hidden="true"
            priority
          />
        </div>
      </section>

      {/* Why Participate — Color-coded feature cards */}
      <section id="learn-more" className="border-t border-border bg-card py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              Why Participate?
            </h2>
            <p className="font-serif text-lg text-muted-foreground">
              Be part of the movement to make AI safer and more accountable.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Gold card */}
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-primary p-7 dark:bg-[#3D3520]">
              <EyeOff className="h-7 w-7" />
              <h3 className="text-lg font-bold">Blind Testing</h3>
              <p className="font-serif text-sm leading-relaxed opacity-85">
                Test AI models without knowing which one you&apos;re interacting with, removing bias from evaluations.
              </p>
            </div>

            {/* Sage card */}
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-accent p-7">
              <Users className="h-7 w-7" />
              <h3 className="text-lg font-bold">Community Driven</h3>
              <p className="font-serif text-sm leading-relaxed opacity-85">
                Join deliberation spaces where diverse voices shape the standards for AI accountability.
              </p>
            </div>

            {/* Peach card */}
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-peach p-7">
              <Flag className="h-7 w-7" />
              <h3 className="text-lg font-bold">Flag Risks</h3>
              <p className="font-serif text-sm leading-relaxed opacity-85">
                Report harmful content, misinformation, and bias with structured guidelines that lead to real change.
              </p>
            </div>

            {/* Mauve card */}
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-mauve p-7">
              <BarChart3 className="h-7 w-7" />
              <h3 className="text-lg font-bold">Data-Driven Analysis</h3>
              <p className="font-serif text-sm leading-relaxed opacity-85">
                Contribute to evidence-based research that informs policy and drives meaningful AI safety improvements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — Steps with large gold numbers */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              How It Works
            </h2>
            <p className="font-serif text-lg text-muted-foreground">
              Four simple steps to start contributing to AI governance.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-7">
              <span className="text-5xl font-bold leading-none text-primary">01</span>
              <h3 className="text-lg font-semibold">Choose an Exercise</h3>
              <p className="font-serif text-sm leading-relaxed text-muted-foreground">
                Browse active exercises covering topics like election integrity, bias detection, and climate information.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-7">
              <span className="text-5xl font-bold leading-none text-primary">02</span>
              <h3 className="text-lg font-semibold">Test AI Models Blindly</h3>
              <p className="font-serif text-sm leading-relaxed text-muted-foreground">
                Interact with anonymized AI models and follow structured testing guidelines to identify issues.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-7">
              <span className="text-5xl font-bold leading-none text-primary">03</span>
              <h3 className="text-lg font-semibold">Flag Issues</h3>
              <p className="font-serif text-sm leading-relaxed text-muted-foreground">
                Report harmful content, misinformation, bias, or other concerns with detailed annotations.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-7">
              <span className="text-5xl font-bold leading-none text-primary">04</span>
              <h3 className="text-lg font-semibold">See the Impact</h3>
              <p className="font-serif text-sm leading-relaxed text-muted-foreground">
                Track how your contributions feed into research and policy recommendations for better AI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to Make AI More Accountable?
            </h2>
            <p className="max-w-xl font-serif text-lg text-muted-foreground">
              Join thousands of citizens, researchers, and policymakers working together to ensure AI serves everyone fairly and transparently.
            </p>
            <Button size="lg" asChild>
              <Link href="/register">
                Join the Platform
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <svg className="h-7 w-auto" viewBox="0 0 346.16 341.06" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="SOMOS">
                  <path d="M251.41,169.55l-75.73.92c-2.9.04-5.45-1.64-6.67-4.36-.63-1.42-.69-3.21-.12-5.25l13.53-75.52c.23-1.28-.62-2.51-1.91-2.74l-14.31-2.56c-1.28-.23-2.51.62-2.74,1.91l-9.02,50.33c-.53,2.95-4.44,3.66-5.97,1.08l-11.92-20.08c-.32-.54-.83-.93-1.45-1.08-.61-.16-1.25-.06-1.79.26l-12.5,7.42c-1.11.67-1.49,2.11-.82,3.24l38.67,65.12c1.48,2.49,1.31,5.54-.44,7.96-.91,1.26-2.43,2.2-4.48,2.72l-72.17,26.04c-.6.22-1.07.65-1.34,1.22-.27.57-.3,1.21-.08,1.8l4.93,13.67c.21.59.65,1.07,1.22,1.34.57.27,1.21.3,1.81.08l45.89-16.56c3.58-1.29,6.85,2.56,4.98,5.88l-10.28,18.32c-.64,1.14-.23,2.58.9,3.21l12.68,7.12c1.14.63,2.57.23,3.21-.91l37.07-66.05c1.42-2.53,4.15-3.91,7.11-3.59,1.55.16,3.12,1,4.6,2.52l58.64,49.48c.85.72,2.07.73,2.93.09.14-.11.28-.23.4-.37l9.37-11.11c.41-.48.6-1.1.55-1.72-.05-.63-.35-1.2-.83-1.6l-37.54-31.67c-2.82-2.38-1.17-6.99,2.52-7.04l21.34-.26c1.3-.01,2.35-1.08,2.33-2.39l-.18-14.53c0-.63-.26-1.22-.72-1.66-.45-.44-1.05-.68-1.68-.67Z"/>
                </svg>
                <span className="font-bold">SOMOS Civic Lab</span>
              </div>
              <p className="font-serif text-sm text-muted-foreground">
                Democratizing AI governance through public participation
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Platform</h4>
              <ul className="space-y-2 font-serif text-sm text-muted-foreground">
                <li><Link href="/exercises" className="transition-colors hover:text-foreground">Exercises</Link></li>
                <li><Link href="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link></li>
                <li><Link href="/about" className="transition-colors hover:text-foreground">About</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Resources</h4>
              <ul className="space-y-2 font-serif text-sm text-muted-foreground">
                <li><Link href="/docs" className="transition-colors hover:text-foreground">Documentation</Link></li>
                <li><Link href="/guides" className="transition-colors hover:text-foreground">Guides</Link></li>
                <li><Link href="/faq" className="transition-colors hover:text-foreground">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Legal</h4>
              <ul className="space-y-2 font-serif text-sm text-muted-foreground">
                <li><Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link></li>
                <li><Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link></li>
                <li><Link href="/contact" className="transition-colors hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-border pt-8 text-center font-serif text-sm text-muted-foreground">
            <p>&copy; 2026 SOMOS Civic Lab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
