import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { Shield, Users, AlertTriangle, BarChart3, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            <span className="text-muted-foreground">Public Beta Now Live</span>
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance md:text-6xl lg:text-7xl">
            SOMOS Civic Lab
          </h1>
          
          <p className="mb-8 text-xl text-muted-foreground text-balance md:text-2xl">
            Democratizing AI governance through structured public participation in red teaming exercises
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
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
      </section>

      {/* Benefits Section */}
      <section id="learn-more" className="border-t border-border bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Why Participate in AI Red Teaming?
            </h2>
            <p className="text-lg text-muted-foreground text-balance">
              Join a community of civic-minded individuals helping to identify and mitigate AI risks before they impact society
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Blind Model Testing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Test AI models without knowing their identity to ensure unbiased, objective safety assessments
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Community Participation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Collaborate with diverse participants to surface risks that automated testing might miss
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Identify AI Risks</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Flag harmful content, misinformation, bias, and other safety concerns through structured exercises
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Comprehensive Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Contribute to detailed reports that help improve AI safety standards and governance policies
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground text-balance">
              Participate in structured red teaming exercises designed by experts
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 md:gap-12">
              <div className="flex gap-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">Choose an Exercise</h3>
                  <p className="text-muted-foreground">
                    Browse active exercises covering topics like election integrity, bias detection, climate information, and public services
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">Test AI Models Blindly</h3>
                  <p className="text-muted-foreground">
                    Interact with anonymized AI models and follow structured testing guidelines to identify potential issues
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">Flag Harms</h3>
                  <p className="text-muted-foreground">
                    Capture findings including harmful content, misinformation, bias, or other concerns with detailed annotations and severity ratings
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  4
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">Contribute to AI Safety</h3>
                  <p className="text-muted-foreground">
                    Your findings contribute to comprehensive reports that inform AI safety standards and policy decisions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Ready to Make AI Safer?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground text-balance">
              Join thousands of participants helping to build trustworthy AI systems through civic engagement
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/register">
                  Sign Up & Start Testing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/exercises">View Active Exercises</Link>
              </Button>
            </div>
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
              <p className="text-sm text-muted-foreground">
                Democratizing AI governance through public participation
              </p>
            </div>
            
            <div>
              <h4 className="mb-4 font-semibold">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/exercises" className="hover:text-foreground transition-colors">Exercises</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4 font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/guides" className="hover:text-foreground transition-colors">Guides</Link></li>
                <li><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4 font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 SOMOS Civic Lab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
