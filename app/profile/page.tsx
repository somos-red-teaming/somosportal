'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Header } from '@/components/header'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { User, Save, AlertCircle, Mail } from 'lucide-react'

interface UserProfile {
  // Users table
  full_name: string
  username: string
  bio: string
  expertise_areas: string[]
  avatar_url: string
  
  // User profiles table
  organization: string
  job_title: string
  location: string
  website_url: string
  linkedin_url: string
  twitter_handle: string
  preferred_language: string
  notification_preferences: {
    email: boolean
    in_app: boolean
  }
  privacy_settings: {
    profile_public: boolean
    stats_public: boolean
  }
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    username: '',
    bio: '',
    expertise_areas: [],
    avatar_url: '',
    organization: '',
    job_title: '',
    location: '',
    website_url: '',
    linkedin_url: '',
    twitter_handle: '',
    preferred_language: 'en',
    notification_preferences: { email: true, in_app: true },
    privacy_settings: { profile_public: true, stats_public: false }
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [expertiseInput, setExpertiseInput] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Load user profile data
  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      
      console.log('Loading profile for user:', user?.id)
      
      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user?.id)
        .single()

      console.log('User data:', userData, 'User error:', userError)

      if (userError && userError.code !== 'PGRST116') {
        throw userError
      }

      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userData?.id)
        .single()

      console.log('Profile data:', profileData, 'Profile error:', profileError)

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      // Merge data
      setProfile({
        full_name: userData?.full_name || user?.user_metadata?.full_name || '',
        username: userData?.username || '',
        bio: userData?.bio || '',
        expertise_areas: userData?.expertise_areas || [],
        avatar_url: userData?.avatar_url || '',
        organization: profileData?.organization || '',
        job_title: profileData?.job_title || '',
        location: profileData?.location || '',
        website_url: profileData?.website_url || '',
        linkedin_url: profileData?.linkedin_url || '',
        twitter_handle: profileData?.twitter_handle || '',
        preferred_language: profileData?.preferred_language || 'en',
        notification_preferences: profileData?.notification_preferences || { email: true, in_app: true },
        privacy_settings: profileData?.privacy_settings || { profile_public: true, stats_public: false }
      })

      setExpertiseInput(userData?.expertise_areas?.join(', ') || '')
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile data')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    try {
      setError(null)
      
      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setShowPasswordForm(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      setError('Failed to update password')
    }
  }

  const validateForm = () => {
    const errors: string[] = []

    if (!profile.full_name.trim()) {
      errors.push('Full name is required')
    }

    if (profile.username && !/^[a-zA-Z0-9_]{3,20}$/.test(profile.username)) {
      errors.push('Username must be 3-20 characters, letters, numbers, and underscores only')
    }

    if (profile.website_url && !isValidUrl(profile.website_url)) {
      errors.push('Website URL must be a valid URL')
    }

    if (profile.linkedin_url && !isValidUrl(profile.linkedin_url)) {
      errors.push('LinkedIn URL must be a valid URL')
    }

    if (profile.twitter_handle && !/^@?[a-zA-Z0-9_]{1,15}$/.test(profile.twitter_handle)) {
      errors.push('Twitter handle must be valid (1-15 characters)')
    }

    return errors
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(false)

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '))
      return
    }

    setIsSaving(true)

    try {
      // Get or create user record
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single()

      if (userError && userError.code === 'PGRST116') {
        // Create user record
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            auth_user_id: user?.id,
            email: user?.email,
            full_name: profile.full_name,
            username: profile.username || null,
            bio: profile.bio || null,
            expertise_areas: expertiseInput ? expertiseInput.split(',').map(s => s.trim()) : [],
            avatar_url: profile.avatar_url || null
          })
          .select('id')
          .single()

        if (createError) throw createError
        userData = newUser
      } else if (userError) {
        throw userError
      } else {
        // Update user record
        const { error: updateError } = await supabase
          .from('users')
          .update({
            full_name: profile.full_name,
            username: profile.username || null,
            bio: profile.bio || null,
            expertise_areas: expertiseInput ? expertiseInput.split(',').map(s => s.trim()) : [],
            avatar_url: profile.avatar_url || null,
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', user?.id)

        if (updateError) throw updateError
      }

      // Update existing profile record
      console.log('Updating profile data:', {
        user_id: userData!.id,
        organization: profile.organization,
        job_title: profile.job_title,
        location: profile.location,
        preferred_language: profile.preferred_language
      })

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          organization: profile.organization || null,
          job_title: profile.job_title || null,
          location: profile.location || null,
          website_url: profile.website_url || null,
          linkedin_url: profile.linkedin_url || null,
          twitter_handle: profile.twitter_handle || null,
          preferred_language: profile.preferred_language,
          notification_preferences: profile.notification_preferences,
          privacy_settings: profile.privacy_settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userData!.id)

      if (profileError) {
        console.error('Profile save error:', JSON.stringify(profileError, null, 2))
        throw profileError
      }

      console.log('Profile updated successfully')

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
      console.error('Error details:', JSON.stringify(err, null, 2))
      if (err && typeof err === 'object' && 'message' in err) {
        setError(`Failed to save profile: ${err.message}`)
      } else {
        setError('Failed to save profile. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <User className="h-8 w-8" />
              Profile Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your account information and preferences
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
              <p className="text-sm text-green-600">Profile updated successfully!</p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your public profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profile.username}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    placeholder="unique_username"
                  />
                  <p className="text-xs text-muted-foreground">
                    3-20 characters, letters, numbers, and underscores only
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expertise">Areas of Expertise</Label>
                  <Input
                    id="expertise"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    placeholder="AI, Machine Learning, Ethics, etc."
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate multiple areas with commas
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email address
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  {!showPasswordForm ? (
                    <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                      <span className="text-sm text-muted-foreground">••••••••</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPasswordForm(true)}
                      >
                        Change Password
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        type="password"
                        placeholder="Current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                      <Input
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handlePasswordChange}
                          disabled={isSaving}
                          size="sm"
                        >
                          Update Password
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowPasswordForm(false)
                            setCurrentPassword('')
                            setNewPassword('')
                            setConfirmPassword('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
                <CardDescription>Your work and organization details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    value={profile.organization}
                    onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                    placeholder="Your company or organization"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    value={profile.job_title}
                    onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                    placeholder="Your role or position"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred_language">Preferred Language</Label>
                  <Select
                    value={profile.preferred_language}
                    onValueChange={(value) => setProfile({ ...profile, preferred_language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Notifications</CardTitle>
                <CardDescription>Control your privacy and notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Notifications</h4>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email_notifications">Email Notifications</Label>
                    <Switch
                      id="email_notifications"
                      checked={profile.notification_preferences.email}
                      onCheckedChange={(checked) =>
                        setProfile({
                          ...profile,
                          notification_preferences: {
                            ...profile.notification_preferences,
                            email: checked
                          }
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="in_app_notifications">In-App Notifications</Label>
                    <Switch
                      id="in_app_notifications"
                      checked={profile.notification_preferences.in_app}
                      onCheckedChange={(checked) =>
                        setProfile({
                          ...profile,
                          notification_preferences: {
                            ...profile.notification_preferences,
                            in_app: checked
                          }
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Privacy</h4>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="profile_public">Public Profile</Label>
                    <Switch
                      id="profile_public"
                      checked={profile.privacy_settings.profile_public}
                      onCheckedChange={(checked) =>
                        setProfile({
                          ...profile,
                          privacy_settings: {
                            ...profile.privacy_settings,
                            profile_public: checked
                          }
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stats_public">Public Statistics</Label>
                    <Switch
                      id="stats_public"
                      checked={profile.privacy_settings.stats_public}
                      onCheckedChange={(checked) =>
                        setProfile({
                          ...profile,
                          privacy_settings: {
                            ...profile.privacy_settings,
                            stats_public: checked
                          }
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex justify-end items-center gap-4">
            {success && (
              <p className="text-sm text-green-600">Profile updated successfully!</p>
            )}
            <Button onClick={handleSave} disabled={isSaving} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
