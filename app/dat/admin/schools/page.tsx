"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Globe,
  Building2,
  Search,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/app/dat/utils/supabaseClient";

const ITEMS_PER_PAGE = 8;

interface School {
  id: string;
  school_name: string;
  contact_name: string;
  website_address?: string;
  area: string;
  city: string;
  payment_required: boolean;
}

export default function ApprovedSchoolsList() {
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const buttonClasses = "border-rose-200 hover:bg-rose-50";
  const iconClasses = "h-5 w-5 mr-2 text-rose-600";

  useEffect(() => {
    const fetchSchools = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("dat_school_details")
          .select("*")
          .eq("status", "approved")
          .order("school_name");

        if (fetchError) throw fetchError;
        if (data) {
          setSchools(data);
          setFilteredSchools(data);
          setTotalPages(Math.ceil(data.length / ITEMS_PER_PAGE));
        }
      } catch (err) {
        console.error("Error fetching schools:", err);
        toast.error("Failed to fetch schools");
      }
      setLoading(false);
    };
    fetchSchools();
  }, []);

  useEffect(() => {
    const filtered = schools.filter(
      (school) =>
        school.school_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.area.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSchools(filtered);
    setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
    setCurrentPage(1);
  }, [searchQuery, schools]);

  const getCurrentPageSchools = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSchools.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const handlePaymentToggle = async (
    schoolId: string,
    paymentRequired: boolean,
    schoolName: string
  ) => {
    try {
      const { error: updateError } = await supabase
        .from("dat_school_details")
        .update({ payment_required: paymentRequired })
        .eq("id", schoolId);

      if (updateError) {
        toast.error("Failed to update payment setting");
        return false;
      }

      setSchools((prevSchools) =>
        prevSchools.map((school) =>
          school.id === schoolId
            ? { ...school, payment_required: paymentRequired }
            : school
        )
      );

      toast.success(
        paymentRequired
          ? `Registration fee is now mandatory for ${schoolName}`
          : `Registration is now free for ${schoolName}`
      );

      return true;
    } catch (err) {
      console.error("Toggle error:", err);
      toast.error("An unexpected error occurred");
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
        <div className="container mx-auto p-6">
          <div className="flex items-center mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-rose-600">
                Approved Schools
              </h1>
              <p className="text-gray-600">
                View and manage all approved schools
              </p>
            </div>
          </div>
          <Card className="shadow-md rounded-xl">
            <CardContent className="p-6">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-rose-600">
                Approved Schools
              </h1>
              <p className="text-gray-600">
                View and manage all approved schools
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search schools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {getCurrentPageSchools().map((school) => (
            <Card
              key={school.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-rose-100"
            >
              <CardContent className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {school.school_name}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600 text-sm">
                    <Users className={iconClasses} />
                    <span className="truncate">{school.contact_name}</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Globe className={iconClasses} />
                    <span className="truncate">
                      {school.website_address || "No website provided"}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Building2 className={iconClasses} />
                    <span className="truncate">
                      {school.area}, {school.city}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t mt-2">
                    <label
                      htmlFor={`payment-${school.id}`}
                      className="text-sm text-gray-600"
                    >
                      Registration Fee Required
                    </label>
                    <Switch
                      id={`payment-${school.id}`}
                      checked={school.payment_required}
                      onCheckedChange={async (checked) => {
                        const success = await handlePaymentToggle(
                          school.id,
                          checked,
                          school.school_name
                        );
                        if (!success) {
                          // Only revert on failure
                          const switchElement = document.getElementById(
                            `payment-${school.id}`
                          ) as HTMLButtonElement;
                          if (switchElement) {
                            switchElement.click();
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSchools.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No schools found matching your search.
          </div>
        )}

        {filteredSchools.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={buttonClasses}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={buttonClasses}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
