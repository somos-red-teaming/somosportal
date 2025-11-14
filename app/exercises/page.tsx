import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/header'
import { Users, Calendar, TrendingUp, Shield, Sprout, School, Vote } from 'lucide-react'
import Link from 'next/link'

const exercises = [
  {
    id: 'election-integrity',
    title: 'Election Information Integrity',
    description: 'Test AI models for accuracy and bias in election-related information and voting procedures',
    participants: 342,
    deadline: '2025-12-15',
    status: 'Active',
    difficulty: 'Intermediate',
    tags: ['Democracy', 'Politics', 'Misinformation'],
    icon: Vote,
    color: 'bg-blue-500'
  },
  {
    id: 'bias-education',
    title: 'Bias Detection in Educational Content',
    description: 'Identify bias and stereotypes in AI-generated educational materials and learning resources',
    participants: 218,
    deadline: '2025-11-30',
    status: 'Active',
    difficulty: 'Beginner',
    tags: ['Education', 'Bias', 'Equity'],
    icon: School,
    color: 'bg-purple-500'
  },
  {
    id: 'climate-integrity',
    title: 'Climate Information Integrity',
    description: 'Evaluate AI models for accuracy in climate science information and policy recommendations',
    participants: 189,
    deadline: '2025-12-20',
    status: 'Active',
    difficulty: 'Advanced',
    tags: ['Climate', 'Science', 'Policy'],
    icon: Sprout,
    color: 'bg-green-500'
  },
  {
    id: 'public-services',
    title: 'Municipal Public Services Chatbot Testing',
    description: 'Test chatbots designed to help citizens navigate local government services and resources',
    participants: 156,
    deadline: '2025-12-01',
    status: 'Starting Soon',
    difficulty: 'Beginner',
    tags: ['Public Services', 'Government', 'Access'],
    icon: Shield,
    color: 'bg-orange-500'
  }
]

export default function ExercisesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">Active Exercises</h1>
          <p className="text-lg text-muted-foreground text-balance max-w-3xl">
            Choose from our current red teaming exercises. Each exercise focuses on a specific domain and includes structured testing guidelines.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <Button variant="default" size="sm">All Exercises</Button>
          <Button variant="outline" size="sm">Democracy</Button>
          <Button variant="outline" size="sm">Education</Button>
          <Button variant="outline" size="sm">Climate</Button>
          <Button variant="outline" size="sm">Public Services</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {exercises.map((exercise) => {
            const Icon = exercise.icon
            return (
              <Card key={exercise.id} className="flex flex-col">
                <CardHeader>
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${exercise.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant={exercise.status === 'Active' ? 'default' : 'secondary'}>
                      {exercise.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{exercise.title}</CardTitle>
                  <CardDescription className="text-base">
                    {exercise.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {exercise.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{exercise.participants} participants</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Deadline: {new Date(exercise.deadline).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>Difficulty: {exercise.difficulty}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href={`/exercise/${exercise.id}`}>
                      {exercise.status === 'Active' ? 'Start Testing' : 'View Details'}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/exercise/${exercise.id}/guidelines`}>Guidelines</Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        <div className="mt-12 rounded-lg border border-border bg-muted/50 p-8 text-center">
          <h2 className="mb-2 text-2xl font-bold">Don't see what you're looking for?</h2>
          <p className="mb-4 text-muted-foreground">
            Suggest a new exercise topic or domain for the community to explore
          </p>
          <Button variant="outline">Suggest an Exercise</Button>
        </div>
      </div>
    </div>
  )
}
