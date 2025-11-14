'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/header'
import { Play, Square, Users, Flag, TrendingUp, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

const recentSessions = [
  { id: 1, exercise: 'Election Integrity', duration: '45m', flags: 3, timestamp: '2 hours ago' },
  { id: 2, exercise: 'Bias Detection', duration: '32m', flags: 5, timestamp: '5 hours ago' },
  { id: 3, exercise: 'Climate Info', duration: '28m', flags: 2, timestamp: '1 day ago' }
]

const activeParticipants = [
  { id: 1, name: 'Alice Chen', initials: 'AC', status: 'testing', exercise: 'Election Integrity' },
  { id: 2, name: 'Bob Martinez', initials: 'BM', status: 'flagging', exercise: 'Bias Detection' },
  { id: 3, name: 'Carol Davis', initials: 'CD', status: 'testing', exercise: 'Climate Info' },
  { id: 4, name: 'David Kim', initials: 'DK', status: 'reviewing', exercise: 'Public Services' }
]

export default function DashboardPage() {
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [sessionProgress, setSessionProgress] = useState(0)

  const handleStartSession = () => {
    setIsSessionActive(true)
    // Simulate progress
    const interval = setInterval(() => {
      setSessionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 1000)
  }

  const handleStopSession = () => {
    setIsSessionActive(false)
    setSessionProgress(0)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Monitor testing activity and manage sessions</p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,847</div>
              <p className="text-xs text-muted-foreground">+12% from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">342</div>
              <p className="text-xs text-muted-foreground">Testing right now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Flagged Issues</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18,392</div>
              <p className="text-xs text-muted-foreground">+8% from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Session Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">38m</div>
              <p className="text-xs text-muted-foreground">Per testing session</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Section - Session Control */}
          <div className="lg:col-span-8">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Session Control</CardTitle>
                <CardDescription>Start or stop your testing session</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isSessionActive ? 'bg-green-500' : 'bg-muted'}`}>
                        {isSessionActive ? (
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        ) : (
                          <Square className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {isSessionActive ? 'Session Active' : 'No Active Session'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {isSessionActive ? 'Testing in progress' : 'Start a session to begin testing'}
                        </div>
                      </div>
                    </div>
                    {isSessionActive ? (
                      <Button variant="destructive" onClick={handleStopSession}>
                        <Square className="mr-2 h-4 w-4" />
                        Stop Session
                      </Button>
                    ) : (
                      <Button onClick={handleStartSession}>
                        <Play className="mr-2 h-4 w-4" />
                        Start Session
                      </Button>
                    )}
                  </div>

                  {isSessionActive && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{sessionProgress}%</span>
                      </div>
                      <Progress value={sessionProgress} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
                <TabsTrigger value="flags">Flags</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Testing Activity</CardTitle>
                    <CardDescription>Your recent testing contributions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Tests Completed</div>
                          <div className="text-2xl font-bold">47</div>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Flags Submitted</div>
                          <div className="text-2xl font-bold">23</div>
                        </div>
                        <Flag className="h-8 w-8 text-orange-500" />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Issues Verified</div>
                          <div className="text-2xl font-bold">15</div>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sessions" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Sessions</CardTitle>
                    <CardDescription>Your testing history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                          <div>
                            <div className="font-medium">{session.exercise}</div>
                            <div className="text-sm text-muted-foreground">{session.timestamp}</div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{session.duration}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Flag className="h-4 w-4 text-muted-foreground" />
                              <span>{session.flags} flags</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="flags" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Flag Summary</CardTitle>
                    <CardDescription>Issues reported by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Misinformation</span>
                          <span className="font-medium">8</span>
                        </div>
                        <Progress value={35} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Bias/Discrimination</span>
                          <span className="font-medium">6</span>
                        </div>
                        <Progress value={26} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Factual Error</span>
                          <span className="font-medium">5</span>
                        </div>
                        <Progress value={22} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Harmful Content</span>
                          <span className="font-medium">4</span>
                        </div>
                        <Progress value={17} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Collaboration */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Participants</CardTitle>
                <CardDescription>Currently testing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeParticipants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {participant.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="text-sm font-medium leading-none">{participant.name}</div>
                        <div className="text-xs text-muted-foreground">{participant.exercise}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {participant.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Play className="mr-2 h-4 w-4" />
                  Start New Test
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Flag className="mr-2 h-4 w-4" />
                  Review Flags
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  View All Participants
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
