"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { Table } from '../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '../components/ui/dialog'
import { useToast } from '../components/ui/use-toast'
import { Trash2, FileSpreadsheet } from 'lucide-react'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [tables, setTables] = useState([])
  const [newTableName, setNewTableName] = useState('')
  const [googleSheetUrl, setGoogleSheetUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [tableToDelete, setTableToDelete] = useState(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      const userData = JSON.parse(localStorage.getItem('user'))
      setUser(userData)
      setIsAuthenticated(true)
      fetchTables()
    }
  }, [])

  const fetchTables = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tables`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTables(data)
      } else if (response.status === 401) {
        handleLogout()
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch tables')
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch tables",
        variant: "destructive",
      })
    }
  }

  const handleCreateTable = async () => {
    try {
      setIsLoading(true)

      // Validate inputs
      if (!newTableName.trim()) {
        toast({
          title: "Error",
          description: "Please enter a table name",
          variant: "destructive",
        })
        return
      }

      if (!googleSheetUrl.trim()) {
        toast({
          title: "Error",
          description: "Please enter a Google Sheet URL",
          variant: "destructive",
        })
        return
      }

      // Validate Google Sheets URL format
      if (!googleSheetUrl.includes('docs.google.com/spreadsheets/d/')) {
        toast({
          title: "Error",
          description: "Please enter a valid Google Sheets URL",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newTableName.trim(),
          googleSheetUrl: googleSheetUrl.trim()
        }),
      })

      if (response.ok) {
        const newTable = await response.json()
        setTables([...tables, newTable])
        setNewTableName('')
        setGoogleSheetUrl('')
        toast({
          title: "Success",
          description: "Table created successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create table')
      }
    } catch (error) {
      console.error('Error creating table:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create table",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTable = async (tableId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tables/${tableId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setTables(tables.filter(table => table._id !== tableId))
        toast({
          title: "Success",
          description: "Table deleted successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete table')
      }
    } catch (error) {
      console.error('Error deleting table:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete table",
        variant: "destructive",
      })
    } finally {
      setTableToDelete(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
    setTables([])
    router.push('/login')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[400px] p-6">
          <h1 className="text-2xl font-bold mb-4">Welcome to Revoe Table Fetch</h1>
          <p className="mb-4">Please log in to continue</p>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Tables</h1>
        <div className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Create Table</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Table</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Table Name"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                />
                <Input
                  placeholder="Google Sheet URL"
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                />
                <Button 
                  onClick={handleCreateTable}
                  disabled={isLoading || !newTableName || !googleSheetUrl}
                >
                  {isLoading ? 'Creating...' : 'Create Table'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </div>

      <div className="grid gap-6">
        {tables.map((table) => (
          <Card key={table._id} className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{table.name}</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(table.googleSheetUrl, '_blank')}
                  className="h-8 w-8"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
                <Dialog open={tableToDelete === table._id} onOpenChange={(open) => !open && setTableToDelete(null)}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setTableToDelete(table._id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Table</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete the table "{table.name}"? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setTableToDelete(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteTable(table._id)}
                      >
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    {table.columns.map((column) => (
                      <th key={column} className="px-4 py-2 text-left">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.data.map((row, index) => (
                    <tr key={index}>
                      {table.columns.map((column) => (
                        <td key={column} className="px-4 py-2">
                          {row[column]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 