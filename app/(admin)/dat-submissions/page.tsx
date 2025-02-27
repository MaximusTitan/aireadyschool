'use client'

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  Loader2,
  RefreshCw
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SchoolRegistration = {
  id: string
  contact_person: string
  designation: string
  email: string
  phone: string
  school_name: string
  website: string
  education_board: string
  area: string
  city: string
  created_at: string
}

type SortConfig = {
  key: keyof SchoolRegistration | null
  direction: 'asc' | 'desc'
}

export default function SchoolRegistrationsPage() {
  const [registrations, setRegistrations] = useState<SchoolRegistration[]>([])
  const [filteredRegistrations, setFilteredRegistrations] = useState<SchoolRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' })
  const [educationBoardFilter, setEducationBoardFilter] = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState<string | null>(null)
  const [uniqueBoards, setUniqueBoards] = useState<string[]>([])
  const [uniqueCities, setUniqueCities] = useState<string[]>([])
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  const supabase = createClientComponentClient()

  const fetchRegistrations = async () => {
    try {
      setRefreshing(true)
      const { data, error } = await supabase
        .from('school_registrations')
        .select('*')
      
      if (error) {
        throw error
      }
      
      const registrationsData = data || []
      setRegistrations(registrationsData)
      
      // Extract unique education boards and cities for filters
      const boards = Array.from(new Set(registrationsData.map(r => r.education_board)))
      const cities = Array.from(new Set(registrationsData.map(r => r.city)))
      setUniqueBoards(boards)
      setUniqueCities(cities)
      
      // Apply initial sorting
      sortData(registrationsData, sortConfig)
    } catch (error) {
      console.error('Error fetching school registrations:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRegistrations()
  }, [supabase])

  useEffect(() => {
    // Apply filters and search whenever dependencies change
    let result = [...registrations]
    
    // Apply education board filter
    if (educationBoardFilter) {
      result = result.filter(reg => reg.education_board === educationBoardFilter)
    }
    
    // Apply city filter
    if (cityFilter) {
      result = result.filter(reg => reg.city === cityFilter)
    }
    
    // Apply search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(reg => 
        reg.school_name.toLowerCase().includes(search) ||
        reg.contact_person.toLowerCase().includes(search) ||
        reg.email.toLowerCase().includes(search) ||
        reg.phone.includes(search)
      )
    }
    
    // Apply sorting
    sortData(result, sortConfig)
    
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [registrations, searchTerm, educationBoardFilter, cityFilter, sortConfig])

  const sortData = (data: SchoolRegistration[], config: SortConfig) => {
    if (!config.key) {
      setFilteredRegistrations(data)
      return
    }
    
    const sortedData = [...data].sort((a, b) => {
      if (a[config.key!] < b[config.key!]) {
        return config.direction === 'asc' ? -1 : 1
      }
      if (a[config.key!] > b[config.key!]) {
        return config.direction === 'asc' ? 1 : -1
      }
      return 0
    })
    
    setFilteredRegistrations(sortedData)
  }

  const handleSort = (key: keyof SchoolRegistration) => {
    let direction: 'asc' | 'desc' = 'asc'
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    
    setSortConfig({ key, direction })
  }

  const handleRefresh = () => {
    fetchRegistrations()
  }

  const handleResetFilters = () => {
    setSearchTerm("")
    setEducationBoardFilter(null)
    setCityFilter(null)
    setSortConfig({ key: 'created_at', direction: 'desc' })
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredRegistrations.slice(startIndex, startIndex + itemsPerPage)

  const renderSortIcon = (columnName: keyof SchoolRegistration) => {
    if (sortConfig.key !== columnName) {
      return null
    }
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 inline ml-1" /> : <ChevronDown className="w-4 h-4 inline ml-1" />
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading school registrations...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
            <div>
              <CardTitle>School Registration History</CardTitle>
              <CardDescription>
                Showing {filteredRegistrations.length} of {registrations.length} total registrations
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select 
              value={educationBoardFilter || "all"}  // Changed from empty string to "all"
              onValueChange={(value) => setEducationBoardFilter(value === "all" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Board" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Boards</SelectItem>
                {uniqueBoards.map(board => (
                  <SelectItem key={board} value={board}>{board}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={cityFilter || "all"}  // Changed from empty string to "all"
              onValueChange={(value) => setCityFilter(value === "all" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>  
                {uniqueCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={handleResetFilters}
              disabled={!searchTerm && !educationBoardFilter && !cityFilter}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('school_name')}
                  >
                    School Name {renderSortIcon('school_name')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('contact_person')}
                  >
                    Contact Person {renderSortIcon('contact_person')}
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('city')}
                  >
                    City {renderSortIcon('city')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('education_board')}
                  >
                    Education Board {renderSortIcon('education_board')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('created_at')}
                  >
                    Registered On {renderSortIcon('created_at')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">{registration.school_name}</TableCell>
                      <TableCell>{registration.contact_person}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{registration.email}</TableCell>
                      <TableCell>{registration.phone}</TableCell>
                      <TableCell>{registration.city}</TableCell>
                      <TableCell>{registration.education_board}</TableCell>
                      <TableCell>{format(new Date(registration.created_at), 'PPP')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No registration records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6}>Total Registrations</TableCell>
                  <TableCell>{filteredRegistrations.length}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }} 
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(pageNum);
                          }}
                          isActive={currentPage === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }} 
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
