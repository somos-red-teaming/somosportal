'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Pencil, Trash2, Package, Tag } from 'lucide-react'
import Link from 'next/link'

interface FlagPackage {
  id: string
  name: string
  description: string | null
  categories?: FlagCategory[]
}

interface FlagCategory {
  id: string
  package_id: string
  value: string
  label: string
  sort_order: number
}

export default function FlagPackagesPage() {
  const [packages, setPackages] = useState<FlagPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<FlagPackage | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([])
  const [newCategory, setNewCategory] = useState({ value: '', label: '' })

  useEffect(() => { fetchPackages() }, [])

  const fetchPackages = async () => {
    const supabase = createClient()
    const { data: pkgs } = await supabase.from('flag_packages').select('*').order('name')
    const { data: cats } = await supabase.from('flag_categories').select('*').order('sort_order')
    
    const packagesWithCats = (pkgs || []).map(p => ({
      ...p,
      categories: (cats || []).filter(c => c.package_id === p.id)
    }))
    setPackages(packagesWithCats)
    setLoading(false)
  }

  const openNew = () => {
    setEditingPackage(null)
    setForm({ name: '', description: '' })
    setCategories([])
    setDialogOpen(true)
  }

  const openEdit = (pkg: FlagPackage) => {
    setEditingPackage(pkg)
    setForm({ name: pkg.name, description: pkg.description || '' })
    setCategories(pkg.categories?.map(c => ({ value: c.value, label: c.label })) || [])
    setDialogOpen(true)
  }

  const addCategory = () => {
    if (newCategory.value && newCategory.label) {
      setCategories([...categories, { ...newCategory }])
      setNewCategory({ value: '', label: '' })
    }
  }

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!form.name || categories.length === 0) return

    const supabase = createClient()
    if (editingPackage) {
      await supabase.from('flag_packages').update({ name: form.name, description: form.description }).eq('id', editingPackage.id)
      await supabase.from('flag_categories').delete().eq('package_id', editingPackage.id)
      await supabase.from('flag_categories').insert(
        categories.map((c, i) => ({ package_id: editingPackage.id, value: c.value, label: c.label, sort_order: i }))
      )
    } else {
      const { data: newPkg } = await supabase.from('flag_packages').insert({ name: form.name, description: form.description }).select().single()
      if (newPkg) {
        await supabase.from('flag_categories').insert(
          categories.map((c, i) => ({ package_id: newPkg.id, value: c.value, label: c.label, sort_order: i }))
        )
      }
    }

    setDialogOpen(false)
    fetchPackages()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package? Exercises using it will fall back to default categories.')) return
    const supabase = createClient()
    await supabase.from('flag_packages').delete().eq('id', id)
    fetchPackages()
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link href="/admin"><ArrowLeft className="h-4 w-4 mr-2" />Back to Admin</Link>
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Package className="h-8 w-8" />
                  Flag Packages
                </h1>
                <p className="text-muted-foreground mt-1">Create custom flag category packages for different exercise types</p>
              </div>
              <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New Package</Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {packages.map(pkg => (
                <Card key={pkg.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(pkg)}><Pencil className="h-4 w-4" /></Button>
                        {pkg.id !== '00000000-0000-0000-0000-000000000001' && (
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(pkg.id)}><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </div>
                    {pkg.description && <p className="text-sm text-muted-foreground">{pkg.description}</p>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {pkg.categories?.map(c => (
                        <Badge key={c.id} variant="secondary" className="text-xs">{c.label}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingPackage ? 'Edit Package' : 'New Package'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Package Name *</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Health Ministry" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
                </div>
                <div>
                  <Label>Categories *</Label>
                  <div className="flex gap-2 mt-2">
                    <Input placeholder="Category name (e.g., Data Privacy)" value={newCategory.label} onChange={e => setNewCategory({ value: e.target.value.toLowerCase().replace(/\s+/g, '_'), label: e.target.value })} className="flex-1" />
                    <Button onClick={addCategory} size="sm"><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="mt-3 space-y-1">
                    {categories.map((c, i) => (
                      <div key={i} className="flex items-center justify-between bg-muted px-3 py-1 rounded text-sm">
                        <span><Tag className="h-3 w-3 inline mr-2" />{c.label} <span className="text-muted-foreground">({c.value})</span></span>
                        <Button size="sm" variant="ghost" onClick={() => removeCategory(i)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                  </div>
                  {categories.length === 0 && <p className="text-sm text-muted-foreground mt-2">Add at least one category</p>}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={!form.name || categories.length === 0}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminRoute>
  )
}
