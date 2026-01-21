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
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <span className="text-lg font-bold text-primary-foreground">S</span>
                </div>
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
            <p>© 2025 SOMOS Civic Lab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
